import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Job, emitJobEvent, ClientToolResult } from './jobStore';
import { isServerTool, executeServerTool } from './serverTools';
import { getToolsForPage } from './tools';
import { buildSystemPrompt } from './systemPrompt';
import { runGenerationFlow } from './orchestrator';
import { AIMessage } from './types';

const apiKey = process.env.DEEPSEEK_API_KEY || '';
const isOpenRouter = apiKey.startsWith('sk-or-');
const baseURL = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com';
const model = isOpenRouter ? 'deepseek/deepseek-v4-flash' : 'deepseek-v4-flash';

const openai = new OpenAI({ baseURL, apiKey });

const TOKEN_BUDGET = 400_000;
const CLIENT_TOOL_TIMEOUT_MS = 5 * 60 * 1000;

function parseToolArgs(raw: string | object): Record<string, any> {
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, any>;
  try { return JSON.parse(raw as string); } catch { return {}; }
}

export async function runJob(job: Job): Promise<void> {
  try {
    job.status = 'running';

    while (true) {
      const systemPrompt = buildSystemPrompt(null, job.currentPage);
      const tools = getToolsForPage(job.currentPage);

const openaiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...job.apiMessages.map((msg) => {
      const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
      const formatted: any = {
        role: msg.role,
        content: hasToolCalls ? null : (msg.content || ''),
      };
      if (msg.tool_calls) {
        formatted.tool_calls = msg.tool_calls.map((tc: any) => ({
          id: tc.id,
          type: tc.type || 'function',
          function: {
            name: tc.function.name,
            arguments: typeof tc.function.arguments === 'object'
              ? JSON.stringify(tc.function.arguments)
              : tc.function.arguments,
          },
        }));
      }
      if (msg.reasoning_content) formatted.reasoning_content = msg.reasoning_content;
      if (msg.tool_call_id) formatted.tool_call_id = msg.tool_call_id;
      return formatted;
    }),
  ];

      const completionOptions: any = { model, messages: openaiMessages, stream: false };
      if (!isOpenRouter && !(tools && tools.length > 0)) {
        completionOptions.thinking = { type: 'enabled' };
        completionOptions.reasoning_effort = 'high';
      }
      if (tools && tools.length > 0) completionOptions.tools = tools;

      console.log(`[job:${job.id}] Calling LLM (${job.apiMessages.length} messages so far)`);
      const completion = await openai.chat.completions.create(completionOptions);

      if (!completion.choices?.length) throw new Error('LLM returned no choices');

      const message = completion.choices[0].message;

      // Token budget
      if (completion.usage) {
        job.cumulativeTokens += completion.usage.total_tokens;
        if (job.cumulativeTokens >= TOKEN_BUDGET) {
          const warningMsg: AIMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `⚠️ Token budget reached (${job.cumulativeTokens.toLocaleString()} / ${TOKEN_BUDGET.toLocaleString()} tokens). The task stopped to avoid runaway usage. Send a new message to continue.`,
            timestamp: Date.now(),
          };
          job.chatMessages.push(warningMsg);
          emitJobEvent(job, 'chat_message', warningMsg);
          break;
        }
      }

      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCalls = message.tool_calls.map((tc: any) => ({
          id: tc.id || uuidv4(),
          type: 'function' as const,
          function: { name: tc.function.name, arguments: parseToolArgs(tc.function.arguments) },
        }));

        // Emit assistant turn (for chat UI)
        const assistantMsg: AIMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: message.content || '',
          ...((message as any).reasoning_content ? { reasoning_content: (message as any).reasoning_content } : {}),
          tool_calls: toolCalls,
          timestamp: Date.now(),
        };
        job.chatMessages.push(assistantMsg);
        emitJobEvent(job, 'chat_message', assistantMsg);

        job.apiMessages.push({
          role: 'assistant',
          content: null,
          ...((message as any).reasoning_content ? { reasoning_content: (message as any).reasoning_content } : {}),
          tool_calls: toolCalls,
        });

        const serverToolCalls = toolCalls.filter(tc => isServerTool(tc.function.name, job.isGuest));
        const clientToolCalls = toolCalls.filter(tc => !isServerTool(tc.function.name, job.isGuest));

        const allResults: ClientToolResult[] = [];

        // Execute server-side tools inline
        for (const tc of serverToolCalls) {
          try {
            const result = await executeServerTool(tc.function.name, tc.function.arguments, job);
            allResults.push({ tool_call_id: tc.id, content: result });
            const toolMsg: AIMessage = {
              id: uuidv4(),
              role: 'tool',
              content: result,
              tool_call_id: tc.id,
              timestamp: Date.now(),
            };
            job.chatMessages.push(toolMsg);
            emitJobEvent(job, 'chat_message', toolMsg);
          } catch (e) {
            const errResult = JSON.stringify({ error: String(e) });
            allResults.push({ tool_call_id: tc.id, content: errResult });
            const toolMsg: AIMessage = {
              id: uuidv4(),
              role: 'tool',
              content: errResult,
              tool_call_id: tc.id,
              timestamp: Date.now(),
            };
            job.chatMessages.push(toolMsg);
            emitJobEvent(job, 'chat_message', toolMsg);
          }
        }

        // Request client-side tool execution via SSE
        if (clientToolCalls.length > 0) {
          job.status = 'waiting_for_client';
          job.pendingClientToolCalls = clientToolCalls;

          const clientResults = await new Promise<ClientToolResult[]>((resolve, reject) => {
            const timeout = setTimeout(() => {
              if (job.pendingClientResult) {
                job.pendingClientResult = null;
                job.pendingClientToolCalls = null;
                reject(new Error('Client tool execution timed out after 5 minutes'));
              }
            }, CLIENT_TOOL_TIMEOUT_MS);

            job.pendingClientResult = {
              resolve: (results) => { clearTimeout(timeout); resolve(results); },
              reject: (err) => { clearTimeout(timeout); reject(err); },
            };

            emitJobEvent(job, 'client_tool_calls', { tool_calls: clientToolCalls });
          });

          job.pendingClientToolCalls = null;
          job.status = 'running';

          // Tool result messages are added by the tool-result route handler
          // so they appear in chatMessages before we continue the loop.
          // We still need them in allResults for the API message history.
          allResults.push(...clientResults);
        }

        // Append tool results to API history
        for (const result of allResults) {
          job.apiMessages.push({
            role: 'tool',
            content: result.content,
            tool_call_id: result.tool_call_id,
          });
        }

      } else {
        // Final text response — no tool calls
        const finalMsg: AIMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: message.content || 'Done.',
          ...((message as any).reasoning_content ? { reasoning_content: (message as any).reasoning_content } : {}),
          timestamp: Date.now(),
        };
        job.chatMessages.push(finalMsg);
        emitJobEvent(job, 'chat_message', finalMsg);
        break;
      }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[job:${job.id}] Error:`, errMsg);
    job.status = 'error';
    job.error = errMsg;
    const errorMsg: AIMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: `Error: ${errMsg}`,
      timestamp: Date.now(),
    };
    job.chatMessages.push(errorMsg);
    emitJobEvent(job, 'chat_message', errorMsg);
    emitJobEvent(job, 'error', { message: errMsg });
    return;
  }

  job.status = 'done';
  emitJobEvent(job, 'done', {});
  console.log(`[job:${job.id}] Done. Total tokens: ${job.cumulativeTokens}`);
}

/** Run the multi-step generation flow (orchestrator mode). */
export async function runOrchestratedJob(job: Job): Promise<void> {
  try {
    await runGenerationFlow(job);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[job:${job.id}] Orchestrator error:`, errMsg);
    job.status = 'error';
    job.error = errMsg;
    emitJobEvent(job, 'error', { message: errMsg });
  }
}

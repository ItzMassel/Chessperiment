import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import { getToolsForPage } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';

const apiKey = process.env.DEEPSEEK_API_KEY || '';
const isOpenRouter = apiKey.startsWith('sk-or-');
const baseURL = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com';
const model = isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek-chat';

const openai = new OpenAI({
  baseURL,
  apiKey,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, projectState, currentPage } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(projectState, currentPage);

    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: any) => {
        const formattedMsg: any = {
          role: msg.role,
          content: msg.content || '',
        };
        if (msg.tool_calls) {
          formattedMsg.tool_calls = msg.tool_calls.map((tc: any) => ({
            id: tc.id,
            type: tc.type || 'function',
            function: {
              name: tc.function.name,
              arguments: typeof tc.function.arguments === 'object'
                ? JSON.stringify(tc.function.arguments)
                : tc.function.arguments
            }
          }));
        }
        if (msg.reasoning_content) {
          formattedMsg.reasoning_content = msg.reasoning_content;
        }
        if (msg.tool_call_id) {
          formattedMsg.tool_call_id = msg.tool_call_id;
        }
        return formattedMsg;
      })
    ];

    const tools = getToolsForPage(currentPage || 'default');

    const completionOptions: any = {
      model: model,
      messages: openaiMessages,
      stream: false,
    };

    if (!isOpenRouter) {
      // @ts-ignore - Deepseek specific parameters
      completionOptions.thinking = { type: "enabled" };
      // @ts-ignore
      completionOptions.reasoning_effort = "high";
    }

    if (tools && tools.length > 0) {
      completionOptions.tools = tools;
    }

    console.log(`Calling API with model: ${model} via ${isOpenRouter ? 'OpenRouter' : 'DeepSeek'}`);
    const completion = await openai.chat.completions.create(completionOptions);

    if (!completion.choices || completion.choices.length === 0) {
      console.error('DeepSeek API returned empty choices');
      return NextResponse.json(
        { error: 'Invalid response from DeepSeek API', details: 'No choices returned' },
        { status: 502 }
      );
    }

    const choice = completion.choices[0];
    const message = choice.message;

    let responseToolCalls: any = undefined;
    if (message.tool_calls && message.tool_calls.length > 0) {
      responseToolCalls = message.tool_calls.map((tc: any) => {
        let parsedArgs = tc.function.arguments;
        if (typeof parsedArgs === 'string') {
          try {
            parsedArgs = JSON.parse(parsedArgs);
          } catch (e) {
            console.error('Failed to parse tool call arguments:', tc.function.arguments, e);
          }
        }
        return {
          id: tc.id,
          type: tc.type || 'function',
          function: {
            name: tc.function.name,
            arguments: parsedArgs
          }
        };
      });
    }

    const responseBody = {
      message: {
        role: 'assistant',
        content: message.content || '',
        ...((message as any).reasoning_content ? { reasoning_content: (message as any).reasoning_content } : {}),
        ...(responseToolCalls ? { tool_calls: responseToolCalls } : {})
      },
      usage: completion.usage ?? null,
      done: true
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('AI chat route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getToolsForPage } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';
import { OllamaRequest, OllamaResponse } from '@/lib/ai/types';

// Ollama Cloud base URL. Override with OLLAMA_BASE_URL for self-hosted.
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com';
const OLLAMA_API_URL = `${OLLAMA_BASE_URL}/api/chat`;
// Cloud models use the "-cloud" suffix, e.g. "qwen3:32b-cloud".
// Override with OLLAMA_MODEL env var to use a different model.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:32b-cloud';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, projectState, currentPage } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(projectState, currentPage);

    const ollamaMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant' | 'tool',
        content: msg.content || '',
        ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {}),
        ...(msg.tool_call_id ? { tool_call_id: msg.tool_call_id } : {})
      }))
    ];

    const ollamaRequest: OllamaRequest = {
      model: OLLAMA_MODEL,
      messages: ollamaMessages,
      tools: getToolsForPage(currentPage || 'default'),
      stream: false
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = process.env.OLLAMA_API_KEY;
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(ollamaRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Ollama API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data: OllamaResponse = await response.json();

    return NextResponse.json({
      message: data.message,
      done: data.done
    });
  } catch (error) {
    console.error('AI chat route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getToolsForPage } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';
import { OllamaRequest, OllamaResponse } from '@/lib/ai/types';

const OLLAMA_API_URL = 'https://ollama.com/api/chat';
const OLLAMA_MODEL = 'qwen3:32b';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OLLAMA_API_KEY not configured' }, { status: 500 });
    }

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

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
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

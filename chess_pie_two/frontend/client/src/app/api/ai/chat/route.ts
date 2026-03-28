import { NextRequest, NextResponse } from 'next/server';
import { getToolsForPage } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';
import { OllamaRequest, OllamaResponse } from '@/lib/ai/types';

// Ollama API configuration. 
// Default to Ollama Cloud (api.ollama.com). 
// Use OLLAMA_BASE_URL env var to override for self-hosted or different cloud providers.
const rawBaseUrl = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com';
const OLLAMA_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

// Construct the full API URL. Ensure we don't double up on /api/ if the base includes it.
const OLLAMA_API_URL = OLLAMA_BASE_URL.includes('/api') 
  ? `${OLLAMA_BASE_URL}/chat` 
  : `${OLLAMA_BASE_URL}/api/chat`;

// Cloud models use the "-cloud" suffix for massive models (e.g. "qwen3-coder:480b-cloud").
// Standard models like "qwen3:32b" might not have the -cloud suffix unless specifically tagged.
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

    let responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = null;
    }

    if (!response.ok) {
      const errorDetails = responseData ? JSON.stringify(responseData, null, 2) : responseText;
      console.error('Ollama API error:', response.status, errorDetails);
      return NextResponse.json(
        { error: `Ollama API error: ${response.status}`, details: errorDetails },
        { status: response.status }
      );
    }

    if (!responseData) {
      console.error('Ollama API returned invalid JSON:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON response from AI API', details: responseText },
        { status: 502 }
      );
    }

    const data: OllamaResponse = responseData;

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

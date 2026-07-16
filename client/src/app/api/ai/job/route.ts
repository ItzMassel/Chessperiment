import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@/lib/ai/jobStore';
import { runJob } from '@/lib/ai/jobRunner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, projectId, userId, currentPage } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const isGuest = String(projectId).startsWith('guest-');

    // Split into API messages (for LLM) and identify the last user message for chat display
    const apiMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || '',
      ...(m.reasoning_content ? { reasoning_content: m.reasoning_content } : {}),
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    }));

    // chatMessages are passed from the client — they include the full display history
    // including the user's new message that was already added client-side.
    const chatMessages = (body.chatMessages || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content || '',
      timestamp: m.timestamp,
      ...(m.reasoning_content ? { reasoning_content: m.reasoning_content } : {}),
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    }));

    const job = createJob({
      projectId,
      userId: userId || '',
      isGuest,
      currentPage: currentPage || 'project-overview',
      initialApiMessages: apiMessages,
      initialChatMessages: chatMessages,
    });

    // Fire-and-forget: run the job in the background
    void runJob(job);

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error('POST /api/ai/job error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

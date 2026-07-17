import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@/lib/ai/jobStore';
import { runJob } from '@/lib/ai/jobRunner';
import { requireAuth, checkRateLimit } from '@/lib/ai/security';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!checkRateLimit(request, 15, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    const body = await request.json();
    const { messages, projectId, currentPage } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const isGuest = String(projectId).startsWith('guest-');

    const apiMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || '',
      ...(m.reasoning_content ? { reasoning_content: m.reasoning_content } : {}),
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    }));

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
      userId,
      isGuest,
      currentPage: currentPage || 'project-overview',
      initialApiMessages: apiMessages,
      initialChatMessages: chatMessages,
    });

    void runJob(job);

    return NextResponse.json({ jobId: job.id, secret: job.secret });
  } catch (error) {
    console.error('POST /api/ai/job error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

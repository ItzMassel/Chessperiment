import { NextRequest, NextResponse } from 'next/server';
import { validateJobSecret, emitJobEvent } from '@/lib/ai/jobStore';
import { requireAuth } from '@/lib/ai/security';
import { v4 as uuidv4 } from 'uuid';
import { AIMessage } from '@/lib/ai/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { jobId } = await params;
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || typeof secret !== 'string' || secret.length < 32) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const job = validateJobSecret(jobId, secret);
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!job.pendingClientResult) {
    return NextResponse.json({ error: 'No pending tool result expected' }, { status: 409 });
  }

  const body = await request.json();
  const results: { tool_call_id: string; content: string }[] = body.results;

  if (!Array.isArray(results)) {
    return NextResponse.json({ error: 'results array is required' }, { status: 400 });
  }

  for (const result of results) {
    const toolMsg: AIMessage = {
      id: uuidv4(),
      role: 'tool',
      content: result.content,
      tool_call_id: result.tool_call_id,
      timestamp: Date.now(),
    };
    job.chatMessages.push(toolMsg);
    emitJobEvent(job, 'chat_message', toolMsg);
  }

  const { resolve } = job.pendingClientResult;
  job.pendingClientResult = null;
  resolve(results);

  return NextResponse.json({ ok: true });
}

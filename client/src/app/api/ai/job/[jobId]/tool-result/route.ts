import { NextRequest, NextResponse } from 'next/server';
import { getJob, emitJobEvent } from '@/lib/ai/jobStore';
import { v4 as uuidv4 } from 'uuid';
import { AIMessage } from '@/lib/ai/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (!job.pendingClientResult) {
    return NextResponse.json({ error: 'No pending tool result expected' }, { status: 409 });
  }

  const body = await request.json();
  const results: { tool_call_id: string; content: string }[] = body.results;

  if (!Array.isArray(results)) {
    return NextResponse.json({ error: 'results array is required' }, { status: 400 });
  }

  // Add tool result messages to chat history so they appear in the UI
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

  // Unblock the job runner
  const { resolve } = job.pendingClientResult;
  job.pendingClientResult = null;
  resolve(results);

  return NextResponse.json({ ok: true });
}

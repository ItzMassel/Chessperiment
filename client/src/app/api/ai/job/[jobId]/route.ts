import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/ai/jobStore';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    chatMessages: job.chatMessages,
    eventCount: job.events.length,
    cumulativeTokens: job.cumulativeTokens,
    error: job.error,
    // Expose pending client tool calls so the client can re-execute on reconnect
    pendingClientToolCalls: job.status === 'waiting_for_client'
      ? job.pendingClientToolCalls
      : null,
  });
}

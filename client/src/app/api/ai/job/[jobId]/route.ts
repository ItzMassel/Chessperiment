import { NextRequest, NextResponse } from 'next/server';
import { validateJobSecret } from '@/lib/ai/jobStore';
import { requireAuth } from '@/lib/ai/security';

export async function GET(
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

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    chatMessages: job.chatMessages,
    eventCount: job.events.length,
    cumulativeTokens: job.cumulativeTokens,
    error: job.error,
    pendingClientToolCalls: job.status === 'waiting_for_client'
      ? job.pendingClientToolCalls
      : null,
  });
}

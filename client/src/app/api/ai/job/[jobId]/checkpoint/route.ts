import { NextRequest, NextResponse } from 'next/server';
import { validateJobSecret } from '@/lib/ai/jobStore';
import { requireAuth } from '@/lib/ai/security';
import { CheckpointResponse, CheckpointAction } from '@/lib/ai/types';

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

  if (!job.pendingCheckpoint) {
    return NextResponse.json({ error: 'No pending checkpoint' }, { status: 409 });
  }

  const body = await request.json();
  const { action, revisionNotes, step } = body;

  if (!action || !['approve', 'revise', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action. Must be approve, revise, or cancel.' }, { status: 400 });
  }

  const response: CheckpointResponse = {
    action: action as CheckpointAction,
    revisionNotes: revisionNotes || undefined,
    step: step || 'board',
  };

  const { resolve } = job.pendingCheckpoint;
  job.pendingCheckpoint = null;
  job.status = 'running';
  resolve(response);

  return NextResponse.json({ ok: true });
}

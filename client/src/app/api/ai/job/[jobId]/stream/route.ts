import { NextRequest } from 'next/server';
import { validateJobSecret, subscribeToJob, SSEEvent } from '@/lib/ai/jobStore';
import { requireAuth } from '@/lib/ai/security';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = await requireAuth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { jobId } = await params;
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || typeof secret !== 'string' || secret.length < 32) {
    return new Response('Not found', { status: 404 });
  }

  const job = validateJobSecret(jobId, secret);
  if (!job || job.userId !== userId) {
    return new Response('Not found', { status: 404 });
  }

  const afterParam = request.nextUrl.searchParams.get('after');
  const after = afterParam !== null ? parseInt(afterParam, 10) : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let unsubscribe: () => void;

      function send(event: SSEEvent) {
        const chunk = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* controller already closed */
        }
        if (event.type === 'done' || event.type === 'error') {
          unsubscribe?.();
          try { controller.close(); } catch { /* already closed */ }
        }
      }

      unsubscribe = subscribeToJob(job, send, after);

      if (job.status === 'done' || job.status === 'error') {
        try { controller.close(); } catch { /* already closed */ }
      }

      request.signal.addEventListener('abort', () => {
        unsubscribe?.();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

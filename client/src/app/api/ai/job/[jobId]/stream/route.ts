import { NextRequest } from 'next/server';
import { getJob, subscribeToJob, SSEEvent } from '@/lib/ai/jobStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) {
    return new Response('Job not found', { status: 404 });
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
        // Close stream after terminal events
        if (event.type === 'done' || event.type === 'error') {
          unsubscribe?.();
          try { controller.close(); } catch { /* already closed */ }
        }
      }

      unsubscribe = subscribeToJob(job, send, after);

      // If job was already terminal before we subscribed, close now
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

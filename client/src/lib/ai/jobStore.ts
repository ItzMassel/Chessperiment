import { v4 as uuidv4 } from 'uuid';
import { AIMessage } from './types';

export interface SSEEvent {
  index: number;
  type: string;
  data: Record<string, any>;
}

export interface ApiMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  reasoning_content?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ClientToolResult {
  tool_call_id: string;
  content: string;
}

export type JobStatus = 'pending' | 'running' | 'waiting_for_client' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  apiMessages: ApiMessage[];
  chatMessages: AIMessage[];
  events: SSEEvent[];
  error?: string;
  projectId: string;
  userId: string;
  isGuest: boolean;
  currentPage: string;
  cumulativeTokens: number;
  pendingClientResult: {
    resolve: (results: ClientToolResult[]) => void;
    reject: (error: Error) => void;
  } | null;
  pendingClientToolCalls: any[] | null;
  subscribers: Set<(event: SSEEvent) => void>;
  createdAt: number;
}

const jobs = new Map<string, Job>();

export function createJob(params: {
  projectId: string;
  userId: string;
  isGuest: boolean;
  currentPage: string;
  initialApiMessages: ApiMessage[];
  initialChatMessages: AIMessage[];
}): Job {
  const id = uuidv4();
  const job: Job = {
    id,
    status: 'pending',
    apiMessages: params.initialApiMessages,
    chatMessages: params.initialChatMessages,
    events: [],
    projectId: params.projectId,
    userId: params.userId,
    isGuest: params.isGuest,
    currentPage: params.currentPage,
    cumulativeTokens: 0,
    pendingClientResult: null,
    pendingClientToolCalls: null,
    subscribers: new Set(),
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function emitJobEvent(job: Job, type: string, data: Record<string, any>) {
  const event: SSEEvent = { index: job.events.length, type, data };
  job.events.push(event);
  job.subscribers.forEach(fn => {
    try { fn(event); } catch { /* subscriber closed */ }
  });
}

export function subscribeToJob(
  job: Job,
  fn: (event: SSEEvent) => void,
  after = 0
): () => void {
  // Replay buffered events the client hasn't seen
  for (let i = after; i < job.events.length; i++) {
    try { fn(job.events[i]); } catch { /* stream closed */ }
  }

  if (job.status === 'done' || job.status === 'error') {
    return () => {};
  }

  job.subscribers.add(fn);
  return () => job.subscribers.delete(fn);
}

// Periodically evict old completed jobs
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if ((job.status === 'done' || job.status === 'error') && job.createdAt < cutoff) {
      jobs.delete(id);
    }
  }
}, 15 * 60 * 1000);

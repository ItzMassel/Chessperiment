'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useProject } from '@/hooks/useProject';
import { AIMessage, ToolHandler, ToolHandlerRegistry } from '@/lib/ai/types';
import { executeToolCalls } from '@/lib/ai/toolExecutor';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface AIAssistantContextType {
  messages: AIMessage[];
  isOpen: boolean;
  isLoading: boolean;
  currentPage: string;
  isAuthenticated: boolean;
  authLoading: boolean;
  togglePanel: () => void;
  sendMessage: (content: string) => Promise<void>;
  registerToolHandler: (name: string, handler: ToolHandler) => void;
  unregisterToolHandler: (name: string) => void;
  clearMessages: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}

/** Safe version that returns null when not inside AIAssistantProvider */
export function useAIAssistantOptional() {
  return useContext(AIAssistantContext);
}

function getSessionKey(projectId: string, suffix: string) {
  return `ai-${suffix}-${projectId}`;
}

function loadMessages(projectId: string): AIMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(getSessionKey(projectId, 'chat'));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(projectId: string, messages: AIMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(getSessionKey(projectId, 'chat'), JSON.stringify(messages));
  } catch { /* storage full — ignore */ }
}

function loadPanelOpen(projectId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(getSessionKey(projectId, 'panel')) === 'true';
  } catch { return false; }
}

function savePanelOpen(projectId: string, isOpen: boolean) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(getSessionKey(projectId, 'panel'), String(isOpen));
  } catch { /* ignore */ }
}

function loadActiveJobId(projectId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(getSessionKey(projectId, 'job'));
  } catch { return null; }
}

function saveActiveJobId(projectId: string, jobId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (jobId) {
      sessionStorage.setItem(getSessionKey(projectId, 'job'), jobId);
    } else {
      sessionStorage.removeItem(getSessionKey(projectId, 'job'));
    }
  } catch { /* ignore */ }
}

function loadActiveJobSecret(projectId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(getSessionKey(projectId, 'secret'));
  } catch { return null; }
}

function saveActiveJobSecret(projectId: string, secret: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (secret) {
      sessionStorage.setItem(getSessionKey(projectId, 'secret'), secret);
    } else {
      sessionStorage.removeItem(getSessionKey(projectId, 'secret'));
    }
  } catch { /* ignore */ }
}

function detectCurrentPage(pathname: string): string {
  if (pathname.includes('/board-editor')) return 'board-editor';
  if (pathname.includes('/logic')) return 'piece-logic';
  if (pathname.includes('/piece-editor')) return 'piece-editor';
  if (pathname.includes('/square-editor')) return 'square-editor';
  if (pathname.includes('/play')) return 'play';
  return 'project-overview';
}

interface AIAssistantProviderProps {
  projectId: string;
  children: React.ReactNode;
}

export function AIAssistantProvider({ projectId, children }: AIAssistantProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { project, saveProject } = useProject(projectId);
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toolHandlers = useRef<ToolHandlerRegistry>(new Map());
  const projectRef = useRef(project);
  projectRef.current = project;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const activeEventSource = useRef<EventSource | null>(null);

  const currentPage = detectCurrentPage(pathname);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    setMessages(loadMessages(projectId));
    setIsOpen(loadPanelOpen(projectId));
    setMounted(true);
  }, [projectId]);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (mounted) saveMessages(projectId, messages);
  }, [messages, projectId, mounted]);

  // Persist panel state and set CSS variable for theme toggle movement
  useEffect(() => {
    if (mounted) {
      savePanelOpen(projectId, isOpen);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--ai-sidebar-width', isOpen ? '380px' : '0px');
      }
    }
  }, [isOpen, projectId, mounted]);

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const registerToolHandler = useCallback((name: string, handler: ToolHandler) => {
    toolHandlers.current.set(name, handler);
  }, []);

  const unregisterToolHandler = useCallback((name: string) => {
    toolHandlers.current.delete(name);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Register project-level tool handlers (client-side fallbacks, also used for guest projects)
  useEffect(() => {
    toolHandlers.current.set('get_project_state', async () => {
      const p = projectRef.current;
      if (!p) return JSON.stringify({ error: 'No project loaded' });
      return JSON.stringify({
        id: p.id,
        name: p.name,
        description: p.description,
        rows: p.rows,
        cols: p.cols,
        gridType: p.gridType || 'square',
        activeSquares: p.activeSquares,
        placedPieces: p.placedPieces,
        customPieces: p.customPieces?.map(cp => ({
          id: cp.id,
          name: cp.name,
          movesCount: cp.moves?.length || 0,
          hasLogic: !!(cp.logic && (Array.isArray(cp.logic) ? cp.logic.length > 0 : true)),
          variablesCount: cp.variables?.length || 0
        })),
        squareLogicSquares: p.squareLogic ? Object.keys(p.squareLogic) : []
      });
    });

    toolHandlers.current.set('update_project_info', async (args) => {
      if (!projectRef.current) return JSON.stringify({ error: 'No project loaded' });
      const updates: any = {};
      if (args.name) updates.name = args.name;
      if (args.description) updates.description = args.description;
      await saveProject(updates);
      return JSON.stringify({ success: true });
    });

    toolHandlers.current.set('save_project', async () => {
      if (!projectRef.current) return JSON.stringify({ error: 'No project loaded' });
      await saveProject({});
      return JSON.stringify({ success: true });
    });

    toolHandlers.current.set('get_current_context', async () => {
      return JSON.stringify({
        currentPage,
        projectId,
        projectName: projectRef.current?.name || 'Unknown',
        registeredTools: Array.from(toolHandlers.current.keys())
      });
    });

    toolHandlers.current.set('list_pieces', async () => {
      const p = projectRef.current;
      if (!p) return JSON.stringify({ error: 'No project loaded' });
      return JSON.stringify(
        (p.customPieces || []).map(cp => ({ id: cp.id, name: cp.name }))
      );
    });

    toolHandlers.current.set('get_piece_details', async (args) => {
      const p = projectRef.current;
      if (!p) return JSON.stringify({ error: 'No project loaded' });
      const piece = p.customPieces?.find(cp => cp.id === args.pieceId);
      if (!piece) return JSON.stringify({ error: 'Piece not found' });
      return JSON.stringify({
        id: piece.id,
        name: piece.name,
        movesCount: piece.moves?.length || 0,
        moves: piece.moves,
        logicBlocksCount: Array.isArray(piece.logic) ? piece.logic.length : 0,
        variables: piece.variables || [],
        hasWhitePixels: !!piece.pixelsWhite,
        hasBlackPixels: !!piece.pixelsBlack
      });
    });

    toolHandlers.current.set('get_block_templates', async () => {
      return JSON.stringify([
        { id: 'on-is-captured', type: 'trigger', label: 'onIsCaptured', sockets: [{ id: 'by', type: 'select', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }] },
        { id: 'on-threat', type: 'trigger', label: 'onThreat', sockets: [{ id: 'by', type: 'select', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }] },
        { id: 'on-move', type: 'trigger', label: 'onMove', sockets: [] },
        { id: 'on-environment', type: 'trigger', label: 'onEnvironment', sockets: [{ id: 'condition', type: 'select', options: ['White Square', 'Black Square', 'Is Attacked'] }] },
        { id: 'on-var', type: 'trigger', label: 'onVar', sockets: [{ id: 'varName', type: 'text' }, { id: 'op', type: 'select', options: ['==', '!=', '>', '<', '>=', '<='] }, { id: 'value', type: 'text' }] },
        { id: 'cooldown', type: 'effect', label: 'cooldown', sockets: [{ id: 'duration', type: 'number' }, { id: 'unit', type: 'select', options: ['seconds', 'half-moves', 'full-moves'] }] },
        { id: 'transformation', type: 'effect', label: 'transformation', sockets: [{ id: 'target', type: 'select', options: ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }] },
        { id: 'modify-var', type: 'effect', label: 'modVar', sockets: [{ id: 'varName', type: 'text' }, { id: 'op', type: 'select', options: ['+=', '-=', '='] }, { id: 'value', type: 'number' }] },
        { id: 'prevent', type: 'effect', label: 'prevent', sockets: [] },
        { id: 'kill', type: 'terminal', label: 'kill', sockets: [{ id: 'target', type: 'select', options: ['Selected Piece', 'Attacker'] }] },
        { id: 'explode', type: 'terminal', label: 'explode', sockets: [{ id: 'radius', type: 'number' }] },
        { id: 'win', type: 'terminal', label: 'win', sockets: [] }
      ]);
    });
  }, [currentPage, projectId, saveProject]);

  // Navigation handler
  const handleNavigate = useCallback(async (page: string, pieceId?: string) => {
    const base = `/editor/${projectId}`;
    switch (page) {
      case 'project-overview':
        router.push(base);
        break;
      case 'board-editor':
        router.push(`${base}/board-editor`);
        break;
      case 'piece-editor':
        router.push(`${base}/piece-editor`);
        break;
      case 'piece-logic':
        if (pieceId) {
          router.push(`${base}/piece-editor/${pieceId}/logic`);
        } else {
          throw new Error('pieceId is required for piece-logic navigation');
        }
        break;
      case 'square-editor':
        router.push(`${base}/square-editor`);
        break;
      default:
        throw new Error(`Unknown page: ${page}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }, [projectId, router]);

  /** Connect to a job's SSE stream. Returns a cleanup function. */
  const connectToJobStream = useCallback((jobId: string, secret: string, after: number) => {
    if (activeEventSource.current) {
      activeEventSource.current.close();
      activeEventSource.current = null;
    }

    const es = new EventSource(`/api/ai/job/${jobId}/stream?after=${after}&secret=${encodeURIComponent(secret)}`);
    activeEventSource.current = es;

    es.addEventListener('chat_message', (e) => {
      const msg: AIMessage = JSON.parse((e as MessageEvent).data);
      setMessages(prev => [...prev, msg]);
    });

    es.addEventListener('client_tool_calls', async (e) => {
      const { tool_calls } = JSON.parse((e as MessageEvent).data);
      try {
        const results = await executeToolCalls(tool_calls, toolHandlers.current, handleNavigate);
        await fetch(`/api/ai/job/${jobId}/tool-result?secret=${encodeURIComponent(secret)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results }),
        });
      } catch (err) {
        await fetch(`/api/ai/job/${jobId}/tool-result?secret=${encodeURIComponent(secret)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: tool_calls.map((tc: any) => ({
              tool_call_id: tc.id,
              content: JSON.stringify({ error: String(err) }),
            })),
          }),
        });
      }
    });

    es.addEventListener('done', () => {
      es.close();
      activeEventSource.current = null;
      saveActiveJobId(projectId, null);
      saveActiveJobSecret(projectId, null);
      setIsLoading(false);
    });

    es.addEventListener('error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (data.message) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            content: `Error: ${data.message}`,
            timestamp: Date.now(),
          }]);
        }
      } catch { /* network/connection error — no JSON body */ }
      es.close();
      activeEventSource.current = null;
      saveActiveJobId(projectId, null);
      saveActiveJobSecret(projectId, null);
      setIsLoading(false);
    });

    return () => { es.close(); };
  }, [projectId, handleNavigate]);

  /** Reconnect to a job that was in progress before a page reload. */
  const reconnectToJob = useCallback(async (jobId: string) => {
    try {
      const secret = loadActiveJobSecret(projectId);
      if (!secret) { saveActiveJobId(projectId, null); return; }

      const res = await fetch(`/api/ai/job/${jobId}?secret=${encodeURIComponent(secret)}`);
      if (!res.ok) { saveActiveJobId(projectId, null); saveActiveJobSecret(projectId, null); return; }

      const job = await res.json();

      if (job.status === 'done' || job.status === 'error') {
        setMessages(job.chatMessages);
        saveActiveJobId(projectId, null);
        saveActiveJobSecret(projectId, null);
        return;
      }

      // Job still running — restore chat state and reconnect
      setMessages(job.chatMessages);
      setIsLoading(true);

      // If waiting for client tools, execute them before connecting to stream
      if (job.status === 'waiting_for_client' && job.pendingClientToolCalls?.length) {
        try {
          const results = await executeToolCalls(
            job.pendingClientToolCalls,
            toolHandlers.current,
            handleNavigate
          );
          await fetch(`/api/ai/job/${jobId}/tool-result?secret=${encodeURIComponent(secret)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results }),
          });
        } catch (err) {
          await fetch(`/api/ai/job/${jobId}/tool-result?secret=${encodeURIComponent(secret)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              results: job.pendingClientToolCalls.map((tc: any) => ({
                tool_call_id: tc.id,
                content: JSON.stringify({ error: String(err) }),
              })),
            }),
          });
        }
      }

      // Connect from current event count (we already have all chatMessages)
      connectToJobStream(jobId, secret, job.eventCount);
    } catch {
      saveActiveJobId(projectId, null);
      saveActiveJobSecret(projectId, null);
    }
  }, [projectId, connectToJobStream, handleNavigate]);

  // On mount: reconnect to any job that was active before the last reload
  useEffect(() => {
    if (!mounted) return;
    const jobId = loadActiveJobId(projectId);
    if (jobId) {
      void reconnectToJob(jobId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, projectId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (authLoading) return;

    if (!user) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: Authentication required`,
        timestamp: Date.now(),
      }]);
      return;
    }

    if (activeEventSource.current) {
      activeEventSource.current.close();
      activeEventSource.current = null;
    }

    const userMessage: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.reasoning_content ? { reasoning_content: m.reasoning_content } : {}),
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      }));

      const res = await fetch('/api/ai/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          chatMessages: newMessages,
          projectId,
          currentPage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${res.status}`);
      }

      const { jobId, secret } = await res.json();
      saveActiveJobId(projectId, jobId);
      saveActiveJobSecret(projectId, secret);

      // Connect to SSE from the start (after=0 — no prior events for this fresh job)
      connectToJobStream(jobId, secret, 0);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong. Please try again.'}`,
        timestamp: Date.now(),
      }]);
      setIsLoading(false);
    }
  }, [isLoading, currentPage, projectId, connectToJobStream, user, authLoading]);

  return (
    <AIAssistantContext.Provider value={{
      messages,
      isOpen,
      isLoading,
      currentPage,
      isAuthenticated: !!user,
      authLoading,
      togglePanel,
      sendMessage,
      registerToolHandler,
      unregisterToolHandler,
      clearMessages,
    }}>
      {children}
    </AIAssistantContext.Provider>
  );
}

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useProject } from '@/hooks/useProject';
import { AIMessage, ToolCall, ToolHandler, ToolHandlerRegistry, ToolResult } from '@/lib/ai/types';
import { executeToolCalls } from '@/lib/ai/toolExecutor';
import { v4 as uuidv4 } from 'uuid';

interface AIAssistantContextType {
  messages: AIMessage[];
  isOpen: boolean;
  isLoading: boolean;
  currentPage: string;
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

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toolHandlers = useRef<ToolHandlerRegistry>(new Map());
  const projectRef = useRef(project);
  projectRef.current = project;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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

  // Persist panel state
  useEffect(() => {
    if (mounted) savePanelOpen(projectId, isOpen);
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

  // Register project-level tool handlers
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
    // Wait for navigation to complete and handlers to register
    await new Promise(resolve => setTimeout(resolve, 1500));
  }, [projectId, router]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build message history for API (strip client-only fields)
      let apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
      }));

      let continueLoop = true;
      let loopCount = 0;
      const MAX_LOOPS = 10; // Safety limit

      while (continueLoop && loopCount < MAX_LOOPS) {
        loopCount++;

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            projectState: projectRef.current,
            currentPage
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMsg = data.message;

        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
          // Add assistant message with tool calls
          const toolCallIds = assistantMsg.tool_calls.map((_: any, i: number) => ({
            ...assistantMsg.tool_calls[i],
            id: assistantMsg.tool_calls[i].id || uuidv4()
          }));

          const assistantAIMessage: AIMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: assistantMsg.content || '',
            tool_calls: toolCallIds,
            timestamp: Date.now()
          };

          setMessages(prev => [...prev, assistantAIMessage]);
          apiMessages.push({
            role: 'assistant',
            content: assistantMsg.content || '',
            tool_calls: toolCallIds
          });

          // Execute tool calls
          const toolResults = await executeToolCalls(
            toolCallIds,
            toolHandlers.current,
            handleNavigate
          );

          // Add tool result messages
          for (const result of toolResults) {
            const toolMsg: AIMessage = {
              id: uuidv4(),
              role: 'tool',
              content: result.content,
              tool_call_id: result.tool_call_id,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, toolMsg]);
            apiMessages.push({
              role: 'tool',
              content: result.content,
              tool_call_id: result.tool_call_id
            });
          }

          // Continue loop to get next response
          continueLoop = true;
        } else {
          // Final text response — no more tool calls
          const finalMessage: AIMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: assistantMsg.content || 'Done.',
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, finalMessage]);
          continueLoop = false;
        }
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong. Please try again.'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentPage, handleNavigate]);

  return (
    <AIAssistantContext.Provider value={{
      messages,
      isOpen,
      isLoading,
      currentPage,
      togglePanel,
      sendMessage,
      registerToolHandler,
      unregisterToolHandler,
      clearMessages
    }}>
      {children}
    </AIAssistantContext.Provider>
  );
}

import { useEffect, useRef } from 'react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { ToolHandler } from '@/lib/ai/types';

export function useAIToolRegistration(handlers: Record<string, ToolHandler>) {
  const { registerToolHandler, unregisterToolHandler } = useAIAssistant();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const names = Object.keys(handlersRef.current);

    // Register all handlers
    for (const name of names) {
      registerToolHandler(name, handlersRef.current[name]);
    }

    // Unregister on unmount
    return () => {
      for (const name of names) {
        unregisterToolHandler(name);
      }
    };
  }, []); // Only on mount/unmount — handlers are accessed via ref

  // Update handlers when they change (without re-registering)
  useEffect(() => {
    for (const [name, handler] of Object.entries(handlers)) {
      registerToolHandler(name, handler);
    }
  }, [handlers, registerToolHandler]);
}

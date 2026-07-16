import { ToolCall, ToolResult, ToolHandlerRegistry } from './types';

export async function executeToolCalls(
  toolCalls: ToolCall[],
  handlers: ToolHandlerRegistry,
  onNavigate?: (page: string, pieceId?: string) => Promise<void>
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;

    try {
      // Handle navigation specially — it may need to wait for page mount
      if (name === 'navigate_to_page' && onNavigate) {
        await onNavigate(args.page, args.pieceId);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, navigatedTo: args.page })
        });
        continue;
      }

      const handler = handlers.get(name);
      if (!handler) {
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: `Tool "${name}" is not available on the current page. Navigate to the correct editor page first.`
          })
        });
        continue;
      }

      const result = await handler(args);
      results.push({
        tool_call_id: toolCall.id,
        content: typeof result === 'string' ? result : JSON.stringify(result)
      });
    } catch (error) {
      results.push({
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: `Tool "${name}" failed: ${error instanceof Error ? error.message : String(error)}`
        })
      });
    }
  }

  return results;
}

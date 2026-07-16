export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  reasoning_content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  timestamp: number;
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface ToolResult {
  tool_call_id: string;
  content: string;
}

export interface AIRequestBody {
  messages: { role: string; content: string; reasoning_content?: string; tool_calls?: any[]; tool_call_id?: string }[];
  projectState: any;
  currentPage: string;
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: {
    function: {
      name: string;
      arguments: Record<string, any>;
    };
  }[];
  tool_call_id?: string;
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  tools?: OllamaTool[];
  stream: boolean;
}

export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface OllamaResponse {
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: {
      function: {
        name: string;
        arguments: Record<string, any>;
      };
    }[];
  };
  done: boolean;
}

export type ToolHandler = (args: Record<string, any>) => Promise<string> | string;

export type ToolHandlerRegistry = Map<string, ToolHandler>;

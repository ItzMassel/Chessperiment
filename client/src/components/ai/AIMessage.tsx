'use client';

import { AIMessage as AIMessageType } from '@/lib/ai/types';
import { Bot, User, Wrench } from 'lucide-react';
import AIToolCallIndicator from './AIToolCallIndicator';

interface AIMessageProps {
  message: AIMessageType;
}

export default function AIMessage({ message }: AIMessageProps) {
  if (message.role === 'tool') {
    // Tool results are shown inline via the tool call indicator
    return null;
  }

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isUser
          ? 'bg-accent/20 text-accent'
          : 'bg-purple-500/20 text-purple-400'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Text content */}
        {message.content && (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-accent text-white rounded-tr-sm'
              : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
          }`}>
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>
        )}

        {/* Tool calls */}
        {isAssistant && message.tool_calls && message.tool_calls.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            {message.tool_calls.map((tc, i) => (
              <AIToolCallIndicator key={tc.id || i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

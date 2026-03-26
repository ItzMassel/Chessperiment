'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Trash2, Loader2, Bot } from 'lucide-react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import AIMessage from './AIMessage';

export default function AIAssistantPanel() {
  const {
    messages,
    isOpen,
    isLoading,
    currentPage,
    togglePanel,
    sendMessage,
    clearMessages
  } = useAIAssistant();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Visible messages (filter out tool-result messages since they show inline)
  const visibleMessages = messages.filter(m => m.role !== 'tool');

  return (
    <>
      {/* Toggle button — fixed left side */}
      <button
        onClick={togglePanel}
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-white/10 text-white/60 hover:bg-white/20 scale-90'
            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:scale-110 hover:shadow-purple-500/30 hover:shadow-xl'
        }`}
        title="AI Assistant"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-24 h-[calc(100vh-6rem)] w-[380px] z-40 bg-stone-950 border-r border-white/10 flex flex-col shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                  <p className="text-[10px] text-white/40 leading-tight">{currentPage.replace('-', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearMessages}
                  className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePanel}
                  className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">AI Variant Designer</p>
                    <p className="text-xs text-white/30 mt-1 max-w-[240px] leading-relaxed">
                      I can help you create chess variants. I can design boards, draw pieces, set up movement rules, and add special abilities.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3 w-full max-w-[260px]">
                    {[
                      'Create a 10x10 board with custom pieces',
                      'Make a piece that explodes on capture',
                      'Set up standard chess starting position',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => sendMessage(suggestion)}
                        className="text-left text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {visibleMessages.map((msg) => (
                <AIMessage key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-white/40 text-xs pl-9">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-white/10">
              <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-purple-500/30 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your chess variant..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 resize-none outline-none max-h-32 min-h-[20px] leading-relaxed"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

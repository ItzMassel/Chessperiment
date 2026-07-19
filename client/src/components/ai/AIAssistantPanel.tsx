'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Trash2, Loader2, Bot, LogIn } from 'lucide-react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { Link } from '@/i18n/navigation';
import AIMessage from './AIMessage';

export default function AIAssistantPanel() {
  const {
    messages,
    isOpen,
    isLoading,
    currentPage,
    isAuthenticated,
    authLoading,
    togglePanel,
    sendMessage,
    clearMessages
  } = useAIAssistant();

  const needsAuth = !isAuthenticated && !authLoading;

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
    if (!input.trim() || isLoading || needsAuth) return;
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
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isOpen
            ? 'bg-white/10 text-white/60 hover:bg-white/20 scale-90'
            : 'bg-linear-to-br from-purple-500 to-indigo-600 text-white hover:scale-110 hover:shadow-purple-500/30 hover:shadow-xl'
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
            <div className="relative px-5 py-4 border-b border-white/5 bg-linear-to-b from-white/3 to-transparent backdrop-blur-xl">
              {/* Glow effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-32 h-32 bg-purple-500/20 blur-[50px] absolute -top-16 -left-16" />
                <div className="w-32 h-32 bg-indigo-500/20 blur-2xl absolute top-0 -right-16" />
              </div>

              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3.5">
                  <div className="relative flex items-center justify-center w-10 h-10 shadow-lg shadow-purple-500/20 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 border border-white/10">
                    <Bot className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[15px] font-semibold text-transparent bg-clip-text bg-linear-to-r from-white to-white/70 tracking-tight">
                      AI Assistant
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        {currentPage.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={clearMessages}
                    className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 hover:shadow-lg transition-all active:scale-95"
                    title="Clear chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePanel}
                    className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/10 hover:shadow-lg transition-all active:scale-95"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {needsAuth && visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-20 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <LogIn className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">Sign in required</p>
                    <p className="text-xs text-white/30 mt-2 max-w-[240px] leading-relaxed">
                      You need to be signed in to use the AI assistant.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/90 text-black text-sm font-semibold hover:bg-amber-400 transition-all active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Link>
                </div>
              )}

              {!needsAuth && visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-20">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center">
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
                  placeholder={needsAuth ? 'Sign in to use the AI assistant' : 'Describe your chess variant...'}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 resize-none outline-none max-h-32 min-h-[20px] leading-relaxed"
                  rows={1}
                  disabled={isLoading || needsAuth}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || needsAuth}
                  className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
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

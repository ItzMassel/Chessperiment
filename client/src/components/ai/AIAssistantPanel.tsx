'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Trash2, Loader2, Bot, LogIn, Wand2, Check } from 'lucide-react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { Link } from '@/i18n/navigation';
import { GenStep } from '@/lib/ai/types';
import AIMessage from './AIMessage';

const STEP_LABELS: Record<GenStep, string> = {
  plan: 'Plan', board: 'Board', 'piece-roster': 'Roster',
  'piece-design': 'Art', movement: 'Move',
  'square-patterns': 'Squares', validation: 'Check', summary: 'Done',
};

const STEP_ORDER: GenStep[] = [
  'plan', 'board', 'piece-roster', 'piece-design', 'movement',
  'square-patterns', 'validation', 'summary',
];

export default function AIAssistantPanel() {
  const {
    messages, isOpen, isLoading, currentPage, isAuthenticated, authLoading,
    togglePanel, sendMessage, clearMessages, genProgress,
  } = useAIAssistant();

  const needsAuth = !isAuthenticated && !authLoading;

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, genProgress]);

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

  const visibleMessages = messages.filter(m => m.role !== 'tool');

  const isGenerating = genProgress?.status === 'generating';
  const isGenDone = genProgress?.status === 'done';
  const completedSet = new Set(genProgress?.completedSteps || []);

  return (
    <>
      <button
        onClick={togglePanel}
        className={`fixed left-4 bottom-6 z-[70] w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-white/10 text-white/60 hover:bg-white/20 scale-90'
            : 'bg-linear-to-br from-purple-500 to-indigo-600 text-white hover:scale-110 hover:shadow-purple-500/40'
        }`}
        title="AI Assistant"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm"
            onClick={togglePanel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -420 }}
            animate={{ x: 0 }}
            exit={{ x: -420 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 z-[70] w-full sm:w-[400px] h-screen bg-stone-950 border-r border-white/10 flex flex-col shadow-2xl shadow-black/60"
          >
            {/* Header */}
            <div className="relative shrink-0 px-5 py-4 border-b border-white/5 bg-linear-to-b from-white/[0.03] to-transparent">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-32 h-32 bg-purple-500/15 blur-[60px] absolute -top-16 -left-16" />
                <div className="w-32 h-32 bg-indigo-500/15 blur-3xl absolute top-0 -right-16" />
              </div>
              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 border border-white/10 shadow-lg shadow-purple-500/20">
                    <Bot className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-white/90 tracking-tight">AI Assistant</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                      }`} />
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {isGenerating ? 'Generating...' : currentPage.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={clearMessages} className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition-all active:scale-95" title="Clear chat">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Progress Bar */}
            {genProgress && (
              <div className="shrink-0 px-5 py-3 border-b border-white/5 bg-white/[0.015]">
                <div className="flex items-center gap-[3px]">
                  {STEP_ORDER.map((step) => {
                    const isDone = completedSet.has(step);
                    const isCurrent = genProgress.currentStep === step;
                    return (
                      <div
                        key={step}
                        className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                          isDone ? 'bg-green-500' : isCurrent ? 'bg-purple-500' : 'bg-white/8'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/25 text-center mt-2 font-medium uppercase tracking-[0.08em]">
                  {isGenDone ? 'Complete' : STEP_LABELS[genProgress.currentStep] || genProgress.currentStep}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/8">
              {needsAuth && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-20 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                    <LogIn className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">Sign in required</p>
                    <p className="text-xs text-white/30 mt-2 max-w-[240px] leading-relaxed">You need to be signed in to use the AI assistant.</p>
                  </div>
                  <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/90 text-black text-sm font-semibold hover:bg-amber-400 transition-all active:scale-95">
                    <LogIn className="w-4 h-4" /> Sign in
                  </Link>
                </div>
              )}

              {!needsAuth && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-20 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500/15 to-indigo-600/15 flex items-center justify-center">
                    <Wand2 className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">AI Variant Designer</p>
                    <p className="text-xs text-white/30 mt-2 max-w-[260px] leading-relaxed">Type what you want to build or change. The AI plans the steps and runs them automatically.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full max-w-[260px]">
                    {[
                      'Create a fire-element chess variant',
                      'Make the king move like a knight',
                      'Add a piece that explodes on capture',
                      'Turn this into a 10x10 board',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => { sendMessage(suggestion); }}
                        className="text-left text-xs px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors active:scale-[0.98]"
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
                <div className="flex items-center gap-2 text-white/30 text-xs pl-9">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 pb-4 pt-2 border-t border-white/8">
              <div className="flex items-end gap-2 bg-white/5 border border-white/8 rounded-2xl px-3 py-2.5 focus-within:border-purple-500/25 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={needsAuth ? 'Sign in to use the AI' : 'Describe your variant or changes...'}
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/20 resize-none outline-none max-h-32 min-h-[20px] leading-relaxed"
                  rows={1}
                  disabled={isLoading || needsAuth}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || needsAuth}
                  className="shrink-0 p-2 rounded-xl text-white/30 hover:text-white/80 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/8 transition-all active:scale-90"
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

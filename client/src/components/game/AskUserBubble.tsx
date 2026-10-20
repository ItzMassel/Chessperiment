"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface AskUserBubbleProps {
    question: string;
    options: string[];
    onAnswer: (answer: string) => void;
}

// Same speech-bubble language as SpeechBubble, but interactive: it holds the move
// paused until the player taps one of the options, so it needs pointer events and
// stays mounted until onAnswer fires (no auto-dismiss timer).
export default function AskUserBubble({ question, options, onAnswer }: AskUserBubbleProps) {
    return (
        <motion.div
            className="absolute z-50"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 }}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div
                className="relative px-2.5 py-2 rounded-xl shadow-lg text-stone-900"
                style={{ background: '#fff', border: '2px solid #e7e5e4', minWidth: 150, maxWidth: 230 }}
            >
                {question && (
                    <p className="text-[11px] font-bold text-center mb-1.5 whitespace-normal leading-snug">
                        {question}
                    </p>
                )}

                <div className="flex flex-col gap-1">
                    {options.map((opt, i) => (
                        <button
                            key={`${opt}-${i}`}
                            onClick={() => onAnswer(opt)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 active:bg-amber-300 transition-colors whitespace-normal text-stone-800"
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Tail pointing downward */}
                <svg
                    className="absolute left-1/2 -translate-x-1/2 top-full"
                    width="14"
                    height="8"
                    viewBox="0 0 14 8"
                    fill="none"
                >
                    <path d="M0 0 L7 8 L14 0 Z" fill="#fff" />
                    <path d="M0 0 L7 8 L14 0" stroke="#e7e5e4" strokeWidth="2" strokeLinejoin="round" fill="none" />
                </svg>
            </div>
        </motion.div>
    );
}

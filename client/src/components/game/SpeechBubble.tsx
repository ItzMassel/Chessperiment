"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface SpeechBubbleProps {
    message: string;
    onComplete?: () => void;
}

export default function SpeechBubble({ message, onComplete }: SpeechBubbleProps) {
    return (
        <motion.div
            className="absolute z-50 pointer-events-none"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 }}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onAnimationComplete={onComplete}
        >
            {/* Bubble body */}
            <div
                className="relative px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-900 shadow-lg whitespace-nowrap"
                style={{ background: '#fff', border: '2px solid #e7e5e4', maxWidth: 180, whiteSpace: 'normal', textAlign: 'center' }}
            >
                {message}

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

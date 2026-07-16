"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, MessageCircle, PartyPopper, X, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";

const STORAGE_KEY = "open_source_announcement_seen";

export const OpenSourceAnnouncement = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            const timer = setTimeout(() => setIsVisible(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setIsVisible(false);
    }, []);

    const fireConfetti = useCallback(() => {
        const defaults = { spread: 60, ticks: 100, gravity: 0.8, decay: 0.94, startVelocity: 30 };

        const shoot = () => {
            confetti({
                ...defaults,
                particleCount: 40,
                origin: { x: Math.random(), y: Math.random() * 0.3 },
            });
            confetti({
                ...defaults,
                particleCount: 30,
                angle: 60,
                origin: { x: 0 },
            });
            confetti({
                ...defaults,
                particleCount: 30,
                angle: 120,
                origin: { x: 1 },
            });
        };

        shoot();
        const interval = setInterval(shoot, 400);
        setTimeout(() => clearInterval(interval), 2000);
    }, []);

    useEffect(() => {
        if (isVisible) {
            fireConfetti();
        }
    }, [isVisible, fireConfetti]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-md" />

                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 260, delay: 0.1 }}
                        className="relative w-full max-w-xl"
                    >
                        {/* Animated gradient backgrounds */}
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/30 rounded-full blur-[100px] pointer-events-none"
                        />
                        <motion.div
                            animate={{ scale: [1.15, 1, 1.15], opacity: [0.1, 0.2, 0.1] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-20 -right-20 w-72 h-72 bg-orange-500/30 rounded-full blur-[100px] pointer-events-none"
                        />

                        <div className="relative bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-white/30 dark:border-stone-700/50 rounded-[2.5rem] shadow-2xl shadow-black/40 overflow-hidden">
                            {/* Top gradient bar */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-amber-400 via-orange-500 to-amber-400" />

                            {/* Corner accents */}
                            <div className="absolute top-0 right-0 p-5 opacity-20">
                                <div className="w-12 h-12 border-t-[3px] border-r-[3px] border-amber-400 rounded-tr-2xl" />
                            </div>
                            <div className="absolute bottom-0 left-0 p-5 opacity-20">
                                <div className="w-12 h-12 border-b-[3px] border-l-[3px] border-amber-400 rounded-bl-2xl" />
                            </div>

                            <div className="relative z-10 p-8 lg:p-10">
                                {/* Close button */}
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                                    aria-label="Close announcement"
                                >
                                    <X size={18} />
                                </button>

                                {/* Icon */}
                                <motion.div
                                    initial={{ y: -10, scale: 0.8 }}
                                    animate={{ y: 0, scale: 1 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="relative mb-6 inline-flex"
                                >
                                    <div className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full scale-150" />
                                    <div className="relative bg-linear-to-br from-amber-400 to-orange-500 p-4 rounded-2xl shadow-xl shadow-amber-500/20">
                                        <PartyPopper size={32} className="text-white" />
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white mb-3 tracking-tight leading-tight"
                                >
                                    Now{" "}
                                    <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-orange-500 to-amber-400">
                                        Open Source
                                    </span>
                                    !
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="text-stone-600 dark:text-stone-300 text-base lg:text-lg leading-relaxed mb-8"
                                >
                                    We&apos;re thrilled to announce that Chessperiment is now fully open source! 
                                    Join us on this journey — contribute to the code, report issues, 
                                    or just hang out with the community.
                                </motion.p>

                                {/* Community Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-col sm:flex-row gap-3 mb-8"
                                >
                                    <a
                                        href="https://github.com/ItzMassel/Chessperiment"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2.5 flex-1 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold py-3.5 px-5 rounded-2xl transition-all active:scale-[0.97] shadow-lg group"
                                    >
                                        <Github size={20} className="group-hover:scale-110 transition-transform" />
                                        <span>GitHub</span>
                                        <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                    <a
                                        href="https://discord.gg/2XrGZw9PMP"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2.5 flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-5 rounded-2xl transition-all active:scale-[0.97] shadow-lg group"
                                    >
                                        <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                                        <span>Discord</span>
                                        <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </motion.div>

                                {/* Continue button */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-center"
                                >
                                    <button
                                        onClick={handleDismiss}
                                        className="text-sm text-stone-400 dark:text-stone-500 hover:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors underline underline-offset-2 decoration-dotted decoration-stone-300 dark:decoration-stone-600 hover:decoration-amber-400"
                                    >
                                        Got it, let me explore!
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, ExternalLink, X } from "lucide-react";

interface ServerWakeupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ServerWakeupModal({ isOpen, onClose }: ServerWakeupModalProps) {
    const handleWakeUp = () => {
        window.open("https://chessperiment-server.onrender.com/", "_blank");
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="relative w-full max-w-lg"
                    >
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
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-amber-400 via-orange-500 to-amber-400" />

                            <div className="absolute top-0 right-0 p-5 opacity-20">
                                <div className="w-12 h-12 border-t-[3px] border-r-[3px] border-amber-400 rounded-tr-2xl" />
                            </div>
                            <div className="absolute bottom-0 left-0 p-5 opacity-20">
                                <div className="w-12 h-12 border-b-[3px] border-l-[3px] border-amber-400 rounded-bl-2xl" />
                            </div>

                            <div className="relative z-10 p-8 lg:p-10">
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>

                                <motion.div
                                    initial={{ y: -10, scale: 0.8 }}
                                    animate={{ y: 0, scale: 1 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="relative mb-6 inline-flex"
                                >
                                    <div className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full scale-150" />
                                    <div className="relative bg-linear-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-xl shadow-amber-500/20">
                                        <CloudOff size={32} className="text-white" />
                                    </div>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white mb-3 tracking-tight leading-tight"
                                >
                                    Server is{" "}
                                    <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-orange-500 to-amber-400">
                                        Sleeping
                                    </span>
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="text-stone-600 dark:text-stone-300 text-base lg:text-lg leading-relaxed mb-6"
                                >
                                    You need to wake up the server first! Since we&apos;re on a free tier, the
                                    game server goes to sleep after a while.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6"
                                >
                                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                                        <strong>Instructions:</strong> Click the button below, wait a few seconds
                                        until you see <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300 font-mono text-xs">Cannot GET /</code>, then come back and play!
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex flex-col gap-3"
                                >
                                    <button
                                        onClick={handleWakeUp}
                                        className="flex items-center justify-center gap-2.5 w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3.5 px-5 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-amber-500/30 group"
                                    >
                                        <span>Wake Up Server</span>
                                        <ExternalLink size={16} className="group-hover:scale-110 transition-transform" />
                                    </button>

                                    <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
                                        We apologize for the inconvenience. This will be fixed on{" "}
                                        <strong className="text-stone-500 dark:text-stone-400">August 4th, 2026</strong>.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

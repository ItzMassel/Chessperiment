"use client";

import React from 'react';
import { Construction, Home, Hammer, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const MaintenanceOverlay: React.FC = () => {
    const router = useRouter();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-hidden"
            >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" />

                {/* Decorative Gradients */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-lg bg-white/10 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-black/50 overflow-hidden group"
                >
                    {/* Glint effect */}
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <motion.div
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            className="relative mb-8"
                        >
                            <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative bg-linear-to-br from-amber-400 to-amber-600 p-6 rounded-3xl shadow-xl shadow-amber-500/20">
                                <Construction size={48} className="text-white" />
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight leading-tight"
                        >
                            Maintenance <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-amber-200 to-amber-500">
                                Mode Active
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-stone-300 text-lg mb-10 leading-relaxed max-w-sm"
                        >
                            The chess arena is currently undergoing scheduled improvements to enhance your gaming experience. We&apos;ll be back shortly!
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
                        >
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-2xl border border-white/10 transition-all active:scale-95 group/btn overflow-hidden relative"
                            >
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left"
                                />
                                <Home size={20} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                Go Home
                            </button>

                            <div className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-500 font-bold py-4 px-6 rounded-2xl border border-amber-500/20 cursor-default">
                                <Hammer size={20} className="animate-pulse" />
                                Fixing things...
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-10 flex items-center gap-2 text-stone-500 text-sm font-medium"
                        >
                            <ShieldAlert size={16} />
                            Estimated downtime: ~30 minutes
                        </motion.div>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                        <div className="w-16 h-16 border-t-[3px] border-r-[3px] border-white rounded-tr-3xl" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                        <div className="w-16 h-16 border-b-[3px] border-l-[3px] border-white rounded-bl-3xl" />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

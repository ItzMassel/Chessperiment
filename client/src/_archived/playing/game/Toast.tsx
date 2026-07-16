"use client";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface ToastProps {
    message: string;
    show: boolean;
    onClose: () => void;
}

export default function Toast({ message, show, onClose }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.5 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md pointer-events-none"
                >
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl text-gray-900 dark:text-white shadow-2xl border-2 border-blue-500/20 pointer-events-auto">
                        <div className="p-2 bg-blue-500 rounded-full text-white">
                            <Info size={24} strokeWidth={2.5} />
                        </div>
                        <p className="font-bold text-lg leading-tight">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

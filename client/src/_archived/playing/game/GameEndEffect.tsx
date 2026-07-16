"use client";
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Crown, Handshake, ShieldX, X } from 'lucide-react';

interface GameEndEffectProps {
    result: 'win' | 'loss' | 'draw';
    onClose?: () => void;
    onRematch?: () => void;
    onNextGame?: () => void;
    rematchRequested?: boolean;
    opponentRematchRequested?: boolean;
}

import Confetti from './Confetti';
import { UserPlus, Swords } from 'lucide-react';

export default function GameEndEffect({
    result, onClose, onRematch, onNextGame,
    rematchRequested, opponentRematchRequested
}: GameEndEffectProps) {
    const t = useTranslations('GameEnd');

    const effects = {
        win: {
            Icon: Crown,
            text: t('win'),
            className: 'from-amber-400 to-orange-600 text-white border-amber-300/50',
            shadow: 'shadow-amber-500/50'
        },
        loss: {
            Icon: ShieldX,
            text: t('loss'),
            className: 'from-red-600 to-rose-700 text-white border-red-500/50',
            shadow: 'shadow-red-500/50'
        },
        draw: {
            Icon: Handshake,
            text: t('draw'),
            className: 'from-slate-600 to-slate-800 text-white border-slate-500/50',
            shadow: 'shadow-slate-500/50'
        },
    };

    const { Icon, text, className, shadow } = effects[result];

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center pointer-events-auto">
            {result === 'win' && <Confetti count={100} />}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -100 }}
                className="z-10 relative"
            >
                <div className={`flex flex-col items-center gap-6 p-12 rounded-3xl bg-linear-to-br shadow-2xl border-4 ${className} ${shadow} max-w-sm mx-auto text-center transform perspective-1000 relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors group"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>

                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        className="p-4 bg-white/20 rounded-full backdrop-blur-sm"
                    >
                        <Icon size={80} strokeWidth={2.5} />
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-6xl font-black tracking-tighter drop-shadow-lg"
                    >
                        {text}
                    </motion.h1>

                    <div className="flex flex-col gap-3 w-full mt-4">
                        <button
                            onClick={onRematch}
                            disabled={rematchRequested}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center border-2 ${opponentRematchRequested ? 'bg-white text-amber-600 border-white shadow-xl animate-pulse' : (rematchRequested ? 'bg-white/20 text-white/50 border-transparent cursor-not-allowed' : 'bg-white/20 text-white border-white/40 hover:bg-white/30')}`}
                        >
                            <Swords size={20} className="mr-3" />
                            {rematchRequested ? t('rematchRequested') : t('rematch')}
                        </button>
                        <button
                            onClick={onNextGame}
                            className="w-full py-4 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-3"
                        >
                            <UserPlus size={20} />
                            {t('newGame')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

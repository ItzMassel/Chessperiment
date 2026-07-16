"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, AlertTriangle } from 'lucide-react';

interface PieceStateIndicatorsProps {
    variables?: Record<string, number>;
    hasLogic?: boolean;
    isUnderThreat?: boolean;
    size: number;
    recentTrigger?: string | null;
    recentEffect?: string | null;
}

export default function PieceStateIndicators({
    variables = {},
    hasLogic = false,
    isUnderThreat = false,
    size,
    recentTrigger,
    recentEffect
}: PieceStateIndicatorsProps) {
    const cooldown = variables['cooldown'] || 0;
    const charge = variables['charge'] || 0;
    const mode = variables['mode'] || 0;

    // Scale indicators based on piece size
    const scale = size / 64; // Base size is 64px
    const badgeSize = Math.max(16, 20 * scale);
    const iconSize = Math.max(10, 12 * scale);

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Cooldown Timer - Top Right */}
            <AnimatePresence>
                {cooldown > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 z-20"
                        style={{ width: badgeSize, height: badgeSize }}
                    >
                        <div className="relative w-full h-full">
                            {/* Circular progress ring */}
                            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 24 24">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-blue-200 dark:text-blue-900/40"
                                />
                                <motion.circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    className="text-blue-500"
                                    initial={{ pathLength: 1 }}
                                    animate={{ pathLength: cooldown / 10 }} // Assuming max cooldown of 10
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        strokeDasharray: "62.83",
                                        strokeDashoffset: 0
                                    }}
                                />
                            </svg>

                            {/* Number badge */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/60 rounded-full border border-blue-300 dark:border-blue-700 shadow-sm"
                            >
                                <span className="text-[10px] font-black text-blue-900 dark:text-blue-100" style={{ fontSize: iconSize }}>
                                    {cooldown}
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Charge Meter - Top Left */}
            <AnimatePresence>
                {charge > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, x: -10 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0, opacity: 0, x: -10 }}
                        className="absolute -top-1 -left-1 z-20"
                    >
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded-full border border-amber-300 dark:border-amber-700 shadow-sm">
                            <Zap
                                size={iconSize}
                                className="text-amber-500"
                                strokeWidth={3}
                            />
                            <span className="text-[10px] font-black text-amber-900 dark:text-amber-100 tabular-nums" style={{ fontSize: iconSize }}>
                                {charge}
                            </span>
                        </div>

                        {/* Glow effect when fully charged (assuming max charge is 5) */}
                        {charge >= 5 && (
                            <motion.div
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 bg-amber-400 rounded-full blur-md -z-10"
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mode Indicator - Bottom Right */}
            <AnimatePresence>
                {mode > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -bottom-1 -right-1 z-20"
                        style={{ width: badgeSize * 0.8, height: badgeSize * 0.8 }}
                    >
                        <div className="w-full h-full flex items-center justify-center bg-purple-500/20 dark:bg-purple-500/30 rounded-full border border-purple-400/40 dark:border-purple-400/50 shadow-sm">
                            <div className="w-2 h-2 bg-purple-400 rounded-full" />
                        </div>

                        {/* Glow */}
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-purple-400 rounded-full blur-sm -z-10"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Has Logic Sparkle - Bottom Left */}
            <AnimatePresence>
                {hasLogic && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -45 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            rotate: 0,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -bottom-1 -left-1 z-20"
                    >
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            <Sparkles
                                size={iconSize * 1.2}
                                className="text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                                fill="currentColor"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Under Threat Warning - Border Glow */}
            <AnimatePresence>
                {isUnderThreat && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-lg ring-2 ring-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10"
                    >
                        {/* Warning icon at top center */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                            <div className="bg-red-500 rounded-full p-0.5 shadow-lg">
                                <AlertTriangle size={iconSize} className="text-white" strokeWidth={3} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Fire Animation */}
            <AnimatePresence>
                {recentTrigger && (
                    <TriggerParticles triggerType={recentTrigger} size={size} />
                )}
            </AnimatePresence>

            {/* Effect Execution Flash */}
            <AnimatePresence>
                {recentEffect && (
                    <EffectFlash effectType={recentEffect} />
                )}
            </AnimatePresence>
        </div>
    );
}

// Particle burst for trigger execution
function TriggerParticles({ triggerType, size }: { triggerType: string; size: number }) {
    const colors = {
        'on-move': 'bg-blue-400',
        'on-is-captured': 'bg-red-400',
        'on-threat': 'bg-orange-400',
        'on-environment': 'bg-green-400',
        'on-var': 'bg-purple-400'
    };

    const color = colors[triggerType as keyof typeof colors] || 'bg-white';
    const particleCount = 10;
    const particles = Array.from({ length: particleCount }, (_, i) => i);

    return (
        <>
            {particles.map((i) => {
                const angle = (i / particleCount) * Math.PI * 2;
                const distance = size * 0.6;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;

                return (
                    <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{
                            x,
                            y,
                            opacity: 0,
                            scale: 0.5
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full ${color} shadow-lg z-30`}
                    />
                );
            })}
        </>
    );
}

// Flash overlay for effect execution
function EffectFlash({ effectType }: { effectType: string }) {
    const colors = {
        'kill': 'bg-red-500',
        'transformation': 'bg-purple-500',
        'modify-var': 'bg-blue-500',
        'cooldown': 'bg-cyan-500',
        'charge': 'bg-yellow-500',
        'mode': 'bg-purple-500',
        'prevent': 'bg-orange-500'
    };

    const color = colors[effectType as keyof typeof colors] || 'bg-white';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 ${color} rounded-lg z-30 mix-blend-overlay`}
        />
    );
}

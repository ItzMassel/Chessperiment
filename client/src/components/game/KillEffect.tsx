"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface KillEffectProps {
    size: number;
    onComplete?: () => void;
}

export default function KillEffect({ size, onComplete }: KillEffectProps) {
    return (
        <motion.div
            className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={onComplete}
        >
            {/* Main Dust Cloud Layers */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={`cloud-${i}`}
                    className="absolute rounded-full blur-2xl"
                    initial={{ scale: 0.1, opacity: 0 }}
                    animate={{
                        scale: [0.1, 1.2 + i * 0.2, 1.6 + i * 0.3],
                        opacity: [0, 0.7 - i * 0.1, 0],
                        x: (i - 1) * 10,
                        y: (i - 1) * 5
                    }}
                    transition={{
                        duration: 0.6 + i * 0.1,
                        ease: "easeOut"
                    }}
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: i === 0 ? 'rgba(168, 162, 158, 0.6)' : i === 1 ? 'rgba(120, 113, 108, 0.4)' : 'rgba(87, 83, 78, 0.3)'
                    }}
                />
            ))}

            {/* Smaller floating particles */}
            {[...Array(10)].map((_, i) => {
                const angle = (i / 10) * Math.PI * 2 + Math.random();
                const distance = size * (0.4 + Math.random() * 0.4);
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;

                return (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-stone-300 dark:bg-stone-500 rounded-full"
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{
                            x: x * 1.8,
                            y: y * 1.8,
                            opacity: [0, 1, 0],
                            scale: [0, 1.2, 0.4],
                            rotate: Math.random() * 360
                        }}
                        transition={{
                            duration: 0.8 + Math.random() * 0.4,
                            delay: Math.random() * 0.1,
                            ease: "easeOut"
                        }}
                    />
                );
            })}

            {/* Quick center flash */}
            <motion.div
                className="absolute w-4 h-4 bg-white rounded-full blur-sm"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 4, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.2 }}
            />

            {/* Exploding lines/debris */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`line-${i}`}
                    className="absolute bg-stone-200 dark:bg-stone-700/50 rounded-full"
                    style={{
                        width: 2,
                        height: size * 0.3,
                        rotate: i * 45
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{
                        scaleY: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        y: [0, i % 2 === 0 ? -20 : 20]
                    }}
                    transition={{
                        duration: 0.5,
                        ease: "circOut"
                    }}
                />
            ))}
        </motion.div>
    );
}

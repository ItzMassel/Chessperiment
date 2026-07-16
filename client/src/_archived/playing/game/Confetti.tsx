"use client";
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6'];

interface ConfettiProps {
    count?: number;
}

export default function Confetti({ count = 50 }: ConfettiProps) {
    const [pieces, setPieces] = useState<any[]>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // percentage
            y: -10, // start above screen
            rotate: Math.random() * 360,
            scale: 0.5 + Math.random(),
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.5,
            duration: 2 + Math.random() * 2
        }));
        setPieces(newPieces);
    }, [count]);

    return (
        <div className="fixed inset-0 pointer-events-none z-60 overflow-hidden">
            {pieces.map((piece) => (
                <motion.div
                    key={piece.id}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{
                        backgroundColor: piece.color,
                        left: `${piece.x}%`,
                        top: '-20px'
                    }}
                    animate={{
                        y: ['0vh', '100vh'],
                        rotate: [piece.rotate, piece.rotate + 360],
                        x: [0, (Math.random() - 0.5) * 200]
                    }}
                    transition={{
                        duration: piece.duration,
                        ease: "easeOut",
                        delay: piece.delay,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2
                    }}
                />
            ))}
        </div>
    );
}

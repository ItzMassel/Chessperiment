'use client';

import { useEffect, useState, useRef } from 'react';
import { db, isConfigured } from '@/lib/firebase-client';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export function WarningSplashModal() {
    const { user, loading } = useAuth();
    const [warning, setWarning] = useState<{ message: string } | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(10);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Subscribe to the user's pendingWarning field in Firestore
    useEffect(() => {
        if (loading || !user?.uid || !db || !isConfigured) return;

        const init = async () => {
            const { doc, onSnapshot } = await import('firebase/firestore');
            const userRef = doc(db as any, 'users', user.uid);
            const unsub = onSnapshot(userRef, (snap: any) => {
                const data = snap.data();
                if (data?.pendingWarning?.message) {
                    setWarning({ message: data.pendingWarning.message });
                    setSecondsLeft(10);
                } else {
                    setWarning(null);
                }
            });
            return unsub;
        };

        const unsubPromise = init();
        return () => { unsubPromise.then(unsub => unsub?.()); };
    }, [user?.uid, loading]);

    // Countdown timer when warning is shown
    useEffect(() => {
        if (!warning) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        setSecondsLeft(10);
        intervalRef.current = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearInterval(intervalRef.current!);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [warning]);

    const handleAcknowledge = async () => {
        if (!user?.uid || secondsLeft > 0 || !db) return;
        try {
            const { doc, updateDoc, deleteField } = await import('firebase/firestore');
            const userRef = doc(db as any, 'users', user.uid);
            await updateDoc(userRef, { pendingWarning: deleteField() });
        } catch (err) {
            console.error('Failed to acknowledge warning:', err);
        }
    };

    if (!warning) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg border-2 border-red-500/60">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">
                                Notice from Chessperiment
                            </h2>
                            <p className="text-xs text-gray-400">From the moderation team</p>
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {warning.message}
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleAcknowledge}
                            disabled={secondsLeft > 0}
                            className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-stone-700 text-white disabled:text-gray-500 dark:disabled:text-stone-400 font-bold text-sm transition-colors disabled:cursor-not-allowed"
                        >
                            {secondsLeft > 0 ? `I understood (${secondsLeft}s)` : 'I understood'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

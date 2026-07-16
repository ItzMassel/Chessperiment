"use client";
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import Board from '../Board';
import { ArrowLeft } from 'lucide-react';

export default function Game() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('Multiplayer');
    const roomId = params.roomId as string;
    const mode = searchParams.get('mode');
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Validate room
        if (!roomId) {
            setError('No room ID provided');
            console.log('No room ID provided');
            setTimeout(() => router.push('/game'), 2000);
            return;
        }

        // Room validation will be handled by SocketComponent
        setIsValidating(false);
    }, [roomId, router]);

    const handleLeaveRoom = () => {
        router.push('/game');
    };

    if (isValidating) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center select-none caret-transparent">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Connecting to room...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
                    <p className="text-gray-600 dark:text-gray-400">Redirecting to lobby...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="relative">
            {/* Leave Room Button */}
            <button
                onClick={handleLeaveRoom}
                className="fixed top-20 left-2 lg:left-4 z-50 flex items-center gap-2 bg-white/90 dark:bg-stone-900/90 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-white px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-base font-bold transition-all shadow-lg backdrop-blur-sm border border-stone-200 dark:border-white/10"
            >
                <ArrowLeft size={16} className="lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">{t('leaveGame')}</span>
                <span className="sm:hidden">{t('leaveGame').split(' ')[0]}</span>
            </button>

            {/* Board Component with room context */}
            <Board
                initialRoomId={roomId}
                gameModeVar={mode === 'computer' ? 'computer' : 'online'}
                mode={mode as any}
            />
        </div>
    );
}

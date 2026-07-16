'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Grid3x3, Crown, Square, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAIAssistantOptional } from '@/context/AIAssistantContext';

export interface ProjectEditorSidebarProps {
    projectId: string;
}

export default function ProjectEditorSidebar({ projectId }: ProjectEditorSidebarProps) {
    const t = useTranslations('EditorSidebar');
    const router = useRouter();
    const pathname = usePathname();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);

    const aiAssistant = useAIAssistantOptional();

    const items = [
        {
            id: 'board',
            icon: Grid3x3,
            label: t('boardEditor'),
            href: `/editor/${projectId}/board-editor`,
        },
        {
            id: 'piece',
            icon: Crown,
            label: t('pieceEditor'),
            href: `/editor/${projectId}/piece-editor`,
        },
        {
            id: 'square',
            icon: Square,
            label: t('squareEditor'),
            href: `/editor/${projectId}/square-editor`,
        },
    ];

    function handleMouseEnter(itemId: string) {
        const timer = setTimeout(() => {
            setHoveredItem(itemId);
        }, 500); // 500ms show delay
        setTooltipTimer(timer);
    }

    function handleMouseLeave() {
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
        }
        setHoveredItem(null); // 0ms hide delay
    }

    return (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-l-lg w-[75px] py-4 z-40 border-l border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
                {items.map((item) => {
                    const isActive = pathname.includes(item.href);
                    const Icon = item.icon;

                    return (
                        <div key={item.id} className="relative">
                            <button
                                onClick={() => router.push(item.href)}
                                onMouseEnter={() => handleMouseEnter(item.id)}
                                onMouseLeave={handleMouseLeave}
                                className={`w-full flex flex-col items-center gap-1 px-3 py-3 transition-colors ${isActive
                                    ? 'text-accent'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent'
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                            </button>

                            {/* Tooltip */}
                            {hoveredItem === item.id && (
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap shadow-lg">
                                    {item.label}
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900 dark:border-l-gray-700"></div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="relative">
                    <button
                        onClick={() => router.push(`/editor/${projectId}/play?mode=local`)}
                        onMouseEnter={() => handleMouseEnter('play')}
                        onMouseLeave={handleMouseLeave}
                        className="w-full flex flex-col items-center gap-1 px-3 py-3 transition-colors text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent"
                    >
                        <Play className="w-6 h-6" />
                    </button>

                    {/* Tooltip */}
                    {hoveredItem === 'play' && (
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap shadow-lg">
                            {t('playButton')}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900 dark:border-l-gray-700"></div>
                        </div>
                    )}
                </div>

                {/* AI Assistant */}
                {aiAssistant && (
                    <>
                        <div className="mx-3 border-t border-gray-200 dark:border-gray-700" />
                        <div className="relative">
                            <button
                                onClick={() => aiAssistant!.togglePanel()}
                                onMouseEnter={() => handleMouseEnter('ai')}
                                onMouseLeave={handleMouseLeave}
                                className={`w-full flex flex-col items-center gap-1 px-3 py-3 transition-colors ${
                                    aiAssistant.isOpen
                                        ? 'text-purple-500'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400'
                                }`}
                            >
                                <Sparkles className="w-6 h-6" />
                            </button>

                            {hoveredItem === 'ai' && (
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap shadow-lg">
                                    {t('aiAssistant')}
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900 dark:border-l-gray-700"></div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

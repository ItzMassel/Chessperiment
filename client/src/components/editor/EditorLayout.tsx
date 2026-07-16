import React from 'react';

interface EditorLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
}

export default function EditorLayout({ children, sidebar }: EditorLayoutProps) {
    return (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-[calc(100vh-64px)] w-full lg:overflow-hidden relative">
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 z-0 opacity-[0.4]"
                style={{
                    backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Main Canvas Area - Infinite feel */}
            <div className="flex-1 overflow-y-auto relative flex flex-col z-10 custom-scrollbar">
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 w-full max-w-7xl mx-auto flex flex-col items-center">
                    {children}
                </div>
            </div>

            {/* Sidebar Panel */}
            <div className="w-full lg:w-96 bg-islands border-t lg:border-t-0 lg:border-l border-gray-200 shadow-xl z-20 flex flex-col order-last shrink-0 h-auto lg:h-full">
                {sidebar}
            </div>
        </div>
    );
}

// app/providers.tsx
"use client";

import React from 'react';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from 'sonner';
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SocketProvider>
            {children}
            <Toaster />
        </SocketProvider>
    );
}

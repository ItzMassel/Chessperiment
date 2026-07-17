// app/providers.tsx
"use client";

import React from 'react';
import { SocketProvider } from '@/context/SocketContext';
import { ServerWakeupProvider } from '@/context/ServerWakeupContext';
import { Toaster } from 'sonner';
import { VisitorTracker } from '@/components/VisitorTracker';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SocketProvider>
            <ServerWakeupProvider>
                <VisitorTracker />
                {children}
                <Toaster />
            </ServerWakeupProvider>
        </SocketProvider>
    );
}

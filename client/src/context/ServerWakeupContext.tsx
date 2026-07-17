"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ServerWakeupModal } from "@/components/ServerWakeupModal";

interface ServerWakeupContextValue {
    requireServer: () => boolean;
}

const ServerWakeupContext = createContext<ServerWakeupContextValue | null>(null);

export function ServerWakeupProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const requireServer = useCallback(() => {
        setIsOpen(true);
        return false;
    }, []);

    return (
        <ServerWakeupContext.Provider value={{ requireServer }}>
            {children}
            <ServerWakeupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </ServerWakeupContext.Provider>
    );
}

export function useServerWakeup() {
    const ctx = useContext(ServerWakeupContext);
    if (!ctx) {
        throw new Error("useServerWakeup must be used within ServerWakeupProvider");
    }
    return ctx;
}

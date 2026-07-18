import { MaintenanceOverlay } from '@/components/game/MaintenanceOverlay';
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TEMPORARY: Multiplayer is being patched. Set NEXT_PUBLIC_MAINTENANCE_MODE=true to disable.
    const isMaintenanceMode = true;

    return (
        <>
            {isMaintenanceMode && <MaintenanceOverlay />}
            <div className={isMaintenanceMode ? "pointer-events-none select-none blur-sm transition-all duration-700" : ""}>
                {children}
            </div>
        </>
    );
}

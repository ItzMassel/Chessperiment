import { MaintenanceOverlay } from '@/components/game/MaintenanceOverlay';
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check maintenance mode environment variable
    // We use process.env here. NEXT_PUBLIC prefix allows access on client if needed, 
    // but in a server component (like this layout) we can also just use the server-side env.
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' ||
        process.env.NEXT_PUBLIC_MAINTENANCE_MODE === '1';

    return (
        <>
            {isMaintenanceMode && <MaintenanceOverlay />}
            <div className={isMaintenanceMode ? "pointer-events-none select-none blur-sm transition-all duration-700" : ""}>
                {children}
            </div>
        </>
    );
}

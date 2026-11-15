'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { User as NextAuthUser } from 'next-auth';

// Extend User type to include uid for backwards compatibility with code that
// used to read the Firebase UID off the user object.
export interface User extends NextAuthUser {
    uid: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    const user = useMemo(() => {
        if (!session?.user) return null;
        return {
            ...session.user,
            uid: (session.user as any).id || (session.user as any).uid || session.user.email || '',
        } as User;
    }, [session?.user]);

    const value: AuthContextType = useMemo(() => ({
        user,
        loading: status === 'loading',
    }), [user, status]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { User as NextAuthUser } from 'next-auth';
import { auth, isConfigured } from '@/lib/firebase-client';

// Extend User type to include uid for Firebase compatibility
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
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [firebaseLoading, setFirebaseLoading] = useState(isConfigured);

    useEffect(() => {
        if (!isConfigured || !auth) {
            setFirebaseLoading(false);
            return;
        }
        let unsubscribe: (() => void) | undefined;
        const init = async () => {
            const { onAuthStateChanged } = await import('firebase/auth');
            unsubscribe = onAuthStateChanged(auth as any, (user) => {
                setFirebaseUser(user);
                setFirebaseLoading(false);
            });
        };
        init();
        return () => unsubscribe?.();
    }, []);

    // Determine the user object
    const user = useMemo(() => {
        let u: User | null = null;
        if (session?.user) {
            u = {
                ...session.user,
                uid: (session.user as any).id || (session.user as any).uid || session.user.email || '',
            } as User;
        } else if (firebaseUser) {
            u = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || null,
                email: firebaseUser.email || null,
                image: firebaseUser.photoURL || null,
            } as User;
        }
        return u;
    }, [session?.user, firebaseUser]);

    const value: AuthContextType = useMemo(() => ({
        user,
        loading: status === 'loading' || firebaseLoading,
    }), [user, status, firebaseLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

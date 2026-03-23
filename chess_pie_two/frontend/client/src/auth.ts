// Force Turbopack Rebuild - Timestamp: 2026-03-15
import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { db } from "@/lib/firebase-admin"
import { authConfig } from "./auth.config"

import Credentials from "next-auth/providers/credentials"
import { adminAuth } from "@/lib/firebase-admin"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: db ? FirestoreAdapter(db) : undefined,
    ...authConfig,
    providers: [
        ...(authConfig.providers || []),
        Credentials({
            name: "Credentials",
            credentials: {
                idToken: { label: "ID Token", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.idToken || !adminAuth) return null;
                try {
                    const decodedToken = await adminAuth.verifyIdToken(credentials.idToken as string);
                    return {
                        id: decodedToken.uid,
                        name: decodedToken.name || decodedToken.email?.split('@')[0],
                        email: decodedToken.email,
                        image: decodedToken.picture
                    };
                } catch (error) {
                    console.error("Error verifying ID token", error);
                    return null;
                }
            }
        })
    ],
    debug: process.env.NODE_ENV === "development",
})



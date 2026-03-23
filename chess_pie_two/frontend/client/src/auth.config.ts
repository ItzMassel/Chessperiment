
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        })
    ],
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // When user logs in, store their id in the token
                token.sub = user.id || token.sub;
                // Also store id directly for backup
                token.id = user.id;
                console.log('🔑 JWT token created/updated:', { sub: token.sub, id: token.id, email: token.email });
            }
            return token;
        },
        session({ session, token }) {
            console.log('📋 Session callback:', { tokenSub: token.sub, tokenId: token.id, sessionUserId: session.user?.id });
            if (session.user) {
                // Ensure user.id is set from token - try sub first, then id field
                session.user.id = (token.sub || token.id || session.user.id) as string;
                console.log('✅ Session user.id set to:', session.user.id);
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig

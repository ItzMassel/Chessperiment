import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import bcrypt from "bcryptjs"
import { getDb } from "@/db"
import { users, accounts, sessions, verificationTokens } from "@/db/schema"
import { getUserByEmail, upsertMigratedUser } from "@/db/users"
import { verifyLegacyFirebasePassword } from "@/lib/firebase-legacy-auth"
import { authConfig } from "./auth.config"

import Credentials from "next-auth/providers/credentials"

// @auth/drizzle-adapter does `instanceof`-style checks on the db instance, which
// the lazily-connecting proxy exported as `db` from "@/db" can't satisfy (its
// target is a plain `{}` until first query) — so it needs the real instance,
// built only when a connection string is actually configured (e.g. not during
// the dependency-free CI build check, which has no database available).
const authDb = process.env.SUPABASE_DB_URL ? getDb() : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: authDb ? DrizzleAdapter(authDb, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }) : undefined,
    ...authConfig,
    providers: [
        ...(authConfig.providers || []),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const password = credentials?.password as string | undefined;
                if (!email || !password) return null;

                try {
                    const user = await getUserByEmail(email);

                    if (user?.passwordHash) {
                        const valid = await bcrypt.compare(password, user.passwordHash);
                        if (!valid) return null;
                        return { id: user.id, name: user.name, email: user.email, image: user.image };
                    }

                    // Not yet migrated locally (or never signed up here) — fall back to
                    // verifying against Firebase once, then migrate them permanently.
                    const legacy = await verifyLegacyFirebasePassword(email, password);
                    if (!legacy) return null;

                    const passwordHash = await bcrypt.hash(password, 10);
                    const migrated = await upsertMigratedUser(legacy.uid, legacy.email, passwordHash, user?.name ?? legacy.displayName);
                    return { id: migrated.id, name: migrated.name, email: migrated.email, image: migrated.image };
                } catch (error) {
                    console.error("Credentials authorize error:", error);
                    return null;
                }
            }
        })
    ],
    debug: process.env.NODE_ENV === "development",
})

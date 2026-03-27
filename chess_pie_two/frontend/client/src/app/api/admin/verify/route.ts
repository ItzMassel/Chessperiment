import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

// In-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function checkAttempt(ip: string): { allowed: boolean; remainingMs?: number } {
    const now = Date.now();
    const entry = attempts.get(ip);

    if (entry) {
        if (now < entry.lockedUntil) {
            return { allowed: false, remainingMs: entry.lockedUntil - now };
        }
        if (entry.count >= MAX_ATTEMPTS) {
            // First request after lockout expires — reset
            attempts.delete(ip);
        }
    }

    return { allowed: true };
}

function recordFailedAttempt(ip: string) {
    const now = Date.now();
    const entry = attempts.get(ip);
    const count = (entry?.count ?? 0) + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0;
    attempts.set(ip, { count, lockedUntil });
}

function resetAttempts(ip: string) {
    attempts.delete(ip);
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const { allowed, remainingMs } = checkAttempt(ip);
    if (!allowed) {
        const minutes = Math.ceil((remainingMs ?? 0) / 60000);
        return NextResponse.json(
            { error: `Too many attempts. Try again in ${minutes} minute(s).` },
            { status: 429 }
        );
    }

    let body: { password?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { password } = body;
    if (!password || typeof password !== "string") {
        return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
        console.error("ADMIN_PASSWORD_HASH env var not set");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
        recordFailedAttempt(ip);
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    resetAttempts(ip);
    const token = await signAdminToken();

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
}

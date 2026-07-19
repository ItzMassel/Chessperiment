import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return true;
    }
    if (entry.count >= 5) return false;
    entry.count++;
    return true;
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body: { type?: string; message?: string; email?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { type, message, email = "" } = body;

    if (!["bug", "feature", "general"].includes(type ?? "")) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length < 5) {
        return NextResponse.json({ error: "Message too short" }, { status: 400 });
    }
    if (message.length > 2000) {
        return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    try {
        const { db } = await import('@/db');
        const { communityFeedback } = await import('@/db/schema');
        await db.insert(communityFeedback).values({
            type: type!,
            message: message.trim(),
            email: email.trim(),
            status: 'new',
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving community feedback:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

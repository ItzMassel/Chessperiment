import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Allowlist of valid event names — add new ones here as needed
const VALID_EVENTS = new Set([
  "play_game",
  "open_piece_editor",
  "open_rules_editor",
  "open_square_editor",
  "open_marketplace",
  "new_visitor",
  "new_session",
]);

// Simple in-memory rate limiter — max 20 events per IP per minute
// (protects against accidental loops, not determined attackers)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limit — IP is only used here and never stored
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let event: string;
  try {
    const body = await req.json();
    event = body?.event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!event || !VALID_EVENTS.has(event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  if (!adminDb) {
    // Firebase not configured (e.g. local dev without env vars) — fail silently
    return NextResponse.json({ ok: true });
  }

  try {
    if (event === "new_visitor" || event === "new_session") {
      const updates: Record<string, ReturnType<typeof FieldValue.increment>> = {};
      if (event === "new_visitor") updates.unique_visitors = FieldValue.increment(1);
      if (event === "new_session") updates.total_sessions = FieldValue.increment(1);

      await adminDb
        .collection("analytics")
        .doc("visitors")
        .set(updates, { merge: true });
    } else {
      await adminDb
        .collection("analytics")
        .doc("button_clicks")
        .set({ [event]: FieldValue.increment(1) }, { merge: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track] Firestore error:", err);
    // Don't surface errors to the client
    return NextResponse.json({ ok: true });
  }
}

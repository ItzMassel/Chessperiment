import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

const VALID_EVENTS = new Set([
  "play_game",
  "open_piece_editor",
  "open_rules_editor",
  "open_square_editor",
  "open_marketplace",
  "new_visitor",
  "new_session",
]);

const VISITOR_LIMIT = 10;
const CLICK_LIMIT = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function hashId(id: string): string {
  return crypto.createHash("sha256").update(id).digest("hex");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  let body: { event?: string; visitorId?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, visitorId, sessionId } = body;

  if (!event || !VALID_EVENTS.has(event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const isVisitorEvent = event === "new_visitor" || event === "new_session";
  if (!checkRateLimit(ip, isVisitorEvent ? VISITOR_LIMIT : CLICK_LIMIT)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!adminDb) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (isVisitorEvent) {
      const visitorHash = visitorId ? hashId(visitorId) : null;
      const sessionHash = sessionId ? hashId(sessionId) : null;
      const today = todayStr();

      if (event === "new_visitor" && visitorHash) {
        const summaryRef = adminDb.collection("analytics").doc("summary");
        const visitorRef = adminDb.collection("analytics")
          .doc("visitors_data").collection("ids").doc(visitorHash);
        const dailyRef = adminDb.collection("analytics")
          .doc("daily_data").collection("stats").doc(today);
        const dailyVisitorRef = adminDb.collection("analytics")
          .doc("daily_visitor_data").collection("by_date").doc(today)
          .collection("ids").doc(visitorHash);

        await adminDb.runTransaction(async (tx) => {
          const doc = await tx.get(visitorRef);
          if (!doc.exists) {
            tx.set(visitorRef, {
              first_seen: FieldValue.serverTimestamp(),
              last_seen: FieldValue.serverTimestamp(),
              session_count: 0,
            });
            tx.set(summaryRef, {
              total_unique_visitors: FieldValue.increment(1),
            }, { merge: true });
          } else {
            tx.update(visitorRef, { last_seen: FieldValue.serverTimestamp() });
          }
        });

        try {
          await dailyVisitorRef.create({ visited_at: FieldValue.serverTimestamp() });
          await dailyRef.set({ unique_count: FieldValue.increment(1) }, { merge: true });
        } catch (e: unknown) {
          if ((e as { code?: number }).code !== 6) throw e;
        }
      }

      if (event === "new_session" && sessionHash && visitorHash) {
        const summaryRef = adminDb.collection("analytics").doc("summary");
        const sessionRef = adminDb.collection("analytics")
          .doc("sessions_data").collection("ids").doc(sessionHash);
        const dailyRef = adminDb.collection("analytics")
          .doc("daily_data").collection("stats").doc(today);
        const dailyVisitorRef = adminDb.collection("analytics")
          .doc("daily_visitor_data").collection("by_date").doc(today)
          .collection("ids").doc(visitorHash);
        const visitorRef = adminDb.collection("analytics")
          .doc("visitors_data").collection("ids").doc(visitorHash);

        try {
          await sessionRef.create({ visitor_hash: visitorHash, started_at: FieldValue.serverTimestamp() });
        } catch (e: unknown) {
          if ((e as { code?: number }).code === 6) {
            return NextResponse.json({ ok: true });
          }
          throw e;
        }

        const visitorDoc = await visitorRef.get();
        if (!visitorDoc.exists) {
          await visitorRef.set({
            first_seen: FieldValue.serverTimestamp(),
            last_seen: FieldValue.serverTimestamp(),
            session_count: 1,
          });
          await summaryRef.set({ total_unique_visitors: FieldValue.increment(1) }, { merge: true });
        } else {
          await visitorRef.update({ session_count: FieldValue.increment(1) });
        }

        await summaryRef.set({ total_sessions: FieldValue.increment(1) }, { merge: true });
        await dailyRef.set({ total_sessions: FieldValue.increment(1) }, { merge: true });

        try {
          await dailyVisitorRef.create({ visited_at: FieldValue.serverTimestamp() });
          await dailyRef.set({ unique_count: FieldValue.increment(1) }, { merge: true });
        } catch (e: unknown) {
          if ((e as { code?: number }).code !== 6) throw e;
        }
      }

      return NextResponse.json({ ok: true });
    }

    await adminDb
      .collection("analytics")
      .doc("button_clicks")
      .set({ [event]: FieldValue.increment(1) }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track] Firestore error:", err);
    return NextResponse.json({ ok: true });
  }
}

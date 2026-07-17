import { auth } from "@/auth";
import { NextRequest } from "next/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function ratelimitKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  req: NextRequest,
  maxRequests: number,
  windowMs: number
): boolean {
  const key = ratelimitKey(req);
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function requireAuth(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt + 60000) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

import { eq } from 'drizzle-orm';
import { db } from './index';
import { users, passwordResetTokens } from './schema';
import { randomUUID, randomBytes, createHash } from 'crypto';

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  passwordHash: string | null;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createUserWithPassword(email: string, passwordHash: string, name?: string | null): Promise<AppUser> {
  const [row] = await db.insert(users).values({
    id: randomUUID(),
    email: email.toLowerCase(),
    name: name ?? null,
    passwordHash,
  }).returning();
  return row;
}

export async function setUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

/**
 * Upserts a user lazily migrated from Firebase, preserving their original
 * Firebase UID as id. Some users have both a Google-OAuth identity (migrated
 * from the old Firestore adapter, with its own id) and a Firebase Auth
 * email/password identity under the same email — since `email` is unique,
 * we treat the email as the real identity and attach the password to
 * whichever row already owns that email, rather than failing on conflict.
 */
export async function upsertMigratedUser(firebaseUid: string, email: string, passwordHash: string, name?: string | null): Promise<AppUser> {
  const normalizedEmail = email.toLowerCase();

  const existingByEmail = await getUserByEmail(normalizedEmail);
  if (existingByEmail) {
    const [row] = await db.update(users).set({ passwordHash }).where(eq(users.id, existingByEmail.id)).returning();
    return row;
  }

  const existingById = await getUserById(firebaseUid);
  if (existingById) {
    const [row] = await db.update(users).set({ passwordHash, email: normalizedEmail }).where(eq(users.id, firebaseUid)).returning();
    return row;
  }

  const [row] = await db.insert(users).values({
    id: firebaseUid,
    email: normalizedEmail,
    name: name ?? null,
    passwordHash,
  }).returning();
  return row;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Returns the raw (unhashed) token to email to the user; only its hash is stored. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await db.insert(passwordResetTokens).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
  const row = rows[0];
  if (!row) return null;
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.userId;
}

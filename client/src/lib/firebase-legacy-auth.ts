import 'server-only';

/**
 * Transitional helper for migrating off Firebase Auth. Existing users' password
 * hashes use Firebase's proprietary modified-Scrypt variant, which isn't
 * practically portable without their project's private signer key. Instead of
 * forcing every existing user to reset their password, we verify once against
 * Firebase's REST API (the public Web API key only — no admin credentials
 * needed) and lazily migrate them to a local bcrypt hash on success. Once a
 * user has a local passwordHash, this is never called again for them.
 *
 * Safe to delete, along with FIREBASE_LEGACY_WEB_API_KEY, once essentially all
 * users have logged in at least once since the cutover.
 */
export async function verifyLegacyFirebasePassword(email: string, password: string): Promise<{ uid: string; email: string; displayName: string | null } | null> {
  const apiKey = process.env.FIREBASE_LEGACY_WEB_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { uid: data.localId, email: data.email, displayName: data.displayName || null };
  } catch (error) {
    console.error('Legacy Firebase verification failed:', error);
    return null;
  }
}

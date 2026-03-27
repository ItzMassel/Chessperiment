import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const JWT_SECRET = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET ?? "changeme-set-ADMIN_JWT_SECRET-in-env"
);
const TOKEN_TTL = "8h";

export async function signAdminToken(): Promise<string> {
    return new SignJWT({ role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(TOKEN_TTL)
        .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.role === "admin";
    } catch {
        return false;
    }
}

export async function getAdminCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
    const token = await getAdminCookie();
    if (!token) return false;
    return verifyAdminToken(token);
}

export { COOKIE_NAME };

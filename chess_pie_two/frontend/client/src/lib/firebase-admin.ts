import 'server-only';
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
        if (process.env.NEXT_PHASE === 'phase-production-build') {
            console.log("FIREBASE_PRIVATE_KEY not available during build (this is normal if not provided as build secret)");
        } else {
            console.warn("FIREBASE_PRIVATE_KEY is not set");
        }
        return null;
    }

    // Defensive parsing for Vercel/Docker env vars
    const formattedKey = privateKey
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n');

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey,
        }),
    });
}

const app = getFirebaseAdminApp();
if (app) {
    console.log("Firebase Admin initialized successfully");
} else {
    console.warn("Firebase Admin failed to initialize (check env vars)");
}

export const db = app ? getFirestore(app) : null;
export const adminAuth = app ? getAuth(app) : null;


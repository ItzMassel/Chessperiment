import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
export const isConfigured = missingKeys.length === 0;

let auth: ReturnType<typeof getAuth> | null = null;

if (isConfigured) {
    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        console.log('[Firebase] Initialized for project:', firebaseConfig.projectId);
    } catch (e) {
        console.warn('[Firebase] Failed to initialize:', e);
    }
} else {
    console.warn(`[Firebase] Missing keys: ${missingKeys.join(', ')} — running in offline-only mode`);
}

export { auth };

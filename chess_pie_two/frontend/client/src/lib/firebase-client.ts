import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate config presence
const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
    console.error(`[Firebase] Missing configuration keys: ${missingKeys.join(', ')}`);
} else {
    console.log('[Firebase] Configuration present for:', firebaseConfig.projectId);
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance (client-side SDK)
// Get Firestore instance (client-side SDK)
export const db = getFirestore(app);

// Get Auth instance
import { getAuth } from "firebase/auth";
export const auth = getAuth(app);

// Get Storage instance
import { getStorage } from "firebase/storage";
export const storage = getStorage(app);

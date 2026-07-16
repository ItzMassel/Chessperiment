import { db as firestoreDb, isConfigured } from "@/lib/firebase-client";

const db = isConfigured ? firestoreDb : null;

function requireDb() {
    if (!db) {
        throw new Error('Firestore is not configured');
    }
    return db;
}

export interface Feature {
    id: string;
    date: string; // "YYYY-MM-DD"
    title: string;
    description: string;
    done: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CommunityFeedback {
    id: string;
    type: "bug" | "feature" | "general";
    message: string;
    email: string;
    status: "new" | "seen" | "resolved";
    createdAt: Date;
}

// ─── Features ──────────────────────────────────────────────────────────────

export async function getFeatures(): Promise<Feature[]> {
    requireDb();
    const { collection, query, orderBy, getDocs, Timestamp } = await import('firebase/firestore');
    const q = query(collection(db!, "features"), orderBy("date", "desc"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            date: data.date,
            title: data.title,
            description: data.description,
            done: data.done ?? false,
            order: data.order ?? 0,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        };
    });
}

export async function addFeature(feature: Omit<Feature, "id" | "createdAt" | "updatedAt">): Promise<string> {
    requireDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const ref = await addDoc(collection(db!, "features"), {
        ...feature,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateFeature(id: string, updates: Partial<Omit<Feature, "id" | "createdAt">>): Promise<void> {
    requireDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    await updateDoc(doc(db!, "features", id), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteFeature(id: string): Promise<void> {
    requireDb();
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db!, "features", id));
}

// ─── Community Feedback ────────────────────────────────────────────────────

export async function addCommunityFeedback(feedback: Omit<CommunityFeedback, "id" | "createdAt" | "status">): Promise<string> {
    requireDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const ref = await addDoc(collection(db!, "community_feedback"), {
        ...feedback,
        status: "new",
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function getCommunityFeedback(): Promise<CommunityFeedback[]> {
    requireDb();
    const { collection, query, orderBy, getDocs, Timestamp } = await import('firebase/firestore');
    const q = query(collection(db!, "community_feedback"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            type: data.type,
            message: data.message,
            email: data.email ?? "",
            status: data.status ?? "new",
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        };
    });
}

export async function updateFeedbackStatus(id: string, status: CommunityFeedback["status"]): Promise<void> {
    requireDb();
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db!, "community_feedback", id), { status });
}

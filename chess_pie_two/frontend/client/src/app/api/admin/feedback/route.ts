import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

async function authenticate(req: NextRequest): Promise<boolean> {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyAdminToken(token);
}

// GET /api/admin/feedback
export async function GET(req: NextRequest) {
    if (!(await authenticate(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminDb) return NextResponse.json({ error: "Server error" }, { status: 500 });

    const snap = await adminDb
        .collection("community_feedback")
        .orderBy("createdAt", "desc")
        .get();

    const feedback = snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        };
    });

    return NextResponse.json({ feedback });
}

// PATCH /api/admin/feedback — update status
export async function PATCH(req: NextRequest) {
    if (!(await authenticate(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminDb) return NextResponse.json({ error: "Server error" }, { status: 500 });

    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (!["new", "seen", "resolved"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await adminDb.collection("community_feedback").doc(id).update({ status });
    return NextResponse.json({ success: true });
}

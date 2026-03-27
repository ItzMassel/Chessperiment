import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

async function authenticate(req: NextRequest): Promise<boolean> {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyAdminToken(token);
}

// GET /api/admin/features
export async function GET(req: NextRequest) {
    if (!(await authenticate(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminDb) return NextResponse.json({ error: "Server error" }, { status: 500 });

    const snap = await adminDb
        .collection("features")
        .orderBy("date", "desc")
        .orderBy("order", "asc")
        .get();

    const features = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ features });
}

// POST /api/admin/features — create
export async function POST(req: NextRequest) {
    if (!(await authenticate(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminDb) return NextResponse.json({ error: "Server error" }, { status: 500 });

    const body = await req.json();
    const { date, title, description, order = 0 } = body;

    if (!date || !title || !description) {
        return NextResponse.json({ error: "date, title and description are required" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    const ref = await adminDb.collection("features").add({
        date,
        title: title.trim(),
        description: description.trim(),
        done: false,
        order: Number(order),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id }, { status: 201 });
}

// PATCH /api/admin/features — update
export async function PATCH(req: NextRequest) {
    if (!(await authenticate(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminDb) return NextResponse.json({ error: "Server error" }, { status: 500 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Whitelist updatable fields
    const allowed = ["date", "title", "description", "done", "order"];
    const sanitized: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const key of allowed) {
        if (key in updates) sanitized[key] = updates[key];
    }

    await adminDb.collection("features").doc(id).update(sanitized);
    return NextResponse.json({ success: true });
}

// DELETE /api/admin/features
export async function DELETE(req: NextRequest) {
    if (!(await authenticate(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminDb) return NextResponse.json({ error: "Server error" }, { status: 500 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await adminDb.collection("features").doc(id).delete();
    return NextResponse.json({ success: true });
}

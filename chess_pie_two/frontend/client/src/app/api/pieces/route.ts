import {
    NextResponse
} from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const piece = searchParams.get('piece');
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!piece) {
        return NextResponse.json({ error: "Missing piece" }, { status: 400 });
    }

    try {
        const { db } = await import("@/lib/firebase-admin");
        const pieceRef = db?.collection("pieces").doc(`${userId}_${piece}`);
        const doc = await pieceRef?.get();

        if (!doc?.exists) {
            return NextResponse.json({ error: "Piece not found" }, { status: 404 });
        }

        return NextResponse.json(doc.data());
    } catch (error) {
        console.error("Error fetching piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { db } = await import("@/lib/firebase-admin");
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { pieceType, color, pixels } = await req.json();

    const validPieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const validColors = ['white', 'black'];

    if (!pieceType || !color || !pixels) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!validPieceTypes.includes(pieceType)) {
        return NextResponse.json({ error: "Invalid piece type" }, { status: 400 });
    }

    if (!validColors.includes(color)) {
        return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }

    try {
        const pieceRef = db?.collection("pieces").doc(`${userId}_${pieceType}_${color}`);
        await pieceRef?.set({
            userId,
            pieceType,
            color,
            pixels,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

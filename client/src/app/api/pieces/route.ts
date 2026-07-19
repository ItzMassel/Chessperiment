import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pixelPieces } from "@/db/schema";
import { eq } from "drizzle-orm";

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
        const rows = await db.select().from(pixelPieces).where(eq(pixelPieces.id, `${userId}_${piece}`)).limit(1);
        if (rows.length === 0) {
            return NextResponse.json({ error: "Piece not found" }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error fetching piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
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
        const id = `${userId}_${pieceType}_${color}`;
        await db.insert(pixelPieces).values({
            id,
            userId,
            pieceType,
            color,
            pixels,
        }).onConflictDoUpdate({
            target: pixelPieces.id,
            set: { pixels, updatedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

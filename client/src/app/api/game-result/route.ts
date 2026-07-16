import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { saveGameResult } from "@/lib/firestore"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { result, roomId, timestamp } = body

        if (!result || !["win", "loss", "draw"].includes(result)) {
            return NextResponse.json(
                { error: "Invalid result" },
                { status: 400 }
            )
        }

        await saveGameResult({
            userId: session.user.id,
            result: result as "win" | "loss" | "draw",
            timestamp: new Date(timestamp),
            roomId,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving game result:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

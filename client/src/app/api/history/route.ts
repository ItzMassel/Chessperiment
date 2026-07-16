import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserGameHistory } from "@/lib/firestore"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "10")

        const history = await getUserGameHistory(session.user.id, limit)

        return NextResponse.json(history)
    } catch (error) {
        console.error("Error fetching game history:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserStats } from "@/lib/firestore"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const stats = await getUserStats(session.user.id)

        if (!stats) {
            // Return default stats if user has no games yet
            return NextResponse.json({
                userId: session.user.id,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                rating: 1500,
            })
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error("Error fetching user stats:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

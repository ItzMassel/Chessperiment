import { NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const summaryDoc = await adminDb.collection("analytics").doc("summary").get();
    const summary = summaryDoc.data() ?? {};

    const totalUniqueVisitors = (summary.total_unique_visitors as number) ?? 0;
    const totalSessions = (summary.total_sessions as number) ?? 0;

    const dailySnapshot = await adminDb
      .collection("analytics").doc("daily_data").collection("stats")
      .orderBy("__name__", "desc")
      .limit(90)
      .get();

    const daily = dailySnapshot.docs.map((doc) => ({
      date: doc.id,
      uniqueVisitors: (doc.data().unique_count as number) ?? 0,
      sessions: (doc.data().total_sessions as number) ?? 0,
    }));

    const visitorsSnapshot = await adminDb
      .collection("analytics").doc("visitors_data").collection("ids")
      .get();

    let sumSessionCount = 0;
    let returningCount = 0;
    visitorsSnapshot.docs.forEach((doc) => {
      const sc = (doc.data().session_count as number) ?? 0;
      sumSessionCount += sc;
      if (sc > 1) returningCount++;
    });

    const visitorCountForAvg = totalUniqueVisitors || visitorsSnapshot.docs.length;
    const avgSessionsPerVisitor =
      visitorCountForAvg > 0
        ? Math.round((sumSessionCount / visitorCountForAvg) * 100) / 100
        : 0;
    const returnRate =
      visitorCountForAvg > 0
        ? Math.round((returningCount / visitorCountForAvg) * 10000) / 10000
        : 0;

    return NextResponse.json({
      totalUniqueVisitors,
      totalSessions,
      returnRate,
      avgSessionsPerVisitor,
      daily,
    });
  } catch (err) {
    console.error("[analytics/stats] error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    logger.info("History GET requested");
    const db = await getDB();
    const transcripts = await db
      .collection("transcripts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Convert _id to string for JSON serialization
    const formattedTranscripts = transcripts.map((doc) => ({
      _id: doc._id.toString(),
      text: doc.text,
      actions: doc.actions,
      mood: doc.mood,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({ transcripts: formattedTranscripts });
  } catch (err) {
    logger.error(err, "History API error");
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

const SYSTEM_PROMPT = `Extract action items from the following meeting transcript.

Return ONLY a valid JSON array in this exact format (no other text, no markdown):
[
  {
    "task": "short task description",
    "owner": "person responsible or null",
    "dueDate": "YYYY-MM-DD if mentioned, otherwise null"
  }
]`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Missing or empty text" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}\n\n---\n\n${text}`,
    });

    let rawText = response.text ?? "";
    if (!rawText) {
      return NextResponse.json({ actions: [] });
    }

    // Remove markdown code fence if present
    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let actions: Array<{ task: string; owner: string | null; dueDate: string | null }>;
    try {
      const parsed = JSON.parse(rawText);
      actions = Array.isArray(parsed) ? parsed : [];
    } catch {
      actions = [];
    }

    // Add status to each action
    const actionsWithStatus = actions.map((action) => ({
      ...action,
      status: "open" as const,
    }));

    // Save to MongoDB
    const db = await getDB();
    const document = {
      text,
      actions: actionsWithStatus,
      createdAt: new Date(),
    };

    const result = await db.collection("transcripts").insertOne(document);

    const savedDocument = {
      _id: result.insertedId.toString(),
      ...document,
    };

    return NextResponse.json(savedDocument);
  } catch (err) {
    console.error("Transcript API error:", err);
    return NextResponse.json(
      { error: "Failed to process transcript" },
      { status: 500 }
    );
  }
}

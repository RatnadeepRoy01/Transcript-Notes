import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { logger } from "@/lib/logger";

interface ActionItem {
  task: string;
  owner: string | null;
  dueDate: string | null;
  status: "open" | "done";
  priority?: string | null;
}

interface MoodAnalysis {
  overall: "positive" | "neutral" | "negative";
  score: number; // 0-100, 0 = most negative, 50 = neutral, 100 = most positive
}

interface Transcript {
  _id: ObjectId;
  text: string;
  actions: ActionItem[];
  mood: MoodAnalysis;
  createdAt: Date;
}

const PRIORITY_VALUES = new Set(["high", "medium", "low"]);

function parseAndValidateId(id: string) {
  if (!id) {
    throw new Error("Missing id");
  }
  try {
    return new ObjectId(id);
  } catch {
    throw new Error("Invalid id");
  }
}

function formatResponse(doc: Transcript) {
  return {
    _id: doc._id.toString(),
    text: doc.text,
    actions: doc.actions ?? [],
    mood: doc.mood,
    createdAt: doc.createdAt,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info({ id }, "Transcript GET requested");

    const objectId = parseAndValidateId(id);
    const db = await getDB();
    const doc = await db.collection("transcripts").findOne({ _id: objectId });

    if (!doc) {
      logger.warn({ id }, "Transcript not found");
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    return NextResponse.json(formatResponse(doc as Transcript));
  } catch (err) {
    logger.error(err, "Transcript GET error");

    if (err instanceof Error && (err.message === "Missing id" || err.message === "Invalid id")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to fetch transcript" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info({ id }, "Transcript PATCH requested");

    const objectId = parseAndValidateId(id);
    const body = await request.json();

    // Build and validate updates
    const updates: { text?: string; actions?: ActionItem[] } = {};

    if (typeof body.text === "string") {
      updates.text = body.text.trim();
    }

    if (Array.isArray(body.actions)) {
      updates.actions = body.actions.map((action: ActionItem) => ({
        task: action.task ? String(action.task) : "",
        owner: action.owner ? String(action.owner) : null,
        dueDate: action.dueDate ? String(action.dueDate) : null,
        status: action.status === "done" ? "done" : "open",
        priority:
          action.priority && PRIORITY_VALUES.has(String(action.priority))
            ? String(action.priority)
            : null,
      }));
    }

    if (Object.keys(updates).length === 0) {
      logger.warn({ id }, "No updates provided");
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update document
    const db = await getDB();
    const result = await db.collection("transcripts").findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      logger.warn({ id }, "Transcript not found for update");
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    logger.info({ id }, "Transcript updated");
    return NextResponse.json(formatResponse(result as Transcript));
  } catch (err) {
    logger.error(err, "Transcript PATCH error");

    if (err instanceof Error && (err.message === "Missing id" || err.message === "Invalid id")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update transcript" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const PRIORITY_VALUES = new Set(["high", "medium", "low"]);

type ActionItem = {
  task: string;
  owner: string | null;
  dueDate: string | null;
  status: "open" | "done";
  priority?: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const db = await getDB();
    const doc = await db.collection("transcripts").findOne({ _id: objectId });

    if (!doc) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: doc._id.toString(),
      text: doc.text,
      actions: doc.actions ?? [],
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("Transcript GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const updates: { text?: string; actions?: ActionItem[] } = {};

    if (typeof body.text === "string") {
      updates.text = body.text.trim();
    }
   
    if (Array.isArray(body.actions)) {
      updates.actions = body.actions.map((a: ActionItem) => ({
      task: a.task ? String(a.task) : "",           
      owner: a.owner ? String(a.owner) : null,       
      dueDate: a.dueDate ? String(a.dueDate) : null,
      status: a.status === "done" ? "done" : "open",
      priority: a.priority && PRIORITY_VALUES.has(String(a.priority))
        ? String(a.priority)
        : null,                                     
      }));
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const db = await getDB();
    const result = await db.collection("transcripts").findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: "after" }
    );
    
    if (!result) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    const doc = result as { _id: ObjectId; text: string; actions: ActionItem[]; createdAt: Date };
    return NextResponse.json({
      _id: doc._id.toString(),
      text: doc.text,
      actions: doc.actions ?? [],
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("Transcript PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update transcript" },
      { status: 500 }
    );
  }
}

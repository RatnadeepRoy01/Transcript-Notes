import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { GoogleGenAI } from "@google/genai";

export type StatusCheck = {
  status: "ok" | "error";
  message?: string;
};

export async function GET() {
  const result: {
    backend: StatusCheck;
    database: StatusCheck;
    llm: StatusCheck;
  } = {
    backend: { status: "ok" },
    database: { status: "error", message: "Not checked" },
    llm: { status: "error", message: "Not checked" },
  };

  // Database: connect and ping
  try {
    const db = await getDB();
    await db.command({ ping: 1 });
    result.database = { status: "ok" };
  } catch (err) {
    result.database = {
      status: "error",
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }

  // LLM: check API key and minimal request
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    result.llm = { status: "error", message: "GEMINI_API_KEY not set" };
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Reply with one word: OK",
      });
      result.llm = { status: "ok" };
    } catch (err) {
      result.llm = {
        status: "error",
        message: err instanceof Error ? err.message : "Request failed",
      };
    }
  }

  return NextResponse.json(result);
}

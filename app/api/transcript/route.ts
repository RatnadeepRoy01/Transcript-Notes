import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { TranscriptSchema } from "@/lib/validators";
import { validateAIOutput } from "@/lib/ai-schemas";

interface ActionItem {
  task: string;
  owner: string | null;
  dueDate: string | null;
}

interface ActionWithStatus extends ActionItem {
  status: "open";
}

interface MoodAnalysis {
  overall: "positive" | "neutral" | "negative";
  score: number; // 0-100, 0 = most negative, 50 = neutral, 100 = most positive
}

interface TranscriptDocument {
  text: string;
  actions: ActionWithStatus[];
  mood: MoodAnalysis;
  createdAt: Date;
}

const SYSTEM_PROMPT_ACTIONS = `Extract action items from the following meeting transcript.

Return ONLY a valid JSON array in this exact format (no other text, no markdown):
[
  {
    "task": "short task description",
    "owner": "person responsible or null",
    "dueDate": "YYYY-MM-DD if mentioned, otherwise null"
  }
]`;

const SYSTEM_PROMPT_MOOD = `Analyze the overall mood and sentiment of the meeting transcript.

Return ONLY a valid JSON object in this exact format (no other text, no markdown):
{
  "overall": "positive" or "neutral" or "negative",
  "score": number between 0 and 100 based on sentiment
}`;

function validateRequest(body: unknown) {
  const validation = TranscriptSchema.safeParse(body);
  if (!validation.success) {
    logger.warn({ errors: validation.error.flatten() }, "Validation failed");
    throw new Error(JSON.stringify(validation.error.flatten()));
  }
  logger.info("Input validated and sanitized");
  return validation.data;
}

function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured");
    throw new Error("GEMINI_API_KEY is not configured");
  }
  logger.info({ model: "gemini-2.5-flash" }, "Calling AI provider");
  return new GoogleGenAI({ apiKey });
}

function parseAIResponse(rawText: string) {
  if (!rawText) {
    throw new Error("Empty response from AI provider");
  }

  // Remove markdown code fence if present
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

async function generateAndValidateActions(
  ai: InstanceType<typeof GoogleGenAI>,
  text: string
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${SYSTEM_PROMPT_ACTIONS}\n\n---\n\n${text}`,
  });

  const parsed = parseAIResponse(response.text ?? "");
  return validateAIOutput(parsed);
}

async function generateAndValidateMood(
  ai: InstanceType<typeof GoogleGenAI>,
  text: string
): Promise<MoodAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${SYSTEM_PROMPT_MOOD}\n\n---\n\n${text}`,
  });

  const parsed = parseAIResponse(response.text ?? "");
  
  // Validate mood response structure
  if (
    !parsed.overall ||
    typeof parsed.score !== "number"
  ) {
    throw new Error("Invalid mood analysis response structure");
  }

  // Validate enum value
  if (!["positive", "neutral", "negative"].includes(parsed.overall.toLowerCase())) {
    throw new Error("Invalid overall mood value");
  }

  // Validate score range
  if (parsed.score < 0 || parsed.score > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  return {
    overall: parsed.overall,
    score: Math.round(parsed.score),
  };
}

async function generateActionsWithRetry(
  ai: InstanceType<typeof GoogleGenAI>,
  text: string
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info({ attempt }, "Generating and validating actions");
      return await generateAndValidateActions(ai, text);
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.error("Max attempts reached for actions");
        throw err;
      }
      logger.warn({ attempt, error: err }, "Action generation attempt failed, retrying");
    }
  }
}

async function generateMoodWithRetry(
  ai: InstanceType<typeof GoogleGenAI>,
  text: string
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info({ attempt }, "Generating and validating mood analysis");
      return await generateAndValidateMood(ai, text);
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.error("Max attempts reached for mood analysis");
        throw err;
      }
      logger.warn({ attempt, error: err }, "Mood analysis attempt failed, retrying");
    }
  }
}

async function saveTranscript(
  text: string,
  actions: ActionItem[],
  mood: MoodAnalysis
): Promise<TranscriptDocument & { _id: string }> {
  const actionsWithStatus: ActionWithStatus[] = actions.map((action) => ({
    ...action,
    status: "open" as const,
  }));

  const db = await getDB();
  const document: TranscriptDocument = {
    text,
    actions: actionsWithStatus,
    mood,
    createdAt: new Date(),
  };

  const result = await db.collection("transcripts").insertOne(document);
  logger.info(
    { id: result.insertedId.toString() },
    "Transcript saved"
  );

  return {
    _id: result.insertedId.toString(),
    ...document,
  };
}

export async function POST(request: Request) {
  try {
    logger.info("Transcript POST received");
    const body = await request.json();

    const { text } = validateRequest(body);

    const ai = initializeAI();
    
    // Generate both actions and mood in parallel for better performance
    const [actions, mood] = await Promise.all([
      generateActionsWithRetry(ai, text),
      generateMoodWithRetry(ai, text),
    ]);

    if (!actions) {
      logger.error("Failed to generate actions");
      return NextResponse.json(
        { error: "Failed to generate actions" },
        { status: 500 }
      );
    }

    if (!mood) {
      logger.error("Failed to generate mood analysis");
      return NextResponse.json(
        { error: "Failed to generate mood analysis" },
        { status: 500 }
      );
    }

    const savedDocument = await saveTranscript(text, actions, mood);

    return NextResponse.json(savedDocument);
  } catch (err) {
    logger.error(err, "Transcript API error");

    if (err instanceof Error && err.message.includes("Invalid input")) {
      return NextResponse.json(
        { error: "Invalid input", details: JSON.parse(err.message) },
        { status: 400 }
      );
    }

    if (
      err instanceof Error &&
      err.message === "GEMINI_API_KEY is not configured"
    ) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process transcript" },
      { status: 500 }
    );
  }
}
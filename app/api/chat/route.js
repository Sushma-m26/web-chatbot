import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const MODEL = "gemini-3.8-flash";
const SYSTEM_PROMPT =
  "You are a friendly senior frontend developer helping a beginner learn. " +
  "Keep answers short (max 5 sentences) unless asked for more. " +
  "Use small code examples when helpful.";
const MAX_MESSAGES = 30; // only send the most recent turns to limit tokens

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY from .env.local

async function generateWithRetry(params, maxTries = 3) {
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const retryable = err.status === 503 || err.status === 429;
      if (!retryable || attempt === maxTries) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  // Convert UI messages ({role: "user" | "assistant", content})
  // into Gemini's format ({role: "user" | "model", parts: [{text}]}).
  let recent = messages.slice(-MAX_MESSAGES);
  if (recent[0]?.role === "assistant") recent = recent.slice(1); // must start with user

  const contents = recent.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));

  try {
    const response = await generateWithRetry({
      model: MODEL,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    if (!response.text) {
      return NextResponse.json(
        { error: "The model returned an empty reply. Try rephrasing." },
        { status: 502 }
      );
    }
    return NextResponse.json({ reply: response.text });
  } catch (err) {
    console.error("Gemini error:", err);
    if (err.status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Wait a minute, then send again." },
        { status: 429 }
      );
    }
    if (err.status === 503) {
      return NextResponse.json(
        { error: "The model is busy right now. Send again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong on the server. Check the terminal for details." },
      { status: 500 }
    );
  }
}
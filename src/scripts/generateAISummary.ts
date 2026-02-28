import Groq from "groq-sdk";
import { AISummaryType } from "../types/types";

import dotenv from "dotenv";

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const stripMarkdownFences = (text: string): string => {
  return text.replace(/```json|```/g, "").trim();
};

const fallbackSummary: AISummaryType = {
  sentiment: "neutral",
  signal: "watch",
  reason: "Could not generate analysis",
  summary: "Error generating summary, please check manually today",
};

export const generateAISummary = async (
  prompt: string,
): Promise<AISummaryType> => {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a precise financial assitant. Return only valid JSON with no markdown formatting or code fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const raw = response.choices[0].message.content?.trim();
    if (!raw) throw new Error("No content received from Groq");

    const cleaned = stripMarkdownFences(raw);
    const parsed = JSON.parse(cleaned);

    if (
      !parsed.sentiment ||
      !parsed.signal ||
      !parsed.reason ||
      !parsed.summary
    ) {
      throw new Error("AI response missing required fields");
    }

    const validSignals = ["good", "avoid", "watch"];
    const validSentiments = ["bullish", "bearish", "neutral"];

    if (!validSignals.includes(parsed.signal)) {
      throw new Error(`Unexpected signal value: ${parsed.signal}`);
    }

    if (!validSentiments.includes(parsed.sentiment)) {
      throw new Error(`Unexpected sentiment value: ${parsed.sentiment}`);
    }

    return {
      sentiment: parsed.sentiment,
      signal: parsed.signal,
      reason: parsed.reason,
      summary: parsed.summary,
    };
  } catch (e) {
    console.error("Error generating AI summary:", e);
    return fallbackSummary;
  }
};

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { loadEnv } from "../config/env";
import { getRedis } from "./redis.client";

const CACHE_PREFIX = "ai:cat:";
const CACHE_TTL_SEC = 60 * 60 * 24;

function cacheKey(text: string): string {
  const h = createHash("sha256").update(text.toLowerCase().trim()).digest("hex").slice(0, 32);
  return `${CACHE_PREFIX}${h}`;
}

export type CategorizeResult = {
  category: string;
  confidence: number;
  note?: string;
};

export async function categorizeExpenseName(text: string): Promise<CategorizeResult> {
  const env = loadEnv();
  const redis = getRedis();
  const key = cacheKey(text);

  if (redis) {
    const hit = await redis.get<CategorizeResult>(key);
    if (hit && typeof hit === "object" && "category" in hit) {
      return { ...hit, note: "cache_hit" };
    }
  }

  if (!env.ANTHROPIC_API_KEY) {
    const fallback: CategorizeResult = {
      category: "Other",
      confidence: 0.5,
      note: "AI not configured",
    };
    return fallback;
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: `Classify this expense into ONE short category label (e.g. Food & Dining, Transportation, Utilities). Reply JSON only: {"category":string,"confidence":number between 0 and 1}\nText: "${text.replace(/"/g, "'")}"`,
      },
    ],
  });

  const block = msg.content[0];
  let category = "Other";
  let confidence = 0.7;
  if (block.type === "text") {
    try {
      const raw = block.text.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(raw) as { category?: string; confidence?: number };
      if (parsed.category) category = parsed.category;
      if (typeof parsed.confidence === "number") confidence = parsed.confidence;
    } catch {
      category = "Other";
      confidence = 0.5;
    }
  }

  const result: CategorizeResult = { category, confidence };
  if (redis) {
    await redis.set(key, result, { ex: CACHE_TTL_SEC });
  }
  return result;
}

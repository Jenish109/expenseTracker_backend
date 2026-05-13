import rateLimit from "express-rate-limit";

/** Default orchestration routes (webhooks, billing status, etc.). */
export const defaultV1RateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter cap for AI endpoints. */
export const aiV1RateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Export / heavy endpoints. */
export const exportV1RateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

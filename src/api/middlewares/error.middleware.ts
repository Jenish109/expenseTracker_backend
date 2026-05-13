import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { AppError } from "../../utils/errors";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as Request & { requestId?: string }).requestId;

  if (process.env.SENTRY_DSN && !(err instanceof ZodError) && !(err instanceof AppError)) {
    Sentry.captureException(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: err.issues,
      },
      meta: requestId ? { requestId } : undefined,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: requestId ? { requestId } : undefined,
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "Unexpected server error" : err instanceof Error ? err.message : "Unexpected server error",
    },
    meta: requestId ? { requestId } : undefined,
  });
}

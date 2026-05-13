import dotenv from "dotenv";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import * as Sentry from "@sentry/node";
import router from "./api/routes";
import { errorHandler } from "./api/middlewares/error.middleware";
import { requestId } from "./api/middlewares/requestId.middleware";
import { loadEnv } from "./config/env";
import { stripeWebhookHandler } from "./api/stripe.webhook";

dotenv.config();
loadEnv();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
  });
}

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);
const isProd = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProd && ALLOWED_ORIGINS.length === 0) {
  console.error("ALLOWED_ORIGINS must be set in production");
  process.exit(1);
}

const devFallbackOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8081"];

app.use(helmet());
app.use(
  cors({
    origin: isProd ? ALLOWED_ORIGINS : ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : devFallbackOrigins,
  })
);
app.use(morgan("dev"));
app.use(requestId);

app.post("/v1/stripe/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  void stripeWebhookHandler(req, res).catch(next);
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

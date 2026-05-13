import express, { Router } from "express";
import v1Router from "./v1";
import { defaultV1RateLimit } from "../middlewares/rateLimit.middleware";

const router: Router = express.Router();

router.use(
  "/v1",
  (req, res, next) => {
    if (req.path === "/health") return next();
    if (req.path.startsWith("/ai/")) return next();
    return defaultV1RateLimit(req, res, next);
  },
  v1Router
);

export default router;
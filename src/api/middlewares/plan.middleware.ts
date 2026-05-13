import { NextFunction, Response } from "express";
import { getSupabaseAdmin } from "../../config/supabase";
import { PlanError } from "../../utils/errors";
import type { AuthenticatedRequest } from "./auth.middleware";

const planOrder: Record<string, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

export function requirePlan(minPlan: "pro" | "business" | "enterprise") {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
      return next(new PlanError(minPlan));
    }

    const { data: profile, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      return next(new PlanError(minPlan));
    }

    const plan = (profile.plan as string) ?? "free";
    const expires = profile.plan_expires_at ? new Date(profile.plan_expires_at as string) : null;
    const active =
      !expires || expires.getTime() > Date.now() ? plan : "free";

    if ((planOrder[active] ?? 0) < planOrder[minPlan]) {
      return next(new PlanError(minPlan));
    }
    return next();
  };
}

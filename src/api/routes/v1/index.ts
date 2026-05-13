import express from "express";
import { aiV1RateLimit, defaultV1RateLimit, exportV1RateLimit } from "../../middlewares/rateLimit.middleware";
import { requireAuth, AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { requirePlan } from "../../middlewares/plan.middleware";
import { z } from "zod";
import { categorizeExpenseName } from "../../../services/ai.service";
import { getSupabaseAdmin } from "../../../config/supabase";
import { ValidationError } from "../../../utils/errors";
import Stripe from "stripe";
import { loadEnv } from "../../../config/env";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { ok: true } });
});

router.post(
  "/ai/categorize",
  aiV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = z.object({ text: z.string().min(1) }).parse(req.body);
      const data = await categorizeExpenseName(body.text);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/ai/analyze",
  aiV1RateLimit,
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      data: { insights: [], note: "Provide spending summary payload in a follow-up" },
    });
  }
);

router.post(
  "/ai/parse-nlp",
  aiV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      z.object({ text: z.string().min(1) }).parse(req.body);
      res.json({
        success: true,
        data: {
          name: "Parsed expense",
          amount: 0,
          currency: "INR",
          date: new Date().toISOString().slice(0, 10),
          category_hint: null,
          note: "Wire full NLP via ai.service",
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/receipts/scan",
  aiV1RateLimit,
  requireAuth,
  requirePlan("pro"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      z.object({ imageUrl: z.string().url() }).parse(req.body);
      res.json({
        success: true,
        data: { merchant: null, amount: null, date: null, note: "OCR pipeline placeholder" },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/receipts/upload-url",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { path: objectPath } = z.object({ path: z.string().min(3) }).parse(req.body);
      const userId = req.userId!;
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage.from("receipts").createSignedUploadUrl(objectPath);
      if (error) throw new ValidationError(error.message);
      res.json({
        success: true,
        data: {
          signedUrl: data?.signedUrl,
          token: data?.token,
          path: data?.path,
          userScoped: objectPath.startsWith(userId),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/stripe/create-checkout",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const env = loadEnv();
      if (!env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          error: { code: "STRIPE_UNAVAILABLE", message: "Stripe not configured" },
        });
      }
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const { priceId, successUrl, cancelUrl } = z
        .object({
          priceId: z.string().min(1),
          successUrl: z.string().url(),
          cancelUrl: z.string().url(),
        })
        .parse(req.body);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: req.userId,
      });
      res.json({ success: true, data: { url: session.url, id: session.id } });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/stripe/portal",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const env = loadEnv();
      if (!env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          error: { code: "STRIPE_UNAVAILABLE", message: "Stripe not configured" },
        });
      }
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const { returnUrl } = z.object({ returnUrl: z.string().url() }).parse(req.body);
      const { data: profile } = await getSupabaseAdmin()
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", req.userId!)
        .maybeSingle();
      const customerId = profile?.stripe_customer_id as string | undefined;
      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: { code: "NO_STRIPE_CUSTOMER", message: "No Stripe customer on file" },
        });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      res.json({ success: true, data: { url: session.url } });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/revenuecat/webhook",
  express.json(),
  async (req, res) => {
    const env = loadEnv();
    const secret = req.header("Authorization")?.replace("Bearer ", "") ?? "";
    if (env.REVENUECAT_WEBHOOK_SECRET && secret !== env.REVENUECAT_WEBHOOK_SECRET) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid webhook" } });
    }
    res.json({ success: true, data: { received: true } });
  }
);

router.post(
  "/bank/connect",
  defaultV1RateLimit,
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    res.json({ success: true, data: { link_token: null, note: "Plaid/Setu integration placeholder" } });
  }
);

router.get(
  "/bank/transactions",
  defaultV1RateLimit,
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    res.json({ success: true, data: { transactions: [] } });
  }
);

router.delete(
  "/bank/:accountId",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const { accountId } = z.object({ accountId: z.string().uuid() }).parse(req.params);
    await getSupabaseAdmin().from("bank_accounts").delete().eq("id", accountId).eq("user_id", req.userId!);
    res.json({ success: true, data: { deleted: accountId } });
  }
);

router.post(
  "/export/csv",
  exportV1RateLimit,
  requireAuth,
  requirePlan("pro"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { from, to } = z
        .object({ from: z.string().optional(), to: z.string().optional() })
        .parse(req.body ?? {});
      const uid = req.userId!;
      let q = getSupabaseAdmin().from("expenses").select("*").eq("user_id", uid);
      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [];
      const header = "name,amount,currency,date,category_id\n";
      const body = rows
        .map((r) => {
          const name = String(r.name ?? "").replace(/,/g, " ");
          return `${name},${r.amount},${r.currency ?? "INR"},${r.date},${r.category_id ?? ""}`;
        })
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.send(header + body);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/export/pdf",
  exportV1RateLimit,
  requireAuth,
  requirePlan("pro"),
  async (_req: AuthenticatedRequest, res) => {
    res.status(501).json({
      success: false,
      error: { code: "NOT_IMPLEMENTED", message: "PDF export requires puppeteer worker (planned)" },
    });
  }
);

router.post(
  "/export/tax-report",
  exportV1RateLimit,
  requireAuth,
  requirePlan("pro"),
  async (_req: AuthenticatedRequest, res) => {
    res.json({ success: true, data: { lines: [], note: "Tax report stub" } });
  }
);

router.post(
  "/notifications/push",
  defaultV1RateLimit,
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    res.json({ success: true, data: { queued: false, note: "Expo push from worker" } });
  }
);

router.post(
  "/notifications/send-weekly-digest",
  defaultV1RateLimit,
  requireAuth,
  requirePlan("business"),
  async (_req: AuthenticatedRequest, res) => {
    res.json({ success: true, data: { scheduled: false } });
  }
);

router.post(
  "/share/generate-card",
  defaultV1RateLimit,
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    res.json({ success: true, data: { imageUrl: null, note: "Year-in-money renderer TBD" } });
  }
);

router.get(
  "/benchmarks/:category",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      data: { category: req.params.category, benchmark: null, note: "Aggregate benchmarks opt-in" },
    });
  }
);

router.delete(
  "/account",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const uid = req.userId!;
      await getSupabaseAdmin().auth.admin.deleteUser(uid);
      res.json({ success: true, data: { deleted: true } });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/account/export",
  exportV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const uid = req.userId!;
      const [profile, expenses, budgets] = await Promise.all([
        getSupabaseAdmin().from("profiles").select("*").eq("id", uid).maybeSingle(),
        getSupabaseAdmin().from("expenses").select("*").eq("user_id", uid),
        getSupabaseAdmin().from("budgets").select("*").eq("user_id", uid),
      ]);
      res.json({
        success: true,
        data: {
          profile: profile.data,
          expenses: expenses.data,
          budgets: budgets.data,
          exported_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/b2b/workspace/create",
  defaultV1RateLimit,
  requireAuth,
  requirePlan("business"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
      const uid = req.userId!;
      const { data, error } = await getSupabaseAdmin()
        .from("workspaces")
        .insert({ name, owner_id: uid })
        .select("id")
        .single();
      if (error) throw error;
      await getSupabaseAdmin().from("workspace_members").insert({
        workspace_id: data.id,
        user_id: uid,
        role: "owner",
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/b2b/expense/approve",
  defaultV1RateLimit,
  requireAuth,
  requirePlan("business"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { approval_id, status } = z
        .object({
          approval_id: z.string().uuid(),
          status: z.enum(["approved", "rejected"]),
        })
        .parse(req.body);
      const { data, error } = await getSupabaseAdmin()
        .from("expense_approvals")
        .update({
          status,
          reviewed_by: req.userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", approval_id)
        .select()
        .maybeSingle();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/billing/status",
  defaultV1RateLimit,
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { data } = await getSupabaseAdmin()
        .from("profiles")
        .select("plan, plan_expires_at, stripe_customer_id, revenuecat_user_id")
        .eq("id", req.userId!)
        .maybeSingle();
      res.json({
        success: true,
        data: {
          plan: data?.plan ?? "free",
          plan_expires_at: data?.plan_expires_at ?? null,
          stripe_customer_id: data?.stripe_customer_id ?? null,
          revenuecat_user_id: data?.revenuecat_user_id ?? null,
          revenuecat_entitlements: [],
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;

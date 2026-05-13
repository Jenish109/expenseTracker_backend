import { Request, Response } from "express";
import Stripe from "stripe";
import { loadEnv } from "../config/env";
import { getSupabaseAdmin } from "../config/supabase";

/** Expect `express.raw({ type: 'application/json' })` so `req.body` is a Buffer. */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const env = loadEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ success: false, error: { code: "STRIPE_UNAVAILABLE", message: "Not configured" } });
    return;
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    res.status(400).send("Missing signature");
    return;
  }

  let event: { type: string; data: { object: { client_reference_id?: string | null; customer?: string | null } } };
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET) as typeof event;
  } catch {
    res.status(400).send("Invalid signature");
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    if (userId) {
      await getSupabaseAdmin()
        .from("profiles")
        .update({
          plan: "pro",
          stripe_customer_id: session.customer as string,
          plan_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", userId);
    }
  }

  res.json({ received: true });
}

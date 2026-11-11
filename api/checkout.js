import { env, PRICES, getUser, stripe, json, readBody } from "./_lib.js";

// POST /api/checkout { plan } -> { url }  (Stripe Checkout, test rejim)
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!env("STRIPE_SECRET_KEY").startsWith("sk_test_")) return json(res, 500, { error: "Faqat Stripe TEST kaliti (sk_test_...) qabul qilinadi" });
  try {
    const user = await getUser(req);
    if (!user) return json(res, 401, { error: "Avval tizimga kiring" });
    const { plan } = await readBody(req);
    const p = PRICES[plan];
    if (!p) return json(res, 400, { error: "Noto'g'ri tarif" });
    const origin = env("SITE_URL") || `https://${req.headers.host}`;
    const s = await stripe("checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(p.amount),
      "line_items[0][price_data][product_data][name]": p.name,
      client_reference_id: user.id,
      customer_email: user.email,
      "metadata[plan]": plan,
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}#/games`,
      cancel_url: `${origin}/#/premium`,
    });
    json(res, 200, { url: s.url });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
}

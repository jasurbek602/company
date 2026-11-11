// Umumiy yordamchilar (Vercel Node funksiyalari). Tashqi paketlarsiz — faqat fetch.
export const env = (k) => process.env[k] || "";

export const PRICES = {
  // Stripe test rejimida narxlar (tiyinda emas — USD centda, Stripe UZS ni qo'llab-quvvatlaydi, lekin test uchun USD qulay)
  month: { amount: 499, name: "Company IQ Premium — oylik" },
  year: { amount: 3999, name: "Company IQ Premium — yillik" },
  life: { amount: 7999, name: "Company IQ Premium — umrbod" },
};

// Supabase access tokenini tekshirib, foydalanuvchini qaytaradi
export async function getUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const r = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, { headers: { apikey: env("SUPABASE_ANON_KEY"), Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}

export async function stripe(path, params, method = "POST") {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : body,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "Stripe xatosi");
  return j;
}

export async function setPremium(userId) {
  const r = await fetch(`${env("SUPABASE_URL")}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { apikey: env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ is_premium: true, premium_since: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error("Profilni yangilab bo'lmadi");
}

export const json = (res, code, data) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data)); };
export async function readBody(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let s = ""; for await (const ch of req) s += ch; return s ? JSON.parse(s) : {};
}

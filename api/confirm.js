import { getUser, stripe, setPremium, json, readBody } from "./_lib.js";

// POST /api/confirm { session_id } -> { premium: true }
// Stripe sessiyasi to'langanini va shu foydalanuvchiga tegishliligini server tomonda tekshiradi.
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  try {
    const user = await getUser(req);
    if (!user) return json(res, 401, { error: "Avval tizimga kiring" });
    const { session_id } = await readBody(req);
    if (!/^cs_test_[A-Za-z0-9_]+$/.test(session_id || "")) return json(res, 400, { error: "Noto'g'ri sessiya" });
    const s = await stripe(`checkout/sessions/${session_id}`, null, "GET");
    if (s.payment_status !== "paid") return json(res, 402, { error: "To'lov yakunlanmagan" });
    if (s.client_reference_id !== user.id) return json(res, 403, { error: "Sessiya boshqa foydalanuvchiga tegishli" });
    await setPremium(user.id);
    json(res, 200, { premium: true });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
}

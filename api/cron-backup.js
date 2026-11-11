// Har kuni avtomatik shifrlangan zaxira nusxa (Vercel Cron). Oxirgi 30 tasi saqlanadi.
// Vercel CRON_SECRET o'rnatilgan bo'lsa, so'rovga "Authorization: Bearer <CRON_SECRET>" qo'shadi.
import crypto from "node:crypto";
import { getStore } from "./_lib/store.js";
import { json, env, encrypt } from "./_lib/security.js";

export default async function handler(req, res) {
  const want = env("CRON_SECRET");
  const got = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!want || got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return json(res, 401, { error: "Ruxsat yo'q" });
  try {
    const db = await getStore();
    await db.saveBackup({ box: encrypt({ v: 1, at: new Date(), data: await db.dumpAll() }), kind: "auto" });
    await db.pruneBackups(30);
    await db.log({ type: "backup.auto" });
    return json(res, 200, { ok: true });
  } catch (e) {
    console.error("cron-backup", e?.message);
    return json(res, 500, { error: "Zaxira nusxa olinmadi" });
  }
}

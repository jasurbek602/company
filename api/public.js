// Ommaviy API: reyting, test tokeni, Premium kirish.
//   GET  /api/public?a=leaderboard
//   POST /api/public?a=start        → test tokeni (natijani soxtalashtirishni qiyinlashtiradi)
//   POST /api/public?a=rating       { token, name, age, iq, ci, percentile, right, total }
//   POST /api/public?a=login        { login, password } → Premium sessiya (30 kun)
//   GET  /api/public?a=me           (Authorization: Bearer <vip token>)
import { getStore } from "./_lib/store.js";
import { json, cors, readBody, signToken, verifyToken, bearer, verifyPassword, burnTime, ipHash, str, int, LOGIN_RE, cleanName } from "./_lib/security.js";

const MIN_TEST_SEC = Math.max(0, +(process.env.MIN_TEST_SEC ?? 90)); // testni bundan tezroq "topshirib" bo'lmaydi

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const a = new URL(req.url, "http://x").searchParams.get("a");
  try {
    const db = await getStore();
    const ip = ipHash(req);

    if (a === "leaderboard" && req.method === "GET") {
      const rows = await db.topRatings(100);
      res.setHeader("Cache-Control", "public, max-age=20");
      return json(res, 200, { rows: rows.map((r) => ({ name: r.name, age: r.age, iq: r.iq, percentile: r.percentile, vip: !!r.vip, created_at: r.created_at })) });
    }

    if (a === "start" && req.method === "POST") {
      const lim = await db.hit(`start:${ip}`, 3600, 30);
      if (!lim.ok) return json(res, 429, { error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring." });
      return json(res, 200, { token: signToken({ typ: "test" }, 3 * 3600) });
    }

    if (a === "rating" && req.method === "POST") {
      const b = await readBody(req, 8 * 1024);
      const t = verifyToken(b.token, "test");
      if (!t) return json(res, 400, { error: "Test tokeni yaroqsiz" });
      if (Date.now() / 1000 - t.iat < MIN_TEST_SEC) return json(res, 400, { error: "Test juda tez yakunlandi" });
      if (!str(b.name, 2, 60) || !(b.age === null || int(b.age, 7, 99)) || !int(b.iq, 40, 175) || !int(b.ci ?? 5, 1, 40) || typeof b.percentile !== "number" || b.percentile < 0 || b.percentile > 100 || !int(b.right ?? 0, 0, 60) || !int(b.total ?? 36, 1, 60))
        return json(res, 400, { error: "Noto'g'ri ma'lumot" });
      const lim = await db.hit(`rating:${ip}`, 3600, 6);
      if (!lim.ok) return json(res, 429, { error: "Bir soatda juda ko'p natija" });
      if (!(await db.useJti(t.jti, t.exp))) return json(res, 409, { error: "Bu test natijasi allaqachon yuborilgan" });
      let vip = false;
      const vt = verifyToken(bearer(req), "vip");
      if (vt) vip = true;
      await db.insertRating({ name: cleanName(b.name), age: b.age ?? null, iq: b.iq, ci: b.ci ?? null, percentile: Math.round(b.percentile * 10) / 10, right: b.right ?? null, total: b.total ?? null, vip, user: vt?.sub ?? null, ip, created_at: new Date() });
      return json(res, 200, { ok: true });
    }

    if (a === "login" && req.method === "POST") {
      const b = await readBody(req, 2048);
      const lim = await db.hit(`vlogin:${ip}`, 900, 10);
      if (!lim.ok) return json(res, 429, { error: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring." });
      if (!str(b.login, 3, 30, LOGIN_RE) || !str(b.password, 6, 200)) { burnTime("x"); return json(res, 401, { error: "Login yoki parol noto'g'ri" }); }
      const u = await db.findUser(b.login);
      const ok = u && !u.disabled ? verifyPassword(b.password, u.pass) : burnTime(b.password);
      if (!ok || !u || u.disabled || (u.expires_at && new Date(u.expires_at) < new Date())) return json(res, 401, { error: u?.disabled ? "Akkaunt bloklangan" : u?.expires_at && new Date(u.expires_at) < new Date() ? "Premium muddati tugagan" : "Login yoki parol noto'g'ri" });
      await db.resetHits(`vlogin:${ip}`);
      await db.updateUser(u.login, { last_login: new Date() });
      return json(res, 200, { token: signToken({ typ: "vip", sub: u.login, ver: u.ver || 1 }, 30 * 86400), login: u.login, name: u.name, expires_at: u.expires_at || null });
    }

    if (a === "me" && req.method === "GET") {
      const t = verifyToken(bearer(req), "vip");
      if (!t) return json(res, 401, { error: "Sessiya tugagan" });
      const u = await db.findUser(t.sub);
      if (!u || u.disabled || (u.ver || 1) !== t.ver || (u.expires_at && new Date(u.expires_at) < new Date())) return json(res, 401, { error: "Akkaunt faol emas" });
      return json(res, 200, { login: u.login, name: u.name, expires_at: u.expires_at || null });
    }

    return json(res, 404, { error: "Topilmadi" });
  } catch (e) {
    return json(res, e.code === 503 ? 503 : e.code === 413 || e.code === 400 ? e.code : 500, { error: e.code ? e.message : "Server xatosi" });
  }
}

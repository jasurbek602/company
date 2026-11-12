// Admin API — faqat POST, faqat admin tokeni bilan (login bundan mustasno).
// Himoya: scrypt parol + TOTP (2FA), IP bo'yicha cheklov va bloklash, 2 soatlik imzolangan token,
// barcha amallar audit jurnaliga yoziladi, zaxira nusxalar AES-256-GCM bilan shifrlanadi.
import { getStore } from "./_lib/store.js";
import { json, readBody, env, signToken, verifyToken, bearer, verifyPassword, burnTime, verifyTotp, hashPassword, randomPassword, encrypt, decrypt, ipHash, str, int, LOGIN_RE, cleanName } from "./_lib/security.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.method !== "POST") return json(res, 405, { error: "Ruxsat yo'q" });
  // admin API boshqa domendan chaqirilmaydi (CORS sarlavhalari qo'yilmaydi)
  let db, b;
  try { db = await getStore(); b = await readBody(req, 4 * 1024 * 1024); }
  catch (e) {
    // ichki xato matni (baza, TLS va h.k.) tashqariga chiqarilmaydi
    if (e.code === 413 || e.code === 400) return json(res, e.code, { error: e.message });
    console.error("admin init", e?.message);
    return json(res, 503, { error: "Ma'lumotlar bazasiga ulanib bo'lmadi" });
  }
  const ip = ipHash(req);
  const action = String(b.action || "");

  try {
    /* ---------- kirish ---------- */
    if (action === "login") {
      const block = await db.hit(`alogin:${ip}`, 1800, 5);
      const global = await db.hit(`alogin:all`, 600, 30);
      if (!block.ok || !global.ok) { await db.log({ type: "admin.login.blocked", ip }); return json(res, 429, { error: "Juda ko'p urinish. 30 daqiqadan keyin." }); }
      const hash = env("ADMIN_PASS_HASH"), totp = env("ADMIN_TOTP_SECRET");
      if (!hash) return json(res, 503, { error: "Admin sozlanmagan (ADMIN_PASS_HASH)" });
      const passOk = str(b.password, 8, 300) ? verifyPassword(b.password, hash) : burnTime("x");
      const totpOk = totp ? verifyTotp(b.code, totp) : true;
      if (!passOk || !totpOk) { await db.log({ type: "admin.login.fail", ip }); await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); return json(res, 401, { error: "Parol yoki kod noto'g'ri" }); }
      await db.resetHits(`alogin:${ip}`);
      await db.log({ type: "admin.login.ok", ip });
      // tokenni brauzerga bog'lash: User-Agent xeshi
      const ua = crypto.createHash("sha256").update(String(req.headers["user-agent"] || "")).digest("base64url").slice(0, 16);
      return json(res, 200, { token: signToken({ typ: "admin", ua }, 2 * 3600), totp: !!totp });
    }

    /* ---------- token tekshiruvi ---------- */
    const t = verifyToken(bearer(req), "admin");
    const ua = crypto.createHash("sha256").update(String(req.headers["user-agent"] || "")).digest("base64url").slice(0, 16);
    if (!t || t.ua !== ua) return json(res, 401, { error: "Sessiya tugagan — qayta kiring" });
    const lim = await db.hit(`admin:${ip}`, 60, 120);
    if (!lim.ok) return json(res, 429, { error: "Juda tez" });
    const log = (type, extra = {}) => db.log({ type, ip, ...extra });

    switch (action) {
      case "stats": {
        return json(res, 200, { ...(await db.count()), store: db.kind, totp: !!env("ADMIN_TOTP_SECRET"), backupKey: env("BACKUP_KEY").length >= 32 });
      }
      case "users.list": return json(res, 200, { users: await db.listUsers() });
      case "users.create": {
        if (!str(b.login, 3, 30, LOGIN_RE) || !str(b.name, 2, 60)) return json(res, 400, { error: "Login (3–30, lotin harf/raqam) va ism kerak" });
        const days = b.days == null ? null : int(b.days, 1, 3650) ? b.days : -1;
        if (days === -1) return json(res, 400, { error: "Muddat 1–3650 kun" });
        const password = randomPassword(14);
        try {
          await db.createUser({ login: b.login, name: cleanName(b.name), pass: hashPassword(password), plan: str(b.plan, 1, 20) ? b.plan : "premium", ver: 1, disabled: false, created_at: new Date(), expires_at: days ? new Date(Date.now() + days * 86400e3) : null });
        } catch (e) { if (e.code === 11000) return json(res, 409, { error: "Bu login band" }); throw e; }
        await log("user.create", { login: b.login.toLowerCase() });
        return json(res, 200, { login: b.login.toLowerCase(), password }); // parol faqat bir marta ko'rsatiladi
      }
      case "users.reset": {
        if (!str(b.login, 3, 30, LOGIN_RE)) return json(res, 400, { error: "Login noto'g'ri" });
        const u = await db.findUser(b.login); if (!u) return json(res, 404, { error: "Topilmadi" });
        const password = randomPassword(14);
        await db.updateUser(b.login, { pass: hashPassword(password), ver: (u.ver || 1) + 1 }); // eski sessiyalar bekor bo'ladi
        await log("user.reset", { login: u.login });
        return json(res, 200, { login: u.login, password });
      }
      case "users.toggle": {
        if (!str(b.login, 3, 30, LOGIN_RE)) return json(res, 400, { error: "Login noto'g'ri" });
        const u = await db.findUser(b.login); if (!u) return json(res, 404, { error: "Topilmadi" });
        await db.updateUser(b.login, { disabled: !u.disabled, ver: (u.ver || 1) + 1 });
        await log(u.disabled ? "user.enable" : "user.disable", { login: u.login });
        return json(res, 200, { disabled: !u.disabled });
      }
      case "users.extend": {
        if (!str(b.login, 3, 30, LOGIN_RE) || !int(b.days, 1, 3650)) return json(res, 400, { error: "Login va kun kerak" });
        const u = await db.findUser(b.login); if (!u) return json(res, 404, { error: "Topilmadi" });
        const base = u.expires_at && new Date(u.expires_at) > new Date() ? new Date(u.expires_at) : new Date();
        const exp = new Date(base.getTime() + b.days * 86400e3);
        await db.updateUser(b.login, { expires_at: exp });
        await log("user.extend", { login: u.login, days: b.days });
        return json(res, 200, { expires_at: exp });
      }
      case "users.delete": {
        if (!str(b.login, 3, 30, LOGIN_RE) || b.confirm !== b.login) return json(res, 400, { error: "Tasdiqlash uchun loginni qayta yozing" });
        const r = await db.deleteUser(b.login);
        await log("user.delete", { login: b.login.toLowerCase() });
        return json(res, 200, { deleted: r.deletedCount || 0 });
      }
      case "ratings.list": {
        const skip = int(b.skip, 0, 1e6) ? b.skip : 0;
        return json(res, 200, { ratings: await db.listRatings(100, skip) });
      }
      case "ratings.delete": {
        if (!str(b.id, 6, 40)) return json(res, 400, { error: "ID noto'g'ri" });
        const r = await db.deleteRating(b.id);
        await log("rating.delete", { id: b.id });
        return json(res, 200, { deleted: r.deletedCount || 0 });
      }
      case "audit.list": return json(res, 200, { audit: await db.listAudit(200) });
      case "backup.create": {
        const box = encrypt({ v: 1, at: new Date(), data: await db.dumpAll() });
        await db.saveBackup({ box, kind: "manual" }); await db.pruneBackups(30);
        await log("backup.create");
        return json(res, 200, { ok: true });
      }
      case "backup.list": return json(res, 200, { backups: await db.listBackups() });
      case "backup.download": {
        if (!str(b.id, 6, 40)) return json(res, 400, { error: "ID noto'g'ri" });
        const bk = await db.getBackup(b.id); if (!bk) return json(res, 404, { error: "Topilmadi" });
        await log("backup.download", { id: b.id });
        // shifrlangan holda yuklanadi — ochish uchun BACKUP_KEY kerak (scripts/backup-decrypt.mjs)
        return json(res, 200, { file: { app: "company-iq", at: bk.at, ...bk.box } });
      }
      case "backup.restore": {
        if (!b.file || typeof b.file !== "object" || b.confirm !== "TIKLASH") return json(res, 400, { error: "Fayl va \"TIKLASH\" tasdig'i kerak" });
        let data; try { data = decrypt(b.file).data; } catch { return json(res, 400, { error: "Faylni ochib bo'lmadi (kalit mos emas yoki fayl buzilgan)" }); }
        const r = await db.restore(data);
        await log("backup.restore", r);
        return json(res, 200, r);
      }
      default: return json(res, 404, { error: "Noma'lum amal" });
    }
  } catch (e) {
    console.error("admin", action, e?.message);
    return json(res, 500, { error: "Server xatosi" });
  }
}

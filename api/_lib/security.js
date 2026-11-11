// Xavfsizlik yordamchilari: parol xeshlash (scrypt), imzolangan tokenlar (HMAC),
// TOTP (Google Authenticator), AES-256-GCM shifrlash, so'rovlarni tekshirish.
import crypto from "node:crypto";

export const env = (k, d = "") => process.env[k] ?? d;

/* ---------- parollar (scrypt, tuzli) ---------- */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pw), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${salt.toString("base64")}$${h.toString("base64")}`;
}
export function verifyPassword(pw, stored) {
  try {
    const [alg, N, saltB64, hashB64] = String(stored).split("$");
    if (alg !== "scrypt") return false;
    const hash = Buffer.from(hashB64, "base64");
    const h = crypto.scryptSync(String(pw), Buffer.from(saltB64, "base64"), hash.length, { N: +N, r: 8, p: 1 });
    return crypto.timingSafeEqual(h, hash);
  } catch { return false; }
}
// Mavjud bo'lmagan foydalanuvchi uchun ham vaqt sarflash (login'ni taxmin qilishni qiyinlashtiradi)
const DUMMY = hashPassword(crypto.randomBytes(8).toString("hex"));
export const burnTime = (pw) => verifyPassword(pw, DUMMY);

export function randomPassword(len = 14) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(len * 2); let out = "";
  for (const b of bytes) { if (b < 248) out += abc[b % abc.length]; if (out.length === len) break; }
  return out;
}

/* ---------- imzolangan tokenlar ---------- */
function secret() {
  const s = env("SESSION_SECRET");
  if (s.length < 32) throw new Error("SESSION_SECRET kamida 32 belgi bo'lishi kerak");
  return s;
}
const b64u = (buf) => Buffer.from(buf).toString("base64url");
export function signToken(payload, ttlSec) {
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSec, jti: crypto.randomBytes(9).toString("base64url") };
  const p = b64u(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", secret()).update(p).digest("base64url");
  return `${p}.${sig}`;
}
export function verifyToken(token, typ) {
  try {
    const [p, sig] = String(token || "").split(".");
    if (!p || !sig) return null;
    const exp = crypto.createHmac("sha256", secret()).update(p).digest();
    const got = Buffer.from(sig, "base64url");
    if (got.length !== exp.length || !crypto.timingSafeEqual(got, exp)) return null;
    const body = JSON.parse(Buffer.from(p, "base64url").toString());
    if (body.typ !== typ || body.exp < Date.now() / 1000) return null;
    return body;
  } catch { return null; }
}
export const bearer = (req) => (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

/* ---------- TOTP (RFC 6238) ---------- */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Encode(buf) { let bits = "", out = ""; for (const b of buf) bits += b.toString(2).padStart(8, "0"); for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)]; return out; }
function base32Decode(s) { let bits = ""; for (const ch of s.replace(/=+$/, "").toUpperCase()) { const v = B32.indexOf(ch); if (v < 0) continue; bits += v.toString(2).padStart(5, "0"); } const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); }
function hotp(key, counter) {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", key).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, "0");
}
export function verifyTotp(code, secretB32) {
  if (!/^\d{6}$/.test(String(code || ""))) return false;
  const key = base32Decode(secretB32); const t = Math.floor(Date.now() / 30000);
  for (const w of [-1, 0, 1]) { const c = hotp(key, t + w); if (crypto.timingSafeEqual(Buffer.from(c), Buffer.from(String(code)))) return true; }
  return false;
}

/* ---------- shifrlash (zaxira nusxalar uchun) ---------- */
const backupKey = () => { const k = env("BACKUP_KEY"); if (k.length < 32) throw new Error("BACKUP_KEY kamida 32 belgi"); return crypto.createHash("sha256").update(k).digest(); };
export function encrypt(obj) {
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv("aes-256-gcm", backupKey(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return { v: 1, alg: "aes-256-gcm", iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: data.toString("base64") };
}
export function decrypt(box, key = env("BACKUP_KEY")) {
  const k = crypto.createHash("sha256").update(key).digest();
  const d = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(box.iv, "base64")); d.setAuthTag(Buffer.from(box.tag, "base64"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(box.data, "base64")), d.final()]).toString("utf8"));
}

/* ---------- HTTP yordamchilari ---------- */
export function headers(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
}
export function cors(req, res) {
  // faqat ruxsat etilgan sayt (masalan GitHub Pages nusxasi) boshqa domendan murojaat qila oladi
  const allowed = env("ALLOWED_ORIGINS").split(",").map((s) => s.trim()).filter(Boolean);
  const o = req.headers.origin;
  if (o && allowed.includes(o)) { res.setHeader("Access-Control-Allow-Origin", o); res.setHeader("Vary", "Origin"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); }
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return true; }
  return false;
}
export function json(res, code, data) { headers(res); res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(data)); }
export async function readBody(req, limit = 64 * 1024) {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw) { for await (const ch of req) { raw += ch; if (raw.length > limit) throw Object.assign(new Error("So'rov juda katta"), { code: 413 }); } }
  if (raw.length > limit) throw Object.assign(new Error("So'rov juda katta"), { code: 413 });
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error("Noto'g'ri JSON"), { code: 400 }); }
}
export function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xf || req.socket?.remoteAddress || "0";
}
// IP ni xom saqlamaymiz — faqat tuzli xesh
export const ipHash = (req) => crypto.createHash("sha256").update(env("SESSION_SECRET") + "|" + clientIp(req)).digest("base64url").slice(0, 22);

/* ---------- kiritilgan ma'lumotlarni tekshirish (NoSQL-injection'ga qarshi faqat oddiy turlar) ---------- */
export const str = (v, min, max, re) => typeof v === "string" && v.length >= min && v.length <= max && (!re || re.test(v));
export const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
export const LOGIN_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
export const cleanName = (s) => String(s).replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);

// Barcha maxfiy kalitlarni yaratadi va secrets/vercel-env.txt ga yozadi (bu papka GitHub'ga chiqmaydi).
//   node scripts/setup-secrets.mjs
// Natijadagi qiymatlarni Vercel → Project → Settings → Environment Variables ga kiriting.
import crypto from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
process.env.SESSION_SECRET ||= "x".repeat(32);
const { hashPassword, randomPassword, base32Encode } = await import("../api/_lib/security.js");

const out = new URL("../secrets/vercel-env.txt", import.meta.url);
if (existsSync(out) && !process.argv.includes("--force")) {
  console.log("secrets/vercel-env.txt allaqachon bor. Yangilash uchun: node scripts/setup-secrets.mjs --force");
  process.exit(0);
}
const adminPass = randomPassword(20);
const totp = base32Encode(crypto.randomBytes(20));
const rnd = (n) => crypto.randomBytes(n).toString("base64url");
const lines = [
  "# ===== Company IQ — MAXFIY. Hech kimga bermang, GitHub'ga yuklamang. =====",
  `# Yaratildi: ${new Date().toISOString()}`,
  "",
  "# --- Admin panelga kirish (sizga) ---",
  `# Admin manzili: https://<sizning-sayt>.vercel.app/admin`,
  `# Admin paroli: ${adminPass}`,
  `# Google Authenticator / Authy'ga qo'shish uchun kalit (qo'lda kiritish): ${totp}`,
  `# yoki havola: otpauth://totp/CompanyIQ:admin?secret=${totp}&issuer=CompanyIQ`,
  "",
  "# --- Vercel Environment Variables (nom = qiymat) ---",
  `MONGODB_URI=${process.env.MONGO_TEMPLATE || "mongodb+srv://<foydalanuvchi>:<PAROL>@<klaster>.mongodb.net/?retryWrites=true&w=majority"}`,
  "MONGODB_DB=companyiq",
  `ADMIN_PASS_HASH=${hashPassword(adminPass)}`,
  `ADMIN_TOTP_SECRET=${totp}`,
  `SESSION_SECRET=${rnd(48)}`,
  `BACKUP_KEY=${rnd(48)}`,
  `CRON_SECRET=${rnd(32)}`,
  "ALLOWED_ORIGINS=https://jasurbek602.github.io",
  "ADMIN_CONTACT=https://t.me/<sizning_username>",
  "",
  "# ESLATMA: BACKUP_KEY yo'qolsa, zaxira nusxalarni ochib bo'lmaydi — uni alohida xavfsiz joyda ham saqlang.",
];
mkdirSync(new URL("../secrets/", import.meta.url), { recursive: true });
writeFileSync(out, lines.join("\n") + "\n", { mode: 0o600 });
console.log("Tayyor → secrets/vercel-env.txt (admin paroli va 2FA kaliti shu faylda)");

// Premium foydalanuvchilarni boshqarish (parollar faqat secrets/credentials.txt ga yoziladi — u gitignore qilingan).
//   node scripts/premium.mjs admin                 -> yangi admin paroli
//   node scripts/premium.mjs add <login> "<Ism>"   -> yangi premium foydalanuvchi
//   node scripts/premium.mjs remove <login>
//   node scripts/premium.mjs contact <url>         -> "Admin bilan bog'lanish" havolasi (masalan https://t.me/username)
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
const FILE = new URL("../data/premium-users.json", import.meta.url);
const SECRETS = new URL("../secrets/", import.meta.url);
const data = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { contact: "", admin: null, users: [] };
const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const pw = (n = 12) => [...randomBytes(n)].map((b) => abc[b % abc.length]).join("");
const salt = () => randomBytes(12).toString("hex");
const hash = (s, p) => createHash("sha256").update(`${s}:${p}`).digest("hex");
const note = (line) => { mkdirSync(SECRETS, { recursive: true }); appendFileSync(new URL("credentials.txt", SECRETS), `[${new Date().toISOString()}] ${line}\n`); };
const [cmd, a, b] = process.argv.slice(2);
if (cmd === "admin") { const p = pw(14), s = salt(); data.admin = { salt: s, hash: hash(s, p) }; note(`ADMIN paroli: ${p}`); console.log("Admin paroli yangilandi -> secrets/credentials.txt"); }
else if (cmd === "add" && a) {
  if (data.users.some((u) => u.login.toLowerCase() === a.toLowerCase())) { console.error("Login band"); process.exit(1); }
  const p = pw(), s = salt(); data.users.push({ login: a, name: b || a, salt: s, hash: hash(s, p), created: new Date().toISOString().slice(0, 10) });
  note(`PREMIUM ${a} (${b || a}) parol: ${p}`); console.log(`Qo'shildi: ${a} -> parol secrets/credentials.txt da`);
}
else if (cmd === "remove" && a) { data.users = data.users.filter((u) => u.login !== a); console.log("O'chirildi:", a); }
else if (cmd === "contact" && a) { data.contact = a; console.log("Kontakt:", a); }
else { console.log("Foydalanish: admin | add <login> \"<Ism>\" | remove <login> | contact <url>"); process.exit(1); }
writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");

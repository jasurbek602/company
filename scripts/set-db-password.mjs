// MongoDB parolini yashirin kiritib, secrets/vercel-env.txt dagi MONGODB_URI ga yozadi.
//   node scripts/set-db-password.mjs
// Parol ekranda ko'rinmaydi va hech qayerga yuborilmaydi.
import { readFileSync, writeFileSync } from "node:fs";
const file = new URL("../secrets/vercel-env.txt", import.meta.url);
const text = readFileSync(file, "utf8");
if (!/^MONGODB_URI=/m.test(text)) { console.error("secrets/vercel-env.txt da MONGODB_URI qatori topilmadi"); process.exit(1); }

process.stdout.write("MongoDB parolini kiriting (ekranda ko'rinmaydi) va Enter bosing: ");
const stdin = process.stdin;
stdin.setRawMode?.(true); stdin.resume(); stdin.setEncoding("utf8");
let pw = "";
stdin.on("data", (ch) => {
  for (const c of ch) {
    if (c === "\r" || c === "\n") { stdin.setRawMode?.(false); stdin.pause(); process.stdout.write("\n"); return done(); }
    if (c === "\u0003") { process.stdout.write("\nBekor qilindi\n"); process.exit(1); }
    if (c === "\u007f" || c === "\b") { pw = pw.slice(0, -1); continue; }
    pw += c;
  }
});
function done() {
  if (pw.length < 4) { console.error("Parol juda qisqa — qaytadan urinib ko'ring."); process.exit(1); }
  const enc = encodeURIComponent(pw);
  const out = text.replace(/^(MONGODB_URI=mongodb\+srv:\/\/[^:\s]+:)[^@\s]*(@.*)$/m, `$1${enc}$2`);
  if (out === text) { console.error("MONGODB_URI formatini tushunmadim."); process.exit(1); }
  writeFileSync(file, out);
  console.log("✅ Parol saqlandi (secrets/vercel-env.txt). Endi Claude'ga \"Tayyor\" deb yozing.");
}

// Shifrlangan zaxira nusxani ochish (faqat o'z kompyuteringizda):
//   BACKUP_KEY=... node scripts/backup-decrypt.mjs backup.json > ochiq.json
import { readFileSync } from "node:fs";
import { decrypt } from "../api/_lib/security.js";
const [file] = process.argv.slice(2);
const key = process.env.BACKUP_KEY;
if (!file || !key) { console.error("Foydalanish: BACKUP_KEY=... node scripts/backup-decrypt.mjs <fayl.json>"); process.exit(1); }
const box = JSON.parse(readFileSync(file, "utf8"));
process.stdout.write(JSON.stringify(decrypt(box, key), null, 2));

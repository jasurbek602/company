// Lokal sinov serveri: statik fayllar + /api/* funksiyalari (Vercel'ga o'xshash).
//   npm run dev:api        → xotiradagi baza bilan (MongoDB'siz)
//   MONGODB_URI=... npm run dev:api → haqiqiy baza bilan
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = +process.env.PORT || 5174;
process.env.SESSION_SECRET ||= "dev-only-session-secret-0123456789abcdef";
process.env.BACKUP_KEY ||= "dev-only-backup-key-0123456789abcdefghij";
if (!process.env.MONGODB_URI) process.env.MEMORY_STORE = "1";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const BLOCK = [/^\/secrets/, /^\/node_modules/, /^\/\.git/, /^\/api\/_lib/, /^\/scripts/, /\.env/];

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  if (BLOCK.some((r) => r.test(p))) { res.statusCode = 404; return res.end("Not found"); }
  if (p === "/js/config.js") p = "/api/config";
  if (p === "/admin") p = "/admin.html";
  if (p.startsWith("/api/")) {
    const name = p.slice(5).replace(/[^a-z0-9-]/gi, "");
    try { const mod = await import(`../api/${name}.js?ts=${Date.now() % 1}`); return mod.default(req, res); }
    catch (e) { res.statusCode = 404; return res.end("no api"); }
  }
  if (p.endsWith("/")) p += "index.html";
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(normalize(ROOT))) { res.statusCode = 403; return res.end(); }
  try { await stat(file); res.setHeader("Content-Type", TYPES[extname(file)] || "application/octet-stream"); res.setHeader("Cache-Control", "no-store"); res.end(await readFile(file)); }
  catch { res.statusCode = 404; res.end("Not found"); }
}).listen(PORT, () => console.log(`Dev server: http://localhost:${PORT}  (baza: ${process.env.MONGODB_URI ? "MongoDB" : "xotira"})`));

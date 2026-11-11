// /js/config.js -> shu funksiya (vercel.json rewrite). Faqat OMMAVIY kalitlarni beradi.
export default function handler(_req, res) {
  const cfg = { SUPABASE_URL: process.env.SUPABASE_URL || "", SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "", ADMIN_CONTACT: process.env.ADMIN_CONTACT || "" };
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(`window.APP_CONFIG = ${JSON.stringify(cfg)};`);
}

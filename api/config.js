// /js/config.js -> shu funksiya (vercel.json rewrite). Faqat OMMAVIY sozlamalarni beradi — hech qanday maxfiy kalit yo'q.
export default function handler(_req, res) {
  const cfg = {
    API_BASE: process.env.MONGODB_URI || process.env.MEMORY_STORE === "1" ? "/api" : "",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    ADMIN_CONTACT: process.env.ADMIN_CONTACT || "",
  };
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(`window.APP_CONFIG = ${JSON.stringify(cfg)};`);
}

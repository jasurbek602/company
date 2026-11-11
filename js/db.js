// Ma'lumotlar qatlami.
// - Supabase sozlangan bo'lsa: Google kirish, natijalar va UMUMIY reyting bazada.
// - Sozlanmagan bo'lsa: hammasi shu qurilmada (localStorage) — sayt baribir to'liq ishlaydi.
// - Premium: admin bergan login/parol (data/premium-users.json dagi SHA-256 xeshlar bilan tekshiriladi).

const cfg = window.APP_CONFIG || {};
export const DEMO = !(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
export const ADMIN_CONTACT = cfg.ADMIN_CONTACT || "";
// Server API (Vercel + MongoDB). Bo'lmasa — eski statik rejim (data/premium-users.json, localStorage reyting).
export const API = cfg.API_BASE || "";
async function call(path, { method = "GET", body, auth } = {}) {
  const r = await fetch(API + path, { method, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: "Bearer " + auth } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Server xatosi"), { status: r.status });
  return j;
}
let sb = null;
let user = null;   // Google foydalanuvchi (Supabase)
let vip = null;    // Premium akkaunt (admin bergan)
const listeners = new Set();

export const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

/* ---------------- kriptografiya ---------------- */
export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const randomSalt = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
export function randomPassword(len = 12) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return [...crypto.getRandomValues(new Uint8Array(len))].map((b) => abc[b % abc.length]).join("");
}
let usersCache = null;
export async function premiumUsers(force = false) {
  if (usersCache && !force) return usersCache;
  try { const r = await fetch("data/premium-users.json", { cache: "no-store" }); usersCache = await r.json(); }
  catch { usersCache = { admin: null, users: [] }; }
  return usersCache;
}

/* ---------------- init ---------------- */
export async function initAuth() {
  if (!DEMO) {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.4");
      sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const { data } = await sb.auth.getSession();
      user = mapUser(data.session?.user);
      sb.auth.onAuthStateChange((_e, session) => { user = mapUser(session?.user); emit(); });
    } catch (e) { console.warn("Supabase yuklanmadi", e); }
  }
  // Premium sessiya — chiqib ketsa ham saqlanib turadi; har safar server bilan qayta tekshiriladi
  if (API) {
    const s = LS.get("vip_api", null);
    if (s?.token) {
      vip = { login: s.login, name: s.name, token: s.token };
      call("/public?a=me", { auth: s.token }).then((me) => { vip = { ...vip, name: me.name, expires_at: me.expires_at }; emit(); })
        .catch((e) => { if (e.status === 401) { vip = null; LS.del("vip_api"); emit(); } });
    }
    emit();
    return;
  }
  const saved = LS.get("vip_session", null);
  if (saved) {
    const list = await premiumUsers();
    const u = list.users?.find((x) => x.login === saved.login);
    if (u && u.hash === saved.hash) vip = { login: u.login, name: u.name || u.login };
    else LS.del("vip_session");
  }
  emit();
}
const mapUser = (u) => u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email, avatar: u.user_metadata?.avatar_url } : null;
const emit = () => listeners.forEach((f) => f({ user, vip }));
export const onChange = (f) => { listeners.add(f); f({ user, vip }); };
export const getUser = () => user;
export const getVip = () => vip;
export const isPremium = () => !!vip;

export async function signInGoogle() {
  if (!sb) return;
  await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
}
export async function signOutGoogle() { if (sb) await sb.auth.signOut(); }

export async function vipLogin(login, password) {
  if (API) {
    const r = await call("/public?a=login", { method: "POST", body: { login: login.trim().toLowerCase(), password } });
    vip = { login: r.login, name: r.name, token: r.token, expires_at: r.expires_at };
    LS.set("vip_api", { token: r.token, login: r.login, name: r.name });
    migrateGuest(r.login);
    emit();
    return vip;
  }
  const list = await premiumUsers(true);
  const u = list.users?.find((x) => x.login.toLowerCase() === login.trim().toLowerCase());
  if (!u) throw new Error("Bunday login topilmadi");
  const h = await sha256(`${u.salt}:${password}`);
  if (h !== u.hash) throw new Error("Parol noto'g'ri");
  vip = { login: u.login, name: u.name || u.login };
  LS.set("vip_session", { login: u.login, hash: h });
  emit();
  return vip;
}
// Bepul o'ynab bo'lgan progress (yechilgan ish, tokenlar, seriya) Premium akkauntga ko'chiriladi — faqat bir marta
function migrateGuest(login) {
  try {
    if (localStorage.getItem(`vip_cases_${login}`) || localStorage.getItem(`vip_tokens_${login}`)) return;
    for (const k of Object.keys(localStorage)) if (k.startsWith("vip_") && k.endsWith("_guest")) localStorage.setItem(k.replace(/_guest$/, "_" + login), localStorage.getItem(k));
  } catch {}
}
export function vipLogout() { vip = null; LS.del("vip_session"); LS.del("vip_api"); emit(); }

export async function adminCheck(password) {
  const list = await premiumUsers(true);
  if (!list.admin) throw new Error("Admin paroli hali o'rnatilmagan (README → Premium foydalanuvchilar)");
  return (await sha256(`${list.admin.salt}:${password}`)) === list.admin.hash;
}

/* ---------------- shaxsiy ma'lumot (ism, yosh) ---------------- */
export const getPerson = () => LS.get("person", null);
export const setPerson = (p) => LS.set("person", p);

/* ---------------- premium profil: tokenlar ---------------- */
// Premium bo'lmagan o'yinchi ham "guest" profilida bepul ishni o'ynay oladi
const vkey = (k) => `vip_${k}_${vip?.login || "guest"}`;
export async function getProfile() {
  return { is_premium: !!vip, tokens: LS.get(vkey("tokens"), 0) };
}
export async function addTokens(n) {
  const t = Math.max(0, LS.get(vkey("tokens"), 0) + n); LS.set(vkey("tokens"), t); return t;
}

/* ---------------- natijalar ---------------- */
// Test boshlanganda serverdan imzolangan token olinadi (natijani soxtalashtirishni qiyinlashtiradi)
export async function startTest() {
  sessionStorage.removeItem("test_token");
  if (!API) return;
  try { const r = await call("/public?a=start", { method: "POST" }); sessionStorage.setItem("test_token", r.token); } catch {}
}
export async function saveResult(r) {
  const person = getPerson() || {};
  const row = { name: (person.name || "Mehmon").slice(0, 40), age: person.age || null, iq: r.iq, ci: r.ci, percentile: r.percentile, created_at: new Date().toISOString(), vip: !!vip };
  const mine = LS.get("my_results", []); mine.unshift({ ...row, details: r }); LS.set("my_results", mine.slice(0, 50));
  const lb = LS.get("local_board", []); lb.push(row); LS.set("local_board", lb.slice(-500));
  if (API) {
    const token = sessionStorage.getItem("test_token");
    sessionStorage.removeItem("test_token");
    if (token) {
      try { await call("/public?a=rating", { method: "POST", auth: vip?.token, body: { token, name: row.name, age: row.age, iq: r.iq, ci: r.ci, percentile: r.percentile, right: r.right, total: r.total } }); }
      catch (e) { console.warn("Reyting serverga yozilmadi:", e.message); }
    }
  }
  if (sb) {
    const { error } = await sb.from("ratings").insert({ name: row.name, age: row.age, iq: row.iq, percentile: row.percentile, user_id: user?.id ?? null, details: r });
    if (error) console.warn("Reyting bazaga yozilmadi:", error.message);
  }
}
export const myResults = () => LS.get("my_results", []);

/* ---------------- reyting ---------------- */
export async function leaderboard(limit = 50) {
  if (API) {
    try { const r = await call("/public?a=leaderboard"); return { global: true, rows: r.rows.slice(0, limit) }; } catch {}
  }
  if (sb) {
    const { data, error } = await sb.from("ratings").select("name,age,iq,percentile,created_at").order("iq", { ascending: false }).order("created_at", { ascending: true }).limit(limit);
    if (!error && data) return { global: true, rows: data };
  }
  const rows = LS.get("local_board", []).slice().sort((a, b) => b.iq - a.iq || a.created_at.localeCompare(b.created_at)).slice(0, limit);
  return { global: false, rows };
}

/* ---------------- detektiv progressi ---------------- */
export async function solvedCases() { return LS.get(vkey("cases"), []); }
export async function saveCase(case_id, score) {
  const a = LS.get(vkey("cases"), []).filter((c) => c.case_id !== case_id); a.push({ case_id, score }); LS.set(vkey("cases"), a);
}
export const vipGet = (k, d) => LS.get(vkey(k), d);
export const vipSet = (k, v) => LS.set(vkey(k), v);

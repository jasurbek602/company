// Auth + ma'lumotlar qatlami. Supabase sozlangan bo'lsa — Google OAuth + Postgres.
// Sozlanmagan bo'lsa — "demo rejim": localStorage (lokal sinov uchun).

const cfg = window.APP_CONFIG || {};
export const DEMO = !(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
let sb = null;
let user = null;
const listeners = new Set();

const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export async function initAuth() {
  if (DEMO) {
    user = LS.get("demo_user", null);
  } else {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.4");
    sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    user = mapUser(data.session?.user);
    sb.auth.onAuthStateChange((_e, session) => { user = mapUser(session?.user); emit(); });
  }
  emit();
}

const mapUser = (u) => u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email, avatar: u.user_metadata?.avatar_url } : null;
const emit = () => listeners.forEach((f) => f(user));
export const onUser = (f) => { listeners.add(f); f(user); };
export const getUser = () => user;
export const accessToken = async () => (sb ? (await sb.auth.getSession()).data.session?.access_token : null);

export async function signIn() {
  if (DEMO) {
    user = { id: "demo-" + Math.random().toString(36).slice(2, 9), email: "demo@local", name: "Demo foydalanuvchi", avatar: null };
    LS.set("demo_user", user); emit(); return;
  }
  await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
}
export async function signOut() {
  if (DEMO) { localStorage.removeItem("demo_user"); user = null; emit(); return; }
  await sb.auth.signOut();
}

/* ---------- profile: premium + tokens ---------- */
export async function getProfile() {
  if (!user) return { is_premium: false, tokens: 0 };
  if (DEMO) return LS.get("demo_profile_" + user.id, { is_premium: false, tokens: 0 });
  const { data } = await sb.from("profiles").select("is_premium,tokens").eq("id", user.id).maybeSingle();
  return data || { is_premium: false, tokens: 0 };
}
export async function addTokens(n) {
  if (!user) return;
  if (DEMO) { const p = await getProfile(); p.tokens += n; LS.set("demo_profile_" + user.id, p); return p.tokens; }
  const { data, error } = await sb.rpc("add_tokens", { amount: n });
  if (error) throw error;
  return data;
}
export async function demoActivatePremium() {
  const p = await getProfile(); p.is_premium = true; LS.set("demo_profile_" + user.id, p);
}

/* ---------- IQ results ---------- */
export async function saveResult(r) {
  if (!user) { LS.set("pending_result", r); return; }
  const row = { iq: r.iq, percentile: r.percentile, correct: r.right, total: r.total, duration_sec: r.usedSeconds, details: r };
  if (DEMO) { const all = LS.get("demo_results_" + user.id, []); all.unshift({ ...row, created_at: new Date().toISOString() }); LS.set("demo_results_" + user.id, all); return; }
  const { error } = await sb.from("iq_results").insert({ ...row, user_id: user.id });
  if (error) throw error;
}
export async function listResults() {
  if (!user) return [];
  if (DEMO) return LS.get("demo_results_" + user.id, []);
  const { data } = await sb.from("iq_results").select("*").order("created_at", { ascending: false }).limit(20);
  return data || [];
}
export const takePending = () => { const r = LS.get("pending_result", null); localStorage.removeItem("pending_result"); return r; };

/* ---------- detective progress ---------- */
export async function solvedCases() {
  if (!user) return [];
  if (DEMO) return LS.get("demo_cases_" + user.id, []);
  const { data } = await sb.from("detective_progress").select("case_id,score");
  return data || [];
}
export async function saveCase(case_id, score) {
  if (DEMO) { const a = LS.get("demo_cases_" + user.id, []).filter((c) => c.case_id !== case_id); a.push({ case_id, score }); LS.set("demo_cases_" + user.id, a); return; }
  await sb.from("detective_progress").insert({ user_id: user.id, case_id, score });
}

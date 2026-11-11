// Admin panel (alohida sahifa: /admin). Token faqat sessionStorage'da — tab yopilsa chiqib ketadi.
// 15 daqiqa harakatsizlikdan keyin avtomatik chiqish.
const root = document.getElementById("root");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (d) => (d ? new Date(d).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" }) : "—");
let token = sessionStorage.getItem("adm_t") || "";
let tab = "home", idleT = null;

function toast(m) { const t = document.getElementById("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2800); }
async function api(action, body = {}) {
  const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ action, ...body }), credentials: "omit", cache: "no-store" });
  const j = await r.json().catch(() => ({ error: "Javob noto'g'ri" }));
  if (r.status === 401 && action !== "login") { logout("Sessiya tugadi — qayta kiring"); throw new Error("401"); }
  if (!r.ok) throw new Error(j.error || "Xato");
  return j;
}
function logout(msg) { token = ""; sessionStorage.removeItem("adm_t"); if (msg) toast(msg); loginView(); }
function bumpIdle() { clearTimeout(idleT); idleT = setTimeout(() => logout("15 daqiqa harakatsizlik — chiqildi"), 15 * 60 * 1000); }
["click", "keydown"].forEach((ev) => addEventListener(ev, () => token && bumpIdle()));

/* ---------------- kirish ---------------- */
function loginView() {
  root.innerHTML = `<form class="login" id="lf" autocomplete="off">
    <h1>🛡 Boshqaruv paneli</h1><p class="muted small">Faqat administrator uchun. Barcha urinishlar qayd etiladi.</p>
    <label class="field">Parol<input type="password" name="p" required autocomplete="current-password" maxlength="300"></label>
    <label class="field">Tasdiqlash kodi (Authenticator, 6 raqam)<input name="c" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" autocomplete="one-time-code"></label>
    <button class="btn w" type="submit">Kirish</button></form>`;
  const f = document.getElementById("lf");
  f.onsubmit = async (e) => {
    e.preventDefault(); const b = f.querySelector("button"); b.disabled = true;
    try { const r = await api("login", { password: f.p.value, code: f.c.value.trim() }); token = r.token; sessionStorage.setItem("adm_t", token); f.reset(); bumpIdle(); shell(); }
    catch (err) { toast(err.message); b.disabled = false; f.p.value = ""; }
  };
}

/* ---------------- asosiy qobiq ---------------- */
const TABS = [["home", "📊 Umumiy"], ["users", "👑 Premium a'zolar"], ["ratings", "🏆 Reyting"], ["backup", "💾 Zaxira"], ["audit", "📜 Jurnal"]];
function shell() {
  root.innerHTML = `<header class="top"><b>🛡 Company IQ</b><nav class="tabs">${TABS.map(([k, t]) => `<button data-t="${k}" class="${k === tab ? "on" : ""}">${t}</button>`).join("")}</nav>
    <div class="right"><button class="btn ghost sm" id="out">Chiqish</button></div></header><div class="wrap" id="v"></div>`;
  root.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { tab = b.dataset.t; shell(); }));
  document.getElementById("out").onclick = () => logout("Chiqildi");
  ({ home, users, ratings, backup, audit })[tab]().catch((e) => e.message !== "401" && toast(e.message));
}
const V = () => document.getElementById("v");

async function home() {
  const s = await api("stats");
  V().innerHTML = `${!s.totp ? `<div class="warnbox">⚠️ Ikki bosqichli himoya (ADMIN_TOTP_SECRET) yoqilmagan — uni albatta yoqing.</div>` : ""}${!s.backupKey ? `<div class="warnbox">⚠️ BACKUP_KEY o'rnatilmagan — zaxira nusxalar ishlamaydi.</div>` : ""}
    <div class="grid"><div class="card stat"><span class="muted">Premium a'zolar</span><b>${s.users}</b></div><div class="card stat"><span class="muted">Reyting yozuvlari</span><b>${s.ratings}</b></div><div class="card stat"><span class="muted">Zaxira nusxalar</span><b>${s.backups}</b></div><div class="card stat"><span class="muted">Baza</span><b style="font-size:20px">${s.store === "mongo" ? "MongoDB ✓" : "Xotira (sinov)"}</b></div></div>`;
}

async function users() {
  const { users: list } = await api("users.list");
  const now = Date.now();
  V().innerHTML = `<div class="card"><h2>Yangi Premium a'zo</h2>
      <form id="nf" class="row" autocomplete="off">
        <label class="field" style="flex:1 1 180px">Ism<input name="name" required maxlength="60" placeholder="Ali Valiyev"></label>
        <label class="field" style="flex:1 1 160px">Login<input name="login" required pattern="[a-zA-Z0-9_.\\-]{3,30}" maxlength="30" placeholder="ali2026"></label>
        <label class="field" style="flex:0 1 150px">Muddat<select name="days"><option value="30">1 oy</option><option value="90">3 oy</option><option value="365">1 yil</option><option value="">Cheksiz</option></select></label>
        <button class="btn" style="align-self:flex-end;margin-bottom:14px">Yaratish</button></form><div id="sec"></div></div>
    <div class="card" style="margin-top:14px"><h2>A'zolar (${list.length})</h2><div class="tbl"><table><thead><tr><th>Ism</th><th>Login</th><th>Holat</th><th>Muddat</th><th>Yaratilgan</th><th>Oxirgi kirish</th><th></th></tr></thead><tbody>
    ${list.map((u) => { const exp = u.expires_at && new Date(u.expires_at).getTime() < now; return `<tr><td>${esc(u.name)}</td><td><code>${esc(u.login)}</code></td>
      <td>${u.disabled ? '<span class="pill bad">Bloklangan</span>' : exp ? '<span class="pill warn">Muddati tugagan</span>' : '<span class="pill ok">Faol</span>'}</td>
      <td>${u.expires_at ? fmt(u.expires_at) : "Cheksiz"}</td><td>${fmt(u.created_at)}</td><td>${fmt(u.last_login)}</td>
      <td class="row"><button class="btn ghost sm" data-a="extend" data-l="${esc(u.login)}">+30 kun</button><button class="btn ghost sm" data-a="reset" data-l="${esc(u.login)}">Yangi parol</button><button class="btn ghost sm" data-a="toggle" data-l="${esc(u.login)}">${u.disabled ? "Ochish" : "Bloklash"}</button><button class="btn bad sm" data-a="delete" data-l="${esc(u.login)}">O'chirish</button></td></tr>`; }).join("") || `<tr><td colspan="7" class="muted">Hali a'zo yo'q</td></tr>`}
    </tbody></table></div></div>`;
  const showSecret = (login, password) => { document.getElementById("sec").innerHTML = `<div class="secret"><b>Foydalanuvchiga yuboring</b> (parol faqat hozir ko'rinadi):<code>Login: ${esc(login)}</code><code>Parol: ${esc(password)}</code><button class="btn sm" id="cp">📋 Nusxalash</button></div>`; document.getElementById("cp").onclick = async () => { try { await navigator.clipboard.writeText(`Login: ${login}\nParol: ${password}`); toast("Nusxalandi"); } catch { toast("Qo'lda nusxalang"); } }; };
  const f = document.getElementById("nf");
  f.onsubmit = async (e) => { e.preventDefault(); try { const r = await api("users.create", { name: f.name.value.trim(), login: f.login.value.trim(), days: f.days.value ? +f.days.value : null }); await users(); showSecret(r.login, r.password); } catch (err) { toast(err.message); } };
  V().querySelectorAll("[data-a]").forEach((b) => (b.onclick = async () => {
    const l = b.dataset.l, a = b.dataset.a;
    try {
      if (a === "reset") { if (!confirm(`${l} uchun yangi parol yaratilsinmi? Eski parol va sessiyalar bekor bo'ladi.`)) return; const r = await api("users.reset", { login: l }); await users(); showSecret(r.login, r.password); return; }
      if (a === "toggle") await api("users.toggle", { login: l });
      if (a === "extend") await api("users.extend", { login: l, days: 30 });
      if (a === "delete") { const c = prompt(`O'chirishni tasdiqlash uchun loginni yozing: ${l}`); if (c !== l) return toast("Bekor qilindi"); await api("users.delete", { login: l, confirm: c }); }
      toast("Bajarildi ✓"); users();
    } catch (err) { toast(err.message); }
  }));
}

async function ratings() {
  const { ratings: list } = await api("ratings.list", { skip: 0 });
  V().innerHTML = `<div class="card"><h2>So'nggi natijalar (${list.length})</h2><div class="tbl"><table><thead><tr><th>Ism</th><th>Yosh</th><th>IQ</th><th>Persentil</th><th>Sana</th><th>Premium</th><th></th></tr></thead><tbody>
    ${list.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.age ?? "—"}</td><td><b>${r.iq}</b></td><td>${r.percentile}%</td><td>${fmt(r.created_at)}</td><td>${r.vip ? "👑" : ""}</td><td><button class="btn bad sm" data-id="${esc(r.id)}">O'chirish</button></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Hali natija yo'q</td></tr>`}
    </tbody></table></div><p class="muted small">Nomaqbul ism yoki soxta natijani o'chirish mumkin.</p></div>`;
  V().querySelectorAll("[data-id]").forEach((b) => (b.onclick = async () => { if (!confirm("Natija o'chirilsinmi?")) return; try { await api("ratings.delete", { id: b.dataset.id }); toast("O'chirildi"); ratings(); } catch (e) { toast(e.message); } }));
}

async function backup() {
  const { backups: list } = await api("backup.list");
  V().innerHTML = `<div class="card"><h2>Zaxira nusxalar</h2>
      <p class="muted small">Har kuni soat 03:00 (UTC) da avtomatik shifrlangan nusxa olinadi, oxirgi 30 tasi saqlanadi. Fayllar <b>AES-256</b> bilan shifrlangan — ularni faqat BACKUP_KEY bilan ochish mumkin.</p>
      <div class="row"><button class="btn" id="mk">💾 Hozir nusxa olish</button><label class="btn ghost" style="cursor:pointer">📤 Fayldan tiklash<input type="file" id="up" accept="application/json" hidden></label></div></div>
    <div class="card" style="margin-top:14px"><div class="tbl"><table><thead><tr><th>Sana</th><th>Turi</th><th></th></tr></thead><tbody>
    ${list.map((b) => `<tr><td>${fmt(b.at)}</td><td>${b.kind === "auto" ? "Avtomatik" : "Qo'lda"}</td><td><button class="btn ghost sm" data-id="${esc(b.id)}">⬇ Yuklab olish</button></td></tr>`).join("") || `<tr><td colspan="3" class="muted">Hali nusxa yo'q</td></tr>`}
    </tbody></table></div></div>`;
  document.getElementById("mk").onclick = async () => { try { await api("backup.create"); toast("Nusxa olindi ✓"); backup(); } catch (e) { toast(e.message); } };
  V().querySelectorAll("[data-id]").forEach((b) => (b.onclick = async () => {
    try { const { file } = await api("backup.download", { id: b.dataset.id }); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: "application/json" })); a.download = `company-iq-backup-${new Date(file.at).toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
    catch (e) { toast(e.message); }
  }));
  document.getElementById("up").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const c = prompt("Tiklash mavjud yozuvlarni o'chirmaydi, faqat yetishmaganlarini qo'shadi. Tasdiqlash uchun TIKLASH deb yozing:");
    if (c !== "TIKLASH") return toast("Bekor qilindi");
    try { const file = JSON.parse(await f.text()); const r = await api("backup.restore", { file, confirm: "TIKLASH" }); toast(`Tiklandi: ${r.users} a'zo, ${r.ratings} natija`); }
    catch (err) { toast(err.message); }
  };
}

async function audit() {
  const { audit: list } = await api("audit.list");
  const L = { "admin.login.ok": "✅ Admin kirdi", "admin.login.fail": "⛔ Noto'g'ri admin urinish", "admin.login.blocked": "🚫 Admin kirish bloklandi", "user.create": "➕ A'zo yaratildi", "user.reset": "🔑 Parol yangilandi", "user.disable": "🔒 Bloklandi", "user.enable": "🔓 Ochildi", "user.extend": "⏳ Muddat uzaytirildi", "user.delete": "🗑 A'zo o'chirildi", "rating.delete": "🗑 Natija o'chirildi", "backup.create": "💾 Nusxa olindi", "backup.auto": "💾 Avto nusxa", "backup.download": "⬇ Nusxa yuklandi", "backup.restore": "📤 Tiklandi" };
  V().innerHTML = `<div class="card"><h2>Xavfsizlik jurnali</h2><div class="tbl"><table><thead><tr><th>Vaqt</th><th>Hodisa</th><th>Tafsilot</th></tr></thead><tbody>
    ${list.map((a) => `<tr><td>${fmt(a.at)}</td><td>${esc(L[a.type] || a.type)}</td><td class="muted small">${esc(a.login || a.id || (a.users != null ? `${a.users} a'zo, ${a.ratings} natija` : "") || "")}</td></tr>`).join("") || `<tr><td colspan="3" class="muted">Bo'sh</td></tr>`}
    </tbody></table></div></div>`;
}

if (token) { bumpIdle(); shell(); } else loginView();

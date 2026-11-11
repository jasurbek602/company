// Admin paneli: premium foydalanuvchi yaratish (login + kuchli parol + xesh).
// Sayt statik bo'lgani uchun yangi foydalanuvchini data/premium-users.json ga qo'shib, commit/push qilish kerak
// (yoki terminalda: npm run add-premium -- <login> "<Ism>").
import * as db from "./db.js";
import { toast, esc } from "./app.js";

let unlocked = false;

export async function renderAdmin(app) {
  if (!unlocked) {
    app.innerHTML = `<section class="card" style="max-width:460px;margin:40px auto">
      <h1 style="font-size:26px">🛡 Admin paneli</h1>
      <form id="af" class="stack"><label class="field"><span>Admin paroli</span><input type="password" name="p" required autocomplete="current-password"></label><button class="btn" type="submit">Kirish</button></form></section>`;
    app.querySelector("#af").onsubmit = async (e) => {
      e.preventDefault();
      try { if (await db.adminCheck(e.target.p.value)) { unlocked = true; renderAdmin(app); } else toast("Parol noto'g'ri"); }
      catch (err) { toast(err.message); }
    };
    return;
  }
  const list = await db.premiumUsers(true);
  app.innerHTML = `<div style="max-width:900px;margin:0 auto">
    <h1 class="grad-text">🛡 Admin paneli</h1>
    <div class="grid g2">
      <section class="card stack">
        <h2 style="font-size:20px">Yangi Premium foydalanuvchi</h2>
        <form id="nf" class="stack">
          <label class="field"><span>Login (lotin, raqam)</span><input name="login" required pattern="[a-zA-Z0-9_.-]{3,30}" placeholder="masalan: ali2026"></label>
          <label class="field"><span>Ism</span><input name="name" required maxlength="40" placeholder="Ali Valiyev"></label>
          <button class="btn gold" type="submit">Parol yaratish</button>
        </form>
        <div id="out"></div>
      </section>
      <section class="card">
        <h2 style="font-size:20px">Mavjud a'zolar (${list.users?.length || 0})</h2>
        <div class="board">${(list.users || []).map((u) => `<div class="board-row"><span class="rk">👑</span><span class="nm">${esc(u.name || u.login)}<small>@${esc(u.login)} · ${esc(u.created || "")}</small></span></div>`).join("") || `<p class="muted">Hali yo'q.</p>`}</div>
        <p class="small muted mt">O'chirish: data/premium-users.json dan yozuvni olib tashlab, push qiling — foydalanuvchi keyingi kirishda chiqarib yuboriladi.</p>
      </section>
    </div>
  </div>`;
  app.querySelector("#nf").onsubmit = async (e) => {
    e.preventDefault();
    const login = e.target.login.value.trim(), name = e.target.name.value.trim();
    if (list.users?.some((u) => u.login.toLowerCase() === login.toLowerCase())) return toast("Bu login band");
    const password = db.randomPassword(12), salt = db.randomSalt();
    const entry = { login, name, salt, hash: await db.sha256(`${salt}:${password}`), created: new Date().toISOString().slice(0, 10) };
    const updated = { ...list, users: [...(list.users || []), entry] };
    const json = JSON.stringify(updated, null, 2);
    app.querySelector("#out").innerHTML = `<div class="card" style="background:rgba(46,229,157,.08)">
      <p><b>Foydalanuvchiga yuboring:</b></p>
      <p class="mono">Login: ${esc(login)}<br>Parol: ${esc(password)}</p>
      <p class="small muted">Parol faqat hozir ko'rinadi. Keyin quyidagi faylni <code>data/premium-users.json</code> ga to'liq almashtirib, GitHub'ga push qiling.</p>
      <div class="row"><button class="btn sm" id="cpy">📋 Login+parolni nusxalash</button><button class="btn ghost sm" id="dl">⬇ premium-users.json</button></div></div>`;
    app.querySelector("#cpy").onclick = async () => { try { await navigator.clipboard.writeText(`Login: ${login}\nParol: ${password}`); toast("Nusxalandi"); } catch {} };
    app.querySelector("#dl").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = "premium-users.json"; a.click(); };
  };
}

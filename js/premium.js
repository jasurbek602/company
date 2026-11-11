import * as db from "./db.js";
import { toast, confetti, esc } from "./app.js";
import { rankOf } from "./detective.js";

const PLANS = [
  { id: "month", name: "Oylik", price: "49 000", per: "so'm / oy", feats: ["Cheksiz IQ testlar", "Chuqur kognitiv tahlil", "7 ta miya trenajyori", "6 ta detektiv ishi"] },
  { id: "year", name: "Yillik", price: "390 000", per: "so'm / yil", best: true, feats: ["Oylikdagi hammasi", "33% tejash", "Yangi detektiv ishlari birinchi", "Natijalar dinamikasi"] },
  { id: "life", name: "Umrbod", price: "790 000", per: "so'm bir marta", feats: ["Barcha imkoniyatlar abadiy", "Kelajakdagi barcha o'yinlar", "Ustuvor yordam", "Reytingda 👑 nishon"] },
];

export async function renderPremium(app) {
  if (db.isPremium()) return cabinet(app);
  const list = await db.premiumUsers();
  const contact = list.contact || db.ADMIN_CONTACT;
  app.innerHTML = `<div>
    <section class="center mb">
      <span class="tag gold">👑 Premium a'zolar bo'limi</span>
      <h1 class="mt grad-text" style="font-size:clamp(30px,5vw,52px)">Intellektingizni keyingi darajaga olib chiqing</h1>
      <p class="muted" style="max-width:640px;margin:0 auto">Premium akkaunt admin tomonidan beriladi: to'lovdan so'ng sizga <b style="color:#fff">login va parol</b> yuboriladi. Bir marta kirsangiz — qurilmangizda saqlanib qoladi.</p>
    </section>

    <div class="grid g2-1 mb">
      <section class="card vip-login">
        <h2 style="font-size:22px">🔐 Premium akkauntga kirish</h2>
        <form id="vf" class="stack">
          <label class="field"><span>Login</span><input name="login" required autocomplete="username" placeholder="Admin bergan login"></label>
          <label class="field"><span>Parol</span><div class="pw"><input name="password" type="password" required autocomplete="current-password" placeholder="••••••••••••"><button type="button" class="eye" aria-label="Parolni ko'rsatish">👁</button></div></label>
          <button class="btn gold lg" type="submit" style="width:100%">Kirish</button>
          <p class="small muted" style="margin:0">Parol qurilmangizda xavfsiz (xesh ko'rinishida) saqlanadi — keyingi safar avtomatik kirasiz.</p>
        </form>
      </section>
      <section class="card stack">
        <h2 style="font-size:22px">Qanday olinadi?</h2>
        <ol class="steps-list"><li>Tarifni tanlang</li><li>Admin bilan bog'laning va to'lov qiling</li><li>Admin sizga login va parol beradi</li><li>Shu yerda kiring — hammasi ochiladi</li></ol>
        ${contact ? `<a class="btn" href="${esc(contact)}" target="_blank" rel="noopener">✉️ Admin bilan bog'lanish</a>` : `<p class="small muted">Admin kontakti hali qo'shilmagan.</p>`}
      </section>
    </div>

    <div class="plans">
      ${PLANS.map((pl, i) => `<div class="card plan ${pl.best ? "best" : ""} reveal" style="transition-delay:${i * 90}ms">
        ${pl.best ? `<span class="tag gold ribbon">Eng foydali</span>` : ""}
        <h3>${pl.name}</h3>
        <div class="price">${pl.price} <small>${pl.per}</small></div>
        <ul>${pl.feats.map((f) => `<li>${f}</li>`).join("")}</ul>
        ${contact ? `<a class="btn ${pl.best ? "gold" : "ghost"}" href="${esc(contact)}" target="_blank" rel="noopener">Sotib olish</a>` : `<button class="btn ghost" disabled>Admin orqali</button>`}
      </div>`).join("")}
    </div>
  </div>`;
  const f = app.querySelector("#vf");
  f.querySelector(".eye").onclick = () => { const i = f.password; i.type = i.type === "password" ? "text" : "password"; };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const btn = f.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Tekshirilmoqda…";
    try {
      const v = await db.vipLogin(f.login.value, f.password.value);
      confetti(); toast(`Xush kelibsiz, ${v.name}! 👑`);
    } catch (err) {
      f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
      toast(err.message); btn.disabled = false; btn.textContent = "Kirish";
    }
  };
}

async function cabinet(app) {
  const v = db.getVip();
  const p = await db.getProfile();
  const solved = await db.solvedCases();
  const rank = rankOf(p.tokens);
  const best = (k) => { try { return JSON.parse(localStorage.getItem("best_" + k)); } catch { return null; } };
  const nback = db.vipGet("nback_level", 1);
  app.innerHTML = `<div>
    <section class="card cab-hero">
      <div class="row" style="gap:16px"><span class="avatar big">${esc(v.name[0].toUpperCase())}</span>
      <div><div class="tag gold">👑 Premium a'zo</div><h1 style="margin:8px 0 0">${esc(v.name)}</h1><div class="muted small">@${esc(v.login)}</div></div></div>
      <div class="row"><span class="tag tokens">🪙 ${p.tokens} token</span><span class="tag">${rank.ico} ${rank.name}</span><button class="btn ghost sm" id="out">Chiqish</button></div>
    </section>
    <div class="grid g4 mt">
      <div class="card stat"><span class="muted small">Detektiv ishlari</span><b>${solved.length}/6</b></div>
      <div class="card stat"><span class="muted small">Dual N-Back darajasi</span><b>${nback}-back</b></div>
      <div class="card stat"><span class="muted small">Schulte rekordi</span><b>${best("schulte") ?? "—"}${best("schulte") ? " s" : ""}</b></div>
      <div class="card stat"><span class="muted small">IQ trener seriyasi</span><b>${best("trainer") ?? "—"}</b></div>
    </div>
    <h2 class="section-title">Premium imkoniyatlar</h2>
    <div class="grid g3">
      <a href="#/test" class="card feature" style="text-decoration:none"><div class="ico">🧠</div><h3>Cheksiz IQ test</h3><p>Har safar yangi savollar, chuqur tahlil bilan.</p></a>
      <a href="#/games" class="card feature" style="text-decoration:none"><div class="ico">🎮</div><h3>Miya trenajyorlari</h3><p>Dual N-Back, IQ trener, Aylantirish, Schulte va boshqalar.</p></a>
      <a href="#/detective" class="card feature" style="text-decoration:none"><div class="ico">🕵️</div><h3>Detektiv byurosi</h3><p>Keyingi unvon: ${rank.next ? `${rank.next.name} (${rank.next.min} 🪙)` : "eng yuqori!"}</p></a>
    </div>
  </div>`;
  app.querySelector("#out").onclick = () => { db.vipLogout(); toast("Akkauntdan chiqdingiz"); };
}

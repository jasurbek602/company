import * as db from "./db.js";
import { toast, confetti, esc } from "./app.js";
import { rankOf } from "./detective.js";

// Premium — bitta, bir martalik to'lov. Muddat ko'rsatilmaydi.
const PRICE = "15 000";
const BENEFITS = [
  { ico: "🧠", t: "Kuchli Premium IQ test — cheksiz", d: ["60 ta savol, 45 daqiqa", "24 xil savol turi (bepulda 18 ta)", "Aniqroq natija: ±3,5 ball", "Istagancha qayta yechish — har safar yangi savollar"] },
  { ico: "📊", t: "Chuqur kognitiv tahlil", d: ["4 ta indeks: mantiq, fazoviy, sonli, og'zaki", "Kuchli va zaif tomonlaringiz batafsil", "Shaxsiy rivojlanish rejasi", "Sizga mos kasblar tavsiyasi"] },
  { ico: "🕵️", t: "3D Detektiv — barcha 12 ish ochiq", d: ["Bepulda faqat 1-ish, Premiumda hammasi", "Ketma-ketlik shart emas — istaganingizdan boshlang", "Tergov, so'roq, dalillar taxtasi, sud zali", "Tokenlar va detektiv unvonlari"] },
  { ico: "🎮", t: "Barcha miya trenajyorlari", d: ["Dual N-Back — xotira uchun eng kuchli mashq", "IQ trener, Aylantirish, Schulte jadvali", "Rekordlar va darajalar saqlanadi", "Kunlik mashq bilan tez rivojlanish"] },
  { ico: "🏆", t: "Reytingda 👑 belgisi", d: ["Natijangiz umumiy reytingda Premium belgisi bilan", "Har bir natijangiz tarixda saqlanadi", "O'sishingizni kuzatib boring"] },
  { ico: "♾️", t: "Bir marta to'lang — tamom", d: ["Obuna yo'q, har oy pul yechilmaydi", "Kelajakdagi yangi ishlar va o'yinlar ham kiradi", "Shaxsiy login va parol — istalgan qurilmadan kirasiz"] },
];
const COMPARE = [
  ["IQ test", "1 marta, 36 savol", "Cheksiz, 60 savol"],
  ["Savol turlari", "18 tur", "24 tur"],
  ["Natija aniqligi", "±4,5 ball", "±3,5 ball"],
  ["Tahlil", "5 ta qisqa xulosa", "Chuqur tahlil + reja + kasblar"],
  ["3D Detektiv ishlari", "1 ta", "Barcha 12 ta"],
  ["Miya trenajyorlari", "Asosiylari", "Hammasi (Dual N-Back, IQ trener…)"],
  ["Reytingda 👑 belgisi", "—", "✓"],
];

export async function renderPremium(app) {
  if (db.isPremium()) return cabinet(app);
  const list = await db.premiumUsers();
  const contact = list.contact || db.ADMIN_CONTACT;
  const buy = (cls = "gold lg", txt = `👑 Premium olish — ${PRICE} so'm`) => contact
    ? `<a class="btn ${cls}" href="${esc(contact)}" target="_blank" rel="noopener">${txt}</a>`
    : `<button class="btn ${cls}" disabled>Admin orqali</button>`;
  app.innerHTML = `<div>
    <section class="center mb">
      <span class="tag gold">👑 Premium</span>
      <h1 class="mt grad-text" style="font-size:clamp(30px,5vw,52px)">Hamma narsani oching — bir marta to'lov bilan</h1>
      <div class="pm-price"><b>${PRICE}</b> <span>so'm</span></div>
      <p class="pm-once">✅ Bir martalik to'lov · obuna yo'q · qo'shimcha to'lov yo'q</p>
      <div class="row" style="justify-content:center;margin-top:14px">${buy()}</div>
    </section>

    <h2 class="section-title center">Premium bilan nimalar ochiladi?</h2>
    <div class="pm-benefits">
      ${BENEFITS.map((b, i) => `<div class="card pm-ben reveal" style="transition-delay:${i * 70}ms">
        <div class="pm-ico">${b.ico}</div>
        <h3>${b.t}</h3>
        <ul>${b.d.map((x) => `<li>${x}</li>`).join("")}</ul>
      </div>`).join("")}
    </div>

    <h2 class="section-title center">Bepul va Premium farqi</h2>
    <div class="card pm-cmp"><table>
      <thead><tr><th></th><th>Bepul</th><th class="gold-c">👑 Premium</th></tr></thead>
      <tbody>${COMPARE.map((r) => `<tr><td>${r[0]}</td><td class="muted">${r[1]}</td><td class="gold-c"><b>${r[2]}</b></td></tr>`).join("")}</tbody>
    </table></div>

    <div class="grid g2-1 mt">
      <section class="card stack">
        <h2 style="font-size:22px">Qanday olinadi?</h2>
        <ol class="steps-list"><li>Telegramda admin bilan bog'laning</li><li>${PRICE} so'm to'lov qiling (bir marta)</li><li>Admin sizga login va parol beradi</li><li>Shu sahifada kiring — hammasi darhol ochiladi</li></ol>
        ${buy("gold", "✉️ Telegram orqali olish")}
      </section>
      <section class="card vip-login">
        <h2 style="font-size:22px">🔐 Premium akkauntga kirish</h2>
        <form id="vf" class="stack">
          <label class="field"><span>Login</span><input name="login" required autocomplete="username" placeholder="Admin bergan login"></label>
          <label class="field"><span>Parol</span><div class="pw"><input name="password" type="password" required autocomplete="current-password" placeholder="••••••••••••"><button type="button" class="eye" aria-label="Parolni ko'rsatish">👁</button></div></label>
          <button class="btn gold lg" type="submit" style="width:100%">Kirish</button>
          <p class="small muted" style="margin:0">Bir marta kirsangiz — qurilmangizda saqlanib qoladi.</p>
        </form>
      </section>
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
      <div class="card stat"><span class="muted small">Detektiv ishlari</span><b>${solved.length}/12</b></div>
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

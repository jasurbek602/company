import { genItem, genType, buildSchedule, CATEGORIES, shuffle } from "./questions.js";
import { score, fivePoints, deepAnalysis, band, estimate, levelToB } from "./scoring.js";
import * as db from "./db.js";
import { renderGames } from "./games.js";
import { renderDetective, detHandles } from "./detective.js";
import { renderPremium } from "./premium.js";
import { renderAdmin } from "./admin.js";
import { renderKids } from "./kids.js";

const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function toast(msg, ms = 2800) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms);
}
export function confetti(n = 80) {
  const colors = ["#7c5cff", "#00d4ff", "#ff4fd8", "#ffc94d", "#2ee59d"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 2 + "s";
    c.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}
export const vipBtn = (label = "👑 Premium kirish", cls = "gold") => `<a href="#/vip" class="btn ${cls}">${label}</a>`;

/* ---------------- header ---------------- */
function renderAuth({ vip }) {
  const box = $("#auth");
  box.innerHTML = vip
    ? `<a href="#/vip" class="vip-chip"><span class="avatar">${esc(vip.name[0].toUpperCase())}</span><span class="uname">${esc(vip.name.split(" ")[0])}</span><span class="crown">👑</span></a>`
    : `<a href="#/vip" class="btn gold sm">👑 Premium</a>`;
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".nav a")) $("#nav").classList.remove("open");
});
$("#burger").addEventListener("click", () => $("#nav").classList.toggle("open"));
$("#year").textContent = new Date().getFullYear();

/* ---------------- router ---------------- */
let cleanup = null;
export const setCleanup = (f) => {
  const prev = cleanup;
  cleanup = () => { try { prev?.(); } finally { f(); } };
};
const routes = {
  "": home, test: testIntro, result: resultView, me: myPage, rating: ratingPage,
  vip: () => renderPremium(app), admin: () => (db.API ? (location.href = "/admin") : renderAdmin(app)), kids: () => renderKids(app),
  games: () => gate("Miya o'yinlari", () => renderGames(app)),
  // Detektiv: 1-ish hamma uchun bepul, qolganlari Premium (detective.js ichida tekshiriladi)
  detective: () => renderDetective(app),
};
async function router() {
  const [path, arg] = location.hash.replace(/^#\/?/, "").split("/");
  // 3D detektiv ichidagi o'tishlar — sahifa qayta qurilmaydi, faqat sahna almashadi
  if (path === "detective" && detHandles()) return;
  if (cleanup) { const c = cleanup; cleanup = null; c(); }
  document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#/" + path));
  app.innerHTML = "";
  await (routes[path] || home)(arg);
  app.firstElementChild?.classList.add("view");
  window.scrollTo({ top: 0, behavior: "instant" });
  observeReveal();
}
export function observeReveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.08 });
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
}

async function gate(title, render) {
  if (db.isPremium()) return render();
  app.innerHTML = `<section class="card center" style="max-width:640px;margin:40px auto">
    <div class="tag gold">👑 Premium</div>
    <h1 class="mt">${title}</h1>
    <p class="muted">Bu bo'lim faqat Premium a'zolar uchun. Premium akkaunt login va parolini admin beradi — bir marta kirsangiz, qurilmangizda saqlanib qoladi.</p>
    <div class="row" style="justify-content:center">${vipBtn("👑 Premium bo'limiga o'tish", "gold lg")}</div>
  </section>`;
}

/* ---------------- reyting jadvali ---------------- */
const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1);
function boardTable(rows, highlight) {
  if (!rows.length) return `<div class="empty-board"><div style="font-size:44px">🏆</div><p class="muted">Reyting hali bo'sh. Birinchi bo'lib testdan o'ting va yuqoriga chiqing!</p><a href="#/test" class="btn">Testni boshlash</a></div>`;
  return `<div class="board">${rows.map((r, i) => `<div class="board-row ${highlight && r.created_at === highlight ? "me" : ""}" style="animation-delay:${Math.min(i, 12) * 45}ms">
      <span class="rk">${medal(i)}</span>
      <span class="nm">${esc(r.name)}${r.vip ? ' <span title="Premium">👑</span>' : ""}<small>${r.age ? r.age + " yosh" : ""}</small></span>
      <span class="iqv">${r.iq}</span></div>`).join("")}</div>`;
}

/* ---------------- HOME ---------------- */
async function home() {
  const lb = await db.leaderboard(10);
  const me = db.myResults()[0];
  app.innerHTML = `<div>
  <section class="hero">
    <div>
      <span class="tag">🧠 Moslashuvchan test · 7 qiyinlik darajasi</span>
      <h1 class="mt grad-text">Haqiqiy IQ darajangizni aniqlang</h1>
      <p class="lead">36 ta savol, 30 daqiqa. Test javoblaringizga moslashadi: to'g'ri javob bersangiz — savollar qiyinlashadi. Natija zamonaviy psixometrik model (IRT) asosida, yoshingizga moslab, ishonch oralig'i bilan hisoblanadi.</p>
      <div class="row mt">
        <a href="#/test" class="btn lg pulse-btn">Testni boshlash — bepul</a>
        <a href="#/rating" class="btn ghost lg">🏆 Reyting</a>
      </div>
      <div class="stats">
        <div><b data-count="7">0</b><span>qiyinlik darajasi</span></div>
        <div><b data-count="11">0</b><span>savol turi</span></div>
        <div><b>±4</b><span>IQ aniqlik (model)</span></div>
      </div>
    </div>
    <div class="hero-visual"><div class="orbit"><i></i></div><div class="orbit o2"><i></i></div><div class="orbit o3"><i></i></div><div class="core">IQ</div></div>
  </section>

  <section class="grid g2-1 mt reveal">
    <div class="card">
      <div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:22px">🏆 Eng yuqori natijalar</h2><a href="#/rating" class="btn ghost sm">Hammasi →</a></div>
      <p class="muted small">${lb.global ? "Umumiy reyting (barcha foydalanuvchilar)" : "Bu qurilmadagi reyting · ma'lumotlar bazasi ulanganda umumiy reytingga aylanadi"}</p>
      ${boardTable(lb.rows)}
    </div>
    <div class="card stack">
      <h2 style="margin:0;font-size:22px">Sizning natijangiz</h2>
      ${me ? `<div class="mini-iq"><b class="grad-text">${me.iq}</b><span>± ${me.ci ?? "?"} · ${esc(band(me.iq))}</span></div><p class="muted small">${new Date(me.created_at).toLocaleDateString("uz-UZ")} · ${esc(me.name)}</p><a href="#/me" class="btn ghost">Natijalarim</a>` : `<p class="muted">Hali test topshirmagansiz. Ismingiz va yoshingizni kiriting — natijangiz reytingga tushadi.</p><a href="#/test" class="btn">Boshlash</a>`}
      <div class="divider"></div>
      <p class="small muted">👑 Premium: cheksiz test, chuqur tahlil, Dual N-Back, IQ trener, 6 ta detektiv ishi.</p>
      ${db.isPremium() ? `<a href="#/vip" class="btn gold">Premium kabinet</a>` : vipBtn("Premium haqida")}
    </div>
  </section>

  <h2 class="section-title reveal">Test nimani o'lchaydi?</h2>
  <div class="grid g4">
    ${Object.entries(CATEGORIES).map(([k, c], i) => `<div class="card feature reveal" style="transition-delay:${i * 80}ms"><div class="ico">${c.icon}</div><h3>${c.name}</h3><p>${{ matrix: "Raven matritsalari: shakl, son, to'ldirish, burilish qoidalari va XOR/AND mantiqiy amallar.", numeric: "Ko'p qatlamli ketma-ketliklar, sonli jadvallar, analogiyalar va harf qatorlari.", verbal: "Sillogizmlar, rostgo'y-yolg'onchi jumboqlari, o'rindiq masalalari, shifrlar.", spatial: "Shakllarni aylantirish, kub yoyilmasi, qog'oz buklash va teshish." }[k]}</p></div>`).join("")}
  </div>

  <a href="#/kids" class="kids-banner reveal"><span class="kb-owl">🦉</span><div><b>Bilimdon bola — bolalar uchun bepul!</b><span>Sanash, hisob, harflar, mantiq, ranglar va xotira o'yinlari (4–10 yosh)</span></div><span class="kb-go">O'ynash →</span></a>

  <h2 class="section-title reveal">Premium bilan yanada chuqurroq</h2>
  <div class="grid g3">
    <a href="#/vip" class="card feature reveal" style="text-decoration:none"><span class="tag gold lock">👑</span><div class="ico">📊</div><h3>Chuqur tahlil</h3><p>4 ta kognitiv indeks, kategoriyalar bo'yicha IQ, 4 haftalik shaxsiy reja.</p></a>
    <a href="#/games" class="card feature reveal" style="text-decoration:none;transition-delay:80ms"><span class="tag gold lock">👑</span><div class="ico">🎮</div><h3>Miya trenajyorlari</h3><p>Dual N-Back (ilmiy asoslangan), IQ trener, Aylantirish, Schulte, Stroop va boshqalar.</p></a>
    <a href="#/detective" class="card feature reveal" style="text-decoration:none;transition-delay:160ms"><span class="tag gold lock">👑</span><div class="ico">🕵️</div><h3>3D Detektiv byurosi</h3><p>6 ta ish: 3D jinoyat joylarini tinting, so'roq qiling, yolg'onni fosh qiling, unvon va kunlik mukofotlar oling.</p></a>
  </div>
  </div>`;
  document.querySelectorAll("[data-count]").forEach((el) => { const to = +el.dataset.count; let v = 0; const iv = setInterval(() => { el.textContent = ++v; if (v >= to) clearInterval(iv); }, 90); });
}

/* ---------------- RATING ---------------- */
async function ratingPage() {
  const lb = await db.leaderboard(100);
  const groups = [["all", "Hammasi"], ["u18", "18 gacha"], ["18-30", "18–30"], ["31-50", "31–50"], ["50+", "50+"]];
  const inG = (r, g) => g === "all" || (r.age && (g === "u18" ? r.age < 18 : g === "18-30" ? r.age <= 30 && r.age >= 18 : g === "31-50" ? r.age > 30 && r.age <= 50 : r.age > 50));
  const mine = db.myResults()[0]?.created_at;
  app.innerHTML = `<div style="max-width:760px;margin:0 auto">
    <h1 class="grad-text">🏆 IQ reytingi</h1>
    <p class="muted">${lb.global ? "Barcha foydalanuvchilarning umumiy reytingi." : "Hozircha bu qurilmada topshirilgan testlar reytingi. Supabase ulanganda reyting umumiy bo'ladi."}</p>
    <div class="det-tabs" id="grp">${groups.map(([k, t], i) => `<button data-g="${k}" class="${i ? "" : "on"}">${t}</button>`).join("")}</div>
    <div class="card" id="tbl"></div></div>`;
  const draw = (g) => { $("#tbl").innerHTML = boardTable(lb.rows.filter((r) => inG(r, g)), mine); };
  draw("all");
  $("#grp").onclick = (e) => { const b = e.target.closest("[data-g]"); if (!b) return; $("#grp").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw(b.dataset.g); };
}

/* ---------------- TEST ---------------- */
// Ikki xil test: bepul (1 marta) va Premium (kuchliroq, aniqroq, cheksiz)
const MODES = {
  free: { n: 36, sec: 30 * 60, start: -0.3, bias: 0, label: "Bepul test" },
  // Premium: ko'proq savol = kichikroq xatolik; qiyinlik qobiliyatdan biroz yuqori tanlanadi
  // (3PL modelda taxmin ehtimoli tufayli eng ko'p ma'lumot shu nuqtada olinadi)
  premium: { n: 60, sec: 45 * 60, start: 0, bias: 0.3, label: "👑 Premium test" },
};
let MODE = MODES.free, TOTAL_SEC = MODE.sec, N_ITEMS = MODE.n;
const setMode = () => { MODE = db.isPremium() ? MODES.premium : MODES.free; TOTAL_SEC = MODE.sec; N_ITEMS = MODE.n; };
// Bepul imkoniyat qurilmada saqlanadi: {at, iq, name}
const freeUsed = () => { try { const v = localStorage.getItem("free_used"); return v ? (v === "1" ? { at: null } : JSON.parse(v)) : null; } catch { return null; } };
async function testIntro() {
  setMode();
  const used = freeUsed();
  if (used && !db.isPremium()) {
    const last = db.myResults()[0];
    app.innerHTML = `<section class="card center used-box" style="max-width:640px;margin:40px auto">
      <div class="used-ico">🔒</div>
      <div class="tag gold">Bepul imkoniyat ishlatilgan</div>
      <h1 class="mt">Siz bepul testdan foydalangansiz</h1>
      ${last ? `<div class="used-res"><span class="muted small">Sizning natijangiz${last.created_at ? " · " + new Date(last.created_at).toLocaleDateString("uz-UZ") : ""}</span><b class="grad-text">IQ ${last.iq}</b><span class="muted small">± ${last.ci ?? "?"} · ${esc(band(last.iq))}</span></div>` : ""}
      <p class="muted">Har bir qurilmada IQ testni <b>1 marta bepul</b> topshirish mumkin. Qayta va <b>kuchliroq test</b> (60 savol, yuqori aniqlik) — Premium a'zolar uchun.</p>
      <div class="row" style="justify-content:center">${last ? `<button class="btn ghost lg" id="seeRes">📊 Natijamni ko'rish</button>` : ""}${vipBtn("👑 Premium olish", "gold lg")}</div>
    </section>`;
    const b = $("#seeRes"); if (b) b.onclick = () => { sessionStorage.setItem("last_result", JSON.stringify(last.details)); location.hash = "#/result"; };
    return;
  }
  const p = db.getPerson() || {};
  const prem = db.isPremium();
  app.innerHTML = `<section class="card" style="max-width:760px;margin:0 auto">
    <span class="tag ${prem ? "gold" : ""}">${prem ? "👑 Premium test" : "🎁 Bepul test (1 marta)"} · ⏱ ${MODE.sec / 60} daqiqa · ${N_ITEMS} savol</span>
    <h1 class="mt">${prem ? "Kuchli IQ test" : "Testga tayyorlanish"}</h1>
    ${prem ? `<p class="muted" style="margin:0">Premium test: <b>60 ta savol</b>, qiyinroq savollar va <b>yuqori aniqlik</b> (xatolik ≈ ±3,5 — bepul testda ±4,5). Har safar yangi savollar — istalgancha topshirishingiz mumkin.</p>` : `<p class="muted" style="margin:0">⚠️ Bepul test har bir qurilmada <b>faqat 1 marta</b>. Tinch joyda, shoshilmasdan topshiring.</p>`}
    <form id="pf" class="grid g2 mt">
      <label class="field"><span>Ismingiz</span><input name="name" required maxlength="40" placeholder="Masalan: Jasur" value="${esc(p.name || "")}" autocomplete="given-name"></label>
      <label class="field"><span>Yoshingiz</span><input name="age" required type="number" min="7" max="99" inputmode="numeric" placeholder="Masalan: 21" value="${esc(p.age || "")}"></label>
      <p class="small muted" style="grid-column:1/-1;margin:0">Ism reytingda ko'rinadi. Yosh IQ ni o'z yosh guruhingizga nisbatan aniq hisoblash uchun kerak.</p>
      <ul class="points" style="grid-column:1/-1">
        <li><b>Moslashuvchan test</b><p>To'g'ri javob — keyingi savol qiyinroq, xato — osonroq. Shunday qilib qobiliyatingiz aniq o'lchanadi.</p></li>
        <li><b>Taxmin qilmang</b><p>Bilmasangiz "O'tkazish"ni bosing — tasodifiy javob natijani buzadi.</p></li>
        <li><b>Tinch muhit, kalkulyatorsiz</b><p>Qog'oz va ruchka mumkin. Vaqt tugasa test avtomatik yakunlanadi.</p></li>
      </ul>
      <div style="grid-column:1/-1"><button class="btn lg" type="submit">Testni boshlash →</button></div>
    </form>
  </section>`;
  $("#pf").onsubmit = (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const name = String(d.get("name")).trim().replace(/\s+/g, " ");
    const age = parseInt(d.get("age"), 10);
    if (name.length < 2) return toast("Ismni to'g'ri kiriting");
    if (!(age >= 7 && age <= 99)) return toast("Yosh 7 dan 99 gacha bo'lishi kerak");
    db.setPerson({ name, age });
    db.startTest();
    countdown(runTest);
  };
}

function countdown(then) {
  app.innerHTML = `<div class="countdown"><span id="cd">3</span></div>`;
  let n = 3; const iv = setInterval(() => { n--; if (n === 0) { clearInterval(iv); then(); } else { const el = $("#cd"); el.textContent = n; el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; } }, 800);
  setCleanup(() => clearInterval(iv));
}

const levelFor = (theta) => Math.max(1, Math.min(7, Math.round((theta + 2.7) / 0.9 + 1)));

function runTest() {
  const person = db.getPerson();
  const used = new Set();
  const cats = Object.keys(CATEGORIES);
  let order = shuffle(cats);
  const items = []; // {q, answer, time, correct}
  setMode();
  const mode = MODE;
  const schedule = buildSchedule(mode === MODES.premium);
  N_ITEMS = schedule.length;
  let theta = mode.start, left = TOTAL_SEC, qStart = Date.now(), finished = false;
  const C = 2 * Math.PI * 16;

  const nextItem = () => {
    // har bir turdan 2–3 tadan, bir xil tur ketma-ket kelmaydi
    const typeId = schedule[items.length];
    // kichik tasodifiy tebranish — savol ketma-ketligi oldindan bashorat qilinmasin
    const lvl = levelFor(theta + mode.bias + (Math.random() - 0.5) * 0.5);
    let q = genType(typeId, lvl, used);
    items.push({ q, answer: null, time: 0 });
  };
  nextItem();

  app.innerHTML = `<section style="max-width:820px;margin:0 auto" class="view">
    <div class="test-head">
      <span class="tag" id="qn"></span>
      <div class="progress"><i id="bar"></i></div>
      <div class="timer" id="timer"><svg viewBox="0 0 40 40"><defs><linearGradient id="tg"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><circle class="tr" cx="20" cy="20" r="16"/><circle class="tv" id="tv" cx="20" cy="20" r="16" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><span id="tt"></span></div>
    </div>
    <div id="qwrap"></div>
  </section>`;
  const tick = () => {
    if (!$("#tt")) return;
    const m = Math.floor(left / 60), s = left % 60;
    $("#tt").textContent = `${m}:${String(s).padStart(2, "0")}`;
    $("#tv").style.strokeDashoffset = C * (1 - left / TOTAL_SEC);
    $("#timer").classList.toggle("warn", left <= 60);
  };
  tick();
  const iv = setInterval(() => { left--; tick(); if (left <= 0) finish(); }, 1000);
  const onKey = (e) => {
    if (finished || e.target.closest?.("input")) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 6) document.querySelectorAll(".opt")[n - 1]?.click();
    if (e.key === "Enter") $("#next")?.click();
  };
  document.addEventListener("keydown", onKey);
  const leaveGuard = (e) => { if (!finished) { e.preventDefault(); e.returnValue = ""; } };
  window.addEventListener("beforeunload", leaveGuard);
  setCleanup(() => { clearInterval(iv); document.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", leaveGuard); });

  function show() {
    const i = items.length - 1;
    const { q } = items[i];
    $("#qn").textContent = `${i + 1} / ${N_ITEMS}`;
    $("#bar").style.width = `${(i / N_ITEMS) * 100}%`;
    const keys = "ABCDEF";
    const visual = !!q.optionSVG;
    $("#qwrap").innerHTML = `<div class="card qcard">
      <div class="qmeta"><span class="tag">${CATEGORIES[q.cat].icon} ${CATEGORIES[q.cat].name}</span><span class="tag lvl" title="Qiyinlik darajasi">${"●".repeat(q.diff)}${"○".repeat(7 - q.diff)}</span></div>
      <p class="qtext">${esc(q.text)}</p>
      ${q.svg ? `<div class="qvisual">${q.svg}</div>` : ""}
      ${q.seq ? `<div class="seq mb">${q.seq.map((s, k) => `<span class="${s === "?" ? "q" : ""}" style="animation-delay:${k * 55}ms">${esc(s)}</span>`).join("")}</div>` : ""}
      ${q.grid ? `<div class="ngrid mb">${q.grid.map((s, k) => `<span class="${s === "?" ? "q" : ""}" style="animation-delay:${k * 45}ms">${esc(s)}</span>`).join("")}</div>` : ""}
      <div class="options ${visual ? "visual" : ""} ${q.options.length === 5 && !visual ? "five" : ""}">
        ${q.options.map((o, k) => `<button class="opt" data-v="${esc(o)}"><span class="k">${keys[k]}</span>${visual ? q.optionSVG[k] : esc(o)}</button>`).join("")}
      </div>
      <div class="test-foot">
        <button class="btn ghost" id="skip">O'tkazish (bilmayman)</button>
        <button class="btn" id="next" disabled>${i === N_ITEMS - 1 ? "Yakunlash ✓" : "Keyingi →"}</button>
      </div>
    </div>`;
    qStart = Date.now();
    document.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
      document.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel"); items[i].answer = b.dataset.v; $("#next").disabled = false;
    }));
    $("#skip").onclick = () => go(true);
    $("#next").onclick = () => go(false);
  }
  function go(skip) {
    const it = items[items.length - 1];
    if (skip) it.answer = null;
    it.time = Math.round((Date.now() - qStart) / 1000);
    it.correct = it.answer === it.q.answer;
    theta = estimate(items.map((x) => ({ diff: x.q.diff, nOpt: x.q.options.length, correct: x.correct }))).theta;
    if (items.length >= N_ITEMS) return finish();
    const card = $(".qcard"); card.classList.add("out");
    setTimeout(() => { nextItem(); show(); }, 230);
  }
  async function finish() {
    if (finished) return; finished = true;
    clearInterval(iv);
    // vaqt tugaganda javob berilmagan joriy savol hisobga olinmaydi
    const done = items.filter((x) => x.correct !== undefined);
    const used = Math.min(TOTAL_SEC, TOTAL_SEC - left);
    const resp = done.map((x) => ({ cat: x.q.cat, diff: x.q.diff, nOpt: x.q.options.length, correct: x.correct, time: x.time, answered: x.answer != null }));
    if (!resp.length) { location.hash = "#/"; return; }
    const r = score(resp, person?.age, used);
    r.name = person?.name; r.date = new Date().toISOString(); r.mode = mode === MODES.premium ? "premium" : "free";
    sessionStorage.setItem("last_result", JSON.stringify(r));
    if (r.mode === "free") localStorage.setItem("free_used", JSON.stringify({ at: r.date, iq: r.iq, name: r.name || "" }));
    try { await db.saveResult(r); } catch (e) { toast("Natijani saqlashda xato: " + e.message); }
    app.innerHTML = `<div class="center" style="padding:80px 0"><div class="spinner"></div><h2>Natija hisoblanmoqda…</h2><p class="muted">Javoblaringiz psixometrik model bo'yicha tahlil qilinmoqda</p></div>`;
    setTimeout(() => (location.hash = "#/result"), 1400);
  }
  show();
}

/* ---------------- RESULT ---------------- */
function gaugeSVG() {
  const C = 2 * Math.PI * 96;
  return `<div class="gauge"><svg viewBox="0 0 220 220"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs>
    <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/>
    <circle id="garc" cx="110" cy="110" r="96" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset 2s cubic-bezier(.22,1,.36,1)"/></svg>
    <div class="num"><div><b id="iqn">0</b><span id="ciTxt">IQ ball</span></div></div></div>`;
}
function bellSVG(iq, ci) {
  const W = 600, H = 170, pts = [];
  for (let x = 40; x <= 160; x += 1) { const z = (x - 100) / 15; pts.push([((x - 40) / 120) * W, H - 20 - Math.exp(-z * z / 2) * (H - 40)]); }
  const X = (v) => ((Math.max(40, Math.min(160, v)) - 40) / 120) * W;
  const path = "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L");
  const mx = X(iq);
  const filled = "M0," + (H - 20) + " L" + pts.filter((p) => p[0] <= mx).map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + ` L${mx},${H - 20} Z`;
  const ticks = [55, 70, 85, 100, 115, 130, 145].map((v) => `<text x="${X(v)}" y="${H - 2}" fill="#a3a8d1" font-size="12" text-anchor="middle">${v}</text>`).join("");
  return `<svg class="bell" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="bf" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff" stop-opacity=".15"/><stop offset="1" stop-color="#00d4ff" stop-opacity=".55"/></linearGradient></defs><rect x="${X(iq - ci)}" y="8" width="${X(iq + ci) - X(iq - ci)}" height="${H - 28}" fill="rgba(255,79,216,.1)" rx="6"/><path d="${filled}" fill="url(#bf)"/><path d="${path}" fill="none" stroke="#b9a8ff" stroke-width="2.5"/><line x1="${mx}" x2="${mx}" y1="10" y2="${H - 20}" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${mx}" cy="12" r="5" fill="#ff4fd8"/>${ticks}</svg>`;
}

async function resultView() {
  let r = JSON.parse(sessionStorage.getItem("last_result") || "null");
  if (!r) r = db.myResults()[0]?.details;
  if (!r) { location.hash = "#/test"; return; }
  const premium = db.isPremium();
  const pts = fivePoints(r);
  const deep = deepAnalysis(r);
  const lb = await db.leaderboard(500);
  const place = lb.rows.filter((x) => x.iq > r.iq).length + 1;
  app.innerHTML = `<div>
    <section class="card iq-hero">
      ${gaugeSVG()}
      <div>
        <span class="tag">${band(r.iq)}</span>
        <h1 class="mt">${r.name ? esc(r.name) + ", sizning" : "Sizning"} IQ natijangiz</h1>
        <p class="muted">95% ishonch oralig'i: <b style="color:#fff">${r.iq - r.ci} – ${r.iq + r.ci}</b> · ${r.age ? `${r.age} yoshdagilarning` : "Aholining"} <b style="color:#fff">${r.percentile}%</b> idan yuqori · ${r.right}/${r.total} to'g'ri · ${Math.floor(r.usedSeconds / 60)} daq ${r.usedSeconds % 60} s</p>
        ${bellSVG(r.iq, r.ci)}
        <div class="row mt"><a href="#/rating" class="tag gold" style="text-decoration:none">🏆 Reytingda ${place}-o'rin</a><button class="btn ghost sm" id="share">📤 Ulashish</button></div>
      </div>
    </section>
    <div class="grid g2 mt">
      <section class="card"><h2 style="font-size:20px">Yo'nalishlar bo'yicha indeks</h2><p class="muted small">Har bir yo'nalish uchun alohida IQ-shkala (o'rtacha 100).</p><div class="bars mt">
        ${Object.entries(r.categories).map(([k, c]) => `<div class="bar"><div class="bar-top"><span>${CATEGORIES[k].icon} ${CATEGORIES[k].name}</span><b>${c.index}</b></div><div class="track"><div class="fill" data-w="${Math.max(4, Math.min(100, ((c.index - 55) / 90) * 100))}"></div></div><div class="small muted" style="margin-top:4px">${c.right}/${c.total} to'g'ri · eng yuqori daraja: ${c.maxLevel || "—"}</div></div>`).join("")}
      </div></section>
      <section class="card"><h2 style="font-size:20px">5 bandli tahlil</h2><ol class="points mt">${pts.map((x, k) => `<li style="animation-delay:${k * 120}ms"><b>${esc(x.t)}</b><p>${esc(x.d)}</p></li>`).join("")}</ol></section>
    </div>
    <section class="card mt ${premium ? "" : "locked-box"}">
      <div class="${premium ? "" : "blur"}">
        <h2 style="font-size:20px">👑 Chuqur tahlil</h2>
        <div class="grid g4 mt">${deep.indices.map((d) => `<div class="card"><div class="small muted">${d.k}</div><div style="font-family:var(--head);font-size:30px;margin:6px 0">${d.v}</div><div class="track"><div class="fill" data-w="${Math.max(4, Math.min(100, ((d.v - 55) / 90) * 100))}"></div></div><p class="small muted">${d.d}</p></div>`).join("")}</div>
        <div class="grid g2 mt"><div><h3 style="font-size:16px">4 haftalik rivojlanish rejasi</h3><ul class="muted">${deep.plan.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h3 style="font-size:16px">Mos kasblar</h3><div class="row">${deep.careers.map((c) => `<span class="tag">${c}</span>`).join("")}</div><p class="small muted mt">IRT parametrlari: θ = ${r.theta}, SE = ${r.se}</p></div></div>
      </div>
      ${premium ? "" : `<div class="over"><div><h3>Chuqur tahlil Premiumda</h3><p class="muted">4 ta kognitiv indeks, shaxsiy reja va kasb tavsiyalari.</p>${vipBtn("👑 Premium kirish")}</div></div>`}
    </section>
    <p class="center small muted mt">Bu onlayn baholash; klinik IQ testi (WAIS, Raven SPM) o'rnini bosmaydi.</p>
  </div>`;
  $("#share").onclick = async () => {
    const text = `Mening IQ natijam: ${r.iq} (${band(r.iq)}). Siz ham sinab ko'ring!`;
    try { if (navigator.share) await navigator.share({ title: "Company IQ", text, url: location.origin + location.pathname }); else { await navigator.clipboard.writeText(text + " " + location.origin + location.pathname); toast("Nusxalandi ✓"); } } catch {}
  };
  requestAnimationFrame(() => setTimeout(() => {
    const arc = $("#garc"); const C = 2 * Math.PI * 96; if (arc) arc.style.strokeDashoffset = C * (1 - (Math.max(55, Math.min(160, r.iq)) - 55) / 105);
    document.querySelectorAll(".fill").forEach((f) => (f.style.width = f.dataset.w + "%"));
    const el = $("#iqn"); const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 1800); el.textContent = Math.round(r.iq * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); else $("#ciTxt").textContent = `± ${r.ci} · IQ`; };
    requestAnimationFrame(step);
    if (r.iq >= 115) confetti();
  }, 120));
}

/* ---------------- MY PAGE ---------------- */
async function myPage() {
  const list = db.myResults();
  const p = db.getPerson();
  app.innerHTML = `<div>
    <h1 class="grad-text">Mening natijalarim</h1>
    <p class="muted">${p ? `${esc(p.name)}, ${p.age} yosh` : ""}</p>
    ${list.length ? `<div class="grid g3 mt">${list.map((x, i) => `<button class="card res-card" data-i="${i}" style="text-align:left;cursor:pointer"><div class="muted small">${new Date(x.created_at).toLocaleString("uz-UZ")}</div><div style="font-family:var(--head);font-size:40px" class="grad-text">${x.iq}</div><div class="muted small">± ${x.ci ?? "?"} · ${x.percentile}% persentil</div></button>`).join("")}</div>` : `<p class="muted">Hali test topshirilmagan. <a href="#/test">Boshlash →</a></p>`}
  </div>`;
  document.querySelectorAll(".res-card").forEach((b) => (b.onclick = () => { sessionStorage.setItem("last_result", JSON.stringify(list[+b.dataset.i].details)); location.hash = "#/result"; }));
}

/* ---------------- boot ---------------- */
(async () => {
  app.innerHTML = `<div class="spinner"></div>`;
  await db.initAuth();
  let first = true;
  db.onChange((s) => { renderAuth(s); if (!first) router(); first = false; });
  window.addEventListener("hashchange", router);
  router();
})();

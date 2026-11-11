import { buildTest, CATEGORIES } from "./questions.js";
import { score, fivePoints, deepAnalysis, band } from "./scoring.js";
import * as db from "./db.js";
import { renderGames } from "./games.js";
import { renderDetective } from "./detective.js";
import { renderPremium, handleCheckoutReturn } from "./premium.js";

const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
const GOOGLE_SVG = `<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
export const googleBtn = (label = "Google orqali kirish", cls = "") => `<button class="btn google ${cls}" data-signin>${GOOGLE_SVG}${db.DEMO ? "Demo kirish" : label}</button>`;

/* ---------------- auth UI ---------------- */
function renderAuth(u) {
  const box = $("#auth");
  if (!u) { box.innerHTML = googleBtn("Kirish", "sm"); return; }
  const init = esc((u.name || "?")[0].toUpperCase());
  box.innerHTML = `<a href="#/profile" class="row" style="text-decoration:none;gap:8px">${u.avatar ? `<img class="avatar" src="${esc(u.avatar)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${init}</span>`}<span class="uname small">${esc(u.name.split(" ")[0])}</span></a>`;
}
document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-signin]")) { e.preventDefault(); await db.signIn(); }
  if (e.target.closest("[data-signout]")) { await db.signOut(); location.hash = "#/"; }
  if (e.target.closest(".nav a")) $("#nav").classList.remove("open");
});
$("#burger").addEventListener("click", () => $("#nav").classList.toggle("open"));
$("#year").textContent = new Date().getFullYear();

/* ---------------- router ---------------- */
let cleanup = null;
const routes = {
  "": home, test: testIntro, result: resultView, profile, premium: () => renderPremium(app),
  games: () => gate("Miya o'yinlari", () => renderGames(app)),
  detective: () => gate("Detektiv bo'limi", () => renderDetective(app)),
};
async function router() {
  if (cleanup) { cleanup(); cleanup = null; }
  const [path, arg] = location.hash.replace(/^#\/?/, "").split("/");
  document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#/" + path));
  app.innerHTML = "";
  await (routes[path] || home)(arg);
  app.firstElementChild?.classList.add("view");
  window.scrollTo({ top: 0, behavior: "instant" });
  observeReveal();
}
export const setCleanup = (f) => (cleanup = f);
function observeReveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

async function gate(title, render) {
  const u = db.getUser();
  const p = await db.getProfile();
  if (u && p.is_premium) return render();
  app.innerHTML = `<section class="card center" style="max-width:620px;margin:40px auto">
    <div class="tag gold">👑 Premium</div>
    <h1 class="mt">${title}</h1>
    <p class="muted">Bu bo'lim Premium foydalanuvchilar uchun. Premium bilan chuqur IQ tahlili, miya o'yinlari va Detektiv ishlari ochiladi.</p>
    <div class="row" style="justify-content:center">${u ? `<a href="#/premium" class="btn gold lg">Premiumni ochish</a>` : googleBtn()}</div>
  </section>`;
}

/* ---------------- HOME ---------------- */
function home() {
  app.innerHTML = `<div>
  <section class="hero">
    <div>
      <span class="tag">🧠 Har bir urinishda yangi savollar</span>
      <h1 class="mt grad-text">Aqlingiz chegarasini kashf eting</h1>
      <p class="lead">32 ta savol, 4 ta yo'nalish, 25 daqiqa. Savollar har bir foydalanuvchi uchun tasodifiy yaratiladi va qiyinlik bosqichma-bosqich oshadi. Natija — normallashtirilgan IQ shkalasida (o'rtacha 100, SD 15).</p>
      <div class="row mt">
        <a href="#/test" class="btn lg">Testni boshlash — bepul</a>
        <a href="#/premium" class="btn ghost lg">Premium imkoniyatlar</a>
      </div>
      <div class="stats">
        <div><b>∞</b><span>savol varianti</span></div>
        <div><b>4</b><span>kognitiv yo'nalish</span></div>
        <div><b>5</b><span>bandli bepul tahlil</span></div>
      </div>
    </div>
    <div class="hero-visual"><div class="orbit"><i></i></div><div class="orbit o2"><i></i></div><div class="orbit o3"><i></i></div><div class="core">IQ</div></div>
  </section>

  <h2 class="section-title reveal">Test nimani o'lchaydi?</h2>
  <div class="grid g4">
    ${Object.entries(CATEGORIES).map(([k, c], i) => `<div class="card feature reveal" style="transition-delay:${i * 80}ms"><div class="ico">${c.icon}</div><h3>${c.name}</h3><p>${{ matrix: "Raven uslubidagi 3×3 matritsalarda yashirin qonuniyatni topish.", numeric: "Son va harf ketma-ketliklaridagi murakkab qoidalarni aniqlash.", verbal: "Analogiyalar, sillogizmlar va mantiqiy jumboqlar.", spatial: "Shakllarni aylantirish, oynaviy aks va kub yoyilmalari." }[k]}</p></div>`).join("")}
  </div>

  <h2 class="section-title reveal">Premium bilan yanada chuqurroq</h2>
  <div class="grid g3">
    <a href="#/premium" class="card feature reveal" style="text-decoration:none"><span class="tag gold lock">👑</span><div class="ico">📊</div><h3>Chuqur tahlil</h3><p>Suyuq/kristallashgan intellekt, ishchi xotira, tezlik indekslari va 4 haftalik reja.</p></a>
    <a href="#/games" class="card feature reveal" style="text-decoration:none;transition-delay:80ms"><span class="tag gold lock">👑</span><div class="ico">🎮</div><h3>Miya o'yinlari</h3><p>Schulte jadvali, xotira panjarasi, Stroop va tezkor hisob — IQ ni mashq qildiring.</p></a>
    <a href="#/detective" class="card feature reveal" style="text-decoration:none;transition-delay:160ms"><span class="tag gold lock">👑</span><div class="ico">🕵️</div><h3>Detektiv</h3><p>Dalillarni o'rganing, gumonlanuvchilarni so'roq qiling, xulosa chiqaring va token yutib oling.</p></a>
  </div>
  </div>`;
}

/* ---------------- TEST ---------------- */
const TOTAL_SEC = 25 * 60;
async function testIntro() {
  const u = db.getUser();
  const p = await db.getProfile();
  const done = u ? (await db.listResults()).length : (localStorage.getItem("anon_done") ? 1 : 0);
  if (done >= 1 && !p.is_premium) {
    app.innerHTML = `<section class="card center" style="max-width:640px;margin:40px auto">
      <div class="tag gold">Bepul test ishlatilgan</div>
      <h1 class="mt">Qayta topshirish — Premiumda</h1>
      <p class="muted">Birinchi test bepul edi. Cheksiz qayta topshirish, chuqur tahlil, miya o'yinlari va Detektiv bo'limi uchun Premiumga o'ting.</p>
      <div class="row" style="justify-content:center">${u ? `<a href="#/premium" class="btn gold lg">Premiumni ko'rish</a><a href="#/profile" class="btn ghost lg">Natijalarim</a>` : googleBtn("Natijani saqlash uchun kirish")}</div>
    </section>`;
    return;
  }
  app.innerHTML = `<section class="card" style="max-width:760px;margin:0 auto">
    <span class="tag">⏱ 25 daqiqa · 32 savol</span>
    <h1 class="mt">Tayyormisiz?</h1>
    <ul class="points">
      <li><b>Savollar sizga xos</b><p>Har bir test protsedurali tarzda yaratiladi — boshqa birov aynan shu savollarni olmaydi.</p></li>
      <li><b>Qiyinlik oshib boradi</b><p>Oson boshlanadi, oxirgi savollar juda murakkab. Qiyin savollar ko'proq ball beradi.</p></li>
      <li><b>Vaqt cheklangan</b><p>Vaqt tugasa, test avtomatik yakunlanadi. Savollarni o'tkazib yuborib, keyin qaytishingiz mumkin.</p></li>
      <li><b>Tinch muhit</b><p>Kalkulyator va qog'ozsiz ishlang — natija aniqroq bo'ladi.</p></li>
    </ul>
    ${u ? "" : `<p class="muted small">Natijani saqlash uchun test oxirida Google orqali kirishingiz mumkin.</p>`}
    <div class="row mt"><button class="btn lg" id="go">Boshlash</button></div>
  </section>`;
  $("#go").onclick = runTest;
}

function runTest() {
  const qs = buildTest(32);
  const answers = Array(qs.length).fill(null);
  const times = Array(qs.length).fill(0);
  let i = 0, left = TOTAL_SEC, qStart = Date.now(), finished = false;
  const C = 2 * Math.PI * 16;
  app.innerHTML = `<section style="max-width:820px;margin:0 auto" class="view">
    <div class="test-head">
      <span class="tag" id="qn"></span>
      <div class="progress"><i id="bar"></i></div>
      <div class="timer" id="timer"><svg viewBox="0 0 40 40"><defs><linearGradient id="tg"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs><circle class="tr" cx="20" cy="20" r="16"/><circle class="tv" id="tv" cx="20" cy="20" r="16" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><span id="tt"></span></div>
    </div>
    <div id="qwrap"></div>
  </section>`;
  const tick = () => {
    left--; const m = Math.floor(left / 60), s = left % 60;
    $("#tt").textContent = `${m}:${String(s).padStart(2, "0")}`;
    $("#tv").style.strokeDashoffset = C * (1 - left / TOTAL_SEC);
    $("#timer").classList.toggle("warn", left <= 60);
    if (left <= 0) finish();
  };
  const iv = setInterval(tick, 1000); tick(); left++;
  setCleanup(() => clearInterval(iv));
  const onKey = (e) => {
    if (finished) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 6) document.querySelectorAll(".opt")[n - 1]?.click();
    if (e.key === "Enter") $("#next")?.click();
  };
  document.addEventListener("keydown", onKey);
  const prevCleanup = cleanup; setCleanup(() => { prevCleanup(); document.removeEventListener("keydown", onKey); });

  function show(dir = 1) {
    const q = qs[i];
    $("#qn").textContent = `${i + 1} / ${qs.length}`;
    $("#bar").style.width = `${(answers.filter((a) => a != null).length / qs.length) * 100}%`;
    const keys = "ABCDEF";
    const visual = q.optionSVG;
    $("#qwrap").innerHTML = `<div class="card qcard">
      <div class="qmeta"><span class="tag">${CATEGORIES[q.cat].icon} ${CATEGORIES[q.cat].name}</span><span class="tag">${"●".repeat(q.diff)}${"○".repeat(5 - q.diff)}</span></div>
      <p class="qtext">${esc(q.text)}</p>
      ${q.svg ? `<div class="qvisual">${q.svg}</div>` : ""}
      ${q.seq ? `<div class="seq mb">${q.seq.map((s, k) => `<span class="${s === "?" ? "q" : ""}" style="animation-delay:${k * 60}ms">${esc(s)}</span>`).join("")}</div>` : ""}
      <div class="options ${visual ? "visual" : ""}">
        ${q.options.map((o, k) => `<button class="opt ${answers[i] === o ? "sel" : ""}" data-v="${esc(o)}"><span class="k">${keys[k]}</span>${visual ? q.optionSVG[k] : esc(o)}</button>`).join("")}
      </div>
      <div class="test-foot">
        <button class="btn ghost" id="prev" ${i === 0 ? "disabled" : ""}>← Orqaga</button>
        <div class="row">
          <button class="btn ghost" id="skip">O'tkazish</button>
          <button class="btn" id="next">${i === qs.length - 1 ? "Yakunlash ✓" : "Keyingi →"}</button>
        </div>
      </div>
    </div>`;
    qStart = Date.now();
    document.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
      document.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel"); answers[i] = b.dataset.v;
      $("#bar").style.width = `${(answers.filter((a) => a != null).length / qs.length) * 100}%`;
    }));
    $("#prev").onclick = () => go(-1);
    $("#skip").onclick = () => go(1, true);
    $("#next").onclick = () => go(1);
  }
  function go(d, skip) {
    times[i] += Math.round((Date.now() - qStart) / 1000);
    if (skip) answers[i] = answers[i] ?? null;
    if (i === qs.length - 1 && d > 0) {
      const empty = answers.filter((a) => a == null).length;
      if (empty && !confirm(`${empty} ta savol javobsiz. Baribir yakunlaysizmi?`)) { const first = answers.findIndex((a) => a == null); i = first; return show(); }
      return finish();
    }
    const card = $(".qcard"); card.classList.add("out");
    setTimeout(() => { i = Math.max(0, Math.min(qs.length - 1, i + d)); show(d); }, 220);
  }
  async function finish() {
    if (finished) return; finished = true;
    clearInterval(iv);
    const used = Math.min(TOTAL_SEC, TOTAL_SEC - left);
    const r = score(qs, answers, times, TOTAL_SEC, used);
    r.date = new Date().toISOString();
    sessionStorage.setItem("last_result", JSON.stringify(r));
    if (!db.getUser()) localStorage.setItem("anon_done", "1");
    try { await db.saveResult(r); } catch (e) { toast("Natijani saqlashda xato: " + e.message); }
    location.hash = "#/result";
  }
  show();
}

/* ---------------- RESULT ---------------- */
function gaugeSVG(iq) {
  const C = 2 * Math.PI * 96, frac = (iq - 55) / (160 - 55);
  return `<div class="gauge"><svg viewBox="0 0 220 220"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#00d4ff"/></linearGradient></defs>
    <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/>
    <circle id="garc" cx="110" cy="110" r="96" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset 2s cubic-bezier(.22,1,.36,1)" data-to="${C * (1 - frac)}"/></svg>
    <div class="num"><div><b id="iqn">0</b><span>IQ ball</span></div></div></div>`;
}
function bellSVG(iq) {
  const W = 600, H = 170, pts = [];
  for (let x = 40; x <= 160; x += 1) { const z = (x - 100) / 15; pts.push([((x - 40) / 120) * W, H - 20 - Math.exp(-z * z / 2) * (H - 40)]); }
  const path = "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L");
  const mx = ((Math.max(40, Math.min(160, iq)) - 40) / 120) * W;
  const filled = "M0," + (H - 20) + " L" + pts.filter((p) => p[0] <= mx).map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + ` L${mx},${H - 20} Z`;
  const ticks = [55, 70, 85, 100, 115, 130, 145].map((v) => { const x = ((v - 40) / 120) * W; return `<text x="${x}" y="${H - 2}" fill="#a3a8d1" font-size="12" text-anchor="middle">${v}</text>`; }).join("");
  return `<svg class="bell" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="bf" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff" stop-opacity=".15"/><stop offset="1" stop-color="#00d4ff" stop-opacity=".55"/></linearGradient></defs><path d="${filled}" fill="url(#bf)"/><path d="${path}" fill="none" stroke="#b9a8ff" stroke-width="2.5"/><line x1="${mx}" x2="${mx}" y1="10" y2="${H - 20}" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${mx}" cy="12" r="5" fill="#ff4fd8"/>${ticks}</svg>`;
}

async function resultView() {
  let r = JSON.parse(sessionStorage.getItem("last_result") || "null");
  if (!r) { const list = await db.listResults(); r = list[0]?.details; }
  if (!r) { location.hash = "#/test"; return; }
  const u = db.getUser();
  const p = await db.getProfile();
  const pts = fivePoints(r);
  const deep = deepAnalysis(r);
  app.innerHTML = `<div>
    <section class="card iq-hero">
      ${gaugeSVG(r.iq)}
      <div>
        <span class="tag">${band(r.iq)}</span>
        <h1 class="mt">Sizning IQ natijangiz</h1>
        <p class="muted">Siz test topshirganlarning <b style="color:#fff">${r.percentile}%</b> idan yuqori natija ko'rsatdingiz · ${r.right}/${r.total} to'g'ri · ${Math.floor(r.usedSeconds / 60)} daq ${r.usedSeconds % 60} s</p>
        ${bellSVG(r.iq)}
        ${u ? "" : `<div class="row mt">${googleBtn("Natijani saqlash uchun kirish")}</div>`}
      </div>
    </section>
    <div class="grid g2 mt">
      <section class="card"><h2 style="font-size:20px">Yo'nalishlar bo'yicha</h2><div class="bars mt">
        ${Object.entries(r.categories).map(([k, c]) => `<div class="bar"><div class="bar-top"><span>${CATEGORIES[k].icon} ${CATEGORIES[k].name}</span><b>${c.pct}%</b></div><div class="track"><div class="fill" data-w="${c.pct}"></div></div></div>`).join("")}
      </div></section>
      <section class="card"><h2 style="font-size:20px">5 bandli tahlil</h2><ol class="points mt">${pts.map((x, k) => `<li style="animation-delay:${k * 120}ms"><b>${esc(x.t)}</b><p>${esc(x.d)}</p></li>`).join("")}</ol></section>
    </div>
    <section class="card mt ${p.is_premium ? "" : "locked-box"}">
      <div class="${p.is_premium ? "" : "blur"}">
        <h2 style="font-size:20px">👑 Chuqur tahlil</h2>
        <div class="grid g4 mt">${deep.indices.map((d) => `<div class="card"><div class="small muted">${d.k}</div><div style="font-family:var(--head);font-size:30px;margin:6px 0">${d.v}</div><div class="track" style="height:6px;background:var(--card-strong);border-radius:9px"><div class="fill" style="height:6px;border-radius:9px;background:var(--grad)" data-w="${d.v}"></div></div><p class="small muted">${d.d}</p></div>`).join("")}</div>
        <div class="grid g2 mt"><div><h3 style="font-size:16px">4 haftalik rivojlanish rejasi</h3><ul class="muted">${deep.plan.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h3 style="font-size:16px">Mos kasblar</h3><div class="row">${deep.careers.map((c) => `<span class="tag">${c}</span>`).join("")}</div></div></div>
      </div>
      ${p.is_premium ? "" : `<div class="over"><div><h3>Chuqur tahlil Premiumda</h3><p class="muted">4 ta kognitiv indeks, shaxsiy reja va kasb tavsiyalari.</p><a href="#/premium" class="btn gold">Premiumni ochish</a></div></div>`}
    </section>
  </div>`;
  requestAnimationFrame(() => setTimeout(() => {
    const arc = $("#garc"); if (arc) arc.style.strokeDashoffset = arc.dataset.to;
    document.querySelectorAll(".fill").forEach((f) => (f.style.width = f.dataset.w + "%"));
    const el = $("#iqn"); const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 1800); el.textContent = Math.round(r.iq * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    if (r.iq >= 115) confetti();
  }, 120));
}

/* ---------------- PROFILE ---------------- */
async function profile() {
  const u = db.getUser();
  if (!u) { app.innerHTML = `<section class="card center" style="max-width:520px;margin:40px auto"><h1>Kirish</h1><p class="muted">Natijalaringizni saqlash va ko'rish uchun tizimga kiring.</p>${googleBtn()}</section>`; return; }
  const [p, list] = await Promise.all([db.getProfile(), db.listResults()]);
  app.innerHTML = `<div>
    <section class="card row" style="justify-content:space-between">
      <div class="row">${u.avatar ? `<img class="avatar" style="width:64px;height:64px" src="${esc(u.avatar)}" referrerpolicy="no-referrer" alt="">` : `<span class="avatar" style="width:64px;height:64px;font-size:26px">${esc(u.name[0])}</span>`}
      <div><h2 style="margin:0">${esc(u.name)}</h2><div class="muted small">${esc(u.email)}</div></div></div>
      <div class="row">${p.is_premium ? `<span class="tag gold">👑 Premium</span>` : `<a class="btn gold sm" href="#/premium">Premium</a>`}<span class="tag tokens">🪙 ${p.tokens} token</span><button class="btn ghost sm" data-signout>Chiqish</button></div>
    </section>
    <h2 class="section-title" style="margin-top:36px">Natijalar tarixi</h2>
    ${list.length ? `<div class="grid g3">${list.map((x) => `<div class="card"><div class="muted small">${new Date(x.created_at).toLocaleString("uz-UZ")}</div><div style="font-family:var(--head);font-size:40px" class="grad-text">${x.iq}</div><div class="muted small">${x.correct}/${x.total} to'g'ri · ${x.percentile}% persentil</div></div>`).join("")}</div>` : `<p class="muted">Hali test topshirilmagan. <a href="#/test">Boshlash →</a></p>`}
  </div>`;
}

/* ---------------- boot ---------------- */
(async () => {
  app.innerHTML = `<div class="spinner"></div>`;
  await db.initAuth();
  let first = true;
  db.onUser(async (u) => {
    renderAuth(u);
    if (u) { const pend = db.takePending(); if (pend) { try { await db.saveResult(pend); toast("Natija profilingizga saqlandi ✓"); } catch {} } }
    if (!first) router();
    first = false;
  });
  await handleCheckoutReturn();
  window.addEventListener("hashchange", router);
  router();
})();

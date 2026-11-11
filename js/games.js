import { toast, confetti, setCleanup, esc } from "./app.js";
import { shuffle, genItem, CATEGORIES } from "./questions.js";
import * as db from "./db.js";

const getBest = (k) => { try { return JSON.parse(localStorage.getItem("best_" + k)); } catch { return null; } };
const best = (k, v, better) => { const b = getBest(k); if (b == null || better(v, b)) { try { localStorage.setItem("best_" + k, JSON.stringify(v)); } catch {} return { val: v, record: true }; } return { val: b, record: false }; };
const lower = (a, b) => a < b, higher = (a, b) => a > b;

// Kunlik mashg'ulot seriyasi
function trackDay() {
  const today = new Date().toISOString().slice(0, 10);
  const s = db.vipGet("streak", { last: null, n: 0 });
  if (s.last === today) return s.n;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const n = s.last === y ? s.n + 1 : 1;
  db.vipSet("streak", { last: today, n });
  return n;
}

const GAMES = [
  { id: "nback", ico: "🧬", name: "Dual N-Back", tag: "Ishchi xotira · ilmiy asoslangan", d: "Kvadrat joyi va harf ovozini N qadam oldingisi bilan solishtiring. Suyuq intellektni oshirishi tadqiqotlarda o'rganilgan eng mashhur mashq." },
  { id: "trainer", ico: "🧠", name: "IQ trener", tag: "Moslashuvchan · cheksiz", d: "Haqiqiy test savollari. To'g'ri javob — daraja oshadi, xato — tushadi. Seriyangizni uzaytiring." },
  { id: "rotate", ico: "🧊", name: "Aylantirish", tag: "Fazoviy tafakkur", d: "Ikki shakl bir xilmi (faqat aylantirilgan) yoki oynadagi aksmi? 60 soniyada iloji boricha ko'p to'g'ri javob." },
  { id: "schulte", ico: "🔢", name: "Schulte jadvali", tag: "Diqqat · periferik ko'rish", d: "1 dan 25 gacha sonlarni tartib bilan imkon qadar tez bosing." },
  { id: "memory", ico: "🟪", name: "Xotira panjarasi", tag: "Ketma-ket xotira", d: "Yonib-o'chgan kataklarni tartib bilan qaytaring. Har darajada bittaga ko'payadi." },
  { id: "stroop", ico: "🎨", name: "Stroop testi", tag: "Kognitiv nazorat", d: "So'z ma'nosini emas, uning RANGINI tanlang." },
  { id: "math", ico: "⚡", name: "Tezkor hisob", tag: "Raqamli ravonlik", d: "60 soniyada iloji boricha ko'p misol yeching." },
];

export function renderGames(app, id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) {
    const streak = db.vipGet("streak", { n: 0 }).n;
    app.innerHTML = `<div><div class="row" style="justify-content:space-between"><h1 class="grad-text" style="margin:0">Miya trenajyorlari</h1><span class="tag">🔥 ${streak} kunlik seriya</span></div>
      <p class="muted">Har kuni 15–20 daqiqa: Dual N-Back + IQ trener + bitta tezlik o'yini. Natijalar shu qurilmada saqlanadi.</p>
      <div class="grid g2 mt">${GAMES.map((x, i) => `<button class="card feature game-card reveal" data-g="${x.id}" style="text-align:left;cursor:pointer;transition-delay:${i * 60}ms"><div class="row" style="justify-content:space-between"><div class="ico">${x.ico}</div><span class="tag">${x.tag}</span></div><h3>${x.name}</h3><p>${x.d}</p><p class="small mt" style="color:var(--gold)">${recordTxt(x.id)}</p></button>`).join("")}</div></div>`;
    app.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => open(app, b.dataset.g)));
    requestAnimationFrame(() => app.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
    return;
  }
  trackDay();
  app.innerHTML = `<section class="card game-shell" style="max-width:760px;margin:0 auto">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">${g.ico} ${g.name}</h2><button class="btn ghost sm" id="back">← Trenajyorlar</button></div>
    <p class="muted">${g.d}</p><div class="game-area" id="ga"></div></section>`;
  app.querySelector("#back").onclick = () => open(app);
  ({ nback, trainer, rotate, schulte, memory, stroop, math })[id](app.querySelector("#ga"));
}
function open(app, id) { app.innerHTML = ""; renderGames(app, id); app.firstElementChild?.classList.add("view"); window.scrollTo({ top: 0 }); }
function recordTxt(id) {
  const b = getBest(id);
  if (id === "nback") return `Daraja: ${db.vipGet("nback_level", 1)}-back · Rekord: ${b ?? "—"}-back`;
  if (b == null) return "Rekord: —";
  return "Rekord: " + ({ schulte: b + " s", trainer: b + " seriya", rotate: b + " ta", memory: b + "-daraja", stroop: b + " ball", math: b + " ta" }[id] || b);
}
const startBtn = (ga, txt, fn, extra = "") => { ga.innerHTML = `<div class="center">${extra}<button class="btn lg go-btn">${txt}</button></div>`; ga.querySelector(".go-btn").onclick = fn; };
const alive = (ga) => ga.isConnected;

/* ===================== DUAL N-BACK ===================== */
function nback(ga) {
  const LET = ["B", "D", "K", "L", "M", "N", "R", "S"];
  let N = db.vipGet("nback_level", 1);
  const speak = (l) => { try { const u = new SpeechSynthesisUtterance(l); u.lang = "en-US"; u.rate = 1.1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {} };
  const intro = () => startBtn(ga, `${N}-back ni boshlash`, run, `<div class="nb-help"><p><b>Qoidalar:</b> har 2.5 soniyada panjarada kvadrat yonadi va harf aytiladi (va ko'rsatiladi).</p><p>Agar kvadrat <b>joyi</b> ${N} qadam oldingisi bilan bir xil bo'lsa — <kbd>A</kbd> yoki "Joy" tugmasi.<br>Agar <b>harf</b> ${N} qadam oldingisi bilan bir xil bo'lsa — <kbd>L</kbd> yoki "Harf" tugmasi.</p><p class="small muted">80%+ aniqlik — keyingi darajaga o'tasiz, 50% dan kam — bir daraja pastga.</p></div><div class="row" style="justify-content:center;margin-bottom:14px"><button class="btn ghost sm" id="nm">−</button><span class="tag">N = ${N}</span><button class="btn ghost sm" id="np">+</button></div>`);
  intro();
  const bindNP = () => { const m = ga.querySelector("#nm"), p = ga.querySelector("#np"); if (m) m.onclick = () => { N = Math.max(1, N - 1); intro(); bindNP(); }; if (p) p.onclick = () => { N = Math.min(9, N + 1); intro(); bindNP(); }; };
  bindNP();
  function run() {
    const T = 20 + N;
    const seq = [];
    for (let i = 0; i < T; i++) {
      // ~30% moslik har bir kanal uchun
      const pos = i >= N && Math.random() < 0.3 ? seq[i - N].pos : rnd8(i >= N ? seq[i - N].pos : -1);
      const let_ = i >= N && Math.random() < 0.3 ? seq[i - N].l : pickNot(LET, i >= N ? seq[i - N].l : null);
      seq.push({ pos, l: let_ });
    }
    ga.innerHTML = `<div class="center" style="width:100%"><div class="hud"><span class="tag">${N}-back</span><span class="tag" id="nbc">0/${T}</span></div>
      <div class="nb-grid">${[...Array(9)].map((_, i) => `<div class="nb-cell" data-i="${i}">${i === 4 ? '<span id="nbl"></span>' : ""}</div>`).join("")}</div>
      <div class="row" style="justify-content:center;margin-top:18px"><button class="btn ghost lg nb-btn" id="bp">A · Joy</button><button class="btn ghost lg nb-btn" id="bl">L · Harf</button></div></div>`;
    const cells = [...ga.querySelectorAll(".nb-cell")];
    let i = -1; const pressed = { p: false, l: false }; const res = { hit: 0, miss: 0, fa: 0, cr: 0 };
    const judge = () => {
      if (i < N) return;
      const mp = seq[i].pos === seq[i - N].pos, ml = seq[i].l === seq[i - N].l;
      for (const [m, pr] of [[mp, pressed.p], [ml, pressed.l]]) { if (m && pr) res.hit++; else if (m) res.miss++; else if (pr) res.fa++; else res.cr++; }
    };
    const press = (k) => {
      if (i < 0 || pressed[k]) return; pressed[k] = true;
      const btn = ga.querySelector(k === "p" ? "#bp" : "#bl");
      const ok = i >= N && (k === "p" ? seq[i].pos === seq[i - N].pos : seq[i].l === seq[i - N].l);
      btn.classList.add(ok ? "good" : "bad"); setTimeout(() => btn.classList.remove("good", "bad"), 350);
    };
    ga.querySelector("#bp").onclick = () => press("p");
    ga.querySelector("#bl").onclick = () => press("l");
    const onKey = (e) => { if (e.key === "a" || e.key === "A") press("p"); if (e.key === "l" || e.key === "L") press("l"); };
    document.addEventListener("keydown", onKey);
    const step = () => {
      if (!alive(ga)) return stop();
      judge();
      i++; pressed.p = pressed.l = false;
      cells.forEach((c) => c.classList.remove("on"));
      if (i >= T) return end();
      setTimeout(() => { if (!alive(ga)) return; cells[seq[i].pos].classList.add("on"); ga.querySelector("#nbl").textContent = seq[i].l; speak(seq[i].l); }, 120);
      setTimeout(() => cells.forEach((c) => c.classList.remove("on")), 1100);
      ga.querySelector("#nbc").textContent = `${i + 1}/${T}`;
    };
    const iv = setInterval(step, 2500); step();
    const stop = () => { clearInterval(iv); document.removeEventListener("keydown", onKey); };
    setCleanup(stop);
    function end() {
      stop();
      const acc = (res.hit + res.cr) / Math.max(1, res.hit + res.miss + res.fa + res.cr);
      const pct = Math.round(acc * 100);
      let msg = "";
      if (acc >= 0.8) { N = Math.min(9, N + 1); msg = `Ajoyib! Keyingi daraja: ${N}-back`; confetti(40); }
      else if (acc < 0.5 && N > 1) { N--; msg = `Daraja pasaytirildi: ${N}-back`; }
      else msg = `Shu darajada davom eting (${N}-back)`;
      db.vipSet("nback_level", N);
      best("nback", acc >= 0.8 ? N - 1 : N, higher);
      startBtn(ga, "Yana o'ynash", run, `<div class="result-box"><div class="big-num">${pct}%</div><p>To'g'ri topilgan: ${res.hit} · O'tkazilgan: ${res.miss} · Noto'g'ri bosish: ${res.fa}</p><p><b>${msg}</b></p></div>`);
    }
  }
  function rnd8(not) { let p; do { p = Math.floor(Math.random() * 9); } while (p === 4 || p === not); return p; }
  function pickNot(arr, not) { let x; do { x = arr[Math.floor(Math.random() * arr.length)]; } while (x === not); return x; }
}

/* ===================== IQ TRENER ===================== */
function trainer(ga) {
  let level = db.vipGet("trainer_level", 3), streak = 0, total = 0, right = 0;
  const cats = Object.keys(CATEGORIES);
  const ask = () => {
    if (!alive(ga)) return;
    const q = genItem(cats[Math.floor(Math.random() * 4)], level);
    const visual = !!q.optionSVG;
    ga.innerHTML = `<div style="width:100%"><div class="hud"><span class="tag">Daraja ${level}/7</span><span class="tag">🔥 Seriya ${streak}</span><span class="tag">✓ ${right}/${total}</span></div>
      <div class="qcard"><p class="qtext">${esc(q.text)}</p>${q.svg ? `<div class="qvisual">${q.svg}</div>` : ""}
      ${q.seq ? `<div class="seq mb">${q.seq.map((s) => `<span class="${s === "?" ? "q" : ""}">${esc(s)}</span>`).join("")}</div>` : ""}
      ${q.grid ? `<div class="ngrid mb">${q.grid.map((s) => `<span class="${s === "?" ? "q" : ""}">${esc(s)}</span>`).join("")}</div>` : ""}
      <div class="options ${visual ? "visual" : ""}">${q.options.map((o, k) => `<button class="opt" data-v="${esc(o)}">${visual ? q.optionSVG[k] : esc(o)}</button>`).join("")}</div></div></div>`;
    ga.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
      const ok = b.dataset.v === q.answer; total++;
      ga.querySelectorAll(".opt").forEach((x) => { x.disabled = true; if (x.dataset.v === q.answer) x.classList.add("right"); });
      if (ok) { right++; streak++; if (streak % 3 === 0) level = Math.min(7, level + 1); best("trainer", streak, higher); }
      else { b.classList.add("wrongopt"); streak = 0; level = Math.max(1, level - 1); }
      db.vipSet("trainer_level", level);
      setTimeout(ask, ok ? 700 : 1600);
    }));
  };
  startBtn(ga, "Boshlash", ask, `<p class="muted">Joriy daraja: ${level}/7. Har 3 ta ketma-ket to'g'ri javob — daraja +1.</p>`);
}

/* ===================== AYLANTIRISH ===================== */
function rotate(ga) {
  const poly = (n) => { const c = [[0, 0]]; const has = (x, y) => c.some((p) => p[0] === x && p[1] === y); while (c.length < n) { const [x, y] = c[Math.floor(Math.random() * c.length)]; const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)]; if (!has(x + dx, y + dy)) c.push([x + dx, y + dy]); } return c; };
  const norm = (c) => { const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1])); return c.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).join(";"); };
  const svg = (c, deg) => { const s = 16; const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]); const cx = (Math.min(...xs) + Math.max(...xs) + 1) / 2 * s, cy = (Math.min(...ys) + Math.max(...ys) + 1) / 2 * s; return `<svg viewBox="-60 -60 120 120" width="150"><g transform="rotate(${deg}) translate(${-cx} ${-cy})">${c.map(([x, y], i) => `<rect x="${x * s}" y="${y * s}" width="${s - 2}" height="${s - 2}" rx="3" fill="${i === 0 ? "#ff4fd8" : "#00d4ff"}"/>`).join("")}</g></svg>`; };
  startBtn(ga, "Boshlash (60 s)", () => {
    let left = 60, ok = 0, bad = 0, cur;
    const next = () => {
      let base; do { base = poly(6); } while (norm(base) === norm(base.map(([x, y]) => [-x, y])));
      const same = Math.random() < 0.5;
      const other = same ? base : base.map(([x, y]) => [-x, y]);
      cur = same;
      ga.querySelector("#rs").innerHTML = `<div class="rot-pair">${svg(base, Math.floor(Math.random() * 4) * 90)}${svg(other, Math.floor(Math.random() * 12) * 30)}</div>`;
    };
    ga.innerHTML = `<div class="center" style="width:100%"><div class="hud"><span class="tag" id="tl">60 s</span><span class="tag" id="sc">✓ 0</span></div><div id="rs"></div>
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn lg" id="ys">Bir xil (aylantirilgan)</button><button class="btn ghost lg" id="no">Oynaviy aks</button></div></div>`;
    const ans = (v) => { if (v === cur) { ok++; ga.querySelector("#rs").classList.add("flash-ok"); } else { bad++; ga.querySelector("#rs").classList.add("flash-bad"); } setTimeout(() => ga.querySelector("#rs")?.classList.remove("flash-ok", "flash-bad"), 250); ga.querySelector("#sc").textContent = `✓ ${ok}  ✗ ${bad}`; next(); };
    ga.querySelector("#ys").onclick = () => ans(true); ga.querySelector("#no").onclick = () => ans(false);
    next();
    const iv = setInterval(() => {
      if (!alive(ga)) return clearInterval(iv);
      left--; ga.querySelector("#tl").textContent = left + " s";
      if (left <= 0) { clearInterval(iv); const sc = Math.max(0, ok - bad); const b = best("rotate", sc, higher); if (b.record) confetti(40); startBtn(ga, "Qayta o'ynash", () => rotate(ga) || ga.querySelector(".go-btn").click(), `<div class="result-box"><div class="big-num">${sc}</div><p>${ok} to'g'ri, ${bad} xato · Rekord: ${b.val}</p></div>`); }
    }, 1000);
    setCleanup(() => clearInterval(iv));
  });
}

/* ===================== SCHULTE ===================== */
function schulte(ga) {
  startBtn(ga, "Boshlash", () => {
    let next = 1; const t0 = performance.now();
    ga.innerHTML = `<div style="width:100%;display:grid;place-items:center"><div class="hud"><span class="tag">Keyingi: <b id="nx">1</b></span><span class="tag" id="tm">0.0 s</span></div><div class="schulte">${shuffle([...Array(25)].map((_, i) => i + 1)).map((n) => `<button data-n="${n}">${n}</button>`).join("")}</div></div>`;
    const iv = setInterval(() => (!alive(ga) ? clearInterval(iv) : (ga.querySelector("#tm").textContent = ((performance.now() - t0) / 1000).toFixed(1) + " s")), 100);
    setCleanup(() => clearInterval(iv));
    ga.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => {
      if (+b.dataset.n === next) { b.classList.add("done"); next++; ga.querySelector("#nx").textContent = Math.min(25, next); }
      else { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); }
      if (next > 25) {
        clearInterval(iv); const s = +((performance.now() - t0) / 1000).toFixed(1);
        const r = best("schulte", s, lower); if (r.record) confetti(50);
        setTimeout(() => startBtn(ga, "Qayta o'ynash", () => schulte(ga) || ga.querySelector(".go-btn").click(), `<div class="result-box"><div class="big-num">${s} s</div><p>Rekord: ${r.val} s ${r.record ? "🏆 yangi!" : ""}</p><p class="small muted">Kattalar uchun o'rtacha: 35–45 s. 25 s dan kam — a'lo.</p></div>`), 400);
      }
    }));
  });
}

/* ===================== XOTIRA PANJARASI ===================== */
function memory(ga) {
  let level = 3;
  const round = () => {
    const size = level >= 8 ? 5 : 4, cnt = size * size;
    ga.innerHTML = `<div style="width:100%;display:grid;place-items:center"><div class="hud"><span class="tag">Daraja: ${level - 2}</span><span class="tag" id="st">Eslab qoling…</span></div><div class="memgrid" style="grid-template-columns:repeat(${size},1fr)">${[...Array(cnt)].map((_, i) => `<button data-i="${i}" disabled></button>`).join("")}</div></div>`;
    const cells = [...ga.querySelectorAll("[data-i]")];
    const target = shuffle([...Array(cnt).keys()]).slice(0, level);
    let k = 0;
    const show = setInterval(() => {
      if (!alive(ga)) return clearInterval(show);
      cells.forEach((c) => c.classList.remove("lit"));
      if (k < target.length) { const t = target[k++]; setTimeout(() => cells[t].classList.add("lit"), 120); }
      else { clearInterval(show); ga.querySelector("#st").textContent = "Endi tartib bilan bosing!"; cells.forEach((c) => (c.disabled = false)); }
    }, 650);
    setCleanup(() => clearInterval(show));
    let pos = 0;
    cells.forEach((c) => (c.onclick = () => {
      const i = +c.dataset.i;
      if (i === target[pos]) { c.classList.add("ok"); pos++; if (pos === target.length) { level++; toast("To'g'ri! Keyingi daraja"); setTimeout(round, 700); } }
      else {
        c.classList.add("no"); cells.forEach((x) => (x.disabled = true));
        target.forEach((t, j) => { cells[t].classList.add("lit"); cells[t].textContent = j + 1; });
        const sc = level - 3; const r = best("memory", sc, higher);
        setTimeout(() => startBtn(ga, "Qayta o'ynash", () => { level = 3; round(); }, `<div class="result-box"><div class="big-num">${sc}</div><p>daraja · Rekord: ${r.val}</p><p class="small muted">Kattalar o'rtacha 5–7 elementni eslab qoladi.</p></div>`), 1500);
      }
    }));
  };
  startBtn(ga, "Boshlash", round);
}

/* ===================== STROOP ===================== */
function stroop(ga) {
  const C = [["QIZIL", "#ff5c7a"], ["YASHIL", "#2ee59d"], ["KO'K", "#3d8bff"], ["SARIQ", "#ffc94d"]];
  startBtn(ga, "Boshlash (25 savol)", () => {
    let n = 0, ok = 0; const t0 = performance.now();
    const q = () => {
      if (n === 25) {
        const s = (performance.now() - t0) / 1000; const sc = Math.max(0, Math.round(ok * 60 - s * 6));
        const r = best("stroop", sc, higher);
        return startBtn(ga, "Qayta o'ynash", () => stroop(ga) || ga.querySelector(".go-btn").click(), `<div class="result-box"><div class="big-num">${sc}</div><p>${ok}/25 to'g'ri · ${s.toFixed(1)} s · Rekord: ${r.val}</p></div>`);
      }
      const w = C[Math.floor(Math.random() * 4)]; let col = C[Math.floor(Math.random() * 4)];
      if (Math.random() < 0.8) while (col === w) col = C[Math.floor(Math.random() * 4)];
      ga.innerHTML = `<div class="center" style="width:100%"><div class="hud"><span class="tag">${n + 1}/25</span><span class="tag">✓ ${ok}</span></div><div class="big-word" style="color:${col[1]}">${w[0]}</div><div class="options" style="max-width:420px;margin:0 auto">${shuffle(C).map((c) => `<button class="opt" data-c="${c[1]}"><span style="width:14px;height:14px;border-radius:50%;background:${c[1]}"></span>${c[0]}</button>`).join("")}</div></div>`;
      ga.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { if (b.dataset.c === col[1]) ok++; n++; q(); }));
    };
    q();
  });
}

/* ===================== TEZKOR HISOB ===================== */
function math(ga) {
  startBtn(ga, "Boshlash (60 s)", () => {
    let left = 60, ok = 0, ans;
    ga.innerHTML = `<div class="center" style="width:100%"><div class="hud"><span class="tag" id="tl">60 s</span><span class="tag" id="ok">✓ 0</span></div><div class="big-word" id="ex"></div><div class="options" id="op" style="max-width:420px;margin:0 auto"></div></div>`;
    const gen = () => {
      const lvl = Math.min(5, 1 + Math.floor(ok / 5));
      const a = Math.floor(Math.random() * 10 * lvl) + 2, b = Math.floor(Math.random() * 9 * lvl) + 2;
      const op = ["+", "−", "×"][Math.floor(Math.random() * (lvl >= 2 ? 3 : 2))];
      ans = op === "+" ? a + b : op === "−" ? a - b : a * b;
      ga.querySelector("#ex").textContent = `${a} ${op} ${b}`;
      const opts = shuffle([ans, ans + 1, ans - 2, ans + 10].filter((v, i, s) => s.indexOf(v) === i));
      ga.querySelector("#op").innerHTML = opts.map((o) => `<button class="opt" data-v="${o}">${o}</button>`).join("");
      ga.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { if (+b.dataset.v === ans) { ok++; ga.querySelector("#ok").textContent = "✓ " + ok; } gen(); }));
    };
    gen();
    const iv = setInterval(() => {
      if (!alive(ga)) return clearInterval(iv);
      left--; ga.querySelector("#tl").textContent = left + " s";
      if (left <= 0) { clearInterval(iv); const r = best("math", ok, higher); startBtn(ga, "Qayta o'ynash", () => math(ga) || ga.querySelector(".go-btn").click(), `<div class="result-box"><div class="big-num">${ok}</div><p>to'g'ri javob · Rekord: ${r.val}</p></div>`); }
    }, 1000);
    setCleanup(() => clearInterval(iv));
  });
}

// "Bilimdon bola" — 4–10 yoshli bolalar uchun bepul bilim o'yinlari.
// Har bir o'yin 10 savoldan; yulduzlar to'planadi, daraja avtomatik oshadi.
import { confetti, setCleanup } from "./app.js";
import { shuffle } from "./questions.js";

const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ---------- ovoz (WebAudio, faylsiz) ---------- */
let ac = null;
function tone(freqs, dur = 0.12, type = "sine") {
  if (LS.get("kids_mute", false)) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      const t = ac.currentTime + i * dur;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    });
  } catch {}
}
const sGood = () => tone([523, 659, 784], 0.1, "triangle");
const sBad = () => tone([330, 247], 0.14, "sine");
const sWin = () => tone([523, 659, 784, 1047, 784, 1047], 0.11, "triangle");

/* ---------- ma'lumotlar ---------- */
const WORDS = [
  ["Olma", "🍎"], ["Banan", "🍌"], ["Uzum", "🍇"], ["Nok", "🍐"], ["Tarvuz", "🍉"], ["Limon", "🍋"], ["Qulupnay", "🍓"],
  ["Mushuk", "🐱"], ["It", "🐶"], ["Ot", "🐴"], ["Sigir", "🐮"], ["Quyon", "🐰"], ["Baliq", "🐟"], ["Ayiq", "🐻"], ["Fil", "🐘"], ["Sher", "🦁"], ["Zebra", "🦓"], ["Ilon", "🐍"], ["Echki", "🐐"], ["Tovuq", "🐔"], ["Maymun", "🐵"], ["Kapalak", "🦋"],
  ["Mashina", "🚗"], ["Avtobus", "🚌"], ["Samolyot", "✈️"], ["Kema", "🚢"], ["Velosiped", "🚲"], ["Poyezd", "🚆"], ["Raketa", "🚀"],
  ["Uy", "🏠"], ["Kitob", "📖"], ["Quyosh", "☀️"], ["Oy", "🌙"], ["Yulduz", "⭐"], ["Gul", "🌸"], ["Daraxt", "🌳"], ["Kalit", "🔑"], ["Soat", "⏰"], ["Non", "🍞"], ["Sut", "🥛"], ["Tuxum", "🥚"], ["Qor", "❄️"], ["Bulut", "☁️"], ["Qalam", "✏️"], ["Shar", "🎈"],
];
const CATS = {
  "Mevalar": ["🍎", "🍌", "🍇", "🍐", "🍉", "🍋", "🍓", "🍒", "🍑"],
  "Hayvonlar": ["🐱", "🐶", "🐴", "🐮", "🐰", "🐻", "🐘", "🦁", "🐸", "🐵"],
  "Transport": ["🚗", "🚌", "✈️", "🚢", "🚲", "🚆", "🚀", "🚜"],
  "Osmon": ["☀️", "🌙", "⭐", "☁️", "🌈", "⚡"],
  "Sabzavotlar": ["🥕", "🥒", "🍅", "🌽", "🥔", "🧅"],
};
const COUNT_EMO = ["🍎", "⭐", "🐟", "🎈", "🌸", "🐥", "🍓", "⚽", "🦋", "🍪"];
const COLORS = [["qizil", "#ff4d5e"], ["ko'k", "#3d8bff"], ["yashil", "#2ecc71"], ["sariq", "#ffcc29"], ["binafsha", "#a35cff"], ["to'q sariq", "#ff8a3d"]];
const SHAPES = [["doira", (c) => `<circle cx="40" cy="40" r="30" fill="${c}"/>`], ["kvadrat", (c) => `<rect x="12" y="12" width="56" height="56" rx="6" fill="${c}"/>`], ["uchburchak", (c) => `<polygon points="40,8 74,70 6,70" fill="${c}"/>`], ["yulduz", (c) => `<polygon points="40,6 49,30 75,30 54,46 62,72 40,57 18,72 26,46 5,30 31,30" fill="${c}"/>`], ["yurak", (c) => `<path d="M40 70 C10 48 6 30 18 20 C28 12 38 18 40 26 C42 18 52 12 62 20 C74 30 70 48 40 70Z" fill="${c}"/>`]];
const DIGRAPHS = ["Sh", "Ch", "O'", "G'", "Ng"];
const firstLetter = (w) => DIGRAPHS.find((d) => w.startsWith(d)) || w[0];
const ALPHA = ["A", "B", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y", "Z", "O'", "G'", "Sh", "Ch"];

/* ---------- o'yinlar ---------- */
const GAMES = [
  { id: "count", ico: "🔢", name: "Sanash", color: "#ff8a3d", d: "Rasmlarni sanab, to'g'ri sonni tanla" },
  { id: "math", ico: "➕", name: "Hisob", color: "#3d8bff", d: "Qo'shish va ayirish" },
  { id: "letter", ico: "🔤", name: "Harflar", color: "#a35cff", d: "So'z qaysi harf bilan boshlanadi?" },
  { id: "odd", ico: "🧺", name: "Ortiqchasi", color: "#2ecc71", d: "Qaysi biri boshqalarga o'xshamaydi?" },
  { id: "pattern", ico: "🧩", name: "Davomini top", color: "#ff4fd8", d: "Naqshda keyingi nima keladi?" },
  { id: "shape", ico: "🎨", name: "Rang va shakl", color: "#ffcc29", d: "Aytilgan shakl va rangni top" },
  { id: "pairs", ico: "🃏", name: "Juftini top", color: "#00c2d1", d: "Kartalarni ochib, juftlarini top" },
];

function profile() { return LS.get("kids", { stars: 0, best: {}, level: {} }); }
function saveProfile(p) { LS.set("kids", p); }
const levelOf = (id) => profile().level[id] || 1;

export function renderKids(app, id) {
  const g = GAMES.find((x) => x.id === id);
  const p = profile();
  if (!g) {
    app.innerHTML = `<div class="kids">
      <section class="kids-hero">
        <div class="owl">🦉</div>
        <div><h1>Bilimdon bola</h1><p>Salom! Men Boyqush Bilimdon. Keling, birga o'ynab o'rganamiz! 4–10 yoshli bolalar uchun.</p>
          <div class="kids-stars">⭐ ${p.stars} yulduz · ${badge(p.stars)}</div></div>
        <button class="kid-mute" id="mute">${LS.get("kids_mute", false) ? "🔇" : "🔊"}</button>
      </section>
      <div class="kids-grid">${GAMES.map((x, i) => `<button class="kid-card" data-k="${x.id}" style="--c:${x.color};animation-delay:${i * 70}ms"><span class="kc-ico">${x.ico}</span><b>${x.name}</b><small>${x.d}</small><span class="kc-st">${"⭐".repeat(p.best[x.id] || 0)}${"☆".repeat(3 - (p.best[x.id] || 0))} · ${levelOf(x.id)}-bosqich</span></button>`).join("")}</div>
      <p class="kids-note">Ota-onalar uchun: o'yinlar sanash, hisob, alifbo, mantiq, diqqat va xotirani rivojlantiradi. Har o'yinda 3 ta yulduz yig'ilsa, keyingi bosqich (qiyinroq) ochiladi. Ma'lumotlar faqat shu qurilmada saqlanadi.</p>
    </div>`;
    app.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { tone([660], 0.06); app.innerHTML = ""; renderKids(app, b.dataset.k); app.firstElementChild?.classList.add("view"); window.scrollTo({ top: 0 }); }));
    app.querySelector("#mute").onclick = (e) => { const m = !LS.get("kids_mute", false); LS.set("kids_mute", m); e.target.textContent = m ? "🔇" : "🔊"; };
    return;
  }
  play(app, g);
}
function badge(s) { return s >= 300 ? "🏆 Daho" : s >= 150 ? "🎓 Olim" : s >= 60 ? "📚 Bilimdon" : s >= 20 ? "✏️ O'quvchi" : "🌱 Boshlovchi"; }

function play(app, g) {
  const level = levelOf(g.id);
  const TOTAL = g.id === "pairs" ? 1 : 10;
  let n = 0, right = 0, tries = 0;
  app.innerHTML = `<div class="kids kid-play" style="--c:${g.color}">
    <div class="kid-top"><button class="kid-back" id="kb">←</button><b>${g.ico} ${g.name}</b><span class="kid-lvl">${level}-bosqich</span></div>
    ${TOTAL > 1 ? `<div class="kid-progress">${Array.from({ length: TOTAL }, (_, i) => `<i data-p="${i}"></i>`).join("")}</div>` : ""}
    <div id="kq" class="kid-q"></div></div>`;
  app.querySelector("#kb").onclick = () => { app.innerHTML = ""; renderKids(app); };
  const box = app.querySelector("#kq");

  const ask = () => {
    if (g.id === "pairs") return pairs(box, level, (stars) => finish(stars));
    const q = makeQ(g.id, level);
    tries = 0;
    box.innerHTML = `<div class="kq-prompt">${q.prompt}</div>${q.visual ? `<div class="kq-visual">${q.visual}</div>` : ""}
      <div class="kq-opts ${q.big ? "big" : ""}">${q.opts.map((o) => `<button class="kq-opt" data-v="${String(o.v).replace(/"/g, "&quot;")}">${o.h}</button>`).join("")}</div>`;
    box.querySelectorAll(".kq-opt").forEach((b) => (b.onclick = () => {
      if (b.dataset.v === String(q.ans)) {
        b.classList.add("ok"); sGood(); if (tries === 0) right++;
        app.querySelector(`[data-p="${n}"]`)?.classList.add(tries === 0 ? "ok" : "half");
        box.querySelectorAll(".kq-opt").forEach((x) => (x.disabled = true));
        burst(b);
        n++;
        setTimeout(() => (n >= TOTAL ? finish(right >= 9 ? 3 : right >= 7 ? 2 : right >= 4 ? 1 : 0) : ask()), 750);
      } else {
        tries++; sBad(); b.classList.add("no"); b.disabled = true;
        const say = box.querySelector(".kq-prompt"); say.classList.remove("wiggle"); void say.offsetWidth; say.classList.add("wiggle");
      }
    }));
  };
  const finish = (stars) => {
    const p = profile();
    const earned = stars * (level + 1);
    p.stars += earned;
    p.best[g.id] = Math.max(p.best[g.id] || 0, stars);
    if (stars === 3) p.level[g.id] = Math.min(5, level + 1);
    saveProfile(p);
    if (stars >= 2) { sWin(); confetti(90); } else tone([440, 523], 0.12);
    box.innerHTML = `<div class="kid-end"><div class="owl big">${stars === 3 ? "🦉🎉" : stars >= 1 ? "🦉👍" : "🦉💪"}</div>
      <h2>${stars === 3 ? "Ajoyib! Sen haqiqiy bilimdonsan!" : stars === 2 ? "Juda yaxshi!" : stars === 1 ? "Yaxshi! Yana urinib ko'r!" : "Hechqisi yo'q, mashq qilamiz!"}</h2>
      <div class="end-stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? "on" : ""}" style="animation-delay:${i * 200}ms">⭐</span>`).join("")}</div>
      <p>+${earned} yulduz${stars === 3 && level < 5 ? ` · <b>${level + 1}-bosqich ochildi!</b>` : ""}</p>
      <div class="row" style="justify-content:center"><button class="kid-btn" id="again">🔁 Yana o'ynash</button><button class="kid-btn ghost" id="menu">🏠 O'yinlar</button></div></div>`;
    box.querySelector("#again").onclick = () => play(app, g);
    box.querySelector("#menu").onclick = () => { app.innerHTML = ""; renderKids(app); };
  };
  ask();
}

function burst(el) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span"); s.className = "kid-spark"; s.textContent = "⭐";
    s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height / 2 + "px";
    s.style.setProperty("--dx", Math.cos((i / 8) * 6.28) * 70 + "px"); s.style.setProperty("--dy", Math.sin((i / 8) * 6.28) * 70 + "px");
    document.body.appendChild(s); setTimeout(() => s.remove(), 700);
  }
}

function opts(ans, cands, n = 3, render = (v) => v) {
  const set = [ans]; for (const c of shuffle(cands)) { if (set.length >= n) break; if (!set.includes(c)) set.push(c); }
  return shuffle(set).map((v) => ({ v, h: render(v) }));
}

function makeQ(id, L) {
  if (id === "count") {
    const max = [5, 10, 12, 15, 20][L - 1];
    const k = rnd(1, max), e = pick(COUNT_EMO);
    return { prompt: `Nechta ${e} bor?`, visual: `<div class="emo-pile">${Array.from({ length: k }, (_, i) => `<span style="animation-delay:${i * 40}ms">${e}</span>`).join("")}</div>`, opts: opts(k, [k - 1, k + 1, k + 2, k - 2].filter((x) => x > 0), L >= 3 ? 4 : 3), ans: k, big: true };
  }
  if (id === "math") {
    const lim = [5, 10, 10, 20, 50][L - 1];
    const plus = L <= 1 || Math.random() < 0.55;
    let a = rnd(1, lim), b = rnd(1, lim); if (!plus && b > a) [a, b] = [b, a]; if (plus && a + b > lim * (L >= 4 ? 2 : 1)) b = rnd(0, Math.max(1, lim - a));
    const ans = plus ? a + b : a - b;
    const emo = pick(COUNT_EMO);
    const vis = L <= 2 && a <= 10 && b <= 10 ? `<div class="math-vis"><span>${emo.repeat(a)}</span><b>${plus ? "+" : "−"}</b><span>${emo.repeat(b)}</span></div>` : "";
    return { prompt: `${a} ${plus ? "+" : "−"} ${b} = ?`, visual: vis, opts: opts(ans, [ans + 1, ans - 1, ans + 2, ans + 10].filter((x) => x >= 0), L >= 3 ? 4 : 3), ans, big: true };
  }
  if (id === "letter") {
    const [w, e] = pick(WORDS); const f = firstLetter(w);
    if (L >= 3 && Math.random() < 0.5) {
      const others = shuffle(WORDS.filter(([x]) => firstLetter(x) !== f)).slice(0, L >= 4 ? 3 : 2);
      return { prompt: `Qaysi so'z <b class="hl">${f}</b> harfi bilan boshlanadi?`, opts: shuffle([[w, e], ...others]).map(([x, y]) => ({ v: x, h: `<span class="emo">${y}</span><small>${L >= 5 ? "" : x}</small>` })), ans: w };
    }
    return { prompt: `${e} <b>${w.replace(f, "_".repeat(1))}</b> — qaysi harf yetishmayapti?`, visual: `<div class="emo-hero">${e}</div>`, opts: opts(f, ALPHA.filter((x) => x !== f), L >= 2 ? 4 : 3), ans: f, big: true };
  }
  if (id === "odd") {
    const keys = Object.keys(CATS); const [a, b] = shuffle(keys);
    const same = shuffle(CATS[a]).slice(0, L >= 3 ? 4 : 3); const odd = pick(CATS[b]);
    return { prompt: "Qaysi biri <b>ortiqcha</b>?", opts: shuffle([...same, odd]).map((v) => ({ v, h: `<span class="emo">${v}</span>` })), ans: odd, big: true };
  }
  if (id === "pattern") {
    const pool = shuffle(["🔴", "🔵", "🟢", "🟡", "🟣", "⭐", "🍎", "🐱", "🌙"]);
    const types = L <= 1 ? ["AB"] : L === 2 ? ["AB", "AAB"] : L === 3 ? ["AAB", "ABC", "ABB"] : ["ABC", "AABB", "ABCB", "ABBC"];
    const t = pick(types); const unit = [...t].map((ch) => pool[ch.charCodeAt(0) - 65]);
    const len = unit.length * 2 + (L >= 4 ? 1 : 0);
    const seq = Array.from({ length: len + 1 }, (_, i) => unit[i % unit.length]);
    const ans = seq.pop();
    return { prompt: "Keyingisi nima?", visual: `<div class="pattern">${seq.map((x, i) => `<span style="animation-delay:${i * 60}ms">${x}</span>`).join("")}<span class="qm">?</span></div>`, opts: opts(ans, pool.slice(0, 6)).map((o) => ({ ...o, h: `<span class="emo">${o.v}</span>` })), ans, big: true };
  }
  if (id === "shape") {
    const n = L <= 1 ? 3 : L <= 3 ? 4 : 6;
    const items = []; const seen = new Set();
    while (items.length < n) { const s = pick(SHAPES), c = pick(COLORS); const k = s[0] + c[0]; if (!seen.has(k) && (L >= 2 || !items.some((x) => x.s === s[0]))) { seen.add(k); items.push({ s: s[0], c: c[0], svg: s[1](c[1]) }); } }
    const t = pick(items);
    const prompt = L <= 1 ? `<b>${cap(t.s)}</b>ni top` : `<b class="hl">${cap(t.c)}</b> ${t.s}ni top`;
    return { prompt, opts: items.map((x) => ({ v: x.s + x.c, h: `<svg viewBox="0 0 80 80" width="70" height="70">${x.svg}</svg>` })), ans: t.s + t.c, big: true };
  }
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function pairs(box, L, done) {
  const nPairs = [3, 4, 6, 8, 10][L - 1];
  const emo = shuffle([...COUNT_EMO, "🐶", "🐱", "🦁", "🐸", "🚗", "🌈"]).slice(0, nPairs);
  const cards = shuffle([...emo, ...emo]);
  let open = [], matched = 0, moves = 0, lock = false;
  const cols = nPairs <= 3 ? 3 : 4;
  box.innerHTML = `<div class="kq-prompt">Juftini top! <small>Urinishlar: <b id="mv">0</b></small></div>
    <div class="pairs" style="grid-template-columns:repeat(${cols},1fr)">${cards.map((e, i) => `<button class="pcard" data-i="${i}"><span class="front">?</span><span class="back">${e}</span></button>`).join("")}</div>`;
  const els = [...box.querySelectorAll(".pcard")];
  els.forEach((b) => (b.onclick = () => {
    if (lock || b.classList.contains("flip")) return;
    b.classList.add("flip"); tone([700], 0.05); open.push(b);
    if (open.length === 2) {
      moves++; box.querySelector("#mv").textContent = moves;
      const [x, y] = open;
      if (cards[x.dataset.i] === cards[y.dataset.i]) {
        x.classList.add("done"); y.classList.add("done"); open = []; matched++; sGood();
        if (matched === nPairs) { const extra = moves - nPairs; setTimeout(() => done(extra <= nPairs * 0.5 ? 3 : extra <= nPairs ? 2 : 1), 600); }
      } else { lock = true; setTimeout(() => { x.classList.remove("flip"); y.classList.remove("flip"); open = []; lock = false; }, 800); }
    }
  }));
  setCleanup(() => { lock = true; });
}

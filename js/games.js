import { toast, confetti, setCleanup } from "./app.js";
import { shuffle } from "./questions.js";

const best = (k, v) => { const key = "best_" + k; let b = null; try { b = JSON.parse(localStorage.getItem(key)); } catch {} if (v != null && (b == null || v.better(b))) { try { localStorage.setItem(key, JSON.stringify(v.val)); } catch {} return v.val; } return b; };

const GAMES = [
  { id: "schulte", ico: "🔢", name: "Schulte jadvali", d: "1 dan 25 gacha sonlarni tartib bilan imkon qadar tez bosing. Diqqat va periferik ko'rishni rivojlantiradi." },
  { id: "memory", ico: "🧠", name: "Xotira panjarasi", d: "Yonib-o'chgan kataklarni eslab qoling va qaytaring. Har darajada bittaga ko'payadi — ishchi xotira." },
  { id: "stroop", ico: "🎨", name: "Stroop testi", d: "So'z ma'nosini emas, uning RANGINI tanlang. Kognitiv nazorat va tezlik." },
  { id: "math", ico: "⚡", name: "Tezkor hisob", d: "60 soniyada iloji boricha ko'p misol yeching. Raqamli ravonlik." },
];

export function renderGames(app, id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) {
    app.innerHTML = `<div><h1 class="grad-text">Miya o'yinlari</h1><p class="muted">Har kuni 10–15 daqiqa mashq qiling — ishchi xotira, diqqat va qayta ishlash tezligi oshadi.</p>
      <div class="grid g2 mt">${GAMES.map((x, i) => `<button class="card feature reveal" data-g="${x.id}" style="text-align:left;cursor:pointer;transition-delay:${i * 70}ms"><div class="ico">${x.ico}</div><h3>${x.name}</h3><p>${x.d}</p><p class="small mt" style="color:var(--gold)">Rekord: ${best(x.id) ?? "—"}</p></button>`).join("")}</div></div>`;
    app.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => { app.innerHTML = ""; renderGames(app, b.dataset.g); app.firstElementChild?.classList.add("view"); }));
    return;
  }
  app.innerHTML = `<section class="card" style="max-width:720px;margin:0 auto">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">${g.ico} ${g.name}</h2><button class="btn ghost sm" id="back">← O'yinlar</button></div>
    <p class="muted">${g.d}</p><div class="game-area" id="ga"></div></section>`;
  app.querySelector("#back").onclick = () => { app.innerHTML = ""; renderGames(app); app.firstElementChild?.classList.add("view"); };
  ({ schulte, memory, stroop, math })[id](app.querySelector("#ga"));
}

const startBtn = (ga, txt, fn) => { ga.innerHTML = `<button class="btn lg">${txt}</button>`; ga.firstChild.onclick = fn; };

function schulte(ga) {
  startBtn(ga, "Boshlash", () => {
    let next = 1; const t0 = performance.now();
    ga.innerHTML = `<div style="width:100%;display:grid;place-items:center"><div class="hud"><span class="tag">Keyingi: <b id="nx">1</b></span><span class="tag" id="tm">0.0 s</span></div><div class="schulte">${shuffle([...Array(25)].map((_, i) => i + 1)).map((n) => `<button data-n="${n}">${n}</button>`).join("")}</div></div>`;
    const iv = setInterval(() => !ga.isConnected ? clearInterval(iv) : (ga.querySelector("#tm").textContent = ((performance.now() - t0) / 1000).toFixed(1) + " s"), 100);
    setCleanup(() => clearInterval(iv));
    ga.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => {
      if (+b.dataset.n === next) { b.classList.add("done"); next++; ga.querySelector("#nx").textContent = next; }
      else { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); }
      if (next > 25) {
        clearInterval(iv); const s = +((performance.now() - t0) / 1000).toFixed(1);
        const rec = best("schulte", { val: s, better: (b) => s < b });
        if (rec === s) confetti(50);
        toast(`Natija: ${s} s · Rekord: ${rec} s`);
        setTimeout(() => startBtn(ga, `${s} s! Qayta o'ynash`, () => schulte(ga) || ga.firstChild.click()), 600);
      }
    }));
  });
}

function memory(ga) {
  let level = 3;
  const round = () => {
    ga.innerHTML = `<div style="width:100%;display:grid;place-items:center"><div class="hud"><span class="tag">Daraja: ${level - 2}</span><span class="tag" id="st">Eslab qoling…</span></div><div class="memgrid">${[...Array(16)].map((_, i) => `<button data-i="${i}" disabled></button>`).join("")}</div></div>`;
    const cells = [...ga.querySelectorAll("[data-i]")];
    const target = shuffle([...Array(16).keys()]).slice(0, level);
    let k = 0;
    const show = setInterval(() => {
      if (!ga.isConnected) return clearInterval(show);
      cells.forEach((c) => c.classList.remove("lit"));
      if (k < target.length) { setTimeout(() => cells[target[k++]].classList.add("lit"), 120); }
      else { clearInterval(show); ga.querySelector("#st").textContent = "Endi tartib bilan bosing!"; cells.forEach((c) => (c.disabled = false)); }
    }, 700);
    setCleanup(() => clearInterval(show));
    let pos = 0;
    cells.forEach((c) => (c.onclick = () => {
      const i = +c.dataset.i;
      if (i === target[pos]) { c.classList.add("ok"); pos++; if (pos === target.length) { level++; toast("To'g'ri! Keyingi daraja"); setTimeout(round, 700); } }
      else {
        c.classList.add("no"); cells.forEach((x) => (x.disabled = true));
        target.forEach((t) => cells[t].classList.add("lit"));
        const sc = level - 3; const rec = best("memory", { val: sc, better: (b) => sc > b });
        toast(`O'yin tugadi. Daraja: ${sc} · Rekord: ${rec}`);
        setTimeout(() => startBtn(ga, "Qayta o'ynash", () => { level = 3; round(); }), 1300);
      }
    }));
  };
  startBtn(ga, "Boshlash", round);
}

function stroop(ga) {
  const C = [["QIZIL", "#ff5c7a"], ["YASHIL", "#2ee59d"], ["KO'K", "#3d8bff"], ["SARIQ", "#ffc94d"]];
  startBtn(ga, "Boshlash (20 savol)", () => {
    let n = 0, ok = 0; const t0 = performance.now();
    const q = () => {
      if (n === 20) {
        const s = ((performance.now() - t0) / 1000).toFixed(1); const sc = Math.max(0, Math.round(ok * 50 - s * 5));
        const rec = best("stroop", { val: sc, better: (b) => sc > b });
        toast(`${ok}/20 to'g'ri, ${s} s · Ball: ${sc} (rekord ${rec})`);
        return startBtn(ga, "Qayta o'ynash", () => stroop(ga) || ga.firstChild.click());
      }
      const w = C[Math.floor(Math.random() * 4)]; let col = C[Math.floor(Math.random() * 4)];
      if (Math.random() < 0.75) while (col === w) col = C[Math.floor(Math.random() * 4)];
      ga.innerHTML = `<div class="center" style="width:100%"><div class="hud"><span class="tag">${n + 1}/20</span><span class="tag">✓ ${ok}</span></div><div class="big-word" style="color:${col[1]}">${w[0]}</div><div class="options" style="max-width:420px;margin:0 auto">${shuffle(C).map((c) => `<button class="opt" data-c="${c[1]}"><span style="width:14px;height:14px;border-radius:50%;background:${c[1]}"></span>${c[0]}</button>`).join("")}</div></div>`;
      ga.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { if (b.dataset.c === col[1]) ok++; n++; q(); }));
    };
    q();
  });
}

function math(ga) {
  startBtn(ga, "Boshlash (60 s)", () => {
    let left = 60, ok = 0, ans;
    ga.innerHTML = `<div class="center" style="width:100%"><div class="hud"><span class="tag" id="tl">60 s</span><span class="tag" id="ok">✓ 0</span></div><div class="big-word" id="ex"></div><div class="options" id="op" style="max-width:420px;margin:0 auto"></div></div>`;
    const gen = () => {
      const lvl = Math.min(4, 1 + Math.floor(ok / 5));
      const a = Math.floor(Math.random() * 10 * lvl) + 2, b = Math.floor(Math.random() * 9 * lvl) + 2;
      const op = ["+", "−", "×"][Math.floor(Math.random() * (lvl >= 2 ? 3 : 2))];
      ans = op === "+" ? a + b : op === "−" ? a - b : a * b;
      ga.querySelector("#ex").textContent = `${a} ${op} ${b}`;
      const opts = shuffle([ans, ans + 1, ans - 2, ans + 10].filter((v, i, s) => s.indexOf(v) === i));
      ga.querySelector("#op").innerHTML = opts.map((o) => `<button class="opt" data-v="${o}">${o}</button>`).join("");
      ga.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { if (+b.dataset.v === ans) { ok++; ga.querySelector("#ok").textContent = "✓ " + ok; } else { b.classList.add("wrong"); } gen(); }));
    };
    gen();
    const iv = setInterval(() => {
      if (!ga.isConnected) return clearInterval(iv);
      left--; ga.querySelector("#tl").textContent = left + " s";
      if (left <= 0) { clearInterval(iv); const rec = best("math", { val: ok, better: (b) => ok > b }); toast(`Vaqt tugadi! ${ok} ta to'g'ri · Rekord: ${rec}`); startBtn(ga, "Qayta o'ynash", () => math(ga) || ga.firstChild.click()); }
    }, 1000);
    setCleanup(() => clearInterval(iv));
  });
}

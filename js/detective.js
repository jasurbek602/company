import * as db from "./db.js";
import { toast, confetti, esc } from "./app.js";
import { CASES, RANKS } from "./cases.js";

export function rankOf(tokens) {
  let r = RANKS[0];
  for (const x of RANKS) if (tokens >= x.min) r = x;
  const next = RANKS[RANKS.indexOf(r) + 1] || null;
  return { ...r, next };
}

let st = null;

/* ======================= Ishlar ro'yxati ======================= */
export async function renderDetective(app, caseId) {
  const p = await db.getProfile();
  const solved = await db.solvedCases();
  const c = CASES.find((x) => x.id === caseId);
  if (!c) {
    const rank = rankOf(p.tokens);
    const prog = rank.next ? Math.round(((p.tokens - rank.min) / (rank.next.min - rank.min)) * 100) : 100;
    app.innerHTML = `<div>
      <section class="card det-hq">
        <div><span class="tag gold">🕵️ Detektiv byurosi</span><h1 class="mt" style="margin-bottom:6px">${rank.ico} ${rank.name}</h1>
          <p class="muted" style="margin:0">${rank.next ? `Keyingi unvon: <b style="color:#fff">${rank.next.ico} ${rank.next.name}</b> — ${rank.next.min} 🪙` : "Siz eng yuqori unvonga erishdingiz!"}</p>
          <div class="track mt" style="max-width:420px"><div class="fill" style="width:${prog}%"></div></div></div>
        <div class="tokens big-tokens">🪙 ${p.tokens}</div>
      </section>
      <p class="muted mt">Joylarni tinting, gumonlanuvchilarni so'roq qiling, <b>Dalillar taxtasi</b>da yolg'onni fosh qiling — har bir fosh qilingan qarama-qarshilik yangi eshiklarni ochadi. Keyingi ish oldingisi yechilgach ochiladi.</p>
      <div class="grid g3 mt">${CASES.map((x, i) => {
        const s = solved.find((y) => y.case_id === x.id);
        const locked = i > 0 && !solved.some((y) => y.case_id === CASES[i - 1].id);
        const inProg = !s && db.vipGet("dstate_" + x.id, null);
        return `<button class="card case-card ${locked ? "locked" : ""} reveal" data-case="${x.id}" ${locked ? "disabled" : ""} style="text-align:left;transition-delay:${i * 70}ms">
          <div class="case-num">ISH №${String(i + 1).padStart(3, "0")}</div>
          <div class="case-ico">${locked ? "🔒" : x.ico}</div>
          <h3>${x.title}</h3><div class="diff">${"★".repeat(x.diff)}${"☆".repeat(5 - x.diff)}</div>
          <p class="muted small">${locked ? "Oldingi ishni yeching" : x.tagline}</p>
          <div class="row"><span class="tag tokens">🪙 ${x.reward}</span>${s ? `<span class="tag ok-tag">✓ ${s.score}%</span>` : inProg ? `<span class="tag">⏳ Davom etmoqda</span>` : ""}</div>
          ${s ? `<div class="stamp">YECHILDI</div>` : ""}
        </button>`;
      }).join("")}</div></div>`;
    app.querySelectorAll("[data-case]").forEach((b) => (b.onclick = () => openCase(app, b.dataset.case)));
    requestAnimationFrame(() => app.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
    return;
  }
  const saved = db.vipGet("dstate_" + c.id, null);
  st = {
    c, tab: saved ? "loc" : "brief",
    seen: new Set(saved?.seen || []), asked: new Set(saved?.asked || []), known: new Set(saved?.known || []),
    clues: saved?.clues || [], statements: saved?.statements || [], found: saved?.found || [],
    chats: saved?.chats || {}, actions: saved?.actions || 0, wrong: saved?.wrong || 0, hints: saved?.hints || 0,
    openLoc: null, sel: [], done: solved.some((y) => y.case_id === c.id), result: null,
  };
  draw(app);
}
function openCase(app, id) { app.innerHTML = ""; renderDetective(app, id); app.firstElementChild?.classList.add("view"); window.scrollTo({ top: 0 }); }
function save() {
  if (st.done) return;
  db.vipSet("dstate_" + st.c.id, { seen: [...st.seen], asked: [...st.asked], known: [...st.known], clues: st.clues, statements: st.statements, found: st.found, chats: st.chats, actions: st.actions, wrong: st.wrong, hints: st.hints });
}
const has = (need) => !need || st.known.has(need) || st.seen.has(need);
const allEv = () => st.c.locations.flatMap((l) => l.ev);
const evById = (id) => allEv().find((e) => e.id === id);
const stById = (id) => st.statements.find((s) => s.id === id);
function addClue(t, time) { if (!st.clues.some((x) => x.t === t)) { st.clues.push({ t, time }); pulseNotebook(); } }
function pulseNotebook() { toast("🔎 Bloknotga yangi iz"); }

/* ======================= Asosiy ekran ======================= */
function draw(app) {
  const { c } = st;
  const tabs = [["brief", "📋 Ish"], ["loc", "🔍 Joylar"], ["sus", "🗣 So'roq"], ["board", "🧷 Taxta"], ["time", "🕒 Xronologiya"], ["solve", "⚖️ Ayblov"]];
  const totalEv = allEv().length;
  let body = "";
  if (st.tab === "brief") body = brief();
  if (st.tab === "loc") body = locations();
  if (st.tab === "sus") body = suspects();
  if (st.tab === "board") body = board();
  if (st.tab === "time") body = timeline();
  if (st.tab === "solve") body = st.result || accuse();
  const anim = !st.drawn; st.drawn = true;
  app.innerHTML = `<div class="${anim ? "view " : ""}det-room">
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <div><div class="case-num">ISH №${String(CASES.indexOf(c) + 1).padStart(3, "0")} · ${"★".repeat(c.diff)}</div><h2 style="margin:4px 0 0">${c.ico} ${c.title}</h2></div>
      <div class="row"><span class="tag">🔍 ${st.seen.size}/${totalEv}</span><span class="tag">⚡ ${st.found.length}/${c.contra.length ? new Set(c.contra.map((x) => x.flag)).size : 0}</span><span class="tag">👣 ${st.actions}</span><button class="btn ghost sm" id="dback">← Ishlar</button></div>
    </div>
    <div class="det-layout">
      <section class="card det-main"><div class="det-tabs">${tabs.map(([k, t]) => `<button class="${st.tab === k ? "on" : ""}" data-tab="${k}">${t}${k === "board" && st.statements.length ? ` <small>${st.statements.length}</small>` : ""}</button>`).join("")}</div><div class="det-body">${body}</div></section>
      <aside class="card notebook"><h3 style="font-size:16px">📒 Detektiv bloknoti</h3>
        ${st.found.length ? `<div class="insights">${st.found.map((f) => `<div class="insight">⚡ ${esc(f.insight)}</div>`).join("")}</div>` : ""}
        ${st.clues.length ? `<ul>${st.clues.map((x) => `<li>${x.time ? `<b>${esc(x.time)}</b> ` : ""}${esc(x.t)}</li>`).join("")}</ul>` : `<p class="muted small">Izlar shu yerda to'planadi.</p>`}
        ${st.done ? "" : `<button class="btn ghost sm mt" id="hint" ${st.hints >= c.hints.length ? "disabled" : ""}>💡 Maslahat (${c.hints.length - st.hints} qoldi · −15% mukofot)</button>`}
        ${st.hints ? `<div class="hints">${c.hints.slice(0, st.hints).map((h) => `<p class="small">💡 ${esc(h)}</p>`).join("")}</div>` : ""}
      </aside>
    </div></div>`;
  bind(app);
}

function brief() {
  return `<div class="dossier">${st.c.intro.map((p, i) => `<p class="typed" style="animation-delay:${i * 350}ms">${esc(p)}</p>`).join("")}</div>
    <div class="grid g2 mt">${st.c.suspects.map((s) => `<div class="suspect mini"><div class="face">${s.face}</div><div><b>${s.name}</b><div class="muted small">${s.role} · ${esc(s.bio)}</div></div></div>`).join("")}</div>
    <div class="row mt"><button class="btn" data-tab="loc">Tergovni boshlash →</button></div>`;
}

function locations() {
  return `<div class="grid">${st.c.locations.map((l) => {
    const open = st.openLoc === l.id;
    const seenN = l.ev.filter((e) => st.seen.has(e.id)).length;
    return `<div class="loc ${open ? "open" : ""}"><button class="loc-head" data-loc="${l.id}"><span class="loc-ico">${l.ico}</span><span><b>${l.name}</b><small class="muted">${esc(l.desc)}</small></span><span class="tag">${seenN}/${l.ev.length}</span></button>
      ${open ? `<div class="grid g2 loc-ev">${l.ev.map((e) => {
        if (!has(e.need)) return `<div class="ev locked"><div class="e-ico">🔒</div><div><b>Yopiq</b><div class="small muted">${esc(e.lock || "Nimadir yetishmayapti…")}</div></div></div>`;
        const s = st.seen.has(e.id);
        return `<div class="ev ${s ? "seen" : ""}" data-ev="${e.id}"><div class="e-ico">${e.ico}</div><div><b>${e.name}</b>${s ? `<div class="reveal-txt">${esc(e.clue)}</div>` : `<div class="small muted">Tekshirish uchun bosing</div>`}</div></div>`;
      }).join("")}</div>` : ""}</div>`;
  }).join("")}</div>`;
}

function suspects() {
  return `<div class="grid">${st.c.suspects.map((s) => {
    const avail = s.qs.map((q, i) => ({ q, i })).filter(({ q, i }) => !st.asked.has(s.id + i) && has(q.need));
    const lockedN = s.qs.filter((q, i) => !st.asked.has(s.id + i) && !has(q.need)).length;
    return `<div class="card sus-card"><div class="suspect"><div class="face">${s.face}</div><div><b>${s.name}</b><div class="muted small">${s.role} · ${esc(s.bio)}</div></div></div>
      <div class="chat">${(st.chats[s.id] || []).map((m) => `<div class="bubble ${m.me ? "me" : "them"}">${esc(m.t)}</div>`).join("")}</div>
      <div class="q-btns">${avail.map(({ q, i }) => `<button class="btn ghost sm" data-ask="${s.id}|${i}">${q.need ? "⚡ " : ""}${esc(q.q)}</button>`).join("")}
      ${lockedN ? `<span class="tag small">🔒 ${lockedN} ta savol yangi dalil yoki fosh qilingan yolg'ondan keyin ochiladi</span>` : ""}
      ${!avail.length && !lockedN ? `<span class="muted small">Hamma savollar berildi.</span>` : ""}</div></div>`;
  }).join("")}</div>`;
}

function board() {
  const items = [
    ...st.statements.map((s) => ({ id: s.id, kind: "st", label: `${s.face} ${s.who}: "${s.text}"` })),
    ...allEv().filter((e) => st.seen.has(e.id)).map((e) => ({ id: e.id, kind: "ev", label: `${e.ico} ${e.name}: ${e.clue}` })),
  ];
  if (items.length < 2) return `<p class="muted">Taxtada hali yetarli material yo'q. Joylarni tinting va gumonlanuvchilarni so'roq qiling — ularning ko'rsatmalari shu yerga tushadi.</p>`;
  return `<p class="muted small" style="margin-top:0">Bir-biriga <b>zid</b> keladigan ikkita kartani tanlang (ko'rsatma + dalil yoki ikki ko'rsatma) va \"Taqqoslash\"ni bosing. Noto'g'ri taqqoslash ballni kamaytiradi.</p>
    <div class="board-cols">
      <div><h4>🗣 Ko'rsatmalar</h4>${st.statements.map((s) => pin(s.id, `<b>${s.face} ${esc(s.who)}</b><br>"${esc(s.text)}"`, "st")).join("") || `<p class="muted small">Hali yo'q</p>`}</div>
      <div><h4>🔍 Dalillar</h4>${allEv().filter((e) => st.seen.has(e.id)).map((e) => pin(e.id, `<b>${e.ico} ${esc(e.name)}</b><br>${esc(e.clue)}`, "ev")).join("") || `<p class="muted small">Hali yo'q</p>`}</div>
    </div>
    <div class="board-bar"><span class="muted small">${st.sel.length}/2 tanlandi</span><button class="btn gold" id="cmp" ${st.sel.length === 2 ? "" : "disabled"}>⚡ Taqqoslash</button></div>`;
}
function pin(id, html, kind) {
  const used = st.found.some((f) => f.a === id || f.b === id);
  return `<button class="pin ${kind} ${st.sel.includes(id) ? "sel" : ""} ${used ? "used" : ""}" data-pin="${id}">${html}</button>`;
}

function timeline() {
  const ev = [...allEv().filter((e) => st.seen.has(e.id) && e.time).map((e) => ({ time: e.time, t: `${e.ico} ${e.clue}` })), ...st.clues.filter((x) => x.time).map((x) => ({ time: x.time, t: "🗣 " + x.t }))];
  const key = (t) => { const m = /(\d{1,2}):(\d{2})/.exec(t); if (!m) return 9999; let h = +m[1]; if (h < 12 && /^0/.test(t)) h += 24; return h * 60 + +m[2]; };
  ev.sort((a, b) => key(a.time) - key(b.time));
  if (!ev.length) return `<p class="muted">Vaqtga bog'liq dalillar topilganda xronologiya shu yerda avtomatik tuziladi.</p>`;
  return `<div class="timeline">${ev.map((e, i) => `<div class="tl-item" style="animation-delay:${i * 60}ms"><span class="tl-time">${esc(e.time)}</span><span class="tl-dot"></span><span class="tl-text">${esc(e.t)}</span></div>`).join("")}</div>`;
}

function accuse() {
  const { c } = st;
  const keyOpts = st.found.map((f) => stById(f.a) ? f.a : f.b).filter((x, i, a) => stById(x) && a.indexOf(x) === i);
  return `<form id="solve" class="stack">
    <p class="muted small" style="margin-top:0">Xulosani faqat bir marta topshirasiz. Ishonchingiz komil bo'lmasa, tergovni davom ettiring.</p>
    <h3>1. Aybdor kim?</h3><div class="sel-list cols">${c.suspects.map((s) => `<label><input type="radio" name="culprit" value="${s.id}" required> ${s.face} ${s.name}</label>`).join("")}</div>
    <h3>2. Motiv</h3><div class="sel-list">${c.motives.map((m) => `<label><input type="radio" name="motive" value="${m.id}" required> ${m.t}</label>`).join("")}</div>
    <h3>3. Jinoyat usuli</h3><div class="sel-list">${c.methods.map((m) => `<label><input type="radio" name="method" value="${m.id}" required> ${m.t}</label>`).join("")}</div>
    <h3>4. Hal qiluvchi yolg'on</h3><div class="sel-list">${keyOpts.map((id) => { const s = stById(id); return `<label><input type="radio" name="key" value="${id}" required> ${s.face} ${esc(s.who)}: "${esc(s.text)}"</label>`; }).join("") || `<p class="muted small">Avval Dalillar taxtasida kamida bitta yolg'onni fosh qiling.</p>`}</div>
    <button class="btn gold lg" type="submit" ${keyOpts.length ? "" : "disabled"}>⚖️ Ayblovni e'lon qilish</button>
    ${st.done ? `<p class="muted small">Bu ish avval yechilgan — qayta yechish token bermaydi.</p>` : ""}</form>`;
}

/* ======================= Hodisalar ======================= */
function bind(app) {
  const { c } = st;
  app.querySelector("#dback").onclick = () => openCase(app);
  app.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { st.tab = b.dataset.tab; st.sel = []; draw(app); }));
  app.querySelectorAll("[data-loc]").forEach((b) => (b.onclick = () => { st.openLoc = st.openLoc === b.dataset.loc ? null : b.dataset.loc; draw(app); }));
  app.querySelectorAll("[data-ev]").forEach((b) => (b.onclick = () => {
    const e = evById(b.dataset.ev);
    if (st.seen.has(e.id)) return;
    st.seen.add(e.id); st.actions++; addClue(e.clue, e.time); save(); draw(app);
  }));
  app.querySelectorAll("[data-ask]").forEach((b) => (b.onclick = () => {
    const [sid, i] = b.dataset.ask.split("|"); const s = c.suspects.find((x) => x.id === sid); const q = s.qs[+i];
    st.asked.add(sid + i); st.actions++;
    (st.chats[sid] ||= []).push({ me: true, t: q.q }, { me: false, t: q.a });
    if (q.st && !stById(q.st)) { st.statements.push({ id: q.st, who: s.name, face: s.face, text: q.a }); toast("🧷 Ko'rsatma taxtaga qo'shildi"); }
    if (q.clue) addClue(q.clue, q.time);
    if (q.flag) st.known.add(q.flag);
    save(); draw(app);
  }));
  app.querySelectorAll("[data-pin]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.pin;
    st.sel = st.sel.includes(id) ? st.sel.filter((x) => x !== id) : [...st.sel.slice(-1), id];
    draw(app);
  }));
  const cmp = app.querySelector("#cmp");
  if (cmp) cmp.onclick = () => {
    const [x, y] = st.sel; st.actions++;
    const hit = c.contra.find((k) => (k.a === x && k.b === y) || (k.a === y && k.b === x));
    if (hit && !st.found.some((f) => f.a === hit.a && f.b === hit.b)) {
      const isNewFlag = !st.known.has(hit.flag);
      st.found.push({ a: hit.a, b: hit.b, insight: hit.insight, flag: hit.flag });
      st.known.add(hit.flag); st.sel = [];
      save(); draw(app);
      flash(app, "⚡ YOLG'ON FOSH QILINDI", hit.insight + (isNewFlag ? "\n\nYangi imkoniyatlar ochildi!" : ""), true);
    } else if (hit) { toast("Bu qarama-qarshilik allaqachon topilgan"); st.sel = []; draw(app); }
    else { st.wrong++; st.sel = []; save(); draw(app); flash(app, "✗ Zid emas", "Bu ikki narsa bir-biriga zid kelmaydi. Ehtiyot bo'ling — noto'g'ri ayblovlar ishonchni kamaytiradi.", false); }
  };
  const hint = app.querySelector("#hint");
  if (hint) hint.onclick = () => { if (st.hints < c.hints.length) { st.hints++; save(); draw(app); } };
  const f = app.querySelector("#solve");
  if (f) f.onsubmit = (ev) => { ev.preventDefault(); submit(app, new FormData(f)); };
  const again = app.querySelector("#dback2"); if (again) again.onclick = () => openCase(app);
}

function flash(app, title, text, good) {
  const d = document.createElement("div");
  d.className = "det-flash " + (good ? "good" : "bad");
  d.innerHTML = `<div class="det-flash-card"><h2>${esc(title)}</h2><p>${esc(text).replace(/\n/g, "<br>")}</p><button class="btn ${good ? "gold" : "ghost"}">Davom etish</button></div>`;
  document.body.appendChild(d);
  if (good) confetti(30);
  d.querySelector("button").onclick = () => d.remove();
  d.onclick = (e) => { if (e.target === d) d.remove(); };
}

async function submit(app, d) {
  const { c } = st; const sol = c.solution;
  const okC = d.get("culprit") === sol.culprit, okM = d.get("motive") === sol.motive, okMe = d.get("method") === sol.method, okK = sol.key.includes(d.get("key"));
  const flags = new Set(c.contra.map((x) => x.flag)).size;
  const insight = flags ? new Set(st.found.map((f) => f.flag)).size / flags : 1;
  let score = (okC ? 40 : 0) + (okM ? 15 : 0) + (okMe ? 15 : 0) + (okK ? 15 : 0) + Math.round(insight * 15);
  score = Math.max(0, score - Math.min(15, st.wrong * 3));
  const par = allEv().length + c.suspects.reduce((a, s) => a + s.qs.length, 0) + 2;
  const fast = okC && st.actions <= par;
  let tokens = okC ? Math.round(c.reward * (score / 100) * (1 - 0.15 * st.hints)) + (fast ? Math.round(c.reward * 0.2) : 0) : Math.round(c.reward * 0.05);
  let earned = 0;
  const first = !st.done;
  if (first) {
    earned = tokens; await db.addTokens(tokens); await db.saveCase(c.id, score);
    db.vipSet("dstate_" + c.id, null);
  }
  st.done = true;
  const culprit = c.suspects.find((s) => s.id === sol.culprit);
  const p = await db.getProfile();
  const rank = rankOf(p.tokens);
  const before = rankOf(p.tokens - earned);
  st.result = `<div class="center stack verdict ${okC ? "win" : "lose"}">
    <div class="verdict-ico">${okC ? "🏆" : "🕳️"}</div>
    <h2>${okC ? "Ish yechildi!" : "Aybdor boshqa odam edi…"}</h2>
    <div class="row" style="justify-content:center"><span class="tag ${okC ? "ok-tag" : ""}">Aybdor ${okC ? "✓" : "✗"}</span><span class="tag ${okM ? "ok-tag" : ""}">Motiv ${okM ? "✓" : "✗"}</span><span class="tag ${okMe ? "ok-tag" : ""}">Usul ${okMe ? "✓" : "✗"}</span><span class="tag ${okK ? "ok-tag" : ""}">Yolg'on ${okK ? "✓" : "✗"}</span><span class="tag">Fosh: ${Math.round(insight * 100)}%</span></div>
    <div class="big-num">${score}%</div>
    ${earned ? `<p class="tokens" style="font-size:22px;justify-content:center">+${earned} 🪙${fast ? " (shu jumladan tezkorlik bonusi)" : ""}</p>` : ""}
    ${first && rank.name !== before.name ? `<div class="promo">🎉 Yangi unvon: <b>${rank.ico} ${rank.name}</b></div>` : ""}
    <div class="dossier" style="text-align:left"><p><b>Yechim:</b> ${culprit.face} ${culprit.name} — ${esc(c.motives.find((m) => m.id === sol.motive).t.toLowerCase())}. ${esc(c.methods.find((m) => m.id === sol.method).t)}.</p><p>${esc(c.epilogue)}</p></div>
    <button class="btn" id="dback2">Boshqa ishlar</button></div>`;
  if (okC) confetti(120);
  draw(app);
}

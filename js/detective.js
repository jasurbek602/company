// To'liq 3D Detektiv o'yini — boshqaruvchi (holat, HUD, navigatsiya).
// Manzillar:  #/detective                    → Shtab (ish papkalari)
//             #/detective/<ish>              → Ish xaritasi (3D shaharcha)
//             #/detective/<ish>/loc/<joy>    → Jinoyat joyi
//             #/detective/<ish>/sorov        → So'roq xonasi
//             #/detective/<ish>/taxta        → Dalillar taxtasi
//             #/detective/<ish>/sud          → Sud zali
import * as db from "./db.js";
import { toast, confetti, esc, setCleanup } from "./app.js";
import { CASES, RANKS, FREE_CASES } from "./cases.js";
import { renderDetective as render2D, rankOf } from "./detective2d.js";
import { load3D, webglOK, Engine, buildHQ, buildMap, buildLocation, buildInterrogation, buildBoard, buildCourt } from "./det3d.js";

export { rankOf };

let eng = null, root = null, st = null, cur = null, built = null;
const $ = (s) => root?.querySelector(s);
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const parts = () => location.hash.replace(/^#\/?/, "").split("/").slice(1); // [ish, sahna, joy]

/* ===================== Kirish nuqtasi ===================== */
export async function renderDetective(app) {
  if (!webglOK() || localStorage.getItem("det3d") === "0") return render2D(app, parts()[0]);
  app.innerHTML = `<div class="det3d-root"><div class="det3d-stage" id="stage">
      <div class="hud-top" id="hudTop"></div>
      <div class="hud-panel" id="panel"></div>
      <aside class="hud-notebook" id="nbk"></aside>
      <div class="hud-modal" id="modal"></div>
      <div class="hud-fader on" id="fader"><div class="spinner"></div><p>3D dunyo yuklanmoqda…</p></div>
    </div>
    <p class="det3d-tip muted small">🖐 Suring — aylantirish · 🤏 Chimdish / g'ildirak — yaqinlashtirish · 👆 Bosish — tanlash · <button class="linkbtn" id="to2d">Oddiy (2D) ko'rinish</button></p></div>`;
  root = app.querySelector(".det3d-root");
  root.querySelector("#to2d").onclick = () => { localStorage.setItem("det3d", "0"); disposeAll(); render2D(app, parts()[0]); };
  if (!(await load3D())) { disposeAll(); return render2D(app, parts()[0]); }
  if (!root.isConnected) return;
  eng = new Engine($("#stage"));
  setCleanup(disposeAll);
  await go();
}
// Router shu funksiyani chaqiradi: detektiv ichidagi o'tishlarda sahifa qayta qurilmaydi
export function detHandles() {
  if (!eng || !root?.isConnected) return false;
  go();
  return true;
}
function disposeAll() { eng?.dispose(); eng = null; root = null; built = null; cur = null; }

async function go() {
  const [caseId, scene, locId] = parts();
  const c = CASES.find((x) => x.id === caseId);
  closeModal(); closeNotebook(); $("#panel").className = "hud-panel"; $("#panel").innerHTML = "";
  if (!c) return show("hq", () => sceneHQ());
  const solved = await db.solvedCases();
  const idx = CASES.indexOf(c);
  if (idx >= FREE_CASES && !db.isPremium()) { location.hash = "#/detective"; setTimeout(premiumModal, 400); return; }
  if (!st || st.c.id !== c.id) loadState(c, solved);
  if (scene === "loc") { const loc = c.locations.find((l) => l.id === locId) || c.locations[0]; return show("loc:" + loc.id, () => sceneLoc(loc)); }
  if (scene === "sorov") return show("sorov", () => sceneSorov());
  if (scene === "taxta") return show("taxta", () => sceneBoard());
  if (scene === "sud") return show("sud", () => sceneCourt());
  return show("map", () => sceneMap());
}
async function show(key, fn) {
  const f = $("#fader"); f.classList.add("on");
  await new Promise((r) => setTimeout(r, cur ? 230 : 0));
  if (!eng) return;
  cur = key;
  fn();
  setTimeout(() => f.classList.remove("on"), 80);
}
const nav = (h) => (location.hash = h);

/* ===================== Holat ===================== */
function loadState(c, solved) {
  const sv = db.vipGet("dstate_" + c.id, null);
  st = {
    c, seen: new Set(sv?.seen || []), asked: new Set(sv?.asked || []), known: new Set(sv?.known || []),
    clues: sv?.clues || [], statements: sv?.statements || [], found: sv?.found || [], chats: sv?.chats || {},
    actions: sv?.actions || 0, wrong: sv?.wrong || 0, hints: sv?.hints || 0, briefSeen: sv?.briefSeen || false, attempts: sv?.attempts || 0,
    sel: [], done: solved.some((y) => y.case_id === c.id), result: null, culprit: null,
  };
}
function save() {
  if (st.done) return;
  db.vipSet("dstate_" + st.c.id, { seen: [...st.seen], asked: [...st.asked], known: [...st.known], clues: st.clues, statements: st.statements, found: st.found, chats: st.chats, actions: st.actions, wrong: st.wrong, hints: st.hints, briefSeen: st.briefSeen, attempts: st.attempts });
}
const has = (need) => !need || st.known.has(need) || st.seen.has(need);
const allEv = () => st.c.locations.flatMap((l) => l.ev);
const evById = (id) => allEv().find((e) => e.id === id);
const stById = (id) => st.statements.find((s) => s.id === id);
const evState = (e) => (!has(e.need) ? "locked" : st.seen.has(e.id) ? "seen" : "new");
const flagsTotal = () => new Set(st.c.contra.map((x) => x.flag)).size;
const flagsFound = () => new Set(st.found.map((f) => f.flag)).size;
function addClue(t, time) { if (!st.clues.some((x) => x.t === t)) { st.clues.push({ t, time }); pulseNb(); } }
function pulseNb() { const b = $("#nbBtn"); if (b) { b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); } }

/* ===================== HUD ===================== */
function topbar({ back, backTxt, title, sub, extra = "" }) {
  const counters = st && cur !== "hq" ? `<span class="hud-chip">🔍 ${st.seen.size}/${allEv().length}</span><span class="hud-chip">⚡ ${flagsFound()}/${flagsTotal()}</span>` : "";
  $("#hudTop").innerHTML = `${back ? `<button class="hud-btn back" id="hBack">← ${backTxt}</button>` : ""}
    <div class="hud-title"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</div>
    <div class="hud-right">${counters}${extra}${st && cur !== "hq" ? `<button class="hud-btn" id="nbBtn" title="Bloknot">📒</button>` : ""}</div>`;
  if (back) $("#hBack").onclick = () => nav(back);
  const nb = $("#nbBtn"); if (nb) nb.onclick = toggleNotebook;
}
function panel(html, cls = "") { const p = $("#panel"); p.className = "hud-panel show " + cls; p.innerHTML = html; return p; }
function hidePanel() { const p = $("#panel"); if (p) p.className = "hud-panel"; }
function modal(html, cls = "") {
  const m = $("#modal"); m.className = "hud-modal show " + cls;
  m.innerHTML = `<div class="hm-card">${html}</div>`;
  m.onclick = (e) => { if (e.target === m) closeModal(); };
  m.querySelectorAll("[data-close]").forEach((b) => (b.onclick = closeModal));
  return m;
}
function closeModal() { const m = $("#modal"); if (m) { m.className = "hud-modal"; m.innerHTML = ""; } }
function toggleNotebook() { const n = $("#nbk"); if (n.classList.contains("show")) return closeNotebook(); n.innerHTML = notebookHTML(); n.classList.add("show"); bindNotebook(); }
function closeNotebook() { $("#nbk")?.classList.remove("show"); }
function refreshNotebook() { const n = $("#nbk"); if (n?.classList.contains("show")) { n.innerHTML = notebookHTML(); bindNotebook(); } }
function notebookHTML() {
  const c = st.c;
  return `<div class="row" style="justify-content:space-between"><h3 style="margin:0">📒 Bloknot</h3><button class="hud-btn sm" id="nbX">✕</button></div>
    ${st.found.length ? `<div class="insights">${st.found.map((f) => `<div class="insight">⚡ ${esc(f.insight)}</div>`).join("")}</div>` : ""}
    ${st.clues.length ? `<ul class="nb-list">${st.clues.map((x) => `<li>${x.time ? `<b>${esc(x.time)}</b> ` : ""}${esc(x.t)}</li>`).join("")}</ul>` : `<p class="muted small">Izlar shu yerda to'planadi.</p>`}
    ${st.done ? "" : `<button class="btn ghost sm" id="hint" ${st.hints >= c.hints.length ? "disabled" : ""}>💡 Maslahat (${c.hints.length - st.hints} · −15%)</button>`}
    ${st.hints ? `<div class="hints">${c.hints.slice(0, st.hints).map((h) => `<p class="small">💡 ${esc(h)}</p>`).join("")}</div>` : ""}`;
}
function bindNotebook() {
  $("#nbX").onclick = closeNotebook;
  const h = $("#hint"); if (h) h.onclick = () => { if (st.hints < st.c.hints.length) { st.hints++; save(); refreshNotebook(); } };
}
function flash(title, text, good) {
  modal(`<div class="center"><h2 class="${good ? "gold-t" : "bad-t"}">${esc(title)}</h2><p>${esc(text).replace(/\n/g, "<br>")}</p><button class="btn ${good ? "gold" : "ghost"}" data-close>Davom etish</button></div>`, good ? "good" : "bad");
  if (good) confetti(40);
}

/* ===================== 1) SHTAB ===================== */
async function sceneHQ() {
  st = null;
  const p = await db.getProfile(), solved = await db.solvedCases();
  const prem = db.isPremium();
  const info = CASES.map((x, i) => { const s = solved.find((y) => y.case_id === x.id); const pLock = !prem && i >= FREE_CASES; return { solved: !!s, score: s?.score, premium: pLock, locked: pLock, inProg: !s && !!db.vipGet("dstate_" + x.id, null) }; });
  built = buildHQ(CASES, info, (d) => { if (d.premium) return premiumModal(); if (d.locked) return toast("🔒 Avval oldingi ishni yeching"); eng.flyTo([0, 2.6, 2.6], [0, 1, 0], 450).then(() => nav("#/detective/" + d.id)); });
  eng.set(built);
  const rank = rankOf(p.tokens);
  const daily = dailyState(); const canClaim = daily.last !== today();
  topbar({ back: null, title: `${rank.ico} ${rank.name}`, sub: rank.next ? `Keyingi: ${rank.next.name} — ${rank.next.min} 🪙` : "Eng yuqori unvon!",
    extra: `<span class="hud-chip gold">🪙 ${p.tokens}</span><button class="hud-btn ${canClaim ? "glow" : ""}" id="hDaily">🎁</button><button class="hud-btn" id="hAch">🏆</button>` });
  panel(`<span>📁 Stoldagi <b>ish papkasini</b> bosing. Premium a'zolar uchun barcha ishlar ochiq — istaganingizdan boshlang.</span>`, "p-hint");
  $("#hDaily").onclick = () => dailyModal();
  $("#hAch").onclick = () => achModal(p, solved);
  if (canClaim) setTimeout(() => cur === "hq" && dailyModal(), 700);
}
function premiumModal() {
  modal(`<div class="center"><div class="big-emoji">👑</div><h2>Bu ish Premium a'zolar uchun</h2>
    <p class="muted">Birinchi ish — bepul. Yana <b>${CASES.length - FREE_CASES} ta</b> qiziqarli ish (tort o'g'risi, gapiruvchi to'tiqush, kutubxona arvohi, poyezd siri…), kunlik mukofotlar va unvonlar Premiumda.</p>
    <div class="row" style="justify-content:center"><a class="btn gold lg" href="#/vip">👑 Premium olish</a><button class="btn ghost" data-close>Keyinroq</button></div></div>`);
}
function dailyState() { return db.vipGet("daily", { last: null, streak: 0 }); }
function dailyModal() {
  const d = dailyState(); const claimed = d.last === today();
  const next = claimed ? d.streak : d.last === yesterday() ? d.streak + 1 : 1;
  const amount = 10 + 5 * Math.min(next - 1, 6);
  modal(`<div class="center"><div class="big-emoji">🎁</div><h2>Kunlik mukofot</h2><p class="muted">Har kuni kiring — seriya oshgan sari mukofot ko'payadi.</p>
    <div class="streak center-row">${[1, 2, 3, 4, 5, 6, 7].map((i) => `<span class="${i <= (claimed ? d.streak : next - 1) ? "on" : ""} ${i === next && !claimed ? "next" : ""}">${i}</span>`).join("")}</div>
    ${claimed ? `<p class="ok-t">✓ Bugungi mukofot olindi. Ertaga qayting! (${d.streak} kunlik seriya)</p><button class="btn ghost" data-close>Yopish</button>` : `<button class="btn gold lg" id="claim">+${amount} 🪙 olish</button>`}</div>`);
  const b = $("#claim"); if (b) b.onclick = async () => {
    db.vipSet("daily", { last: today(), streak: next }); await db.addTokens(amount); confetti(80); toast(`🎁 +${amount} token!`); closeModal(); show("hq", () => sceneHQ());
  };
}
const ACH = [
  ["🥉", "Birinchi ish", "1 ta ishni yeching", (x) => x.solved >= 1], ["🥈", "Tajribali tergovchi", "3 ta ishni yeching", (x) => x.solved >= 3],
  ["🥇", "Barcha sirlar", "6 ta ishning hammasi", (x) => x.solved >= 6], ["💯", "Mukammal", "Biror ishni 100% yeching", (x) => x.best >= 100],
  ["🧠", "Maslahatsiz", "Ishni maslahatsiz yeching", (x) => x.nohint], ["💰", "Boy detektiv", "300 token to'plang", (x) => x.tokens >= 300],
  ["🔥", "Sodiq", "3 kun ketma-ket", (x) => x.streak >= 3], ["📅", "Haftalik qahramon", "7 kun ketma-ket", (x) => x.streak >= 7],
];
function achModal(p, solved) {
  const x = { solved: solved.length, best: Math.max(0, ...solved.map((s) => s.score)), nohint: db.vipGet("ach_nohint", false), tokens: p.tokens, streak: dailyState().streak };
  modal(`<h2>🏆 Yutuqlar</h2><div class="ach-grid">${ACH.map(([i, t, d, ok]) => `<div class="ach ${ok(x) ? "got" : ""}"><span class="ach-ico">${ok(x) ? i : "🔒"}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div><div class="center mt"><button class="btn ghost" data-close>Yopish</button></div>`, "wide");
}

/* ===================== 2) ISH XARITASI ===================== */
function progress() {
  const loc = {}; st.c.locations.forEach((l) => (loc[l.id] = `${l.ev.filter((e) => st.seen.has(e.id)).length}/${l.ev.length}`));
  const qsLeft = st.c.suspects.reduce((a, s) => a + s.qs.filter((q, i) => !st.asked.has(s.id + i) && has(q.need)).length, 0);
  return { loc, qs: qsLeft, found: `${flagsFound()}/${flagsTotal()}`, done: st.done };
}
function sceneMap() {
  const c = st.c;
  built = buildMap(c, progress(), (d, o) => {
    const p = o.parent && o.parent.type === "Group" ? o.parent.position : o.position;
    const to = d.kind === "loc" ? `#/detective/${c.id}/loc/${d.id}` : `#/detective/${c.id}/${d.kind}`;
    eng.flyTo([p.x * 0.55, 3.2, p.z * 0.55], [p.x, 1, p.z], 550).then(() => nav(to));
  });
  eng.set(built);
  topbar({ back: "#/detective", backTxt: "Shtab", title: `${c.ico} ${c.title}`, sub: "★".repeat(c.diff), extra: `<button class="hud-btn" id="hBrief">📋</button>` });
  panel(`<span>🏠 Binoga bosing: <b>joylar</b>ni tinting, <b>so'roq</b> qiling, <b>taxta</b>da yolg'onni fosh qiling, <b>sud</b>da ayblang.</span>`, "p-hint");
  $("#hBrief").onclick = briefModal;
  if (!st.briefSeen) { st.briefSeen = true; save(); setTimeout(briefModal, 500); }
}
function briefModal() {
  const c = st.c;
  modal(`<div class="dossier-3d"><div class="case-num">ISH №${String(CASES.indexOf(c) + 1).padStart(3, "0")} · MAXFIY</div><h2>${c.ico} ${c.title}</h2>
    ${c.intro.map((p, i) => `<p class="typed" style="animation-delay:${i * 300}ms">${esc(p)}</p>`).join("")}
    <div class="sus-mini">${c.suspects.map((s) => `<span>${s.face} <b>${s.name}</b> <small>${s.role}</small></span>`).join("")}</div>
    <button class="btn gold" data-close>Tergovni boshlash →</button></div>`, "wide");
}

/* ===================== 3) JINOYAT JOYI ===================== */
function sceneLoc(loc) {
  const c = st.c;
  built = buildLocation(loc, evState, (it) => {
    const e = it.ev;
    const p = it.obj.position; eng.flyTo([p.x + (eng.camera.position.x - p.x) * 0.35, p.y + 1.6, p.z + 3.4], [p.x, p.y + 0.5, p.z], 650);
    if (!has(e.need)) return panel(`<span class="rv-ico">🔒</span><div><b>Yopiq dalil</b><p>${esc(e.lock || "Nimadir yetishmayapti…")}</p></div><button class="hud-btn sm px" id="pX">✕</button>`, "p-reveal locked"), bindPX();
    const fresh = !st.seen.has(e.id);
    if (fresh) { st.seen.add(e.id); st.actions++; addClue(e.clue, e.time); save(); built.update(it, "seen"); topbarLoc(loc); refreshNotebook(); }
    panel(`<span class="rv-ico">${e.ico}</span><div><b>${esc(e.name)}${fresh ? ' <span class="new-t">YANGI IZ</span>' : ""}</b><p>${esc(e.clue)}</p></div><button class="hud-btn sm px" id="pX">✕</button>`, "p-reveal " + (fresh ? "new" : "seen"));
    bindPX();
    if (fresh && loc.ev.every((x) => st.seen.has(x.id))) setTimeout(() => toast("✅ Bu joy to'liq tekshirildi"), 900);
  });
  eng.set(built);
  topbarLoc(loc);
  panel(`<span>${loc.ico} ${esc(loc.desc)} — porlayotgan <b>dalillarni</b> bosing.</span>`, "p-hint");
}
function topbarLoc(loc) { topbar({ back: `#/detective/${st.c.id}`, backTxt: "Xarita", title: `${loc.ico} ${loc.name}`, sub: `${loc.ev.filter((e) => st.seen.has(e.id)).length}/${loc.ev.length} dalil` }); }
function bindPX() { const x = $("#pX"); if (x) x.onclick = hidePanel; }

/* ===================== 4) SO'ROQ XONASI ===================== */
const qsAvail = (s) => s.qs.map((q, i) => ({ q, i })).filter(({ q, i }) => !st.asked.has(s.id + i) && has(q.need));
const badge = (s) => { const n = qsAvail(s).length; return n ? `💬 ${n} savol` : "✓ So'raldi"; };
function sceneSorov() {
  built = buildInterrogation(st.c.suspects, badge, (d) => openSuspect(d));
  eng.set(built);
  topbar({ back: `#/detective/${st.c.id}`, backTxt: "Xarita", title: "🗣 So'roq xonasi", sub: "Gumonlanuvchini bosing" });
  panel(`<span>👤 Gumonlanuvchini bosing va savol bering. <b>⚡</b> savollar yangi dalil yoki fosh qilingan yolg'ondan keyin ochiladi.</span>`, "p-hint");
}
function openSuspect(d) {
  const s = d.s;
  eng.flyTo([d.x * 0.7, 2.3, d.z + 4.2], [d.x, 1.35, d.z], 600);
  const avail = qsAvail(s);
  const locked = s.qs.filter((q, i) => !st.asked.has(s.id + i) && !has(q.need)).length;
  const p = panel(`<div class="sus-head"><span class="face">${s.face}</span><div><b>${s.name}</b><small>${s.role} · ${esc(s.bio)}</small></div><button class="hud-btn sm" id="pX">✕</button></div>
    <div class="chat" id="chat">${(st.chats[s.id] || []).map((m) => `<div class="bubble ${m.me ? "me" : "them"}">${esc(m.t)}</div>`).join("")}</div>
    <div class="q-btns">${avail.map(({ q, i }) => `<button class="qbtn ${q.need ? "hot" : ""}" data-q="${i}">${q.need ? "⚡ " : "❓ "}${esc(q.q)}</button>`).join("")}
      ${locked ? `<span class="tag small">🔒 ${locked} ta yashirin savol</span>` : ""}${!avail.length && !locked ? `<span class="muted small">Hamma savollar berildi.</span>` : ""}</div>`, "p-sus");
  const ch = p.querySelector("#chat"); ch.scrollTop = ch.scrollHeight;
  p.querySelector("#pX").onclick = () => { hidePanel(); eng.flyTo(built ? [0, 3, 5.4] : [0, 3, 5.4], [0, 1.2, -1.2], 600); };
  p.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => {
    const q = s.qs[+b.dataset.q];
    st.asked.add(s.id + b.dataset.q); st.actions++;
    (st.chats[s.id] ||= []).push({ me: true, t: q.q }, { me: false, t: q.a });
    if (q.st && !stById(q.st)) { st.statements.push({ id: q.st, who: s.name, face: s.face, text: q.a }); toast("🧷 Ko'rsatma taxtaga qo'shildi"); }
    if (q.clue) addClue(q.clue, q.time);
    if (q.flag) st.known.add(q.flag);
    save(); built.relabel(d); refreshNotebook(); topbar({ back: `#/detective/${st.c.id}`, backTxt: "Xarita", title: "🗣 So'roq xonasi", sub: "Gumonlanuvchini bosing" });
    // gapirayotgan personaj animatsiyasi
    const g = d.p.head; const t0 = performance.now(); const talk = (t) => { if (t - t0 < 1200) g.scale.y = 1 + Math.abs(Math.sin(t / 70)) * 0.06; else g.scale.y = 1; };
    built.anim.push(talk);
    openSuspect(d);
  }));
}

/* ===================== 5) DALILLAR TAXTASI ===================== */
// --- yordamchilar: qaysi yolg'onlar hozir topilishi mumkin ---
const onBoard = (id) => !!stById(id) || (st.seen.has(id) && !!evById(id));
const pairFound = (k) => st.found.some((f) => (f.a === k.a && f.b === k.b) || (f.a === k.b && f.b === k.a));
const flagDone = (flag) => st.found.some((f) => f.flag === flag);
// ochiq qarama-qarshiliklar: ikkala karta taxtada, hali fosh qilinmagan
const openContra = () => st.c.contra.filter((k) => !pairFound(k) && !flagDone(k.flag) && onBoard(k.a) && onBoard(k.b));
// faqat yolg'on gapirgan tomon (contra.a — ishlarda doim yolg'onchi ko'rsatmasi) belgilanadi
function susIds() { const s = new Set(); for (const k of openContra()) { if (stById(k.a)) s.add(k.a); else if (stById(k.b)) s.add(k.b); } return s; }
function candIds() {
  if (st.sel.length !== 1) return new Set();
  const id = st.sel[0]; if (!susIds().has(id)) return new Set();
  const partners = openContra().filter((k) => k.a === id || k.b === id).map((k) => (k.a === id ? k.b : k.a));
  // bitta chalg'ituvchi karta — o'yinchi baribir o'ylashi kerak
  const others = boardCards(true).map((c) => c.id).filter((x) => x !== id && !partners.includes(x) && evById(x));
  const decoy = others.length ? others[(id.length * 7 + others.length) % others.length] : null;
  return new Set([...partners, ...(decoy ? [decoy] : [])]);
}
function stateOf(id, cand) { return st.sel.includes(id) ? "sel" : st.found.some((f) => f.a === id || f.b === id) ? "used" : cand.has(id) ? "cand" : ""; }
function boardCards(raw) {
  const stc = st.statements.map((s) => ({ id: s.id, kind: "st", icon: s.face, head: s.who, body: s.text }));
  const evc = allEv().filter((e) => st.seen.has(e.id)).map((e) => ({ id: e.id, kind: "ev", icon: e.ico, head: e.name, body: e.clue }));
  const all = [...stc, ...evc];
  if (raw) return all;
  const sus = susIds(), cand = candIds();
  return all.map((c) => ({ ...c, state: stateOf(c.id, cand), sus: sus.has(c.id) }));
}
function sceneBoard() {
  const cards = boardCards();
  built = buildBoard(cards, st.found.map((f) => [f.a, f.b]), (d) => selectCard(d.card.id));
  eng.set(built);
  topbar({ back: `#/detective/${st.c.id}`, backTxt: "Xarita", title: "🧷 Dalillar taxtasi", sub: `${cards.length} karta · ⚡ ${flagsFound()}/${flagsTotal()}`, extra: `<button class="hud-btn" id="hList" title="Ro'yxat ko'rinishi">📋</button><button class="hud-btn" id="hTime" title="Xronologiya">🕒</button>` });
  $("#hTime").onclick = timelineModal;
  $("#hList").onclick = listModal;
  if (cards.length < 2) panel(`<span>Taxtada hali yetarli karta yo'q. Joylarni tinting va so'roq qiling — <b>ko'rsatmalar</b> (binafsha) va <b>dalillar</b> (sariq) shu yerga ilinadi.</span>`, "p-hint");
  else boardPanel();
}
function selectCard(id) {
  if (st.sel.includes(id)) st.sel = st.sel.filter((x) => x !== id);
  else { if (st.sel.length === 2) st.sel.shift(); st.sel.push(id); }
  restyleAll(); boardPanel();
  if ($("#modal").classList.contains("show")) listModal();
}
function restyleAll() {
  if (!built?.meshes) return;
  const sus = susIds(), cand = candIds();
  for (const d of built.meshes.values()) {
    const s = stateOf(d.card.id, cand), u = sus.has(d.card.id);
    if (d._s !== s || d._u !== u) { built.restyle(d, s, u); d._s = s; d._u = u; }
  }
}
function boardPanel() {
  const get = (id) => built.meshes.get(id)?.card;
  const sel = st.sel.map(get).filter(Boolean);
  const nSus = susIds().size, cand = candIds();
  let tip = "";
  if (!sel.length) tip = nSus ? `🤔 Taxtada <b>${nSus} ta shubhali</b> ko'rsatma bor (to'q sariq belgi). Shubhali kartani bosing — tekshirish kerak bo'lgan dalillar <b>❓ ko'k</b> bilan yonadi.` : `Hozircha fosh qilinadigan yolg'on yo'q. Ko'proq <b>joylarni tinting</b> va <b>so'roq</b> qiling — yangi kartalar paydo bo'ladi.`;
  else if (sel.length === 1) tip = cand.size ? `👉 Endi <b>❓ ko'k</b> belgili kartalardan birini tanlang — ulardan biri bu gapga zid.` : `Bu kartaga zid keladigan ikkinchi kartani tanlang.`;
  const p = panel(`${sel.map((c) => `<div class="selcard sc-${c.kind}"><b>${c.icon} ${esc(c.head)}</b><p>${c.kind === "st" ? `"${esc(c.body)}"` : esc(c.body)}</p></div>`).join("")}${tip ? `<span class="brd-tip">${tip}</span>` : ""}
    <div class="brd-actions"><button class="btn ghost sm" id="openList">📋 Ro'yxat</button><button class="btn gold" id="cmp" ${sel.length === 2 ? "" : "disabled"}>⚡ Taqqoslash (${sel.length}/2)</button></div>`, "p-brd");
  p.querySelector("#cmp").onclick = compare;
  p.querySelector("#openList").onclick = listModal;
}
// Katta matnli ro'yxat (telefonda o'qish oson)
function listModal() {
  const cards = boardCards();
  const badge = (c) => (c.state === "used" ? `<span class="lc-b used">⚡ Yolg'on</span>` : c.state === "sel" ? `<span class="lc-b sel">✓ Tanlandi</span>` : c.state === "cand" ? `<span class="lc-b cand">❓ Tekshiring</span>` : "") + (c.sus && c.state !== "used" ? `<span class="lc-b sus">🤔 Shubhali</span>` : "");
  const item = (c) => `<button class="lcard sc-${c.kind} ${c.state ? "ls-" + c.state : ""}" data-id="${c.id}"><span class="lc-head">${c.icon} <b>${esc(c.head)}</b>${badge(c)}</span><span class="lc-body">${c.kind === "st" ? `"${esc(c.body)}"` : esc(c.body)}</span></button>`;
  const stc = cards.filter((c) => c.kind === "st"), evc = cards.filter((c) => c.kind === "ev");
  const none = `<p class="muted small">Hali yo'q</p>`;
  const m = modal(`<div class="row" style="justify-content:space-between"><h2 style="margin:0">🧷 Taxta — ro'yxat</h2><button class="hud-btn sm" data-close>✕</button></div>
    <p class="muted small">Ikkita kartani tanlang va taqqoslang. ${st.sel.length}/2 tanlandi.</p>
    <h4>🗣 Ko'rsatmalar</h4><div class="lgrid">${stc.map(item).join("") || none}</div>
    <h4>🔍 Dalillar</h4><div class="lgrid">${evc.map(item).join("") || none}</div>
    <div class="list-foot"><button class="btn gold" id="cmp2" ${st.sel.length === 2 ? "" : "disabled"}>⚡ Taqqoslash (${st.sel.length}/2)</button></div>`, "wide list-modal");
  m.querySelectorAll(".lcard").forEach((b) => (b.onclick = () => selectCard(b.dataset.id)));
  m.querySelector("#cmp2").onclick = () => { closeModal(); compare(); };
}
function compare() {
  const [x, y] = st.sel; st.actions++;
  const hit = st.c.contra.find((k) => (k.a === x && k.b === y) || (k.a === y && k.b === x));
  if (hit && !pairFound(hit)) {
    const isNew = !st.known.has(hit.flag);
    st.found.push({ a: hit.a, b: hit.b, insight: hit.insight, flag: hit.flag }); st.known.add(hit.flag); st.sel = []; save();
    sceneBoard(); refreshNotebook();
    flash("⚡ YOLG'ON FOSH QILINDI", hit.insight + (isNew ? "\n\nYangi savollar va dalillar ochildi!" : ""), true);
    return;
  }
  if (hit) { toast("Bu qarama-qarshilik allaqachon topilgan"); st.sel = []; sceneBoard(); return; }
  const near = openContra().some((k) => [k.a, k.b].includes(x) || [k.a, k.b].includes(y));
  const keep = near ? st.sel.find((id) => susIds().has(id)) : null;
  st.sel = keep ? [keep] : [];
  if (near) { save(); restyleAll(); boardPanel(); flash("🔥 Yaqin!", "Kartalardan biri haqiqatan shubhali — lekin bu ikkisi bir-biriga zid emas. Uning juftini boshqa kartalar orasidan qidiring (❓ ko'k belgili kartalarga qarang).\n\nBu urinish hisobga olinmadi.", true); return; }
  st.wrong++; save(); restyleAll(); boardPanel();
  flash("✗ Zid emas", "Bu ikki karta bir-biriga zid kelmaydi. Maslahat: avval 🤔 Shubhali belgili ko'rsatmani tanlang.", false);
}
function timelineModal() {
  const ev = [...allEv().filter((e) => st.seen.has(e.id) && e.time).map((e) => ({ time: e.time, t: `${e.ico} ${e.clue}` })), ...st.clues.filter((x) => x.time && !allEv().some((e) => e.clue === x.t)).map((x) => ({ time: x.time, t: "🗣 " + x.t }))];
  const key = (t) => { const m = /(\d{1,2}):(\d{2})/.exec(t); if (!m) return 9999; let h = +m[1]; if (h < 12 && /^0/.test(t)) h += 24; return h * 60 + +m[2]; };
  ev.sort((a, b) => key(a.time) - key(b.time));
  modal(`<h2>🕒 Xronologiya</h2>${ev.length ? `<div class="timeline">${ev.map((e, i) => `<div class="tl-item" style="animation-delay:${i * 60}ms"><span class="tl-time">${esc(e.time)}</span><span class="tl-dot"></span><span class="tl-text">${esc(e.t)}</span></div>`).join("")}</div>` : `<p class="muted">Vaqtga bog'liq dalillar topilganda xronologiya shu yerda tuziladi.</p>`}<div class="center mt"><button class="btn ghost" data-close>Yopish</button></div>`, "wide");
}

/* ===================== 6) SUD ZALI ===================== */
// har bir gumonlanuvchining fosh qilingan yolg'onlari soni
function liesBy() {
  const m = {};
  for (const f of st.found) { const sid = stById(f.a) ? f.a : stById(f.b) ? f.b : null; const s = sid && stById(sid); if (s) { const sus = st.c.suspects.find((x) => x.name === s.who); if (sus) m[sus.id] = (m[sus.id] || 0) + 1; } }
  return m;
}
function sceneCourt() {
  built = buildCourt(st.c.suspects, liesBy(), (d) => { if (st.result) return; st.culprit = d; built.select(d); courtPanel(); });
  eng.set(built);
  topbar({ back: `#/detective/${st.c.id}`, backTxt: "Xarita", title: "⚖️ Sud zali", sub: st.done ? "Ish yechilgan" : "Aybdorni tanlang" });
  if (st.result) { modal(st.result, "wide verdict-modal"); bindVerdict(); return; }
  st.culprit = null; st.form = {};
  courtPanel();
}
function courtPanel() {
  const c = st.c, f = st.form || (st.form = {});
  const keyOpts = [...new Set(st.found.map((x) => (stById(x.a) ? x.a : x.b)))].filter((id) => stById(id));
  if (keyOpts.length === 1 && !f.key) f.key = keyOpts[0];
  const sol = c.solution;
  // 📎 — bu variantni tasdiqlovchi dalil topilgan (faqat to'g'ri variantga bog'langan dalillar)
  const backed = (list, ok) => (list || []).some((e) => st.seen.has(e)) ? ok : null;
  const mOk = backed(sol.mEv, sol.motive), wOk = backed(sol.wEv, sol.method);
  const chips = (name, list, mark) => `<div class="chips">${list.map(([v, t]) => `<button class="chip ${f[name] === v ? "on" : ""} ${mark === v ? "backed" : ""}" data-n="${name}" data-v="${v}">${mark === v ? "📎 " : ""}${esc(t)}</button>`).join("")}</div>`;
  const lies = liesBy();
  const liesTxt = c.suspects.filter((s) => lies[s.id]).map((s) => `${s.face} <b>${s.name}</b> — ⚡ ${lies[s.id]} ta yolg'on`).join(" · ");
  const p = panel(`${liesTxt ? `<div class="court-help">🔎 <b>Tergov xulosasi:</b> ${liesTxt}</div>` : `<div class="court-help warn">⚠️ Hali hech kimning yolg'oni fosh qilinmagan. Avval <b>Dalillar taxtasi</b>ga boring.</div>`}
    <div class="court-step"><b>1. Aybdor:</b> ${st.culprit ? `<span class="tag gold">${st.culprit.s.face} ${st.culprit.s.name}</span>` : `<span class="muted">safdagi odamni bosing 👆 (⚡ belgisi — fosh qilingan yolg'onlar)</span>`}</div>
    <div class="court-step"><b>2. Motiv</b>${mOk ? ` <small class="muted">📎 — dalil bilan tasdiqlangan</small>` : ""}${chips("motive", c.motives.map((m) => [m.id, m.t]), mOk)}</div>
    <div class="court-step"><b>3. Usul</b>${wOk ? ` <small class="muted">📎 — dalil bilan tasdiqlangan</small>` : ""}${chips("method", c.methods.map((m) => [m.id, m.t]), wOk)}</div>
    <div class="court-step"><b>4. Hal qiluvchi yolg'on</b>${keyOpts.length ? chips("key", keyOpts.map((id) => { const s = stById(id); return [id, `${s.face} ${s.who}: "${s.text.slice(0, 60)}${s.text.length > 60 ? "…" : ""}"`]; })) : `<p class="muted small">Avval taxtada kamida bitta yolg'onni fosh qiling.</p>`}</div>
    <button class="btn gold lg" id="accuse" ${st.culprit && f.motive && f.method && f.key ? "" : "disabled"}>⚖️ Ayblovni e'lon qilish</button>
    ${st.attempts ? `<p class="muted small">⚠️ Bu oxirgi imkoniyat (mukofot −30%).</p>` : `<p class="muted small">Xato qilsangiz, yana 1 marta urinib ko'rish mumkin.</p>`}
    ${st.done ? `<p class="muted small">Bu ish avval yechilgan — qayta yechish token bermaydi.</p>` : ""}`, "p-court");
  p.querySelectorAll(".chip").forEach((b) => (b.onclick = () => { f[b.dataset.n] = b.dataset.v; courtPanel(); }));
  p.querySelector("#accuse").onclick = submit;
}
async function submit() {
  const c = st.c, sol = c.solution, f = st.form;
  const okC = st.culprit.s.id === sol.culprit, okM = f.motive === sol.motive, okMe = f.method === sol.method, okK = sol.key.includes(f.key);
  // birinchi xato — yechim oshkor qilinmaydi, yana bir imkoniyat beriladi
  if (!okC && !st.attempts && !st.done) {
    st.attempts = 1; save();
    built.select(null); st.culprit = null;
    modal(`<div class="center"><div class="big-emoji">🤔</div><h2>Sudya rozi emas</h2><p>Dalillar <b>boshqa odamga</b> ishora qilyapti. Fosh qilingan yolg'onlarga qayta qarang — kim eng ko'p yolg'on gapirdi?</p><p class="muted small">Yana 1 imkoniyat bor (mukofot −30%).</p><button class="btn gold" data-close>Qayta o'ylab ko'raman</button></div>`, "bad");
    courtPanel();
    return;
  }
  const insight = flagsTotal() ? flagsFound() / flagsTotal() : 1;
  let score = (okC ? 40 : 0) + (okM ? 15 : 0) + (okMe ? 15 : 0) + (okK ? 15 : 0) + Math.round(insight * 15);
  score = Math.max(0, score - Math.min(15, st.wrong * 3));
  const par = allEv().length + c.suspects.reduce((a, s) => a + s.qs.length, 0) + 2;
  const fast = okC && st.actions <= par;
  const tokens = okC ? Math.round(c.reward * (score / 100) * (1 - 0.15 * st.hints) * (st.attempts ? 0.7 : 1)) + (fast && !st.attempts ? Math.round(c.reward * 0.2) : 0) : Math.round(c.reward * 0.05);
  const first = !st.done; let earned = 0;
  const before = rankOf((await db.getProfile()).tokens);
  if (first) { earned = tokens; await db.addTokens(tokens); await db.saveCase(c.id, score); db.vipSet("dstate_" + c.id, null); if (okC && st.hints === 0) db.vipSet("ach_nohint", true); }
  st.done = true;
  const rank = rankOf((await db.getProfile()).tokens);
  hidePanel();
  const real = built.people.find((d) => d.s.id === sol.culprit);
  built.select(real); built.verdict(real, true);
  eng.flyTo([real.x * 0.5, 2.2, real.z + 3], [real.x, 1.5, real.z], 900);
  const culprit = c.suspects.find((s) => s.id === sol.culprit);
  st.result = `<div class="center verdict ${okC ? "win" : "lose"}"><div class="verdict-ico">${okC ? "🏆" : "🕳️"}</div><h2>${okC ? "Ish yechildi!" : "Aybdor boshqa odam edi…"}</h2>
    <div class="row" style="justify-content:center">${[["Aybdor", okC], ["Motiv", okM], ["Usul", okMe], ["Yolg'on", okK]].map(([t, ok]) => `<span class="tag ${ok ? "ok-tag" : ""}">${t} ${ok ? "✓" : "✗"}</span>`).join("")}<span class="tag">Fosh: ${Math.round(insight * 100)}%</span></div>
    <div class="big-num">${score}%</div>
    ${earned ? `<p class="tokens" style="font-size:22px;justify-content:center">+${earned} 🪙${fast && !st.attempts ? " (tezkorlik bonusi bilan)" : st.attempts ? " (2-urinish, −30%)" : ""}</p>` : ""}
    ${first && rank.name !== before.name ? `<div class="promo">🎉 Yangi unvon: <b>${rank.ico} ${rank.name}</b></div>` : ""}
    <div class="dossier-3d" style="text-align:left"><p><b>Yechim:</b> ${culprit.face} ${culprit.name} — ${esc(c.motives.find((m) => m.id === sol.motive).t.toLowerCase())}. ${esc(c.methods.find((m) => m.id === sol.method).t)}.</p><p>${esc(c.epilogue)}</p></div>
    <div class="row" style="justify-content:center"><button class="btn gold" id="vNext">${CASES.indexOf(c) < CASES.length - 1 ? "Keyingi ish →" : "Shtabga"}</button><button class="btn ghost" data-close>3D sahnani ko'rish</button></div></div>`;
  setTimeout(() => { if (cur === "sud") { modal(st.result, "wide verdict-modal"); bindVerdict(); if (okC) confetti(140); } }, 1100);
}
function bindVerdict() { const b = $("#vNext"); if (b) b.onclick = () => { const i = CASES.indexOf(st.c); nav(i < CASES.length - 1 ? "#/detective/" + CASES[i + 1].id : "#/detective"); }; }

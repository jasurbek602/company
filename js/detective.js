import * as db from "./db.js";
import { toast, confetti, esc } from "./app.js";

// Har bir ish: dalillar (ko'rib chiqilganda iz beradi), gumonlanuvchilar (savollar),
// "need" — savol faqat ma'lum dalil topilgandan keyin ochiladi (to'qnashtirish).
const CASES = [
  {
    id: "olmos", title: "Muzeydagi yo'qolgan olmos", diff: 1, reward: 30, ico: "💎",
    intro: "Samarqand tarix muzeyidan \"Ko'k Yulduz\" olmosi 22:00 dan 23:00 gacha bo'lgan oraliqda g'oyib bo'ldi. Signalizatsiya ishlamagan, vitrina buzilmagan. Kechasi soat 22:10 da kuchli yomg'ir boshlangan.",
    evidence: [
      { id: "vitrina", ico: "🔐", name: "Vitrina", clue: "Vitrina kalit bilan ochilgan. Kalitlar faqat restavrator Lola va direktor Anvarda bor." },
      { id: "kamera", ico: "📹", name: "Kamera yozuvlari", clue: "Qorovul Rustam 22:00–23:00 davomida kirish eshigida ko'rinib turibdi. Orqa eshik kamerasi 22:15 da xodimlar paneli orqali o'chirilgan." },
      { id: "plashch", ico: "🧥", name: "Ustaxonadagi plashch", clue: "Lolaning plashchi ho'l — u yomg'ir boshlangan 22:10 dan keyin tashqarida bo'lgan." },
      { id: "metro", ico: "🎫", name: "Metro kartasi", clue: "Lolaning kartasi bo'yicha u 22:05 da muzey yonidagi bekatdan chiqqan." },
      { id: "xat", ico: "✉️", name: "Bank xati", clue: "Lolaning stolida: kredit bo'yicha oxirgi ogohlantirish — 40 000 $ qarz." },
      { id: "foto", ico: "📸", name: "To'y suratlari", clue: "Direktor Anvarning telefonidagi suratlar: 22:30 da shahar chetidagi to'yda." },
    ],
    suspects: [
      { id: "rustam", face: "💂", name: "Rustam", role: "Qorovul", qs: [
        { q: "Kecha nima ish qildingiz?", a: "Butun smena kirish eshigida o'tirdim. Kameralar ham ko'rsatadi." },
        { q: "Orqa eshik kamerasi nega o'chgan?", a: "Bilmayman. Uni faqat xodimlar paneli PIN-kodi bilan o'chirish mumkin — menda PIN yo'q.", clue: "Kamerani o'chirish uchun xodim PIN-kodi kerak (Rustamda yo'q)." },
        { q: "Kimnidir ko'rdingizmi?", a: "22:20 larda orqa tomonda mashina ovozi eshitildi, lekin postni tashlab ketolmasdim." },
      ] },
      { id: "lola", face: "👩‍🎨", name: "Lola", role: "Restavrator", qs: [
        { q: "Muzeydan qachon chiqdingiz?", a: "Soat 21:00 da chiqib, uyga ketdim. Butun kech uyda edim." },
        { q: "Moliyaviy ahvolingiz qanday?", a: "Yaxshi. Nega so'rayapsiz?" },
        { q: "Metro kartangiz 22:05 da muzey yonida ishlatilgan. Izoh bering.", need: "metro", a: "U... ehtimol kartamni kimdir olgandir. Men… eslay olmayman.", clue: "Lola metro kartasi haqida aniq javob bera olmadi — alibisi buzildi." },
        { q: "Bu bank xati nima?", need: "xat", a: "Bu shaxsiy masala! Qarzni yaqinda to'layman…", clue: "Lola qarzini 'yaqinda to'lashini' aytdi — pul manbasini tushuntirmadi." },
      ] },
      { id: "anvar", face: "👔", name: "Anvar", role: "Direktor", qs: [
        { q: "Kecha qayerda edingiz?", a: "Jiyanimning to'yida. Suratlar telefonimda." },
        { q: "Vitrina kalitlari kimlarda?", a: "Menda va Lolada. Mening kalitim doim seyfda — u yerda hozir ham turibdi.", clue: "Anvarning kaliti seyfda joyida." },
        { q: "Xodimlardan kimning pulga ehtiyoji bor?", a: "Lola yaqinda maoshdan oldindan pul so'ragandi. Rad etdim." },
      ] },
    ],
    solution: { culprit: "lola", motive: "qarz", key: ["metro", "plashch"] },
    motives: [{ id: "qarz", t: "Katta qarzni to'lash" }, { id: "qasos", t: "Direktordan qasos olish" }, { id: "kolleksiya", t: "Shaxsiy kolleksiya uchun" }, { id: "sugurta", t: "Sug'urta firibgarligi" }],
  },
  {
    id: "choy", title: "Choyxonadagi zahar", diff: 2, reward: 50, ico: "☕",
    intro: "Tadbirkor Davron Karimov Toshkentdagi choyxonada choy ichgandan so'ng zaharlandi. Ekspertiza: piyolada yurak dorisi — digitalis topilgan. Hayoti xavf ostidan chiqdi, lekin kim aybdor?",
    evidence: [
      { id: "choynak", ico: "☕", name: "Choynak", clue: "Choynakda zahar yo'q — zahar faqat piyolaga solingan." },
      { id: "cctv", ico: "📹", name: "Choyxona kamerasi", clue: "Ofitsiant Ilhom patnisni peshtaxtada 2 daqiqa qoldirib, telefonda gaplashgan. Shu payt Bobur peshtaxta yonidan o'tgan." },
      { id: "flakon", ico: "💊", name: "Bo'sh flakon", clue: "Boburning cho'ntagidan buvisiga yozilgan digitalis dorisining bo'sh flakoni topildi." },
      { id: "vasiyat", ico: "📜", name: "Advokat xati", clue: "Davron kelasi hafta vasiyatnomani o'zgartirmoqchi bo'lgan. Hozircha asosiy merosxo'r — jiyani Bobur." },
      { id: "shartnoma", ico: "📑", name: "Shartnoma nizolari", clue: "Sherzod va Davron o'rtasida 200 mln so'mlik nizo bor edi." },
      { id: "guvoh", ico: "🧑‍🦳", name: "Qo'shni stoldagi guvoh", clue: "Guvoh: 'Davron piyolani patnisdan olib, darhol ichdi. Sherzod piyolaga tegmadi.'" },
    ],
    suspects: [
      { id: "sherzod", face: "🧔", name: "Sherzod", role: "Hamkor", qs: [
        { q: "Davron bilan munosabatingiz qanday edi?", a: "Ochig'ini aytsam, nizolarimiz bor edi. Lekin men uni o'ldirmoqchi emasdim." },
        { q: "Piyolaga yaqinlashdingizmi?", a: "Yo'q. Ofitsiant piyolani olib keldi, Davron darhol ichdi. Qo'shni stoldagilar ko'rgan." },
        { q: "Sizda digitalis bormi?", a: "Mening yuragim sog'lom, hech qanday dori ichmayman." },
      ] },
      { id: "ilhom", face: "🤵", name: "Ilhom", role: "Ofitsiant", qs: [
        { q: "Choyni qanday tayyorladingiz?", a: "Choynakdan piyolaga quyib, patnisga qo'ydim va olib bordim." },
        { q: "Patnisni qarovsiz qoldirdingizmi?", need: "cctv", a: "Ha… ikki daqiqa xo'jayinim qo'ng'iroq qildi. Kechirasiz.", clue: "Ilhom patnisni qarovsiz qoldirganini tan oldi." },
        { q: "Peshtaxta yonida kimni ko'rdingiz?", a: "Yosh yigit — Davron akaning jiyani — hojatxona tomonga o'tdi." },
      ] },
      { id: "bobur", face: "🧑", name: "Bobur", role: "Jiyan", qs: [
        { q: "Choyxonada nima qilardingiz?", a: "Amakim bilan uchrashmoqchi edim, lekin u band edi." },
        { q: "Peshtaxta yoniga bordingizmi?", a: "Yo'q, umuman bormaganman!" },
        { q: "Kamera sizni peshtaxta yonida ko'rsatyapti.", need: "cctv", a: "Ha, hojatxonaga o'tgandim… bu jinoyatmi?", clue: "Bobur peshtaxta yoniga bormaganini aytib yolg'on gapirdi." },
        { q: "Cho'ntagingizdagi flakon nima?", need: "flakon", a: "Buvimning dorisi… dorixonaga olib ketayotgandim.", clue: "Bobur bo'sh flakonni 'dorixonaga olib ketayotganini' aytdi — bo'sh flakon nega kerak?" },
      ] },
    ],
    solution: { culprit: "bobur", motive: "meros", key: ["cctv", "flakon"] },
    motives: [{ id: "meros", t: "Vasiyat o'zgarmasidan oldin merosni olish" }, { id: "biznes", t: "Biznes nizosi" }, { id: "rashk", t: "Rashk" }, { id: "tasodif", t: "Tasodifiy xato" }],
  },
  {
    id: "qolyozma", title: "Yopiq xonadagi sir", diff: 3, reward: 80, ico: "📚",
    intro: "Mashhur yozuvchi Nigora Saidova o'z kabinetida hushsiz holda topildi. Eshik ichkaridan qulflangan, kalit stolda, deraza berk. Tugallangan yangi romanning yagona qo'lyozmasi yo'qolgan. Nigora uyquga ketishdan oldin soat 15:00 da choy ichgan.",
    evidence: [
      { id: "kalit", ico: "🗝️", name: "Kalit", clue: "Kalit halqasida mayda tirnalishlar va qizil ipak tolalari bor — kalit tashqaridan ip bilan burab, ichkariga tortilgan." },
      { id: "piyola", ico: "🍵", name: "Choy piyolasi", clue: "Choyda kuchli uyqu dori bor." },
      { id: "galstuk", ico: "👔", name: "Kotibning galstugi", clue: "Kotib Kamronning qizil ipak galstugida tortilgan ip izi bor." },
      { id: "email", ico: "📧", name: "Nashriyot xati", clue: "Kecha nashriyotga taxallus ostida roman taklif qilingan. E'lon qilingan telefon raqami Kamronga tegishli." },
      { id: "shartnoma", ico: "📄", name: "Mehnat shartnomasi", clue: "Kamronning maoshi 2 yildan beri oshmagan; u Nigoraga norozilik xati yozgan." },
      { id: "chek", ico: "🧾", name: "Bozor cheki", clue: "Uy bekasi Saidaning cheki: 15:20 da bozorda xarid qilgan." },
    ],
    suspects: [
      { id: "kamron", face: "🧑‍💼", name: "Kamron", role: "Kotib", qs: [
        { q: "Soat 15:00 da qayerda edingiz?", a: "Pastda, hujjatlar bilan ishlayotgandim. Yuqoriga chiqmadim." },
        { q: "Farhod sizni zinada patnis bilan ko'rganini aytdi.", need: "piyola", a: "Ha… Saida opa choyni berib yubordi, men shunchaki olib chiqdim.", clue: "Kamron avval yuqoriga chiqmaganini aytgan, keyin choyni o'zi olib chiqqanini tan oldi." },
        { q: "Galstugingizdagi ip izi qayerdan?", need: "galstuk", a: "Eshik tutqichiga ilinib qolgandir… Bilmayman.", clue: "Kamron galstuk izini tushuntira olmadi." },
        { q: "Nashriyotga qo'lyozma yubordingizmi?", need: "email", a: "…Advokatim bilan gaplashmagunimcha javob bermayman.", clue: "Kamron nashriyot haqidagi savolga javob berishdan bosh tortdi." },
      ] },
      { id: "farhod", face: "🧑‍🏫", name: "Farhod", role: "Raqib yozuvchi", qs: [
        { q: "Nigorani yoqtirmasligingiz rostmi?", a: "Raqobat bor, yashirmayman. Lekin men o'z asarlarimni yozaman." },
        { q: "15:00 dan 16:00 gacha qayerda edingiz?", a: "Bog'da, noshirim bilan telefonda janjallashdim. Bog'bon ko'rgan.", clue: "Farhodni 14:30–16:00 da bog'da bog'bon ko'rgan." },
        { q: "Uyda kimni ko'rdingiz?", a: "Soat uchlarda kotib zinadan choy patnisi bilan chiqayotgan edi." },
      ] },
      { id: "saida", face: "👵", name: "Saida", role: "Uy bekasi", qs: [
        { q: "Choyni kim tayyorladi?", a: "Men damladim va patnisni Kamronga berdim, keyin bozorga ketdim." },
        { q: "Sizni ishdan bo'shatishgani rostmi?", a: "Ha, o'tgan hafta. Xafa edim, lekin Nigora opaga yomonlik qilmayman." },
        { q: "Choyga biror narsa qo'shdingizmi?", a: "Faqat shakar. Shakardon hamon oshxonada — tekshiring.", clue: "Oshxonadagi shakardon toza (uyqu dori faqat piyolada)." },
      ] },
    ],
    solution: { culprit: "kamron", motive: "pul", key: ["kalit", "galstuk", "email"] },
    motives: [{ id: "pul", t: "Qo'lyozmani sotib pul topish" }, { id: "raqobat", t: "Adabiy raqobat" }, { id: "ishdan", t: "Ishdan bo'shatilgani uchun qasos" }, { id: "sevgi", t: "Shaxsiy munosabatlar" }],
  },
];

let st = null; // joriy ish holati

export async function renderDetective(app, caseId) {
  const p = await db.getProfile();
  const solved = await db.solvedCases();
  const c = CASES.find((x) => x.id === caseId);
  if (!c) {
    app.innerHTML = `<div><div class="row" style="justify-content:space-between"><h1 class="grad-text" style="margin:0">🕵️ Detektiv byurosi</h1><span class="tag tokens">🪙 ${p.tokens} token</span></div>
      <p class="muted">Dalillarni o'rganing, gumonlanuvchilarni so'roq qiling, qarama-qarshiliklarni toping va yakuniy xulosangizni bering. To'g'ri yechim — token.</p>
      <div class="grid g3 mt">${CASES.map((x, i) => { const s = solved.find((y) => y.case_id === x.id); return `<button class="card case-card reveal" data-case="${x.id}" style="text-align:left;transition-delay:${i * 80}ms"><div style="font-size:40px">${x.ico}</div><h3 class="mt">${x.title}</h3><div class="diff">${"★".repeat(x.diff)}${"☆".repeat(3 - x.diff)}</div><p class="muted small">${x.intro.slice(0, 110)}…</p><div class="row"><span class="tag tokens">🪙 ${x.reward}</span>${s ? `<span class="tag" style="color:var(--ok)">✓ Yechilgan: ${s.score}%</span>` : ""}</div></button>`; }).join("")}</div></div>`;
    app.querySelectorAll("[data-case]").forEach((b) => (b.onclick = () => { app.innerHTML = ""; renderDetective(app, b.dataset.case); app.firstElementChild?.classList.add("view"); }));
    requestAnimationFrame(() => app.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
    return;
  }
  st = { c, seen: new Set(), asked: new Set(), clues: [], tab: "brief", actions: 0, chats: {}, done: solved.some((y) => y.case_id === c.id) };
  draw(app);
}

function addClue(t) { if (!st.clues.includes(t)) { st.clues.push(t); toast("🔎 Bloknotga yangi iz qo'shildi"); } }

function draw(app) {
  const { c } = st;
  const tabs = [["brief", "📋 Ish"], ["evidence", "🔍 Dalillar"], ["suspects", "🗣 So'roq"], ["solve", "⚖️ Xulosa"]];
  let body = "";
  if (st.tab === "brief") body = `<p style="font-size:17px">${c.intro}</p><p class="muted">Maslahat: avval dalillarni o'rganing — ba'zi so'roq savollari faqat tegishli dalil topilgandan keyin ochiladi. Kam harakat bilan yechsangiz, bonus token olasiz.</p><button class="btn" data-tab="evidence">Tergovni boshlash →</button>`;
  if (st.tab === "evidence") body = `<div class="grid g2">${c.evidence.map((e) => `<div class="ev ${st.seen.has(e.id) ? "seen" : ""}" data-ev="${e.id}"><div class="e-ico">${e.ico}</div><div><b>${e.name}</b>${st.seen.has(e.id) ? `<div class="reveal-txt">${e.clue}</div>` : `<div class="small muted">Tekshirish uchun bosing</div>`}</div></div>`).join("")}</div>`;
  if (st.tab === "suspects") body = `<div class="grid">${c.suspects.map((s) => `<div class="card"><div class="suspect"><div class="face">${s.face}</div><div><b>${s.name}</b><div class="muted small">${s.role}</div></div></div>
    <div class="chat">${(st.chats[s.id] || []).map((m) => `<div class="bubble ${m.me ? "me" : "them"}">${esc(m.t)}</div>`).join("")}</div>
    <div class="q-btns">${s.qs.map((q, i) => { const k = s.id + i; if (st.asked.has(k)) return ""; if (q.need && !st.seen.has(q.need)) return ""; return `<button class="btn ghost sm" data-ask="${s.id}|${i}">${q.need ? "⚡ " : ""}${esc(q.q)}</button>`; }).join("")}</div></div>`).join("")}</div>`;
  if (st.tab === "solve") body = st.done && st.result ? st.result : `<form id="solve" class="stack">
    <h3>Aybdor kim?</h3><div class="sel-list">${c.suspects.map((s) => `<label><input type="radio" name="culprit" value="${s.id}" required> ${s.face} ${s.name} — ${s.role}</label>`).join("")}</div>
    <h3>Motiv</h3><div class="sel-list">${c.motives.map((m) => `<label><input type="radio" name="motive" value="${m.id}" required> ${m.t}</label>`).join("")}</div>
    <h3>Hal qiluvchi dalil</h3><div class="sel-list">${c.evidence.filter((e) => st.seen.has(e.id)).map((e) => `<label><input type="radio" name="key" value="${e.id}" required> ${e.ico} ${e.name}</label>`).join("") || `<p class="muted">Avval dalillarni o'rganing.</p>`}</div>
    <button class="btn gold lg" type="submit">Xulosani topshirish</button>${st.done ? `<p class="muted small">Bu ish avval yechilgan — qayta yechish token bermaydi.</p>` : ""}</form>`;
  app.innerHTML = `<div class="view"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">${c.ico} ${c.title}</h2><div class="row"><span class="tag">Harakatlar: ${st.actions}</span><button class="btn ghost sm" id="dback">← Ishlar</button></div></div>
    <div class="det-layout"><section class="card"><div class="det-tabs">${tabs.map(([k, t]) => `<button class="${st.tab === k ? "on" : ""}" data-tab="${k}">${t}</button>`).join("")}</div>${body}</section>
    <aside class="card notebook"><h3 style="font-size:16px">📒 Detektiv bloknoti</h3>${st.clues.length ? `<ul>${st.clues.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted small">Izlar shu yerda to'planadi.</p>`}</aside></div></div>`;

  app.querySelector("#dback").onclick = () => { app.innerHTML = ""; renderDetective(app); };
  app.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { st.tab = b.dataset.tab; draw(app); }));
  app.querySelectorAll("[data-ev]").forEach((b) => (b.onclick = () => {
    const e = c.evidence.find((x) => x.id === b.dataset.ev);
    if (!st.seen.has(e.id)) { st.seen.add(e.id); st.actions++; addClue(e.clue); draw(app); }
  }));
  app.querySelectorAll("[data-ask]").forEach((b) => (b.onclick = () => {
    const [sid, i] = b.dataset.ask.split("|"); const s = c.suspects.find((x) => x.id === sid); const q = s.qs[+i];
    st.asked.add(sid + i); st.actions++;
    (st.chats[sid] ||= []).push({ me: true, t: q.q }, { me: false, t: q.a });
    if (q.clue) addClue(q.clue);
    draw(app);
  }));
  const f = app.querySelector("#solve");
  if (f) f.onsubmit = async (ev) => {
    ev.preventDefault();
    const d = new FormData(f); const sol = c.solution;
    const okC = d.get("culprit") === sol.culprit, okM = d.get("motive") === sol.motive, okK = sol.key.includes(d.get("key"));
    const score = (okC ? 50 : 0) + (okM ? 25 : 0) + (okK ? 25 : 0);
    const minActions = 6 + c.diff * 2;
    const bonus = okC && st.actions <= minActions + 4 ? Math.round(c.reward * 0.25) : 0;
    const tokens = okC ? Math.round((c.reward * score) / 100) + bonus : 0;
    let earned = 0;
    if (!st.done && tokens) { try { await db.addTokens(tokens); earned = tokens; } catch (e) { toast("Token saqlanmadi: " + e.message); } }
    if (!st.done) { try { await db.saveCase(c.id, score); } catch {} }
    st.done = true;
    const culprit = c.suspects.find((s) => s.id === sol.culprit);
    st.result = `<div class="center stack"><div style="font-size:60px">${okC ? "🏆" : "🕳️"}</div><h2>${okC ? "Ish yechildi!" : "Afsus, aybdor boshqa odam edi"}</h2>
      <div class="row" style="justify-content:center"><span class="tag">Aybdor ${okC ? "✓" : "✗"}</span><span class="tag">Motiv ${okM ? "✓" : "✗"}</span><span class="tag">Dalil ${okK ? "✓" : "✗"}</span></div>
      <p style="font-family:var(--head);font-size:28px">${score}%</p>
      ${earned ? `<p class="tokens" style="font-size:20px">+${earned} 🪙 token${bonus ? ` (shu jumladan ${bonus} tezkorlik bonusi)` : ""}</p>` : ""}
      <p class="muted" style="max-width:560px;margin:0 auto">Yechim: <b style="color:#fff">${culprit.name}</b> — ${c.motives.find((m) => m.id === sol.motive).t.toLowerCase()}. Hal qiluvchi dalillar: ${sol.key.map((k) => c.evidence.find((e) => e.id === k).name).join(", ")}.</p>
      <button class="btn" id="dback2">Boshqa ishlar</button></div>`;
    if (okC) confetti();
    draw(app);
    app.querySelector("#dback2").onclick = () => { app.innerHTML = ""; renderDetective(app); };
  };
}

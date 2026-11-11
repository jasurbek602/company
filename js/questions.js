// Savollar generatori: har bir foydalanuvchi uchun tasodifiy, protsedurali savollar.
// Kategoriyalar: matrix (naqsh), numeric (sonlar), verbal (so'z/mantiq), spatial (fazoviy).

export const CATEGORIES = {
  matrix: { name: "Naqsh va matritsa", icon: "🔷" },
  numeric: { name: "Sonli ketma-ketlik", icon: "🔢" },
  verbal: { name: "Mantiq va so'z", icon: "🧩" },
  spatial: { name: "Fazoviy tafakkur", icon: "🧊" },
};

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

function numericOptions(answer, spread = 6) {
  const set = new Set([answer]);
  const cands = [answer + 1, answer - 1, answer + 2, answer - 2, answer * 2, Math.round(answer * 1.5), answer + spread, answer - spread, answer + 10, answer - 10];
  for (const c of shuffle(cands)) { if (set.size >= 5) break; if (c !== answer && c >= -999) set.add(c); }
  while (set.size < 5) set.add(answer + rnd(-20, 20) || answer + 3);
  return shuffle([...set]).map(String);
}

/* ======================= NUMERIC ======================= */
const numericGens = [
  // 1-daraja
  { d: 1, f: () => { const a = rnd(2, 20), s = rnd(2, 9); return [0, 1, 2, 3, 4, 5].map((i) => a + s * i); } },
  { d: 1, f: () => { const a = rnd(60, 120), s = rnd(3, 9); return [0, 1, 2, 3, 4, 5].map((i) => a - s * i); } },
  { d: 2, f: () => { const a = rnd(1, 4), r = rnd(2, 3); return [0, 1, 2, 3, 4, 5].map((i) => a * r ** i); } },
  { d: 2, f: () => { const a = rnd(1, 5), s = rnd(1, 3); const out = [a]; for (let i = 1; i < 6; i++) out.push(out[i - 1] + s * i); return out; } },
  { d: 2, f: () => { const o = rnd(0, 3); return [1, 2, 3, 4, 5, 6].map((n) => (n + o) ** 2); } },
  { d: 3, f: () => { const a = rnd(1, 4), b = rnd(2, 6); const o = [a, b]; for (let i = 2; i < 7; i++) o.push(o[i - 1] + o[i - 2]); return o; } },
  { d: 3, f: () => { const a = rnd(2, 6), m = rnd(2, 3), p = rnd(1, 3); const o = [a]; for (let i = 1; i < 6; i++) o.push(o[i - 1] * m - p); return o; } },
  { d: 3, f: () => { const a = rnd(5, 20), x = rnd(2, 5), y = rnd(5, 11); const o = [a]; for (let i = 1; i < 7; i++) o.push(i % 2 ? o[i - 1] + y : o[i - 1] - x); return o; } },
  { d: 4, f: () => { const o = rnd(0, 2); return [1, 2, 3, 4, 5, 6].map((n) => (n + o) ** 3 - (n + o)); } },
  { d: 4, f: () => { const pr = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]; const s = rnd(0, 5); const k = rnd(1, 2); return pr.slice(s, s + 6).map((p) => p * k); } },
  { d: 4, f: () => { const a = rnd(1, 3); const o = [a]; for (let i = 1; i < 6; i++) o.push(o[i - 1] * (i + 1)); return o; } },
  { d: 5, f: () => { const a = rnd(1, 3), b = rnd(1, 3), c = rnd(2, 4); const o = [a, b, c]; for (let i = 3; i < 7; i++) o.push(o[i - 1] + o[i - 2] + o[i - 3]); return o; } },
  { d: 5, f: () => { const a = rnd(2, 5); const o = [a]; for (let i = 1; i < 6; i++) o.push(o[i - 1] * 2 + (i % 2 ? 1 : -1) * i); return o; } },
  { d: 5, f: () => { const k = rnd(1, 3); return [1, 2, 3, 4, 5, 6].map((n) => n * n + k * n + (n % 2 ? 1 : 0)); } },
];

function genNumeric(level) {
  const pool = numericGens.filter((g) => Math.abs(g.d - level) <= 1);
  const g = pick(pool);
  const seq = g.f();
  const answer = seq[seq.length - 1];
  const shown = seq.slice(0, -1);
  return {
    cat: "numeric", diff: g.d,
    text: "Ketma-ketlikni davom ettiring. Keyingi son qaysi?",
    seq: [...shown.map(String), "?"],
    options: numericOptions(answer, Math.max(3, Math.abs(seq[seq.length - 1] - seq[seq.length - 2]))),
    answer: String(answer),
  };
}

/* letter sequences (numeric category, alphabetic reasoning) */
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function genLetters(level) {
  const step = rnd(1, level >= 3 ? 4 : 2), inc = level >= 4 ? 1 : 0;
  let i = rnd(0, 4); const out = []; let s = step;
  for (let k = 0; k < 6; k++) { out.push(ALPHA[i % 26]); i += s; s += inc; }
  const answer = out.pop();
  const ai = ALPHA.indexOf(answer);
  const opts = new Set([answer]);
  for (const d of shuffle([1, -1, 2, -2, 3])) { if (opts.size >= 5) break; opts.add(ALPHA[(ai + d + 26) % 26]); }
  return { cat: "numeric", diff: Math.min(5, level), text: "Harflar ketma-ketligini davom ettiring:", seq: [...out, "?"], options: shuffle([...opts]), answer };
}

/* ======================= MATRIX (Raven uslubi) ======================= */
const SHAPES = ["circle", "square", "triangle", "diamond", "hex", "star"];
const COLORS = ["#7c5cff", "#00d4ff", "#ff4fd8", "#ffc94d", "#2ee59d"];

function shapeSVG(shape, cx, cy, r, fill, rot = 0, color = "#00d4ff") {
  const f = fill === "solid" ? color : fill === "half" ? "url(#hatch)" : "none";
  const st = `stroke="${color}" stroke-width="2.4" fill="${f}" transform="rotate(${rot} ${cx} ${cy})"`;
  const poly = (n, rr = r, off = -90) => Array.from({ length: n }, (_, i) => { const a = ((off + (360 / n) * i) * Math.PI) / 180; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(" ");
  switch (shape) {
    case "circle": return `<circle cx="${cx}" cy="${cy}" r="${r}" ${st}/>`;
    case "square": return `<rect x="${cx - r * 0.85}" y="${cy - r * 0.85}" width="${r * 1.7}" height="${r * 1.7}" rx="3" ${st}/>`;
    case "triangle": return `<polygon points="${poly(3, r * 1.1)}" ${st}/>`;
    case "diamond": return `<polygon points="${poly(4, r * 1.1)}" ${st}/>`;
    case "hex": return `<polygon points="${poly(6)}" ${st}/>`;
    case "star": { const pts = Array.from({ length: 10 }, (_, i) => { const rr = i % 2 ? r * 0.45 : r * 1.1; const a = ((-90 + 36 * i) * Math.PI) / 180; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(" "); return `<polygon points="${pts}" ${st}/>`; }
  }
  return "";
}

function cellSVG(c, size = 90) {
  // c: {shape, count, fill, rot, color}
  const r = c.count === 1 ? 22 : c.count === 2 ? 15 : 12;
  const layouts = { 1: [[0.5, 0.5]], 2: [[0.3, 0.5], [0.7, 0.5]], 3: [[0.5, 0.27], [0.27, 0.72], [0.73, 0.72]], 4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]] };
  return layouts[c.count].map(([x, y]) => shapeSVG(c.shape, x * size, y * size, r, c.fill, c.rot, c.color)).join("");
}

const DEFS = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="6" fill="#00d4ff" opacity=".8"/></pattern></defs>`;
export const singleCell = (c) => `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${DEFS}${cellSVG(c)}</svg>`;

function genMatrix(level) {
  // Har bir atribut uchun qoida: const | row(qator bo'yicha o'zgaradi) | col | progression
  const fills = ["none", "half", "solid"];
  const counts = shuffle([1, 2, 3, 4]).slice(0, 3);
  const rots = [0, 30, 60];
  const color = pick(COLORS);
  const nRules = level <= 2 ? 1 : level <= 3 ? 2 : 3;
  const attrs = shuffle(["shape", "count", "fill", "rot"]).slice(0, nRules + (level >= 5 ? 1 : 0));
  // aylanish qoidasi bo'lsa, faqat aylanishi ko'rinadigan shakllar (noaniqlikni oldini olish)
  const rotOn = attrs.includes("rot");
  const shapePool = rotOn ? ["triangle", "star", "square"] : SHAPES;
  const baseShapes = shuffle(shapePool).slice(0, 3);
  const constShape = pick(shapePool), constCount = rnd(1, 3), constFill = pick(fills);
  const rotStep = 30;
  const mode = {}; // latin = har qator/ustunda bir marta (Latin kvadrat), col = ustun bo'yicha
  attrs.forEach((a) => (mode[a] = level >= 3 && Math.random() < 0.6 ? "latin" : pick(["row", "col"])));
  const cell = (r, c) => {
    const idx = (a) => (mode[a] === "latin" ? (r + c) % 3 : mode[a] === "row" ? c : r);
    return {
      shape: attrs.includes("shape") ? baseShapes[idx("shape")] : constShape,
      count: attrs.includes("count") ? counts[idx("count")] : constCount,
      fill: attrs.includes("fill") ? fills[idx("fill")] : constFill,
      rot: attrs.includes("rot") ? idx("rot") * rotStep : 0,
      color,
    };
  };
  const grid = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grid.push(cell(r, c));
  const ans = grid[8];
  const key = (c) => `${c.shape}|${c.count}|${c.fill}|${c.rot}`;
  const opts = [ans]; const seen = new Set([key(ans)]);
  let guard = 0;
  while (opts.length < 6 && guard++ < 200) {
    const d = { ...ans };
    const which = pick(["shape", "count", "fill", ...attrs]);
    if (which === "shape") d.shape = pick(shapePool);
    if (which === "count") d.count = rnd(1, 4);
    if (which === "fill") d.fill = pick(fills);
    if (which === "rot") d.rot = pick(rots);
    if (!seen.has(key(d))) { seen.add(key(d)); opts.push(d); }
  }
  const S = 92, pad = 6;
  const cells = grid.map((g, i) => {
    const x = (i % 3) * (S + pad), y = Math.floor(i / 3) * (S + pad);
    const inner = i === 8 ? `<text x="${S / 2}" y="${S / 2 + 12}" text-anchor="middle" font-size="34" fill="#b9a8ff" font-family="Unbounded,Arial">?</text>` : cellSVG(g, S);
    return `<g transform="translate(${x},${y})"><rect width="${S}" height="${S}" rx="12" fill="rgba(255,255,255,.05)" stroke="${i === 8 ? "#7c5cff" : "rgba(255,255,255,.14)"}" stroke-dasharray="${i === 8 ? "6 5" : ""}"/>${inner}</g>`;
  }).join("");
  const W = 3 * S + 2 * pad;
  const shuffled = shuffle(opts);
  return {
    cat: "matrix", diff: Math.min(5, level),
    text: "Matritsadagi qonuniyatni toping. Bo'sh katakka qaysi shakl mos keladi?",
    svg: `<svg viewBox="0 0 ${W} ${W}" width="${W}" xmlns="http://www.w3.org/2000/svg">${DEFS}${cells}</svg>`,
    options: shuffled.map((o) => key(o)),
    optionSVG: shuffled.map((o) => singleCell(o)),
    answer: key(ans),
    visual: true,
  };
}

/* ======================= SPATIAL ======================= */
function polyomino(n) {
  const cells = [[0, 0]]; const has = (x, y) => cells.some((c) => c[0] === x && c[1] === y);
  while (cells.length < n) { const [x, y] = pick(cells); const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); if (!has(x + dx, y + dy)) cells.push([x + dx, y + dy]); }
  return cells;
}
const norm = (cells) => { const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
const rot90 = (cells) => norm(cells.map(([x, y]) => [-y, x]));
const mirror = (cells) => norm(cells.map(([x, y]) => [-x, y]));
const sig = (cells) => norm(cells).map((c) => c.join(",")).join(";");
const allRots = (cells) => { const r = [norm(cells)]; for (let i = 0; i < 3; i++) r.push(rot90(r[r.length - 1])); return r; };

function polySVG(cells, color = "#00d4ff", marker = true) {
  const s = 18; const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
  const V = Math.max(w, h) * s + 8; const ox = (V - w * s) / 2, oy = (V - h * s) / 2;
  const rects = cells.map(([x, y], i) => `<rect x="${ox + x * s}" y="${oy + y * s}" width="${s - 2}" height="${s - 2}" rx="3" fill="${i === 0 && marker ? "#ff4fd8" : color}" opacity="${i === 0 && marker ? 1 : 0.85}"/>`).join("");
  return `<svg viewBox="0 0 ${V} ${V}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function genSpatial(level) {
  const n = level <= 2 ? 5 : level <= 4 ? 6 : 7;
  let base, guard = 0;
  do { base = polyomino(n); guard++; } while ((allRots(base).some((r) => sig(r) === sig(mirror(base))) || allRots(base).map(sig).filter((v, i, a) => a.indexOf(v) === i).length < 4) && guard < 300);
  // marker hujayrasini saqlash uchun hujayralarni tartibsiz emas, ko'chirma bilan aylantiramiz
  const tr = (cells, f) => { const m = cells.map(f); const mx = Math.min(...m.map((c) => c[0])), my = Math.min(...m.map((c) => c[1])); return m.map(([x, y]) => [x - mx, y - my]); };
  const R = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x]];
  const M = ([x, y]) => [-x, y];
  const k = rnd(1, 3);
  const correct = tr(base, R[k]);
  const wrong = shuffle([0, 1, 2, 3]).slice(0, 3).map((j) => tr(base, (p) => R[j](M(p))));
  const shown = tr(base, (p) => p); // manfiy koordinatalarni siljitish (marker tartibi saqlanadi)
  const items = shuffle([{ c: correct, ok: true }, ...wrong.map((c) => ({ c, ok: false }))]);
  return {
    cat: "spatial", diff: Math.min(5, level + (n >= 6 ? 1 : 0)),
    text: "Qaysi shakl yuqoridagi shaklning faqat AYLANTIRILGAN ko'rinishi (oynadagi aksi emas)?",
    svg: `<div style="width:130px">${polySVG(shown)}</div>`,
    options: items.map((_, i) => "s" + i),
    optionSVG: items.map((it) => polySVG(it.c)),
    answer: "s" + items.findIndex((it) => it.ok),
    visual: true,
  };
}

function genCube(level) {
  // kub yoyilmasi: qarama-qarshi tomonlar
  const nets = [
    { layout: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], opp: [[0, 5], [1, 3], [2, 4]] },
    { layout: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], opp: [[0, 5], [1, 3], [2, 4]] },
    { layout: [[1, 0], [1, 1], [0, 1], [2, 1], [2, 2], [3, 2]], opp: [[0, 4], [1, 5], [2, 3]] },
  ];
  // opp: qarama-qarshi tomonlar (layout indekslari), qo'lda tekshirilgan
  const net = pick(nets);
  const sym = shuffle(["★", "●", "▲", "■", "♦", "✚"]);
  const [a, b] = pick(net.opp);
  const s = 34;
  const rects = net.layout.map(([x, y], i) => `<g><rect x="${x * s + 4}" y="${y * s + 4}" width="${s - 2}" height="${s - 2}" rx="4" fill="rgba(124,92,255,.18)" stroke="#7c5cff"/><text x="${x * s + 4 + s / 2 - 1}" y="${y * s + 4 + s / 2 + 6}" text-anchor="middle" font-size="17" fill="#fff">${sym[i]}</text></g>`).join("");
  const W = 4 * s + 8, H = 3 * s + 8;
  const asked = Math.random() < 0.5 ? a : b, ans = asked === a ? b : a;
  const others = sym.filter((_, i) => i !== asked && i !== ans);
  return {
    cat: "spatial", diff: Math.max(3, level),
    text: `Yoyilma kubga yig'ilganda "${sym[asked]}" belgisining QARAMA-QARSHI tomonida qaysi belgi bo'ladi?`,
    svg: `<svg viewBox="0 0 ${W} ${H}" width="${W * 1.5}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`,
    options: shuffle([sym[ans], ...shuffle(others).slice(0, 3)]),
    answer: sym[ans],
  };
}

/* ======================= VERBAL / LOGIC ======================= */
const VERBAL = [
  { d: 1, t: "Qush : Uya = Asalari : ?", o: ["Uya (in)", "Gul", "Asal", "Qanot"], a: "Uya (in)" },
  { d: 1, t: "Qaysi so'z ortiqcha?", o: ["Olma", "Nok", "Sabzi", "O'rik"], a: "Sabzi" },
  { d: 1, t: "Issiq : Sovuq = Baland : ?", o: ["Past", "Uzun", "Katta", "Keng"], a: "Past" },
  { d: 1, t: "Qaysi so'z ortiqcha?", o: ["Dushanba", "Seshanba", "Yanvar", "Juma"], a: "Yanvar" },
  { d: 2, t: "Kitob : O'qish = Pichoq : ?", o: ["Kesish", "Oshxona", "O'tkir", "Temir"], a: "Kesish" },
  { d: 2, t: "Shifokor : Kasalxona = O'qituvchi : ?", o: ["Maktab", "Kitob", "O'quvchi", "Dars"], a: "Maktab" },
  { d: 2, t: "Barcha mushuklar hayvon. Ba'zi hayvonlar qora. Demak:", o: ["Ba'zi mushuklar albatta qora", "Hech bir mushuk qora emas", "Aniq xulosa chiqarib bo'lmaydi", "Barcha hayvonlar mushuk"], a: "Aniq xulosa chiqarib bo'lmaydi" },
  { d: 2, t: "Qaysi so'z ortiqcha?", o: ["Skripka", "Gitara", "Baraban", "Dutor"], a: "Baraban" },
  { d: 2, t: "Ko'z : Ko'rish = Quloq : ?", o: ["Eshitish", "Bosh", "Ovoz", "Musiqa"], a: "Eshitish" },
  { d: 3, t: "Barcha A lar B. Hech bir B C emas. Demak:", o: ["Hech bir A C emas", "Ba'zi A lar C", "Barcha C lar A", "Barcha B lar A"], a: "Hech bir A C emas" },
  { d: 3, t: "Agar bugun seshanba bo'lsa, 100 kundan keyin qaysi kun?", o: ["Payshanba", "Chorshanba", "Juma", "Shanba"], a: "Payshanba" },
  { d: 3, t: "Soat 3:15 da soat va minut millari orasidagi burchak necha gradus?", o: ["7.5°", "0°", "15°", "22.5°"], a: "7.5°" },
  { d: 3, t: "Daraxt : O'rmon = Yulduz : ?", o: ["Galaktika", "Osmon", "Quyosh", "Tun"], a: "Galaktika" },
  { d: 3, t: "Qaysi biri qolganlariga o'xshamaydi?", o: ["Kvadrat", "Uchburchak", "Doira", "Kub"], a: "Kub" },
  { d: 3, t: "5 ta mashina 5 daqiqada 5 ta detal yasaydi. 100 ta mashina 100 ta detalni necha daqiqada yasaydi?", o: ["5", "100", "20", "1"], a: "5" },
  { d: 4, t: "Ko'l yuzasidagi nilufarlar har kuni ikki baravar ko'payadi va 48 kunda ko'lni to'liq qoplaydi. Yarmini necha kunda qoplaydi?", o: ["47", "24", "46", "36"], a: "47" },
  { d: 4, t: "Ruchka va daftar birgalikda 1100 so'm. Ruchka daftardan 1000 so'm qimmat. Daftar necha so'm?", o: ["50", "100", "1000", "10"], a: "50" },
  { d: 4, t: "Agar ba'zi Z lar Y bo'lsa va barcha Y lar X bo'lsa, qaysi biri ALBATTA to'g'ri?", o: ["Ba'zi Z lar X", "Barcha X lar Z", "Barcha Z lar X", "Hech bir X Z emas"], a: "Ba'zi Z lar X" },
  { d: 4, t: "Ota o'g'lidan 4 marta katta. 20 yildan keyin otasi o'g'lidan 2 marta katta bo'ladi. Ota hozir necha yoshda?", o: ["40", "36", "44", "48"], a: "40" },
  { d: 4, t: "Qaysi juftlik munosabati \"Sabab : Oqibat\" ga mos?", o: ["Yomg'ir : Ho'l yer", "Daraxt : Barg", "Kitob : Sahifa", "Qor : Oq"], a: "Yomg'ir : Ho'l yer" },
  { d: 5, t: "Uch qutidan biri faqat olma, biri faqat nok, biri aralash. Barcha yorliqlar NOTO'G'RI. Faqat bitta qutidan bitta meva olib, hamma yorliqni to'g'rilash uchun qaysi qutidan olish kerak?", o: ["\"Aralash\" yorliqli", "\"Olma\" yorliqli", "\"Nok\" yorliqli", "Mumkin emas"], a: "\"Aralash\" yorliqli" },
  { d: 5, t: "Ikki kishi doim yolg'on gapiradi, biri doim rost. A: \"B yolg'onchi\". B: \"C yolg'onchi\". C: \"A va B ikkalasi yolg'onchi\". Kim rostgo'y?", o: ["B", "A", "C", "Aniqlab bo'lmaydi"], a: "B" },
  { d: 5, t: "Kubning har tomoni bo'yalgan, keyin 27 ta kichik kubga bo'lingan. Nechta kichik kubning aynan 2 tomoni bo'yalgan?", o: ["12", "8", "6", "24"], a: "12" },
  { d: 5, t: "Kalendarda bir oyning 3 ta yakshanbasi juft sanaga to'g'ri kelgan. Shu oyning 20-sanasi qaysi kun?", o: ["Payshanba", "Shanba", "Seshanba", "Juma"], a: "Payshanba" },
];

const NAMES = ["Aziz", "Bekzod", "Dilnoza", "Malika", "Sardor", "Nodira", "Jasur", "Kamola", "Otabek", "Zarina"];
function genOrdering(level) {
  const n = level >= 4 ? 5 : 4;
  const people = shuffle(NAMES).slice(0, n); // tartib: 0 eng baland
  const adj = pick([["baland", "eng baland", "eng past"], ["katta (yoshda)", "eng katta", "eng kichik"], ["tez", "eng tez", "eng sekin"]]);
  const facts = [];
  for (let i = 0; i < n - 1; i++) facts.push(`${people[i]} ${people[i + 1]}dan ${adj[0]}.`);
  const askTop = Math.random() < 0.5;
  const target = people[askTop ? 0 : n - 1];
  return {
    cat: "verbal", diff: Math.min(5, level),
    text: `${shuffle(facts).join(" ")} Kim ${askTop ? adj[1] : adj[2]}?`,
    options: shuffle([target, ...shuffle(people.filter((p) => p !== target)).slice(0, 3)]),
    answer: target,
  };
}

function genVerbal(level, used) {
  if (Math.random() < 0.3) return genOrdering(level);
  const pool = VERBAL.filter((v) => Math.abs(v.d - level) <= 1 && !used.has(v.t));
  if (!pool.length) return genOrdering(level);
  const v = pick(pool); used.add(v.t);
  return { cat: "verbal", diff: v.d, text: v.t, options: shuffle(v.o), answer: v.a };
}

/* ======================= TEST BUILDER ======================= */
// 32 savol: har kategoriyadan 8 tadan, qiyinlik 1→5 ga qarab oshib boradi.
export function buildTest(total = 32) {
  const used = new Set();
  const perCat = total / 4;
  const out = [];
  const cats = ["matrix", "numeric", "verbal", "spatial"];
  for (let i = 0; i < perCat; i++) {
    const level = Math.min(5, 1 + Math.floor((i / perCat) * 5));
    for (const c of shuffle(cats)) {
      let q;
      if (c === "matrix") q = genMatrix(level);
      else if (c === "numeric") q = Math.random() < 0.25 ? genLetters(level) : genNumeric(level);
      else if (c === "verbal") q = genVerbal(level, used);
      else q = level >= 3 && Math.random() < 0.35 ? genCube(level) : genSpatial(level);
      q.id = out.length;
      out.push(q);
    }
  }
  return out;
}

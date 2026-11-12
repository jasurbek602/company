// Savollar generatori — 7 darajali, protsedurali. Har bir foydalanuvchi uchun noyob savollar.
// Kategoriyalar: matrix (Raven uslubi), numeric (son/harf), verbal (mantiq/deduksiya), spatial (fazoviy).
// Daraja (1..7) IRT qiyinlik parametriga aylantiriladi (scoring.js).

export const CATEGORIES = {
  matrix: { name: "Naqsh va matritsa", icon: "🔷" },
  numeric: { name: "Sonli tafakkur", icon: "🔢" },
  verbal: { name: "Mantiq va deduksiya", icon: "🧩" },
  spatial: { name: "Fazoviy tafakkur", icon: "🧊" },
};

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const uniq = (arr) => [...new Set(arr)];

function numOpts(answer, extra = [], n = 5) {
  const set = new Set([answer]);
  for (const c of shuffle(extra)) { if (set.size >= n) break; if (Number.isFinite(c) && c !== answer) set.add(c); }
  const d = Math.max(2, Math.round(Math.abs(answer) * 0.08));
  for (const c of shuffle([answer + d, answer - d, answer + 2 * d, answer - 1, answer + 1, answer + 3 * d])) { if (set.size >= n) break; set.add(c); }
  return shuffle([...set]).map(String);
}

/* =========================================================
   SONLI TAFAKKUR
   ========================================================= */
// har bir generator: [ko'rsatiladigan ketma-ketlik, javob, chalg'ituvchilar]
const SEQ = {
  1: [
    () => { const a = rnd(2, 20), s = rnd(3, 9); const q = [0, 1, 2, 3, 4].map((i) => a + s * i); return [q, a + 5 * s, [a + 5 * s + 1, a + 4 * s + s * 2]]; },
    () => { const a = rnd(70, 120), s = rnd(4, 9); const q = [0, 1, 2, 3, 4].map((i) => a - s * i); return [q, a - 5 * s, [a - 6 * s]]; },
  ],
  2: [
    () => { const a = rnd(1, 4), r = rnd(2, 3); const q = [0, 1, 2, 3, 4].map((i) => a * r ** i); return [q, a * r ** 5, [a * r ** 4 * 2 + 1, a * r ** 5 - r]]; },
    () => { const a = rnd(1, 6); const q = [a]; for (let i = 1; i < 6; i++) q.push(q[i - 1] + i * 2); const ans = q.pop(); return [q, ans, [ans + 2, ans - 2]]; },
  ],
  3: [
    () => { const o = rnd(1, 4); const q = [1, 2, 3, 4, 5].map((n) => (n + o) ** 2); return [q, (6 + o) ** 2, [(6 + o) ** 2 + 1, (6 + o) ** 2 - (6 + o)]]; },
    () => { const a = rnd(1, 4), b = rnd(2, 6); const q = [a, b]; for (let i = 2; i < 7; i++) q.push(q[i - 1] + q[i - 2]); const ans = q.pop(); return [q, ans, [ans + 1, q[q.length - 1] * 2]]; },
    () => { const a = rnd(5, 20), x = rnd(2, 5), y = rnd(6, 11); const q = [a]; for (let i = 1; i < 7; i++) q.push(i % 2 ? q[i - 1] + y : q[i - 1] - x); const ans = q.pop(); return [q, ans, [ans + x + y, ans - x - y]]; },
  ],
  4: [
    // ikki aralash ketma-ketlik
    () => { const a = rnd(1, 5), s = rnd(2, 4), b = rnd(20, 40), t = rnd(2, 5); const q = []; for (let i = 0; i < 4; i++) { q.push(a + s * i, b - t * i); } const ans = a + s * 4; return [q, ans, [b - t * 4, ans + s, ans - 1]]; },
    // ayirmalar geometrik
    () => { const a = rnd(1, 9), r = rnd(2, 3), d0 = rnd(1, 3); const q = [a]; let d = d0; for (let i = 1; i < 7; i++) { q.push(q[i - 1] + d); d *= r; } const ans = q.pop(); return [q, ans, [ans + d0, ans - d0 * r, q[q.length - 1] * r]]; },
    // ×k, +m navbatma-navbat
    () => { const a = rnd(1, 5), k = rnd(2, 3), m = rnd(1, 6); const q = [a]; for (let i = 1; i < 7; i++) q.push(i % 2 ? q[i - 1] * k : q[i - 1] + m); const ans = q.pop(); return [q, ans, [ans + m, ans - k, q[q.length - 1] * k]]; },
  ],
  5: [
    // ayirmalar tub sonlar
    () => { const pr = [2, 3, 5, 7, 11, 13, 17]; const a = rnd(1, 15); const q = [a]; for (let i = 0; i < 6; i++) q.push(q[i] + pr[i]); const ans = q.pop(); return [q, ans, [ans + 2, ans - 2, ans + 4]]; },
    // a(n) = 2a(n-1) + a(n-2)
    () => { const a = rnd(1, 3), b = rnd(2, 5); const q = [a, b]; for (let i = 2; i < 7; i++) q.push(2 * q[i - 1] + q[i - 2]); const ans = q.pop(); return [q, ans, [ans - q[q.length - 2], 2 * q[q.length - 1], ans + 1]]; },
    // n^3 - n
    () => { const o = rnd(0, 2); const q = [1, 2, 3, 4, 5].map((n) => (n + o) ** 3 - (n + o)); const m = 6 + o; return [q, m ** 3 - m, [m ** 3, m ** 3 - m * m, m ** 3 + m]]; },
  ],
  6: [
    // a(n) = a(n-1)*n - (n-1)
    () => { const a = rnd(2, 4); const q = [a]; for (let n = 2; n <= 6; n++) q.push(q[n - 2] * n - (n - 1)); const ans = q.pop(); return [q, ans, [ans + 5, ans - 6, q[q.length - 1] * 6]]; },
    // ikkinchi tartibli ayirmalar arifmetik
    () => { const a = rnd(1, 10), d = rnd(1, 4), s = rnd(1, 3); const q = [a]; let diff = d; for (let i = 1; i < 7; i++) { q.push(q[i - 1] + diff); diff += s * i; } const ans = q.pop(); return [q, ans, [ans + s, ans - s * 2, ans + d]]; },
    // tribonachchi
    () => { const q = [rnd(1, 2), rnd(1, 3), rnd(2, 4)]; for (let i = 3; i < 8; i++) q.push(q[i - 1] + q[i - 2] + q[i - 3]); const ans = q.pop(); return [q, ans, [q[q.length - 1] + q[q.length - 2], ans + 1, ans - q[q.length - 3]]]; },
  ],
  7: [
    // ikki qatlamli: toq o'rinlarda kvadratlar, juft o'rinlarda Fibonachchi
    () => { const o = rnd(1, 3); const f = [1, 2, 3, 5, 8]; const q = []; for (let i = 0; i < 4; i++) q.push((i + o) ** 2, f[i]); const ans = (4 + o) ** 2; return [q, ans, [f[4], ans + 1, (3 + o) ** 2 + f[3]]]; },
    // a(n) = a(n-1)^2 - a(n-2)
    () => { const q = [rnd(1, 2), rnd(2, 3)]; for (let i = 2; i < 6; i++) q.push(q[i - 1] ** 2 - q[i - 2]); const ans = q.pop(); return [q, ans, [q[q.length - 1] ** 2, ans + q[q.length - 2] * 2, ans - 1]]; },
    // n! + n
    () => { const f = (n) => (n <= 1 ? 1 : n * f(n - 1)); const q = [1, 2, 3, 4, 5].map((n) => f(n) + n); return [q, f(6) + 6, [f(6), f(6) - 6, 5 * q[4]]]; },
  ],
};

function genSequence(level) {
  const L = Math.max(1, Math.min(7, level));
  const [shown, ans, extra] = pick(SEQ[L])();
  return { cat: "numeric", diff: L, text: "Qonuniyatni toping. Keyingi son qaysi?", seq: [...shown.map(String), "?"], options: numOpts(ans, extra), answer: String(ans) };
}

// 3×3 sonli jadval: qator qoidasi
function genNumberGrid(level) {
  const rules = [
    { f: (a, b) => a * b - b, t: "a·b − b" },
    { f: (a, b) => (a + b) * 2, t: "(a+b)·2" },
    { f: (a, b) => a * a - b, t: "a² − b" },
    { f: (a, b) => a * b + a, t: "a·b + a" },
    { f: (a, b) => (a - b) * (a + b), t: "a² − b²" },
  ];
  const r = pick(rules);
  const rows = [];
  for (let i = 0; i < 3; i++) { const a = rnd(3, 9), b = rnd(2, a - 1); rows.push([a, b, r.f(a, b)]); }
  const ans = rows[2][2];
  // boshqa qoidalar bilan noaniqlikni rad etish
  for (const o of rules) if (o !== r && rows.slice(0, 2).every(([a, b, c]) => o.f(a, b) === c)) return genNumberGrid(level);
  const extra = rules.filter((o) => o !== r).map((o) => o.f(rows[2][0], rows[2][1]));
  const cells = rows.flat().map((v, i) => (i === 8 ? "?" : String(v)));
  return { cat: "numeric", diff: Math.max(5, Math.min(7, level)), text: "Jadvaldagi har bir qatorda bir xil qoida amal qiladi. \"?\" o'rniga qaysi son keladi?", grid: cells, options: numOpts(ans, extra), answer: String(ans) };
}

// son analogiyasi
function genAnalogy(level) {
  const fs = [(n) => n * n + 1, (n) => n * n - n, (n) => 2 * n + 3, (n) => n ** 3 - 1, (n) => n * (n + 2), (n) => 3 * n - 2];
  const f = pick(fs);
  const ns = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const ans = f(ns[3]);
  const extra = fs.filter((g) => g !== f).map((g) => g(ns[3]));
  // noaniqlikni tekshirish
  for (const g of fs) if (g !== f && ns.slice(0, 3).every((n) => g(n) === f(n))) return genAnalogy(level);
  return { cat: "numeric", diff: Math.max(4, Math.min(6, level)), text: `Qonuniyat: ${ns.slice(0, 3).map((n) => `${n} → ${f(n)}`).join(",  ")}.  ${ns[3]} → ?`, options: numOpts(ans, extra), answer: String(ans) };
}

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function genLetters(level) {
  const step = rnd(1, 3), inc = level >= 5 ? 1 : 0;
  let i = rnd(0, 3); const out = []; let s = step;
  for (let k = 0; k < 6; k++) { out.push(ALPHA[i % 26]); i += s; s += inc; }
  const answer = out.pop();
  const ai = ALPHA.indexOf(answer);
  const opts = new Set([answer]);
  for (const d of shuffle([1, -1, 2, -2, 3])) { if (opts.size >= 5) break; opts.add(ALPHA[(ai + d + 26) % 26]); }
  return { cat: "numeric", diff: Math.min(6, Math.max(2, level)), text: "Harflar ketma-ketligini davom ettiring:", seq: [...out, "?"], options: shuffle([...opts]), answer };
}

function genNumeric(level) {
  if (level >= 5 && Math.random() < 0.35) return genNumberGrid(level);
  if (level >= 4 && Math.random() < 0.25) return genAnalogy(level);
  if (level >= 2 && level <= 6 && Math.random() < 0.15) return genLetters(level);
  return genSequence(level);
}

/* =========================================================
   MATRITSALAR (Raven uslubi)
   ========================================================= */
const SHAPES = ["circle", "square", "triangle", "diamond", "hex", "star"];
const COLORS = ["#7c5cff", "#00d4ff", "#ff4fd8", "#ffc94d", "#2ee59d"];
const DEFS = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="6" fill="#00d4ff" opacity=".8"/></pattern></defs>`;

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
function shapeCell(c, size = 90) {
  const r = c.count === 1 ? 22 : c.count === 2 ? 15 : 12;
  const layouts = { 1: [[0.5, 0.5]], 2: [[0.3, 0.5], [0.7, 0.5]], 3: [[0.5, 0.27], [0.27, 0.72], [0.73, 0.72]], 4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]] };
  return layouts[c.count].map(([x, y]) => shapeSVG(c.shape, x * size, y * size, r, c.fill, c.rot, c.color)).join("");
}
// nuqtali / chiziqli (mantiqiy amal) katak
function setCell(set, kind, size = 90) {
  const c = size / 2;
  if (kind === "spokes") {
    const ring = `<circle cx="${c}" cy="${c}" r="34" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>`;
    return ring + [...set].map((k) => { const a = (k * 45 - 90) * Math.PI / 180; return `<line x1="${c}" y1="${c}" x2="${(c + 34 * Math.cos(a)).toFixed(1)}" y2="${(c + 34 * Math.sin(a)).toFixed(1)}" stroke="#00d4ff" stroke-width="4" stroke-linecap="round"/>`; }).join("") + `<circle cx="${c}" cy="${c}" r="4" fill="#b9a8ff"/>`;
  }
  return Array.from({ length: 9 }, (_, k) => { const x = 22 + (k % 3) * 23, y = 22 + Math.floor(k / 3) * 23; return set.has(k) ? `<circle cx="${x}" cy="${y}" r="8" fill="#00d4ff"/>` : `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>`; }).join("");
}
const svgWrap = (inner) => `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${DEFS}${inner}</svg>`;

function gridSVG(cells) {
  const S = 92, pad = 6, W = 3 * S + 2 * pad;
  const g = cells.map((inner, i) => {
    const x = (i % 3) * (S + pad), y = Math.floor(i / 3) * (S + pad);
    const body = i === 8 ? `<text x="${S / 2}" y="${S / 2 + 12}" text-anchor="middle" font-size="34" fill="#b9a8ff" font-family="Unbounded,Arial">?</text>` : `<g transform="scale(${S / 90})">${inner}</g>`;
    return `<g transform="translate(${x},${y})"><rect width="${S}" height="${S}" rx="12" fill="rgba(255,255,255,.05)" stroke="${i === 8 ? "#7c5cff" : "rgba(255,255,255,.14)"}" stroke-dasharray="${i === 8 ? "6 5" : ""}"/>${body}</g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${W}" width="${W}" xmlns="http://www.w3.org/2000/svg">${DEFS}${g}</svg>`;
}

function genShapeMatrix(level) {
  const fills = ["none", "half", "solid"];
  const counts = shuffle([1, 2, 3, 4]).slice(0, 3);
  const color = pick(COLORS);
  const nRules = level <= 1 ? 1 : level <= 3 ? 2 : level === 4 ? 3 : 4;
  const attrs = shuffle(["shape", "count", "fill", "rot"]).slice(0, nRules);
  const rotOn = attrs.includes("rot");
  const shapePool = rotOn ? ["triangle", "star", "square"] : SHAPES;
  const baseShapes = shuffle(shapePool).slice(0, 3);
  const constShape = pick(shapePool), constCount = rnd(1, 3), constFill = pick(fills);
  const mode = {};
  // past darajada qator/ustun bo'yicha; yuqorida Latin kvadrat (har qator va ustunda bir martadan)
  attrs.forEach((a) => (mode[a] = level >= 3 ? (Math.random() < 0.75 ? "latin" : "latin2") : pick(["row", "col"])));
  const cell = (r, c) => {
    const idx = (a) => (mode[a] === "latin" ? (r + c) % 3 : mode[a] === "latin2" ? (r + 2 * c) % 3 : mode[a] === "row" ? c : r);
    return { shape: attrs.includes("shape") ? baseShapes[idx("shape")] : constShape, count: attrs.includes("count") ? counts[idx("count")] : constCount, fill: attrs.includes("fill") ? fills[idx("fill")] : constFill, rot: attrs.includes("rot") ? idx("rot") * 30 : 0, color };
  };
  const grid = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grid.push(cell(r, c));
  const ans = grid[8];
  const key = (c) => `${c.shape}|${c.count}|${c.fill}|${c.rot}`;
  const opts = [ans]; const seen = new Set([key(ans)]);
  // yuqori darajada chalg'ituvchilar to'rdagi boshqa kataklardan ham olinadi (eng qiyin xato turi)
  if (level >= 4) for (const g of shuffle(grid.slice(0, 8))) { if (opts.length >= 3) break; if (!seen.has(key(g))) { seen.add(key(g)); opts.push(g); } }
  let guard = 0;
  while (opts.length < 6 && guard++ < 300) {
    const d = { ...ans };
    const which = pick(["shape", "count", "fill", ...attrs]);
    if (which === "shape") d.shape = pick(shapePool);
    if (which === "count") d.count = rnd(1, 4);
    if (which === "fill") d.fill = pick(fills);
    if (which === "rot") d.rot = pick([0, 30, 60]);
    if (!seen.has(key(d))) { seen.add(key(d)); opts.push(d); }
  }
  const sh = shuffle(opts);
  return { cat: "matrix", diff: Math.min(7, level), text: "Matritsadagi qonuniyatni toping. Bo'sh katakka qaysi variant mos keladi?", svg: gridSVG(grid.map((g) => shapeCell(g))), options: sh.map(key), optionSVG: sh.map((o) => svgWrap(shapeCell(o))), answer: key(ans), visual: true };
}

// Mantiqiy amallar: 3-ustun = 1-ustun ⊕ 2-ustun (XOR / OR / AND / ayirish)
const OPS = {
  or: (a, b) => new Set([...a, ...b]),
  and: (a, b) => new Set([...a].filter((x) => b.has(x))),
  xor: (a, b) => new Set([...a, ...b].filter((x) => a.has(x) !== b.has(x))),
  minus: (a, b) => new Set([...a].filter((x) => !b.has(x))),
  rminus: (a, b) => new Set([...b].filter((x) => !a.has(x))),
};
const skey = (s) => [...s].sort((x, y) => x - y).join(",");
function genLogicMatrix(level) {
  const kind = level >= 6 && Math.random() < 0.6 ? "spokes" : "dots";
  const N = kind === "spokes" ? 8 : 9;
  const opName = level <= 5 ? pick(["or", "minus"]) : pick(["xor", "and", "xor", "minus"]);
  const op = OPS[opName];
  const randSet = () => new Set(shuffle([...Array(N).keys()]).slice(0, rnd(3, 5)));
  for (let tries = 0; tries < 200; tries++) {
    const rows = [0, 1, 2].map(() => { const a = randSet(), b = randSet(); return [a, b, op(a, b)]; });
    if (rows.some(([a, b, c]) => c.size === 0 || skey(c) === skey(a) || skey(c) === skey(b))) continue;
    // boshqa amal ham dastlabki ikki qatorga mos kelsa — noaniq, qayta yaratamiz
    if (Object.entries(OPS).some(([n, f]) => n !== opName && rows.slice(0, 2).every(([a, b, c]) => skey(f(a, b)) === skey(c)))) continue;
    const [A, B, C] = rows[2];
    const cand = [C, ...Object.entries(OPS).filter(([n]) => n !== opName).map(([, f]) => f(A, B)), A, B];
    for (let k = 0; k < 6; k++) { const s = new Set(C); const x = rnd(0, N - 1); s.has(x) ? s.delete(x) : s.add(x); cand.push(s); }
    const opts = []; const seen = new Set();
    for (const s of cand) { const k = skey(s); if (s.size && !seen.has(k)) { seen.add(k); opts.push(s); } if (opts.length === 6) break; }
    if (opts.length < 6) continue;
    const sh = shuffle(opts);
    return { cat: "matrix", diff: Math.min(7, Math.max(5, level)), text: "Har bir qatorda 1- va 2-katak ma'lum mantiqiy qoida bilan birlashib 3-katakni beradi. Bo'sh katakka qaysi variant mos?", svg: gridSVG(rows.flat().map((s) => setCell(s, kind))), options: sh.map(skey), optionSVG: sh.map((s) => svgWrap(setCell(s, kind))), answer: skey(C), visual: true };
  }
  return genShapeMatrix(level);
}

function genMatrix(level) {
  if (level >= 5 && Math.random() < 0.55) return genLogicMatrix(level);
  return genShapeMatrix(level);
}

/* =========================================================
   FAZOVIY TAFAKKUR
   ========================================================= */
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
const tr = (cells, f) => { const m = cells.map(f); const mx = Math.min(...m.map((c) => c[0])), my = Math.min(...m.map((c) => c[1])); return m.map(([x, y]) => [x - mx, y - my]); };

function polySVG(cells, color = "#00d4ff", marker = true) {
  const s = 18; const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
  const V = Math.max(w, h) * s + 8; const ox = (V - w * s) / 2, oy = (V - h * s) / 2;
  const rects = cells.map(([x, y], i) => `<rect x="${ox + x * s}" y="${oy + y * s}" width="${s - 2}" height="${s - 2}" rx="3" fill="${i === 0 && marker ? "#ff4fd8" : color}" opacity="${i === 0 && marker ? 1 : 0.85}"/>`).join("");
  return `<svg viewBox="0 0 ${V} ${V}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function genRotation(level) {
  const n = level <= 2 ? 5 : level <= 4 ? 6 : level <= 6 ? 7 : 8;
  let base, guard = 0;
  do { base = polyomino(n); guard++; } while ((allRots(base).some((r) => sig(r) === sig(mirror(base))) || uniq(allRots(base).map(sig)).length < 4) && guard < 400);
  const R = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x]];
  const M = ([x, y]) => [-x, y];
  const correct = tr(base, R[rnd(1, 3)]);
  const wrong = shuffle([0, 1, 2, 3]).slice(0, level >= 5 ? 4 : 3).map((j) => tr(base, (p) => R[j](M(p))));
  const items = shuffle([{ c: correct, ok: true }, ...wrong.map((c) => ({ c, ok: false }))]);
  return {
    cat: "spatial", diff: Math.min(7, level),
    text: "Qaysi variant yuqoridagi shaklning faqat AYLANTIRILGAN ko'rinishi (oynadagi aksi emas)? Pushti katak yo'nalishni ko'rsatadi.",
    svg: `<div style="width:130px">${polySVG(tr(base, (p) => p))}</div>`,
    options: items.map((_, i) => "s" + i), optionSVG: items.map((it) => polySVG(it.c)),
    answer: "s" + items.findIndex((it) => it.ok), visual: true,
  };
}

function genCube(level) {
  const nets = [
    { layout: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], opp: [[0, 5], [1, 3], [2, 4]] },
    { layout: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], opp: [[0, 5], [1, 3], [2, 4]] },
    { layout: [[1, 0], [1, 1], [0, 1], [2, 1], [2, 2], [3, 2]], opp: [[0, 4], [1, 5], [2, 3]] },
    { layout: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], opp: [[0, 3], [1, 4], [2, 5]] },
  ];
  const net = pick(nets);
  const sym = shuffle(["★", "●", "▲", "■", "♦", "✚"]);
  const [a, b] = pick(net.opp);
  const s = 34;
  const rects = net.layout.map(([x, y], i) => `<g><rect x="${x * s + 4}" y="${y * s + 4}" width="${s - 2}" height="${s - 2}" rx="4" fill="rgba(124,92,255,.18)" stroke="#7c5cff"/><text x="${x * s + 4 + s / 2 - 1}" y="${y * s + 4 + s / 2 + 6}" text-anchor="middle" font-size="17" fill="#fff">${sym[i]}</text></g>`).join("");
  const W = 4 * s + 8, H = 3 * s + 8;
  const asked = Math.random() < 0.5 ? a : b, ans = asked === a ? b : a;
  // qo'shni (yondosh) tomonlar eng kuchli chalg'ituvchi
  const others = sym.filter((_, i) => i !== asked && i !== ans);
  return {
    cat: "spatial", diff: Math.min(6, Math.max(4, level)),
    text: `Yoyilma kubga yig'ilganda "${sym[asked]}" belgisining QARAMA-QARSHI tomonida qaysi belgi bo'ladi?`,
    svg: `<svg viewBox="0 0 ${W} ${H}" width="${W * 1.5}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`,
    options: shuffle([sym[ans], ...shuffle(others).slice(0, 3)]), answer: sym[ans],
  };
}

// Qog'oz buklash va teshish (klassik IQ topshirig'i)
function paperSVG(holes, folded = null) {
  const s = 22, W = 4 * s + 8;
  let g = `<rect x="4" y="4" width="${4 * s}" height="${4 * s}" rx="4" fill="rgba(255,255,255,.92)" stroke="#7c5cff" stroke-width="2"/>`;
  if (folded) g += folded;
  g += holes.map(([x, y]) => `<circle cx="${4 + x * s + s / 2}" cy="${4 + y * s + s / 2}" r="6" fill="#0b0b1a"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${W}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}
function genPaperFold(level) {
  const folds = level >= 6 ? shuffle(["v", "h"]) : [pick(["v", "h"])];
  const nHoles = level >= 7 ? 2 : level >= 5 ? rnd(1, 2) : 1;
  const visX = folds.includes("v") ? [2, 3] : [0, 1, 2, 3];
  const visY = folds.includes("h") ? [2, 3] : [0, 1, 2, 3];
  const holes = []; while (holes.length < nHoles) { const h = [pick(visX), pick(visY)]; if (!holes.some((p) => p[0] === h[0] && p[1] === h[1])) holes.push(h); }
  const unfold = (hs, fs) => { let out = hs.map((p) => [...p]); for (const f of fs) out = out.concat(out.map(([x, y]) => (f === "v" ? [3 - x, y] : [x, 3 - y]))); return uniq(out.map((p) => p.join(","))).map((k) => k.split(",").map(Number)); };
  const key = (hs) => hs.map((p) => p.join(",")).sort().join(";");
  const correct = unfold(holes, folds);
  const cands = [
    unfold(holes, folds.map((f) => (f === "v" ? "h" : "v"))),
    holes,
    unfold(holes, [folds[0]]),
    unfold(holes.map(([x, y]) => [y, x]), folds),
    correct.slice(0, -1),
    unfold(holes.map(([x, y]) => [x, (y + 1) % 4]), folds),
    unfold(holes.map(([x, y]) => [(x + 1) % 4, y]), folds),
  ];
  const opts = [correct]; const seen = new Set([key(correct)]);
  for (const c of cands) { if (c.length && !seen.has(key(c))) { seen.add(key(c)); opts.push(c); } if (opts.length === 5) break; }
  // buklash bosqichlari rasmi
  const s = 22;
  const step = (f, i) => {
    const line = f === "v" ? `<line x1="${4 + 2 * s}" y1="2" x2="${4 + 2 * s}" y2="${4 * s + 6}" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="5 4"/>` : `<line x1="2" y1="${4 + 2 * s}" x2="${4 * s + 6}" y2="${4 + 2 * s}" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="5 4"/>`;
    const arrow = f === "v" ? `<path d="M${4 + s * 0.6} ${4 + 2 * s} q ${s * 0.9} -${s} ${s * 2.4} 0" fill="none" stroke="#ff4fd8" stroke-width="2.2" marker-end="url(#ar${i})"/>` : `<path d="M${4 + 2 * s} ${4 + s * 0.6} q ${s} ${s * 0.9} 0 ${s * 2.4}" fill="none" stroke="#ff4fd8" stroke-width="2.2" marker-end="url(#ar${i})"/>`;
    // oldingi bukilgan qismni xira ko'rsatish
    const prev = folds.slice(0, i);
    const shade = prev.map((p) => (p === "v" ? `<rect x="4" y="4" width="${2 * s}" height="${4 * s}" fill="#0b0b1a" opacity=".55"/>` : `<rect x="4" y="4" width="${4 * s}" height="${2 * s}" fill="#0b0b1a" opacity=".55"/>`)).join("");
    return `<svg viewBox="0 0 96 96" width="96"><defs><marker id="ar${i}" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ff4fd8"/></marker></defs><rect x="4" y="4" width="${4 * s}" height="${4 * s}" rx="4" fill="rgba(255,255,255,.92)" stroke="#7c5cff" stroke-width="2"/>${shade}${line}${arrow}</svg>`;
  };
  // buklangan (qolgan) qism va teshiklar
  const fx = visX[0], fy = visY[0], fw = visX.length, fh = visY.length;
  const punched = `<svg viewBox="0 0 96 96" width="96"><rect x="${4 + fx * s}" y="${4 + fy * s}" width="${fw * s}" height="${fh * s}" rx="4" fill="rgba(255,255,255,.92)" stroke="#ff4fd8" stroke-width="2"/>${holes.map(([x, y]) => `<circle cx="${4 + x * s + s / 2}" cy="${4 + y * s + s / 2}" r="6" fill="#0b0b1a"/>`).join("")}</svg>`;
  const sh = shuffle(opts);
  return {
    cat: "spatial", diff: Math.min(7, Math.max(4, level)),
    text: "Kvadrat qog'oz ko'rsatilgandek buklandi (pushti chiziq bo'yicha), so'ng teshildi. Qog'oz ochilganda qanday ko'rinadi?",
    svg: `<div class="steps">${folds.map(step).join('<span class="arrow">→</span>')}<span class="arrow">→</span>${punched}</div>`,
    options: sh.map(key), optionSVG: sh.map((h) => paperSVG(h)), answer: key(correct), visual: true,
  };
}

function genSpatial(level) {
  const r = Math.random();
  if (level >= 4 && r < 0.4) return genPaperFold(level);
  if (level >= 4 && r < 0.6) return genCube(level);
  return genRotation(level);
}

/* =========================================================
   MANTIQ VA DEDUKSIYA
   ========================================================= */
const VERBAL = [
  { d: 1, t: "Qush : Uya = Asalari : ?", o: ["Uya (in)", "Gul", "Asal", "Qanot"], a: "Uya (in)" },
  { d: 1, t: "Qaysi so'z ortiqcha?", o: ["Olma", "Nok", "Sabzi", "O'rik"], a: "Sabzi" },
  { d: 1, t: "Issiq : Sovuq = Baland : ?", o: ["Past", "Uzun", "Katta", "Keng"], a: "Past" },
  { d: 2, t: "Kitob : O'qish = Pichoq : ?", o: ["Kesish", "Oshxona", "O'tkir", "Temir"], a: "Kesish" },
  { d: 2, t: "Qaysi so'z ortiqcha?", o: ["Skripka", "Gitara", "Baraban", "Dutor"], a: "Baraban" },
  { d: 2, t: "To'rt aka-ukaning har birining bittadan singlisi bor. Oilada nechta farzand?", o: ["5", "8", "4", "6"], a: "5" },
  { d: 2, t: "Qaysi son ortiqcha?", o: ["144", "169", "210", "225"], a: "210" },
  { d: 3, t: "Barcha mushuklar hayvon. Ba'zi hayvonlar qora. Demak:", o: ["Ba'zi mushuklar albatta qora", "Hech bir mushuk qora emas", "Aniq xulosa chiqarib bo'lmaydi", "Barcha hayvonlar mushuk"], a: "Aniq xulosa chiqarib bo'lmaydi" },
  { d: 3, t: "Agar bugun seshanba bo'lsa, 100 kundan keyin qaysi kun?", o: ["Payshanba", "Chorshanba", "Juma", "Shanba"], a: "Payshanba" },
  { d: 3, t: "Daraxt : O'rmon = Yulduz : ?", o: ["Galaktika", "Osmon", "Quyosh", "Tun"], a: "Galaktika" },
  { d: 3, t: "5 ta mashina 5 daqiqada 5 ta detal yasaydi. 100 ta mashina 100 ta detalni necha daqiqada yasaydi?", o: ["5", "100", "20", "1"], a: "5" },
  { d: 4, t: "Barcha A lar B. Hech bir B C emas. Demak:", o: ["Hech bir A C emas", "Ba'zi A lar C", "Barcha C lar A", "Barcha B lar A"], a: "Hech bir A C emas" },
  { d: 4, t: "Soat 3:15 da soat va minut millari orasidagi burchak necha gradus?", o: ["7.5°", "0°", "15°", "22.5°"], a: "7.5°" },
  { d: 4, t: "Ruchka va daftar birgalikda 1100 so'm. Ruchka daftardan 1000 so'm qimmat. Daftar necha so'm?", o: ["50", "100", "1000", "10"], a: "50" },
  { d: 4, t: "Ali Validan baland. Vali Sobirdan past. Sobir Alidan past. Eng baland kim?", o: ["Ali", "Sobir", "Vali", "Aniqlab bo'lmaydi"], a: "Ali" },
  { d: 4, t: "Kubni 3 ta tekis kesim bilan ko'pi bilan nechta bo'lakka bo'lish mumkin?", o: ["8", "6", "9", "7"], a: "8" },
  { d: 5, t: "Ko'l yuzasidagi nilufarlar har kuni ikki baravar ko'payadi va 48 kunda ko'lni to'liq qoplaydi. Yarmini necha kunda qoplaydi?", o: ["47", "24", "46", "36"], a: "47" },
  { d: 5, t: "Ota o'g'lidan 4 marta katta. 20 yildan keyin otasi o'g'lidan 2 marta katta bo'ladi. Ota hozir necha yoshda?", o: ["40", "36", "44", "48"], a: "40" },
  { d: 5, t: "A: \"Biz ikkalamiz ham yolg'onchimiz.\" Har kim yo doim rost, yo doim yolg'on gapiradi. A va B kim?", o: ["A yolg'onchi, B rostgo'y", "Ikkalasi yolg'onchi", "A rostgo'y, B yolg'onchi", "Ikkalasi rostgo'y"], a: "A yolg'onchi, B rostgo'y" },
  { d: 5, t: "3 kishi 3 kunda 3 ta ariq qazadi. 9 kishi 9 kunda nechta ariq qazadi?", o: ["27", "9", "81", "18"], a: "27" },
  { d: 5, t: "Ikki poyezd 300 km masofadan bir-biriga qarab 70 va 80 km/soat tezlikda yo'lga chiqdi. Pashsha ular orasida 100 km/soat tezlikda to'xtovsiz uchadi. To'qnashguncha pashsha necha km uchadi?", o: ["200", "150", "300", "100"], a: "200" },
  { d: 5, t: "\"Ba'zi A lar B emas\" — rost. Qaysi biri ALBATTA yolg'on?", o: ["Barcha A lar B", "Ba'zi A lar B", "Hech bir A B emas", "Ba'zi B lar A emas"], a: "Barcha A lar B" },
  { d: 6, t: "Uch qutidan biri faqat olma, biri faqat nok, biri aralash. Barcha yorliqlar NOTO'G'RI. Bitta qutidan bitta meva olib, hamma yorliqni to'g'rilash uchun qaysi qutidan olish kerak?", o: ["\"Aralash\" yorliqli", "\"Olma\" yorliqli", "\"Nok\" yorliqli", "Mumkin emas"], a: "\"Aralash\" yorliqli" },
  { d: 6, t: "Ikki kishi doim yolg'on, biri doim rost gapiradi. A: \"B yolg'onchi\". B: \"C yolg'onchi\". C: \"A va B ikkalasi yolg'onchi\". Kim rostgo'y?", o: ["B", "A", "C", "Aniqlab bo'lmaydi"], a: "B" },
  { d: 6, t: "Kubning hamma tomoni bo'yalgan, keyin 27 ta kichik kubga bo'lingan. Nechtasining aynan 2 tomoni bo'yalgan?", o: ["12", "8", "6", "24"], a: "12" },
  { d: 6, t: "Hech bir shoir dangasa emas. Ba'zi dangasalar olim. Qaysi xulosa ALBATTA to'g'ri?", o: ["Ba'zi olimlar shoir emas", "Hech bir olim shoir emas", "Ba'zi shoirlar olim", "Barcha olimlar dangasa"], a: "Ba'zi olimlar shoir emas" },
  { d: 6, t: "Doirani 4 ta to'g'ri chiziq bilan ko'pi bilan nechta bo'lakka bo'lish mumkin?", o: ["11", "8", "10", "16"], a: "11" },
  { d: 6, t: "Soat har kuni 6 daqiqa orqada qoladi. U necha kundan keyin yana birinchi marta aniq vaqtni ko'rsatadi (12 soatlik siferblat)?", o: ["120", "240", "60", "360"], a: "120" },
  { d: 7, t: "Bir oyning 3 ta yakshanbasi juft sanaga to'g'ri keldi. Shu oyning 20-sanasi qaysi kun?", o: ["Payshanba", "Shanba", "Seshanba", "Juma"], a: "Payshanba" },
  { d: 7, t: "Javonda 3 tomlik kitob tartib bilan turibdi (1, 2, 3 chapdan o'ngga, orqa tomoni bizga qaragan). Har tomning sahifalari 2 sm, har bir muqova 2 mm. Qurt 1-tomning birinchi sahifasidan 3-tomning oxirgi sahifasigacha teshib o'tdi. Necha sm?", o: ["2.8", "6.8", "6.4", "2.4"], a: "2.8" },
  { d: 7, t: "Soat 9:00 dan keyin soat va minut millari birinchi marta taxminan qachon ustma-ust tushadi?", o: ["9:49", "9:45", "9:50", "9:54"], a: "9:49" },
];

const NAMES = ["Aziz", "Bekzod", "Dilnoza", "Malika", "Sardor", "Nodira", "Jasur", "Kamola", "Otabek", "Zarina", "Farrux", "Lobar"];

function genOrdering(level) {
  const n = level >= 4 ? 5 : 4;
  const people = shuffle(NAMES).slice(0, n);
  const adj = pick([["baland", "eng baland", "eng past"], ["katta (yoshda)", "eng katta", "eng kichik"], ["tez", "eng tez", "eng sekin"]]);
  const facts = []; for (let i = 0; i < n - 1; i++) facts.push(`${people[i]} ${people[i + 1]}dan ${adj[0]}.`);
  const mode = level >= 4 ? "second" : Math.random() < 0.5 ? "top" : "bottom";
  const target = mode === "top" ? people[0] : mode === "bottom" ? people[n - 1] : people[1];
  const q = mode === "top" ? adj[1] : mode === "bottom" ? adj[2] : `${adj[1]}idan keyingi (2-o'rinda)`;
  return { cat: "verbal", diff: Math.min(5, level), text: `${shuffle(facts).join(" ")} Kim ${q}?`, options: shuffle([target, ...shuffle(people.filter((p) => p !== target)).slice(0, 3)]), answer: target };
}

// O'rindiqlar jumbog'i: yagona yechimgacha shartlar qo'shiladi (to'liq tekshiruv bilan)
function perms(a) { if (a.length <= 1) return [a]; return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])); }
function genSeating(level) {
  const n = level >= 7 ? 6 : 5;
  const people = shuffle(NAMES).slice(0, n);
  const truth = shuffle(people);
  const pos = (arr, x) => arr.indexOf(x);
  const makeClue = () => {
    const [x, y] = shuffle(people);
    const t = pick(["adjL", "gap1", "notAdj", "leftOf", "edge", "notEdge"]);
    const px = pos(truth, x), py = pos(truth, y);
    switch (t) {
      case "adjL": return px === py - 1 ? { t: `${x} ${y}ning bevosita chap tomonida o'tiradi.`, f: (a) => pos(a, x) === pos(a, y) - 1 } : null;
      case "gap1": return Math.abs(px - py) === 2 ? { t: `${x} va ${y} o'rtasida aynan bitta kishi bor.`, f: (a) => Math.abs(pos(a, x) - pos(a, y)) === 2 } : null;
      case "notAdj": return Math.abs(px - py) > 1 ? { t: `${x} va ${y} yonma-yon o'tirmaydi.`, f: (a) => Math.abs(pos(a, x) - pos(a, y)) > 1 } : null;
      case "leftOf": return px < py ? { t: `${x} ${y}dan chapda (yonida bo'lishi shart emas).`, f: (a) => pos(a, x) < pos(a, y) } : null;
      case "edge": return px === 0 || px === n - 1 ? { t: `${x} chetda o'tiradi.`, f: (a) => pos(a, x) === 0 || pos(a, x) === n - 1 } : null;
      case "notEdge": return px !== 0 && px !== n - 1 ? { t: `${x} chetda o'tirmaydi.`, f: (a) => pos(a, x) !== 0 && pos(a, x) !== n - 1 } : null;
    }
  };
  let all = perms(people); const clues = []; let guard = 0;
  while (all.length > 1 && guard++ < 400) {
    const c = makeClue(); if (!c || clues.some((k) => k.t === c.t)) continue;
    const next = all.filter(c.f);
    if (next.length < all.length) { clues.push(c); all = next; }
  }
  if (all.length !== 1 || clues.length > (n === 6 ? 8 : 7)) return genSeating(level);
  const askIdx = n === 5 ? pick([2, 1, 3]) : pick([1, 2, 3, 4]);
  const askTxt = askIdx === 2 && n === 5 ? "o'rtada" : `chapdan ${askIdx + 1}-o'rinda`;
  const target = truth[askIdx];
  return {
    cat: "verbal", diff: n === 6 ? 7 : 6,
    text: `${n} kishi — ${shuffle(people).join(", ")} — bir qatorda (chapdan o'ngga) o'tiribdi. ${clues.map((c) => c.t).join(" ")} Kim ${askTxt} o'tiradi?`,
    options: shuffle([target, ...shuffle(people.filter((p) => p !== target)).slice(0, 4)]), answer: target,
  };
}

// Kodlash: so'z → shifr
const WORDS = ["KITOB", "QALAM", "DAFTAR", "MAKTAB", "BOZOR", "DARYO", "TOSH", "OLMA", "SAMO", "BULUT", "QUYOSH", "VATAN", "BAHOR", "MEVA", "YULDUZ"];
function genCode(level) {
  const shiftCh = (ch, k) => ALPHA[(ALPHA.indexOf(ch) + k + 26) % 26];
  const k = rnd(1, 3);
  const kinds = level <= 4 ? ["shift"] : level === 5 ? ["shift", "rev"] : ["rev", "alt"];
  const kind = pick(kinds);
  const enc = (w, kk = k, kd = kind) => {
    const base = kd === "rev" ? [...w].reverse() : [...w];
    return base.map((ch, i) => shiftCh(ch, kd === "alt" ? (i % 2 ? -kk : kk) : kk)).join("");
  };
  const [w1, w2] = shuffle(WORDS).slice(0, 2);
  const ans = enc(w2);
  const cand = [enc(w2, k + 1), enc(w2, k - 1 || -1), enc(w2, k, kind === "rev" ? "shift" : "rev"), enc(w2, k, kind === "alt" ? "shift" : "alt"), [...ans].reverse().join("")];
  const opts = uniq([ans, ...cand.filter((c) => c !== ans)]).slice(0, 4);
  return { cat: "verbal", diff: kind === "shift" ? 4 : kind === "rev" ? 5 : 6, text: `Maxfiy kodda ${w1} so'zi ${enc(w1)} deb yoziladi. Shu kodda ${w2} qanday yoziladi?`, options: shuffle(opts), answer: ans };
}

function genVerbal(level, used) {
  const r = Math.random();
  if (level >= 6 && r < 0.4) return genSeating(level);
  if (level >= 4 && r < 0.6 && r >= 0.4) return genCode(level);
  if (level <= 5 && r < 0.2) return genOrdering(level);
  const pool = VERBAL.filter((v) => Math.abs(v.d - level) <= 1 && !used.has(v.t));
  if (!pool.length) return level >= 6 ? genSeating(level) : level >= 4 ? genCode(level) : genOrdering(level);
  const exact = pool.filter((v) => v.d === level);
  const v = pick(exact.length ? exact : pool); used.add(v.t);
  return { cat: "verbal", diff: v.d, text: v.t, options: shuffle(v.o), answer: v.a };
}

/* =========================================================
   YANGI SAVOL TURLARI
   ========================================================= */
const B = (s) => `<b>${s}</b>`;

// 3) Ortiqcha shakl: 4 tasi bitta qoidaga bo'ysunadi, bittasi boshqacha
function genOddShape(level) {
  const color = pick(COLORS);
  const attrs = ["shape", "fill", "count", "rot"];
  const odd = pick(attrs);
  const fills = ["none", "half", "solid"];
  const base = { shape: pick(["triangle", "star", "square", "hex"]), fill: pick(fills), count: rnd(1, 3), rot: 0, color };
  if (odd === "rot") base.shape = pick(["triangle", "star"]);
  const items = Array.from({ length: 5 }, () => ({ ...base }));
  // yuqori darajada boshqa bir atribut ham o'zgaradi (3+2 taqsimotda — yolg'iz qiymat paydo bo'lmasin)
  if (level >= 3) {
    const vary = pick(attrs.filter((a) => a !== odd && a !== "rot"));
    const vals = vary === "shape" ? shuffle(["triangle", "star"]).slice(0, 2) : vary === "fill" ? shuffle(fills).slice(0, 2) : shuffle([1, 2, 3]).slice(0, 2);
    shuffle([0, 0, 0, 1, 1]).forEach((v, i) => (items[i][vary] = vals[v]));
    if (vary === "shape" && odd === "rot") items.forEach((it) => (it.shape = it.shape === "hex" ? "triangle" : it.shape));
  }
  const oi = rnd(0, 4);
  const o = items[oi];
  if (odd === "shape") o.shape = pick(SHAPES.filter((s) => !items.some((it, i) => i !== oi && it.shape === s)));
  if (odd === "fill") o.fill = pick(fills.filter((f) => f !== base.fill && !items.some((it, i) => i !== oi && it.fill === f)));
  if (odd === "count") o.count = pick([1, 2, 3, 4].filter((c) => !items.some((it, i) => i !== oi && it.count === c)));
  if (odd === "rot") { items.forEach((it, i) => (it.rot = i === oi ? 180 : 0)); }
  if (!o.shape || !o.fill || !o.count) return genOddShape(level);
  return { cat: "matrix", diff: Math.min(6, level + (level >= 3 ? 1 : 0)), text: "Qaysi shakl boshqalarga o'xshamaydi (ortiqcha)?", options: items.map((_, i) => "o" + i), optionSVG: items.map((it) => svgWrap(shapeCell(it))), answer: "o" + oi, visual: true };
}

// 4) Shakllar qatori: nuqtalar aylana bo'ylab harakatlanadi — keyingi holat qaysi?
function orbitSVG(dots) {
  const c = 45, R = 30;
  let g = `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"/>`;
  for (let k = 0; k < 8; k++) { const a = (k * 45 - 90) * Math.PI / 180; g += `<circle cx="${(c + R * Math.cos(a)).toFixed(1)}" cy="${(c + R * Math.sin(a)).toFixed(1)}" r="3" fill="rgba(255,255,255,.18)"/>`; }
  for (const d of dots) { const a = (d.p * 45 - 90) * Math.PI / 180; g += `<circle cx="${(c + R * Math.cos(a)).toFixed(1)}" cy="${(c + R * Math.sin(a)).toFixed(1)}" r="${d.big ? 9 : 7}" fill="${d.col}"/>`; }
  return svgWrap(g);
}
function genFigureSeries(level) {
  const n = level <= 2 ? 1 : level <= 5 ? 2 : 3;
  const cols = ["#ff4fd8", "#00d4ff", "#ffc94d"];
  const dots = Array.from({ length: n }, (_, i) => ({ s: rnd(0, 7), step: pick(level <= 2 ? [1, 2] : [1, 2, 3, -1, -2]) * (i === 2 ? 1 : 1), col: cols[i], big: i === 0 }));
  if (n >= 2 && dots[0].step === dots[1].step) dots[1].step = -dots[0].step || 1;
  const at = (k) => dots.map((d) => ({ ...d, p: (((d.s + d.step * k) % 8) + 8) % 8 }));
  const shown = [0, 1, 2, 3].map(at);
  const ans = at(4);
  const key = (ds) => ds.map((d) => d.p).join("-");
  const cands = [ans];
  const seen = new Set([key(ans)]);
  for (let t = 0; t < 40 && cands.length < 5; t++) {
    const v = ans.map((d) => ({ ...d }));
    const j = rnd(0, n - 1); v[j].p = (v[j].p + pick([1, -1, 2, 4]) + 8) % 8;
    if (!seen.has(key(v))) { seen.add(key(v)); cands.push(v); }
  }
  const sh = shuffle(cands);
  const row = shown.map((ds) => `<div style="width:84px">${orbitSVG(ds)}</div>`).join("") + `<div class="qmark">?</div>`;
  return { cat: "matrix", diff: Math.min(7, 2 + n * 1.5 | 0), text: n === 1 ? "Nuqta har qadamda ma'lum qoida bilan siljiydi. Keyingi holat qaysi?" : `${n} ta nuqta har biri o'z qoidasi bilan siljiydi. Keyingi holat qaysi?`, svg: `<div class="steps">${row}</div>`, options: sh.map(key), optionSVG: sh.map(orbitSVG), answer: key(ans), visual: true };
}

// 9) Yetishmayotgan son (tenglama)
function genMissingNum(level) {
  let text, ans;
  if (level <= 2) { const a = rnd(5, 40), x = rnd(3, 30); text = `${a} + ? = ${a + x}`; ans = x; }
  else if (level <= 4) { const a = rnd(3, 9), x = rnd(3, 12), b = rnd(2, 20); text = `${a} × ? + ${b} = ${a * x + b}`; ans = x; }
  else if (level <= 6) { const a = rnd(2, 8), b = rnd(3, 7), x = rnd(2, 12), c = rnd(1, 15); text = `(? + ${a}) × ${b} − ${c} = ${(x + a) * b - c}`; ans = x; }
  else { const x = rnd(4, 15), a = rnd(2, 30), b = rnd(2, 5); text = `?² − ${a} = ${x * x - a} ${B("va")} ? > 0, keyin ? × ${b} = ?`; ans = x * b; return { cat: "numeric", diff: 7, text: `Avval ? ni toping: ?² − ${a} = ${x * x - a} (? > 0). Javob: ? × ${b} nechaga teng?`, options: numOpts(ans, [x, ans + b, ans - b]), answer: String(ans) }; }
  return { cat: "numeric", diff: Math.min(7, level), text: `Tenglamadagi ? o'rniga qaysi son keladi?  ${text}`, options: numOpts(ans, [ans + 1, ans - 1, ans * 2]), answer: String(ans) };
}

// 10) Kasr, o'nli kasr va foizlarni solishtirish
function genFractions(level) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const mk = () => { const d = pick(level <= 2 ? [8] : [3, 4, 5, 6, 7, 8, 9, 10, 12]); const n = rnd(1, d - 1); return { n, d }; };
  const show = (f, i) => { if (level >= 5 && i % 3 === 1) return `${Math.round((f.n / f.d) * 1000) / 10}%`; if (level >= 5 && i % 3 === 2) return String(Math.round((f.n / f.d) * 1000) / 1000).replace(".", ","); return `${f.n}/${f.d}`; };
  for (let t = 0; t < 50; t++) {
    const fs = Array.from({ length: 4 }, mk);
    const vals = fs.map((f) => f.n / f.d);
    const max = Math.max(...vals);
    if (vals.filter((v) => Math.abs(v - max) < 1e-9).length !== 1) continue;
    if (level >= 5 && vals.some((v, i) => i !== vals.indexOf(max) && max - v < 0.02)) continue;
    if (level >= 5 && vals.some((v) => Math.abs(v * 1000 - Math.round(v * 1000)) > 1e-6 && false)) continue;
    const labels = fs.map(show);
    if (new Set(labels).size !== 4) continue;
    return { cat: "numeric", diff: level <= 2 ? 2 : level <= 4 ? 4 : 5, text: "Qaysi biri eng katta?", options: shuffle(labels), answer: labels[vals.indexOf(max)] };
  }
  return genMissingNum(level);
}

// 16) Rostgo'y va yolg'onchilar (yagona yechim avtomatik tekshiriladi)
function genKnights(level) {
  const n = level <= 4 ? 2 : 3;
  const P = shuffle(["Ali", "Vali", "Sobir", "Lola", "Dilya", "Karim"]).slice(0, n);
  const tmpl = [
    (a, b) => ({ t: `"${P[b]} yolg'onchi."`, f: (w) => !w[b] }),
    (a, b) => ({ t: `"${P[b]} rostgo'y."`, f: (w) => w[b] }),
    (a, b) => ({ t: `"Men va ${P[b]} — bir xil turdagi odamlarmiz."`, f: (w) => w[a] === w[b] }),
    (a, b) => ({ t: `"Men va ${P[b]} — har xil turdagi odamlarmiz."`, f: (w) => w[a] !== w[b] }),
    () => ({ t: `"Bizdan kamida bittasi yolg'onchi."`, f: (w) => w.some((x) => !x) }),
    () => ({ t: `"Bizning hammamiz yolg'onchimiz."`, f: (w) => w.every((x) => !x) }),
  ];
  const worlds = Array.from({ length: 2 ** n }, (_, m) => Array.from({ length: n }, (_, i) => !!(m >> i & 1)));
  for (let t = 0; t < 300; t++) {
    const st = P.map((_, a) => { const others = P.map((_, i) => i).filter((i) => i !== a); return pick(tmpl)(a, pick(others)); });
    // har kim o'z turiga mos gapiradi: rostgo'y — rost, yolg'onchi — yolg'on
    const ok = worlds.filter((w) => st.every((s, i) => s.f(w) === w[i]));
    if (ok.length !== 1) continue;
    const W = ok[0];
    const fmt = (w) => P.map((p, i) => `${p} — ${w[i] ? "rostgo'y" : "yolg'onchi"}`).join(", ");
    const opts = [fmt(W), ...shuffle(worlds.filter((w) => w.join() !== W.join())).slice(0, 3).map(fmt)];
    return { cat: "verbal", diff: n === 2 ? 4 : level >= 7 ? 7 : 6, text: `Orolda har kim yo doim rost, yo doim yolg'on gapiradi. ${P.map((p, i) => `${p}: ${st[i].t}`).join(" ")} Kim kim?`, options: shuffle(opts), answer: fmt(W) };
  }
  return genOrdering(level);
}

// 11–12) So'z analogiyasi va mantiqiy masalalar (bankdan, alohida turlar)
const isAnalogy = (v) => /:/.test(v.t) || /ortiqcha|o'xshamaydi/i.test(v.t);
function genFromBank(level, used, filter, fallback) {
  const pool = VERBAL.filter((v) => filter(v) && Math.abs(v.d - level) <= 1 && !used.has(v.t));
  const any = VERBAL.filter((v) => filter(v) && !used.has(v.t));
  const src = pool.length ? pool : any;
  if (!src.length) return fallback(level);
  const exact = src.filter((v) => v.d === level);
  const v = pick(exact.length ? exact : src); used.add(v.t);
  return { cat: "verbal", diff: v.d, text: v.t, options: shuffle(v.o), answer: v.a };
}
const WORD_PAIRS = [
  ["Qalam", "Yozish", "Qaychi", "Kesish"], ["Baliq", "Suv", "Qush", "Havo"], ["Shifokor", "Bemor", "O'qituvchi", "O'quvchi"], ["Non", "Novvoy", "Mebel", "Duradgor"],
  ["Kun", "Tun", "Yoz", "Qish"], ["Barg", "Daraxt", "Sahifa", "Kitob"], ["Ko'z", "Ko'rish", "Burun", "Hidlash"], ["Muz", "Suv", "Bug'", "Suv"],
  ["Soat", "Vaqt", "Termometr", "Harorat"], ["Bola", "Odam", "Kuchuk", "It"], ["G'isht", "Devor", "So'z", "Gap"], ["Paxta", "Mato", "Bug'doy", "Un"],
];
function genWordAnalogy(level, used) {
  if (Math.random() < 0.5) return genFromBank(level, used, isAnalogy, () => genWordAnalogy(level, new Set()));
  const p = pick(WORD_PAIRS.filter((x) => !used.has(x.join()))) || pick(WORD_PAIRS); used.add(p.join());
  const wrong = shuffle([...new Set(WORD_PAIRS.filter((x) => x !== p).flat())].filter((w) => w !== p[3] && w !== p[2])).slice(0, 3);
  return { cat: "verbal", diff: Math.min(4, Math.max(2, level)), text: `${p[0]} : ${p[1]} = ${p[2]} : ?`, options: shuffle([p[3], ...wrong]), answer: p[3] };
}
function genLogicBank(level, used) { return genFromBank(level, used, (v) => !isAnalogy(v), (L) => (L >= 6 ? genSeating(L) : genOrdering(L))); }

// 18b) Oynadagi aks
function genMirror(level) {
  const n = level <= 2 ? 5 : level <= 4 ? 6 : 7;
  let base, guard = 0;
  do { base = polyomino(n); guard++; } while ((allRots(base).some((r) => sig(r) === sig(mirror(base))) || uniq(allRots(base).map(sig)).length < 4) && guard < 400);
  const R = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x]];
  const M = ([x, y]) => [-x, y];
  const correct = tr(base, M);
  const wrong = [tr(base, R[1]), tr(base, R[2]), tr(base, (p) => R[1](M(p))), tr(base, (p) => R[2](M(p)))];
  const items = shuffle([{ c: correct, ok: true }, ...shuffle(wrong).slice(0, level >= 5 ? 4 : 3).map((c) => ({ c, ok: false }))]);
  return { cat: "spatial", diff: Math.min(7, level + 1), text: "Shakl o'ng tomonidagi vertikal ko'zguga qaradi. Ko'zgudagi aksi qaysi? (pushti katak yo'nalishni ko'rsatadi)", svg: `<div style="width:130px">${polySVG(tr(base, (p) => p))}</div>`, options: items.map((_, i) => "m" + i), optionSVG: items.map((it) => polySVG(it.c)), answer: "m" + items.findIndex((it) => it.ok), visual: true };
}

// P1) Kublarni sanash (izometrik, hech qaysi ustun yashirin emas)
function genCubeCount(level) {
  const n = level <= 3 ? 2 : 3, maxH = level <= 3 ? 2 : level <= 5 ? 3 : 4;
  const h = Array.from({ length: n }, () => Array(n).fill(0));
  // orqadan oldinga balandlik kamaymaydigan zinapoya — barcha ustunlar ko'rinadi
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const lim = Math.min(r ? h[r - 1][c] : maxH, c ? h[r][c - 1] : maxH); h[r][c] = rnd(r === 0 && c === 0 ? 1 : 0, lim); }
  const total = h.flat().reduce((a, b) => a + b, 0);
  if (total < 3) return genCubeCount(level);
  const s = 30, ox = n * s * 0.87 + 12, oy = maxH * s + 12;
  const iso = (x, y, z) => [ox + (x - y) * s * 0.87, oy + (x + y) * s * 0.5 - z * s];
  let g = "";
  // chizish tartibi: orqadan oldinga, pastdan tepaga
  for (let sum = 0; sum <= 2 * (n - 1); sum++) for (let r = 0; r < n; r++) { const c = sum - r; if (c < 0 || c >= n) continue; for (let z = 0; z < h[r][c]; z++) {
    const x = c, y = r;
    const P = (a, b, cz) => iso(x + a, y + b, z + cz).map((v) => v.toFixed(1)).join(",");
    g += `<polygon points="${P(0, 0, 1)} ${P(1, 0, 1)} ${P(1, 1, 1)} ${P(0, 1, 1)}" fill="#8ed8ff" stroke="#0b0b1a" stroke-width="1.3" stroke-linejoin="round"/>`;
    g += `<polygon points="${P(1, 0, 0)} ${P(1, 1, 0)} ${P(1, 1, 1)} ${P(1, 0, 1)}" fill="#3a8fd0" stroke="#0b0b1a" stroke-width="1.3" stroke-linejoin="round"/>`;
    g += `<polygon points="${P(0, 1, 0)} ${P(1, 1, 0)} ${P(1, 1, 1)} ${P(0, 1, 1)}" fill="#5bb4ea" stroke="#0b0b1a" stroke-width="1.3" stroke-linejoin="round"/>`;
  } }
  return { cat: "spatial", diff: Math.min(7, 3 + (n === 3 ? 2 : 0) + (maxH >= 4 ? 1 : 0)), text: "Rasmda nechta kubik bor? (Kubiklar havoda turmaydi — har birining tagida kubik yoki pol bor)", svg: `<svg viewBox="0 0 ${(2 * n * s * 0.87 + 24).toFixed(0)} ${maxH * s + n * s + 24}" width="${n === 2 ? 200 : 250}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`, options: numOpts(total, [total + 1, total - 1, total + 2, total - 2]), answer: String(total) };
}

// P2) Soat millari orasidagi burchak
function genClock(level) {
  const hh = rnd(1, 12), mm = level <= 4 ? pick([0, 15, 30, 45]) : level <= 5 ? rnd(0, 11) * 5 : rnd(1, 59);
  let ang = Math.abs(30 * (hh % 12) - 5.5 * mm); if (ang > 180) ang = 360 - ang;
  const fmt = (a) => (Number.isInteger(a) ? `${a}°` : `${a.toFixed(1).replace(".", ",")}°`);
  const wrong = [Math.abs(30 * (hh % 12) - 6 * mm) % 360, (ang + 30) % 360, Math.abs(ang - 15), 360 - ang].map((a) => (a > 180 ? 360 - a : a));
  const opts = [...new Set([fmt(ang), ...wrong.map(fmt)])].slice(0, 4);
  if (opts.length < 4) return genClock(level);
  const c = 45, ha = ((hh % 12) * 30 + mm * 0.5 - 90) * Math.PI / 180, ma = (mm * 6 - 90) * Math.PI / 180;
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<line x1="${c + 32 * Math.cos(a)}" y1="${c + 32 * Math.sin(a)}" x2="${c + 37 * Math.cos(a)}" y2="${c + 37 * Math.sin(a)}" stroke="#b9a8ff" stroke-width="2"/>`; }).join("");
  const svg = svgWrap(`<circle cx="${c}" cy="${c}" r="40" fill="rgba(255,255,255,.06)" stroke="#7c5cff" stroke-width="3"/>${ticks}<line x1="${c}" y1="${c}" x2="${c + 20 * Math.cos(ha)}" y2="${c + 20 * Math.sin(ha)}" stroke="#ffc94d" stroke-width="4" stroke-linecap="round"/><line x1="${c}" y1="${c}" x2="${c + 31 * Math.cos(ma)}" y2="${c + 31 * Math.sin(ma)}" stroke="#00d4ff" stroke-width="3" stroke-linecap="round"/><circle cx="${c}" cy="${c}" r="3" fill="#fff"/>`);
  return { cat: "numeric", diff: level <= 4 ? 4 : level <= 5 ? 5 : 7, text: `Soat ${hh}:${String(mm).padStart(2, "0")} da soat va minut millari orasidagi (kichik) burchak necha gradus?`, svg: `<div style="width:150px">${svg}</div>`, options: shuffle(opts), answer: fmt(ang) };
}

// P3) Ish tezligi masalalari
function genWork(level) {
  const together = [[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [6, 3, 2], [12, 4, 3]];
  const pipes = [[2, 3, 6], [3, 4, 12], [4, 6, 12], [6, 10, 15], [5, 20, 20 / 3]].filter((x) => Number.isInteger(x[2]));
  if (level >= 6) {
    const [a, b, ans] = pick(pipes);
    return { cat: "numeric", diff: 6, text: `Hovuzni 1-quvur ${a} soatda to'ldiradi, 2-quvur esa to'la hovuzni ${b} soatda bo'shatadi. Ikkalasi birga ochilsa, bo'sh hovuz necha soatda to'ladi?`, options: numOpts(ans, [ans + 1, b - a, a + b, ans * 2]), answer: String(ans) };
  }
  const [a, b, ans] = pick(together);
  return { cat: "numeric", diff: level <= 3 ? 4 : 5, text: `Bir ishni Aziz ${a} soatda, Bekzod ${b} soatda bajaradi. Ikkalasi birga ishlasa, necha soatda tugatadi?`, options: numOpts(ans, [(a + b) / 2 | 0, Math.abs(a - b), ans + 1, a + b]), answer: String(ans) };
}

// P4) Belgili tenglamalar
function genSymbols(level) {
  const S = shuffle(["★", "●", "▲", "■", "◆"]);
  const [a, b, c] = [rnd(2, 9), rnd(2, 9), rnd(2, 6)];
  const eqs = [`${S[0]} + ${S[0]} = ${2 * a}`, `${S[0]} + ${S[1]} = ${a + b}`];
  let ask, ans;
  if (level <= 4) { ask = `${S[1]} × ${S[0]} = ?`; ans = a * b; }
  else { eqs.push(`${S[1]} − ${S[2]} = ${b - c}`); ask = level >= 6 ? `${S[0]} × ${S[2]} + ${S[1]} = ?` : `${S[2]} + ${S[0]} = ?`; ans = level >= 6 ? a * c + b : c + a; }
  return { cat: "numeric", diff: level <= 4 ? 3 : level >= 6 ? 6 : 5, text: `Har bir belgi bitta sonni bildiradi:  ${eqs.join(";  ")}.  ${ask}`, options: numOpts(ans, [ans + 1, ans - 1, a + b + c, a * b]), answer: String(ans) };
}

/* =========================================================
   SAVOL TURLARI RO'YXATI VA TEST JADVALI
   ========================================================= */
export const TYPES = [
  // bepul testdagi 18 tur
  { id: "shapeMatrix", cat: "matrix", name: "Shakl matritsasi", gen: (L) => genShapeMatrix(L) },
  { id: "logicMatrix", cat: "matrix", name: "Mantiqiy matritsa", gen: (L) => genLogicMatrix(Math.max(L, 3)) },
  { id: "oddShape", cat: "matrix", name: "Ortiqcha shakl", gen: (L) => genOddShape(L) },
  { id: "figureSeries", cat: "matrix", name: "Shakllar qatori", gen: (L) => genFigureSeries(L) },
  { id: "sequence", cat: "numeric", name: "Son ketma-ketligi", gen: (L) => genSequence(L) },
  { id: "numberGrid", cat: "numeric", name: "Sonli jadval", gen: (L) => genNumberGrid(L) },
  { id: "numAnalogy", cat: "numeric", name: "Son analogiyasi", gen: (L) => genAnalogy(L) },
  { id: "letters", cat: "numeric", name: "Harflar qatori", gen: (L) => genLetters(L) },
  { id: "missingNum", cat: "numeric", name: "Yetishmayotgan son", gen: (L) => genMissingNum(L) },
  { id: "wordAnalogy", cat: "verbal", name: "So'z analogiyasi", gen: (L, u) => genWordAnalogy(L, u) },
  { id: "logicBank", cat: "verbal", name: "Mantiqiy masala", gen: (L, u) => genLogicBank(L, u) },
  { id: "ordering", cat: "verbal", name: "Tartiblash", gen: (L) => genOrdering(L) },
  { id: "seating", cat: "verbal", name: "O'rindiq jumbog'i", gen: (L) => genSeating(L) },
  { id: "code", cat: "verbal", name: "Shifr", gen: (L) => genCode(Math.max(L, 4)) },
  { id: "knights", cat: "verbal", name: "Rostgo'y va yolg'onchi", gen: (L) => genKnights(L) },
  { id: "rotation", cat: "spatial", name: "Aylantirish", gen: (L) => genRotation(L) },
  { id: "mirror", cat: "spatial", name: "Ko'zgudagi aks", gen: (L) => genMirror(L) },
  { id: "paperFold", cat: "spatial", name: "Qog'oz buklash", gen: (L) => genPaperFold(Math.max(L, 4)) },
  // Premium uchun qo'shimcha 6 tur
  { id: "cubeNet", cat: "spatial", name: "Kub yoyilmasi", premium: true, gen: (L) => genCube(L) },
  { id: "cubeCount", cat: "spatial", name: "Kublarni sanash", premium: true, gen: (L) => genCubeCount(L) },
  { id: "fractions", cat: "numeric", name: "Kasrlar", premium: true, gen: (L) => genFractions(L) },
  { id: "clock", cat: "numeric", name: "Soat burchagi", premium: true, gen: (L) => genClock(L) },
  { id: "work", cat: "numeric", name: "Ish tezligi", premium: true, gen: (L) => genWork(L) },
  { id: "symbols", cat: "numeric", name: "Belgili tenglama", premium: true, gen: (L) => genSymbols(L) },
];
export function genType(id, level, used = new Set()) {
  const t = TYPES.find((x) => x.id === id);
  const L = Math.max(1, Math.min(7, Math.round(level)));
  const q = t.gen(L, used);
  q.type = id; q.cat = t.cat;
  return q;
}
// Bepul: 18 tur × 2 = 36. Premium: 24 tur, jami 60 (12 tasi 3 martadan, 12 tasi 2 martadan).
// Bir xil tur ketma-ket kelmaydi.
export function buildSchedule(premium) {
  const types = TYPES.filter((t) => premium || !t.premium).map((t) => t.id);
  let bag = types.flatMap((id) => [id, id]);
  if (premium) bag = bag.concat(shuffle(types).slice(0, 12));
  for (let attempt = 0; attempt < 200; attempt++) {
    const s = shuffle(bag);
    let ok = true;
    for (let i = 1; i < s.length; i++) if (s[i] === s[i - 1]) { ok = false; break; }
    if (ok) return s;
  }
  // zaxira: ketma-ketlikni qo'lda tuzatish
  const s = shuffle(bag);
  for (let i = 1; i < s.length; i++) if (s[i] === s[i - 1]) { const j = s.findIndex((x, k) => k > i && x !== s[i] && s[k - 1] !== s[i] && s[k + 1] !== s[i]); if (j > 0) [s[i], s[j]] = [s[j], s[i]]; }
  return s;
}

/* =========================================================
   API
   ========================================================= */
export function genItem(cat, level, used = new Set()) {
  const pool = TYPES.filter((t) => t.cat === cat);
  return genType(pick(pool).id, level, used);
}

// Statik test (eski usul / tekshiruv uchun): har kategoriyadan teng, qiyinlik oshib boradi
export function buildTest(total = 36) {
  const used = new Set(); const out = []; const cats = Object.keys(CATEGORIES);
  const per = total / 4;
  for (let i = 0; i < per; i++) {
    const level = 1 + Math.floor((i / per) * 7);
    for (const c of shuffle(cats)) { const q = genItem(c, level, used); q.id = out.length; out.push(q); }
  }
  return out;
}

import { CATEGORIES } from "./questions.js";

/* ================= IRT (3 parametrli logistik model) =================
   P(to'g'ri | θ) = c + (1 − c) / (1 + e^(−a(θ − b)))
   θ — qobiliyat (o'rtacha 0, SD 1), b — savol qiyinligi (daraja 1..7 → −2.7..+2.7),
   a — farqlash kuchi, c — taxmin qilish ehtimoli (1 / variantlar soni).
   Qobiliyat EAP (posterior o'rtacha) usulida, N(0,1) prior bilan baholanadi.
   IQ = 100 + 15·θ (yosh normasi bilan tuzatilgan), 95% ishonch oralig'i = ±1.96·SE·15. */

export const levelToB = (L) => -2.7 + (L - 1) * 0.9;
const A = 1.5;
const GRID = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05);

export function pCorrect(theta, item) {
  const c = 1 / Math.max(2, item.nOpt || item.options?.length || 4);
  return c + (1 - c) / (1 + Math.exp(-A * (theta - levelToB(item.diff))));
}

// responses: [{ diff, nOpt, correct }]
export function estimate(responses) {
  let sw = 0, sm = 0, s2 = 0;
  for (const t of GRID) {
    let lp = -(t * t) / 2.88; // prior N(0, 1.2²) — chekkalarda siqilishni kamaytiradi
    for (const r of responses) { const p = pCorrect(t, r); lp += Math.log(r.correct ? p : 1 - p); }
    const w = Math.exp(lp); sw += w; sm += w * t; s2 += w * t * t;
  }
  const mean = sm / sw;
  const sd = Math.sqrt(Math.max(1e-6, s2 / sw - mean * mean));
  return { theta: mean, se: sd };
}

// Yosh normasi: bolalar va keksalar uchun xom qobiliyat o'z yosh guruhiga nisbatan baholanadi.
// (Taxminiy egri chiziq — Wechsler/Raven yosh normalarining umumiy shakliga asoslangan.)
export function ageOffset(age) {
  if (!age) return 0;
  const pts = [[8, 2.2], [10, 1.6], [12, 1.05], [14, 0.6], [16, 0.25], [18, 0.05], [20, 0], [45, 0], [55, 0.15], [65, 0.45], [75, 0.85], [85, 1.3]];
  if (age <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (age <= pts[i][0]) { const [a0, v0] = pts[i - 1], [a1, v1] = pts[i]; return v0 + ((age - a0) / (a1 - a0)) * (v1 - v0); }
  }
  return pts[pts.length - 1][1];
}

const erf = (x) => {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
export const percentileOf = (iq) => Math.min(99.9, Math.max(0.1, Math.round(50 * (1 + erf((iq - 100) / 15 / Math.SQRT2)) * 10) / 10));
const toIQ = (theta) => Math.round(Math.max(40, Math.min(175, 100 + 15 * theta)));

// items: [{cat, diff, nOpt, correct, time, answered}]
export function score(items, age, usedSeconds) {
  const est = estimate(items);
  const off = ageOffset(age);
  const iq = toIQ(est.theta + off);
  const ci = Math.max(3, Math.round(1.96 * est.se * 15));
  const cats = {};
  for (const k of Object.keys(CATEGORIES)) {
    const its = items.filter((x) => x.cat === k);
    const e = its.length ? estimate(its) : { theta: 0, se: 1 };
    const idx = toIQ(e.theta + off);
    cats[k] = { right: its.filter((x) => x.correct).length, total: its.length, index: idx, pct: Math.round(percentileOf(idx)), maxLevel: Math.max(0, ...its.filter((x) => x.correct).map((x) => x.diff)) };
  }
  const answered = items.filter((x) => x.answered);
  const right = items.filter((x) => x.correct).length;
  const hard = items.filter((x) => x.diff >= 5);
  const avgTime = answered.length ? Math.round(answered.reduce((a, b) => a + b.time, 0) / answered.length) : 0;
  return {
    iq, ci, theta: +est.theta.toFixed(3), se: +est.se.toFixed(3), age: age || null,
    percentile: percentileOf(iq),
    right, total: items.length, answered: answered.length,
    accuracy: answered.length ? right / answered.length : 0,
    hardRate: hard.length ? hard.filter((x) => x.correct).length / hard.length : 0,
    maxLevel: Math.max(0, ...items.filter((x) => x.correct).map((x) => x.diff)),
    avgTime, usedSeconds,
    categories: cats,
  };
}

export function band(iq) {
  if (iq >= 145) return "Juda yuqori (daho darajasi)";
  if (iq >= 130) return "Juda yuqori (iqtidorli)";
  if (iq >= 120) return "Yuqori";
  if (iq >= 110) return "O'rtachadan yuqori";
  if (iq >= 90) return "O'rtacha";
  if (iq >= 80) return "O'rtachadan past";
  return "Past";
}

const TIPS = {
  matrix: "Raven matritsalari, sudoku va naqsh topish mashqlari. Premiumdagi \"IQ trener\" aynan shu turdagi savollarni moslashuvchan beradi.",
  numeric: "Kunlik og'zaki hisob, ketma-ketlik jumboqlari. Har bir ketma-ketlikda avval ayirmalarni, keyin ayirmalar ayirmasini tekshiring.",
  verbal: "Analogiya va sillogizm mashqlari, Detektiv ishlari. Xulosa chiqarishda shartlarni qog'ozga sxema qilib yozing.",
  spatial: "Tangram, Rubik kubi, qog'oz buklash. Premiumdagi \"Aylantirish\" o'yini fazoviy tasavvurni tez rivojlantiradi.",
};

export function fivePoints(r) {
  const cats = Object.entries(r.categories).sort((a, b) => b[1].index - a[1].index);
  const [bestK, best] = cats[0];
  const [worstK, worst] = cats[cats.length - 1];
  const speedTxt = r.avgTime <= 30
    ? `O'rtacha javob vaqti ${r.avgTime} soniya — tez qaror qabul qilish uslubi. ${r.accuracy < 0.55 ? "Shoshilish xatolarga olib kelgan: qiyin savollarda biroz sekinroq ishlang." : "Tezlik va aniqlik muvozanatda."}`
    : `O'rtacha javob vaqti ${r.avgTime} soniya — puxta, mulohazali uslub. ${r.accuracy >= 0.6 ? "Bu yuqori aniqlik bergan." : "Vaqtni taqsimlashni mashq qilsangiz, natija oshadi."}`;
  return [
    { t: `Umumiy natija: IQ ${r.iq} ± ${r.ci} (${band(r.iq)})`, d: `${r.age ? `${r.age} yoshdagilar orasida` : "Aholining"} taxminan ${r.percentile}% idan yuqori. Test moslashuvchan: siz eng ko'pi ${r.maxLevel}-darajali (7 dan) savolni yechdingiz.` },
    { t: `Kuchli tomon: ${CATEGORIES[bestK].name} (indeks ${best.index})`, d: bestK === "spatial" ? "Muhandislik, dizayn, arxitektura sohalariga moyillik bor." : bestK === "verbal" ? "Mantiqiy deduksiya kuchli: huquq, tahlil, menejment sohalarida ustunlik beradi." : bestK === "numeric" ? "Raqamli qonuniyatlarni tez ilg'aysiz: analitika, moliya va dasturlash." : "Abstrakt tafakkur — ilm-fan va strategiyada asosiy ko'nikma." },
    { t: `Rivojlantirish kerak: ${CATEGORIES[worstK].name} (indeks ${worst.index})`, d: TIPS[worstK] },
    { t: "Ishlash uslubi va tezlik", d: speedTxt },
    { t: `Murakkab savollar (5–7 daraja): ${Math.round(r.hardRate * 100)}% to'g'ri`, d: r.hardRate >= 0.5 ? "Qiyin savollarda ham barqarorsiz — bu yuqori \"suyuq intellekt\" belgisi." : "Qiyinlik oshganda natija pasaygan. Premiumdagi Dual N-Back va IQ trener ishchi xotira va abstrakt tafakkurni mashq qildiradi." },
  ];
}

export function deepAnalysis(r) {
  const c = r.categories;
  const fluid = Math.round((c.matrix.index + c.spatial.index) / 2);
  const crystal = Math.round((c.verbal.index + c.numeric.index) / 2);
  const wm = Math.round(c.numeric.index * 0.5 + c.matrix.index * 0.5);
  const ps = Math.max(55, Math.min(145, Math.round(100 + (35 - r.avgTime) * 0.9 + (r.accuracy - 0.5) * 20)));
  const weakest = Object.entries(c).sort((a, b) => a[1].index - b[1].index)[0][0];
  return {
    indices: [
      { k: "Suyuq intellekt (Gf)", v: fluid, d: "Yangi muammolarni oldingi bilimsiz yechish qobiliyati." },
      { k: "Mantiqiy-raqamli (Gq)", v: crystal, d: "Deduksiya, til va son orqali fikrlash." },
      { k: "Ishchi xotira", v: wm, d: "Ma'lumotni ongda ushlab, ustida amallar bajarish." },
      { k: "Qayta ishlash tezligi", v: ps, d: "Ma'lumotni tez va aniq qayta ishlash." },
    ],
    plan: [
      "1-hafta: har kuni 15 daqiqa Dual N-Back (2-back dan boshlang).",
      `2-hafta: IQ trenerda ${CATEGORIES[weakest].name.toLowerCase()} bo'yicha kuniga 20 ta savol.`,
      "3-hafta: Aylantirish va Schulte — har kuni rekordni yangilashga harakat qiling.",
      "4-hafta: 2 ta detektiv ishini maslahatsiz yeching va testni qayta topshiring.",
    ],
    careers: fluid >= crystal ? ["Dasturiy injiniring", "Ma'lumotlar tahlili", "Arxitektura", "Strategik rejalashtirish"] : ["Huquqshunoslik", "Tergov va tahlil", "Ta'lim", "Menejment va konsalting"],
  };
}

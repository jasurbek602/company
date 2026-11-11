import { CATEGORIES } from "./questions.js";

// Qiyinlik og'irliklari (1..5). Xom ball = to'g'ri javoblar og'irliklari yig'indisi.
const W = { 1: 1, 2: 1.4, 3: 1.9, 4: 2.5, 5: 3.2 };

// Normativ shkala: xom ballni maksimal ballga nisbatan foizga o'tkazamiz va
// pilot taqsimot (o'rtacha 52%, SD 17%) asosida z-ballga aylantiramiz.
// IQ = 100 + 15·z (o'rtacha 100, SD 15 — Wechsler shkalasi).
const NORM_MEAN = 0.52;
const NORM_SD = 0.17;

const erf = (x) => {
  // Abramowitz–Stegun yaqinlashuvi
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
export const percentileOf = (iq) => Math.round(50 * (1 + erf((iq - 100) / 15 / Math.SQRT2)) * 10) / 10;

export function score(questions, answers, times, totalSeconds, usedSeconds) {
  let raw = 0, max = 0;
  const cat = {};
  for (const k of Object.keys(CATEGORIES)) cat[k] = { right: 0, total: 0, raw: 0, max: 0 };
  let hardRight = 0, hardTotal = 0, answered = 0;
  questions.forEach((q, i) => {
    const w = W[q.diff] || 1;
    max += w; cat[q.cat].max += w; cat[q.cat].total++;
    if (answers[i] != null) answered++;
    if (q.diff >= 4) hardTotal++;
    if (answers[i] === q.answer) {
      raw += w; cat[q.cat].raw += w; cat[q.cat].right++;
      if (q.diff >= 4) hardRight++;
    }
  });
  const ratio = raw / max;
  // Tezlik tuzatmasi: vaqtning katta qismi qolgan va aniqlik yuqori bo'lsa, kichik bonus (maks +0.15 SD)
  const speed = 1 - usedSeconds / totalSeconds;
  const speedBonus = ratio > 0.5 ? Math.min(0.15, speed * 0.3) : 0;
  const z = (ratio - NORM_MEAN) / NORM_SD + speedBonus;
  const iq = Math.round(Math.max(55, Math.min(160, 100 + 15 * z)));
  const avgTime = answered ? Math.round(times.reduce((a, b) => a + (b || 0), 0) / answered) : 0;
  const right = questions.filter((q, i) => answers[i] === q.answer).length;
  return {
    iq,
    percentile: percentileOf(iq),
    right, total: questions.length, answered,
    accuracy: answered ? right / answered : 0,
    hardRate: hardTotal ? hardRight / hardTotal : 0,
    avgTime, usedSeconds,
    categories: Object.fromEntries(Object.entries(cat).map(([k, v]) => [k, { ...v, pct: v.max ? Math.round((v.raw / v.max) * 100) : 0 }])),
  };
}

export function band(iq) {
  if (iq >= 145) return "Juda yuqori (daho darajasi)";
  if (iq >= 130) return "Juda yuqori";
  if (iq >= 120) return "Yuqori";
  if (iq >= 110) return "O'rtachadan yuqori";
  if (iq >= 90) return "O'rtacha";
  if (iq >= 80) return "O'rtachadan past";
  return "Past";
}

// Bepul 5 bandli tahlil
export function fivePoints(r) {
  const cats = Object.entries(r.categories).sort((a, b) => b[1].pct - a[1].pct);
  const [bestK, best] = cats[0];
  const [worstK, worst] = cats[cats.length - 1];
  const tips = {
    matrix: "Raven matritsalari, sudoku va naqsh topish mashqlari bilan shug'ullaning.",
    numeric: "Kunlik og'zaki hisob, ketma-ketlik jumboqlari va mantiqiy matematik masalalar yeching.",
    verbal: "Ko'proq kitob o'qing, analogiya va sillogizm mashqlarini bajaring.",
    spatial: "Tangram, Rubik kubi, xarita bilan ishlash va 3D konstruktorlar yordam beradi.",
  };
  const speedTxt = r.avgTime <= 25
    ? `Siz savollarga o'rtacha ${r.avgTime} soniyada javob berdingiz — bu tez qaror qabul qilish uslubi. ${r.accuracy < 0.6 ? "Lekin shoshilish xatolarga olib kelgan bo'lishi mumkin: biroz sekinroq, puxtaroq ishlang." : "Aniqlik ham yaxshi — tezlik va sifat muvozanatda."}`
    : `O'rtacha javob vaqti ${r.avgTime} soniya — puxta, mulohazali uslub. ${r.accuracy >= 0.7 ? "Bu yuqori aniqlik bergan." : "Vaqtni boshqarishni mashq qilsangiz, natija oshadi."}`;
  return [
    { t: `Umumiy natija: IQ ≈ ${r.iq} (${band(r.iq)})`, d: `Siz testdan o'tganlarning taxminan ${r.percentile}% idan yuqori natija ko'rsatdingiz. ${r.right}/${r.total} savolga to'g'ri javob berdingiz.` },
    { t: `Kuchli tomon: ${CATEGORIES[bestK].name} (${best.pct}%)`, d: `Bu yo'nalishda tafakkuringiz eng samarali ishlaydi. ${bestK === "spatial" ? "Muhandislik, dizayn, arxitektura sohalariga moyillik bor." : bestK === "verbal" ? "Til, huquq, jurnalistika va menejment sohalarida ustunlik beradi." : bestK === "numeric" ? "Analitika, moliya va dasturlashda qo'l keladi." : "Abstrakt tafakkur — ilm-fan va strategiyada asosiy ko'nikma."}` },
    { t: `Rivojlantirish kerak: ${CATEGORIES[worstK].name} (${worst.pct}%)`, d: tips[worstK] },
    { t: "Ishlash uslubi va tezlik", d: speedTxt },
    { t: `Murakkab savollar: ${Math.round(r.hardRate * 100)}% to'g'ri`, d: r.hardRate >= 0.5 ? "Qiyin savollarda ham bardoshli ekansiz — bu yuqori 'suyuq intellekt' belgisi." : "Qiyinlik oshganda natija pasaygan. Premiumdagi miya o'yinlari va detektiv ishlari aynan shu ko'nikmani mashq qildiradi." },
  ];
}

// Premium chuqur tahlil
export function deepAnalysis(r) {
  const c = r.categories;
  const fluid = Math.round((c.matrix.pct + c.spatial.pct) / 2);
  const crystal = Math.round((c.verbal.pct + c.numeric.pct) / 2);
  const wm = Math.round((c.numeric.pct * 0.6 + c.matrix.pct * 0.4));
  const ps = Math.max(0, Math.min(100, Math.round(100 - (r.avgTime - 10) * 2.2)));
  return {
    indices: [
      { k: "Suyuq intellekt (Gf)", v: fluid, d: "Yangi muammolarni oldingi bilimsiz yechish qobiliyati." },
      { k: "Kristallashgan intellekt (Gc)", v: crystal, d: "To'plangan bilim va til orqali fikrlash." },
      { k: "Ishchi xotira", v: wm, d: "Ma'lumotni ongda ushlab, ustida amallar bajarish." },
      { k: "Qayta ishlash tezligi", v: ps, d: "Ma'lumotni tez va aniq qayta ishlash." },
    ],
    plan: [
      "1-hafta: har kuni 10 daqiqa Schulte jadvali (diqqat va periferik ko'rish).",
      "2-hafta: Xotira panjarasi o'yinida 7+ darajaga chiqish (ishchi xotira).",
      `3-hafta: eng zaif yo'nalish — ${CATEGORIES[Object.entries(c).sort((a, b) => a[1].pct - b[1].pct)[0][0]].name} — bo'yicha kuniga 15 ta mashq.`,
      "4-hafta: 2 ta detektiv ishini yeching va testni qayta topshiring.",
    ],
    careers: fluid >= crystal ? ["Dasturiy injiniring", "Ma'lumotlar tahlili", "Arxitektura", "Strategik rejalashtirish"] : ["Huquqshunoslik", "Jurnalistika", "Ta'lim", "Menejment va konsalting"],
  };
}

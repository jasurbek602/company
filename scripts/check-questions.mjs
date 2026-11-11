// Savollar generatorini tekshirish: javob variantlar ichida, variantlar takrorlanmaydi, kamida 4 ta variant.
import { genItem, CATEGORIES } from "../js/questions.js";
let bad = 0, n = 0;
const lv = {};
for (let k = 0; k < 400; k++) for (const c of Object.keys(CATEGORIES)) for (let L = 1; L <= 7; L++) {
  const q = genItem(c, L); n++;
  lv[q.diff] = (lv[q.diff] || 0) + 1;
  if (!q.options.includes(q.answer) || new Set(q.options).size !== q.options.length || q.options.length < 4) { bad++; if (bad < 8) console.log("XATO:", q.cat, q.diff, q.text.slice(0, 60), q.options, q.answer); }
}
console.log(bad ? `${bad} ta xato / ${n}` : `OK: ${n} ta savol tekshirildi`, JSON.stringify(lv));
process.exit(bad ? 1 : 0);

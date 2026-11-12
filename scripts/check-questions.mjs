// Savollar generatorini tekshirish: 24 tur × 7 daraja; javob variantlar ichida, variantlar takrorlanmaydi, kamida 4 ta variant.
import { genType, TYPES, buildSchedule } from "../js/questions.js";
let bad = 0, n = 0;
for (const t of TYPES) for (let L = 1; L <= 7; L++) for (let k = 0; k < 150; k++) {
  let q; try { q = genType(t.id, L); } catch (e) { bad++; if (bad < 10) console.log("XATO (exception):", t.id, L, e.message); continue; }
  n++;
  if (!q.options.includes(q.answer) || new Set(q.options).size !== q.options.length || q.options.length < 4 || !q.text || !(q.diff >= 1 && q.diff <= 7)) { bad++; if (bad < 10) console.log("XATO:", t.id, L, q.text?.slice(0, 60), q.options, q.answer, q.diff); }
}
for (const prem of [false, true]) for (let k = 0; k < 300; k++) {
  const s = buildSchedule(prem);
  const want = prem ? 60 : 36;
  const counts = {}; s.forEach((x) => (counts[x] = (counts[x] || 0) + 1));
  const adj = s.some((x, i) => i && x === s[i - 1]);
  const typesN = Object.keys(counts).length;
  if (s.length !== want || adj || typesN !== (prem ? 24 : 18) || Object.values(counts).some((c) => c < 2 || c > 3)) { bad++; if (bad < 14) console.log("JADVAL XATO:", prem, s.length, adj, typesN); }
}
console.log(bad ? `${bad} ta xato / ${n}` : `OK: ${TYPES.length} tur, ${n} ta savol va 600 ta jadval tekshirildi`);
process.exit(bad ? 1 : 0);

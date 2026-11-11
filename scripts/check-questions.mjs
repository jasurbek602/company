// Savollar generatorini tekshirish: har bir savolda to'g'ri javob variantlar ichida va variantlar takrorlanmaydi.
import { buildTest } from "../js/questions.js";
let bad = 0;
for (let k = 0; k < 300; k++) for (const q of buildTest()) {
  if (!q.options.includes(q.answer) || new Set(q.options).size !== q.options.length) { bad++; console.log("XATO:", q.cat, q.text, q.options, q.answer); }
}
console.log(bad ? `${bad} ta xato` : "OK: 300 ta test (9600 savol) tekshirildi");
process.exit(bad ? 1 : 0);

import * as db from "./db.js";
import { toast, confetti, googleBtn } from "./app.js";

const PLANS = [
  { id: "month", name: "Oylik", price: "49 000", per: "so'm / oy", feats: ["Cheksiz IQ testlar", "Chuqur kognitiv tahlil", "4 ta miya o'yini", "Detektiv: barcha ishlar"] },
  { id: "year", name: "Yillik", price: "390 000", per: "so'm / yil", best: true, feats: ["Oylikdagi hammasi", "33% tejash", "Yangi detektiv ishlari birinchi", "Natijalar dinamikasi"] },
  { id: "life", name: "Umrbod", price: "790 000", per: "so'm bir marta", feats: ["Barcha imkoniyatlar abadiy", "Kelajakdagi barcha o'yinlar", "Ustuvor qo'llab-quvvatlash", "Maxsus 👑 nishon"] },
];

export async function renderPremium(app) {
  const u = db.getUser();
  const p = await db.getProfile();
  app.innerHTML = `<div>
    <section class="center mb">
      <span class="tag gold">👑 Premium</span>
      <h1 class="mt grad-text" style="font-size:clamp(30px,5vw,52px)">Intellektingizni keyingi darajaga olib chiqing</h1>
      <p class="muted" style="max-width:620px;margin:0 auto">Chuqur tahlil, IQ ni oshiruvchi miya o'yinlari va mantiqiy tafakkurni charxlovchi Detektiv bo'limi.</p>
      ${p.is_premium ? `<p class="mt"><span class="tag gold">✓ Sizda Premium faol</span></p>` : ""}
    </section>
    <div class="plans">
      ${PLANS.map((pl, i) => `<div class="card plan ${pl.best ? "best" : ""} reveal" style="transition-delay:${i * 90}ms">
        ${pl.best ? `<span class="tag gold ribbon">Eng foydali</span>` : ""}
        <h3>${pl.name}</h3>
        <div class="price">${pl.price} <small>${pl.per}</small></div>
        <ul>${pl.feats.map((f) => `<li>${f}</li>`).join("")}</ul>
        ${!u ? googleBtn("Kirish va sotib olish") : p.is_premium ? `<button class="btn ghost" disabled>Faol</button>` : `<button class="btn ${pl.best ? "gold" : ""}" data-buy="${pl.id}">Sotib olish</button>`}
      </div>`).join("")}
    </div>
    <p class="center muted small mt">To'lov Stripe test rejimida ishlaydi — haqiqiy pul yechilmaydi. Test karta: 4242 4242 4242 4242.${db.DEMO ? " Hozir demo rejim: tugma Premiumni darhol faollashtiradi." : ""}</p>
  </div>`;
  app.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buy(b.dataset.buy, b)));
}

async function buy(plan, btn) {
  btn.disabled = true; btn.textContent = "Yuklanmoqda…";
  if (db.DEMO) {
    await db.demoActivatePremium();
    confetti(); toast("Premium faollashtirildi (demo) 👑");
    location.hash = "#/games"; return;
  }
  try {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await db.accessToken()) }, body: JSON.stringify({ plan }) });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Xato");
    location.href = j.url;
  } catch (e) {
    toast("To'lovni boshlab bo'lmadi: " + e.message); btn.disabled = false; btn.textContent = "Sotib olish";
  }
}

// Stripe Checkout'dan qaytganda (?session_id=...) serverda tekshirib, premiumni yoqamiz
export async function handleCheckoutReturn() {
  const sid = new URLSearchParams(location.search).get("session_id");
  if (!sid || db.DEMO) return;
  history.replaceState(null, "", location.pathname + location.hash);
  try {
    const res = await fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await db.accessToken()) }, body: JSON.stringify({ session_id: sid }) });
    const j = await res.json();
    if (j.premium) { confetti(); toast("To'lov tasdiqlandi. Premium faol! 👑"); }
    else toast("To'lov tasdiqlanmadi: " + (j.error || "noma'lum"));
  } catch (e) { toast("Tekshirishda xato: " + e.message); }
}

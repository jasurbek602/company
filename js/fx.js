// Butun sayt uchun yengil "motion" effektlar: skroll chizig'i, sichqoncha nuri,
// kartalardagi yorug'lik. Hammasi bitta rAF ichida, faqat transform/CSS o'zgaruvchilar.
const fine = matchMedia("(pointer: fine)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const bar = document.createElement("div"); bar.className = "scrollbar"; document.body.appendChild(bar);
let glow = null;
if (fine && !reduced) { glow = document.createElement("div"); glow.className = "cursor-glow"; document.body.appendChild(glow); }

let mx = -999, my = -999, gx = -999, gy = -999, queued = false, card = null;
const SEL = ".card, .cz-card";
function tick() {
  queued = false;
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  if (glow) {
    gx += (mx - gx) * 0.18; gy += (my - gy) * 0.18;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    if (Math.abs(mx - gx) + Math.abs(my - gy) > 0.5) req();
  }
}
const req = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
addEventListener("scroll", req, { passive: true });
addEventListener("resize", req, { passive: true });

if (fine) {
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY; req();
    const c = e.target.closest?.(SEL);
    if (c !== card) card = c;
    if (!c || c.closest(".game-area, .det3d-root, .cosmos")) return;
    if (!c.classList.contains("fx-host")) {
      c.classList.add("fx-host");
      const s = document.createElement("i"); s.className = "fx-spot"; c.appendChild(s);
    }
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });
}
req();

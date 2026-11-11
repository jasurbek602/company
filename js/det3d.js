// To'liq 3D detektiv dunyosi: bitta renderer, sahnalar almashadi (qotmaslik uchun).
// Sahnalar: shtab (HQ), ish xaritasi, jinoyat joyi, so'roq xonasi, dalillar taxtasi, sud zali.
let THREE = null, OrbitControls = null;
export async function load3D() {
  if (THREE) return true;
  try { THREE = await import("three"); ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js")); return true; }
  catch (e) { console.warn("3D yuklanmadi", e); return false; }
}
export const webglOK = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };
const MOBILE = () => matchMedia("(pointer: coarse)").matches || innerWidth < 760;

/* ===================== Canvas teksturalar ===================== */
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, x, y, maxW, lh, maxLines) {
  const words = String(text).split(" "); let line = "", n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (g.measureText(test).width > maxW && line) { if (n === maxLines - 1) { g.fillText(line + "…", x, y + n * lh); return; } g.fillText(line, x, y + n * lh); n++; line = words[i]; }
    else line = test;
  }
  g.fillText(line, x, y + n * lh);
}
const EMOJI_FONT = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// Belgi (sprite): ikonka + nom + qo'shimcha
export function labelTex(icon, title, sub, color = "#ffc94d") {
  const c = document.createElement("canvas"); c.width = 320; c.height = 220; const g = c.getContext("2d");
  g.fillStyle = "rgba(10,10,30,.82)"; rr(g, 20, 6, 280, 150, 28); g.fill();
  g.lineWidth = 6; g.strokeStyle = color; rr(g, 20, 6, 280, 150, 28); g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `80px ${EMOJI_FONT}`; g.fillText(icon, 160, 70);
  if (sub) { g.font = "bold 24px Inter, Arial"; g.fillStyle = color; g.fillText(sub, 160, 130); }
  g.font = "bold 28px Inter, Arial"; const t = title.length > 20 ? title.slice(0, 19) + "…" : title;
  const w = g.measureText(t).width + 30; g.fillStyle = "rgba(10,10,30,.9)"; rr(g, 160 - w / 2, 166, w, 48, 16); g.fill();
  g.fillStyle = "#fff"; g.fillText(t, 160, 190);
  return tex(c);
}
// Taxta kartasi
// state: "" | "sel" (tanlangan) | "used" (fosh qilingan) | "cand" (nomzod — tekshirib ko'ring); sus: shubhali ko'rsatma
export function cardTex(kind, icon, head, body, state, sus) {
  const c = document.createElement("canvas"); c.width = 640; c.height = 400; const g = c.getContext("2d");
  g.fillStyle = kind === "st" ? "#f3edff" : "#fff8e4"; rr(g, 0, 0, 640, 400, 22); g.fill();
  g.fillStyle = kind === "st" ? "#6a48f0" : "#d9961c"; rr(g, 0, 0, 640, 78, 22); g.fill(); g.fillRect(0, 50, 640, 28);
  g.textBaseline = "middle"; g.font = `50px ${EMOJI_FONT}`; g.fillText(icon, 20, 41);
  g.fillStyle = "#fff"; g.font = "bold 38px Inter, Arial"; g.fillText(head.length > 20 ? head.slice(0, 19) + "…" : head, 86, 41);
  g.fillStyle = "#1e1733"; g.font = "600 34px Inter, Arial"; g.textBaseline = "top";
  wrap(g, kind === "st" ? `"${body}"` : body, 24, 96, 592, 42, sus || state === "used" ? 5 : 6);
  if (sus && state !== "used") { g.fillStyle = "#ff8a3d"; rr(g, 380, 340, 244, 46, 14); g.fill(); g.fillStyle = "#fff"; g.font = "bold 28px Inter, Arial"; g.textBaseline = "middle"; g.fillText("🤔 Shubhali", 398, 364); }
  if (state === "used") { g.fillStyle = "#ff3b5c"; rr(g, 370, 340, 254, 46, 14); g.fill(); g.fillStyle = "#fff"; g.font = "bold 28px Inter, Arial"; g.textBaseline = "middle"; g.fillText("⚡ YOLG'ON", 400, 364); }
  if (state === "sel") { g.lineWidth = 18; g.strokeStyle = "#ff6a00"; rr(g, 9, 9, 622, 382, 18); g.stroke(); }
  if (state === "used") { g.lineWidth = 12; g.strokeStyle = "#ff3b5c"; rr(g, 6, 6, 628, 388, 18); g.stroke(); }
  if (state === "cand") { g.lineWidth = 12; g.setLineDash([26, 16]); g.strokeStyle = "#00b8e6"; rr(g, 8, 8, 624, 384, 18); g.stroke(); g.setLineDash([]); g.fillStyle = "#00b8e6"; rr(g, 24, 340, 230, 46, 14); g.fill(); g.fillStyle = "#fff"; g.font = "bold 26px Inter, Arial"; g.textBaseline = "middle"; g.fillText("❓ Tekshiring", 40, 364); }
  return tex(c);
}

/* ===================== Dvigatel ===================== */
export class Engine {
  constructor(container) {
    this.container = container;
    const mobile = MOBILE();
    this.mobile = mobile;
    this.renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = "det3d-canvas";
    container.prepend(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08; this.controls.enablePan = false;
    this.controls.addEventListener("start", () => { this.controls.autoRotate = false; this.active = performance.now(); });
    this.controls.addEventListener("change", () => (this.active = performance.now()));
    this.ray = new THREE.Raycaster(); this.ptr = new THREE.Vector2();
    this.scene = null; this.pick = []; this.anim = []; this.fly = null; this.active = performance.now(); this.last = 0; this.visible = true;
    const el = this.renderer.domElement;
    this._down = (e) => (this.downAt = { x: e.clientX, y: e.clientY });
    this._up = (e) => { if (!this.downAt) return; const m = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y); this.downAt = null; if (m > 8) return; const o = this.hit(e); if (o && this.onPick) { this.controls.autoRotate = false; this.onPick(o.userData.pick, o); } };
    this._move = (e) => { if (mobile || e.buttons) return; const o = this.hit(e); el.style.cursor = o ? "pointer" : "grab"; if (this.onHover) this.onHover(o?.userData.pick || null); };
    el.addEventListener("pointerdown", this._down); el.addEventListener("pointerup", this._up); el.addEventListener("pointermove", this._move);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container); this.resize();
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)); this.io.observe(container);
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }
  resize() { const w = this.container.clientWidth || 300, h = this.container.clientHeight || 400; this.renderer.setSize(w, h, false); this.renderer.domElement.style.width = "100%"; this.renderer.domElement.style.height = "100%"; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.active = performance.now(); }
  hit(e) { const r = this.renderer.domElement.getBoundingClientRect(); this.ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; this.ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1; this.ray.setFromCamera(this.ptr, this.camera); const h = this.ray.intersectObjects(this.pick, false)[0]; return h?.object; }
  frame(t) {
    if (!this.scene || !this.visible || document.hidden) return;
    const idle = !this.fly && !this.controls.autoRotate && t - this.active > 3000 && !this.alwaysAnimate;
    if (idle && t - this.last < 66) return; // tinch holatda ~15 fps
    this.last = t;
    if (this.fly) {
      const k = Math.min(1, (t - this.fly.t0) / this.fly.ms), e = 1 - Math.pow(1 - k, 3);
      this.controls.target.lerpVectors(this.fly.fT, this.fly.tT, e); this.camera.position.lerpVectors(this.fly.fP, this.fly.tP, e);
      if (k >= 1) { const cb = this.fly.done; this.fly = null; cb?.(); }
    }
    for (const a of this.anim) a(t);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  flyTo(pos, target, ms = 800) { return new Promise((res) => { this.fly = { t0: performance.now(), ms, fT: this.controls.target.clone(), tT: new THREE.Vector3(...target), fP: this.camera.position.clone(), tP: new THREE.Vector3(...pos), done: res }; this.active = performance.now(); }); }
  // Sahnani almashtirish: eskisini to'liq tozalash (xotira oqmasligi uchun)
  set(built) {
    this.clear();
    const { scene, pick, anim, cam, target, limits = {}, onPick, onHover, autoRotate = false, alwaysAnimate = false, noFit = false } = built;
    this.scene = scene; this.pick = pick || []; this.anim = anim || []; this.onPick = onPick; this.onHover = onHover; this.alwaysAnimate = alwaysAnimate;
    // tik (portret) ekranda kamerani uzoqlashtirish — sahna to'liq sig'sin
    const fit = noFit || this.camera.aspect >= 1.2 ? 1 : Math.min(1.55, Math.pow(1.2 / this.camera.aspect, 0.5));
    const tv = new THREE.Vector3(...target), cv = new THREE.Vector3(...cam).sub(tv).multiplyScalar(fit).add(tv);
    this.camera.position.copy(cv); this.controls.target.copy(tv);
    const c = this.controls;
    c.minDistance = limits.minD ?? 2; c.maxDistance = (limits.maxD ?? 14) * fit;
    c.minPolarAngle = limits.minP ?? 0.3; c.maxPolarAngle = limits.maxP ?? Math.PI / 2 - 0.06;
    c.minAzimuthAngle = limits.minA ?? -Infinity; c.maxAzimuthAngle = limits.maxA ?? Infinity;
    c.enableRotate = limits.rotate ?? true;
    c.autoRotate = autoRotate; c.autoRotateSpeed = 0.45;
    this.fly = null; this.active = performance.now();
    c.update();
  }
  clear() {
    if (!this.scene) return;
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    this.scene = null; this.pick = []; this.anim = [];
  }
  dispose() {
    this.renderer.setAnimationLoop(null); this.clear(); this.controls.dispose(); this.ro.disconnect(); this.io.disconnect();
    const el = this.renderer.domElement; el.removeEventListener("pointerdown", this._down); el.removeEventListener("pointerup", this._up); el.removeEventListener("pointermove", this._move);
    this.renderer.dispose(); this.renderer.forceContextLoss?.(); el.remove();
  }
}

/* ===================== Qurilish yordamchilari ===================== */
function kit(bg = 0x0b0b1a, fog = [16, 45]) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, fog[0], fog[1]);
  const mats = new Map();
  const mat = (color, o = {}) => { const k = color + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...o })); return mats.get(k); };
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); scene.add(o); return o; };
  const K = {
    scene, mat,
    box: (w, h, d, c, x, y, z, o) => add(new THREE.BoxGeometry(w, h, d), mat(c, o), x, y, z),
    cyl: (rt, rb, h, c, x, y, z, seg = 12, o) => add(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, o), x, y, z),
    cone: (r, h, c, x, y, z, seg = 4, o) => add(new THREE.ConeGeometry(r, h, seg), mat(c, o), x, y, z),
    sphere: (r, c, x, y, z, o) => add(new THREE.SphereGeometry(r, 14, 10), mat(c, o), x, y, z),
    plane: (w, h, c, x, y, z, rx = -Math.PI / 2, o) => { const m = add(new THREE.PlaneGeometry(w, h), mat(c, o), x, y, z); m.rotation.x = rx; return m; },
    shadow: (x, z, r, y = 0) => { const m = add(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false }), x, y + 0.012, z); m.rotation.x = -Math.PI / 2; return m; },
    sprite: (texture, x, y, z, sx = 1.9, sy = 1.3) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })); s.scale.set(sx, sy, 1); s.position.set(x, y, z); scene.add(s); return s; },
    lights: (hemi = 1.2, keyI = 1.2, warm = null) => {
      scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x2a1d14, hemi)); scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const k = new THREE.DirectionalLight(0xfff1d6, keyI); k.position.set(4, 9, 6); scene.add(k);
      if (warm) { const p = new THREE.PointLight(warm[0], warm[1], 16, 2); p.position.set(...warm[2]); scene.add(p); return p; }
    },
    lamp: (x, y, z) => { K.cyl(0.02, 0.02, 1, 0x222222, x, y + 0.5, z); K.cyl(0.25, 0.5, 0.35, 0x222233, x, y - 0.05, z, 14); add(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c4 }), x, y - 0.2, z); },
    table: (x, z, top = 0.8, w = 1.1, d = 0.8, c = 0x6b4a33, base = 0) => { K.box(w, 0.08, d, c, x, base + top, z); for (const [dx, dz] of [[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06], [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06]]) K.box(0.06, top, 0.06, 0x3b291c, x + dx, base + top / 2, z + dz); },
  };
  return K;
}
// Personaj (past poligonli): tana, bosh, emoji yuz
const BODY_COLORS = [0x7c5cff, 0x00a8cc, 0xff4fd8, 0xff8a3d, 0x2ee59d, 0xb33a3a];
function emojiTex(e) { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); g.font = `100px ${EMOJI_FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 64, 70); return tex(c); }
function person(K, x, z, face, i, rotY = 0, sitting = false) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = rotY; K.scene.add(grp);
  const col = BODY_COLORS[i % BODY_COLORS.length];
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, sitting ? 0.5 : 0.8, 4, 10), K.mat(col)); body.position.y = sitting ? 0.95 : 0.85; grp.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), K.mat(0xf1c9a5)); head.position.y = sitting ? 1.65 : 1.75; grp.add(head);
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(face), transparent: true, depthWrite: false })); f.scale.set(0.66, 0.66, 1); f.position.set(0, head.position.y, 0.34); grp.add(f);
  K.shadow(x, z, 0.5);
  return { grp, body, head, face: f, baseY: 0 };
}
function pickable(o, data) { o.userData.pick = data; return o; }

/* ===================== 1) SHTAB-KVARTIRA ===================== */
export function buildHQ(cases, info, onOpen) {
  const K = kit(0x0d0d22, [18, 40]);
  K.lights(1.0, 1.0, [0xffc94d, 22, [0, 3.4, 0.5]]);
  K.plane(16, 12, 0x3d2e26, 0, 0, 0);
  K.box(16, 5, 0.1, 0x2a2f4a, 0, 2.5, -5); K.box(0.1, 5, 12, 0x2a2f4a, -8, 2.5, 0); K.box(0.1, 5, 12, 0x2a2f4a, 8, 2.5, 0);
  // shahar ko'rinadigan deraza
  K.box(5, 2.4, 0.05, 0x1b2a55, -3.2, 2.8, -4.93, { emissive: 0x1a2a5a, emissiveIntensity: 1 });
  for (let i = 0; i < 18; i++) K.box(0.18, 0.14, 0.02, 0xfff0b0, -5.3 + (i % 9) * 0.5, 2.0 + Math.floor(i / 9) * 0.6 + (i % 3) * 0.15, -4.9, { emissive: 0xffe08a, emissiveIntensity: 1.2 });
  // xarita va "Wanted" doskasi
  K.box(3.2, 2.2, 0.08, 0x6b4a2e, 3.2, 2.6, -4.92); K.box(2.9, 1.9, 0.02, 0xb8925a, 3.2, 2.6, -4.86);
  for (let i = 0; i < 6; i++) K.box(0.5, 0.65, 0.01, 0xf4ecd8, 2.2 + (i % 3) * 1, 3.05 - Math.floor(i / 3) * 0.95, -4.84);
  // katta stol
  K.box(7.4, 0.14, 3.2, 0x5a3b26, 0, 0.95, 0.3); K.box(7.2, 0.88, 0.1, 0x4a3020, 0, 0.45, -1.2);
  K.box(0.12, 0.88, 3, 0x4a3020, -3.6, 0.45, 0.3); K.box(0.12, 0.88, 3, 0x4a3020, 3.6, 0.45, 0.3);
  K.lamp(0, 3.6, 0.3);
  // stol chirog'i va kofe
  K.cyl(0.14, 0.18, 0.06, 0x222222, 3.2, 1.05, -0.8); K.cyl(0.02, 0.02, 0.5, 0x222222, 3.2, 1.3, -0.8); K.cone(0.2, 0.25, 0x2ee59d, 3.2, 1.6, -0.8, 12);
  K.cyl(0.1, 0.08, 0.18, 0xf4ecd8, -3.1, 1.12, -0.7);
  const pick = [], anim = [];
  cases.forEach((c, i) => {
    const x = -2.3 + (i % 3) * 2.3, z = -0.3 + Math.floor(i / 3) * 1.45;
    const st = info[i];
    const folder = K.box(1.5, 0.06, 1.05, st.locked ? 0x5a5a6a : 0xd8b26e, x, 1.06, z); folder.rotation.y = (i % 2 ? 1 : -1) * 0.06;
    K.box(0.5, 0.062, 0.18, st.locked ? 0x4a4a5a : 0xc89c52, x - 0.4, 1.065, z - 0.6);
    if (st.solved) K.box(0.7, 0.07, 0.25, 0x2ee59d, x + 0.3, 1.1, z + 0.25, { emissive: 0x1a6b47, emissiveIntensity: 0.6 });
    const sp = K.sprite(labelTex(st.locked ? "🔒" : c.ico, `№${i + 1} ${c.title}`, st.locked ? "Yopiq" : st.solved ? `✓ ${st.score}%` : st.inProg ? "⏳ Davom etmoqda" : "★".repeat(c.diff), st.locked ? "#8a8fb8" : st.solved ? "#2ee59d" : "#ffc94d"), x, i < 3 ? 2.75 : 1.8, z, 1.55, 1.07);
    const data = { kind: "case", id: c.id, locked: st.locked };
    pick.push(pickable(folder, data), pickable(sp, data));
    const by = sp.position.y; anim.push((t) => (sp.position.y = by + Math.sin(t / 700 + i) * 0.05));
  });
  return { scene: K.scene, pick, anim, cam: [0, 4.6, 6.6], target: [0, 1.6, 0.2], limits: { minD: 3.5, maxD: 10, minA: -0.9, maxA: 0.9, maxP: 1.3 }, onPick: (d) => onOpen(d), alwaysAnimate: false };
}

/* ===================== 2) ISH XARITASI ===================== */
export function buildMap(c, prog, onGo) {
  const K = kit(0x101a33, [22, 55]);
  K.lights(1.25, 1.1);
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.6, 0.6, 48), K.mat(0x2a4a3a)); ground.position.y = -0.3; K.scene.add(ground);
  const road = new THREE.Mesh(new THREE.RingGeometry(3.3, 4.3, 48), K.mat(0x3a3f4f)); road.rotation.x = -Math.PI / 2; road.position.y = 0.01; K.scene.add(road);
  // markaziy maydon: ish belgisi
  K.cyl(1.2, 1.4, 0.3, 0x6b7280, 0, 0.15, 0, 24); K.cyl(0.08, 0.08, 2.2, 0x999999, 0, 1.4, 0);
  const center = K.sprite(labelTex(c.ico, c.title, "★".repeat(c.diff)), 0, 3, 0, 2.3, 1.6);
  const places = [
    ...c.locations.map((l) => ({ kind: "loc", id: l.id, ico: l.ico, name: l.name, sub: `🔍 ${prog.loc[l.id]}`, color: 0xc98a5a, roof: 0x8a3b2e })),
    { kind: "sorov", ico: "🗣", name: "So'roq xonasi", sub: `${prog.qs} savol`, color: 0x3d6db3, roof: 0x22406b, special: true },
    { kind: "taxta", ico: "🧷", name: "Dalillar taxtasi", sub: `⚡ ${prog.found}`, color: 0x7c5cff, roof: 0x4a2f9a, special: true },
    { kind: "sud", ico: "⚖️", name: "Sud zali", sub: prog.done ? "✓ Yechildi" : "Ayblov", color: 0xd8c9a0, roof: 0x8a7a50, special: true },
  ];
  const pick = [], anim = [];
  const R = 7.2;
  places.forEach((p, i) => {
    const a = (i / places.length) * Math.PI * 2 + 0.3;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.lookAt(0, 0, 0); K.scene.add(grp);
    const w = p.special ? 2.2 : 1.7, h = p.special ? 1.9 : 1.5;
    const house = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.6), K.mat(p.color)); house.position.y = h / 2; grp.add(house);
    if (p.kind === "sud") { for (let k = -1; k <= 1; k++) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, h, 10), K.mat(0xf4ecd8)); col.position.set(k * 0.6, h / 2, 0.85); grp.add(col); } const tri = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 3), K.mat(p.roof)); tri.rotation.z = Math.PI / 2; tri.rotation.y = Math.PI / 2; tri.position.set(0, h + 0.3, 0); tri.scale.set(1, 1.4, 0.5); grp.add(tri); }
    else { const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.82, 0.9, 4), K.mat(p.roof)); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.45; grp.add(roof); }
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.05), K.mat(0x3b241a)); door.position.set(0, 0.4, 0.81); grp.add(door);
    for (const s of [-1, 1]) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.04), K.mat(0xffe08a, { emissive: 0xffd27a, emissiveIntensity: 1 })); win.position.set(s * (w / 2 - 0.4), h * 0.62, 0.81); grp.add(win); }
    K.shadow(x, z, 1.4);
    const sp = K.sprite(labelTex(p.ico, p.name, p.sub, p.special ? "#00d4ff" : "#ffc94d"), x, h + 2, z, 2, 1.38);
    const data = { ...p };
    pick.push(pickable(house, data), pickable(sp, data));
    const by = sp.position.y; anim.push((t) => (sp.position.y = by + Math.sin(t / 650 + i) * 0.07));
  });
  // daraxtlar va fonarlar
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 9.6 + (i % 2) * 0.6; K.cyl(0.1, 0.14, 0.8, 0x5a3b22, Math.cos(a) * r, 0.4, Math.sin(a) * r, 6); K.cone(0.6, 1.4, 0x2f7a45, Math.cos(a) * r, 1.4, Math.sin(a) * r, 7); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const x = Math.cos(a) * 3.8, z = Math.sin(a) * 3.8; K.cyl(0.04, 0.04, 1.6, 0x333333, x, 0.8, z, 6); K.sphere(0.12, 0xfff4cc, x, 1.65, z, { emissive: 0xfff0b0, emissiveIntensity: 1.5 }); }
  anim.push((t) => (center.position.y = 3 + Math.sin(t / 800) * 0.08));
  return { scene: K.scene, pick, anim, cam: [0, 11, 17], target: [0, 0.6, 0], limits: { minD: 6, maxD: 24, maxP: 1.2 }, autoRotate: true, onPick: (d, o) => onGo(d, o) };
}

/* ===================== 3) JINOYAT JOYI ===================== */
const ENV = { bog: "outdoor", perron: "snow", kupe7: "train", kupe6: "train", kupe8: "train", yolak: "corridor", provodnik: "train" };
const PAL = [{ wall: 0x4a3f78, floor: 0x5c4a3f, acc: 0xffc94d }, { wall: 0x34507a, floor: 0x4a4550, acc: 0x00d4ff }, { wall: 0x5a3a66, floor: 0x5a4433, acc: 0xff4fd8 }, { wall: 0x3a5a4c, floor: 0x50463a, acc: 0x2ee59d }];
function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

export function buildLocation(loc, evState, onPick) {
  const env = ENV[loc.id] || "room";
  const rnd = seeded(loc.id), pal = PAL[Math.floor(rnd() * PAL.length)];
  const sky = env === "outdoor" ? 0x16243a : env === "snow" ? 0x1b2236 : 0x0b0b1a;
  const K = kit(sky, [16, 40]);
  const warm = K.lights(env === "outdoor" || env === "snow" ? 1.4 : 1.25, 1.3, [pal.acc, 18, [0, 3.2, 0]]);
  const anim = [];
  let W = 10, D = 8;
  if (env === "train" || env === "corridor") { W = env === "corridor" ? 14 : 6; D = env === "corridor" ? 3.4 : 4.2; }
  if (env === "outdoor" || env === "snow") {
    K.plane(60, 60, env === "snow" ? 0xdfe8f5 : 0x1f3d2a, 0, 0, 0);
    if (env === "snow") {
      K.box(18, 0.6, 5.5, 0x6b7280, 0, 0.3, -0.6); K.box(18, 2.6, 2.6, 0x2c4a7a, 0, 1.6, -4.6);
      for (let i = -3; i <= 3; i++) K.box(1.2, 0.8, 0.05, 0xffe9a8, i * 2.4, 2.1, -3.28, { emissive: 0xffd27a, emissiveIntensity: 0.9 });
      K.cyl(0.08, 0.08, 4, 0x444444, 6.5, 2, -2.6); K.box(0.9, 0.2, 0.5, 0xfff4cc, 6.5, 4, -2.6, { emissive: 0xfff0b0, emissiveIntensity: 1.2 });
      const cnt = MOBILE() ? 220 : 450, pos = new Float32Array(cnt * 3);
      for (let i = 0; i < cnt; i++) { pos[i * 3] = (Math.random() - 0.5) * 24; pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = (Math.random() - 0.5) * 16; }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.85 })); K.scene.add(snow);
      anim.push(() => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - 0.02; if (y < 0) y = 10; p.setY(i, y); } p.needsUpdate = true; });
    } else {
      for (let i = 0; i < 9; i++) { const x = (rnd() - 0.5) * 22, z = -4 - rnd() * 10; K.cyl(0.15, 0.22, 2, 0x5a3b22, x, 1, z, 7); K.cone(1 + rnd() * 0.6, 2.6, 0x2f7a45, x, 3, z, 8); }
      K.box(3, 0.12, 0.8, 0x7a5232, -2.5, 0.6, 1.2); K.box(3, 0.6, 0.12, 0x7a5232, -2.5, 0.95, 0.85);
      for (let i = 0; i < 14; i++) K.sphere(0.18, [0xff4fd8, 0xffc94d, 0xff5c7a][i % 3], 2 + (i % 5) * 0.5, 0.2, 1 + Math.floor(i / 5) * 0.5);
    }
  } else {
    K.plane(W, D, pal.floor, 0, 0, 0);
    const H = env === "room" ? 4 : 3;
    K.box(W, H, 0.1, pal.wall, 0, H / 2, -D / 2); K.box(0.1, H, D, pal.wall, -W / 2, H / 2, 0); K.box(0.1, H, D, pal.wall, W / 2, H / 2, 0);
    K.box(W, 0.12, 0.14, 0x111122, 0, 0.06, -D / 2 + 0.08);
    K.plane(W * 0.45, D * 0.4, 0x5b2333, 0, 0.012, 0.3);
    if (env === "train" || env === "corridor") {
      for (let i = 0; i < (env === "corridor" ? 5 : 2); i++) K.box(1.4, 0.9, 0.04, 0x9fc3ff, (i - (env === "corridor" ? 2 : 0.5)) * 2.6, 1.8, -D / 2 + 0.07, { emissive: 0x3a5f9f, emissiveIntensity: 0.8 });
      if (env === "train") { K.box(W * 0.8, 0.5, 1.2, 0x5b3f7a, 0, 0.45, -D / 2 + 0.7); K.box(W * 0.8, 0.9, 0.2, 0x5b3f7a, 0, 1.1, -D / 2 + 0.15); }
    } else {
      K.box(2.2, 1.4, 0.05, 0x9fc3ff, -W / 4, 2.4, -D / 2 + 0.07, { emissive: 0x2a3f6f, emissiveIntensity: 0.9 });
      K.box(2.6, 2.4, 0.5, 0x4a3426, W / 2 - 1.6, 1.2, -D / 2 + 0.3);
      for (let i = 0; i < 9; i++) K.box(0.18, 0.5, 0.35, [0xb33a3a, 0x3a6db3, 0x3ab37a, 0xb3a13a][i % 4], W / 2 - 2.7 + i * 0.27, 1.95 - (i % 2) * 0.9, -D / 2 + 0.35);
    }
    K.lamp(0, H - 0.6, 0);
  }
  const n = loc.ev.length;
  const radius = env === "corridor" ? 4.6 : env === "train" ? 1.7 : env === "snow" || env === "outdoor" ? 3.2 : 2.6;
  const pick = [], items = [];
  loc.ev.forEach((ev, i) => {
    const a = n === 1 ? 0 : -0.9 + (1.8 * i) / (n - 1);
    let x = Math.sin(a) * radius, z = -Math.cos(a) * radius * 0.55 + 0.6;
    if (env === "corridor") { x = (i - (n - 1) / 2) * 3; z = 0; }
    const base = env === "snow" ? 0.6 : 0;
    K.table(x, z, 0.8, 1.1, 0.8, 0x6b4a33, base); K.shadow(x, z, 0.75, base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffc94d, transparent: true, opacity: 0.9 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, base + 0.86, z); K.scene.add(ring);
    const obj = K.box(0.34, 0.22, 0.26, 0xd9d9e8, x, base + 0.96, z, { roughness: 0.4 });
    const s = evState(ev);
    const sp = K.sprite(labelTex(s === "locked" ? "🔒" : ev.ico, s === "locked" ? "Yopiq" : ev.name, s === "seen" ? "✓ Tekshirildi" : s === "locked" ? "" : "Bosing", s === "seen" ? "#2ee59d" : s === "locked" ? "#8a8fb8" : "#ffc94d"), x, base + 2.05, z, 1.9, 1.3);
    const it = { ev, ring, obj, sp, by: sp.position.y, ph: i * 1.3, s };
    if (s === "seen") ring.material.color.set(0x2ee59d); if (s === "locked") ring.material.color.set(0x555577);
    pick.push(pickable(obj, it), pickable(sp, it)); items.push(it);
  });
  anim.push((t) => {
    for (const it of items) { it.sp.position.y = it.by + Math.sin(t / 600 + it.ph) * 0.06; if (it.s === "new") { const k = 1 + Math.sin(t / 300 + it.ph) * 0.12; it.ring.scale.set(k, k, k); } }
    if (warm) warm.intensity = 16 + Math.sin(t / 900) * 2;
  });
  const far = env === "corridor" ? 8 : env === "train" ? 4.4 : 6.2;
  const lim = env === "outdoor" || env === "snow" ? {} : { minA: -1.1, maxA: 1.1 };
  return {
    scene: K.scene, pick, anim, cam: [0, env === "train" ? 2.4 : 3.4, far], target: [0, 1, 0],
    limits: { minD: 2.2, maxD: far + 3, minP: 0.35, ...lim }, autoRotate: true, alwaysAnimate: env === "snow",
    items,
    onPick: (it) => onPick(it),
    update(it, s) {
      it.s = s; it.sp.material.map.dispose();
      it.sp.material.map = labelTex(s === "locked" ? "🔒" : it.ev.ico, s === "locked" ? "Yopiq" : it.ev.name, s === "seen" ? "✓ Tekshirildi" : "Bosing", s === "seen" ? "#2ee59d" : "#ffc94d");
      it.sp.material.needsUpdate = true; it.ring.scale.set(1, 1, 1); it.ring.material.color.set(s === "seen" ? 0x2ee59d : 0xffc94d);
    },
  };
}

/* ===================== 4) SO'ROQ XONASI ===================== */
export function buildInterrogation(suspects, badge, onPick) {
  const K = kit(0x08080f, [12, 30]);
  K.lights(0.55, 0.5);
  const spot = new THREE.SpotLight(0xfff1c4, 60, 14, 0.75, 0.5, 1.6); spot.position.set(0, 4.2, 0.6); spot.target.position.set(0, 0, -0.6); K.scene.add(spot, spot.target);
  K.plane(12, 10, 0x2b2b33, 0, 0, 0);
  K.box(12, 4, 0.1, 0x30344a, 0, 2, -4); K.box(0.1, 4, 10, 0x30344a, -6, 2, 0); K.box(0.1, 4, 10, 0x30344a, 6, 2, 0);
  // bir tomonlama oyna
  K.box(4, 1.6, 0.05, 0x101826, 0, 2.2, -3.93, { metalness: 0.9, roughness: 0.15 });
  K.box(4.2, 0.08, 1.6, 0x3a3f4f, 0, 0.9, -0.6); for (const [dx, dz] of [[-1.9, -1.2], [1.9, -1.2], [-1.9, 0], [1.9, 0]]) K.box(0.08, 0.9, 0.08, 0x222222, dx, 0.45, -0.6 + dz + 0.6);
  K.lamp(0, 3.6, -0.6);
  K.box(0.5, 0.04, 0.35, 0xf4ecd8, -0.6, 0.95, -0.2); K.cyl(0.07, 0.06, 0.14, 0xf4ecd8, 0.8, 1, -0.1);
  const n = suspects.length, pick = [], people = [];
  suspects.forEach((s, i) => {
    const a = n === 1 ? 0 : -0.75 + (1.5 * i) / (n - 1);
    const x = Math.sin(a) * 2.6, z = -1.7 - Math.cos(a) * 0.6;
    K.box(0.6, 0.5, 0.6, 0x222233, x, 0.25, z); K.box(0.6, 0.7, 0.08, 0x222233, x, 0.85, z - 0.3);
    const p = person(K, x, z, s.face, i, -a * 0.7, true);
    const sp = K.sprite(labelTex(s.face, s.name, badge(s), "#00d4ff"), x, 2.65, z, 1.5, 1.03);
    const data = { s, p, x, z, sp };
    pick.push(pickable(p.body, data), pickable(p.head, data), pickable(sp, data)); people.push(data);
  });
  const anim = [(t) => people.forEach((d, i) => { d.p.grp.position.y = Math.sin(t / 900 + i) * 0.015; d.sp.position.y = 2.65 + Math.sin(t / 700 + i) * 0.05; })];
  return { scene: K.scene, pick, anim, people, cam: [0, 3, 5.4], target: [0, 1.2, -1.2], limits: { minD: 2.5, maxD: 8, minA: -0.8, maxA: 0.8, maxP: 1.35 }, onPick: (d) => onPick(d),
    relabel(d) { d.sp.material.map.dispose(); d.sp.material.map = labelTex(d.s.face, d.s.name, badge(d.s), "#00d4ff"); d.sp.material.needsUpdate = true; } };
}

/* ===================== 5) DALILLAR TAXTASI ===================== */
export function buildBoard(cards, links, onPick) {
  const K = kit(0x0d0d1c, [14, 30]);
  K.lights(1.4, 1.1, [0xffe9b8, 18, [0, 3.5, 2]]);
  K.plane(14, 10, 0x2e2622, 0, 0, 0);
  K.box(14, 6, 0.1, 0x30344a, 0, 3, -2);
  const portrait = innerWidth < 760;
  const cols = portrait ? Math.min(2, Math.max(1, cards.length)) : Math.max(2, Math.min(4, Math.ceil(Math.sqrt(Math.max(1, cards.length) * 1.4)))), rows = Math.max(1, Math.ceil(cards.length / cols));
  const cw = 1.9, ch = 1.19, gx = 0.2, gy = 0.18;
  const bw = cols * (cw + gx) + 0.6, bh = rows * (ch + gy) + 0.6;
  const cy = 0.6 + bh / 2 + 0.2;
  K.box(bw + 0.2, bh + 0.2, 0.12, 0x5a3b26, 0, cy, -1.9); K.box(bw, bh, 0.05, 0xb8925a, 0, cy, -1.82);
  const pick = [], meshes = new Map();
  cards.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = -bw / 2 + 0.3 + cw / 2 + col * (cw + gx), y = cy + bh / 2 - 0.3 - ch / 2 - row * (ch + gy);
    // MeshBasicMaterial — yorug'likka bog'liq emas, kartalar doim aniq o'qiladi
    const m = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), new THREE.MeshBasicMaterial({ map: cardTex(c.kind, c.icon, c.head, c.body, c.state, c.sus) }));
    m.position.set(x, y, -1.78); m.rotation.z = ((i * 7919) % 7 - 3) * 0.006; K.scene.add(m);
    const pin = K.sphere(0.05, c.kind === "st" ? 0x7c5cff : 0xff3b5c, x, y + ch / 2 - 0.08, -1.74, { emissive: 0x330000, emissiveIntensity: 0.4 });
    const data = { card: c, mesh: m, pin, x, y };
    pick.push(pickable(m, data)); meshes.set(c.id, data);
  });
  // topilgan qarama-qarshiliklar — qizil iplar
  for (const [a, b] of links) {
    const A = meshes.get(a), B = meshes.get(b); if (!A || !B) continue;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(A.x, A.y + ch / 2 - 0.08, -1.72), new THREE.Vector3((A.x + B.x) / 2, Math.min(A.y, B.y) - 0.15, -1.68), new THREE.Vector3(B.x, B.y + ch / 2 - 0.08, -1.72)]);
    K.scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff2a4a })));
  }
  K.lamp(0, 5.3, 0.5);
  // kamerani taxta o'lchamiga moslash (pastki panel uchun joy qoldirib)
  const aspect = portrait ? 0.62 : 1.7;
  // portretda taxta baland bo'ladi — kamera yuqori qismga qaraydi, foydalanuvchi pastga suradi
  const visH = portrait ? Math.min(bh, 3 * (ch + gy) + 0.6) : bh;
  const dist = (Math.max(bw / aspect, visH * 1.5) / 2) / Math.tan((26 * Math.PI) / 180) * 1.05;
  const ty = portrait ? cy + bh / 2 - visH * 0.62 : cy - bh * 0.26 - 0.2;
  const anim = [(t) => { for (const d of meshes.values()) if (d.pulse) d.mesh.scale.setScalar(1 + Math.sin(t / 260) * 0.025); }];
  return { scene: K.scene, pick, anim, meshes, noFit: true, alwaysAnimate: false, cam: [0, ty + 0.1, -1.8 + dist], target: [0, ty, -1.8], limits: { minD: 1.4, maxD: dist + 3, minA: -0.5, maxA: 0.5, minP: 1.0, maxP: 2.0 }, onPick: (d) => onPick(d),
    restyle(d, state, sus) {
      d.mesh.material.map.dispose(); d.mesh.material.map = cardTex(d.card.kind, d.card.icon, d.card.head, d.card.body, state, sus); d.mesh.material.needsUpdate = true;
      d.mesh.position.z = state === "sel" ? -1.62 : state === "cand" ? -1.7 : -1.78;
      d.pulse = state === "cand"; d.mesh.scale.setScalar(state === "sel" ? 1.06 : 1);
    } };
}

/* ===================== 6) SUD ZALI ===================== */
export function buildCourt(suspects, onPick) {
  const K = kit(0x120d0a, [14, 34]);
  K.lights(0.75, 0.7, [0xffd9a0, 14, [0, 4, 2]]);
  K.plane(16, 12, 0x4a3020, 0, 0, 0);
  K.box(16, 6, 0.1, 0x3a2a20, 0, 3, -4.5);
  // bo'y o'lchagich devori
  K.box(8, 3, 0.05, 0x2f3445, 0, 1.6, -4.4);
  for (let i = 0; i <= 6; i++) K.box(8, 0.03, 0.02, 0x9aa3c0, 0, 0.4 + i * 0.4, -4.36);
  // sudya stoli
  K.box(3.6, 1.3, 1, 0x5a3b26, 0, 0.65, 2.6); K.box(3.8, 0.1, 1.2, 0x6b4a33, 0, 1.33, 2.6);
  K.cyl(0.05, 0.05, 0.4, 0x7a5232, 0.9, 1.5, 2.6); K.box(0.3, 0.14, 0.14, 0x7a5232, 0.9, 1.72, 2.6);
  K.sprite(labelTex("⚖️", "Sud zali", "Aybdorni tanlang", "#ffc94d"), 0, 4.3, -4.3, 1.7, 1.17);
  const n = suspects.length, pick = [], people = [];
  const spot = new THREE.SpotLight(0xffffff, 0, 10, 0.4, 0.4, 1.4); spot.position.set(0, 5, -1); K.scene.add(spot, spot.target);
  suspects.forEach((s, i) => {
    const x = (i - (n - 1) / 2) * 1.6, z = -3.4;
    const p = person(K, x, z, s.face, i, 0, false);
    const sp = K.sprite(labelTex(s.face, s.name, s.role, "#ffc94d"), x, 2.75, z, 1.45, 1);
    const data = { s, p, x, z, sp };
    pick.push(pickable(p.body, data), pickable(p.head, data), pickable(sp, data)); people.push(data);
  });
  let sel = null;
  const anim = [(t) => people.forEach((d, i) => { const up = d === sel ? 0.12 + Math.abs(Math.sin(t / 250)) * 0.08 : Math.sin(t / 900 + i) * 0.015; d.p.grp.position.y = up; })];
  return { scene: K.scene, pick, anim, people, cam: [innerWidth >= 760 ? 1.6 : 0, 3.1, 5.2], target: [innerWidth >= 760 ? 1.6 : 0, 1.5, -2.8], limits: { minD: 3, maxD: 9, minA: -0.7, maxA: 0.7, maxP: 1.4 }, onPick: (d) => onPick(d), alwaysAnimate: true,
    select(d) { sel = d; spot.intensity = d ? 70 : 0; if (d) { spot.position.set(d.x, 5, d.z + 2); spot.target.position.set(d.x, 0, d.z); } },
    verdict(d, ok) { if (!d) return; d.p.body.material = K.mat(ok ? 0xff3b5c : 0x666677); spot.color.set(ok ? 0xff5c7a : 0xffffff); } };
}

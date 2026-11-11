// Detektiv uchun yengil 3D sahna (Three.js). Qotmaslik uchun:
//  - past poligonli primitivlar, soyasiz yorug'lik (soxta soyalar — doira tekisliklar)
//  - pixelRatio cheklangan, mobil qurilmada antialias o'chirilgan
//  - sahna ekranda ko'rinmasa yoki tab yashirin bo'lsa — kadr chizilmaydi
//  - foydalanuvchi tegmasa va animatsiya bo'lmasa — 20 fps ga tushadi
let THREE = null, OrbitControls = null;
export async function load3D() {
  if (THREE) return true;
  try {
    THREE = await import("three");
    ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
    return true;
  } catch (e) { console.warn("3D yuklanmadi", e); return false; }
}
export const webglOK = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };

// Joy turlari
const ENV = {
  bog: "outdoor", perron: "snow",
  kupe7: "train", kupe6: "train", kupe8: "train", yolak: "corridor", provodnik: "train",
  peshtaxta: "room", stol: "room",
};
const PALETTE = [
  { wall: 0x4a3f78, floor: 0x5c4a3f, accent: 0xffc94d },
  { wall: 0x34507a, floor: 0x4a4550, accent: 0x00d4ff },
  { wall: 0x5a3a66, floor: 0x5a4433, accent: 0xff4fd8 },
  { wall: 0x3a5a4c, floor: 0x50463a, accent: 0x2ee59d },
];
function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

function labelTexture(icon, name, state) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 200;
  const g = c.getContext("2d");
  const col = state === "seen" ? "#2ee59d" : state === "locked" ? "#8a8fb8" : "#ffc94d";
  g.fillStyle = "rgba(10,10,30,.78)"; roundRect(g, 18, 6, 220, 128, 26); g.fill();
  g.lineWidth = 5; g.strokeStyle = col; roundRect(g, 18, 6, 220, 128, 26); g.stroke();
  g.font = "84px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(state === "locked" ? "🔒" : icon, 128, 72);
  g.font = "bold 26px Inter, Arial, sans-serif"; g.fillStyle = "#fff";
  const txt = state === "locked" ? "Yopiq" : name.length > 16 ? name.slice(0, 15) + "…" : name;
  g.fillStyle = "rgba(10,10,30,.85)"; const w = g.measureText(txt).width + 26; roundRect(g, 128 - w / 2, 146, w, 44, 14); g.fill();
  g.fillStyle = state === "seen" ? "#2ee59d" : "#fff"; g.fillText(txt + (state === "seen" ? " ✓" : ""), 128, 169);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2;
  return t;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

export async function mountScene(container, loc, opts) {
  if (!webglOK() || !(await load3D())) return null;
  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
  const env = ENV[loc.id] || "room";
  const rnd = seeded(loc.id);
  const pal = PALETTE[Math.floor(rnd() * PALETTE.length)];

  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: "high-performance", alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = "scene-canvas";

  const scene = new THREE.Scene();
  const sky = env === "outdoor" ? 0x16243a : env === "snow" ? 0x1b2236 : 0x0b0b1a;
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, 16, 40);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);

  // yorug'lik (soyasiz)
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x2a1d14, env === "outdoor" || env === "snow" ? 1.4 : 1.25));
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.3); key.position.set(4, 8, 5); scene.add(key);
  const warm = new THREE.PointLight(pal.accent, 18, 14, 2); warm.position.set(0, 3.2, 0); scene.add(warm);

  const mats = {};
  const mat = (color, extra = {}) => { const k = color + JSON.stringify(extra); return (mats[k] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra })); };
  const geos = [];
  const box = (w, h, d, color, x, y, z, extra) => { const g = new THREE.BoxGeometry(w, h, d); geos.push(g); const m = new THREE.Mesh(g, mat(color, extra)); m.position.set(x, y, z); scene.add(m); return m; };
  const cyl = (rt, rb, h, color, x, y, z, seg = 12, extra) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); geos.push(g); const m = new THREE.Mesh(g, mat(color, extra)); m.position.set(x, y, z); scene.add(m); return m; };
  const shadow = (x, z, r, y0 = 0) => { const g = new THREE.CircleGeometry(r, 20); geos.push(g); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y0 + 0.01, z); scene.add(m); };

  // ---------- muhit ----------
  let W = 10, D = 8;
  if (env === "train" || env === "corridor") { W = env === "corridor" ? 14 : 6; D = env === "corridor" ? 3.4 : 4.2; }
  if (env === "outdoor" || env === "snow") {
    const g = new THREE.PlaneGeometry(60, 60); geos.push(g);
    const ground = new THREE.Mesh(g, mat(env === "snow" ? 0xdfe8f5 : 0x1f3d2a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    if (env === "snow") {
      box(18, 0.6, 5.5, 0x6b7280, 0, 0.3, -0.6); // perron
      box(18, 2.6, 2.6, 0x2c4a7a, 0, 1.6, -4.6); // vagon
      for (let i = -3; i <= 3; i++) box(1.2, 0.8, 0.05, 0xffe9a8, i * 2.4, 2.1, -3.28, { emissive: 0xffd27a, emissiveIntensity: 0.9 });
      cyl(0.08, 0.08, 4, 0x444444, 6.5, 2, -2.6); box(0.9, 0.2, 0.5, 0xfff4cc, 6.5, 4, -2.6, { emissive: 0xfff0b0, emissiveIntensity: 1.2 });
    } else {
      for (let i = 0; i < 9; i++) { const x = (rnd() - 0.5) * 22, z = -4 - rnd() * 10; cyl(0.15, 0.22, 2, 0x5a3b22, x, 1, z, 7); const g2 = new THREE.ConeGeometry(1 + rnd() * 0.6, 2.6, 8); geos.push(g2); const t = new THREE.Mesh(g2, mat(0x2f7a45)); t.position.set(x, 3, z); scene.add(t); }
      box(3, 0.12, 0.8, 0x7a5232, -2.5, 0.6, 1.2); box(3, 0.6, 0.12, 0x7a5232, -2.5, 0.95, 0.85); // skameyka
      for (let i = 0; i < 14; i++) { const g3 = new THREE.SphereGeometry(0.18, 6, 5); geos.push(g3); const f = new THREE.Mesh(g3, mat([0xff4fd8, 0xffc94d, 0xff5c7a][i % 3])); f.position.set(2 + (i % 5) * 0.5, 0.2, 1 + Math.floor(i / 5) * 0.5); scene.add(f); }
    }
  } else {
    const fg = new THREE.PlaneGeometry(W, D); geos.push(fg);
    const floor = new THREE.Mesh(fg, mat(pal.floor)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const H = env === "room" ? 4 : 3;
    box(W, H, 0.1, pal.wall, 0, H / 2, -D / 2);
    box(0.1, H, D, pal.wall, -W / 2, H / 2, 0);
    box(0.1, H, D, pal.wall, W / 2, H / 2, 0);
    // plintus va gilam
    box(W, 0.12, 0.14, 0x111122, 0, 0.06, -D / 2 + 0.08);
    const rg = new THREE.PlaneGeometry(W * 0.45, D * 0.4); geos.push(rg); const rug = new THREE.Mesh(rg, mat(0x5b2333)); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.012, 0.3); scene.add(rug);
    if (env === "train" || env === "corridor") {
      for (let i = 0; i < (env === "corridor" ? 5 : 2); i++) box(1.4, 0.9, 0.04, 0x9fc3ff, (i - (env === "corridor" ? 2 : 0.5)) * 2.6, 1.8, -D / 2 + 0.07, { emissive: 0x3a5f9f, emissiveIntensity: 0.8 });
      if (env === "train") { box(W * 0.8, 0.5, 1.2, 0x5b3f7a, 0, 0.45, -D / 2 + 0.7); box(W * 0.8, 0.9, 0.2, 0x5b3f7a, 0, 1.1, -D / 2 + 0.15); }
    } else {
      // deraza
      box(2.2, 1.4, 0.05, 0x9fc3ff, -W / 4, 2.4, -D / 2 + 0.07, { emissive: 0x2a3f6f, emissiveIntensity: 0.9 });
      // javon
      box(2.6, 2.4, 0.5, 0x4a3426, W / 2 - 1.6, 1.2, -D / 2 + 0.3);
      for (let i = 0; i < 9; i++) box(0.18, 0.5, 0.35, [0xb33a3a, 0x3a6db3, 0x3ab37a, 0xb3a13a][i % 4], W / 2 - 2.7 + i * 0.27, 1.95 - (i % 2) * 0.9, -D / 2 + 0.35);
    }
    // osma chiroq
    cyl(0.02, 0.02, 1, 0x222222, 0, H - 0.5, 0); cyl(0.25, 0.5, 0.35, 0x222233, 0, H - 1.05, 0, 14);
    const bg = new THREE.SphereGeometry(0.16, 10, 8); geos.push(bg); const bulb = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0xfff1c4 })); bulb.position.set(0, H - 1.2, 0); scene.add(bulb);
  }

  // ---------- dalillar ----------
  const n = loc.ev.length;
  const radius = env === "corridor" ? 4.6 : env === "train" ? 1.7 : env === "snow" || env === "outdoor" ? 3.2 : 2.6;
  const items = [];
  const raycastables = [];
  loc.ev.forEach((ev, i) => {
    const a = n === 1 ? 0 : -0.9 + (1.8 * i) / (n - 1);
    let x = Math.sin(a) * radius, z = -Math.cos(a) * radius * 0.55 + 0.6;
    if (env === "corridor") { x = (i - (n - 1) / 2) * 3; z = 0; }
    // stol + buyum
    const base = env === "snow" ? 0.6 : 0;
    const tableH = 0.8 + base;
    box(1.1, 0.08, 0.8, 0x6b4a33, x, tableH, z);
    for (const [dx, dz] of [[-0.48, -0.32], [0.48, -0.32], [-0.48, 0.32], [0.48, 0.32]]) box(0.06, 0.8, 0.06, 0x3b291c, x + dx, base + 0.4, z + dz);
    shadow(x, z, 0.75, base);
    const ringG = new THREE.TorusGeometry(0.42, 0.035, 8, 32); geos.push(ringG);
    const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffc94d, transparent: true, opacity: 0.9 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, tableH + 0.06, z); scene.add(ring);
    const objG = new THREE.BoxGeometry(0.34, 0.22, 0.26); geos.push(objG);
    const obj = new THREE.Mesh(objG, mat(0xd9d9e8, { roughness: 0.4 })); obj.position.set(x, tableH + 0.16, z); scene.add(obj);
    const sm = new THREE.SpriteMaterial({ map: labelTexture(ev.ico, ev.name, opts.state(ev)), transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(sm); sp.scale.set(1.9, 1.48, 1); sp.position.set(x, tableH + 1.25, z); scene.add(sp);
    const it = { ev, ring, obj, sp, baseY: sp.position.y, phase: i * 1.3, state: opts.state(ev) };
    obj.userData.item = sp.userData.item = it;
    raycastables.push(obj, sp);
    items.push(it);
  });

  // qor
  let snow = null;
  if (env === "snow") {
    const cnt = mobile ? 250 : 500; const pos = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) { pos[i * 3] = (Math.random() - 0.5) * 24; pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = (Math.random() - 0.5) * 16; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geos.push(g);
    snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.85 }));
    scene.add(snow);
  }

  // ---------- kamera ----------
  const controls = new OrbitControls(camera, renderer.domElement);
  const far = env === "corridor" ? 8 : env === "train" ? 4.4 : 6.2;
  camera.position.set(0, env === "train" ? 2.4 : 3.4, far);
  controls.target.set(0, 1, env === "corridor" ? 0 : 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.2; controls.maxDistance = far + 3;
  controls.maxPolarAngle = Math.PI / 2 - 0.08; controls.minPolarAngle = 0.35;
  if (env !== "outdoor" && env !== "snow") { controls.minAzimuthAngle = -1.1; controls.maxAzimuthAngle = 1.1; }
  controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
  controls.addEventListener("start", () => { controls.autoRotate = false; active = performance.now(); });
  controls.addEventListener("change", () => (active = performance.now()));

  // o'lcham
  const resize = () => { const w = container.clientWidth || 300; const h = Math.round(Math.min(Math.max(w * (mobile ? 0.95 : 0.56), 300), 520)); renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = h + "px"; camera.aspect = w / h; camera.updateProjectionMatrix(); };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(container);

  // ---------- bosish ----------
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(); let down = null;
  const pick = (e) => { const r = renderer.domElement.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1; ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(raycastables, false)[0]; return hit?.object.userData.item; };
  const onDown = (e) => (down = { x: e.clientX, y: e.clientY });
  const onUp = (e) => { if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 8) return; const it = pick(e); if (it) { controls.autoRotate = false; focusOn(it); opts.onPick(it.ev); } };
  const onMove = (e) => { if (mobile || e.buttons) return; renderer.domElement.style.cursor = pick(e) ? "pointer" : "grab"; };
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointermove", onMove);

  // kamerani buyumga silliq yaqinlashtirish
  let fly = null;
  function focusOn(it) {
    const to = new THREE.Vector3(it.obj.position.x, 1.45, it.obj.position.z);
    const dir = camera.position.clone().sub(controls.target).normalize();
    fly = { t0: performance.now(), fromT: controls.target.clone(), toT: to, fromP: camera.position.clone(), toP: to.clone().add(dir.multiplyScalar(4.2)).setY(Math.max(2.3, camera.position.y * 0.85)) };
  }

  // ---------- kadr sikli ----------
  let visible = true, active = performance.now(), last = 0;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); io.observe(container);
  renderer.setAnimationLoop((t) => {
    if (!visible || document.hidden) return;
    const idle = !fly && !controls.autoRotate && t - active > 2500;
    if (idle && t - last < 50) return; // tinch holatda ~20 fps
    last = t;
    if (fly) {
      const k = Math.min(1, (t - fly.t0) / 700), e = 1 - Math.pow(1 - k, 3);
      controls.target.lerpVectors(fly.fromT, fly.toT, e); camera.position.lerpVectors(fly.fromP, fly.toP, e);
      if (k >= 1) fly = null;
    }
    for (const it of items) {
      it.sp.position.y = it.baseY + Math.sin(t / 600 + it.phase) * 0.06;
      if (it.state === "new") { const s = 1 + Math.sin(t / 300 + it.phase) * 0.12; it.ring.scale.set(s, s, s); it.ring.material.opacity = 0.55 + Math.sin(t / 300 + it.phase) * 0.35; }
    }
    if (snow) { const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - 0.02; if (y < 0) y = 10; p.setY(i, y); } p.needsUpdate = true; }
    warm.intensity = 16 + Math.sin(t / 900) * 2;
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    refresh() {
      for (const it of items) {
        const s = opts.state(it.ev);
        if (s !== it.state) {
          it.state = s;
          it.sp.material.map.dispose(); it.sp.material.map = labelTexture(it.ev.ico, it.ev.name, s); it.sp.material.needsUpdate = true;
          it.ring.material.color.set(s === "seen" ? 0x2ee59d : s === "locked" ? 0x555577 : 0xffc94d);
          it.ring.scale.set(1, 1, 1);
        }
      }
      active = performance.now();
    },
    dispose() {
      renderer.setAnimationLoop(null); ro.disconnect(); io.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointerup", onUp); renderer.domElement.removeEventListener("pointermove", onMove);
      for (const it of items) { it.sp.material.map.dispose(); it.sp.material.dispose(); it.ring.material.dispose(); }
      geos.forEach((g) => g.dispose()); Object.values(mats).forEach((m) => m.dispose());
      renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    },
  };
}

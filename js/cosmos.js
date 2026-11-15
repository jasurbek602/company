// "Aql koinoti" — bosh sahifadagi 3D sahna.
// Markazda katta intellekt yadrosi, atrofida 3 ta orbitada barcha bo'limlar va o'yinlar aylanadi.
// Yengil bo'lishi uchun:
//  - bloom/postprocessing yo'q — yorug'lik additiv spraytlar bilan "soxtalanadi"
//  - pixelRatio cheklangan; kadr sekin bo'lsa avtomatik sifat pasayadi
//  - sahna ko'rinmasa yoki tab yashirin bo'lsa — chizilmaydi
//  - yozuvlar (sayyora nomlari) HTML — aniq ko'rinadi va bosiladi
//  - WebGL bo'lmasa — CSS varianti (hamma havolalar baribir ishlaydi)

export const NODES = [
  // ichki orbita
  { id: "test", ico: "🧠", name: "IQ test", sub: "Bepul · 36 savol", href: "#/test", ring: 0, col: 0x00d4ff, free: true },
  { id: "ptest", ico: "👑", name: "Premium test", sub: "60 savol · ±3,5", href: "#/test", ring: 0, col: 0xffc94d, prem: true },
  { id: "rating", ico: "🏆", name: "Reyting", sub: "Eng aqllilar", href: "#/rating", ring: 0, col: 0xffa63d, free: true },
  // o'rta orbita — 7 trenajyor
  { id: "nback", ico: "🧬", name: "Dual N-Back", sub: "Ishchi xotira", href: "#/games/nback", ring: 1, col: 0x7c5cff, prem: true },
  { id: "trainer", ico: "⚙️", name: "IQ trener", sub: "Moslashuvchan", href: "#/games/trainer", ring: 1, col: 0x00d4ff, prem: true },
  { id: "rotate", ico: "🧊", name: "Aylantirish", sub: "Fazoviy tafakkur", href: "#/games/rotate", ring: 1, col: 0x5ad8ff, prem: true },
  { id: "schulte", ico: "🔢", name: "Schulte", sub: "Diqqat tezligi", href: "#/games/schulte", ring: 1, col: 0x2ee59d, prem: true },
  { id: "memory", ico: "🟪", name: "Xotira panjarasi", sub: "Ketma-ket xotira", href: "#/games/memory", ring: 1, col: 0xb06bff, prem: true },
  { id: "stroop", ico: "🎨", name: "Stroop", sub: "Kognitiv nazorat", href: "#/games/stroop", ring: 1, col: 0xff4fd8, prem: true },
  { id: "math", ico: "⚡", name: "Tezkor hisob", sub: "Raqamli ravonlik", href: "#/games/math", ring: 1, col: 0xffd84d, prem: true },
  // tashqi orbita
  { id: "det", ico: "🕵️", name: "3D Detektiv", sub: "12 ta ish · 1-si bepul", href: "#/detective", ring: 2, col: 0xff4f7a },
  { id: "kids", ico: "🦉", name: "Bilimdon bola", sub: "Bolalar · bepul", href: "#/kids", ring: 2, col: 0x2ee59d, free: true },
  { id: "vip", ico: "💎", name: "Premium", sub: "15 000 so'm · bir marta", href: "#/vip", ring: 2, col: 0xffc94d },
];
const RINGS = [
  { r: 4.3, speed: 0.1, tiltX: 0.05, tiltZ: -0.04, col: 0x00d4ff },
  { r: 6.4, speed: -0.055, tiltX: -0.04, tiltZ: 0.05, col: 0x7c5cff },
  { r: 8.6, speed: 0.035, tiltX: 0.07, tiltZ: 0.02, col: 0xff4fd8 },
];

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const webglOK = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };

/* ---------- HTML ---------- */
export function cosmosHTML(me, premium) {
  const nodes = NODES.map((n, i) => `<a class="cz-node r${n.ring}" href="${n.href}" data-i="${i}" style="--k:${i};--c:#${n.col.toString(16).padStart(6, "0")}">
      <span class="cz-ico">${n.ico}</span><span class="cz-txt"><b>${n.name}</b><small>${n.sub}</small></span>${n.free ? `<i class="cz-badge free">BEPUL</i>` : n.prem && !premium ? `<i class="cz-badge">👑</i>` : ""}</a>`).join("");
  const title = splitChars("Koinotdagi eng kuchli kuch —") + ` <span class="grad-text cz-glow">${splitChars("sizning aqlingiz")}</span>`;
  return `<section class="cosmos" id="cosmos">
    <div class="cz-stars" aria-hidden="true"></div>
    <div class="cz-stage" id="czStage" aria-hidden="true"></div>
    <div class="cz-nodes" id="czNodes">${nodes}</div>
    <a class="cz-core" id="czCore" href="${me ? "#/me" : "#/test"}">
      <small>INTELLEKT DARAJASI</small>
      <b><span class="cz-iq-l">IQ</span> <span id="czIq">${me ? "0" : "?"}</span></b>
      <em>${me ? "Natijalarim →" : "Aniqlash →"}</em>
    </a>
    <div class="cz-head">
      <span class="cz-kicker">✦ Aql koinoti · Company IQ</span>
      <h1 class="cz-title">${title}</h1>
    </div>
    <div class="cz-cta">
      <a href="#/test" class="btn lg pulse-btn cz-mag">🚀 Testni boshlash — bepul</a>
      <a href="#/vip" class="btn gold lg cz-mag">👑 Premium · 15 000 so'm</a>
    </div>
    <div class="cz-hint"><span>Sayyorani tanlang</span><i></i><span>suring — koinot aylanadi</span></div>
    <div class="cz-flash"></div>
  </section>`;
}
function splitChars(s) {
  let k = 0;
  return s.split(" ").map((w) => `<span class="cz-w">${[...w].map((ch) => `<span class="cz-ch" style="--d:${(k++) * 28}ms">${ch}</span>`).join("")}</span>`).join(" ");
}

/* ---------- 3D ---------- */
export async function mountCosmos(root, { iq } = {}) {
  const stage = root.querySelector("#czStage");
  const nodeEls = [...root.querySelectorAll(".cz-node")];
  const coreEl = root.querySelector("#czCore");
  countUp(root.querySelector("#czIq"), iq);
  // magnit tugmalar
  const offMag = magnetic(root);

  let THREE;
  if (!webglOK()) return flat(root, offMag);
  try { THREE = await import("three"); } catch { return flat(root, offMag); }
  if (!root.isConnected) return () => {};

  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
  const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 && mobile;
  let dprCap = mobile ? (lowEnd ? 1 : 1.35) : 1.6;

  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

  const T = { value: 0 };
  const glowTex = radialTex(THREE, [[0, "rgba(255,255,255,1)"], [0.18, "rgba(255,255,255,.55)"], [0.45, "rgba(255,255,255,.12)"], [1, "rgba(255,255,255,0)"]]);

  /* --- yulduzlar --- */
  const SN = mobile ? 1300 : 3200;
  const sp = new Float32Array(SN * 3), sa = new Float32Array(SN * 3), sc = new Float32Array(SN * 3);
  const palette = [[1, 1, 1], [0.7, 0.85, 1], [1, 0.8, 0.95], [0.8, 0.75, 1], [1, 0.92, 0.7]];
  for (let i = 0; i < SN; i++) {
    const r = 45 + Math.random() * 110, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    sp.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th)], i * 3);
    sa.set([0.6 + Math.random() * 2.2, Math.random() * 6.28, 0.5 + Math.random() * 2.5], i * 3);
    sc.set(palette[(Math.random() * palette.length) | 0], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sg.setAttribute("aInfo", new THREE.BufferAttribute(sa, 3));
  sg.setAttribute("aCol", new THREE.BufferAttribute(sc, 3));
  const PX = { value: renderer.getPixelRatio() }, WARP = { value: 0 };
  const stars = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: { uT: T, uPx: PX, uWarp: WARP },
    vertexShader: `attribute vec3 aInfo; attribute vec3 aCol; uniform float uT; uniform float uPx; uniform float uWarp; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); float tw = .55 + .45*sin(uT*aInfo.z + aInfo.y);
        vC = aCol; vA = tw; gl_PointSize = aInfo.x * uPx * (1. + uWarp*3.) * (60. / -mv.z) * (.7+.3*tw); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d); a = a*a; gl_FragColor = vec4(vC, a*vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(stars);

  /* --- tumanliklar (nebula) --- */
  const nebulae = [];
  [[0x6a3cff, -38, 10, -70, 95, 0.5], [0x00a8ff, 42, -8, -80, 105, 0.38], [0xff3fb4, 10, 22, -95, 80, 0.3]].forEach(([c, x, y, z, s, o], k) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(THREE, 7 + k), color: c, transparent: true, opacity: mobile ? o * 0.8 : o, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(x, y, z); m.scale.set(s, s, 1); scene.add(m); nebulae.push(m);
  });

  /* --- tizim (yadro + orbitalar) --- */
  const sys = new THREE.Group(); scene.add(sys);

  // yadro: "neyron" yuzali shar
  const HOVER = { value: 0 };
  const core = new THREE.Mesh(new THREE.SphereGeometry(2, mobile ? 48 : 80, mobile ? 32 : 56), new THREE.ShaderMaterial({
    uniforms: { uT: T, uHover: HOVER },
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uT; uniform float uHover; varying vec3 vN; varying vec3 vP; varying vec3 vV;
      float h(vec3 p){ p = fract(p*.3183099+.1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }
      void main(){
        vec3 p = normalize(vP)*1.7;
        float n = fbm(p*1.6 + vec3(0., uT*.12, uT*.07));
        float m = fbm(p*3.1 - vec3(uT*.05, 0., uT*.09));
        float lines = 1. - smoothstep(0., .07, abs(fract(n*7. - uT*.22) - .5));
        float sparks = smoothstep(.72,.9,m) * (.5+.5*sin(uT*3. + n*20.));
        float fres = pow(1. - max(dot(normalize(vN), normalize(vV)), 0.), 2.3);
        vec3 deep = vec3(.05,.02,.2);
        vec3 body = mix(vec3(.32,.18,1.), vec3(0.,.8,1.), smoothstep(.3,.75,n));
        vec3 rim = mix(vec3(.49,.36,1.), vec3(1.,.31,.85), vN.y*.5+.5);
        float pulse = .6 + .4*sin(uT*1.7);
        vec3 col = deep + body*n*.6 + vec3(.6,.92,1.)*lines*(.55+.45*pulse) + vec3(1.,.85,.5)*sparks*.8 + rim*fres*1.7;
        col *= 1. + uHover*.35;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  sys.add(core);
  const halo = sprite(THREE, glowTex, 0x7c5cff, 15, 0.9); sys.add(halo);
  const halo2 = sprite(THREE, glowTex, 0x00d4ff, 8.5, 0.55); sys.add(halo2);

  // giroskop halqalar
  const gyro = [];
  [[2.75, 0x00d4ff, 0.75], [3.05, 0xff4fd8, 0.55], [3.35, 0x7c5cff, 0.4]].forEach(([r, c, o], k) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014 + k * 0.004, 6, mobile ? 120 : 200), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.set(Math.random() * 3, Math.random() * 3, 0); sys.add(m); gyro.push(m);
  });

  // akkretsiya diski
  const DN = mobile ? 1100 : 2800;
  const dA = new Float32Array(DN * 4), dPos = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) {
    const r = 2.35 + Math.pow(Math.random(), 1.6) * 1.9;
    dA.set([r, Math.random() * 6.283, (Math.random() - 0.5) * 0.12 * (r - 2), Math.random()], i * 4);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  dg.setAttribute("aD", new THREE.BufferAttribute(dA, 4));
  const disk = new THREE.Points(dg, new THREE.ShaderMaterial({
    uniforms: { uT: T, uPx: PX },
    vertexShader: `attribute vec4 aD; uniform float uT; uniform float uPx; varying float vK; varying float vR;
      void main(){ float a = aD.y + uT * (1.1 / (aD.x*aD.x)) * 2.2; vec3 p = vec3(cos(a)*aD.x, aD.z, sin(a)*aD.x);
        vec4 mv = modelViewMatrix*vec4(p,1.); vK = aD.w; vR = aD.x; gl_PointSize = (1.4 + aD.w*2.4) * uPx * (22. / -mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vK; varying float vR; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d);
        vec3 c = mix(vec3(1.,.85,.55), mix(vec3(0.,.83,1.), vec3(.6,.35,1.), vK), smoothstep(2.4,3.6,vR));
        gl_FragColor = vec4(c, a*(1. - smoothstep(3.4,4.3,vR))*.85); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  disk.rotation.x = 0.18; sys.add(disk);

  // orbitalar va sayyoralar
  const ringObjs = RINGS.map((R, ri) => {
    const g = new THREE.Group(); g.rotation.set(R.tiltX, 0, R.tiltZ); sys.add(g);
    const pts = []; for (let k = 0; k <= 256; k++) { const a = (k / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R.r, 0, Math.sin(a) * R.r)); }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: R.col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(line);
    // aylanma "chang" — orbitadagi mayda zarralar
    const OD = mobile ? 90 : 220, op = new Float32Array(OD * 3);
    for (let k = 0; k < OD; k++) { const a = Math.random() * 6.283, rr = R.r + (Math.random() - 0.5) * 0.35; op.set([Math.cos(a) * rr, (Math.random() - 0.5) * 0.15, Math.sin(a) * rr], k * 3); }
    const og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.BufferAttribute(op, 3));
    const dust = new THREE.Points(og, new THREE.PointsMaterial({ color: R.col, size: 0.06, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex, alphaTest: 0.01 }));
    g.add(dust);
    return { g, dust, line, R, angle: ri * 0.9, f: 1 };
  });
  const planets = NODES.map((n) => {
    const R = ringObjs[n.ring];
    const holder = new THREE.Group(); R.g.add(holder);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(n.col) }, uT: T },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.-max(dot(vN,vV),0.),2.); float l = max(dot(vN, normalize(vec3(-.4,.6,.7))),0.);
        gl_FragColor = vec4(uC*(.25+.6*l) + uC*f*1.6 + vec3(1.)*pow(l,18.)*.6, 1.); }`,
    }));
    holder.add(body);
    const glow = sprite(THREE, glowTex, n.col, 2.4, 0.75); holder.add(glow);
    // iz (trail) — sayyora orqasidagi yorqin yoy
    const TR = 48, tp = [], tc = [];
    const dir = Math.sign(R.R.speed);
    const col = new THREE.Color(n.col);
    for (let k = 0; k <= TR; k++) { const a = -dir * (k / TR) * 0.75; tp.push(Math.cos(a) * R.R.r, 0, Math.sin(a) * R.R.r); const f = Math.pow(1 - k / TR, 1.6); tc.push(col.r * f, col.g * f, col.b * f); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute("color", new THREE.Float32BufferAttribute(tc, 3));
    const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    R.g.add(trail);
    R.trails = (R.trails || []).concat(trail);
    return { n, R, holder, body, glow, trail, hover: 0, offset: 0 };
  });
  // har orbitadagi sayyoralarni teng taqsimlash
  RINGS.forEach((_, ri) => { const ps = planets.filter((p) => p.n.ring === ri); ps.forEach((p, k) => (p.offset = (k / ps.length) * Math.PI * 2)); });

  // yadrodan sayyoraga "energiya nuri"
  const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(beam);

  /* --- o'lcham va kamera --- */
  let W = 1, H = 1, portrait = false, camDist = 22, elev = 0.4;
  function resize() {
    const r = root.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false); camera.aspect = W / H;
    portrait = W / H < 0.9;
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    elev = portrait ? 0.62 : 0.27;
    const R = RINGS[2].r;
    const needW = (R * 1.28) / (tanV * camera.aspect);            // eni bo'yicha sig'sin (yozuvlar bilan)
    const needH = (R * Math.sin(elev) + 1.6) / (tanV * (H < 700 ? 0.5 : 0.6)); // sarlavha va tugmalarga tegmasin
    // portretda orbitalar zichroq — yadro kattaroq ko'rinadi
    const F = portrait ? [0.8, 0.74, 0.69] : [1, 1, 1];
    ringObjs.forEach((o, i) => { o.f = F[i]; [o.line, o.dust, ...(o.trails || [])].forEach((m) => m.scale.set(F[i], 1, F[i])); });
    if (portrait) {
      elev = 0.8; camDist = 21;
      sys.scale.setScalar(Math.min(1, (tanV * camera.aspect * camDist) / (R * F[2] * 1.0)));
    } else { camDist = Math.max(19, needW, needH); sys.scale.setScalar(1); }
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(root);

  /* --- boshqaruv: parallaks, surish, hover --- */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let spin = 0, spinV = 0, dragging = false, lastX = 0, downX = 0, downY = 0, moved = false, hoverIdx = -1;
  const onMove = (e) => {
    const r = root.getBoundingClientRect();
    ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ptr.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; spinV = dx * 0.0045; spin += spinV; if (Math.abs(e.clientX - downX) > 6) moved = true; }
  };
  const onDown = (e) => { if (e.target.closest(".cz-cta, .cz-core")) return; dragging = true; moved = false; lastX = downX = e.clientX; downY = e.clientY; };
  const onUp = () => { dragging = false; };
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerdown", onDown, { passive: true });
  addEventListener("pointerup", onUp, { passive: true }); addEventListener("pointercancel", onUp, { passive: true });
  // surib aylantirganda bosilish hisoblanmasin
  const onClickCapture = (e) => { if (moved && e.target.closest(".cz-node")) { e.preventDefault(); e.stopPropagation(); } moved = false; };
  root.addEventListener("click", onClickCapture, true);
  nodeEls.forEach((el, i) => {
    el.addEventListener("pointerenter", () => (hoverIdx = i));
    el.addEventListener("pointerleave", () => hoverIdx === i && (hoverIdx = -1));
    el.addEventListener("focus", () => (hoverIdx = i));
    el.addEventListener("blur", () => hoverIdx === i && (hoverIdx = -1));
    el.addEventListener("click", (e) => { if (e.defaultPrevented) return; e.preventDefault(); warpTo(i, el.getAttribute("href")); });
  });
  coreEl.addEventListener("pointerenter", () => (HOVER.value = 1));
  coreEl.addEventListener("pointerleave", () => (HOVER.value = 0));

  /* --- "warp" o'tish --- */
  let warp = null;
  function warpTo(i, href) {
    if (warp) return;
    if (reduced()) { location.hash = href; return; }
    const target = new THREE.Vector3(); planets[i].holder.getWorldPosition(target);
    warp = { t0: performance.now(), from: camera.position.clone(), to: target, href };
    root.classList.add("warping");
  }

  /* --- tsikl --- */
  const v3 = new THREE.Vector3(), corePos = new THREE.Vector3();
  let raf = 0, visible = true, last = performance.now(), frames = 0, slowAcc = 0, downgraded = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0 });
  io.observe(root);
  const onVis = () => { if (!document.hidden) { last = performance.now(); loop(); } };
  document.addEventListener("visibilitychange", onVis);
  const slow = reduced() ? 0.25 : 1;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // avtomatik sifat: kadrlar sekin bo'lsa — pixelRatio va zarralarni kamaytirish
    if (frames > 40 && frames < 400) { slowAcc = slowAcc * 0.95 + (dt > 0.03 ? 1 : 0) * 0.05; if (slowAcc > 0.55 && downgraded < 2) degrade(); }
    frames++;
    T.value += dt * slow;
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
    if (!dragging) { spinV *= 0.94; spin += spinV; }

    // kamera
    const yaw = ptr.x * 0.22 + T.value * 0.02, pitch = elev + ptr.y * -0.08;
    const cp = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch) * camDist, Math.sin(pitch) * camDist, Math.cos(yaw) * Math.cos(pitch) * camDist);
    if (warp) {
      const k = Math.min(1, (now - warp.t0) / 900), e = k * k * k;
      camera.position.lerpVectors(cp, warp.to, e * 0.92);
      camera.fov = 40 + e * 45; camera.updateProjectionMatrix();
      WARP.value = e;
      if (k >= 1 && !warp.done) { warp.done = true; location.hash = warp.href; }
    } else camera.position.copy(cp);
    camera.lookAt(0, portrait ? -0.6 : (H < 760 ? -1.1 : -0.5), 0);

    // tizim harakati
    core.rotation.y += dt * 0.12 * slow; core.rotation.x = Math.sin(T.value * 0.3) * 0.15;
    gyro.forEach((g, k) => { g.rotation.x += dt * (0.25 + k * 0.1) * slow; g.rotation.y += dt * (0.18 - k * 0.07) * slow; });
    halo.material.opacity = 0.75 + Math.sin(T.value * 1.7) * 0.15 + HOVER.value * 0.2;
    stars.rotation.y += dt * 0.006 * slow;
    nebulae.forEach((m, k) => (m.material.rotation += dt * 0.01 * (k % 2 ? -1 : 1) * slow));
    ringObjs.forEach((o) => { o.angle += dt * o.R.speed * slow; o.dust.rotation.y = -o.angle * 0.6; });

    // sayyoralar + HTML yozuvlar
    core.getWorldPosition(corePos); const cDepth = corePos.clone().applyMatrix4(camera.matrixWorldInverse).z;
    corePos.project(camera);
    coreEl.style.transform = `translate3d(${((corePos.x + 1) / 2) * W}px, ${((1 - corePos.y) / 2) * H}px, 0) translate(-50%,-50%)`;
    planets.forEach((p, i) => {
      const a = p.offset + p.R.angle + spin * (p.n.ring === 1 ? -0.8 : 1);
      const r = p.R.R.r * p.R.f;
      p.holder.position.set(Math.cos(a) * r, Math.sin(T.value * 0.8 + i) * 0.12, Math.sin(a) * r);
      p.trail.rotation.y = -a;
      p.hover += ((hoverIdx === i ? 1 : 0) - p.hover) * 0.15;
      const s = 1 + p.hover * 0.6; p.body.scale.setScalar(s); p.glow.scale.setScalar(2.4 * (1 + p.hover * 0.8));
      p.holder.getWorldPosition(v3);
      const depth = v3.clone().applyMatrix4(camera.matrixWorldInverse).z;
      v3.project(camera);
      const x = ((v3.x + 1) / 2) * W, y = ((1 - v3.y) / 2) * H;
      const behind = depth < cDepth - 0.5; // yadro orqasida
      const near = Math.hypot(x - ((corePos.x + 1) / 2) * W, y - ((1 - corePos.y) / 2) * H) < (portrait ? 70 : 120);
      const el = nodeEls[i];
      const op = behind && near ? 0.12 : behind ? 0.62 : 1;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${(behind ? 0.86 : 1) + p.hover * 0.12})`;
      el.style.opacity = warp ? 0 : op;
      el.style.zIndex = behind ? 1 : 3;
      el.classList.toggle("back", behind);
      if (hoverIdx === i) {
        p.holder.getWorldPosition(v3);
        beamGeo.attributes.position.setXYZ(1, v3.x, v3.y, v3.z); beamGeo.attributes.position.needsUpdate = true;
        beam.material.color.set(p.n.col);
      }
    });
    beam.material.opacity += ((hoverIdx >= 0 ? 0.85 : 0) - beam.material.opacity) * 0.15;
    renderer.render(scene, camera);
  }
  function degrade() {
    downgraded++;
    dprCap = downgraded === 1 ? Math.min(dprCap, 1) : 0.75;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap)); PX.value = renderer.getPixelRatio(); resize();
    sg.setDrawRange(0, Math.floor(SN / (downgraded + 1))); dg.setDrawRange(0, Math.floor(DN / (downgraded + 1)));
    if (downgraded === 2) nebulae.forEach((m) => (m.visible = false));
    slowAcc = 0;
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = (t) => { if (!visible || document.hidden || !root.isConnected) return; frame(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  loop();
  requestAnimationFrame(() => root.classList.add("ready"));

  return () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); offMag();
    document.removeEventListener("visibilitychange", onVis);
    removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp);
    scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.(); } });
    glowTex.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
  };
}

/* ---------- WebGL yo'q — CSS varianti ---------- */
function flat(root, offMag) {
  root.classList.add("cz-flat", "ready");
  return () => offMag();
}

/* ---------- yordamchilar ---------- */
function sprite(THREE, tex, col, s, o) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.scale.set(s, s, 1); return m;
}
function radialTex(THREE, stops) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function cloudTex(THREE, seed) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  let s = seed * 9301; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 46; i++) {
    const x = 128 + (rnd() - 0.5) * 150, y = 128 + (rnd() - 0.5) * 110, r = 24 + rnd() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${0.05 + rnd() * 0.09})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function countUp(el, to) {
  if (!el || !to) return;
  const t0 = performance.now(), dur = 1800;
  const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
  setTimeout(() => requestAnimationFrame(step), 600);
}
// tugmalar sichqonchaga "tortiladi" (faqat sichqoncha bilan)
export function magnetic(root) {
  if (!matchMedia("(pointer: fine)").matches || reduced()) return () => {};
  const els = [...root.querySelectorAll(".cz-mag")];
  const on = (e) => { const b = e.currentTarget, r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`; };
  const off = (e) => (e.currentTarget.style.translate = "");
  els.forEach((b) => { b.addEventListener("pointermove", on); b.addEventListener("pointerleave", off); });
  return () => els.forEach((b) => { b.removeEventListener("pointermove", on); b.removeEventListener("pointerleave", off); });
}

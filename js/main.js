/* =================================================================
   GOKUL P — PORTFOLIO | main.js (ES Module) v3
   Three.js · GSAP ScrollTrigger · Cinematic cursor glow & spring trail
   ================================================================= */

import * as THREE from 'three';

const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowPower = prefersReducedMotion || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

if (isTouchDevice) document.documentElement.classList.add('touch-device');

let animationRunning = true;
let rafId = 0;
let resizeTimer = 0;

/* ── LOADER ─────────────────────────────────────────────────── */
function runLoader() {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const rider = document.getElementById('loaderRider');
  const track = document.getElementById('loaderTrack');
  const pct = document.getElementById('loaderPct');
  if (!loader) { initEntranceAnimations(); return; }

  let progress = 0;
  const duration = isLowPower ? 600 : 1200;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    progress = Math.round(easeOutCubic(t) * 100);
    if (fill) fill.style.width = progress + '%';
    if (rider) rider.style.left = progress + '%';
    if (track) track.setAttribute('aria-valuenow', String(progress));
    if (pct) pct.textContent = progress + '%';
    if (t < 1) { requestAnimationFrame(tick); }
    else { loader.classList.add('hidden'); initEntranceAnimations(); }
  }
  requestAnimationFrame(tick);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
window.addEventListener('load', runLoader);

/* ── THREE.JS SCENE ─────────────────────────────────────────── */
let scene, camera, renderer;
let particleSystem, techGroup;
let techMeshes = [];
let targetMouseX = 0, targetMouseY = 0, currentMouseX = 0, currentMouseY = 0;
const scrollInfo = { y: 0, targetY: 0, docHeight: 1 };
const cameraBasePos = { x: 0, y: 0, z: 240 };
let isMobileDev = false;

const theme = {
  particleColor1: 0xd4af37,
  particleColor2: 0xf0d060,
  meshColor: 0xd4af37,
  ringColor: 0xf0d060,
  bgColor: 0x050505,
  fog: 0.0008
};

function initThree() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || prefersReducedMotion) { if (canvas) canvas.style.display = 'none'; return; }

  isMobileDev = isTouchDevice || window.innerWidth <= 768;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(theme.bgColor, theme.fog);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(cameraBasePos.x, cameraBasePos.y, cameraBasePos.z);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobileDev,
    alpha: true,
    powerPreference: 'high-performance',
    precision: isMobileDev ? 'mediump' : 'highp'
  });
  const maxDpr = isMobileDev ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(maxDpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const lightA = new THREE.PointLight(theme.particleColor1, 2.2, 350);
  lightA.position.set(120, 90, 80); scene.add(lightA);
  const lightB = new THREE.PointLight(theme.particleColor2, 1.6, 300);
  lightB.position.set(-110, -70, 60); scene.add(lightB);

  scrollInfo.docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  createParticles(theme);
  createTechFloats(theme);

  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(onWindowResize, 120); });
  if (!isTouchDevice) {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  } else {
    window.addEventListener('touchmove', e => {
      if (e.touches.length > 0) {
        targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 0.8;
        targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 0.8;
      }
    }, { passive: true });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', () => {
    animationRunning = !document.hidden;
    if (animationRunning && !rafId) animate();
  });
  animate();
}

function createParticles(palette) {
  const count = isMobileDev ? 160 : 480;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c1 = new THREE.Color(palette.particleColor1);
  const c2 = new THREE.Color(palette.particleColor2);
  const c3 = new THREE.Color(0xffd700);
  const scratch = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const r = isMobileDev ? (100 + Math.random() * 460) : (140 + Math.random() * 680);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    
    const mix = Math.random();
    if (mix < 0.5) scratch.copy(c1).lerp(c2, mix * 2);
    else scratch.copy(c2).lerp(c3, (mix - 0.5) * 2);
    colors[i*3] = scratch.r; colors[i*3+1] = scratch.g; colors[i*3+2] = scratch.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  particleSystem = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: isMobileDev ? 1.7 : 2.3, vertexColors: true, transparent: true,
    opacity: isMobileDev ? 0.5 : 0.65, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(particleSystem);
}

function wireMat(color, opacity = 0.45) {
  const finalOpacity = isMobileDev ? opacity * 0.8 : opacity;
  return new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: finalOpacity, depthWrite: false });
}

function solidMat(color, opacity = 0.32) {
  const finalOpacity = isMobileDev ? opacity * 0.8 : opacity;
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: finalOpacity, depthWrite: false });
}

function makeCodeBrackets(color) {
  const g = new THREE.Group();
  const barGeo = new THREE.BoxGeometry(2.2, 22, 2.2);
  const tipGeo = new THREE.BoxGeometry(10, 2.2, 2.2);
  const m = wireMat(color, 0.5);
  [[-12, 0, 0, 0], [12, 0, 0, 0], [-8, 10, 0, 0], [-8, -10, 0, 0], [8, 10, 0, Math.PI], [8, -10, 0, Math.PI]].forEach(([x, y, z, r], i) => {
    const mesh = new THREE.Mesh(i < 2 ? barGeo : tipGeo, m);
    mesh.position.set(x, y, z);
    if (r) mesh.rotation.z = r;
    g.add(mesh);
  });
  const slash = new THREE.Mesh(new THREE.BoxGeometry(2, 18, 2), m);
  slash.rotation.z = -0.45;
  g.add(slash);
  return g;
}

function makeReactAtom(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(4, isMobileDev ? 6 : 10, isMobileDev ? 6 : 10), solidMat(color, 0.55)));
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(16, 0.45, 4, isMobileDev ? 18 : 48), wireMat(color, 0.4));
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = (i * Math.PI) / 3;
    g.add(ring);
  }
  return g;
}

function makeNodeHex(color) {
  return new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 6, 6), wireMat(color, 0.45));
}

function makeDatabase(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 18, isMobileDev ? 8 : 16), wireMat(color, 0.4)));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.5, 4, isMobileDev ? 14 : 24), wireMat(color, 0.35)));
  return g;
}

function makeGitBranch(color) {
  const g = new THREE.Group();
  const m = solidMat(color, 0.5);
  [[0, -12, 0], [0, 0, 0], [0, 12, 0], [10, 6, 0]].forEach(([x, y, z]) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(2.4, isMobileDev ? 6 : 8, isMobileDev ? 6 : 8), m);
    n.position.set(x, y, z); g.add(n);
  });
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 24, 4), wireMat(color, 0.45));
  g.add(line);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 4), wireMat(color, 0.45));
  branch.rotation.z = -0.7; branch.position.set(5, 3, 0);
  g.add(branch);
  return g;
}

function makeTerminal(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(28, 18, 2), wireMat(color, 0.4)));
  const bar = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 1.2), solidMat(color, 0.45));
  bar.position.set(-1, 4, 1.5); g.add(bar);
  const prompt = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.2), solidMat(color, 0.4));
  prompt.position.set(-6, 0, 1.5); g.add(prompt);
  return g;
}

function makeApiNodes(color) {
  const g = new THREE.Group();
  const positions = [[-12, 0, 0], [12, 0, 0], [0, 12, 0], [0, -12, 0]];
  positions.forEach(([x, y, z]) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(3, isMobileDev ? 6 : 8, isMobileDev ? 6 : 8), solidMat(color, 0.5));
    n.position.set(x, y, z); g.add(n);
  });
  g.add(new THREE.Mesh(new THREE.TorusGeometry(12, 0.4, 4, isMobileDev ? 16 : 32), wireMat(color, 0.35)));
  return g;
}

function makeCoffeeCup(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(8, 7, 14, isMobileDev ? 8 : 12), wireMat(color, 0.42)));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(5, 0.7, 4, isMobileDev ? 10 : 16, Math.PI), wireMat(color, 0.42));
  handle.position.set(9, 0, 0); handle.rotation.y = Math.PI / 2;
  g.add(handle);
  return g;
}

function makeMongoLeaf(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(8, isMobileDev ? 6 : 10, isMobileDev ? 6 : 12, 0, Math.PI * 2, 0, Math.PI * 0.85), wireMat(color, 0.4)));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(4, 10, isMobileDev ? 6 : 8), wireMat(color, 0.4));
  tip.position.y = -10; g.add(tip);
  return g;
}

function makeSpringCoil(color) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.55, 4, isMobileDev ? 12 : 24), wireMat(color, 0.38));
    ring.position.y = i * 4 - 8;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }
  return g;
}

function makeTsBadge(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 2.5), wireMat(color, 0.42)));
  const bar = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 1.5), solidMat(color, 0.5));
  bar.position.set(0, 4, 2); g.add(bar);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 1.5), solidMat(color, 0.5));
  stem.position.set(0, -2, 2); g.add(stem);
  return g;
}

function makeDockerWhale(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 10), wireMat(color, 0.4));
  body.position.y = -2; g.add(body);
  [[-6, 4, 0], [-1, 4, 0], [4, 4, 0]].forEach(([x, y, z]) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), wireMat(color, 0.38));
    box.position.set(x, y, z); g.add(box);
  });
  return g;
}

function makeNextTriangle(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.ConeGeometry(14, 22, 3), wireMat(color, 0.4)));
  return g;
}

function makeCloud(color) {
  const g = new THREE.Group();
  [[0, 0, 0, 8], [-8, -2, 0, 6], [8, -2, 0, 6], [0, -4, 0, 7]].forEach(([x, y, z, r]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, isMobileDev ? 6 : 10, isMobileDev ? 6 : 10), wireMat(color, 0.35));
    puff.position.set(x, y, z); g.add(puff);
  });
  return g;
}

function makeChip(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(16, 16, 3), wireMat(color, 0.42)));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(8, 8, 4), solidMat(color, 0.4)));
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    [[i * 3.2, 10, 0], [i * 3.2, -10, 0], [10, i * 3.2, 0], [-10, i * 3.2, 0]].forEach(([x, y, z]) => {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), solidMat(color, 0.35));
      pin.position.set(x, y, z);
      if (Math.abs(x) > Math.abs(y)) pin.rotation.z = Math.PI / 2;
      g.add(pin);
    });
  }
  return g;
}

function makeHtmlTag(color) {
  const g = new THREE.Group();
  const m = wireMat(color, 0.45);
  const left = new THREE.Mesh(new THREE.BoxGeometry(2.2, 16, 2.2), m);
  left.position.x = -6; left.rotation.z = 0.45; g.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(2.2, 16, 2.2), m);
  right.position.x = 6; right.rotation.z = -0.45; g.add(right);
  const slash = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 2), m);
  slash.rotation.z = -0.5; g.add(slash);
  return g;
}

function makeLock(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(14, 12, 6), wireMat(color, 0.4)));
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(5, 1.1, 4, isMobileDev ? 10 : 16, Math.PI), wireMat(color, 0.4));
  shackle.position.y = 8; shackle.rotation.x = Math.PI; g.add(shackle);
  return g;
}

function createTechFloats(palette) {
  techGroup = new THREE.Group();
  scene.add(techGroup);

  const makers = [
    makeCodeBrackets, makeReactAtom, makeNodeHex, makeDatabase,
    makeGitBranch, makeTerminal, makeApiNodes, makeCoffeeCup, makeMongoLeaf, makeSpringCoil,
    makeTsBadge, makeDockerWhale, makeNextTriangle, makeCloud, makeChip, makeHtmlTag, makeLock
  ];
  const count = isMobileDev ? 4 : 9;
  const spread = isMobileDev ? Math.min(window.innerWidth / 3.2, 120) : Math.min(window.innerWidth / 8.5, 160);

  for (let i = 0; i < count; i++) {
    const maker = makers[i % makers.length];
    const mesh = maker(i % 2 === 0 ? palette.meshColor : palette.ringColor);
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
    const radius = spread * (0.6 + (i % 4) * 0.25);
    const sideSign = (i % 2 === 0) ? 1 : -1;
    const x = isMobileDev ? sideSign * (36 + (i % 2) * 16) : Math.cos(angle) * radius * (i % 2 === 0 ? 1.2 : -1.05);
    const y = Math.sin(angle * 1.25) * (spread * 0.65) + ((i % 5) - 2) * 22;
    const z = isMobileDev ? (-36 - (i % 4) * 14) : (-20 - (i % 6) * 18 - Math.random() * 35);
    const scale = isMobileDev ? (0.34 + (i % 3) * 0.04) : (0.48 + (i % 5) * 0.12);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    mesh.userData = {
      baseX: x, baseY: y, baseZ: z,
      speed: 0.2 + (i % 5) * 0.09,
      amp: (isMobileDev ? 6 : 11) + (i % 4) * 3,
      rotSpeed: 0.14 + (i % 5) * 0.06,
      phase: i * 0.72,
      scrollFactor: 0.35 + (i % 4) * 0.28,
      parallaxX: sideSign * (12 + i * 2)
    };
    techGroup.add(mesh);
    techMeshes.push(mesh);
  }
}

function layoutTechForViewport() {
  if (!techMeshes.length) return;
  const spread = isMobileDev ? Math.min(window.innerWidth / 3.2, 120) : Math.min(window.innerWidth / 8.5, 160);

  techMeshes.forEach((mesh, i) => {
    const angle = (i / techMeshes.length) * Math.PI * 2 + (i % 3) * 0.4;
    const radius = spread * (0.6 + (i % 4) * 0.25);
    const sideSign = (i % 2 === 0) ? 1 : -1;
    const x = isMobileDev ? sideSign * (36 + (i % 2) * 16) : Math.cos(angle) * radius * (i % 2 === 0 ? 1.2 : -1.05);
    const y = Math.sin(angle * 1.25) * (spread * 0.65) + ((i % 5) - 2) * 22;
    const z = isMobileDev ? (-36 - (i % 4) * 14) : (-20 - (i % 6) * 18 - Math.random() * 35);
    const scale = isMobileDev ? (0.34 + (i % 3) * 0.04) : (0.48 + (i % 5) * 0.12);
    mesh.userData.baseX = x;
    mesh.userData.baseY = y;
    mesh.userData.baseZ = z;
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
  });
}

function onWindowResize() {
  if (!camera || !renderer) return;
  isMobileDev = isTouchDevice || window.innerWidth <= 768;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(isMobileDev ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  scrollInfo.docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  layoutTechForViewport();
  updateCachedSectionBounds();
}
function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}
function onScroll() {
  scrollInfo.targetY = window.scrollY;
}

function animate() {
  rafId = 0;
  if (!animationRunning) return;
  rafId = requestAnimationFrame(animate);
  if (!renderer || !scene || !camera) return;

  const time = Date.now() * 0.0004;

  if (particleSystem) {
    particleSystem.rotation.y = time * 0.06;
    particleSystem.rotation.x = time * 0.02;
  }

  scrollInfo.y += (scrollInfo.targetY - scrollInfo.y) * (isMobileDev ? 0.08 : 0.06);
  const docHeight = scrollInfo.docHeight || 1;
  const scrollNorm = scrollInfo.y / docHeight;
  const scrollWave = Math.sin(scrollNorm * Math.PI * 1.5);

  techMeshes.forEach(mesh => {
    const d = mesh.userData;
    mesh.rotation.y = time * d.rotSpeed + d.phase + scrollNorm * 1.2;
    mesh.rotation.x = time * d.rotSpeed * 0.7 + scrollNorm * (d.scrollFactor * 0.5);
    mesh.position.y = d.baseY + Math.sin(time * d.speed + d.phase) * d.amp + scrollWave * 12 * d.scrollFactor;
    mesh.position.x = d.baseX + Math.cos(time * d.speed * 0.7 + d.phase) * (d.amp * 0.5) + scrollNorm * (d.parallaxX * 0.4);
    mesh.position.z = d.baseZ + Math.sin(scrollNorm * Math.PI * 1.5 + d.phase) * 12;
  });

  const mouseLerp = isMobileDev ? 0.025 : 0.04;
  currentMouseX += (targetMouseX - currentMouseX) * mouseLerp;
  currentMouseY += (targetMouseY - currentMouseY) * mouseLerp;

  camera.position.x = cameraBasePos.x + currentMouseX * (isMobileDev ? 6 : 18);
  camera.position.y = cameraBasePos.y - currentMouseY * (isMobileDev ? 4 : 12);
  camera.position.z = cameraBasePos.z;
  camera.lookAt(0, scrollNorm * -6, 0);

  if (particleSystem) {
    particleSystem.position.y = scrollWave * 15;
    particleSystem.position.x = Math.cos(scrollNorm * Math.PI * 1.5) * 10;
    particleSystem.rotation.y = time * 0.06 + scrollNorm * Math.PI * 0.5;
  }
  if (techGroup) {
    techGroup.rotation.y = scrollNorm * 0.4;
    techGroup.position.y = -scrollNorm * 18;
  }

  renderer.render(scene, camera);
}

document.documentElement.setAttribute('data-theme', 'dark');

/* ── CINEMATIC CURSOR + GLOW + SPRING TRAIL ─────────────────── */
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
const glowEl = document.getElementById('cursorGlow');
const trailDots = document.querySelectorAll('.cursor-trail-dot');

if (!isTouchDevice && cursor && follower) {
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;
  let glowX = 0, glowY = 0;
  const trailHistory = [];
  const dotCount = trailDots.length;

  for (let i = 0; i < dotCount; i++) trailHistory.push({ x: 0, y: 0 });

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
  }, { passive: true });

  (function animateCursor() {
    // Follower spring
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;

    // Glow (slow smooth)
    if (glowEl) {
      glowX += (mouseX - glowX) * 0.05;
      glowY += (mouseY - glowY) * 0.05;
      glowEl.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
    }

    // Spring trail
    let prevX = mouseX, prevY = mouseY;
    trailDots.forEach((dot, i) => {
      const hist = trailHistory[i];
      hist.x += (prevX - hist.x) * (0.32 - i * 0.025);
      hist.y += (prevY - hist.y) * (0.32 - i * 0.025);
      const scale = 1 - (i / dotCount) * 0.65;
      const opacity = 0.9 - (i / dotCount) * 0.85;
      dot.style.transform = `translate3d(${hist.x}px, ${hist.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      dot.style.opacity = opacity;
      prevX = hist.x; prevY = hist.y;
    });

    requestAnimationFrame(animateCursor);
  })();

  const hoverTargets = document.querySelectorAll('a, button, [role="button"], .media-thumb, .feat-slide, .project-card, .achievement-card, .cert-card, .badge-card, [data-showcase], .lead-node, .skill-card');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hover');
      follower.classList.add('is-hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hover');
      follower.classList.remove('is-hover');
    });
  });
} else {
  cursor?.remove();
  follower?.remove();
  glowEl?.remove();
  trailDots.forEach(d => d.remove());
}

/* ── NAVBAR ─────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
let scrollTicking = false;
let cachedSectionBounds = [];

function updateCachedSectionBounds() {
  const sections = document.querySelectorAll('section[id]');
  cachedSectionBounds = Array.from(sections).map(sec => ({
    id: sec.getAttribute('id'),
    top: sec.offsetTop,
    bottom: sec.offsetTop + sec.offsetHeight
  }));
}

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
    highlightNavLink();
    toggleBackToTop();
    scrollTicking = false;
  });
}, { passive: true });

function highlightNavLink() {
  if (!cachedSectionBounds.length) updateCachedSectionBounds();
  const scrollPos = window.scrollY + 120;
  const navLinks = document.querySelectorAll('.nav-link');
  for (let i = 0; i < cachedSectionBounds.length; i++) {
    const sec = cachedSectionBounds[i];
    if (scrollPos >= sec.top && scrollPos < sec.bottom) {
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('data-section') === sec.id));
      break;
    }
  }
}

/* ── MOBILE MENU ────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburger?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeMobileMenu() : openMobileMenu());
mobileLinks.forEach(l => l.addEventListener('click', closeMobileMenu));
mobileMenu?.addEventListener('click', e => { if (e.target === mobileMenu) closeMobileMenu(); });

function openMobileMenu() {
  mobileMenu?.classList.add('open'); hamburger?.classList.add('open');
  hamburger?.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  mobileMenu?.classList.remove('open'); hamburger?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
}

/* ── SMOOTH ACCURATE SCROLL TO SECTIONS ───────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 70;
      const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });
      if (history.pushState) {
        history.pushState(null, null, targetId);
      }
    }
  });
});

/* ── TYPEWRITER (optional) ──────────────────────────────────── */
const typeEl = document.getElementById('typewriter');
if (typeEl) {
  const words = ['Full Stack Developer', 'Java Programmer', 'Blockchain Enthusiast', 'Theatre Club President', 'Problem Solver'];
  let wordIndex = 0, charIndex = 0, isDeleting = false;
  function typeWriter() {
    const word = words[wordIndex];
    typeEl.textContent = word.slice(0, charIndex);
    if (!isDeleting && charIndex < word.length) { charIndex++; setTimeout(typeWriter, 85); }
    else if (isDeleting && charIndex > 0) { charIndex--; setTimeout(typeWriter, 50); }
    else {
      isDeleting = !isDeleting;
      if (!isDeleting) wordIndex = (wordIndex + 1) % words.length;
      setTimeout(typeWriter, isDeleting ? 900 : 1200);
    }
  }
  setTimeout(typeWriter, 1800);
}

/* ── GSAP EXTREME HIGH-POWER ENTRANCE ANIMATIONS ────────────── */
function initEntranceAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.querySelectorAll('.line-inner, .brand-line-inner, .cine-sub, .cine-number, .cine-heading').forEach(el => {
      el.style.transform = 'none'; el.style.opacity = '1';
    });
    document.querySelectorAll('.skill-fill').forEach(bar => { bar.style.width = (bar.getAttribute('data-width') || '0') + '%'; });
    document.querySelectorAll('.hero-eyebrow, .hero-role, .hero-role-primary, .hero-cta, .hero-stats').forEach(el => {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    document.querySelectorAll('.hero-portrait').forEach(el => {
      el.style.opacity = '1'; el.style.transform = 'none'; el.style.clipPath = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    limitCallbacks: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
  });

  const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;

  /* ── Dynamic Three.js Camera Scroll Shift ────────────────────── */
  if (camera) {
    gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top', end: 'max', scrub: isMobile ? 0.3 : 1.0, invalidateOnRefresh: true
      }
    })
      .to(cameraBasePos, { z: 220, x: -5, y: -2, ease: 'none' }, 0)
      .to(cameraBasePos, { z: 210, x: 6, y: 3, ease: 'none' }, 0.33)
      .to(cameraBasePos, { z: 225, x: -4, y: -1, ease: 'none' }, 0.66)
      .to(cameraBasePos, { z: 240, x: 0, y: 0, ease: 'none' }, 1);
  }

  /* ── High-Impact Hero Entrance Animation ─────────────────────── */
  const heroTl = gsap.timeline({ defaults: { ease: 'expo.out', force3D: true } });
  heroTl
    .to('.brand-line-inner', { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.15 }, 0.1)
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to('.hero-role-primary', { opacity: 1, y: 0, duration: 0.75 }, 0.45)
    .to('.hero-role', { opacity: 1, y: 0, duration: 0.75 }, 0.58)
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.65 }, 0.72)
    .to('#heroPortrait', {
      opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 32px)',
      duration: 1.35
    }, 0.18)
    .to('.hero-stats', { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power4.out' }, 0.85);

  const statItems = document.querySelectorAll('.hero-stats .stat-item');
  if (statItems.length) {
    gsap.fromTo(statItems,
      { opacity: 0, y: isMobile ? 12 : 25, scale: isMobile ? 0.94 : 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: isMobile ? 0.45 : 0.6, ease: 'back.out(1.5)', stagger: isMobile ? 0.03 : 0.07, delay: 0.9, force3D: true }
    );
  }

  /* ── UNIQUE SECTION-BY-SECTION ANIMATION SIGNATURES ────────── */
  function initUniqueSectionAnimations() {
    const triggerStart = isMobile ? 'top 94%' : 'top 88%';
    const headerStart = isMobile ? 'top 95%' : 'top 92%';

    /* Generic Header animations (Numbers & 3D Title Skew) */
    document.querySelectorAll('section[data-cinematic]:not(#home)').forEach(section => {
      const numEl   = section.querySelector('.cine-number');
      const titleEl = section.querySelector('.cine-title');
      const sub     = section.querySelector('.cine-sub');

      if (numEl) {
        gsap.fromTo(numEl,
          { opacity: 0, x: isMobile ? -15 : -40, scale: isMobile ? 0.85 : 0.4, rotate: isMobile ? 0 : -25 },
          {
            opacity: 1, x: 0, scale: 1, rotate: 0, duration: isMobile ? 0.5 : 0.65, ease: isMobile ? 'power2.out' : 'back.out(2)', force3D: true,
            scrollTrigger: { trigger: section, start: headerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (titleEl) {
        const inner = titleEl.querySelector('.line-inner') || titleEl;
        gsap.fromTo(inner,
          { opacity: 0, y: isMobile ? 22 : 50, rotateX: isMobile ? 0 : -30, skewY: isMobile ? 0 : 3, transformOrigin: 'left top' },
          {
            opacity: 1, y: 0, rotateX: 0, skewY: 0, duration: isMobile ? 0.55 : 0.85, ease: isMobile ? 'power2.out' : 'expo.out', force3D: true,
            scrollTrigger: { trigger: section, start: headerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (sub) {
        gsap.fromTo(sub,
          { opacity: 0, y: isMobile ? 14 : 20, letterSpacing: isMobile ? '0.02em' : '0.12em' },
          {
            opacity: 1, y: 0, letterSpacing: '0.01em', duration: isMobile ? 0.5 : 0.7, ease: 'power2.out', force3D: true,
            scrollTrigger: { trigger: section, start: headerStart, toggleActions: 'play none none none' }
          }
        );
      }
    });

    /* 1. ABOUT SECTION */
    const aboutSec = document.querySelector('#about');
    if (aboutSec) {
      const photo = aboutSec.querySelector('.about-image-col');
      const content = aboutSec.querySelector('.about-content-col');
      const subtitle = aboutSec.querySelector('.about-subtitle');
      const texts = aboutSec.querySelectorAll('.about-text');
      const details = aboutSec.querySelectorAll('.detail-item');
      const btns = aboutSec.querySelectorAll('.about-actions .btn');
      const profiles = aboutSec.querySelectorAll('.profile-badge');
      
      if (photo) {
        gsap.fromTo(photo,
          { opacity: 0, x: isMobile ? 0 : -80, y: isMobile ? 25 : 0, rotateY: isMobile ? 0 : 25, transformPerspective: 1000, scale: isMobile ? 0.95 : 0.88 },
          {
            opacity: 1, x: 0, y: 0, rotateY: 0, scale: 1, duration: isMobile ? 0.6 : 1.1, ease: 'expo.out', force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (content) {
        gsap.fromTo(content,
          { opacity: 0, x: isMobile ? 0 : 70, y: isMobile ? 20 : 20 },
          {
            opacity: 1, x: 0, y: 0, duration: isMobile ? 0.6 : 1.0, ease: 'expo.out', force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (subtitle) {
        gsap.fromTo(subtitle,
          { opacity: 0, y: isMobile ? 15 : 20 },
          {
            opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', force3D: true,
            scrollTrigger: { trigger: aboutSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (texts.length) {
        gsap.fromTo(texts,
          { opacity: 0, y: isMobile ? 15 : 20 },
          {
            opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08, force3D: true,
            scrollTrigger: { trigger: aboutSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (details.length) {
        gsap.fromTo(details,
          { opacity: 0, scale: isMobile ? 0.95 : 0.7, y: isMobile ? 14 : 20 },
          {
            opacity: 1, scale: 1, y: 0, duration: isMobile ? 0.5 : 0.65, ease: isMobile ? 'power2.out' : 'back.out(1.8)', stagger: isMobile ? 0.04 : 0.05, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: isMobile ? 'top 90%' : 'top 85%', toggleActions: 'play none none none' }
          }
        );
      }
      if (btns.length) {
        gsap.fromTo(btns,
          { opacity: 0, y: isMobile ? 12 : 15, scale: isMobile ? 0.96 : 0.9 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.5)', stagger: 0.05, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: isMobile ? 'top 88%' : 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
      if (profiles.length) {
        gsap.fromTo(profiles,
          { opacity: 0, y: isMobile ? 10 : 15, scale: isMobile ? 0.92 : 0.8 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.03, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: isMobile ? 'top 85%' : 'top 80%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 2. FEATURED SECTION */
    const featSec = document.querySelector('#featured');
    if (featSec) {
      const slides = featSec.querySelectorAll('.feat-slide');
      if (slides.length) {
        gsap.fromTo(slides,
          { opacity: 0, scale: isMobile ? 0.94 : 0.82, y: isMobile ? 25 : 80, rotateY: isMobile ? 0 : -15, transformPerspective: 1200 },
          {
            opacity: 1, scale: 1, y: 0, rotateY: 0, duration: isMobile ? 0.6 : 0.95, ease: 'expo.out', force3D: true,
            stagger: isMobile ? 0.05 : 0.09, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: featSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 3. EDUCATION SECTION */
    const eduSec = document.querySelector('#education');
    if (eduSec) {
      const items = eduSec.querySelectorAll('.edu-item');
      items.forEach((item, idx) => {
        const icon = item.querySelector('.edu-icon-wrap');
        const tags = item.querySelectorAll('.tag');
        const score = item.querySelector('.edu-score-wrap');
        gsap.fromTo(item,
          { opacity: 0, x: isMobile ? 0 : (idx % 2 === 0 ? -60 : 60), y: isMobile ? 25 : 30 },
          {
            opacity: 1, x: 0, y: 0, duration: isMobile ? 0.55 : 0.85, ease: 'expo.out', force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: item, start: isMobile ? 'top 94%' : 'top 90%', toggleActions: 'play none none none' }
          }
        );
        if (icon) {
          gsap.fromTo(icon,
            { opacity: 0, rotate: isMobile ? -90 : -180, scale: isMobile ? 0.7 : 0.2 },
            {
              opacity: 1, rotate: 0, scale: 1, duration: isMobile ? 0.5 : 0.75, ease: isMobile ? 'back.out(1.8)' : 'back.out(2)', force3D: true,
              scrollTrigger: { trigger: item, start: isMobile ? 'top 94%' : 'top 90%', toggleActions: 'play none none none' }
            }
          );
        }
        if (tags.length) {
          gsap.fromTo(tags,
            { opacity: 0, scale: 0.9 },
            {
              opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, force3D: true, clearProps: 'transform,opacity',
              scrollTrigger: { trigger: item, start: isMobile ? 'top 90%' : 'top 85%', toggleActions: 'play none none none' }
            }
          );
        }
        if (score) {
          gsap.fromTo(score,
            { opacity: 0, y: 10 },
            {
              opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', force3D: true, clearProps: 'transform,opacity',
              scrollTrigger: { trigger: item, start: isMobile ? 'top 90%' : 'top 85%', toggleActions: 'play none none none' }
            }
          );
        }
      });
    }

    /* 4. SKILLS SECTION */
    const skillsSec = document.querySelector('#skills');
    if (skillsSec) {
      const cards = skillsSec.querySelectorAll('.skill-card');
      cards.forEach((card, idx) => {
        const bar = card.querySelector('.skill-fill');
        const rot = isMobile ? 0 : (idx % 2 === 0 ? -14 : 14);
        gsap.fromTo(card,
          { opacity: 0, scale: isMobile ? 0.94 : 0.5, rotateZ: rot, y: isMobile ? 22 : 40 },
          {
            opacity: 1, scale: 1, rotateZ: 0, y: 0, duration: isMobile ? 0.5 : 0.8, ease: isMobile ? 'back.out(1.5)' : 'back.out(1.7)', force3D: true,
            delay: isMobile ? (idx % 2) * 0.04 : (idx % 4) * 0.06,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: skillsSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
        if (bar) {
          const targetW = (bar.getAttribute('data-width') || '0') + '%';
          gsap.fromTo(bar,
            { width: '0%' },
            {
              width: targetW, duration: isMobile ? 0.85 : 1.35, ease: 'power3.out',
              delay: isMobile ? (idx % 2) * 0.04 : (idx % 4) * 0.06,
              scrollTrigger: { trigger: skillsSec, start: triggerStart, toggleActions: 'play none none none' }
            }
          );
        }
      });
    }

    /* 5. PROJECTS SECTION */
    const projSec = document.querySelector('#projects');
    if (projSec) {
      const projects = projSec.querySelectorAll('.project-item');
      projects.forEach((proj) => {
        const isReverse = proj.classList.contains('project-reverse');
        const imgCol = proj.querySelector('.project-image-col');
        const textCol = proj.querySelector('.project-content-col');
        const tags = proj.querySelectorAll('.project-tags .tag');
        const btns = proj.querySelectorAll('.project-actions .btn');

        if (imgCol) {
          gsap.fromTo(imgCol,
            { opacity: 0, x: isMobile ? 0 : (isReverse ? 90 : -90), y: isMobile ? 25 : 0, scale: isMobile ? 0.96 : 0.9, rotateY: isMobile ? 0 : (isReverse ? -12 : 12), transformPerspective: 1000 },
            {
              opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0, duration: isMobile ? 0.6 : 1.05, ease: 'expo.out', force3D: true,
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: isMobile ? 'top 94%' : 'top 88%', toggleActions: 'play none none none' }
            }
          );
        }
        if (textCol) {
          gsap.fromTo(textCol,
            { opacity: 0, x: isMobile ? 0 : (isReverse ? -80 : 80), y: isMobile ? 20 : 20 },
            {
              opacity: 1, x: 0, y: 0, duration: isMobile ? 0.6 : 1.0, ease: 'expo.out', force3D: true,
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: isMobile ? 'top 94%' : 'top 88%', toggleActions: 'play none none none' }
            }
          );
        }
        if (tags.length) {
          gsap.fromTo(tags,
            { opacity: 0, y: isMobile ? 8 : 12, scale: 0.92 },
            {
              opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out', stagger: 0.03, force3D: true, clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: isMobile ? 'top 90%' : 'top 86%', toggleActions: 'play none none none' }
            }
          );
        }
        if (btns.length) {
          gsap.fromTo(btns,
            { opacity: 0, scale: isMobile ? 0.94 : 0.4, y: isMobile ? 12 : 15 },
            {
              opacity: 1, scale: 1, y: 0, duration: isMobile ? 0.45 : 0.6, ease: isMobile ? 'power2.out' : 'back.out(2)', stagger: isMobile ? 0.04 : 0.08, force3D: true,
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: isMobile ? 'top 88%' : 'top 85%', toggleActions: 'play none none none' }
            }
          );
        }
      });
    }

    /* 6. ACHIEVEMENTS SECTION */
    const achSec = document.querySelector('#achievements');
    if (achSec) {
      const catHeaders = achSec.querySelectorAll('.ach-cat-header');
      const cards = achSec.querySelectorAll('.achievement-card');

      if (catHeaders.length) {
        gsap.fromTo(catHeaders,
          { opacity: 0, x: isMobile ? 0 : -40, y: isMobile ? 15 : 0 },
          {
            opacity: 1, x: 0, y: 0, duration: isMobile ? 0.5 : 0.7, ease: 'power3.out', stagger: isMobile ? 0.06 : 0.15, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: achSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: isMobile ? 25 : 70, rotateX: isMobile ? 0 : 20, scale: isMobile ? 0.95 : 0.88, transformPerspective: 1000 },
          {
            opacity: 1, y: 0, rotateX: 0, scale: 1, duration: isMobile ? 0.55 : 0.85, ease: 'expo.out', force3D: true,
            stagger: isMobile ? 0.05 : 0.07, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: achSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 7. CERTIFICATIONS SECTION */
    const certSec = document.querySelector('#certifications');
    if (certSec) {
      const cards = certSec.querySelectorAll('.cert-card');
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, rotateY: isMobile ? 0 : -45, y: isMobile ? 25 : 60, scale: isMobile ? 0.95 : 0.85, transformPerspective: 1200 },
          {
            opacity: 1, rotateY: 0, y: 0, scale: 1, duration: isMobile ? 0.55 : 0.95, ease: 'expo.out', force3D: true,
            stagger: isMobile ? 0.06 : 0.1, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: certSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 8. BADGES SECTION */
    const badgesSec = document.querySelector('#badges');
    if (badgesSec) {
      const cards = badgesSec.querySelectorAll('.badge-card');
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, rotateY: isMobile ? 0 : -30, y: isMobile ? 25 : 50, scale: isMobile ? 0.95 : 0.88, transformPerspective: 1000 },
          {
            opacity: 1, rotateY: 0, y: 0, scale: 1, duration: isMobile ? 0.55 : 0.85, ease: 'expo.out', force3D: true,
            stagger: isMobile ? 0.05 : 0.08, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: badgesSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 9. LEADERSHIP SECTION */
    const leadSec = document.querySelector('#leadership');
    if (leadSec) {
      const nodes = leadSec.querySelectorAll('.lead-node');
      const markers = leadSec.querySelectorAll('.lead-node-marker');
      if (nodes.length) {
        gsap.fromTo(nodes,
          { opacity: 0, y: isMobile ? 18 : 32, scale: isMobile ? 0.96 : 0.92 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: isMobile ? 0.5 : 0.75,
            ease: 'power3.out',
            stagger: isMobile ? 0.06 : 0.1,
            force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: leadSec, start: isMobile ? 'top 92%' : 'top 84%', toggleActions: 'play none none none' }
          }
        );
      }
      if (markers.length) {
        gsap.fromTo(markers,
          { opacity: 0, scale: 0.3 },
          {
            opacity: 1, scale: 1,
            duration: 0.45,
            ease: 'back.out(1.7)',
            stagger: isMobile ? 0.06 : 0.1,
            force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: leadSec, start: isMobile ? 'top 92%' : 'top 84%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 10. CONTACT SECTION */
    const contactSec = document.querySelector('#contact');
    if (contactSec) {
      const cards = contactSec.querySelectorAll('.contact-card');
      const socials = contactSec.querySelectorAll('.contact-social');
      const availBadge = contactSec.querySelector('.availability-badge');
      const connectCard = contactSec.querySelector('.connect-card');
      const resumeBtns = contactSec.querySelectorAll('.resume-actions .btn');

      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, x: isMobile ? 0 : -60, y: isMobile ? 20 : 20 },
          {
            opacity: 1, x: 0, y: 0, duration: isMobile ? 0.5 : 0.8, ease: 'expo.out', stagger: isMobile ? 0.05 : 0.08, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: contactSec, start: triggerStart, toggleActions: 'play none none none' }
          }
        );
      }
      if (socials.length) {
        gsap.fromTo(socials,
          { opacity: 0, scale: isMobile ? 0.92 : 0.8, y: isMobile ? 12 : 15 },
          {
            opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.5)', stagger: 0.04, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: contactSec, start: isMobile ? 'top 90%' : 'top 85%', toggleActions: 'play none none none' }
          }
        );
      }
      if (availBadge) {
        gsap.fromTo(availBadge,
          { opacity: 0, scale: 0.9, y: 10 },
          {
            opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', force3D: true, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: contactSec, start: isMobile ? 'top 88%' : 'top 84%', toggleActions: 'play none none none' }
          }
        );
      }
      if (connectCard) {
        gsap.fromTo(connectCard,
          { opacity: 0, y: isMobile ? 35 : 90, scale: isMobile ? 0.95 : 0.9, rotateX: isMobile ? 0 : 18, transformPerspective: 1000 },
          {
            opacity: 1, y: 0, scale: 1, rotateX: 0, duration: isMobile ? 0.65 : 1.05, ease: 'expo.out', force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: connectCard || contactSec, start: isMobile ? 'top 92%' : 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
      if (resumeBtns.length) {
        gsap.fromTo(resumeBtns,
          { opacity: 0, y: 12, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.5)', stagger: 0.05, force3D: true,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: connectCard || contactSec, start: isMobile ? 'top 88%' : 'top 80%', toggleActions: 'play none none none' }
          }
        );
      }
    }
  }

  initUniqueSectionAnimations();

  /* ── Resize listener to refresh triggers on device orientation change ── */
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });

  /* ── Scrubbed Image Parallax (Simplified for ultra-smooth performance) ── */
  if (!prefersReducedMotion) {
    document.querySelectorAll('.section-bridge-diamond, .stats-bridge-diamond').forEach(diamond => {
      gsap.fromTo(diamond,
        { rotate: 45 },
        { rotate: 135, ease: 'none',
          scrollTrigger: { trigger: diamond, start: 'top 95%', end: 'bottom 5%', scrub: 1 }
        }
      );
    });
  }

  ScrollTrigger.refresh();

  /* ── Optimized Card Hover Transitions (Pure CSS fallback for 0ms JS latency) ── */
  if (!isTouchDevice && !prefersReducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const b = btn.getBoundingClientRect();
        const x = e.clientX - b.left - b.width / 2;
        const y = e.clientY - b.top - b.height / 2;
        gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.25, ease: 'power2.out' });
      }, { passive: true });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: 'power2.out' });
      }, { passive: true });
    });
  }
}

/* ── BACK TO TOP ────────────────────────────────────────────── */
const backToTop = document.getElementById('backToTop');
function toggleBackToTop() { backToTop?.classList.toggle('visible', window.scrollY > 400); }
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── FOOTER YEAR ────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── VIEW COUNT ─────────────────────────────────────────────── */
const VIEW_COUNTER_KEY = 'gokul230406_portfolio_views';
const VIEW_COUNT_SESSION = 'gp-view-counted';

async function initPortfolioViewCount() {
  const wrap = document.getElementById('portfolioViews');
  const countEl = document.getElementById('portfolioViewCount');
  if (!wrap || !countEl) return;
  const base = 'https://countapi.mileshilliard.com/api/v1';
  const counted = sessionStorage.getItem(VIEW_COUNT_SESSION) === '1';
  try {
    const res = await fetch(counted ? `${base}/get/${VIEW_COUNTER_KEY}` : `${base}/hit/${VIEW_COUNTER_KEY}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'err');
    const value = Number(data.value);
    if (!Number.isFinite(value)) throw new Error('invalid');
    if (!counted) sessionStorage.setItem(VIEW_COUNT_SESSION, '1');
    countEl.textContent = value.toLocaleString();
    wrap.hidden = false;
  } catch { wrap.hidden = true; }
}
initPortfolioViewCount();

/* ── SMOOTH ANCHORS ─────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ── COUNT UP STATS ─────────────────────────────────────────── */
function countUp(el, target, duration = 1500) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) { el.textContent = target + (el.dataset.suffix || ''); clearInterval(timer); }
    else el.textContent = Math.floor(start) + (el.dataset.suffix || '');
  }, 16);
}

const statObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const original = (el.textContent || '').trim();
    const numeric = original.match(/-?\d+(?:\.\d+)?/);
    const num = numeric ? Number(numeric[0]) : NaN;
    el.dataset.suffix = el.dataset.suffix || original.replace(/[-\d.]/g, '');
    if (!Number.isNaN(num) && num > 0) {
      const decimals = (numeric?.[0].split('.')[1]?.length) || 0;
      if (decimals === 0) { countUp(el, num); }
      else {
        let s = 0, inc = num / (1500 / 16);
        const t = setInterval(() => {
          s += inc;
          if (s >= num) { el.textContent = num.toFixed(decimals) + (el.dataset.suffix || ''); clearInterval(t); }
          else el.textContent = s.toFixed(decimals) + (el.dataset.suffix || '');
        }, 16);
      }
    }
    statObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number').forEach(n => statObs.observe(n));

/* ── MEDIA GALLERIES ────────────────────────────────────────── */
const mediaGalleries = {
  president: [
    'pictures/president/m.jpeg',
    'pictures/president/WhatsApp Image 2026-06-15 at 10.01.58 AM.jpeg',
    'pictures/president/WhatsApp Image 2026-06-15 at 10.30.24 AM.jpeg',
    'pictures/president/WhatsApp Image 2026-06-29 at 4.34.28 PM.jpeg',
    'pictures/president/WhatsApp Image 2026-06-29 at 4.34.29 PM.jpeg',
  ],
  ambassador: [
    'pictures/Ambassador/Copy of DSC04966.JPG',
    'pictures/Ambassador/Copy of DSC04967.JPG',
    'pictures/Ambassador/Copy of IMG_0560.JPG',
    'pictures/Ambassador/Copy of IMG_0563.JPG',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 11.00.48 AM (2).jpeg',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 11.00.48 AM.jpeg',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 11.01.10 AM.jpeg',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 12.00.33 PM.jpeg',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 12.01.56 PM.jpeg',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 12.51.38 PM.jpeg',
    'pictures/Ambassador/WhatsApp Image 2026-06-15 at 12.51.39 PM.jpeg',
  ],
  pro: [
    'pictures/PRO/WhatsApp Image 2026-06-15 at 11.18.00 AM.jpeg',
    'pictures/PRO/WhatsApp Image 2026-06-15 at 11.21.11 AM.jpeg',
    'pictures/PRO/WhatsApp Image 2026-06-15 at 11.22.54 AM.jpeg',
  ],
  'joint-sec': [
    'pictures/joint sec/WhatsApp Image 2026-06-15 at 11.38.22 AM.jpeg',
    'pictures/joint sec/WhatsApp Image 2026-06-15 at 11.39.12 AM.jpeg',
    'pictures/joint sec/WhatsApp Image 2026-06-15 at 11.46.13 AM.jpeg',
  ],
  'hack-to-the-future': [
    'pictures/Hack to the Future/DSC06595.JPG',
    'pictures/Hack to the Future/DSC06697.JPG',
    'pictures/Hack to the Future/DSC06817.JPG',
    'pictures/Hack to the Future/DSC07409.JPG',
    'pictures/Hack to the Future/m.jpeg',
    'pictures/Hack to the Future/WhatsApp Image 2026-06-19 at 3.14.45 PM.jpeg',
    'pictures/Hack to the Future/WhatsApp Image 2026-06-19 at 6.19.45 PM.jpeg',
  ],
  'project-challenge': [
    'pictures/project challenge/IMG_6684.JPG',
    'pictures/project challenge/IMG_6797.JPG',
    'pictures/project challenge/IMG_9719.JPG',
    'pictures/project challenge/IMG_9728.JPG',
    'pictures/project challenge/IMG_9735.JPG',
    'pictures/project challenge/IMG_9743.JPG',
  ],
  'stress-interview': [
    'pictures/Stress interview/WhatsApp Image 2026-06-29 at 3.46.12 PM.jpeg',
    'pictures/Stress interview/WhatsApp Image 2026-06-29 at 4.41.41 PM.jpeg',
  ],
  'non-tech-literary': [
    'pictures/Non tech achievements/Copy of DSC04966.JPG',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-15 at 10.01.58 AM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.44.03 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.44.44 PM.jpeg',
  ],
  'non-tech-cultural': [
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.45.34 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.16 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.22 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.23 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.24 PM.jpeg',
  ],
  'non-tech-overall-winner': [
    'pictures/Overalls/m.jpeg',
    'pictures/Overalls/WhatsApp Image 2026-06-29 at 4.34.28 PM.jpeg',
    'pictures/Overalls/WhatsApp Image 2026-06-29 at 4.34.29 PM.jpeg',
    'pictures/Overalls/WhatsApp Image 2026-06-29 at 4.34.44 PM.jpeg',
    'pictures/Overalls/WhatsApp Image 2026-06-29 at 4.35.06 PM.jpeg',
  ],
  'cultural-secretary': [
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.16 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.22 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.45.34 PM.jpeg',
  ],
  'cultural-head': [
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.16 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.22 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.45.34 PM.jpeg',
  ],
  'cert-aws-ai': ['pictures/AWS/AWS_AI_Practitioner.jpg?v=20260810_v2'],
  'cert-aws': ['pictures/AWS/AWS_Cloud_Practitioner.jpg?v=20260810_v2'],
  'cert-oracle': ['pictures/Oracle/Gokul_Oracle.jpg'],
  'cert-cisco': ['pictures/Networking basics/Networking basics.pdf'],
  'cert-cpp': ['pictures/C++ fundamentals/C++.pdf'],
  'badge-oracle': ['pictures/Badges/oracle-java-se17-full.png'],
  'badge-aws-ai': ['pictures/Badges/aws-ai-practitioner-full.png?v=20260810_v2'],
  'badge-aws': ['pictures/Badges/aws-cloud-practitioner-full.png?v=20260810_v2'],
  'badge-lc100-2026': ['pictures/Badges/leetcode-100-2026-full.png'],
  'badge-lc50-2026': ['pictures/Badges/leetcode-50-2026-full.png'],
  'badge-lc50-2025': ['pictures/Badges/leetcode-50-2025-full.png'],
  campusbox: [
    'pictures/campusbox/optimized/01-landing.jpg',
    'pictures/campusbox/optimized/02-browse.jpg',
    'pictures/campusbox/optimized/03-trending.jpg',
    'pictures/campusbox/optimized/04-my-items.jpg',
    'pictures/campusbox/optimized/05-physics.jpg',
    'pictures/campusbox/optimized/06-blazer.jpg',
    'pictures/campusbox/optimized/07-sell.jpg',
    'pictures/campusbox/optimized/08-profile.jpg',
  ],
  travo: [
    'pictures/travo/01-hero.png',
    'pictures/travo/02-planner.png',
    'pictures/travo/03-itinerary.png',
    'pictures/travo/04-compare.png',
    'pictures/travo/05-destination.png',
    'pictures/travo/06-assistant.png',
  ],
  ayurchain: [
    'pictures/ayurchain/01-verify.png',
    'pictures/ayurchain/02-farmer-portal.png',
    'pictures/ayurchain/03-farmer-dashboard.png',
    'pictures/ayurchain/04-admin-pipeline.png',
    'pictures/ayurchain/05-certificate.png',
  ],
};

let activeGalleryItems = [];
let activeGalleryIndex = 0;

const isPdfPath = p => /\.pdf(\?.*)?$/i.test(p);
const isImagePath = p => /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(p);
const encodeMediaPath = p => {
  const [pathOnly, query] = p.split('?');
  const encoded = pathOnly.split('/').map(encodeURIComponent).join('/');
  return query ? `${encoded}?${query}` : encoded;
};
const getCertThumbPath = p => p.replace(/\.pdf(\?.*)?$/i, '.jpg$1');

function ensureMediaLightbox() {
  let lb = document.getElementById('mediaLightbox');
  if (lb) return lb;
  lb = document.createElement('div');
  lb.id = 'mediaLightbox';
  lb.className = 'media-lightbox';
  lb.innerHTML = `
    <div class="media-lightbox-inner" role="dialog" aria-modal="true">
      <button class="media-lightbox-close" type="button"><i class="fas fa-times"></i></button>
      <button class="media-lightbox-nav media-lightbox-prev" type="button"><i class="fas fa-chevron-left"></i></button>
      <button class="media-lightbox-nav media-lightbox-next" type="button"><i class="fas fa-chevron-right"></i></button>
      <div class="media-lightbox-stage">
        <img alt="Preview" class="media-lightbox-img" />
        <iframe class="media-lightbox-pdf" title="Certificate" frameborder="0"></iframe>
      </div>
      <div class="media-lightbox-dots" role="tablist" aria-label="Gallery slides"></div>
      <p class="media-lightbox-counter"></p>
    </div>`;
  document.body.appendChild(lb);
  const close = () => { lb.classList.remove('open'); lb.querySelector('.media-lightbox-pdf').src = ''; };
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lb.querySelector('.media-lightbox-close').addEventListener('click', close);
  lb.querySelector('.media-lightbox-prev').addEventListener('click', () => stepMediaLightbox(-1));
  lb.querySelector('.media-lightbox-next').addEventListener('click', () => stepMediaLightbox(1));
  lb.querySelector('.media-lightbox-dots').addEventListener('click', e => {
    const dot = e.target.closest('[data-lb-index]');
    if (!dot) return;
    renderLightboxItem(Number(dot.dataset.lbIndex) || 0);
  });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') stepMediaLightbox(-1);
    if (e.key === 'ArrowRight') stepMediaLightbox(1);
  });
  return lb;
}

function renderLightboxItem(index) {
  const lb = ensureMediaLightbox();
  const item = activeGalleryItems[index];
  if (!item) return;
  const img = lb.querySelector('.media-lightbox-img');
  const iframe = lb.querySelector('.media-lightbox-pdf');
  const counter = lb.querySelector('.media-lightbox-counter');
  const dots = lb.querySelector('.media-lightbox-dots');
  const prev = lb.querySelector('.media-lightbox-prev');
  const next = lb.querySelector('.media-lightbox-next');
  activeGalleryIndex = index;
  if (isPdfPath(item)) {
    const thumbPath = getCertThumbPath(item);
    iframe.style.display = 'none'; iframe.src = '';
    img.style.display = 'block'; img.src = encodeMediaPath(thumbPath);
    img.alt = item.split('/').pop() || 'Certificate';
    img.onerror = () => { img.style.display = 'none'; iframe.style.display = 'block'; iframe.src = encodeMediaPath(item) + '#toolbar=0&navpanes=0'; };
  } else {
    iframe.style.display = 'none'; iframe.src = '';
    img.style.display = 'block'; img.src = encodeMediaPath(item); img.alt = item.split('/').pop() || 'Preview';
  }
  const total = activeGalleryItems.length;
  if (counter) counter.textContent = total > 1 ? `${index + 1} / ${total}` : '';
  if (prev) prev.style.display = total > 1 ? 'inline-flex' : 'none';
  if (next) next.style.display = total > 1 ? 'inline-flex' : 'none';
  if (dots) {
    if (total > 1) {
      dots.innerHTML = activeGalleryItems.map((_, i) =>
        `<button type="button" class="media-lightbox-dot${i === index ? ' is-active' : ''}" data-lb-index="${i}" aria-label="Image ${i + 1}"></button>`
      ).join('');
      dots.hidden = false;
    } else {
      dots.innerHTML = '';
      dots.hidden = true;
    }
  }
}

function openMediaLightbox(items, startIndex = 0) {
  activeGalleryItems = items;
  renderLightboxItem(startIndex);
  ensureMediaLightbox().classList.add('open');
}

function stepMediaLightbox(delta) {
  if (!activeGalleryItems.length) return;
  renderLightboxItem((activeGalleryIndex + delta + activeGalleryItems.length) % activeGalleryItems.length);
}

function buildMediaThumb(item, index, animDelay = 0) {
  const src = encodeMediaPath(item);
  const name = item.split('/').pop() || 'media';
  const animStyle = animDelay ? ` style="animation-delay:${animDelay}ms"` : '';
  if (isPdfPath(item)) {
    const thumbJpg = encodeMediaPath(getCertThumbPath(item));
    return `<button class="media-thumb media-thumb-pdf gallery-thumb-enter" type="button" data-index="${index}" aria-label="Open ${name}"${animStyle}>
      <img class="media-cert-thumb" data-src="${thumbJpg}" alt="${name}" loading="lazy" />
      <span class="media-pdf-fallback-icon"><i class="fas fa-certificate"></i></span>
      <span class="media-pdf-badge"><i class="fas fa-certificate"></i> Cert</span>
    </button>`;
  }
  return `<button class="media-thumb gallery-thumb-enter" type="button" data-index="${index}" aria-label="Open ${name}"${animStyle}>
    <img data-src="${src}" alt="${name}" loading="lazy" class="media-thumb-img" />
  </button>`;
}

function loadGalleryImages(container) {
  container.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  container.querySelectorAll('.media-cert-thumb').forEach(img => {
    const btn = img.closest('.media-thumb-pdf');
    img.addEventListener('load', () => btn?.classList.add('media-thumb-pdf-has-img'), { once: true });
    img.addEventListener('error', () => { img.style.display = 'none'; btn?.classList.add('media-thumb-pdf-fallback'); }, { once: true });
  });
  if (container.classList.contains('achievement-thumb') || container.classList.contains('lead-card-media') || container.classList.contains('lead-node-thumb') || container.classList.contains('cert-thumb')) {
    initHeroMediaCarousel(container);
  }
}

function initHeroMediaCarousel(container) {
  const images = [...container.querySelectorAll('.hero-carousel-img')];
  const dotsWrap = container.querySelector('.hero-carousel-dots');
  if (images.length < 2) return;
  let idx = 0;
  let paused = false;
  const setActive = (next) => {
    images[idx]?.classList.remove('is-active');
    idx = ((next % images.length) + images.length) % images.length;
    images[idx]?.classList.add('is-active');
    container.dataset.activeIndex = String(idx);
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.hero-carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === idx);
      });
    }
  };
  images.forEach((img, i) => img.classList.toggle('is-active', i === 0));
  container.dataset.activeIndex = '0';
  if (dotsWrap) {
    dotsWrap.innerHTML = images.map((_, i) =>
      `<button type="button" class="hero-carousel-dot${i === 0 ? ' is-active' : ''}" data-hero-index="${i}" aria-label="Preview image ${i + 1}"></button>`
    ).join('');
    dotsWrap.addEventListener('click', e => {
      e.stopPropagation();
      const dot = e.target.closest('[data-hero-index]');
      if (!dot) return;
      paused = true;
      setActive(Number(dot.dataset.heroIndex) || 0);
    });
  }
  if (prefersReducedMotion) return;
  let isVisible = false;
  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0]?.isIntersecting || false;
  }, { threshold: 0.1 });
  observer.observe(container);

  const timer = setInterval(() => {
    if (paused || !isVisible || document.hidden) return;
    setActive(idx + 1);
  }, 3200);
  container.addEventListener('mouseenter', () => { paused = true; });
  container.addEventListener('mouseleave', () => { paused = false; });
  container.addEventListener('touchstart', () => { paused = true; }, { passive: true });
  container._heroCarouselStop = () => { clearInterval(timer); observer.disconnect(); };
}

function renderSingleGallery(g) {
  const key = g.getAttribute('data-gallery');
  const items = key ? mediaGalleries[key] : null;
  if (!items || items.length === 0 || g.dataset.rendered === '1') return;
  g.dataset.rendered = '1';

  const isHero = g.classList.contains('achievement-thumb') || g.classList.contains('cert-thumb') || g.classList.contains('lead-card-media') || g.classList.contains('lead-node-thumb');
  let html = '';
  if (isHero) {
    const heroItems = items.filter(isImagePath).length ? items.filter(isImagePath) : items;
    html += `<div class="hero-media-carousel" role="img" aria-label="Gallery preview" data-active-index="0">`;
    heroItems.forEach((item, i) => {
      const src = isPdfPath(item) ? encodeMediaPath(getCertThumbPath(item)) : encodeMediaPath(item);
      html += `<img class="hero-carousel-img${i === 0 ? ' is-active' : ''}" data-src="${src}" alt="" loading="lazy" />`;
    });
    if (heroItems.length > 1) {
      html += `<div class="hero-carousel-dots" role="tablist" aria-label="Preview slides"></div>`;
    }
    html += `</div>`;
  } else {
    items.forEach((item, i) => { html += buildMediaThumb(item, i, i * 80); });
  }
  g.innerHTML = html;
  loadGalleryImages(g);
  g.querySelectorAll('.media-thumb, .hero-media-carousel').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.hero-carousel-dots')) return;
      const carousel = el.classList.contains('hero-media-carousel') ? el : g.querySelector('.hero-media-carousel');
      const start = Number(carousel?.dataset?.activeIndex || el.dataset?.index) || 0;
      openMediaLightbox(items, start);
    });
  });
}

function renderMediaGalleries() {
  const galleries = document.querySelectorAll('.media-gallery[data-gallery]');
  if (!('IntersectionObserver' in window)) { galleries.forEach(renderSingleGallery); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { renderSingleGallery(e.target); obs.unobserve(e.target); } });
  }, { rootMargin: '120px', threshold: 0.01 });
  galleries.forEach(g => obs.observe(g));
}

/* ── FEATURED INFINITE CAROUSEL ─────────────────────────────── */
function initFeaturedCarousel() {
  const root = document.querySelector('[data-featured-carousel]');
  if (!root) return;
  const track = root.querySelector('.featured-track');
  const viewport = root.querySelector('.featured-viewport');
  const prevBtn = root.querySelector('.feat-nav-prev');
  const nextBtn = root.querySelector('.feat-nav-next');
  if (!track || !viewport) return;

  const originals = [...track.children];
  if (!originals.length) return;

  // Duplicate for seamless loop
  originals.forEach(slide => track.appendChild(slide.cloneNode(true)));

  let offset = 0;
  let paused = false;
  let dragging = false;
  let didDrag = false;
  let startX = 0;
  let startOffset = 0;
  let lastTs = 0;
  const speed = prefersReducedMotion ? 0 : (isLowPower ? 0.35 : 0.55);

  function loopWidth() {
    return track.scrollWidth / 2;
  }

  function apply() {
    const w = loopWidth();
    if (w <= 0) return;
    if (offset <= -w) offset += w;
    if (offset > 0) offset -= w;
    track.style.transform = `translate3d(${offset}px,0,0)`;
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(32, ts - lastTs);
    lastTs = ts;
    if (!paused && !dragging && speed) {
      offset -= speed * (dt / 16);
      apply();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const pause = () => { paused = true; track.classList.add('is-paused'); };
  const resume = () => { if (!dragging) { paused = false; track.classList.remove('is-paused'); } };

  function onPointerDown(e) {
    dragging = true;
    didDrag = false;
    paused = true;
    track.classList.add('is-dragging');
    startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    startOffset = offset;
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    if (Math.abs(x - startX) > 6) didDrag = true;
    offset = startOffset + (x - startX);
    apply();
  }
  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    resume();
  }

  track.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  track.addEventListener('click', e => { if (didDrag) { e.preventDefault(); e.stopPropagation(); didDrag = false; } }, true);

  const step = () => {
    const slide = track.querySelector('.feat-slide');
    return slide ? slide.getBoundingClientRect().width + 20 : 400;
  };
  prevBtn?.addEventListener('click', () => {
    offset += step();
    apply();
    prevBtn.blur();
    resume();
  });
  nextBtn?.addEventListener('click', () => {
    offset -= step();
    apply();
    nextBtn.blur();
    resume();
  });
}

function initShowcaseButtons() {
  document.querySelectorAll('[data-showcase]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-showcase');
      const items = key ? mediaGalleries[key] : null;
      if (items?.length) openMediaLightbox(items, 0);
    });
  });
}

function initProjectCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.project-carousel-slide')];
    const dotsContainer = carousel.querySelector('.project-carousel-dots');
    if (!slides.length) return;
    let current = 0, timer = null;
    const interval = Number(carousel.dataset.interval) || 3000;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'project-carousel-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Screenshot ${i + 1} of ${slides.length}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i, true));
      dotsContainer?.appendChild(dot);
    });

    const dots = dotsContainer ? [...dotsContainer.querySelectorAll('.project-carousel-dot')] : [];

    function goTo(index, manual = false) {
      slides[current].classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      dots[current]?.setAttribute('aria-selected', 'false');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current]?.classList.add('is-active');
      dots[current]?.setAttribute('aria-selected', 'true');
      if (manual) { clearInterval(timer); startTimer(); }
    }

    function startTimer() { if (interval > 0) timer = setInterval(() => goTo(current + 1), interval); }
    startTimer();
  });
}

/* ── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initThree();
  initFeaturedCarousel();
  initProjectCarousels();
  initShowcaseButtons();
  renderMediaGalleries();
  highlightNavLink();
  toggleBackToTop();
});

window.addEventListener('load', () => {
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
});

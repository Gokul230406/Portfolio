/* =================================================================
   GOKUL P — PORTFOLIO | main.js (ES Module) v3
   Three.js · GSAP ScrollTrigger · Cinematic cursor glow & spring trail
   ================================================================= */

import * as THREE from 'three';

const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowPower = isTouchDevice || navigator.hardwareConcurrency <= 4 || prefersReducedMotion;

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
const scrollInfo = { y: 0, targetY: 0 };

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

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(theme.bgColor, theme.fog);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 0, 240);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isLowPower, alpha: true, powerPreference: isLowPower ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1.25 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const lightA = new THREE.PointLight(theme.particleColor1, 2, 320);
  lightA.position.set(120, 90, 80); scene.add(lightA);
  const lightB = new THREE.PointLight(theme.particleColor2, 1.4, 280);
  lightB.position.set(-110, -70, 60); scene.add(lightB);

  createParticles(theme);
  createTechFloats(theme);

  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(onWindowResize, 120); });
  if (!isTouchDevice) window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', () => {
    animationRunning = !document.hidden;
    if (animationRunning && !rafId) animate();
  });
  animate();
}

function createParticles(palette) {
  const count = isLowPower ? 500 : 1400;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c1 = new THREE.Color(palette.particleColor1);
  const c2 = new THREE.Color(palette.particleColor2);
  const scratch = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const r = 140 + Math.random() * 680;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    scratch.copy(c1).lerp(c2, Math.random());
    colors[i*3] = scratch.r; colors[i*3+1] = scratch.g; colors[i*3+2] = scratch.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  particleSystem = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: isLowPower ? 1.8 : 2.1, vertexColors: true, transparent: true,
    opacity: 0.55, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(particleSystem);
}

function wireMat(color, opacity = 0.42) {
  return new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity, depthWrite: false });
}

function solidMat(color, opacity = 0.28) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
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
  g.add(new THREE.Mesh(new THREE.SphereGeometry(4, 10, 10), solidMat(color, 0.55)));
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(16, 0.45, 6, 48), wireMat(color, 0.4));
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
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 18, 16), wireMat(color, 0.4)));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.5, 6, 24), wireMat(color, 0.35)));
  return g;
}

function makeGitBranch(color) {
  const g = new THREE.Group();
  const m = solidMat(color, 0.5);
  [[0, -12, 0], [0, 0, 0], [0, 12, 0], [10, 6, 0]].forEach(([x, y, z]) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), m);
    n.position.set(x, y, z); g.add(n);
  });
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 24, 6), wireMat(color, 0.45));
  g.add(line);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 6), wireMat(color, 0.45));
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
    const n = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), solidMat(color, 0.5));
    n.position.set(x, y, z); g.add(n);
  });
  g.add(new THREE.Mesh(new THREE.TorusGeometry(12, 0.4, 6, 32), wireMat(color, 0.35)));
  return g;
}

function makeCoffeeCup(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(8, 7, 14, 12), wireMat(color, 0.42)));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(5, 0.7, 6, 16, Math.PI), wireMat(color, 0.42));
  handle.position.set(9, 0, 0); handle.rotation.y = Math.PI / 2;
  g.add(handle);
  return g;
}

function makeMongoLeaf(color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(8, 10, 12, 0, Math.PI * 2, 0, Math.PI * 0.85), wireMat(color, 0.4)));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(4, 10, 8), wireMat(color, 0.4));
  tip.position.y = -10; g.add(tip);
  return g;
}

function makeSpringCoil(color) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.55, 6, 24), wireMat(color, 0.38));
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
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), wireMat(color, 0.35));
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
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(5, 1.1, 6, 16, Math.PI), wireMat(color, 0.4));
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
  const count = isLowPower ? 8 : makers.length + 4;
  const spread = Math.min(window.innerWidth / 8.5, 160);

  for (let i = 0; i < count; i++) {
    const maker = makers[i % makers.length];
    const mesh = maker(i % 2 === 0 ? palette.meshColor : palette.ringColor);
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
    const radius = spread * (0.5 + (i % 5) * 0.2);
    const x = Math.cos(angle) * radius * (i % 2 === 0 ? 1.2 : -1.05);
    const y = Math.sin(angle * 1.25) * (spread * 0.6) + ((i % 6) - 2.5) * 16;
    const z = -20 - (i % 6) * 18 - Math.random() * 35;
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(0.48 + (i % 5) * 0.12);
    mesh.userData = {
      baseX: x, baseY: y, baseZ: z,
      speed: 0.18 + (i % 6) * 0.08,
      amp: 9 + (i % 5) * 3.5,
      rotSpeed: 0.1 + (i % 5) * 0.05,
      phase: i * 0.72,
      scrollFactor: 0.35 + (i % 4) * 0.28,
      parallaxX: (i % 2 === 0 ? 1 : -1) * (16 + i * 2.5)
    };
    techGroup.add(mesh);
    techMeshes.push(mesh);
  }
}

function layoutTechForViewport() {
  if (!techMeshes.length) return;
  const spread = Math.min(window.innerWidth / 8.5, 160);
  techMeshes.forEach((mesh, i) => {
    const angle = (i / techMeshes.length) * Math.PI * 2 + (i % 3) * 0.4;
    const radius = spread * (0.5 + (i % 5) * 0.2);
    const x = Math.cos(angle) * radius * (i % 2 === 0 ? 1.2 : -1.05);
    const y = Math.sin(angle * 1.25) * (spread * 0.6) + ((i % 6) - 2.5) * 16;
    const z = mesh.userData.baseZ;
    mesh.userData.baseX = x;
    mesh.userData.baseY = y;
    mesh.position.x = x;
    mesh.position.y = y;
  });
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  layoutTechForViewport();
}
function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}
function onScroll() { scrollInfo.targetY = window.scrollY; }

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

  scrollInfo.y += (scrollInfo.targetY - scrollInfo.y) * 0.1;
  const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const scrollNorm = scrollInfo.y / docHeight;
  const scrollWave = Math.sin(scrollNorm * Math.PI * 5);

  techMeshes.forEach(mesh => {
    const d = mesh.userData;
    mesh.rotation.y = time * d.rotSpeed + d.phase + scrollNorm * 2.2;
    mesh.rotation.x = time * d.rotSpeed * 0.7 + scrollNorm * d.scrollFactor;
    mesh.position.y = d.baseY + Math.sin(time * d.speed + d.phase) * d.amp + scrollWave * 28 * d.scrollFactor;
    mesh.position.x = d.baseX + Math.cos(time * d.speed * 0.7 + d.phase) * (d.amp * 0.5) + scrollNorm * d.parallaxX;
    mesh.position.z = d.baseZ + Math.sin(scrollNorm * Math.PI * 3 + d.phase) * 22;
  });

  currentMouseX += (targetMouseX - currentMouseX) * 0.04;
  currentMouseY += (targetMouseY - currentMouseY) * 0.04;
  camera.position.x += (currentMouseX * 28 - camera.position.x) * 0.045;
  camera.position.y += (-currentMouseY * 16 - camera.position.y) * 0.045;
  camera.lookAt(8, scrollNorm * -12, 0);

  if (particleSystem) {
    particleSystem.position.y = scrollWave * 40;
    particleSystem.position.x = Math.cos(scrollNorm * Math.PI * 2) * 24;
    particleSystem.rotation.y = time * 0.06 + scrollNorm * Math.PI * 1.4;
  }
  if (techGroup) {
    techGroup.rotation.y = scrollNorm * 0.85;
    techGroup.position.y = -scrollNorm * 35;
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
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  (function animateCursor() {
    // Follower spring
    followerX += (mouseX - followerX) * 0.09;
    followerY += (mouseY - followerY) * 0.09;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';

    // Glow (slow smooth)
    if (glowEl) {
      glowX += (mouseX - glowX) * 0.04;
      glowY += (mouseY - glowY) * 0.04;
      glowEl.style.left = glowX + 'px';
      glowEl.style.top = glowY + 'px';
    }

    // Spring trail
    let prevX = mouseX, prevY = mouseY;
    trailDots.forEach((dot, i) => {
      const hist = trailHistory[i];
      hist.x += (prevX - hist.x) * (0.3 - i * 0.028);
      hist.y += (prevY - hist.y) * (0.3 - i * 0.028);
      dot.style.left = hist.x + 'px';
      dot.style.top = hist.y + 'px';
      const scale = 1 - (i / dotCount) * 0.65;
      const opacity = 0.9 - (i / dotCount) * 0.85;
      dot.style.transform = `translate(-50%, -50%) scale(${scale})`;
      dot.style.opacity = opacity;
      prevX = hist.x; prevY = hist.y;
    });

    requestAnimationFrame(animateCursor);
  })();

  const hoverTargets = document.querySelectorAll('a, button, [role="button"], .media-thumb, .feat-slide, .project-card, .achievement-card, .cert-card, .lead-node, .skill-card');
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
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollPos = window.scrollY + 120;
  sections.forEach(sec => {
    if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
      const id = sec.getAttribute('id');
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('data-section') === id));
    }
  });
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
  ScrollTrigger.config({ limitCallbacks: true });

  /* ── Dynamic Three.js Camera Scroll Shift ────────────────────── */
  if (camera) {
    gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top', end: 'max', scrub: 1.2, invalidateOnRefresh: true
      }
    })
      .to(camera.position, { z: 200, x: -20, y: -6, ease: 'none' }, 0)
      .to(camera.position, { z: 190, x: 24, y: 10, ease: 'none' }, 0.25)
      .to(camera.position, { z: 210, x: -14, y: -4, ease: 'none' }, 0.5)
      .to(camera.position, { z: 240, x: 0, y: 0, ease: 'none' }, 1);
  }

  /* ── High-Impact Hero Entrance Animation ─────────────────────── */
  const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
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

  /* ── UNIQUE SECTION-BY-SECTION ANIMATION SIGNATURES ────────── */
  function initUniqueSectionAnimations() {
    /* Generic Header animations (Numbers & 3D Title Skew) */
    document.querySelectorAll('section[data-cinematic]:not(#home)').forEach(section => {
      const numEl   = section.querySelector('.cine-number');
      const titleEl = section.querySelector('.cine-title');
      const sub     = section.querySelector('.cine-sub');

      if (numEl) {
        gsap.fromTo(numEl,
          { opacity: 0, x: -40, scale: 0.4, rotate: -25 },
          {
            opacity: 1, x: 0, scale: 1, rotate: 0, duration: 0.65, ease: 'back.out(2)',
            scrollTrigger: { trigger: section, start: 'top 88%', toggleActions: 'play none none none' }
          }
        );
      }
      if (titleEl) {
        const inner = titleEl.querySelector('.line-inner') || titleEl;
        gsap.fromTo(inner,
          { opacity: 0, y: 50, rotateX: -30, skewY: 3, transformOrigin: 'left top' },
          {
            opacity: 1, y: 0, rotateX: 0, skewY: 0, duration: 0.85, ease: 'expo.out',
            scrollTrigger: { trigger: section, start: 'top 86%', toggleActions: 'play none none none' }
          }
        );
      }
      if (sub) {
        gsap.fromTo(sub,
          { opacity: 0, y: 24, letterSpacing: '0.12em' },
          {
            opacity: 1, y: 0, letterSpacing: '0.01em', duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 84%', toggleActions: 'play none none none' }
          }
        );
      }
    });

    /* 1. ABOUT SECTION: 3D Photo Slide-In & Kinetic Split */
    const aboutSec = document.querySelector('#about');
    if (aboutSec) {
      const photo = aboutSec.querySelector('.about-image-col');
      const content = aboutSec.querySelector('.about-content-col');
      const details = aboutSec.querySelectorAll('.detail-item, .profile-badge, .about-actions .btn');
      
      if (photo) {
        gsap.fromTo(photo,
          { opacity: 0, x: -80, rotateY: 25, transformPerspective: 1000, scale: 0.88 },
          {
            opacity: 1, x: 0, rotateY: 0, scale: 1, duration: 1.1, ease: 'expo.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
      if (content) {
        gsap.fromTo(content,
          { opacity: 0, x: 70, y: 20 },
          {
            opacity: 1, x: 0, y: 0, duration: 1.0, ease: 'expo.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
      if (details.length) {
        gsap.fromTo(details,
          { opacity: 0, scale: 0.7, y: 20 },
          {
            opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'back.out(1.8)', stagger: 0.05,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: aboutSec, start: 'top 78%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 2. FEATURED SECTION: Zoom & Cascade Fan-Out */
    const featSec = document.querySelector('#featured');
    if (featSec) {
      const slides = featSec.querySelectorAll('.feat-slide');
      if (slides.length) {
        gsap.fromTo(slides,
          { opacity: 0, scale: 0.82, y: 80, rotateY: -15, transformPerspective: 1200 },
          {
            opacity: 1, scale: 1, y: 0, rotateY: 0, duration: 0.95, ease: 'expo.out',
            stagger: 0.09, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: featSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 3. EDUCATION SECTION: Timeline Ladder Ascend & Icon Spin */
    const eduSec = document.querySelector('#education');
    if (eduSec) {
      const items = eduSec.querySelectorAll('.edu-item');
      items.forEach((item, idx) => {
        const icon = item.querySelector('.edu-icon-wrap');
        gsap.fromTo(item,
          { opacity: 0, x: idx % 2 === 0 ? -60 : 60, y: 30 },
          {
            opacity: 1, x: 0, y: 0, duration: 0.85, ease: 'expo.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none none' }
          }
        );
        if (icon) {
          gsap.fromTo(icon,
            { opacity: 0, rotate: -180, scale: 0.2 },
            {
              opacity: 1, rotate: 0, scale: 1, duration: 0.75, ease: 'back.out(2)',
              scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none none' }
            }
          );
        }
      });
    }

    /* 4. SKILLS SECTION: Spiral Vortex & Elastic Spring Burst */
    const skillsSec = document.querySelector('#skills');
    if (skillsSec) {
      const cards = skillsSec.querySelectorAll('.skill-card');
      cards.forEach((card, idx) => {
        const bar = card.querySelector('.skill-fill');
        const rot = idx % 2 === 0 ? -14 : 14;
        gsap.fromTo(card,
          { opacity: 0, scale: 0.5, rotateZ: rot, y: 40 },
          {
            opacity: 1, scale: 1, rotateZ: 0, y: 0, duration: 0.8, ease: 'back.out(1.7)',
            delay: (idx % 4) * 0.06,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: skillsSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
        if (bar) {
          const targetW = (bar.getAttribute('data-width') || '0') + '%';
          gsap.fromTo(bar,
            { width: '0%' },
            {
              width: targetW, duration: 1.35, ease: 'power3.out',
              delay: (idx % 4) * 0.06,
              scrollTrigger: { trigger: skillsSec, start: 'top 82%', toggleActions: 'play none none none' }
            }
          );
        }
      });
    }

    /* 5. PROJECTS SECTION: Alternating Horizontal Slide & Button Pop */
    const projSec = document.querySelector('#projects');
    if (projSec) {
      const projects = projSec.querySelectorAll('.project-item');
      projects.forEach((proj) => {
        const isReverse = proj.classList.contains('project-reverse');
        const imgCol = proj.querySelector('.project-image-col');
        const textCol = proj.querySelector('.project-content-col');
        const btns = proj.querySelectorAll('.project-actions .btn');

        if (imgCol) {
          gsap.fromTo(imgCol,
            { opacity: 0, x: isReverse ? 90 : -90, scale: 0.9, rotateY: isReverse ? -12 : 12, transformPerspective: 1000 },
            {
              opacity: 1, x: 0, scale: 1, rotateY: 0, duration: 1.05, ease: 'expo.out',
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: 'top 82%', toggleActions: 'play none none none' }
            }
          );
        }
        if (textCol) {
          gsap.fromTo(textCol,
            { opacity: 0, x: isReverse ? -80 : 80, y: 20 },
            {
              opacity: 1, x: 0, y: 0, duration: 1.0, ease: 'expo.out',
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: 'top 82%', toggleActions: 'play none none none' }
            }
          );
        }
        if (btns.length) {
          gsap.fromTo(btns,
            { opacity: 0, scale: 0.4, y: 15 },
            {
              opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.08,
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: proj, start: 'top 78%', toggleActions: 'play none none none' }
            }
          );
        }
      });
    }

    /* 6. ACHIEVEMENTS SECTION: Wave Stagger Pop-Up */
    const achSec = document.querySelector('#achievements');
    if (achSec) {
      const catHeaders = achSec.querySelectorAll('.ach-cat-header');
      const cards = achSec.querySelectorAll('.achievement-card');

      if (catHeaders.length) {
        gsap.fromTo(catHeaders,
          { opacity: 0, x: -40 },
          {
            opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: achSec, start: 'top 84%', toggleActions: 'play none none none' }
          }
        );
      }
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: 70, rotateX: 20, scale: 0.88, transformPerspective: 1000 },
          {
            opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.85, ease: 'expo.out',
            stagger: 0.07, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: achSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 7. CERTIFICATIONS SECTION: 3D Y-Axis Unfold */
    const certSec = document.querySelector('#certifications');
    if (certSec) {
      const cards = certSec.querySelectorAll('.cert-card');
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, rotateY: -45, y: 60, scale: 0.85, transformPerspective: 1200 },
          {
            opacity: 1, rotateY: 0, y: 0, scale: 1, duration: 0.95, ease: 'expo.out',
            stagger: 0.1, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: certSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 8. LEADERSHIP SECTION: Ripple Node Expand */
    const leadSec = document.querySelector('#leadership');
    if (leadSec) {
      const nodes = leadSec.querySelectorAll('.lead-node');
      if (nodes.length) {
        gsap.fromTo(nodes,
          { opacity: 0, scale: 0.6, rotate: 10, y: 45 },
          {
            opacity: 1, scale: 1, rotate: 0, y: 0, duration: 0.8, ease: 'back.out(1.8)',
            stagger: 0.12, clearProps: 'transform,opacity',
            scrollTrigger: { trigger: leadSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
    }

    /* 9. CONTACT SECTION: Magnet Launch & Connect Elevate */
    const contactSec = document.querySelector('#contact');
    if (contactSec) {
      const cards = contactSec.querySelectorAll('.contact-card, .contact-social');
      const connectCard = contactSec.querySelector('.connect-card');

      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, x: -60, y: 20 },
          {
            opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: contactSec, start: 'top 82%', toggleActions: 'play none none none' }
          }
        );
      }
      if (connectCard) {
        gsap.fromTo(connectCard,
          { opacity: 0, y: 90, scale: 0.88, rotateX: 18, transformPerspective: 1000 },
          {
            opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.05, ease: 'expo.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: contactSec, start: 'top 80%', toggleActions: 'play none none none' }
          }
        );
      }
    }
  }

  initUniqueSectionAnimations();

  /* ── Scrubbed Image Parallax (Parallax inside viewport, stays opaque) ── */
  if (!prefersReducedMotion) {
    document.querySelectorAll('.about-photo, .project-img-wrap img, .feat-media img').forEach(img => {
      const parentSec = img.closest('section') || img;
      gsap.fromTo(img,
        { yPercent: -8, scale: 1.1 },
        { yPercent: 8, scale: 1.0, ease: 'none',
          scrollTrigger: { trigger: parentSec, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
        }
      );
    });

    /* ── Section Bridge Diamond Rotation ── */
    document.querySelectorAll('.section-bridge-diamond, .stats-bridge-diamond').forEach(diamond => {
      gsap.fromTo(diamond,
        { rotate: 45, scale: 0.8 },
        { rotate: 225, scale: 1.3, ease: 'none',
          scrollTrigger: { trigger: diamond, start: 'top 95%', end: 'bottom 5%', scrub: 1 }
        }
      );
    });
  }

  ScrollTrigger.refresh();

  /* ── Optimized 3D Card Hover Tilt (RAF Throttled Desktop) ──── */
  if (!isTouchDevice && !prefersReducedMotion) {
    document.querySelectorAll('.achievement-card, .cert-card, .skill-card, .stat-item, .connect-card, .lead-node-card').forEach(card => {
      let rect = null;
      let ticking = false;

      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); }, { passive: true });

      card.addEventListener('mousemove', e => {
        if (!ticking) {
          requestAnimationFrame(() => {
            if (!rect) rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rx = (y / rect.height) * -12;
            const ry = (x / rect.width) * 12;
            gsap.to(card, {
              transformPerspective: 900,
              rotateX: rx,
              rotateY: ry,
              scale: 1.025,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto'
            });
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        rect = null;
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.65,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto'
        });
      }, { passive: true });
    });

    document.querySelectorAll('[data-magnetic], .btn-primary, .btn-glass, .nav-logo, .feat-slide').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const b = btn.getBoundingClientRect();
        const x = e.clientX - b.left - b.width / 2;
        const y = e.clientY - b.top - b.height / 2;
        gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: 'power2.out' });
      }, { passive: true });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.38)' });
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
  'cultural-head': [
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.16 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.46.22 PM.jpeg',
    'pictures/Non tech achievements/WhatsApp Image 2026-06-29 at 3.45.34 PM.jpeg',
  ],
  'cert-oracle': ['pictures/Oracle/Gokul_Oracle.jpg', 'pictures/Oracle/Gokul_Oracle.pdf'],
  'cert-cisco': ['pictures/Networking basics/Networking basics.pdf'],
  'cert-cpp': ['pictures/C++ fundamentals/C++.pdf'],
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

const isPdfPath = p => /\.pdf$/i.test(p);
const isImagePath = p => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(p);
const encodeMediaPath = p => p.split('/').map(encodeURIComponent).join('/');
const getCertThumbPath = p => p.replace(/\.pdf$/i, '.jpg');

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
  const timer = setInterval(() => {
    if (paused) return;
    setActive(idx + 1);
  }, 2800);
  container.addEventListener('mouseenter', () => { paused = true; });
  container.addEventListener('mouseleave', () => { paused = false; });
  container.addEventListener('touchstart', () => { paused = true; }, { passive: true });
  container._heroCarouselStop = () => clearInterval(timer);
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

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
  const pct = document.getElementById('loaderPct');
  if (!loader) { initEntranceAnimations(); return; }

  let progress = 0;
  const duration = isLowPower ? 600 : 1200;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    progress = Math.round(easeOutCubic(t) * 100);
    if (fill) fill.style.width = progress + '%';
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
let particleSystem, heroMesh, ringMesh, secondaryMesh;
let targetMouseX = 0, targetMouseY = 0, currentMouseX = 0, currentMouseY = 0;
const scrollInfo = { y: 0, targetY: 0 };

const theme = {
  particleColor1: 0xd4af37,
  particleColor2: 0xf0d060,
  meshColor: 0xd4af37,
  ringColor: 0xf0d060,
  bgColor: 0x050505,
  fog: 0.0014
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
  createHeroMeshes(theme);

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
  const count = isLowPower ? 800 : 2400;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c1 = new THREE.Color(palette.particleColor1);
  const c2 = new THREE.Color(palette.particleColor2);
  const scratch = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 440;
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
    size: isLowPower ? 2 : 2.4, vertexColors: true, transparent: true,
    opacity: 0.75, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(particleSystem);
}

function createHeroMeshes(palette) {
  const mat = { wireframe: true, transparent: true };
  heroMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(52, isLowPower ? 0 : 1),
    new THREE.MeshBasicMaterial({ ...mat, color: palette.meshColor, opacity: 0.38 })
  );
  heroMesh.position.set(70, 10, -20);
  scene.add(heroMesh);

  ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(70, 0.55, 8, isLowPower ? 48 : 80),
    new THREE.MeshBasicMaterial({ color: palette.ringColor, transparent: true, opacity: 0.32 })
  );
  ringMesh.position.copy(heroMesh.position);
  ringMesh.rotation.x = Math.PI / 2.4;
  scene.add(ringMesh);

  if (!isLowPower) {
    secondaryMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(18, 0),
      new THREE.MeshBasicMaterial({ ...mat, color: palette.ringColor, opacity: 0.45 })
    );
    secondaryMesh.position.set(-90, -40, -40);
    scene.add(secondaryMesh);
  }
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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

  const time = Date.now() * 0.00045;

  if (particleSystem) { particleSystem.rotation.y = time * 0.08; particleSystem.rotation.x = time * 0.03; }
  if (heroMesh) {
    heroMesh.rotation.y = time * 0.35; heroMesh.rotation.x = time * 0.22;
    heroMesh.scale.setScalar(1 + Math.sin(time * 2.4) * 0.04);
    heroMesh.material.opacity = 0.32 + Math.sin(time * 1.8) * 0.08;
  }
  if (ringMesh && heroMesh) {
    ringMesh.rotation.z = time * 0.4;
    ringMesh.rotation.x = Math.PI / 2.4 + Math.sin(time) * 0.15;
    ringMesh.position.copy(heroMesh.position);
  }
  if (secondaryMesh) {
    secondaryMesh.rotation.y = -time * 0.5;
    secondaryMesh.rotation.z = time * 0.3;
    secondaryMesh.position.y = -40 + Math.sin(time * 1.5) * 12;
  }

  currentMouseX += (targetMouseX - currentMouseX) * 0.04;
  currentMouseY += (targetMouseY - currentMouseY) * 0.04;
  camera.position.x += (currentMouseX * 28 - camera.position.x) * 0.04;
  camera.position.y += (-currentMouseY * 18 - camera.position.y) * 0.04;
  camera.lookAt(20, 0, 0);

  scrollInfo.y += (scrollInfo.targetY - scrollInfo.y) * 0.08;
  if (particleSystem) particleSystem.position.y = scrollInfo.y * 0.12;
  if (heroMesh) { heroMesh.position.y = 10 - scrollInfo.y * 0.22; heroMesh.position.x = 70 + scrollInfo.y * 0.08; }
  if (secondaryMesh) secondaryMesh.position.x = -90 - scrollInfo.y * 0.05;

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

  const hoverTargets = document.querySelectorAll('a, button, [role="button"], .media-thumb, .feat-card, .creative-card, .project-img-wrap, .achievement-card, .skill-card');
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

/* ── TYPEWRITER ─────────────────────────────────────────────── */
const typeEl = document.getElementById('typewriter');
const words = ['Full Stack Developer', 'Java Programmer', 'Blockchain Enthusiast', 'Theatre Club President', 'Problem Solver', 'Mr. Techofest 2026', 'Event Emcee'];
let wordIndex = 0, charIndex = 0, isDeleting = false;

function typeWriter() {
  if (!typeEl) return;
  const word = words[wordIndex];
  if (!isDeleting) {
    typeEl.textContent = word.slice(0, ++charIndex);
    if (charIndex === word.length) { setTimeout(() => { isDeleting = true; typeWriter(); }, 2200); return; }
  } else {
    typeEl.textContent = word.slice(0, --charIndex);
    if (charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; }
  }
  setTimeout(typeWriter, isDeleting ? 50 : 85);
}
setTimeout(typeWriter, isTouchDevice ? 800 : 2200);

/* ── GSAP CINEMATIC ANIMATIONS ──────────────────────────────── */
function initEntranceAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Fallback: reveal everything immediately
    document.querySelectorAll('.line-inner, .brand-line-inner, .quote-line-inner, .cine-sub, .cine-number').forEach(el => {
      el.style.transform = 'none'; el.style.opacity = '1';
    });
    document.querySelectorAll('.skill-fill').forEach(bar => { bar.style.width = (bar.getAttribute('data-width') || '0') + '%'; });
    document.querySelectorAll('.hero-eyebrow, .hero-role, .hero-cta, .hero-meta-bar, .manifesto-sign').forEach(el => {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    document.querySelectorAll('.hero-portrait').forEach(el => {
      el.style.opacity = '1'; el.style.transform = 'none'; el.style.clipPath = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // 1. Camera parallax through scroll
  if (camera) {
    gsap.timeline({ scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.4 } })
      .to(camera.position, { z: 180, x: -35, y: -10, ease: 'none' })
      .to(camera.position, { z: 200, x: 45, y: 15, ease: 'none' })
      .to(camera.position, { z: 170, x: -20, y: -5, ease: 'none' })
      .to(camera.position, { z: 190, x: 35, y: 10, ease: 'none' })
      .to(camera.position, { z: 240, x: 0, y: 0, ease: 'none' })
      .to(camera.position, { z: 220, x: -30, y: -10, ease: 'none' })
      .to(camera.position, { z: 260, x: 40, y: 15, ease: 'none' })
      .to(camera.position, { z: 190, x: -25, y: -5, ease: 'none' })
      .to(camera.position, { z: 240, x: 0, y: 0, ease: 'none' })
      .to(camera.position, { z: 210, x: 30, y: 10, ease: 'none' })
      .to(camera.position, { z: 240, x: 0, y: 0, ease: 'none' });
  }

  // 2. HERO entrance — cinematic zoom-in from scale
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .to('.brand-line-inner', { y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: 0.14, ease: 'expo.out' }, 0.1)
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to('.hero-role', { opacity: 1, y: 0, duration: 0.75 }, 0.55)
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.65 }, 0.75)
    .to('#heroPortrait', {
      opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 32px)',
      duration: 1.4, ease: 'expo.out'
    }, 0.18)
    .to('.hero-meta-bar', { opacity: 1, y: 0, duration: 0.65 }, 0.9);

  // 3. All sections — intro text reveal + per-FX transitions
  document.querySelectorAll('section[data-cinematic]').forEach(section => {
    const fx = section.getAttribute('data-fx');
    const number = section.querySelector('.cine-number');
    const titleInner = section.querySelectorAll('.line-inner');
    const sub = section.querySelector('.cine-sub');
    const outro = section.querySelector('.cine-outro span');

    if (titleInner.length) gsap.set(titleInner, { yPercent: 110 });
    if (sub) gsap.set(sub, { opacity: 0, y: 28 });
    if (number) gsap.set(number, { opacity: 0, x: -18 });

    const introTl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none reverse' }
    });
    if (number) introTl.to(number, { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out' }, 0);
    if (titleInner.length) introTl.to(titleInner, { yPercent: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out' }, 0.08);
    if (sub) introTl.to(sub, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.3);

    // FX-specific cinematic section transitions without blurring section parent!
    if (fx === 'zoom-in') {
      const items = section.querySelectorAll('.featured-grid, .achievements-grid-unified, .contact-grid');
      if (items.length) {
        gsap.fromTo(items,
          { scale: 0.96, opacity: 0.35, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.8,
            scrollTrigger: { trigger: section, start: 'top 92%', end: 'top 45%', scrub: true } }
        );
        gsap.to(items, { scale: 1.02, opacity: 0.35, y: -30,
          scrollTrigger: { trigger: section, start: 'bottom 55%', end: 'bottom 10%', scrub: true } });
      }
    }
    else if (fx === 'zoom-split') {
      const visualEl = section.querySelector('.portrait-frame, .about-img-wrap');
      const textEl = section.querySelector('.hero-left, .about-content-col');
      const gridCards = section.querySelectorAll('.creative-card, .leadership-card');

      if (visualEl) {
        gsap.fromTo(visualEl,
          { scale: 1.15, opacity: 0.3, clipPath: 'inset(10% 10% 10% 10% round var(--radius-xl))' },
          { scale: 1, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round var(--radius-xl))',
            scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 45%', scrub: true } }
        );
        gsap.to(visualEl, { scale: 0.9, opacity: 0.3, clipPath: 'inset(10% 10% 10% 10% round var(--radius-xl))',
          scrollTrigger: { trigger: section, start: 'bottom 50%', end: 'bottom 5%', scrub: true } });
      }
      if (textEl) {
        gsap.fromTo(textEl, { y: 30, opacity: 0.4 }, { y: 0, opacity: 1,
          scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 48%', scrub: true } });
        gsap.to(textEl, { y: -30, opacity: 0.4,
          scrollTrigger: { trigger: section, start: 'bottom 50%', end: 'bottom 10%', scrub: true } });
      }
      if (gridCards.length) {
        gsap.fromTo(gridCards,
          { y: 40, opacity: 0.3, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, stagger: 0.05,
            scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 48%', scrub: true } }
        );
        gsap.to(gridCards, { y: -40, opacity: 0.3, scale: 1.02, stagger: 0.05,
          scrollTrigger: { trigger: section, start: 'bottom 50%', end: 'bottom 10%', scrub: true } });
      }
    }
    else if (fx === 'split-out') {
      const items = section.querySelectorAll('.project-item, .manifesto-quote');
      items.forEach(item => {
        gsap.fromTo(item,
          { scale: 0.96, opacity: 0.4, rotateX: 6, transformPerspective: 1200 },
          { scale: 1, opacity: 1, rotateX: 0,
            scrollTrigger: { trigger: item, start: 'top 93%', end: 'top 55%', scrub: true } }
        );
        gsap.to(item, { scale: 1.04, opacity: 0.4, rotateX: -6,
          scrollTrigger: { trigger: item, start: 'bottom 45%', end: 'bottom 5%', scrub: true } });
      });
    }
    else if (fx === 'slide-up') {
      const blocks = section.querySelectorAll('.education-timeline, .cert-blocks, .skills-grid');
      if (blocks.length) {
        gsap.fromTo(blocks, { y: 60, opacity: 0.35 }, { y: 0, opacity: 1,
          scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 50%', scrub: true } });
        gsap.to(blocks, { y: -60, opacity: 0.35,
          scrollTrigger: { trigger: section, start: 'bottom 48%', end: 'bottom 10%', scrub: true } });
      }
    }

    // Outro gold line fill
    if (outro) {
      gsap.to(outro, { width: '100%', ease: 'none',
        scrollTrigger: { trigger: section, start: 'bottom 90%', end: 'bottom 72%', scrub: true } });
    }
  });

  // Manifesto quote lines (split-out)
  const quoteLineInners = document.querySelectorAll('.quote-line-inner');
  if (quoteLineInners.length) {
    gsap.set(quoteLineInners, { y: '100%' });
    gsap.to(quoteLineInners, {
      y: '0%', stagger: 0.18, duration: 0.95, ease: 'expo.out',
      scrollTrigger: { trigger: '#manifesto', start: 'top 72%', toggleActions: 'play none none reverse' }
    });
    gsap.to('.manifesto-sign', {
      opacity: 1, duration: 0.8, delay: 0.5,
      scrollTrigger: { trigger: '#manifesto', start: 'top 72%', toggleActions: 'play none none reverse' }
    });
  }

  // Achievement + leadership cards stagger in
  gsap.utils.toArray('.achievement-card, .leadership-card, .edu-card, .skill-card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
        delay: (i % 3) * 0.07
      }
    );
  });

  // Skill bar fills
  gsap.utils.toArray('.skill-card').forEach(card => {
    const bar = card.querySelector('.skill-fill');
    if (!bar) return;
    gsap.to(bar, {
      width: (bar.getAttribute('data-width') || '0') + '%',
      duration: 1.2, ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 92%' }
    });
  });

  // Stat items stagger
  gsap.utils.toArray('.stat-item').forEach((item, i) => {
    gsap.fromTo(item,
      { scale: 0.88, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)', delay: i * 0.1,
        scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none reverse' }
      }
    );
  });

  // Magnetic elements
  if (!isTouchDevice) {
    document.querySelectorAll('[data-magnetic], .btn-primary, .btn-glass, .nav-logo, .creative-card, .feat-card').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const b = btn.getBoundingClientRect();
        const x = e.clientX - b.left - b.width / 2;
        const y = e.clientY - b.top - b.height / 2;
        gsap.to(btn, { x: x * 0.24, y: y * 0.24, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.38)' });
      });
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
    el.dataset.suffix = original.replace(/[-\d.]/g, '');
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
const GALLERY_PREVIEW_MAX = 4;
const GALLERY_SEE_MORE_AT = 3;

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
  'cert-oracle': ['pictures/Oracle/Gokul_Oracle.pdf'],
  'cert-cisco': ['pictures/Networking basics/Networking basics.pdf'],
  'cert-cpp': ['pictures/C++ fundamentals/C++.pdf'],
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
      <p class="media-lightbox-counter"></p>
    </div>`;
  document.body.appendChild(lb);
  const close = () => { lb.classList.remove('open'); lb.querySelector('.media-lightbox-pdf').src = ''; };
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lb.querySelector('.media-lightbox-close').addEventListener('click', close);
  lb.querySelector('.media-lightbox-prev').addEventListener('click', () => stepMediaLightbox(-1));
  lb.querySelector('.media-lightbox-next').addEventListener('click', () => stepMediaLightbox(1));
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

function buildSeeMoreThumb(hiddenCount, startIndex, items) {
  const previewItem = items[startIndex];
  const previewSrc = previewItem && isImagePath(previewItem) ? encodeMediaPath(previewItem) : '';
  const previewImg = previewSrc ? `<img data-src="${previewSrc}" alt="" class="media-more-preview-img" loading="lazy" />` : '';
  return `<button class="media-thumb media-thumb-more gallery-thumb-enter" type="button" data-index="${startIndex}">
    ${previewImg}
    <span class="media-more-overlay"><i class="fas fa-images"></i><span>See more</span><strong>+${hiddenCount}</strong></span>
  </button>`;
}

function loadGalleryImages(container) {
  container.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  container.querySelectorAll('.media-cert-thumb').forEach(img => {
    const btn = img.closest('.media-thumb-pdf');
    img.addEventListener('load', () => btn?.classList.add('media-thumb-pdf-has-img'), { once: true });
    img.addEventListener('error', () => { img.style.display = 'none'; btn?.classList.add('media-thumb-pdf-fallback'); }, { once: true });
  });
  if (!isTouchDevice) initGalleryThumbCycle(container);
}

function initGalleryThumbCycle(container) {
  const moreThumb = container.querySelector('.media-thumb-more');
  if (!moreThumb) return;
  const previewImg = moreThumb.querySelector('.media-more-preview-img');
  if (!previewImg) return;
  const key = container.getAttribute('data-gallery');
  const items = key ? mediaGalleries[key] : null;
  if (!items || items.length <= GALLERY_PREVIEW_MAX) return;
  const hiddenItems = items.slice(GALLERY_SEE_MORE_AT).filter(isImagePath);
  if (hiddenItems.length < 2) return;
  let cycleIndex = 0;
  previewImg.style.transition = 'opacity 0.35s ease';
  const cycle = () => {
    previewImg.style.opacity = '0';
    setTimeout(() => { previewImg.src = encodeMediaPath(hiddenItems[cycleIndex]); previewImg.style.opacity = '1'; cycleIndex = (cycleIndex + 1) % hiddenItems.length; }, 320);
  };
  cycle();
  const id = setInterval(cycle, 2800);
  moreThumb.addEventListener('click', () => clearInterval(id), { once: true });
}

function renderSingleGallery(g) {
  const key = g.getAttribute('data-gallery');
  const items = key ? mediaGalleries[key] : null;
  if (!items || items.length === 0 || g.dataset.rendered === '1') return;
  g.dataset.rendered = '1';
  let html = '';
  if (items.length > GALLERY_PREVIEW_MAX) {
    items.slice(0, GALLERY_SEE_MORE_AT).forEach((item, i) => { html += buildMediaThumb(item, i, i * 80); });
    html += buildSeeMoreThumb(items.length - GALLERY_SEE_MORE_AT, GALLERY_SEE_MORE_AT, items);
  } else {
    items.forEach((item, i) => { html += buildMediaThumb(item, i, i * 80); });
  }
  g.innerHTML = html;
  loadGalleryImages(g);
  g.querySelectorAll('.media-thumb').forEach(btn => {
    btn.addEventListener('click', () => openMediaLightbox(items, Number(btn.dataset.index) || 0));
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

/* ── PROJECT CAROUSEL ───────────────────────────────────────── */
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
  initProjectCarousels();
  renderMediaGalleries();
  highlightNavLink();
  toggleBackToTop();
});

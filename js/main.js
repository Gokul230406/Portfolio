/* ============================================================
   GOKUL P — PORTFOLIO  |  main.js
   ============================================================ */

'use strict';

/* ─── LOADER ─────────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    // Kick off entry animations
    animateOnScroll();
  }, 1600);
});

/* ─── THEME TOGGLE ───────────────────────────────────────── */
const root        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

const savedTheme = localStorage.getItem('gp-theme') || 'dark';
root.setAttribute('data-theme', savedTheme);
applyThemeIcon(savedTheme);

themeToggle?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('gp-theme', next);
  applyThemeIcon(next);
});

function applyThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/* ─── CUSTOM CURSOR ──────────────────────────────────────── */
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');

if (!isTouchDevice && cursor && follower) {
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animateCursor() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    requestAnimationFrame(animateCursor);
  })();

  document.querySelectorAll('a, button, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.setProperty('width', '20px');
      cursor.style.setProperty('height', '20px');
      follower.style.setProperty('width', '56px');
      follower.style.setProperty('height', '56px');
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.setProperty('width', '10px');
      cursor.style.setProperty('height', '10px');
      follower.style.setProperty('width', '36px');
      follower.style.setProperty('height', '36px');
    });
  });
} else {
  cursor?.remove();
  follower?.remove();
}

/* ─── NAVBAR SCROLL ──────────────────────────────────────── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
  highlightNavLink();
  toggleBackToTop();
});

/* ─── ACTIVE NAV LINK HIGHLIGHT ──────────────────────────── */
function highlightNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollPos = window.scrollY + 120;

  sections.forEach(section => {
    const top    = section.offsetTop;
    const height = section.offsetHeight;
    const id     = section.getAttribute('id');

    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === id) {
          link.classList.add('active');
        }
      });
    }
  });
}

/* ─── MOBILE MENU ────────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburger?.addEventListener('click', toggleMobileMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
mobileMenu?.addEventListener('click', (e) => {
  if (e.target === mobileMenu) closeMobileMenu();
});

function toggleMobileMenu() {
  if (mobileMenu?.classList.contains('open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}
function openMobileMenu() {
  mobileMenu?.classList.add('open');
  hamburger?.classList.add('open');
  hamburger?.setAttribute('aria-expanded', 'true');
  hamburger?.setAttribute('aria-label', 'Close menu');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  mobileMenu?.classList.remove('open');
  hamburger?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  hamburger?.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}

/* ─── TYPEWRITER EFFECT ──────────────────────────────────── */
const typeEl  = document.getElementById('typewriter');
const words   = [
  'Full Stack Developer',
  'Java Programmer',
  'Blockchain Enthusiast',
  'Theatre Club President',
  'Problem Solver',
  'Mr. Techofest 2026',
  'Event Emcee',
];
let wordIndex = 0, charIndex = 0, isDeleting = false;

function typeWriter() {
  if (!typeEl) return;
  const word = words[wordIndex];

  if (!isDeleting) {
    typeEl.textContent = word.slice(0, ++charIndex);
    if (charIndex === word.length) {
      setTimeout(() => { isDeleting = true; typeWriter(); }, 2000);
      return;
    }
  } else {
    typeEl.textContent = word.slice(0, --charIndex);
    if (charIndex === 0) {
      isDeleting = false;
      wordIndex  = (wordIndex + 1) % words.length;
    }
  }
  setTimeout(typeWriter, isDeleting ? 60 : 100);
}

// Start typewriter after loader
setTimeout(typeWriter, 1800);

/* ─── SCROLL ANIMATIONS (AOS-like) ───────────────────────── */
function animateOnScroll() {
  const items = document.querySelectorAll('[data-aos]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.getAttribute('data-aos-delay') || '0');
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
          // Animate skill bars if inside this element
          entry.target.querySelectorAll('.skill-fill').forEach(bar => {
            animateSkillBar(bar);
          });
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach(item => observer.observe(item));
}

/* ─── SKILL BARS ─────────────────────────────────────────── */
function animateSkillBar(bar) {
  const width = bar.getAttribute('data-width') || '0';
  requestAnimationFrame(() => {
    bar.style.width = width + '%';
  });
}

// Also watch skill cards individually
function observeSkillBars() {
  const skillCards = document.querySelectorAll('.skill-card');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target.querySelector('.skill-fill');
        if (bar && bar.style.width === '') {
          setTimeout(() => animateSkillBar(bar), 200);
        }
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  skillCards.forEach(card => skillObserver.observe(card));
}

/* ─── BACK TO TOP ────────────────────────────────────────── */
const backToTop = document.getElementById('backToTop');

function toggleBackToTop() {
  if (window.scrollY > 400) {
    backToTop?.classList.add('visible');
  } else {
    backToTop?.classList.remove('visible');
  }
}

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── FOOTER YEAR ────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─── SMOOTH ANCHOR LINKS ────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─── HERO IMAGE FALLBACK ────────────────────────────────── */
const heroPhoto = document.getElementById('heroPhoto');
if (heroPhoto) {
  heroPhoto.addEventListener('error', () => {
    heroPhoto.style.display = 'none';
    const wrap = heroPhoto.parentElement;
    if (wrap) {
      wrap.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))';
      wrap.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem;font-weight:700;font-family:\'Inria Sans\',serif;background:linear-gradient(135deg,#9f67ff,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">GP</div>';
    }
  });
}

/* ─── PARALLAX GLOW ──────────────────────────────────────── */
const heroGlow1 = document.querySelector('.hero-glow-1');
const heroGlow2 = document.querySelector('.hero-glow-2');

document.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth  - 0.5) * 30;
  const y = (e.clientY / window.innerHeight - 0.5) * 30;
  if (heroGlow1) heroGlow1.style.transform = `translate(${x}px, ${y}px)`;
  if (heroGlow2) heroGlow2.style.transform = `translate(${-x}px, ${-y}px)`;
});

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  observeSkillBars();
  animateOnScroll();
  highlightNavLink();
  toggleBackToTop();
  renderMediaGalleries();
});

/* ─── COUNT UP ANIMATION FOR STATS ──────────────────────── */
function countUp(el, target, duration = 1500) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      el.textContent = target + (el.dataset.suffix || '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start) + (el.dataset.suffix || '');
    }
  }, 16);
}

// Observe stat numbers for count-up
const statNumbers = document.querySelectorAll('.stat-number');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el  = entry.target;
      const original = (el.textContent || '').trim();
      const numeric  = original.match(/-?\d+(?:\.\d+)?/);
      const num      = numeric ? Number(numeric[0]) : NaN;

      // Keep everything except digits/dot/minus as suffix (e.g. "2nd", "75+", "8.61")
      el.dataset.suffix = original.replace(/[-\d.]/g, '');

      if (!Number.isNaN(num) && num > 0) {
        const decimals = (numeric?.[0].split('.')[1]?.length) || 0;

        // Animate integers normally; for decimals animate and format to fixed decimals.
        if (decimals === 0) {
          countUp(el, num);
        } else {
          let start = 0;
          const increment = num / (1500 / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= num) {
              el.textContent = num.toFixed(decimals) + (el.dataset.suffix || '');
              clearInterval(timer);
            } else {
              el.textContent = start.toFixed(decimals) + (el.dataset.suffix || '');
            }
          }, 16);
        }
      }
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(n => statObserver.observe(n));

/* ─── EXPERIENCE / MEDIA GALLERIES ───────────────────────── */
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

function isPdfPath(path) {
  return /\.pdf$/i.test(path);
}

function isImagePath(path) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path);
}

function getCertThumbPath(pdfPath) {
  return pdfPath.replace(/\.pdf$/i, '.png');
}

function ensureMediaLightbox() {
  let lb = document.getElementById('mediaLightbox');
  if (lb) return lb;

  lb = document.createElement('div');
  lb.id = 'mediaLightbox';
  lb.className = 'media-lightbox';
  lb.innerHTML = `
    <div class="media-lightbox-inner" role="dialog" aria-modal="true" aria-label="Media preview">
      <button class="media-lightbox-close" type="button" aria-label="Close preview">
        <i class="fas fa-times"></i>
      </button>
      <button class="media-lightbox-nav media-lightbox-prev" type="button" aria-label="Previous">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="media-lightbox-nav media-lightbox-next" type="button" aria-label="Next">
        <i class="fas fa-chevron-right"></i>
      </button>
      <div class="media-lightbox-stage">
        <img alt="Preview" class="media-lightbox-img" />
        <iframe class="media-lightbox-pdf" title="Certificate preview" frameborder="0"></iframe>
      </div>
      <p class="media-lightbox-counter"></p>
    </div>
  `;
  document.body.appendChild(lb);

  const close = () => {
    lb.classList.remove('open');
    const iframe = lb.querySelector('.media-lightbox-pdf');
    if (iframe) iframe.src = '';
  };

  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });
  lb.querySelector('.media-lightbox-close')?.addEventListener('click', close);
  lb.querySelector('.media-lightbox-prev')?.addEventListener('click', () => stepMediaLightbox(-1));
  lb.querySelector('.media-lightbox-next')?.addEventListener('click', () => stepMediaLightbox(1));
  document.addEventListener('keydown', (e) => {
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
  const src = encodeURI(item);

  activeGalleryIndex = index;

  if (isPdfPath(item)) {
    if (img) img.style.display = 'none';
    if (iframe) {
      iframe.style.display = 'block';
      iframe.src = src;
    }
  } else {
    if (iframe) {
      iframe.style.display = 'none';
      iframe.src = '';
    }
    if (img) {
      img.style.display = 'block';
      img.src = src;
      img.alt = item.split('/').pop() || 'Preview';
    }
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
  const next = (activeGalleryIndex + delta + activeGalleryItems.length) % activeGalleryItems.length;
  renderLightboxItem(next);
}

function buildMediaThumb(item, index, animDelay = 0) {
  const src = encodeURI(item);
  const name = item.split('/').pop() || 'media';
  const animStyle = animDelay ? ` style="animation-delay:${animDelay}ms"` : '';

  if (isPdfPath(item)) {
    const thumbPng = encodeURI(getCertThumbPath(item));
    return `
      <button class="media-thumb media-thumb-pdf gallery-thumb-enter" type="button" data-index="${index}" aria-label="Open certificate ${name}"${animStyle}>
        <img class="media-cert-thumb" data-src="${thumbPng}" data-fallback-pdf="${src}" alt="${name}" loading="lazy" decoding="async" />
        <iframe class="media-pdf-thumb-preview" data-pdf-src="${src}" title="Certificate preview" tabindex="-1"></iframe>
        <span class="media-pdf-badge"><i class="fas fa-certificate"></i> Cert</span>
      </button>
    `;
  }

  return `
    <button class="media-thumb gallery-thumb-enter" type="button" data-index="${index}" aria-label="Open image ${name}"${animStyle}>
      <img data-src="${src}" alt="${name}" loading="lazy" decoding="async" class="media-thumb-img" />
    </button>
  `;
}

function buildSeeMoreThumb(hiddenCount, startIndex, items) {
  const previewItem = items[startIndex];
  const previewSrc = previewItem && isImagePath(previewItem) ? encodeURI(previewItem) : '';
  const previewImg = previewSrc
    ? `<img data-src="${previewSrc}" alt="" class="media-more-preview-img" loading="lazy" decoding="async" />`
    : '';

  return `
    <button class="media-thumb media-thumb-more gallery-thumb-enter" type="button" data-index="${startIndex}" aria-label="See ${hiddenCount} more">
      ${previewImg}
      <span class="media-more-pdf"><i class="fas fa-images"></i></span>
      <span class="media-more-overlay">
        <i class="fas fa-images"></i>
        <span class="media-more-label">See more</span>
        <strong>+${hiddenCount}</strong>
      </span>
    </button>
  `;
}

function loadGalleryImages(container) {
  container.querySelectorAll('img[data-src]').forEach(img => {
    if (!img.dataset.src) return;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });

  container.querySelectorAll('.media-cert-thumb').forEach(img => {
    const btn = img.closest('.media-thumb-pdf');
    const iframe = btn?.querySelector('.media-pdf-thumb-preview');

    if (iframe?.dataset.pdfSrc) {
      iframe.src = `${iframe.dataset.pdfSrc}#toolbar=0&navpanes=0`;
    }

    img.addEventListener('load', () => {
      btn?.classList.add('media-thumb-pdf-has-png');
    }, { once: true });

    img.addEventListener('error', () => {
      img.remove();
      btn?.classList.add('media-thumb-pdf-fallback');
    }, { once: true });
  });

  initGalleryThumbCycle(container);
}

function initGalleryThumbCycle(container) {
  const thumbs = container.querySelectorAll('.media-thumb:not(.media-thumb-more) .media-thumb-img');
  thumbs.forEach((img, i) => {
    img.style.animationDelay = `${(i % 4) * 1.5}s`;
  });

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
  const cyclePreview = () => {
    previewImg.style.opacity = '0';
    setTimeout(() => {
      previewImg.src = encodeURI(hiddenItems[cycleIndex]);
      previewImg.style.opacity = '1';
      cycleIndex = (cycleIndex + 1) % hiddenItems.length;
    }, 320);
  };

  cyclePreview();
  const intervalId = setInterval(cyclePreview, 2800);
  moreThumb.addEventListener('click', () => clearInterval(intervalId), { once: true });
}

function renderSingleGallery(g) {
  const key = g.getAttribute('data-gallery');
  const items = key ? mediaGalleries[key] : null;
  if (!items || items.length === 0) return;
  if (g.dataset.rendered === '1') return;
  g.dataset.rendered = '1';

  let html = '';
  const needsSeeMore = items.length > GALLERY_PREVIEW_MAX;

  if (needsSeeMore) {
    items.slice(0, GALLERY_SEE_MORE_AT).forEach((item, i) => {
      html += buildMediaThumb(item, i, i * 80);
    });
    html += buildSeeMoreThumb(items.length - GALLERY_SEE_MORE_AT, GALLERY_SEE_MORE_AT, items);
  } else {
    items.forEach((item, i) => {
      html += buildMediaThumb(item, i, i * 80);
    });
  }

  g.innerHTML = html;
  loadGalleryImages(g);

  g.querySelectorAll('.media-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index) || 0;
      openMediaLightbox(items, index);
    });
  });
}

function renderMediaGalleries() {
  const galleries = document.querySelectorAll('.media-gallery[data-gallery]');
  if (!('IntersectionObserver' in window)) {
    galleries.forEach(renderSingleGallery);
    return;
  }

  const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        renderSingleGallery(entry.target);
        galleryObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '120px', threshold: 0.01 });

  galleries.forEach(g => galleryObserver.observe(g));
}

/* ─── PROJECT CARD TILT ──────────────────────────────────── */
document.querySelectorAll('.project-img-wrap').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
    card.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg) scale(1.03)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

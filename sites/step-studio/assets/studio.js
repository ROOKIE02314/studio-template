/* ============================================================================
   Step Studio · studio.js（零依赖 ES Module）
   ----------------------------------------------------------------------------
   1. html.js 开关（无 JS 时内容全部可见）
   2. 主题切换（localStorage + prefers-color-scheme）
   3. 点阵字标（dotmatrix.js，逐点淡入 12ms stagger）
   4. 滚动显现（IntersectionObserver，work 卡 hardscale 错峰）
   5. 数字 count-up（reduced-motion 直接终值）
   6. 滚动进度条 + 导航 scrollspy
   7. 磁吸按钮（pointer: fine 且非 reduced-motion）
   8. 触屏设备：成果卡进入视口自动「播放」
   ========================================================================== */
import { dotMatrixSVG, rowsFor } from './dotmatrix.js';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const noHover = window.matchMedia('(hover: none)').matches;

root.classList.add('js');

/* ---------- 2. 主题 ---------- */
const themeToggle = document.getElementById('themeToggle');
const themeToggleLabel = document.getElementById('themeToggleLabel');
function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeToggleLabel.textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
}
const storedTheme = localStorage.getItem('step-studio-theme');
applyTheme(storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('step-studio-theme', next);
});

/* ---------- 3. 点阵字标 ---------- */
const dmHost = document.getElementById('heroDotmatrix');
function renderDotmatrix() {
  if (!dmHost) return;
  const text = 'STEP STUDIO';
  const svg = dotMatrixSVG(text, {
    H: 120,
    rows: rowsFor(text, 'large'),
    color: 'currentColor',
    font: '700 100px Inter, "Noto Sans SC", "Source Han Sans SC", sans-serif',
    tracking: 0.06,
    ariaLabel: text,
  });
  dmHost.innerHTML = svg;
  const svgEl = dmHost.querySelector('svg');
  const dots = [...svgEl.querySelectorAll('circle')];
  const vb = svgEl.getAttribute('viewBox').split(/\s+/).map(Number);
  const cx = vb[2] / 2;
  // 从中心向两侧逐点淡入（≤12ms stagger，480ms 完成）
  dots.sort((a, b) => Math.abs(+a.getAttribute('cx') - cx) - Math.abs(+b.getAttribute('cx') - cx));
  const step = dots.length > 40 ? 12 / (dots.length / 40) : 12;
  dots.forEach((d, i) => {
    d.style.animation = reduceMotion ? 'none' : `dm-dot 480ms var(--ease-out) both`;
    d.style.animationDelay = `${Math.round(i * step)}ms`;
  });
  svgEl.removeAttribute('aria-hidden');
  dmHost.removeAttribute('aria-hidden');
}
if (document.fonts && document.fonts.ready) {
  let done = false;
  const go = () => { if (!done) { done = true; renderDotmatrix(); } };
  document.fonts.ready.then(go).catch(go);
  setTimeout(go, 1500);
} else {
  renderDotmatrix();
}

/* ---------- 4. 滚动显现 ---------- */
const revealEls = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-inview');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-inview'));
}

/* ---------- 5. count-up ---------- */
const nums = [...document.querySelectorAll('[data-count]')];
function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  if (el.dataset.static === 'true' || reduceMotion || Number.isNaN(target)) {
    el.textContent = String(target);
    return;
  }
  const dur = 800;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
if ('IntersectionObserver' in window && !reduceMotion) {
  const ioN = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { countUp(e.target); ioN.unobserve(e.target); }
    }
  }, { threshold: 0.4 });
  nums.forEach((el) => ioN.observe(el));
} else {
  nums.forEach(countUp);
}

/* ---------- 6. 滚动进度 + scrollspy ---------- */
const progressBar = document.getElementById('scrollProgressBar');
const spyLinks = [...document.querySelectorAll('[data-spy]')];
const spySections = spyLinks
  .map((a) => document.getElementById(a.dataset.spy))
  .filter(Boolean);
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const h = document.documentElement;
    const max = h.scrollHeight - window.innerHeight;
    if (progressBar) {
      progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    }
    let current = '';
    const line = window.scrollY + window.innerHeight * 0.35;
    for (const sec of spySections) {
      if (sec.offsetTop <= line) current = sec.id;
    }
    spyLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.spy === current));
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- 7. 磁吸按钮 ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      btn.style.setProperty('--mx', `${Math.max(-1, Math.min(1, dx)) * 6}px`);
      btn.style.setProperty('--my', `${Math.max(-1, Math.min(1, dy)) * 6}px`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
    });
  });
}

/* ---------- 8. 触屏：成果卡入视口自动播放 ---------- */
if (noHover && !reduceMotion && 'IntersectionObserver' in window) {
  const cards = [...document.querySelectorAll('.work-card')];
  const ioP = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio > 0.6) {
        cards.forEach((c) => c.classList.remove('is-playing'));
        e.target.classList.add('is-playing');
      } else if (!e.isIntersecting) {
        e.target.classList.remove('is-playing');
      }
    }
  }, { threshold: [0, 0.6] });
  cards.forEach((c) => ioP.observe(c));
}

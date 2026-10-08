// Efectos de viento y nubes: aparición de elementos, letras que llegan con la brisa, ráfaga entre secciones,
// contadores y el brillo que sigue al cursor.

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

// Las letras entran desde la izquierda con desenfoque, como si las trajera el viento
export function breeze(el, text) {
  if (!el) return;
  const target = String(text ?? el.textContent ?? '');
  if (reducedMotion() || !target) { el.textContent = target; return; }
  el.setAttribute('aria-label', target);
  el.innerHTML = '';
  const frag = document.createDocumentFragment();
  [...target].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'breeze__ch';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.setProperty('--d', `${i * 28 + Math.random() * 40}ms`);
    s.style.setProperty('--y', `${(Math.random() - 0.5) * 18}px`);
    s.style.setProperty('--r', `${(Math.random() - 0.5) * 24}deg`);
    frag.appendChild(s);
  });
  el.appendChild(frag);
  el.classList.remove('is-breezing');
  void el.offsetWidth;
  el.classList.add('is-breezing');
  clearTimeout(el._breeze);
  el._breeze = setTimeout(() => { el.textContent = target; el.classList.remove('is-breezing'); el.removeAttribute('aria-label'); }, 900 + target.length * 28);
}

export function typeLoop(el, words) {
  if (!el) return;
  clearTimeout(el._typing);
  const list = (words || []).filter(Boolean);
  if (!list.length) { el.textContent = ''; return; }
  if (reducedMotion()) { el.textContent = list[0]; return; }
  let wi = 0, ci = 0, deleting = false;
  const schedule = (ms) => { el._typing = setTimeout(tick, ms); };
  function tick() {
    const w = list[wi % list.length];
    if (!deleting) {
      ci++;
      el.textContent = w.slice(0, ci);
      if (ci >= w.length) { deleting = true; return schedule(1800); }
      return schedule(42 + Math.random() * 50);
    }
    ci--;
    el.textContent = w.slice(0, ci);
    if (ci <= 0) { deleting = false; wi++; return schedule(320); }
    return schedule(24);
  }
  el.textContent = '';
  schedule(600);
}

export function countUp(el, to, { duration = 1100, format = (n) => String(n) } = {}) {
  if (!el) return;
  if (reducedMotion()) { el.textContent = format(to); return; }
  const from = Number(el.dataset.shown || 0);
  const t0 = performance.now();
  cancelAnimationFrame(el._count || 0);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = format(Math.round(from + (to - from) * e));
    if (t < 1) el._count = requestAnimationFrame(step);
    else el.dataset.shown = String(to);
  };
  el._count = requestAnimationFrame(step);
}

let io = null;
export function observeReveals(scope = document, { instant = false } = {}) {
  const els = [...scope.querySelectorAll('.reveal:not(.in)')];
  if (instant || reducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  io ??= new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('in');
      io.unobserve(en.target);
      en.target.dispatchEvent(new CustomEvent('reveal'));
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  els.forEach((el) => io.observe(el));
}

export function bindTilt(root = document) {
  if (!finePointer() || reducedMotion()) return;
  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('[data-tilt]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  }, { passive: true });
  root.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('[data-tilt]');
    if (card && !card.contains(e.relatedTarget)) {
      for (const p of ['--rx', '--ry', '--mx', '--my']) card.style.removeProperty(p);
    }
  });
}

// Ráfaga de viento entre secciones: líneas blancas que cruzan la pantalla y una nube que pasa
export function windTransition(swap) {
  const layer = document.getElementById('transition-fx');
  if (!layer || reducedMotion()) { swap(); return; }
  layer.innerHTML = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'gust';
    s.style.top = `${8 + Math.random() * 84}%`;
    s.style.setProperty('--d', `${(Math.random() * 140) | 0}ms`);
    s.style.setProperty('--w', `${30 + Math.random() * 45}%`);
    s.style.setProperty('--h', `${1 + Math.random() * 2.2}px`);
    layer.appendChild(s);
  }
  const puff = document.createElement('span');
  puff.className = 'gust-cloud';
  layer.appendChild(puff);
  layer.classList.remove('is-on');
  void layer.offsetWidth;
  layer.classList.add('is-on');
  document.documentElement.classList.add('is-switching');
  setTimeout(swap, 220);
  setTimeout(() => {
    layer.classList.remove('is-on');
    document.documentElement.classList.remove('is-switching');
  }, 760);
}

export function bootScreen() {
  const el = document.getElementById('boot');
  let seen = false;
  try { seen = sessionStorage.getItem('croissants-boot') === '1'; } catch {}
  if (!el) return { done: () => {} };
  if (seen || reducedMotion()) el.classList.add('boot--quick');
  const minTime = seen || reducedMotion() ? 0 : 1400;
  const t0 = performance.now();
  return {
    done() {
      const wait = Math.max(0, minTime - (performance.now() - t0));
      setTimeout(() => {
        el.classList.add('boot--out');
        try { sessionStorage.setItem('croissants-boot', '1'); } catch {}
        setTimeout(() => el.remove(), 900);
      }, wait);
    },
  };
}

export function cursorGlow() {
  if (!finePointer() || reducedMotion()) return;
  const g = document.createElement('div');
  g.className = 'cursor-glow';
  g.setAttribute('aria-hidden', 'true');
  document.body.appendChild(g);
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
  const step = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    g.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(step) : 0;
  };
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    g.classList.add('on');
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: true });
  document.addEventListener('pointerleave', () => g.classList.remove('on'));
}

// Cada tanto pasa una brisa por los títulos con degradado (un brillo que los cruza)
export function startGusts() {
  if (reducedMotion()) return;
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const loop = () => {
    if (!document.hidden) {
      const els = [...document.querySelectorAll('.gusty')].filter(inView);
      if (els.length) {
        const el = els[(Math.random() * els.length) | 0];
        el.classList.add('is-gust');
        setTimeout(() => el.classList.remove('is-gust'), 1400);
      }
    }
    setTimeout(loop, 2600 + Math.random() * 3500);
  };
  setTimeout(loop, 1800);
}

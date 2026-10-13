// Efectos: la ráfaga de viento entre secciones, los contadores, la inclinación de las tarjetas, el brillo (muy suave)
// que sigue al cursor y las pistas de las tablas que se deslizan.

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

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

export function bindTilt(root = document) {
  if (!finePointer() || reducedMotion()) return;
  let pending = null;
  let raf = 0;
  const apply = () => {
    raf = 0;
    const { card, x: cx, y: cy } = pending;
    const r = card.getBoundingClientRect();
    const x = (cx - r.left) / r.width;
    const y = (cy - r.top) / r.height;
    card.style.setProperty('--rx', `${((0.5 - y) * 4).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${((x - 0.5) * 5).toFixed(2)}deg`);
  };
  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('[data-tilt]');
    if (!card) return;
    pending = { card, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
  root.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('[data-tilt]');
    if (card && !card.contains(e.relatedTarget)) {
      for (const p of ['--rx', '--ry']) card.style.removeProperty(p);
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
  setTimeout(swap, 180);
  setTimeout(() => layer.classList.remove('is-on'), 760);
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

// Tablas y cofres que no entran a lo ancho: el borde por donde sigue el contenido se desvanece,
// así se nota que se puede deslizar
const HSCROLL = '.table-wrap, .mreward__chest, .recipe-card .mc-panel';

function scrollHint(el) {
  const max = el.scrollWidth - el.clientWidth;
  el.classList.toggle('hs-left', max > 2 && el.scrollLeft > 2);
  el.classList.toggle('hs-right', max > 2 && el.scrollLeft < max - 2);
}

export function watchScrollHints(root = document.body) {
  const ro = 'ResizeObserver' in window ? new ResizeObserver((entries) => {
    for (const en of entries) {
      if (en.target.isConnected) scrollHint(en.target);
      else ro.unobserve(en.target);
    }
  }) : null;
  const watch = (node) => {
    const els = node.matches?.(HSCROLL) ? [node] : [...(node.querySelectorAll?.(HSCROLL) || [])];
    for (const el of els) {
      if (ro) ro.observe(el);
      else scrollHint(el);
    }
  };
  watch(root);
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) watch(n);
  }).observe(root, { childList: true, subtree: true });
  document.addEventListener('scroll', (e) => {
    if (e.target instanceof Element && e.target.matches(HSCROLL)) scrollHint(e.target);
  }, { capture: true, passive: true });
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

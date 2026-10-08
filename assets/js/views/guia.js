import { escapeHtml, icon, md, safeImage, visible, headings, plainText } from '../core.js';
import { S } from '../store.js';
import { pageHead, mdCtx } from '../components.js';
import { breeze } from '../fx.js';

let filter = '';

export function title(parts) {
  const s = section(parts[0]);
  return s ? s.titulo : '';
}

function sections() {
  return visible(S.sitio?.guia?.secciones || []);
}

function section(id) {
  const list = sections();
  return list.find((s) => s.id === id) || list[0];
}

function navHtml(current) {
  const q = filter.trim().toLowerCase();
  const list = sections().filter((s) => !q || `${s.titulo} ${s.resumen} ${s.contenido}`.toLowerCase().includes(q));
  return list.length ? list.map((s, i) => `<a class="guide-nav__link${s.id === current.id ? ' is-active' : ''}" href="#guia/${escapeHtml(s.id)}" data-route="guia"${s.id === current.id ? ' aria-current="page"' : ''}>
      <span class="guide-nav__icon">${icon(s.icono)}</span><span class="guide-nav__text"><strong>${escapeHtml(s.titulo)}</strong>${s.resumen ? `<small>${escapeHtml(plainText(s.resumen, 70))}</small>` : ''}</span>
    </a>`).join('') : `<p class="guide-nav__empty">Nada coincide con “${escapeHtml(filter)}”.</p>`;
}

function galleryHtml(s) {
  const imgs = s.imagenes.filter((im) => im.src || im.titulo);
  if (!imgs.length) return '';
  return `<div class="gallery">${imgs.map((im, i) => {
    const src = safeImage(im.src);
    return `<figure class="shot reveal" style="--i:${i % 3}">
      ${src ? `<button class="shot__btn" type="button" data-zoom="${escapeHtml(src)}" data-zoom-title="${escapeHtml(im.titulo)}" aria-label="Ampliar ${escapeHtml(im.titulo || 'imagen')}"><img src="${escapeHtml(src)}" alt="${escapeHtml(im.titulo)}" loading="lazy" decoding="async"><span class="shot__zoom">${icon('eye')}</span></button>`
        : `<div class="shot__ph">${icon('image')}<span>Imagen pendiente</span><small>Se sube desde el panel de administración</small></div>`}
      ${im.titulo || im.texto ? `<figcaption><strong>${escapeHtml(im.titulo)}</strong>${im.texto ? `<span>${escapeHtml(im.texto)}</span>` : ''}</figcaption>` : ''}
    </figure>`;
  }).join('')}</div>`;
}

export function render(el, parts, ctx) {
  const g = S.sitio.guia;
  const s = section(parts[0]);
  if (!s) { el.innerHTML = `<div class="container">${pageHead({ crumbs: ['guía'], title: 'Guía del servidor', intro: g.intro })}</div>`; return; }
  const list = sections();
  const idx = list.indexOf(s);
  const prev = list[idx - 1];
  const next = list[idx + 1];
  const toc = headings(s.contenido);
  const keepNav = ctx.prev && !ctx.changing;
  el.innerHTML = `<div class="container">
    ${pageHead({ crumbs: ['guía', s.titulo.toLowerCase()], title: 'Guía del servidor', intro: g.intro })}
    <div class="guide">
      <aside class="guide-side">
        <label class="guide-search"><span class="sr-only">Buscar en la guía</span>${icon('search')}<input class="input" type="search" placeholder="Buscar en la guía…" value="${escapeHtml(filter)}" data-guide-search></label>
        <nav class="guide-nav" aria-label="Secciones de la guía">${navHtml(s)}</nav>
      </aside>
      <article class="guide-body" id="guia-contenido">
        <header class="guide-body__head reveal">
          <span class="guide-body__icon">${icon(s.icono)}</span>
          <div><p class="kicker">sección ${idx + 1} de ${list.length}</p><h2 class="guide-body__title" data-breeze-section>${escapeHtml(s.titulo)}</h2></div>
        </header>
        ${s.resumen ? `<p class="guide-body__lead reveal">${escapeHtml(s.resumen)}</p>` : ''}
        ${toc.length > 2 ? `<nav class="toc reveal" aria-label="En esta sección">${toc.map((h) => `<a href="#guia/${escapeHtml(s.id)}" data-toc="${escapeHtml(h.id)}">${escapeHtml(h.title)}</a>`).join('')}</nav>` : ''}
        <div class="md guide-md reveal">${md(s.contenido, mdCtx())}</div>
        ${galleryHtml(s)}
        <nav class="pager" aria-label="Otras secciones">
          ${prev ? `<a class="pager__link pager__link--prev" href="#guia/${escapeHtml(prev.id)}" data-route="guia"><small>${icon('arrowLeft')} Anterior</small><strong>${escapeHtml(prev.titulo)}</strong></a>` : '<span></span>'}
          ${next ? `<a class="pager__link pager__link--next" href="#guia/${escapeHtml(next.id)}" data-route="guia"><small>Siguiente ${icon('arrowRight')}</small><strong>${escapeHtml(next.titulo)}</strong></a>` : '<span></span>'}
        </nav>
      </article>
    </div>
  </div>`;
  if (keepNav && ctx.prev?.[0] !== parts[0]) {
    const body = el.querySelector('#guia-contenido');
    body?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = el.querySelector('[data-breeze-section]');
    if (t) breeze(t, t.textContent);
  }
}

export function update() {}

document.addEventListener('input', (e) => {
  const input = e.target.closest?.('[data-guide-search]');
  if (!input) return;
  filter = input.value;
  const nav = input.closest('.guide-side')?.querySelector('.guide-nav');
  const current = section(S.route.parts[0]);
  if (nav && current) nav.innerHTML = navHtml(current);
});

document.addEventListener('click', (e) => {
  const t = e.target.closest?.('[data-toc]');
  if (t) {
    e.preventDefault();
    document.getElementById(t.dataset.toc)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

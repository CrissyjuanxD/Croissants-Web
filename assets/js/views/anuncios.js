import { escapeHtml, icon, md, fmtDate, plainText, safeImage, visible, ago } from '../core.js';
import { S } from '../store.js';
import { pageHead, mdCtx, emptyHTML } from '../components.js';
import { toast, copyText } from '../ui.js';

const ui = { cat: '' };

export function title(parts) {
  const a = find(parts[0]);
  return a ? a.titulo : '';
}

function list() {
  return visible(S.anuncios?.anuncios || []).sort((a, b) => (b.fijado - a.fijado) || (new Date(b.fecha) - new Date(a.fecha)));
}

function find(id) {
  return id ? list().find((a) => a.id === id) : null;
}

function cats() {
  return Object.fromEntries((S.anuncios?.categorias || []).map((c) => [c.id, c]));
}

function readTime(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function cardHtml(a, i, big = false) {
  const c = cats()[a.categoria] || { nombre: a.categoria, color: '#9d7bff' };
  const img = safeImage(a.portada);
  return `<a class="ncard${big ? ' ncard--big' : ''} reveal" style="--i:${i % 6};--c:${escapeHtml(c.color)}" href="#anuncios/${escapeHtml(a.id)}" data-route="anuncios" data-tilt>
    <span class="ncard__media">${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async">` : `<span class="ncard__ph">${icon('megaphone')}</span>`}</span>
    <span class="ncard__body">
      <span class="ncard__meta"><span class="cat-chip">${escapeHtml(c.nombre)}</span>${a.fijado ? `<span class="tag">${icon('star')} Fijado</span>` : ''}<time datetime="${escapeHtml(a.fecha)}">${escapeHtml(fmtDate(a.fecha))}</time></span>
      <strong class="ncard__title">${escapeHtml(a.titulo)}</strong>
      <span class="ncard__text">${escapeHtml(a.resumen || plainText(a.contenido, big ? 260 : 150))}</span>
      <span class="ncard__more">Leer anuncio ${icon('arrowRight')}</span>
    </span>
  </a>`;
}

function listHtml() {
  const all = list();
  const shown = all.filter((a) => !ui.cat || a.categoria === ui.cat);
  const used = [...new Set(all.map((a) => a.categoria))];
  const C = cats();
  if (!all.length) return emptyHTML('Todavía no hay anuncios. ¡Vuelve pronto!', 'megaphone');
  const [first, ...rest] = shown;
  return `<div class="filters reveal">
      <button class="chip-btn${!ui.cat ? ' is-active' : ''}" type="button" data-ncat="">Todos <small>${all.length}</small></button>
      ${used.map((k) => `<button class="chip-btn${ui.cat === k ? ' is-active' : ''}" type="button" data-ncat="${escapeHtml(k)}" style="--c:${escapeHtml(C[k]?.color || '#9d7bff')}">${escapeHtml(C[k]?.nombre || k)} <small>${all.filter((a) => a.categoria === k).length}</small></button>`).join('')}
    </div>
    ${first ? cardHtml(first, 0, true) : emptyHTML('No hay anuncios en esta categoría.')}
    ${rest.length ? `<div class="ngrid">${rest.map((a, i) => cardHtml(a, i + 1)).join('')}</div>` : ''}`;
}

function articleHtml(a) {
  const all = list();
  const idx = all.indexOf(a);
  const newer = all[idx - 1];
  const older = all[idx + 1];
  const c = cats()[a.categoria] || { nombre: a.categoria, color: '#9d7bff' };
  const img = safeImage(a.portada);
  return `<div class="container container--narrow">
    <p class="crumbs crumbs--back"><a href="#anuncios" data-route="anuncios">${icon('arrowLeft')} Todos los anuncios</a></p>
    <article class="article" style="--c:${escapeHtml(c.color)}">
      <header class="article__head reveal">
        <div class="article__meta"><span class="cat-chip">${escapeHtml(c.nombre)}</span><time datetime="${escapeHtml(a.fecha)}">${escapeHtml(fmtDate(a.fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</time><span>· ${readTime(a.contenido)} min de lectura</span></div>
        <h1 class="article__title"><span class="gusty" data-breeze>${escapeHtml(a.titulo)}</span></h1>
        ${a.resumen ? `<p class="article__lead">${escapeHtml(a.resumen)}</p>` : ''}
        <div class="article__by">${a.autor ? `<img src="https://mc-heads.net/avatar/${encodeURIComponent(a.autor)}/40" alt="" width="40" height="40"><span>Publicado por <b>${escapeHtml(a.autor)}</b></span>` : ''}<button class="btn btn--sm btn--ghost" type="button" data-share="${escapeHtml(a.id)}">${icon('link')} Copiar enlace</button></div>
      </header>
      ${img ? `<figure class="article__cover reveal"><img src="${escapeHtml(img)}" alt="" decoding="async"></figure>` : ''}
      <div class="md article__md reveal">${md(a.contenido, mdCtx())}</div>
    </article>
    <nav class="pager" aria-label="Más anuncios">
      ${older ? `<a class="pager__link pager__link--prev" href="#anuncios/${escapeHtml(older.id)}" data-route="anuncios"><small>${icon('arrowLeft')} Anterior</small><strong>${escapeHtml(older.titulo)}</strong></a>` : '<span></span>'}
      ${newer ? `<a class="pager__link pager__link--next" href="#anuncios/${escapeHtml(newer.id)}" data-route="anuncios"><small>Más reciente ${icon('arrowRight')}</small><strong>${escapeHtml(newer.titulo)}</strong></a>` : '<span></span>'}
    </nav>
  </div>`;
}

export function render(el, parts, ctx) {
  const a = find(parts[0]);
  if (parts[0] && !a) {
    el.innerHTML = `<div class="container">${pageHead({ crumbs: ['anuncios'], title: 'Anuncios' })}${emptyHTML('Ese anuncio ya no existe o se movió.', 'megaphone')}<p class="section-more"><a class="btn btn--ghost" href="#anuncios" data-route="anuncios">${icon('arrowLeft')} Ver todos</a></p></div>`;
    return;
  }
  if (a) {
    el.innerHTML = articleHtml(a);
    if (!ctx.changing) window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  el.innerHTML = `<div class="container">${pageHead({ crumbs: ['anuncios'], title: 'Anuncios', intro: S.sitio.anuncios.intro, icon: 'megaphone' })}<div id="n-list">${listHtml()}</div></div>`;
}

document.addEventListener('click', async (e) => {
  const c = e.target.closest?.('[data-ncat]');
  if (c) {
    ui.cat = c.dataset.ncat;
    const box = c.closest('#n-list');
    if (box) { box.innerHTML = listHtml(); box.querySelectorAll('.reveal').forEach((r) => r.classList.add('in')); }
    return;
  }
  const s = e.target.closest?.('[data-share]');
  if (s) {
    const url = `${location.origin}${location.pathname}#anuncios/${s.dataset.share}`;
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: document.title, url }); return; } catch {}
    }
    if (await copyText(url)) toast('Enlace del anuncio copiado', { type: 'success' });
  }
});

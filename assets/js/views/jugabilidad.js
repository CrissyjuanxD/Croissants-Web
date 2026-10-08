import { escapeHtml, icon, md, safeImage, visible, fmt } from '../core.js';
import { S, stageActive, stageKnown, currentDay, mobsList } from '../store.js';
import { pageHead, mdCtx, recipeCard, mobCard, CATEGORIAS, emptyHTML, liveBadge, missionChip } from '../components.js';
import { itemHtml, itemName, itemLabel, tooltipHtml, resolveRef, stripCodes, recipeTitle } from '../mc.js';
import { breeze } from '../fx.js';

const TABS = [
  { id: 'cambios', label: 'Cambios', icon: 'layers' },
  { id: 'dimensiones', label: 'Dimensiones', icon: 'portal' },
  { id: 'jefes', label: 'Jefes', icon: 'crown' },
  { id: 'mobs', label: 'Mobs', icon: 'skull' },
  { id: 'crafteos', label: 'Crafteos', icon: 'crafting' },
  { id: 'items', label: 'Items', icon: 'cube' },
];
const ETAPAS = { uno: 'Cambio Uno', extra: 'Cambio Extra', dos: 'Cambio Dos', tres: 'Cambio Tres' };
const ui = { crafteoEtapa: '', itemCat: '', q: '' };

export function title(parts) {
  const t = TABS.find((x) => x.id === parts[0]);
  return t ? t.label : '';
}

function stagesStrip() {
  const etapas = visible(S.sitio.jugabilidad.etapas);
  const day = currentDay();
  return `<div class="stages" id="stages-strip">${etapas.map((e) => {
    const on = stageActive(e.clave || e.id);
    return `<a class="stage-pill${on ? ' is-on' : ''}" style="--c:${escapeHtml(e.color)}" href="#jugabilidad/cambios/${escapeHtml(e.id)}" data-route="jugabilidad">
      <span class="stage-pill__day">Día ${e.dia}</span><strong>${escapeHtml(e.titulo)}</strong>${liveBadge(on, ['Activo', day && day < e.dia ? `Faltan ${e.dia - day} días` : 'Bloqueado'])}
    </a>`;
  }).join('')}</div>`;
}

function tabsHtml(current) {
  return `<nav class="subtabs" aria-label="Secciones de jugabilidad">${TABS.map((t) => `<a class="subtabs__link${t.id === current ? ' is-active' : ''}" href="#jugabilidad/${t.id}" data-route="jugabilidad"${t.id === current ? ' aria-current="page"' : ''}>${icon(t.icon)}<span>${t.label}</span></a>`).join('')}</nav>`;
}

// Tarjetas grandes (etapas, dimensiones, jefes) + el detalle de la elegida
function cardsWithDetail(list, current, kind, extra = () => '') {
  if (!list.length) return emptyHTML('Todavía no hay nada en esta sección.');
  const sel = list.find((x) => x.id === current) || list[0];
  return `<div class="bigcards">${list.map((x) => {
    const img = safeImage(x.imagen);
    return `<a class="bigcard${x.id === sel.id ? ' is-active' : ''} reveal" style="--c:${escapeHtml(x.color || '#9d7bff')}" href="#jugabilidad/${kind}/${escapeHtml(x.id)}" data-route="jugabilidad" data-tilt>
      <span class="bigcard__media">${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async">` : (x.bloque ? itemHtml({ vanilla: true, material: x.bloque, n: 1 }, { size: 56, tip: false }) : x.huevo ? itemHtml({ vanilla: true, material: x.huevo, n: 1 }, { size: 56, tip: false }) : `<span class="bigcard__icon">${icon(x.icono)}</span>`)}</span>
      <span class="bigcard__body"><span class="bigcard__meta">${x.dia ? `<span class="tag">${icon('calendar')} Día ${x.dia}</span>` : ''}${extra(x)}</span><strong>${escapeHtml(x.titulo)}</strong><span>${escapeHtml(x.resumen)}</span></span>
    </a>`;
  }).join('')}</div>
  <article class="detail" id="detalle">
    <header class="detail__head reveal" style="--c:${escapeHtml(sel.color || '#9d7bff')}">
      <span class="detail__icon">${icon(sel.icono)}</span>
      <div><p class="kicker">${escapeHtml(kind === 'cambios' ? 'cambio' : kind === 'jefes' ? 'jefe' : 'dimensión')}${sel.dia ? ` · día ${sel.dia}` : ''}</p><h2 class="detail__title" data-breeze-detail>${escapeHtml(sel.titulo)}</h2></div>
      <div class="detail__badges">${extra(sel)}</div>
    </header>
    ${sel.resumen ? `<p class="detail__lead reveal">${escapeHtml(sel.resumen)}</p>` : ''}
    <div class="md detail__md reveal">${md(sel.contenido, mdCtx())}</div>
    ${sel.imagenes?.length ? `<div class="gallery">${sel.imagenes.map((im) => { const src = safeImage(im.src); return src ? `<figure class="shot"><button class="shot__btn" type="button" data-zoom="${escapeHtml(src)}" data-zoom-title="${escapeHtml(im.titulo)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(im.titulo)}" loading="lazy"><span class="shot__zoom">${icon('eye')}</span></button>${im.titulo ? `<figcaption><strong>${escapeHtml(im.titulo)}</strong>${im.texto ? `<span>${escapeHtml(im.texto)}</span>` : ''}</figcaption>` : ''}</figure>` : ''; }).join('')}</div>` : ''}
  </article>`;
}

function stageExtra(e) {
  return liveBadge(stageActive(e.clave || e.id), ['Activo', 'Bloqueado']);
}

function bossExtra(j) {
  const parts = [];
  if (j.vida) parts.push(`<span class="tag">${icon('heart')} ${escapeHtml(j.vida)}</span>`);
  if (j.estado) parts.push(`<span class="tag">${escapeHtml(j.estado)}</span>`);
  return parts.join('');
}

function dimExtra(d) {
  const day = currentDay();
  return day ? liveBadge(day >= d.dia, ['Abierta', 'Bloqueada']) : '';
}

function crafteosHtml() {
  const recetas = visible(S.juego.recetas);
  const etapas = [...new Set(recetas.map((r) => r.etapa))];
  const list = recetas.filter((r) => !ui.crafteoEtapa || r.etapa === ui.crafteoEtapa);
  const groups = new Map();
  for (const r of list) {
    const k = r.etapa || 'otras';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  return `<div class="filters reveal">
      <button class="chip-btn${!ui.crafteoEtapa ? ' is-active' : ''}" type="button" data-cetapa="">Todas <small>${recetas.length}</small></button>
      ${etapas.map((e) => `<button class="chip-btn${ui.crafteoEtapa === e ? ' is-active' : ''}" type="button" data-cetapa="${escapeHtml(e)}">${escapeHtml(ETAPAS[e] || e || 'Otras')} <small>${recetas.filter((r) => r.etapa === e).length}</small></button>`).join('')}
    </div>
    <p class="hint">${icon('info')} Pasa el cursor (o toca) cualquier item para ver su nombre y su lore como en el juego.</p>
    ${[...groups].map(([k, rs]) => `<section class="rgroup">
      <h3 class="rgroup__title"><span>${escapeHtml(ETAPAS[k] || 'Otras recetas')}</span>${ETAPAS[k] ? liveBadge(stageActive(k), ['Disponible', 'Se habilita con el cambio']) : ''}</h3>
      <div class="recipes-grid">${rs.map((r) => recipeCard(r)).join('')}</div>
    </section>`).join('')}`;
}

function itemsHtml() {
  const entries = Object.entries(S.juego.items).filter(([, it]) => !it.oculto);
  const q = ui.q.trim().toLowerCase();
  const cats = Object.keys(CATEGORIAS).filter((c) => entries.some(([, it]) => it.categoria === c));
  const shown = entries.filter(([id, it]) => (!ui.itemCat || it.categoria === ui.itemCat)
    && (!q || `${id} ${itemLabel(it)} ${(it.lore || []).map(stripCodes).join(' ')} ${it.descripcion || ''}`.toLowerCase().includes(q)));
  const order = Object.keys(CATEGORIAS);
  const groups = new Map(order.map((k) => [k, []]));
  for (const [id, it] of shown) {
    const k = it.categoria && groups.has(it.categoria) ? it.categoria : 'utilidad';
    groups.get(k).push(id);
  }
  for (const [k, v] of groups) if (!v.length) groups.delete(k);
  return `<div class="items-toolbar reveal">
      <label class="search">${icon('search')}<input class="input" type="search" placeholder="Buscar un item…" value="${escapeHtml(ui.q)}" data-iq></label>
      <div class="filters">
        <button class="chip-btn${!ui.itemCat ? ' is-active' : ''}" type="button" data-icat="">Todos <small>${entries.length}</small></button>
        ${cats.map((c) => `<button class="chip-btn${ui.itemCat === c ? ' is-active' : ''}" type="button" data-icat="${c}">${escapeHtml(CATEGORIAS[c])} <small>${entries.filter(([, it]) => it.categoria === c).length}</small></button>`).join('')}
      </div>
    </div>
    <div id="items-results">${shown.length ? [...groups].map(([k, ids]) => `<section class="igroup">
      <h3 class="igroup__title">${escapeHtml(CATEGORIAS[k] || k)} <small>${ids.length}</small></h3>
      <div class="icards">${ids.map((id) => {
        const it = S.juego.items[id];
        return `<button class="icard" type="button" data-item="${escapeHtml(id)}">${itemHtml({ id }, { size: 44 })}<span class="icard__name">${escapeHtml(itemLabel(it))}</span></button>`;
      }).join('')}</div>
    </section>`).join('') : emptyHTML(`No hay items que coincidan con “${ui.q}”.`, 'search')}</div>`;
}

function mobsTab() {
  const mobs = mobsList();
  if (!mobs.length) return emptyHTML('Todavía no hay mobs cargados.');
  const groups = new Map();
  for (const m of mobs) {
    const k = m.etapa || 'otros';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(m);
  }
  const names = { uno: 'Desde el día 1 (Cambio Uno)', extra: 'Desde el día 14 (Cambio Extra)', dos: 'Warden Cave (Cambio Dos)', tres: 'End (Cambio Tres)', otros: 'Otros' };
  return [...groups].map(([k, list]) => `<section class="rgroup">
    <h3 class="rgroup__title"><span>${escapeHtml(names[k] || k)}</span>${ETAPAS[k] ? liveBadge(stageActive(k), ['Activo', 'Bloqueado']) : ''}</h3>
    <div class="mobs">${list.map(mobCard).join('')}</div>
  </section>`).join('');
}

function bodyHtml(tab, parts) {
  const j = S.sitio.jugabilidad;
  if (tab === 'cambios') return cardsWithDetail(visible(j.etapas), parts[1], 'cambios', stageExtra);
  if (tab === 'dimensiones') return cardsWithDetail(visible(j.dimensiones), parts[1], 'dimensiones', dimExtra);
  if (tab === 'jefes') return cardsWithDetail(visible(j.jefes).map((x) => ({ ...x, color: x.color || '#ff9db4' })), parts[1], 'jefes', bossExtra);
  if (tab === 'mobs') return mobsTab();
  if (tab === 'crafteos') return crafteosHtml();
  if (tab === 'items') return itemsHtml();
  return '';
}

export function render(el, parts, ctx) {
  const j = S.sitio.jugabilidad;
  const tab = TABS.some((t) => t.id === parts[0]) ? parts[0] : 'cambios';
  el.innerHTML = `<div class="container">
    ${pageHead({ crumbs: ['jugabilidad', tab], title: 'Cambios y Jugabilidad', intro: j.intro, extra: stagesStrip() })}
    ${tabsHtml(tab)}
    <div class="tabbody" data-tab="${tab}">${bodyHtml(tab, parts)}</div>
  </div>`;
  const sameTab = ctx.prev && ctx.prev[0] === parts[0];
  if (!ctx.changing && sameTab && ctx.prev[1] !== parts[1]) {
    el.querySelector('#detalle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = el.querySelector('[data-breeze-detail]');
    if (t) breeze(t, t.textContent);
  }
}

// Cuando el servidor activa un cambio se actualizan las etiquetas sin perder la posición
export function update(el, kind, parts) {
  if (kind !== 'estado') return;
  const strip = el.querySelector('#stages-strip');
  if (strip) strip.outerHTML = stagesStrip();
  const body = el.querySelector('.tabbody');
  const tab = body?.dataset.tab;
  if (tab && tab !== 'items') {
    body.innerHTML = bodyHtml(tab, parts || []);
    body.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal'));
  }
}

// ------------------------------------------------------------------ ficha de un item

export function openItem(modal, id) {
  const it = S.juego.items[id];
  if (!it) return;
  const recipes = visible(S.juego.recetas).filter((r) => refHas(r, id));
  const makes = recipes.filter((r) => r.resultado?.id === id);
  const uses = recipes.filter((r) => r.resultado?.id !== id);
  const missions = (S.juego.misiones || []).filter((m) => m.tipo !== 'extra' && (m.recompensas || []).flat().some((r) => r.id === id));
  modal.open(`<article class="item-modal">
    <header class="item-modal__head">
      <span class="item-modal__icon">${itemHtml({ id }, { size: 72, tip: false })}</span>
      <div class="mc-tooltip mc-tooltip--static">${tooltipHtml(it, { info: false })}</div>
    </header>
    ${it.descripcion ? `<p class="item-modal__desc"><b>Qué hace:</b> ${escapeHtml(it.descripcion)}</p>` : ''}
    ${it.origen ? `<p class="item-modal__desc"><b>De dónde sale:</b> ${escapeHtml(it.origen)}</p>` : ''}
    ${makes.length ? `<div class="item-modal__block"><p class="mlabel">${icon('crafting')} Cómo se hace</p><div class="recipes-grid recipes-grid--modal">${makes.map(recipeCard).join('')}</div></div>` : ''}
    ${uses.length ? `<div class="item-modal__block"><p class="mlabel">${icon('layers')} Se usa para</p><div class="chips">${uses.map((r) => { const res = resolveRef(r.resultado); return `<span class="chip">${itemHtml(r.resultado, { size: 20, count: false, tip: false })} ${escapeHtml(stripCodes(itemName(res.item)))} <small>· ${escapeHtml(recipeTitle(r))}</small></span>`; }).join('')}</div></div>` : ''}
    ${missions.length ? `<div class="item-modal__block"><p class="mlabel">${icon('scroll')} Recompensa de</p><div class="chips">${missions.map((m) => missionChip(m.n)).join('')}</div></div>` : ''}
  </article>`, { size: 'lg', label: stripCodes(itemName(it)) });
}

function refHas(r, id) {
  const refs = [r.resultado, r.entrada, r.plantilla, r.base, r.adicion, ...Object.values(r.ingredientes || {}), ...(r.lista || [])];
  return refs.some((x) => x && x.id === id);
}

// ------------------------------------------------------------------ eventos

document.addEventListener('click', (e) => {
  const ce = e.target.closest?.('[data-cetapa]');
  if (ce) {
    ui.crafteoEtapa = ce.dataset.cetapa;
    const body = ce.closest('.tabbody');
    if (body) { body.innerHTML = crafteosHtml(); body.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal')); }
    return;
  }
  const ic = e.target.closest?.('[data-icat]');
  if (ic) {
    ui.itemCat = ic.dataset.icat;
    const body = ic.closest('.tabbody');
    if (body) { body.innerHTML = itemsHtml(); body.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal')); }
    return;
  }
  const item = e.target.closest?.('[data-item]');
  if (item && !e.target.closest('.mc-item')) {
    import('../app.js').then((app) => openItem(app.modal, item.dataset.item));
  } else if (item) {
    // Tocar el ícono abre el tooltip; el resto de la tarjeta abre la ficha
  }
});

document.addEventListener('input', (e) => {
  const q = e.target.closest?.('[data-iq]');
  if (!q) return;
  ui.q = q.value;
  const res = q.closest('.tabbody')?.querySelector('#items-results');
  if (!res) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = itemsHtml();
  res.innerHTML = tmp.querySelector('#items-results').innerHTML;
});

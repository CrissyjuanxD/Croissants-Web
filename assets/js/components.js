// Piezas que se repiten en varias secciones y los componentes que se pueden poner dentro de los textos
// con atajos: [[item:id x16]], [[mision:12]], [[cmd:/menu]], [[receta:id]], [[trabajos]]...
import { escapeHtml, icon, md, safeImage, safeUrl, fmt, slugify, visible } from './core.js';
import { itemHtml, itemChipHtml, recipeHtml, legacyHtml, resolveRef, itemName, itemLabel, stripCodes } from './mc.js';
import { S, currentDay, stageActive, mission, missionTag, activeMissions, mobsList } from './store.js';

export const DIF = { facil: 'Fácil', media: 'Media', dificil: 'Difícil', muy_dificil: 'Muy difícil' };
export const TIPO = { normal: 'Misión', extra: 'Misión extra', trabajo: 'Misión de trabajo' };

export function pageHead({ crumbs = [], title, intro = '', extra = '', icon: ic = '' }) {
  return `<header class="page-head">
    <p class="crumbs">${['croissants', ...crumbs].map((c, i) => `<span${i === crumbs.length ? ' class="is-last"' : ''}>${escapeHtml(c)}</span>`).join('<i>/</i>')}</p>
    <h1 class="page-title">${ic ? `<span class="page-title__icon">${icon(ic)}</span>` : ''}<span class="gusty" data-breeze>${escapeHtml(title)}</span></h1>
    ${intro ? `<div class="page-intro md">${md(intro, mdCtx())}</div>` : ''}
    ${extra}
  </header>`;
}

export function emptyHTML(text, iconName = 'cloud') {
  return `<div class="empty">${icon(iconName)}<p>${escapeHtml(text)}</p></div>`;
}

export function imgSrc(src) {
  const s = safeImage(src);
  return s;
}

export function missionChip(n) {
  const m = mission(n);
  if (!m) return `<span class="tag">Misión ${escapeHtml(n)}</span>`;
  return `<a class="mission-chip mission-chip--${m.tipo}" href="#misiones/${m.n}" data-route="misiones"><b>${escapeHtml(missionTag(m))}</b>${escapeHtml(m.nombre)}</a>`;
}

export function cmdChip(cmd) {
  return `<code class="cmd" data-copy="${escapeHtml(cmd)}" title="Copiar">${escapeHtml(cmd)}</code>`;
}

// ------------------------------------------------------------------ contexto para el markdown

export function mdCtx(extra = {}) {
  return {
    inline(kind, arg) {
      if (kind === 'item') {
        const m = arg.match(/^(.+?)(?:\s+x(\d+))?$/);
        const id = m[1].trim();
        const n = m[2] ? Number(m[2]) : 1;
        return itemChipHtml(id.startsWith('minecraft:') ? { vanilla: true, material: id.slice(10), n } : { id, n });
      }
      if (kind === 'mision') return missionChip(arg);
      if (kind === 'cmd') return cmdChip(arg);
      if (kind === 'icono') return icon(arg, 'i--inline');
      if (kind === 'mc') return `<span class="mc-text">${legacyHtml(arg, { c: '#FFFFFF' })}</span>`;
      if (kind === 'dia') return `<span class="day-chip">${icon('calendar')}Día ${escapeHtml(arg)}</span>`;
      return null;
    },
    block(kind, arg) {
      switch (kind) {
        case 'receta': { const r = (S.juego?.recetas || []).find((x) => x.id === arg); return r ? `<div class="md-block">${recipeCard(r)}</div>` : null; }
        case 'recetas': return `<div class="md-block recipes-grid">${visible(S.juego?.recetas || []).filter((r) => !arg || r.etapa === arg).map(recipeCard).join('')}</div>`;
        case 'trabajos': return `<div class="md-block">${jobsHtml()}</div>`;
        case 'habilidades': return `<div class="md-block">${skillsHtml()}</div>`;
        case 'rangos': return `<div class="md-block">${ranksHtml()}</div>`;
        case 'pesca': return `<div class="md-block">${fishingHtml()}</div>`;
        case 'calendario': return `<div class="md-block">${calendarHtml()}</div>`;
        case 'menu': return `<div class="md-block">${menuGuiHtml()}</div>`;
        case 'items': return `<div class="md-block">${itemsGridHtml(arg)}</div>`;
        case 'mobs': return `<div class="md-block">${mobsHtml(arg)}</div>`;
        case 'ip': return `<div class="md-block">${ipCardsHtml()}</div>`;
        default: return null;
      }
    },
    ...extra,
  };
}

// ------------------------------------------------------------------ recetas

export function recipeCard(r) {
  const res = resolveRef(r.resultado);
  const name = res ? itemLabel(res.item) : r.id;
  return `<article class="recipe-card" id="receta-${escapeHtml(r.id)}">
    <header class="recipe-card__head">${itemHtml(r.resultado, { size: 30, count: false })}<div><h3>${escapeHtml(name)}</h3>${r.nota ? `<p>${escapeHtml(r.nota)}</p>` : ''}</div></header>
    ${recipeHtml(r, { size: 44 })}
  </article>`;
}

// ------------------------------------------------------------------ trabajos

const XP_NIVEL = (n) => Math.round(25 + 20 * Math.pow(n, 1.15));
const MONEDAS_NIVEL = (n) => Math.min(5, Math.floor((n - 1) / 20) + 1);
const BONUS = (n) => (n % 5 === 0 ? Math.round(5 + n / 2) : 0);

export function jobsHtml() {
  const jobs = S.juego?.trabajos || [];
  if (!jobs.length) return '';
  let totalCoins = 0;
  for (let n = 1; n <= 100; n++) totalCoins += MONEDAS_NIVEL(n) + BONUS(n);
  const milestones = [5, 10, 25, 50, 75, 100].map((n) => {
    let xp = 0;
    for (let k = 1; k <= n; k++) xp += XP_NIVEL(k);
    return { n, xp, coins: MONEDAS_NIVEL(n) + BONUS(n) };
  });
  return `<div class="jobs">
    <div class="jobs__grid">${jobs.map((j) => `<article class="job" style="--c:${escapeHtml(j.color)}">
      <header class="job__head">${itemHtml({ vanilla: true, material: j.item, n: 1 }, { size: 34, tip: false })}<div><h3>${escapeHtml(j.icono)} ${escapeHtml(j.nombre)}</h3><p>${escapeHtml(j.descripcion)}</p></div></header>
      <ul class="job__xp">${j.fuentes.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
    </article>`).join('')}</div>
    <div class="jobs__table md"><div class="table-wrap"><table><thead><tr><th>Nivel</th><th>XP total</th><th>DinoCoins al subir</th></tr></thead><tbody>${milestones.map((m) => `<tr><td>${m.n}</td><td>${fmt(m.xp)}</td><td>${m.coins}${BONUS(m.n) ? ` <small class="muted">(incluye bonus de ${BONUS(m.n)})</small>` : ''}</td></tr>`).join('')}</tbody></table></div>
    <p class="jobs__note">Un trabajo completo (nivel 100) da unas <b>${fmt(totalCoins)} DinoCoins</b>, más las misiones de trabajo.</p></div>
  </div>`;
}

// ------------------------------------------------------------------ habilidades

export function skillsHtml() {
  const skills = S.juego?.habilidades || [];
  if (!skills.length) return '';
  const costs = S.juego?.costosHabilidad || [];
  return `<div class="skills">
    ${skills.map((s) => `<article class="skill" style="--c:${escapeHtml(s.color)}">
      <header class="skill__head"><span class="skill__icon">${icon(s.icono)}</span><h3>${escapeHtml(s.nombre)}</h3></header>
      <ol class="skill__levels">${s.niveles.map((t, i) => `<li><span class="skill__lvl">${i + 1}</span><span>${escapeHtml(t)}</span></li>`).join('')}</ol>
    </article>`).join('')}
    ${costs.length ? `<div class="skills__costs md"><div class="table-wrap"><table><thead><tr><th>Nivel</th><th>Experiencia</th><th>Bloques</th><th>DinoCoins</th></tr></thead><tbody>${costs.map((c, i) => `<tr><td>${i + 1}</td><td>${c.xp} niveles</td><td><span class="cost-item">${itemHtml({ vanilla: true, material: c.bloque, n: 1 }, { size: 22, count: false })} ${c.cantidad} ${escapeHtml(c.nombre)}</span></td><td>${c.dinocoins}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
  </div>`;
}

// ------------------------------------------------------------------ rangos

export function ranksHtml() {
  const ranks = (S.juego?.rangos || []).filter((r) => !r.oculto);
  if (!ranks.length) return '';
  return `<div class="ranks">${ranks.map((r) => `<div class="rank" style="--c:${escapeHtml(r.color)}">
    <span class="rank__tag">${legacyHtml(r.prefijo || r.nombre, { c: r.color })}</span>
    <div><strong>${escapeHtml(r.nombre)}</strong><p>${escapeHtml(r.como)}</p></div>
  </div>`).join('')}</div>`;
}

export function rankOf(id) {
  const ranks = S.juego?.rangos || [];
  return ranks.find((r) => r.id.toLowerCase() === String(id || '').toLowerCase()) || ranks.find((r) => r.id === 'ZMiembro') || null;
}

// ------------------------------------------------------------------ pesca

export function fishingHtml() {
  const prizes = S.juego?.pesca || [];
  if (!prizes.length) return '';
  return `<div class="md"><div class="table-wrap"><table><thead><tr><th>Premio</th><th>Rareza</th><th>Pesca buena</th><th>Pesca perfecta</th><th>Pescadería</th></tr></thead><tbody>${prizes.map((p) => `<tr><td><span class="cost-item">${itemHtml({ id: p.id }, { size: 26, count: false })} ${escapeHtml(stripCodes(itemName(resolveRef({ id: p.id })?.item || { material: 'barrier' })))}</span></td><td><span class="rarity rarity--${slugify(p.rareza)}">${escapeHtml(p.rareza)}</span></td><td>${escapeHtml(p.buena)}</td><td>${escapeHtml(p.perfecta)}</td><td><b>${p.cambio}</b> = 1 DinoCoin</td></tr>`).join('')}</tbody></table></div></div>`;
}

// ------------------------------------------------------------------ calendario

export function calendarHtml() {
  const cal = S.sitio?.inicio?.calendario || [];
  if (!cal.length) return '';
  const day = currentDay();
  return `<ol class="timeline">${cal.map((c, i) => {
    const state = day >= c.dia ? 'is-done' : (i === cal.findIndex((x) => day < x.dia) ? 'is-next' : '');
    return `<li class="timeline__item ${state}"><span class="timeline__dot">${icon(c.icono || 'flag')}</span><div><span class="timeline__day">Día ${c.dia}</span><strong>${escapeHtml(c.titulo)}</strong>${c.texto ? `<p>${escapeHtml(c.texto)}</p>` : ''}</div></li>`;
  }).join('')}</ol>`;
}

// ------------------------------------------------------------------ /menu

export function menuGuiHtml() {
  const zones = [
    { n: 'Misiones', c: '#c9a7eb', slots: [1, 2, 3, 10, 11, 12, 19, 20, 21], icon: 'scroll' },
    { n: 'Trabajos', c: '#c8a27c', slots: [5, 6, 7, 14, 15, 16, 23, 24, 25], icon: 'pickaxe' },
    { n: 'Habilidades', c: '#9fd3ff', slots: [27, 28, 29, 36, 37, 38, 45, 46, 47], icon: 'star' },
    { n: 'Homes', c: '#8ff0b8', slots: [39, 40, 41, 48, 49, 50], icon: 'home' },
    { n: 'Protecciones', c: '#ffd27a', slots: [33, 34, 35, 42, 43, 44, 51, 52, 53], icon: 'shield' },
  ];
  const owner = new Map();
  zones.forEach((z) => z.slots.forEach((s) => owner.set(s, z)));
  const cells = [];
  for (let s = 0; s < 54; s++) {
    const z = owner.get(s);
    const first = z && z.slots[Math.floor(z.slots.length / 2)] === s;
    cells.push(`<span class="gui-cell${z ? ' is-zone' : ''}" style="${z ? `--c:${z.c}` : ''}">${first ? `<span class="gui-cell__label">${icon(z.icon)}<b>${z.n}</b></span>` : ''}</span>`);
  }
  return `<figure class="gui-mock"><div class="gui-mock__grid">${cells.join('')}</div><figcaption>Así se reparte el menú de <code>/menu</code>: haz clic en cualquier parte de una zona para abrirla.</figcaption></figure>`;
}

// ------------------------------------------------------------------ items por categoría

export const CATEGORIAS = {
  economia: 'Economía', mochilas: 'Mochilas', consumibles: 'Comida, bebidas y pociones', amuletos: 'Tótems y amuletos',
  armas: 'Armas y herramientas', utilidad: 'Utilidad', libros: 'Libros', warden: 'Warden Cave', end: 'End', pesca: 'Pesca',
};

export function itemsGridHtml(cat) {
  const items = Object.entries(S.juego?.items || {}).filter(([, it]) => !it.oculto && (!cat || it.categoria === cat));
  if (!items.length) return emptyHTML('No hay items en esta categoría.');
  return `<div class="items-grid">${items.map(([id]) => `<div class="items-grid__cell">${itemHtml({ id }, { size: 40 })}</div>`).join('')}</div>`;
}

// ------------------------------------------------------------------ mobs

export function mobsHtml(etapa) {
  const mobs = mobsList().filter((m) => !etapa || m.etapa === etapa);
  if (!mobs.length) return '';
  return `<div class="mobs">${mobs.map((m) => mobCard(m)).join('')}</div>`;
}

export function mobCard(m) {
  const img = imgSrc(m.imagen);
  const media = img ? `<img class="mob__img" src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async">`
    : m.huevo ? itemHtml({ vanilla: true, material: m.huevo, n: 1 }, { size: 44, tip: false }) : icon('skull');
  return `<article class="mob" style="--c:${escapeHtml(m.color)}">
    <div class="mob__media">${media}</div>
    <div class="mob__body">
      <h4>${escapeHtml(m.nombre)}</h4>
      <div class="mob__meta">${m.vida ? `<span class="tag">${icon('heart')} ${escapeHtml(m.vida)}</span>` : ''}${m.donde ? `<span class="tag">${icon('map')} ${escapeHtml(m.donde)}</span>` : ''}</div>
      <p>${escapeHtml(m.texto)}</p>
    </div>
  </article>`;
}

// ------------------------------------------------------------------ IP

export function ipValue(kind) {
  const g = S.sitio?.general;
  if (!g) return '';
  if (kind === 'bedrock') return g.ipBedrock || g.ipJava;
  return g.puertoJava ? `${g.ipJava}:${g.puertoJava}` : g.ipJava;
}

export function ipCardsHtml() {
  const g = S.sitio?.general;
  if (!g) return '';
  const st = S.status;
  return `<div class="ip-cards">
    <div class="ip-card">
      <div class="ip-card__head"><span class="ip-card__icon">${icon('cube')}</span><div><strong>Java Edition</strong><small>Versión ${escapeHtml(g.versionJava || '—')}</small></div></div>
      <button class="ip-card__value" type="button" data-copy-ip="java"><span class="mono">${escapeHtml(ipValue('java') || '—')}</span>${icon('copy')}</button>
    </div>
    <div class="ip-card">
      <div class="ip-card__head"><span class="ip-card__icon ip-card__icon--bedrock">${icon('gamepad')}</span><div><strong>Bedrock Edition</strong><small>${escapeHtml(g.versionBedrock || 'Móvil, consola y Windows')}</small></div></div>
      <button class="ip-card__value" type="button" data-copy-ip="bedrock"><span class="mono">${escapeHtml(ipValue('bedrock') || '—')}</span>${icon('copy')}</button>
      <button class="ip-card__port" type="button" data-copy-ip="puerto"><span>Puerto</span><span class="mono">${escapeHtml(g.puertoBedrock || '19132')}</span>${icon('copy')}</button>
    </div>
    <p class="ip-cards__status">${st ? (st.online ? `<span class="live-dot"></span> En línea · <b>${fmt(st.jugadores)}</b> de ${fmt(st.max)} jugadores` : `<span class="live-dot is-off"></span> Ahora mismo el servidor está apagado`) : `<span class="live-dot is-wait"></span> Consultando el servidor…`}</p>
  </div>`;
}

export function socialLinks(redes, cls = 'social-btn') {
  const TYPES = { twitch: 'Twitch', youtube: 'YouTube', tiktok: 'TikTok', x: 'X', instagram: 'Instagram', discord: 'Discord', kick: 'Kick' };
  return Object.entries(redes || {}).map(([k, url]) => {
    const href = safeUrl(url);
    if (!href) return '';
    return `<a class="${cls} ${cls}--${k}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${TYPES[k] || k} de ${escapeHtml(S.sitio?.general?.anfitrion || 'Crosszy')}" title="${TYPES[k] || k}">${icon(k)}</a>`;
  }).join('');
}

export function liveBadge(on, labels = ['Activo', 'Próximamente']) {
  return on ? `<span class="state state--on"><span class="live-dot"></span>${labels[0]}</span>` : `<span class="state state--off">${icon('lock')}${labels[1]}</span>`;
}

export function stageBadge(clave) {
  return liveBadge(stageActive(clave), ['Activo', 'Bloqueado']);
}

export function missionsUnlockedCount(tipo) {
  const act = activeMissions();
  return (S.juego?.misiones || []).filter((m) => m.tipo === tipo && act.has(m.n)).length;
}

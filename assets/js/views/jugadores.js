import { escapeHtml, icon, md, fmt, fmt1, ago, fmtDate, hours } from '../core.js';
import { S, players, onlineNames, liveReady, activeMissions, missionTag } from '../store.js';
import { pageHead, mdCtx, rankOf, emptyHTML } from '../components.js';
import { legacyHtml, itemHtml } from '../mc.js';
import { countUp } from '../fx.js';

const ui = { q: '', filtro: 'todos', orden: 'misiones' };
const JOBS = { guerrero: 'Guerrero', mineria: 'Minería', lenador: 'Leñador', constructor: 'Constructor', granjero: 'Granjero', pescador: 'Pescador' };

export function title(parts) {
  return parts[0] ? decodeURIComponent(parts[0]) : '';
}

const head = (p, size = 64) => `https://mc-heads.net/avatar/${encodeURIComponent(p.uuid && !p.bedrock ? p.uuid : p.nombre)}/${size}`;
const body = (p) => `https://mc-heads.net/body/${encodeURIComponent(p.uuid && !p.bedrock ? p.uuid : p.nombre)}/240`;
const nMisiones = (p) => (Array.isArray(p.misiones) ? p.misiones.length : 0);

function rankTag(p) {
  const r = rankOf(p.rango);
  if (!r) return '';
  return `<span class="rank-tag" style="--c:${escapeHtml(r.color)}">${legacyHtml(r.prefijo || r.nombre, { c: r.color })}</span>`;
}

function sortList(list) {
  const by = {
    misiones: (a, b) => nMisiones(b) - nMisiones(a),
    dinocoins: (a, b) => (b.dinocoins || 0) - (a.dinocoins || 0),
    horas: (a, b) => (b.horas || 0) - (a.horas || 0),
    nombre: (a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'),
    reciente: (a, b) => (Date.parse(b.ultimaVez || 0) || 0) - (Date.parse(a.ultimaVez || 0) || 0),
  }[ui.orden];
  return [...list].sort((a, b) => (b.online - a.online) || by(a, b));
}

function summaryHtml(list) {
  const st = S.status;
  const online = st?.online ? st.jugadores : list.filter((p) => p.online).length;
  const total = list.length;
  const horas = list.reduce((s, p) => s + (Number(p.horas) || 0), 0);
  const mis = list.reduce((s, p) => s + nMisiones(p), 0);
  const tiles = [
    { label: 'Conectados ahora', value: online, icon: 'wifi', live: true },
    { label: 'Jugadores registrados', value: total, icon: 'users' },
    { label: 'Horas jugadas en total', value: Math.round(horas), icon: 'clock' },
    { label: 'Misiones completadas', value: mis, icon: 'scroll' },
  ];
  return `<div class="ptiles">${tiles.map((t) => `<div class="ptile reveal"><span class="ptile__icon">${icon(t.icon)}</span><span class="ptile__num" data-count-to="${t.value}">${fmt(t.value)}</span><span class="ptile__label">${t.live ? '<span class="live-dot"></span>' : ''}${t.label}</span></div>`).join('')}</div>`;
}

function leaderboard(list, key, labelFn, iconName, titleText) {
  const top = [...list].sort((a, b) => key(b) - key(a)).filter((p) => key(p) > 0).slice(0, 5);
  return `<div class="board reveal"><p class="board__title">${icon(iconName)} ${titleText}</p>${top.length ? `<ol class="board__list">${top.map((p, i) => `<li><a href="#jugadores/${encodeURIComponent(p.nombre)}" data-route="jugadores"><span class="board__pos board__pos--${i + 1}">${i + 1}</span><img src="${head(p, 32)}" alt="" width="32" height="32" loading="lazy"><span class="board__name">${escapeHtml(p.nombre)}</span><b>${labelFn(p)}</b></a></li>`).join('')}</ol>` : '<p class="board__empty">Todavía no hay datos.</p>'}</div>`;
}

function cardHtml(p) {
  const job = p.trabajo?.activo;
  const lvl = job ? p.trabajo?.niveles?.[job]?.nivel ?? 0 : 0;
  return `<a class="pcard reveal${p.online ? ' is-online' : ''}" href="#jugadores/${encodeURIComponent(p.nombre)}" data-route="jugadores" data-tilt>
    <span class="pcard__head"><img src="${head(p, 72)}" alt="" width="72" height="72" loading="lazy" decoding="async">${p.online ? '<span class="pcard__dot" title="Conectado"></span>' : ''}</span>
    <span class="pcard__body">
      <span class="pcard__name">${escapeHtml(p.nombre)}${p.bedrock ? ' <span class="tag tag--xs">Bedrock</span>' : ''}</span>
      ${rankTag(p)}
      <span class="pcard__stats">
        <span title="Misiones completadas">${icon('scroll')} ${nMisiones(p)}</span>
        <span title="DinoCoins">${itemHtml({ id: 'dinocoins', n: 1 }, { size: 16, count: false, tip: false })} ${fmt(p.dinocoins || 0)}</span>
        <span title="Horas jugadas">${icon('clock')} ${hours(p.horas)}</span>
      </span>
      ${job ? `<span class="pcard__job">${escapeHtml(JOBS[job] || job)} · nivel ${lvl}</span>` : '<span class="pcard__job muted">Sin trabajo</span>'}
    </span>
  </a>`;
}

function gridHtml(list) {
  const q = ui.q.trim().toLowerCase();
  const shown = sortList(list.filter((p) => (ui.filtro !== 'online' || p.online) && (!q || String(p.nombre).toLowerCase().includes(q))));
  if (!shown.length) return emptyHTML(q ? `No hay jugadores que se llamen “${ui.q}”.` : 'No hay jugadores conectados justo ahora.', 'users');
  return `<div class="pgrid">${shown.map(cardHtml).join('')}</div>`;
}

function onlineOnlyHtml() {
  const names = onlineNames();
  const st = S.status;
  return `<div class="nodata reveal">
    <span class="nodata__icon">${icon('server')}</span>
    <h2>Las estadísticas llegan desde el servidor</h2>
    <p>En cuanto el servidor se conecte con la web vas a ver aquí a todos los que jugaron, con sus misiones, DinoCoins, trabajos, habilidades y horas jugadas, actualizado en vivo.</p>
    ${st?.online ? `<p class="nodata__online"><span class="live-dot"></span> Ahora mismo hay <b>${fmt(st.jugadores)}</b> ${st.jugadores === 1 ? 'jugador conectado' : 'jugadores conectados'}.</p>` : ''}
    ${names.length ? `<div class="heads">${names.map((n) => `<span class="head" title="${escapeHtml(n)}"><img src="https://mc-heads.net/avatar/${encodeURIComponent(n)}/48" alt="${escapeHtml(n)}" width="48" height="48" loading="lazy"></span>`).join('')}</div>` : ''}
  </div>`;
}

function listView() {
  const list = players();
  const intro = S.sitio.jugadores.intro;
  const sync = S.sync?.generado ? `<span class="pill is-live"><span class="live-dot"></span> Datos del servidor · ${ago(new Date(S.sync.generado).toISOString())}</span>` : '';
  if (!liveReady() || !list.length) {
    return `<div class="container">${pageHead({ crumbs: ['jugadores'], title: 'Jugadores', intro })}${onlineOnlyHtml()}</div>`;
  }
  return `<div class="container">
    ${pageHead({ crumbs: ['jugadores'], title: 'Jugadores', intro, extra: `<div class="sync-line" id="p-sync">${sync}</div>` })}
    <div id="p-summary">${summaryHtml(list)}</div>
    <div class="boards" id="p-boards">
      ${leaderboard(list, nMisiones, (p) => `${nMisiones(p)}`, 'scroll', 'Más misiones')}
      ${leaderboard(list, (p) => p.dinocoins || 0, (p) => fmt(p.dinocoins || 0), 'coin', 'Más DinoCoins')}
      ${leaderboard(list, (p) => p.horas || 0, (p) => hours(p.horas), 'clock', 'Más horas jugadas')}
    </div>
    <div class="ptoolbar reveal">
      <label class="search">${icon('search')}<input class="input" type="search" placeholder="Buscar jugador…" value="${escapeHtml(ui.q)}" data-pq></label>
      <div class="seg" role="tablist">
        <button class="seg__btn${ui.filtro === 'todos' ? ' is-active' : ''}" type="button" data-pf="todos">${icon('users')}<span>Todos</span></button>
        <button class="seg__btn${ui.filtro === 'online' ? ' is-active' : ''}" type="button" data-pf="online">${icon('wifi')}<span>Conectados</span></button>
      </div>
      <select class="input select" data-po aria-label="Ordenar por">
        ${[['misiones', 'Más misiones'], ['dinocoins', 'Más DinoCoins'], ['horas', 'Más horas'], ['reciente', 'Vistos hace poco'], ['nombre', 'Nombre']].map(([k, v]) => `<option value="${k}"${ui.orden === k ? ' selected' : ''}>${v}</option>`).join('')}
      </select>
    </div>
    <div id="p-grid">${gridHtml(list)}</div>
  </div>`;
}

// ------------------------------------------------------------------ perfil

function missionsMap(p) {
  const done = new Set(Array.isArray(p.misiones) ? p.misiones : []);
  const act = activeMissions();
  const all = S.juego.misiones || [];
  const groups = [
    { t: 'Misiones', list: all.filter((m) => m.tipo === 'normal'), c: 'normal' },
    { t: 'Extra', list: all.filter((m) => m.tipo === 'extra').sort((a, b) => a.padre - b.padre), c: 'extra' },
    { t: 'Trabajo', list: all.filter((m) => m.tipo === 'trabajo'), c: 'trabajo' },
  ];
  return groups.map((g) => {
    const n = g.list.filter((m) => done.has(m.n)).length;
    return `<div class="mmap mmap--${g.c}">
      <div class="mmap__head"><strong>${g.t}</strong><span>${n}/${g.list.length}</span></div>
      <div class="bar"><span style="width:${g.list.length ? (n / g.list.length) * 100 : 0}%"></span></div>
      <div class="mmap__grid">${g.list.map((m) => `<a class="mmap__cell${done.has(m.n) ? ' is-done' : act.has(m.n) ? ' is-open' : ''}" href="#misiones/${m.n}" data-route="misiones" title="${escapeHtml(`${missionTag(m)} · ${done.has(m.n) ? m.nombre + ' (completada)' : act.has(m.n) ? m.nombre : 'Bloqueada'}`)}">${g.c === 'extra' ? m.padre : g.c === 'trabajo' ? ((m.n - 141) % 10 + 1) * 10 : m.n}</a>`).join('')}</div>
    </div>`;
  }).join('');
}

function jobsBlock(p) {
  const niveles = p.trabajo?.niveles || {};
  const active = p.trabajo?.activo;
  const jobs = S.juego.trabajos || [];
  return `<div class="pjobs">${jobs.map((j) => {
    const d = niveles[j.id] || {};
    const lvl = Number(d.nivel) || 0;
    return `<div class="pjob${j.id === active ? ' is-active' : ''}" style="--c:${escapeHtml(j.color)}">
      ${itemHtml({ vanilla: true, material: j.item, n: 1 }, { size: 28, tip: false })}
      <div class="pjob__body"><div class="pjob__top"><strong>${escapeHtml(j.nombre)}</strong>${j.id === active ? '<span class="tag tag--xs">Actual</span>' : ''}<span class="pjob__lvl">Nivel ${lvl}</span></div><div class="bar"><span style="width:${lvl}%"></span></div></div>
    </div>`;
  }).join('')}</div>`;
}

function skillsBlock(p) {
  const h = p.habilidades || {};
  const skills = S.juego.habilidades || [];
  return `<div class="pskills">${skills.map((s) => {
    const lvl = Number(h[s.id]) || 0;
    return `<div class="pskill" style="--c:${escapeHtml(s.color)}"><span class="pskill__icon">${icon(s.icono)}</span><div><strong>${escapeHtml(s.nombre)}</strong><div class="pips">${Array.from({ length: 8 }, (_, i) => `<span class="pip${i < lvl ? ' is-on' : ''}"></span>`).join('')}</div></div><b>${lvl}/8</b></div>`;
  }).join('')}</div>`;
}

const STAT_LABELS = [
  ['muertes', 'Muertes', 'skull', (v) => fmt(v)],
  ['mobs', 'Mobs matados', 'sword', (v) => fmt(v)],
  ['jugadores', 'Jugadores matados', 'target', (v) => fmt(v)],
  ['bloquesRotos', 'Bloques rotos', 'pickaxe', (v) => fmt(v)],
  ['bloquesColocados', 'Bloques colocados', 'cube', (v) => fmt(v)],
  ['distancia', 'Distancia recorrida', 'route', (v) => `${fmt1(v)} km`],
  ['pesca', 'Peces pescados', 'fish', (v) => fmt(v)],
  ['aldeanos', 'Tradeos con aldeanos', 'coin', (v) => fmt(v)],
  ['saltos', 'Saltos', 'arrowUp', (v) => fmt(v)],
  ['homes', 'Homes guardadas', 'home', (v) => `${fmt(v)}/10`],
];

function profileView(name) {
  const list = players();
  const p = list.find((x) => String(x.nombre).toLowerCase() === name.toLowerCase());
  if (!p) {
    const online = onlineNames().find((n) => n.toLowerCase() === name.toLowerCase());
    return `<div class="container">${pageHead({ crumbs: ['jugadores', name], title: name })}
      <div class="nodata">${online ? `<span class="nodata__icon"><img src="https://mc-heads.net/avatar/${encodeURIComponent(online)}/64" alt="" width="64" height="64"></span><h2>${escapeHtml(online)} está conectado</h2><p>Sus estadísticas aparecen cuando el servidor manda la próxima actualización.</p>`
        : `<span class="nodata__icon">${icon('user')}</span><h2>No encontramos a “${escapeHtml(name)}”</h2><p>Puede que todavía no haya entrado al servidor o que los datos no hayan llegado.</p>`}
      <a class="btn btn--ghost" href="#jugadores" data-route="jugadores">${icon('arrowLeft')} Volver a jugadores</a></div></div>`;
  }
  const stats = p.stats || {};
  const r = rankOf(p.rango);
  return `<div class="container">
    <p class="crumbs crumbs--back"><a href="#jugadores" data-route="jugadores">${icon('arrowLeft')} Jugadores</a></p>
    <section class="profile reveal" style="--c:${escapeHtml(r?.color || '#9d7bff')}">
      <div class="profile__skin"><img src="${body(p)}" alt="Skin de ${escapeHtml(p.nombre)}" loading="lazy" decoding="async"></div>
      <div class="profile__main">
        <div class="profile__top">
          <h1 class="profile__name"><span class="gusty">${escapeHtml(p.nombre)}</span></h1>
          ${p.online ? '<span class="state state--on"><span class="live-dot"></span>Conectado</span>' : `<span class="state state--off">${icon('clock')} ${p.ultimaVez ? `Visto ${ago(p.ultimaVez)}` : 'Desconectado'}</span>`}
        </div>
        <div class="profile__tags">${rankTag(p)}${p.bedrock ? '<span class="tag">Bedrock</span>' : '<span class="tag">Java</span>'}${p.primeraVez ? `<span class="tag">${icon('calendar')} Desde el ${escapeHtml(fmtDate(p.primeraVez))}</span>` : ''}</div>
        <div class="profile__tiles">
          <div class="ptile"><span class="ptile__icon">${icon('scroll')}</span><span class="ptile__num">${nMisiones(p)}</span><span class="ptile__label">Misiones</span></div>
          <div class="ptile"><span class="ptile__icon">${itemHtml({ id: 'dinocoins', n: 1 }, { size: 22, count: false, tip: false })}</span><span class="ptile__num">${fmt(p.dinocoins || 0)}</span><span class="ptile__label">DinoCoins</span></div>
          <div class="ptile"><span class="ptile__icon">${itemHtml({ id: 'dinofichas', n: 1 }, { size: 22, count: false, tip: false })}</span><span class="ptile__num">${fmt(p.dinofichas || 0)}</span><span class="ptile__label">DinoFichas</span></div>
          <div class="ptile"><span class="ptile__icon">${icon('clock')}</span><span class="ptile__num">${hours(p.horas)}</span><span class="ptile__label">Jugadas</span></div>
        </div>
        <p class="profile__note">${icon('info')} Las DinoCoins y DinoFichas son las que tiene guardadas en sus monederos.</p>
      </div>
    </section>
    <div class="profile-grid">
      <section class="panel reveal"><h2 class="panel__title">${icon('scroll')} Misiones</h2>${missionsMap(p)}</section>
      <section class="panel reveal"><h2 class="panel__title">${icon('pickaxe')} Trabajos</h2>${jobsBlock(p)}<h2 class="panel__title panel__title--mt">${icon('star')} Habilidades</h2>${skillsBlock(p)}</section>
      <section class="panel reveal"><h2 class="panel__title">${icon('signal')} Estadísticas</h2>
        <ul class="pstats">${STAT_LABELS.filter(([k]) => stats[k] != null || (k === 'homes' && p.homes != null)).map(([k, label, ic, f]) => `<li><span>${icon(ic)} ${label}</span><b>${f(k === 'homes' ? p.homes : stats[k])}</b></li>`).join('') || '<li class="muted">Sin estadísticas todavía.</li>'}</ul>
      </section>
    </div>
  </div>`;
}

export function render(el, parts) {
  const name = parts[0] ? decodeURIComponent(parts[0]) : '';
  el.innerHTML = name ? profileView(name) : listView();
  el.querySelectorAll('[data-count-to]').forEach((n) => countUp(n, Number(n.dataset.countTo), { format: (v) => fmt(v) }));
}

export function update(el, kind, parts) {
  if (kind === 'sync') return;
  const name = parts?.[0] ? decodeURIComponent(parts[0]) : '';
  const y = window.scrollY;
  if (name) {
    el.innerHTML = profileView(name);
  } else if (el.querySelector('#p-grid') && liveReady()) {
    const list = players();
    el.querySelector('#p-summary').innerHTML = summaryHtml(list);
    el.querySelector('#p-grid').innerHTML = gridHtml(list);
    const sync = el.querySelector('#p-sync');
    if (sync && S.sync?.generado) sync.innerHTML = `<span class="pill is-live"><span class="live-dot"></span> Datos del servidor · ${ago(new Date(S.sync.generado).toISOString())}</span>`;
    if (kind === 'jugadores') {
      el.querySelector('#p-boards').innerHTML = `${leaderboard(list, nMisiones, (p) => `${nMisiones(p)}`, 'scroll', 'Más misiones')}${leaderboard(list, (p) => p.dinocoins || 0, (p) => fmt(p.dinocoins || 0), 'coin', 'Más DinoCoins')}${leaderboard(list, (p) => p.horas || 0, (p) => hours(p.horas), 'clock', 'Más horas jugadas')}`;
    }
  } else {
    el.innerHTML = listView();
  }
  el.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal'));
  window.scrollTo({ top: y });
}

document.addEventListener('input', (e) => {
  const q = e.target.closest?.('[data-pq]');
  if (!q) return;
  ui.q = q.value;
  const grid = q.closest('.view')?.querySelector('#p-grid');
  if (grid) { grid.innerHTML = gridHtml(players()); grid.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal')); }
});

document.addEventListener('click', (e) => {
  const f = e.target.closest?.('[data-pf]');
  if (!f) return;
  ui.filtro = f.dataset.pf;
  const view = f.closest('.view');
  view.querySelectorAll('[data-pf]').forEach((b) => b.classList.toggle('is-active', b === f));
  const grid = view.querySelector('#p-grid');
  if (grid) { grid.innerHTML = gridHtml(players()); grid.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal')); }
});

document.addEventListener('change', (e) => {
  const o = e.target.closest?.('[data-po]');
  if (!o) return;
  ui.orden = o.value;
  const grid = o.closest('.view')?.querySelector('#p-grid');
  if (grid) { grid.innerHTML = gridHtml(players()); grid.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal')); }
});

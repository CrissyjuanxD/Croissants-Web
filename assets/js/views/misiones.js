import { escapeHtml, icon, md, fmt, ago, visible } from '../core.js';
import { S, activeMissions, currentDay, mission, missionTag, missionToken, completedBy, players, hasLiveMissions, liveReady } from '../store.js';
import { pageHead, mdCtx, DIF, TIPO, cmdChip } from '../components.js';
import { chestHtml, rewardChest, itemHtml } from '../mc.js';

const TABS = [
  { id: 'todas', label: 'Todas', icon: 'grid' },
  { id: 'normal', label: 'Misiones', icon: 'scroll' },
  { id: 'extra', label: 'Misiones Extra', icon: 'sparkle' },
  { id: 'trabajo', label: 'Misiones de Trabajo', icon: 'pickaxe' },
];
const JOBS = { 141: 'Guerrero', 151: 'Minería', 161: 'Leñador', 171: 'Constructor', 181: 'Granjero', 191: 'Pescador' };
const ui = { tab: 'todas', estado: 'todas', dificultad: '', q: '' };
let lastModal = null;

export function title(parts) {
  const m = parts[0] && mission(parts[0]);
  return m ? `${missionTag(m)} ${m.nombre}` : '';
}

const isOpen = (m, act) => act.has(m.n);
const showLocked = () => Boolean(S.sitio?.misiones?.mostrarBloqueadas);

function syncLine() {
  const day = currentDay();
  const act = activeMissions();
  const n = (S.juego?.misiones || []).filter((m) => act.has(m.n)).length;
  const gen = S.sync?.generado ? ago(new Date(S.sync.generado).toISOString()) : '';
  return `<div class="sync-line">
    <span class="pill">${icon('calendar')} ${day ? `Día ${day}` : 'Antes del día 1'}</span>
    <span class="pill">${icon('unlock')} ${n} de ${(S.juego?.misiones || []).length} abiertas</span>
    ${hasLiveMissions() ? `<span class="pill is-live"><span class="live-dot"></span> En vivo desde el servidor${gen ? ` · ${gen}` : ''}</span>`
      : `<span class="pill">${icon('info')} ${liveReady() ? 'El servidor no mandó las misiones activas' : 'Se abrirán solas cuando el servidor se conecte'}</span>`}
  </div>`;
}

function card(m, act) {
  const open = isOpen(m, act);
  const locked = !open && !showLocked();
  const done = liveReady() ? completedBy(m.n) : 0;
  const job = m.tipo === 'trabajo' ? jobOf(m) : '';
  return `<button class="mcard mcard--${m.tipo}${open ? '' : ' is-locked'} reveal" type="button" data-mission="${m.n}">
    <span class="mcard__top">
      <span class="mcard__tag">${escapeHtml(missionTag(m))}</span>
      ${open ? `<span class="mcard__diff mcard__diff--${m.dificultad}">${escapeHtml(DIF[m.dificultad])}</span>` : `<span class="mcard__lock">${icon('lock')}</span>`}
    </span>
    <span class="mcard__name">${locked ? 'Misión bloqueada' : escapeHtml(m.nombre)}</span>
    <span class="mcard__desc">${locked ? `Se desbloquea el día ${m.dia}.` : escapeHtml(m.descripcion)}</span>
    <span class="mcard__foot">
      <span class="mcard__coins">${itemHtml({ id: 'dinocoins', n: 1 }, { size: 20, count: false, tip: false })}<b>${locked ? '??' : m.dinocoins}</b></span>
      ${job ? `<span class="mcard__job">${escapeHtml(job)}</span>` : ''}
      ${open && done ? `<span class="mcard__done">${icon('check')} ${done}</span>` : ''}
      ${!open ? `<span class="mcard__day">${icon('calendar')} Día ${m.dia}</span>` : ''}
    </span>
  </button>`;
}

function jobOf(m) {
  const base = Math.floor((m.n - 141) / 10) * 10 + 141;
  return JOBS[base] || '';
}

function filtered(list, act) {
  const q = ui.q.trim().toLowerCase();
  return list.filter((m) => {
    if (ui.estado === 'abiertas' && !isOpen(m, act)) return false;
    if (ui.estado === 'bloqueadas' && isOpen(m, act)) return false;
    if (ui.dificultad && m.dificultad !== ui.dificultad) return false;
    if (q) {
      const open = isOpen(m, act) || showLocked();
      const text = `${m.n} ${missionTag(m)} ${open ? `${m.nombre} ${m.descripcion}` : ''}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

function sectionHtml(tipo, act) {
  const all = visible(S.juego.misiones).filter((m) => m.tipo === tipo);
  const sorted = tipo === 'extra' ? [...all].sort((a, b) => a.padre - b.padre || a.n - b.n) : all;
  const list = filtered(sorted, act);
  const opened = all.filter((m) => act.has(m.n)).length;
  const label = TABS.find((t) => t.id === tipo).label;
  const info = {
    normal: 'Una por día: la misión N se abre el día N. Al completarla recibes una Ficha de Misión para abrir tu cofre en la Estatua de Recompensas del spawn.',
    extra: 'Salen junto con la misión normal de su día. Pagan sus DinoCoins directo a tu monedero, sin ficha ni cofre.',
    trabajo: 'Siempre activas: piden llegar a los niveles 10, 20… 100 de cada trabajo. Dan ficha para la Estatua de Recompensas.',
  }[tipo];
  return `<section class="msec msec--${tipo}" id="sec-${tipo}">
    <header class="msec__head reveal">
      <div><h2 class="msec__title"><span class="msec__dot"></span>${escapeHtml(label)}</h2><p>${escapeHtml(info)}</p></div>
      <span class="msec__count"><b>${opened}</b>/${all.length} abiertas</span>
    </header>
    ${list.length ? `<div class="mgrid">${list.map((m) => card(m, act)).join('')}</div>` : `<p class="msec__empty">Ninguna misión de esta sección coincide con el filtro.</p>`}
  </section>`;
}

function listHtml() {
  const act = activeMissions();
  const tipos = ui.tab === 'todas' ? ['normal', 'extra', 'trabajo'] : [ui.tab];
  return tipos.map((t) => sectionHtml(t, act)).join('');
}

export function render(el, parts, ctx) {
  const intro = S.sitio.misiones.intro;
  el.innerHTML = `<div class="container">
    ${pageHead({ crumbs: ['misiones'], title: 'Misiones', intro, extra: `<div id="m-sync">${syncLine()}</div>` })}
    <div class="mtoolbar reveal">
      <div class="seg" role="tablist" aria-label="Tipo de misión">${TABS.map((t) => `<button class="seg__btn${ui.tab === t.id ? ' is-active' : ''}" type="button" role="tab" aria-selected="${ui.tab === t.id}" data-mtab="${t.id}">${icon(t.icon)}<span>${t.label}</span></button>`).join('')}</div>
      <div class="mtoolbar__filters">
        <label class="search">${icon('search')}<input class="input" type="search" placeholder="Buscar por nombre o número…" value="${escapeHtml(ui.q)}" data-mq></label>
        <select class="input select" data-mestado aria-label="Estado">
          <option value="todas"${ui.estado === 'todas' ? ' selected' : ''}>Todas</option>
          <option value="abiertas"${ui.estado === 'abiertas' ? ' selected' : ''}>Abiertas</option>
          <option value="bloqueadas"${ui.estado === 'bloqueadas' ? ' selected' : ''}>Bloqueadas</option>
        </select>
        <select class="input select" data-mdif aria-label="Dificultad">
          <option value="">Toda dificultad</option>
          ${Object.entries(DIF).map(([k, v]) => `<option value="${k}"${ui.dificultad === k ? ' selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="m-list">${listHtml()}</div>
    ${S.sitio.misiones.notas ? `<aside class="mnotes md reveal">${md(S.sitio.misiones.notas, mdCtx())}</aside>` : ''}
  </div>`;
  const n = Number(parts[0]);
  if (n && mission(n)) openMission(ctx.modal, n);
  else if (lastModal && ctx.modal.isOpen && lastModal === ctx.modal.content.querySelector('.mission-modal')) ctx.modal.close();
}

function refreshList(el) {
  const box = el.querySelector('#m-list');
  if (!box) return;
  box.innerHTML = listHtml();
  box.querySelectorAll('.reveal').forEach((r) => r.classList.remove('reveal'));
}

export function update(el, kind) {
  if (kind === 'estado' || kind === 'jugadores' || kind === 'sync') {
    const s = el.querySelector('#m-sync');
    if (s) s.innerHTML = syncLine();
    refreshList(el);
  }
}

// ------------------------------------------------------------------ ventana de una misión

function rewardsHtml(m) {
  if (m.tipo === 'extra') {
    return `<div class="mreward mreward--extra">
      ${itemHtml({ id: 'dinocoins', n: m.dinocoins }, { size: 48 })}
      <div><strong>${m.dinocoins} DinoCoins</strong><p>Las misiones extra pagan directo a tu monedero (lo que no entra va al inventario). No dan ficha ni cofre.</p></div>
    </div>`;
  }
  const { bottles } = rewardChest(m);
  const items = (m.recompensas || []).flat();
  return `<div class="mreward">
    <div class="mreward__list">
      <div class="mreward__row">${itemHtml({ id: 'dinocoins', n: m.dinocoins }, { size: 40 })}<span><b>${m.dinocoins}</b> DinoCoins</span></div>
      ${items.map((r) => `<div class="mreward__row">${itemHtml(r, { size: 40 })}<span data-mc-name></span></div>`).join('')}
      <div class="mreward__row">${itemHtml({ vanilla: true, material: 'experience_bottle', n: 1 }, { size: 40, count: false })}<span><b>${bottles}</b> botellas de experiencia</span></div>
    </div>
    <div class="mreward__chest">${chestHtml(m, { size: 38 })}</div>
  </div>
  <p class="mreward__how">${icon('info')}<span>Al completarla recibes una <b>Ficha de Misión</b>: dale clic derecho con ella a la <b>Estatua de Recompensas</b> del spawn para abrir este cofre.</span></p>`;
}

function whoHtml(m) {
  if (!liveReady()) return '';
  const who = players().filter((p) => Array.isArray(p.misiones) && p.misiones.includes(m.n));
  if (!who.length) return `<p class="mwho__empty">${icon('target')} Todavía nadie la completó. ¡Puedes ser el primero!</p>`;
  return `<div class="mwho"><p class="mwho__title">${icon('check')} Completada por ${who.length} ${who.length === 1 ? 'jugador' : 'jugadores'}</p>
    <div class="heads heads--sm">${who.slice(0, 24).map((p) => `<a class="head" href="#jugadores/${encodeURIComponent(p.nombre)}" data-route="jugadores" data-close title="${escapeHtml(p.nombre)}"><img src="https://mc-heads.net/avatar/${encodeURIComponent(p.uuid || p.nombre)}/40" alt="${escapeHtml(p.nombre)}" width="40" height="40" loading="lazy"></a>`).join('')}${who.length > 24 ? `<span class="head head--more">+${who.length - 24}</span>` : ''}</div></div>`;
}

export function openMission(modal, n) {
  const m = mission(n);
  if (!m) return;
  const act = activeMissions();
  const open = act.has(m.n);
  const reveal = open || showLocked();
  const job = m.tipo === 'trabajo' ? jobOf(m) : '';
  const body = reveal ? `
      <p class="mission-modal__desc">${escapeHtml(m.descripcion)}</p>
      ${m.objetivos.length ? `<div class="mobjs"><p class="mlabel">${icon('target')} Objetivos</p><ul>${m.objetivos.map((o) => `<li><span class="mobjs__check">${o.formato === 'flag' ? icon('check') : ''}</span><span>${escapeHtml(o.texto)}</span>${o.formato !== 'flag' ? `<b>${o.formato === 'time' ? time(o.meta) : fmt(o.meta)}</b>` : ''}</li>`).join('')}</ul></div>` : ''}
      ${m.nota ? `<div class="md mission-modal__note">${md(m.nota, mdCtx())}</div>` : ''}
      <div class="mrewards"><p class="mlabel">${icon('gift')} Recompensa</p>${rewardsHtml(m)}</div>
      <p class="mission-modal__cmd">${icon('terminal')} En los comandos se escribe ${cmdChip(missionToken(m))}</p>
      ${whoHtml(m)}`
    : `<div class="mission-modal__locked">${icon('lock')}<p>Esta misión todavía está bloqueada.</p><p class="muted">${m.dia ? `Se desbloquea el <b>día ${m.dia}</b>.` : ''} Vuelve cuando el servidor la active: esta página se actualiza sola.</p></div>`;
  const c = modal.open(`
    <article class="mission-modal mission-modal--${m.tipo}${open ? '' : ' is-locked'}">
      <header class="mission-modal__head">
        <div class="mission-modal__tags">
          <span class="mtype mtype--${m.tipo}">${escapeHtml(TIPO[m.tipo])}</span>
          <span class="tag">${escapeHtml(missionTag(m))}</span>
          ${job ? `<span class="tag">${escapeHtml(job)}</span>` : ''}
          ${reveal ? `<span class="mcard__diff mcard__diff--${m.dificultad}">${escapeHtml(DIF[m.dificultad])}</span>` : ''}
          ${open ? '<span class="state state--on"><span class="live-dot"></span>Abierta</span>' : '<span class="state state--off">Bloqueada</span>'}
        </div>
        <h2 class="mission-modal__title" id="modal-title">${reveal ? escapeHtml(m.nombre) : 'Misión bloqueada'}</h2>
        <p class="mission-modal__meta">${m.tipo === 'trabajo' ? 'Siempre activa' : `Día ${m.dia}`} · ${reveal ? `${m.dinocoins} DinoCoins` : '?? DinoCoins'}</p>
      </header>
      ${body}
    </article>`, { size: 'lg', onClose: () => { if (location.hash.startsWith(`#misiones/${m.n}`)) history.replaceState(null, '', '#misiones'); } });
  lastModal = c.querySelector('.mission-modal');
  c.querySelectorAll('[data-mc-name]').forEach((span) => {
    const it = span.previousElementSibling;
    span.textContent = it?.getAttribute('aria-label') || '';
  });
}

function time(s) {
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`;
  return `${Math.floor(s / 60)} min`;
}

// ------------------------------------------------------------------ eventos

document.addEventListener('click', (e) => {
  const tab = e.target.closest?.('[data-mtab]');
  if (tab) {
    ui.tab = tab.dataset.mtab;
    const el = tab.closest('.view');
    el.querySelectorAll('[data-mtab]').forEach((b) => { const on = b === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
    refreshList(el);
    return;
  }
  const card = e.target.closest?.('[data-mission]');
  if (card) {
    const n = card.dataset.mission;
    history.pushState(null, '', `#misiones/${n}`);
    import('../app.js').then((app) => openMission(app.modal, Number(n)));
  }
});

document.addEventListener('input', (e) => {
  const q = e.target.closest?.('[data-mq]');
  if (!q) return;
  ui.q = q.value;
  refreshList(q.closest('.view'));
});

document.addEventListener('change', (e) => {
  const st = e.target.closest?.('[data-mestado]');
  const df = e.target.closest?.('[data-mdif]');
  if (!st && !df) return;
  if (st) ui.estado = st.value;
  if (df) ui.dificultad = df.value;
  refreshList(e.target.closest('.view'));
});

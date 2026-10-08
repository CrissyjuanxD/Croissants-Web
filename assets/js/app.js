import { CONFIG } from './config.js';
import { normalizeSitio, normalizeJuego, normalizeAnuncios, mergeCatalog, escapeHtml, icon, hydrateIcons, safeUrl, fmt } from './core.js';
import { setGameData, bindTooltips } from './mc.js';
import { startWind, startPhotos } from './wind.js';
import * as fx from './fx.js';
import { createModal, toast, copyText } from './ui.js';
import * as live from './live.js';
import { S } from './store.js';
import { ipCardsHtml, ipValue, socialLinks } from './components.js';
import * as inicio from './views/inicio.js';
import * as guia from './views/guia.js';
import * as misiones from './views/misiones.js';
import * as jugabilidad from './views/jugabilidad.js';
import * as jugadores from './views/jugadores.js';
import * as anuncios from './views/anuncios.js';
import * as launcher from './views/launcher.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

document.documentElement.classList.add('js');
hydrateIcons();

const VIEWS = { inicio, guia, misiones, jugabilidad, jugadores, anuncios, launcher };
const ALIASES = { '': 'inicio', home: 'inicio', cambios: 'jugabilidad', crafteos: 'jugabilidad', ip: 'inicio' };
const TITLES = { inicio: '', guia: 'Guía', misiones: 'Misiones', jugabilidad: 'Cambios y Jugabilidad', jugadores: 'Jugadores', anuncios: 'Anuncios', launcher: 'Launcher' };
const BASE_TITLE = document.title;

S.preview = new URLSearchParams(location.search).has('preview');
export const modal = createModal();
const boot = fx.bootScreen();
const wind = startWind($('#bg-wind'));
const photos = startPhotos($('#bg-photos'), []);
fx.startGusts();
fx.bindTilt(document);
fx.cursorGlow();
fx.watchScrollHints();
bindTooltips(document);
bindChrome();
$('#year').textContent = String(new Date().getFullYear());

const stamps = { sitio: '', juego: '', anuncios: '' };

if (S.preview) startPreview();
else load({ live: true });

async function fetchDoc(path) {
  const res = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function load({ live: liveMode }) {
  try {
    const [sitio, juego, ans] = await Promise.all([fetchDoc(CONFIG.docs.sitio), fetchDoc(CONFIG.docs.juego), fetchDoc(CONFIG.docs.anuncios)]);
    apply({ sitio, juego, anuncios: ans });
    if (liveMode) {
      startLive();
      startContentUpdates();
    }
  } catch (err) {
    console.error('[croissants] no se pudo cargar el contenido', err);
    showLoadError();
  } finally {
    boot.done();
  }
}

function apply({ sitio, juego, anuncios: ans }, { quiet = false } = {}) {
  if (sitio) { S.sitio = normalizeSitio(sitio); stamps.sitio = S.sitio.meta.updatedAt; }
  if (juego) { S.juegoRaw = juego; rebuildJuego(); stamps.juego = S.juego.meta.updatedAt; }
  if (ans) { S.anuncios = normalizeAnuncios(ans); stamps.anuncios = S.anuncios.meta.updatedAt; }
  renderChrome();
  if (!S.route.view) route({ initial: true });
  else rerender(quiet);
}

// Los datos del juego que ve la web: data/juego.json (lo del panel) con el catálogo que sube el plugin encima
function rebuildJuego() {
  if (!S.juegoRaw) return;
  S.juego = normalizeJuego(mergeCatalog(S.juegoRaw, S.catalogo));
  setGameData(S.juego);
}

function startContentUpdates() {
  let last = Date.now();
  const check = async () => {
    last = Date.now();
    try {
      const [sitio, juego, ans] = await Promise.all([fetchDoc(CONFIG.docs.sitio), fetchDoc(CONFIG.docs.juego), fetchDoc(CONFIG.docs.anuncios)]);
      const changed = (sitio?.meta?.updatedAt || '') !== stamps.sitio || (juego?.meta?.updatedAt || '') !== stamps.juego || (ans?.meta?.updatedAt || '') !== stamps.anuncios;
      if (changed) {
        apply({ sitio, juego, anuncios: ans }, { quiet: true });
        toast('La web se actualizó con contenido nuevo', { type: 'success' });
      }
    } catch {}
  };
  setInterval(() => { if (!document.hidden) check(); }, 90000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - last > 30000) check(); });
}

function startPreview() {
  $('#preview-bar').hidden = false;
  document.documentElement.classList.add('is-preview');
  let got = false;
  try {
    const bc = new BroadcastChannel(`croissants-preview:${CONFIG.owner}/${CONFIG.repo}`);
    bc.onmessage = (e) => {
      const d = e.data;
      if (!d || d.type !== 'content') return;
      const first = !got;
      got = true;
      apply({ sitio: d.sitio, juego: d.juego, anuncios: d.anuncios }, { quiet: !first });
      if (first) { boot.done(); startLive(); }
    };
    bc.postMessage({ type: 'hello' });
  } catch {}
  setTimeout(() => {
    if (got) return;
    $('#preview-text').textContent = 'Vista previa: abre el panel de administración en otra pestaña para ver tus cambios en vivo.';
    load({ live: true });
  }, 1600);
}

// ------------------------------------------------------------------ datos en vivo

let liveStarted = false;
function startLive() {
  if (liveStarted || !S.sitio) return;
  liveStarted = true;
  live.on('status', (s) => { S.status = s; renderStatus(); notify('status'); });
  live.on('estado', (e) => { S.estado = e; notify('estado'); });
  live.on('jugadores', (j) => { S.jugadores = j; notify('jugadores'); });
  live.on('catalogo', (c) => { S.catalogo = c; rebuildJuego(); notify('juego'); });
  live.on('sync', (info) => { S.sync = { ...S.sync, ...info }; notify('sync'); });
  const g = S.sitio.general;
  live.start({ ipJava: g.ipJava, puertoJava: g.puertoJava, live: g.live });
}

let notifyTimer = 0;
const pendingKinds = new Set();
function notify(kind) {
  pendingKinds.add(kind);
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    const kinds = [...pendingKinds];
    pendingKinds.clear();
    // El catálogo cambió (items, misiones, crafteos...): se vuelve a dibujar la sección entera
    if (kinds.includes('juego')) {
      if (S.route.view) rerender(true);
      return;
    }
    const v = VIEWS[S.route.view];
    const el = viewEl(S.route.view);
    for (const k of kinds) v?.update?.(el, k, S.route.parts);
    refreshOpenModal(kinds);
  }, 120);
}

function refreshOpenModal(kinds) {
  const box = modal.content.querySelector('[data-live-modal]');
  if (!box) return;
  if (box.dataset.liveModal === 'ip' && kinds.includes('status')) box.innerHTML = ipCardsHtml();
}

function renderStatus() {
  const s = S.status;
  const el = $('#ip-btn-status');
  if (!el) return;
  if (!s) return;
  el.innerHTML = s.online
    ? `<span class="live-dot"></span><span>${fmt(s.jugadores)} conectados</span>`
    : `<span class="live-dot is-off"></span><span>Servidor apagado</span>`;
}

// ------------------------------------------------------------------ marco (cabecera, pie)

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

function renderChrome() {
  const c = S.sitio;
  if (!c) return;
  $$('[data-bind]').forEach((el) => {
    const v = getPath(c, el.dataset.bind);
    const text = typeof v === 'string' ? v : '';
    el.textContent = text;
    if (el.tagName === 'P') el.hidden = !text;
  });
  const socials = socialLinks(c.general.redes);
  $('#header-socials').innerHTML = socials;
  $('#mobile-socials').innerHTML = socialLinks(c.general.redes, 'social-btn social-btn--lg');
  $('#footer-socials').innerHTML = socials;
  $('#footer-ip-java').textContent = ipValue('java') || '—';
  $('#footer-ip-bedrock').textContent = ipValue('bedrock') || '—';
  $('#footer-host').textContent = `Servidor de ${c.general.anfitrion}`;
  $('#footer-credit').textContent = c.general.creditos || 'CrissyjuanxD';
  const vic = c.general.viciont;
  const vicLinks = [
    ['Web del estudio', vic.url, 'globe'],
    ['Viciont Studios Launcher', c.general.launcherUrl, 'download'],
    ['Discord', vic.discord, 'discord'],
    ['YouTube', vic.youtube, 'youtube'],
    ['X', vic.x, 'x'],
  ].filter(([, u]) => safeUrl(u));
  $('#footer-viciont').innerHTML = vicLinks.map(([t, u, ic]) => `<li><a href="${escapeHtml(safeUrl(u))}" target="_blank" rel="noopener noreferrer">${icon(ic)} ${escapeHtml(t)}</a></li>`).join('');
  const band = $('#viciont-band');
  if (band && safeUrl(vic.url)) band.href = safeUrl(vic.url);
  photos.set((c.general.fondos || []).map((f) => f.src).filter(Boolean));
  const news = (S.anuncios?.anuncios || []).filter((a) => !a.oculto);
  const fresh = news.filter((a) => Date.now() - new Date(a.fecha).getTime() < 7 * 86400000).length;
  const badge = $('#nav-news');
  badge.hidden = !fresh;
  badge.textContent = String(fresh);
  fx.observeReveals(document.querySelector('.footer'), { instant: false });
}

// ------------------------------------------------------------------ rutas

function viewEl(name) {
  return $(`.view[data-view="${name}"]`);
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const parts = raw.split('/').filter(Boolean);
  let view = (parts.shift() || '').toLowerCase();
  view = ALIASES[view] ?? view;
  if (!VIEWS[view]) view = 'inicio';
  return { view, parts };
}

function updateTitle() {
  const t = TITLES[S.route.view];
  const sub = VIEWS[S.route.view]?.title?.(S.route.parts);
  document.title = t ? `${sub ? `${sub} · ` : ''}${t} · Croissants` : BASE_TITLE;
}

function route({ initial = false } = {}) {
  if (!S.sitio || !S.juego) return;
  const next = parseHash();
  const changing = next.view !== S.route.view;
  if (changing && modal.isOpen) modal.close(true);
  const apply = () => {
    const prev = S.route;
    S.route = next;
    document.documentElement.dataset.view = next.view;
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === next.view));
    $$('[data-route]').forEach((a) => {
      const on = a.dataset.route === next.view;
      a.classList.toggle('is-active', on);
      if (a.matches('.nav__link, .mobile-menu__link')) {
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    });
    const el = viewEl(next.view);
    const v = VIEWS[next.view];
    const sameView = prev.view === next.view;
    if (next.view === 'jugadores' || next.view === 'misiones') live.wantPlayers();
    v.render(el, next.parts, { changing, initial, prev: sameView ? prev.parts : null, modal });
    wind.setIntensity(next.view === 'inicio' ? 1 : 0.75);
    updateTitle();
    if (changing) {
      fx.observeReveals(el, { instant: false });
      el.querySelectorAll('[data-breeze]').forEach((s) => fx.breeze(s, s.textContent));
    } else {
      fx.observeReveals(el, { instant: true });
    }
    if (changing && !initial) window.scrollTo({ top: 0, behavior: 'instant' });
    closeMenu();
  };
  if (changing && !initial && S.route.view) fx.windTransition(apply);
  else apply();
}

function rerender(quiet) {
  const el = viewEl(S.route.view);
  VIEWS[S.route.view]?.render(el, S.route.parts, { changing: false, initial: false, prev: S.route.parts, modal, quiet });
  fx.observeReveals(el, { instant: true });
  updateTitle();
}

export function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function showLoadError() {
  const msg = location.protocol === 'file:'
    ? 'Abre la web desde un servidor (GitHub Pages o Cloudflare Pages) para cargar el contenido.'
    : 'No se pudo cargar el contenido. Revisa tu conexión e inténtalo de nuevo.';
  const el = viewEl('inicio');
  el.classList.add('is-active');
  el.innerHTML = `<div class="container page"><div class="empty">${icon('alert')}<p>${escapeHtml(msg)}</p><button class="btn btn--sm" type="button" data-retry>Reintentar</button></div></div>`;
}

// ------------------------------------------------------------------ ventana de la IP

export function openIp() {
  if (!S.sitio) return;
  const g = S.sitio.general;
  modal.open(`
    <div class="ip-modal">
      <div class="ip-modal__head">
        <img src="assets/img/logo-segunda-760.png" alt="${escapeHtml(g.nombre)} ${escapeHtml(g.edicion)}" width="760" height="205">
        <p class="kicker">${icon('server')} Cómo entrar</p>
        <h2 class="ip-modal__title" id="modal-title">IP del servidor</h2>
        <p class="ip-modal__text">Con el <b>Viciont Studios Launcher</b> no necesitas la IP: abres la instancia Croissants y entras directo. Si juegas sin el launcher, copia la IP de tu versión y agrégala en <b>Multijugador → Agregar servidor</b>.</p>
      </div>
      <div data-live-modal="ip">${ipCardsHtml()}</div>
      <a class="ip-modal__launcher" href="#launcher" data-route="launcher" data-close>
        <img src="assets/img/viciont-launcher.png" alt="" width="64" height="64">
        <span><strong>Juega con Viciont Studios Launcher</strong><small>Entra directo al servidor, sin IP, con el modpack, las texturas y el chat de voz listos.</small></span>
        ${icon('arrowRight')}
      </a>
    </div>`, { size: 'lg', label: 'IP del servidor' });
}

async function copyIp(kind) {
  const g = S.sitio?.general;
  if (!g) return;
  const value = kind === 'puerto' ? (g.puertoBedrock || '19132') : ipValue(kind);
  if (!value) return;
  if (await copyText(value)) toast(kind === 'puerto' ? `Puerto ${value} copiado` : `IP ${kind === 'bedrock' ? 'de Bedrock' : 'de Java'} copiada: ${value}`, { type: 'success' });
}

// ------------------------------------------------------------------ menú y eventos

function openMenu() {
  const m = $('#mobile-menu');
  m.hidden = false;
  requestAnimationFrame(() => m.classList.add('is-open'));
  const t = $('#menu-toggle');
  t.setAttribute('aria-expanded', 'true');
  t.setAttribute('aria-label', 'Cerrar menú');
  document.documentElement.classList.add('is-menu-open');
}

function closeMenu() {
  const m = $('#mobile-menu');
  if (m.hidden) return;
  m.classList.remove('is-open');
  const t = $('#menu-toggle');
  t.setAttribute('aria-expanded', 'false');
  t.setAttribute('aria-label', 'Abrir menú');
  document.documentElement.classList.remove('is-menu-open');
  setTimeout(() => { if (!m.classList.contains('is-open')) m.hidden = true; }, 380);
}

function bindChrome() {
  window.addEventListener('hashchange', () => route());

  document.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('[data-open-ip]')) { e.preventDefault(); closeMenu(); openIp(); return; }
    const ip = t.closest('[data-copy-ip]');
    if (ip) { e.preventDefault(); copyIp(ip.dataset.copyIp); return; }
    const cp = t.closest('[data-copy]');
    if (cp) { e.preventDefault(); if (await copyText(cp.dataset.copy)) toast(`Copiado: ${cp.dataset.copy}`, { type: 'success' }); return; }
    const routeLink = t.closest('a[data-route]');
    if (routeLink) {
      if (routeLink.hasAttribute('data-close')) modal.close();
      if (routeLink.getAttribute('href') === location.hash) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenu();
      }
      return;
    }
    const zoom = t.closest('[data-zoom]');
    if (zoom) {
      modal.open(`<figure class="zoom-view"><img src="${escapeHtml(zoom.dataset.zoom)}" alt="${escapeHtml(zoom.dataset.zoomTitle || '')}">${zoom.dataset.zoomTitle ? `<figcaption>${escapeHtml(zoom.dataset.zoomTitle)}</figcaption>` : ''}</figure>`, { size: 'xl', label: zoom.dataset.zoomTitle || 'Imagen' });
      return;
    }
    if (t.closest('[data-retry]')) { location.reload(); return; }
    if (t.closest('#to-top')) window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#menu-toggle').addEventListener('click', () => ($('#mobile-menu').hidden ? openMenu() : closeMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  matchMedia('(min-width: 1121px)').addEventListener('change', (e) => { if (e.matches) closeMenu(); });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      $('#header').classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

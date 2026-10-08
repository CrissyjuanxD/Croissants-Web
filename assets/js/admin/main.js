// Panel de administración de Croissants: edita data/sitio.json, data/juego.json y data/anuncios.json y sube las
// imágenes al repositorio con la API de GitHub. Lo del juego (items, misiones, crafteos, trabajos, habilidades y mobs)
// lo manda el plugin; aquí solo se agrega lo que es de la web.
import { CONFIG } from '../config.js';
import {
  normalizeJuego, mergeCatalog, escapeHtml, safeUrl, safeImage, icon, hydrateIcons, slugify, deepClone, md, ICON_NAMES,
} from '../core.js';
import { GitHubClient, explainError } from '../github.js';
import { createModal, toast, confirmDialog, copyText } from '../ui.js';
import { setGameData, bindTooltips, itemChipHtml, legacyHtml, itemHtml, itemLabel } from '../mc.js';
import {
  S, REPO_KEY, SITE_ROOT, DOCS, DOC_NAME, NORMALIZE, INVALID, getAt, setAt, docOf, same, game, imgSrc, resolveAsset,
  readValue, processImage, addPending, fmtKB, fmtDateTime, getPath, ensureIconList,
} from './kit.js';
import { TABS, LISTS, TEMPLATES, render, routeFor, itemPreview, historyHtml } from './tabs.js';
import { pruebaLocal, GitHubPrueba } from './mock.js';

// El panel nunca debe mostrarse dentro de otra página (protección contra clickjacking)
(() => {
  let framed = false;
  try { framed = window.top !== window.self && window.top.location.origin !== location.origin; } catch { framed = true; }
  if (framed) {
    document.documentElement.innerHTML = '';
    throw new Error('El panel no se puede mostrar dentro de otra página.');
  }
})();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = escapeHtml;

hydrateIcons();

const TOKEN_KEY = `croissants-admin-token:${REPO_KEY}`;
const DRAFT_KEY = `draft:${REPO_KEY}`;
const UPLOADS_KEY = `uploads:${REPO_KEY}`;
const DOCK_KEY = `croissants-admin-dock:${REPO_KEY}`;
let token = '';

const modal = createModal();
const channel = (() => {
  try { return new BroadcastChannel(`croissants-preview:${CONFIG.owner}/${CONFIG.repo}`); } catch { return null; }
})();
if (channel) channel.onmessage = (e) => { if (e.data?.type === 'hello' && S.draft.sitio) broadcast(DOCS); };

// ---------------------------------------------------------------- almacenamiento local

const idb = (() => {
  let dbp = null;
  const open = () => (dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('croissants-admin', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', mode);
      const req = fn(tx.objectStore('kv'));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  };
  return {
    get: (k) => run('readonly', (s) => s.get(k)).catch(() => undefined),
    set: (k, v) => run('readwrite', (s) => s.put(v, k)).catch(() => undefined),
    del: (k) => run('readwrite', (s) => s.delete(k)).catch(() => undefined),
  };
})();

function readToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
function hasRememberedToken() {
  try { return Boolean(localStorage.getItem(TOKEN_KEY)); } catch { return false; }
}
function saveToken(value, remember) {
  try {
    sessionStorage.setItem(TOKEN_KEY, value);
    if (remember) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* almacenamiento bloqueado: el token queda solo en memoria */ }
}
function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch { /* nada que borrar */ }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cliente de GitHub (o el de prueba en localhost con ?prueba)
function client(owner, repo, branch) {
  return pruebaLocal ? new GitHubPrueba({ owner, repo, branch }) : new GitHubClient({ token, owner, repo, branch });
}

// ---------------------------------------------------------------- inicio

boot();

async function boot() {
  $('#repo-name').textContent = REPO_KEY;
  $('#repo-short').textContent = CONFIG.repo;
  bindLogin();
  if (pruebaLocal) {
    S.gh = client(CONFIG.owner, CONFIG.repo, CONFIG.branch);
    S.user = await S.gh.user();
    await loadRemote();
    showApp();
    toast('Modo de prueba local: nada se sube a GitHub.');
    return;
  }
  const saved = readToken();
  if (!saved) { showLogin(); return; }
  try {
    await login(saved, { remember: hasRememberedToken() });
  } catch (err) {
    clearToken();
    showLogin(explainError(err));
  }
}

function showLogin(error = '') {
  $('#splash').hidden = true;
  $('#app').hidden = true;
  $('#login').hidden = false;
  const box = $('#login-error');
  box.textContent = error;
  box.hidden = !error;
  setTimeout(() => $('#token').focus(), 60);
}

function bindLogin() {
  $('#toggle-token').addEventListener('click', () => {
    const input = $('#token');
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = $('#token').value.trim();
    const box = $('#login-error');
    if (!/^(github_pat_|ghp_|gho_)[A-Za-z0-9_]{20,}$/.test(value)) {
      box.textContent = 'Eso no parece un token de GitHub. Debe empezar por github_pat_ (o ghp_ si es un token clásico).';
      box.hidden = false;
      return;
    }
    const btn = $('#login-btn');
    btn.disabled = true;
    btn.innerHTML = `${icon('refresh', 'spin')} Verificando…`;
    try {
      await login(value, { remember: $('#remember').checked });
      $('#token').value = '';
    } catch (err) {
      box.textContent = explainError(err);
      box.hidden = false;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${icon('key')} Entrar al panel`;
    }
  });
}

async function login(value, { remember }) {
  const gh = new GitHubClient({ token: value, owner: CONFIG.owner, repo: CONFIG.repo, branch: CONFIG.branch });
  const user = await gh.user();
  const repo = await gh.repoInfo();
  if (repo.permissions && repo.permissions.push === false) {
    throw new Error(`La cuenta ${user.login} no tiene permiso de escritura en ${REPO_KEY}.`);
  }
  token = value;
  S.gh = gh;
  S.user = user;
  await loadRemote();
  saveToken(value, remember);
  S.rememberedToken = remember;
  showApp();
}

async function loadRemote() {
  const results = await Promise.all(DOCS.map((d) => S.gh.getText(CONFIG.docs[d])));
  DOCS.forEach((d, i) => {
    let json;
    try { json = JSON.parse(results[i].text); } catch { throw new Error(`${CONFIG.docs[d]} no es un JSON válido.`); }
    S.published[d] = NORMALIZE[d](json);
    S.publishedJson[d] = JSON.stringify(S.published[d]);
    S.shas[d] = results[i].sha;
    S.draft[d] = deepClone(S.published[d]);
  });
  const cached = await idb.get(UPLOADS_KEY);
  if (cached && typeof cached === 'object') {
    const limit = Date.now() - 24 * 3600 * 1000;
    for (const [path, v] of Object.entries(cached)) if (v?.t > limit && v.d) S.uploads.set(path, v.d);
  }
  const saved = await idb.get(DRAFT_KEY);
  S.pendingDraft = saved?.docs && Object.keys(saved.docs).some((d) => DOCS.includes(d)) ? saved : null;
  S.rev++;
  await loadCatalog();
}

// El catálogo que subió el plugin (items, misiones, crafteos...) para mostrar todo lo que existe en el juego
async function loadCatalog() {
  const live = S.draft.sitio?.general?.live || {};
  S.catalogo = null;
  if (!live.repo || !/^[\w.-]+\/[\w.-]+$/.test(live.repo)) {
    S.catalogoEstado = 'No hay repositorio de datos en vivo configurado (pestaña Conexión con el servidor).';
    S.rev++;
    return;
  }
  try {
    const [owner, repo] = live.repo.split('/');
    const { text } = await client(owner, repo, live.rama || 'main').getText('catalogo.json');
    S.catalogo = JSON.parse(text);
    S.catalogoEstado = '';
  } catch (err) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${live.repo}/${live.rama || 'main'}/catalogo.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      S.catalogo = await res.json();
      S.catalogoEstado = '';
    } catch {
      S.catalogoEstado = err?.status === 404
        ? 'El servidor todavía no subió el catálogo: activa la conexión en el plugin (pestaña Conexión con el servidor).'
        : `No se pudo leer el catálogo del plugin (${explainError(err)}).`;
    }
  }
  S.rev++;
}

let appBound = false;
function showApp() {
  $('#splash').hidden = true;
  $('#login').hidden = true;
  $('#app').hidden = false;
  $('#user-avatar').src = S.user.avatar_url || '';
  $('#user-avatar').hidden = !S.user.avatar_url;
  $('#user-name').textContent = S.user.login;
  if (!appBound) { bindApp(); ensureIconList(); appBound = true; }
  renderTabs();
  renderWorkspace();
  updateStatus();
  broadcast(DOCS);
  let dockOn = false;
  try { dockOn = localStorage.getItem(DOCK_KEY) === '1'; } catch { /* sin almacenamiento */ }
  if (dockOn && matchMedia('(min-width: 1101px)').matches) toggleDock(true);
  if (S.pendingDraft) offerDraftRestore(S.pendingDraft);
}

async function offerDraftRestore(saved) {
  S.pendingDraft = null;
  const outdated = Object.entries(saved.baseShas || {}).some(([d, sha]) => saved.docs[d] && sha && sha !== S.shas[d]);
  const ok = await confirmDialog(modal, {
    title: 'Tienes un borrador guardado',
    text: `Guardado el ${fmtDateTime(saved.savedAt)} en este navegador.${outdated ? ' Ojo: la web se publicó de nuevo después de ese borrador; si lo recuperas y publicas, reemplazarás esa versión.' : ''} ¿Quieres seguir con él?`,
    ok: 'Recuperar borrador',
    cancel: 'Empezar de cero',
  });
  if (ok) {
    for (const d of DOCS) if (saved.docs[d]) S.draft[d] = NORMALIZE[d](saved.docs[d]);
    for (const [p, data] of saved.pending || []) S.pending.set(p, data);
    S.edit = null;
    refresh(DOCS);
  } else {
    await idb.del(DRAFT_KEY);
  }
}

// ---------------------------------------------------------------- estado y cambios

function dirtyDocs() {
  return DOCS.filter((d) => S.draft[d] && JSON.stringify(NORMALIZE[d](S.draft[d])) !== S.publishedJson[d]);
}

let statusTimer = 0;
let saveTimer = 0;
let castTimer = 0;
const castDocs = new Set();

function changed(doc) {
  S.rev++;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(updateStatus, 250);
  if (doc) castDocs.add(doc);
  clearTimeout(castTimer);
  castTimer = setTimeout(() => { const docs = [...castDocs]; castDocs.clear(); broadcast(docs); }, 180);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
  S.live?.();
}

async function saveDraft() {
  const dirty = dirtyDocs();
  if (!dirty.length) { await idb.del(DRAFT_KEY); return; }
  await idb.set(DRAFT_KEY, {
    docs: Object.fromEntries(dirty.map((d) => [d, S.draft[d]])),
    pending: [...S.pending],
    baseShas: { ...S.shas },
    savedAt: Date.now(),
  });
}

function refresh(docs = []) {
  renderTabs();
  renderWorkspace();
  for (const d of docs) castDocs.add(d);
  changed(docs[0]);
}

function updateStatus() {
  const el = $('#status');
  const dirty = S.draft.sitio ? dirtyDocs() : [];
  if (S.publishing) {
    el.className = 'status is-busy';
    el.innerHTML = `${icon('refresh', 'spin')}<span>Publicando…</span>`;
  } else if (dirty.length) {
    el.className = 'status is-dirty';
    el.innerHTML = `<span class="status__dot"></span><span>Sin publicar: ${esc(dirty.map((d) => DOC_NAME[d]).join(', '))}</span><button class="status__discard" type="button" data-top="discard">Descartar</button>`;
  } else {
    el.className = 'status is-clean';
    el.innerHTML = `${icon('check')}<span>Todo publicado</span>`;
  }
  $('#btn-publish').disabled = !dirty.length || S.publishing;
}

// La vista previa recibe los documentos con las imágenes nuevas puestas como datos (todavía no están en la web)
function substitute(value) {
  const map = new Map([...S.uploads, ...S.pending]);
  if (!map.size) return value;
  const walk = (v) => {
    if (typeof v === 'string') {
      if (!v.includes(`${CONFIG.uploadsDir}/`)) return v;
      let s = v;
      for (const [p, data] of map) if (s.includes(p)) s = s.split(p).join(data);
      return s;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) o[k] = walk(v[k]);
      return o;
    }
    return v;
  };
  return walk(value);
}

function broadcast(docs) {
  if (!channel || !S.draft.sitio || !docs.length) return;
  const msg = { type: 'content' };
  for (const d of docs) msg[d] = substitute(NORMALIZE[d](S.draft[d]));
  try { channel.postMessage(msg); } catch { /* sin vista previa */ }
}

// ---------------------------------------------------------------- dibujo

function renderTabs() {
  const active = S.edit ? editTab() : S.tab;
  $('#tabs').innerHTML = TABS.map((t) => (t.sep
    ? `<p class="tabs__sep">${esc(t.sep)}</p>`
    : `<button class="tab${active === t.id ? ' is-active' : ''}" type="button" data-tab="${t.id}"${active === t.id ? ' aria-current="page"' : ''}>${icon(t.icon)}<span>${esc(t.label)}</span>${t.count ? `<small>${t.count()}</small>` : ''}</button>`)).join('');
}

function editTab() {
  const e = S.edit;
  if (e.list === 'guia') return 'guia';
  if (e.list === 'anuncios') return 'anuncios';
  if (e.list) return 'jugabilidad';
  if (e.kind === 'mision') return 'misiones';
  return 'items';
}

function renderWorkspace({ keepScroll = true } = {}) {
  const ws = $('#workspace');
  const y = window.scrollY;
  setGameData(game(), { resolve: resolveAsset });
  S.live = null;
  ws.innerHTML = render();
  if (S.tab === 'historial' && !S.edit) loadHistory();
  setupLive();
  if (keepScroll) window.scrollTo({ top: y });
  updateDock();
}

// Lo que se actualiza solo mientras escribes dentro de un editor (por ejemplo el tooltip del item)
function setupLive() {
  const e = S.edit;
  if (e?.kind === 'item') {
    S.live = () => { const box = $('[data-live="tooltip"]'); if (box) { setGameData(game(), { resolve: resolveAsset }); box.innerHTML = itemPreview(e.id); } };
  }
}

// ---------------------------------------------------------------- listas y editores

function listArr(listId) {
  return getAt(LISTS[listId].path);
}

function uniqueId(listId, base, exceptIndex = -1) {
  const used = new Set(listArr(listId).filter((_, i) => i !== exceptIndex).map((x) => x.id));
  const root = slugify(base);
  let id = root;
  for (let n = 2; used.has(id); n++) id = `${root}-${n}`;
  return id;
}

function openListEditor(listId, index, { isNew = false } = {}) {
  const item = listArr(listId)[index];
  S.edit = { list: listId, index, isNew, autoId: isNew, snapshot: deepClone(item) };
  renderTabs();
  renderWorkspace({ keepScroll: false });
  window.scrollTo({ top: 0 });
  $('#workspace').focus({ preventScroll: true });
}

// Los editores del juego guardan en data/juego.json; si el elemento solo existe en el catálogo del plugin se copia
function ensureEntry(kind, key) {
  const j = S.draft.juego;
  const g = game();
  if (kind === 'item') {
    j.items ||= {};
    let created = false;
    if (!j.items[key]) { j.items[key] = deepClone(g.items[key] || { material: 'barrier' }); created = true; }
    return { path: `juego:items.${key}`, created };
  }
  const field = { mision: 'misiones', mob: 'mobs', receta: 'recetas' }[kind];
  const id = kind === 'mision' ? 'n' : 'id';
  j[field] ||= [];
  let idx = j[field].findIndex((x) => x[id] === key);
  let created = false;
  if (idx < 0) {
    const src = g[field].find((x) => x[id] === key);
    if (!src) return null;
    j[field].push(deepClone(src));
    idx = j[field].length - 1;
    created = true;
  }
  return { path: `juego:${field}.${idx}`, created };
}

function openKindEditor(kind, key) {
  const entry = ensureEntry(kind, key);
  if (!entry) { toast('No se encontró en los datos del juego.', { type: 'error' }); return; }
  S.edit = { kind, [kind === 'mision' ? 'n' : 'id']: key, path: entry.path, created: entry.created, snapshot: deepClone(getAt(entry.path)) };
  renderTabs();
  renderWorkspace({ keepScroll: false });
  window.scrollTo({ top: 0 });
}

function closeEditor() {
  S.edit = null;
  renderTabs();
  renderWorkspace({ keepScroll: false });
}

async function undoEditor() {
  const e = S.edit;
  if (!e) return;
  const ok = await confirmDialog(modal, { title: '¿Deshacer los cambios?', text: 'Vuelve a como estaba cuando lo abriste.', ok: 'Deshacer' });
  if (!ok) return;
  if (e.list) {
    if (e.isNew) { listArr(e.list).splice(e.index, 1); closeEditor(); changed(docOf(LISTS[e.list].path)); return; }
    listArr(e.list)[e.index] = deepClone(e.snapshot);
  } else if (e.created) {
    // Se había copiado del catálogo: se saca para dejar todo igual
    if (e.kind === 'item') delete S.draft.juego.items[e.id];
    else {
      const field = { mision: 'misiones', mob: 'mobs', receta: 'recetas' }[e.kind];
      const idx = Number(e.path.split('.').pop());
      S.draft.juego[field].splice(idx, 1);
    }
    closeEditor();
    changed('juego');
    return;
  } else {
    setAt(e.path, deepClone(e.snapshot));
  }
  renderWorkspace();
  changed(e.list ? docOf(LISTS[e.list].path) : 'juego');
  toast('Cambios deshechos');
}

async function deleteFromEditor() {
  const e = S.edit;
  if (!e?.list) return;
  const L = LISTS[e.list];
  const item = listArr(e.list)[e.index];
  const ok = await confirmDialog(modal, { title: `¿Eliminar “${item.titulo}”?`, text: 'Se quita del borrador. Si te equivocas, puedes descartar los cambios antes de publicar.', ok: 'Eliminar', danger: true });
  if (!ok) return;
  listArr(e.list).splice(e.index, 1);
  closeEditor();
  changed(docOf(L.path));
}

function moveItem(arr, from, to) {
  if (to < 0 || to >= arr.length || from === to) return false;
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
  return true;
}

async function rowAction(action, listId, index) {
  const L = LISTS[listId];
  const arr = listArr(listId);
  const doc = docOf(L.path);
  const item = arr[index];
  if (action === 'row-add') {
    const x = TEMPLATES[L.tpl]();
    x.id = uniqueId(listId, x.titulo);
    arr.push(x);
    changed(doc);
    openListEditor(listId, arr.length - 1, { isNew: true });
    return;
  }
  if (!item) return;
  if (action === 'row-edit') openListEditor(listId, index);
  else if (action === 'row-up' && moveItem(arr, index, index - 1)) refresh([doc]);
  else if (action === 'row-down' && moveItem(arr, index, index + 1)) refresh([doc]);
  else if (action === 'row-toggle') { item.oculto = !item.oculto; refresh([doc]); }
  else if (action === 'row-dup') {
    const copy = deepClone(item);
    copy.titulo = `${copy.titulo} (copia)`;
    copy.id = uniqueId(listId, copy.titulo);
    arr.splice(index + 1, 0, copy);
    refresh([doc]);
    toast('Duplicado en el borrador', { type: 'success' });
  } else if (action === 'row-del') {
    const ok = await confirmDialog(modal, { title: `¿Eliminar “${item.titulo}”?`, text: 'Se quita del borrador. Si te equivocas, puedes descartar los cambios antes de publicar.', ok: 'Eliminar', danger: true });
    if (ok) { arr.splice(index, 1); refresh([doc]); }
  }
}

// ---------------------------------------------------------------- ventanas pequeñas (preguntar un texto, elegir)

function askText({ title, label, value = '', placeholder = '', hint = '', ok = 'Aceptar', type = 'text' }) {
  return new Promise((resolve) => {
    let result = null;
    const c = modal.open(`<form class="confirm" data-ask>
      <h2 class="confirm__title" id="modal-title">${esc(title)}</h2>
      <label class="field" style="text-align:left;margin-top:16px"><span class="field__label">${esc(label)}</span>
        <input class="input" type="${type}" name="v" value="${esc(value)}" placeholder="${esc(placeholder)}" autofocus spellcheck="false">
        ${hint ? `<span class="field__hint">${hint}</span>` : ''}</label>
      <div class="modal__actions"><button class="btn btn--ghost" type="button" data-close>Cancelar</button><button class="btn btn--primary" type="submit">${esc(ok)}</button></div>
    </form>`, { size: 'sm', onClose: () => resolve(result) });
    c.querySelector('[data-ask]').addEventListener('submit', (e) => {
      e.preventDefault();
      result = c.querySelector('[name="v"]').value.trim();
      modal.close();
    });
  });
}

function pickIcon(current) {
  return new Promise((resolve) => {
    let result = null;
    const c = modal.open(`<div class="picker">
      <h2 class="picker__title" id="modal-title">Elige un ícono</h2>
      <div class="icon-pick">${ICON_NAMES.map((n) => `<button type="button" data-pick="${n}" title="${n}" class="${n === current ? 'is-on' : ''}">${icon(n)}</button>`).join('')}</div>
    </div>`, { size: 'lg', onClose: () => resolve(result) });
    c.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      result = b.dataset.pick;
      modal.close();
    });
  });
}

// Elige un item del juego (los del plugin o uno vanilla escribiendo su material) y la cantidad
function pickItem() {
  return new Promise((resolve) => {
    let result = null;
    const items = Object.entries(game().items);
    const grid = (q) => items.filter(([id, it]) => !q || `${id} ${itemLabel(it)}`.toLowerCase().includes(q.toLowerCase()))
      .map(([id, it]) => `<button class="picker__cell" type="button" data-pick="${esc(id)}" title="${esc(itemLabel(it))}">${itemHtml({ id }, { size: 34, tip: false })}</button>`).join('');
    const c = modal.open(`<div class="picker">
      <h2 class="picker__title" id="modal-title">Insertar un item</h2>
      <input class="input" type="search" placeholder="Buscar por nombre…" data-q autofocus>
      <div class="picker__grid" data-grid>${grid('')}</div>
      <label class="field"><span class="field__label">O un item vanilla</span>
        <span class="picker__vanilla"><input class="input mono" placeholder="diamond_sword" data-vanilla spellcheck="false"><input class="input" type="number" min="1" value="1" data-n style="width:90px" aria-label="Cantidad"><button class="btn btn--sm" type="button" data-use-vanilla>Insertar</button></span></label>
      <p class="field__hint">Se ve como un chip con su ícono y, al pasar el mouse, el tooltip del juego.</p>
    </div>`, { size: 'lg', onClose: () => resolve(result) });
    const n = () => Math.max(1, Number(c.querySelector('[data-n]').value) || 1);
    c.querySelector('[data-q]').addEventListener('input', (e) => { c.querySelector('[data-grid]').innerHTML = grid(e.target.value); });
    c.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (b) { result = { id: b.dataset.pick, n: n() }; modal.close(); return; }
      if (e.target.closest('[data-use-vanilla]')) {
        const mat = slugify(c.querySelector('[data-vanilla]').value).replace(/-/g, '_');
        if (mat) { result = { id: `minecraft:${mat}`, n: n() }; modal.close(); }
      }
    });
  });
}

function pickFrom(title, options) {
  return new Promise((resolve) => {
    let result = null;
    const c = modal.open(`<div class="picker">
      <h2 class="picker__title" id="modal-title">${esc(title)}</h2>
      <div class="menu-pop" style="position:static;max-height:60vh">${options.map(([v, t, sub]) => `<button type="button" data-pick="${esc(v)}">${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</button>`).join('')}</div>
    </div>`, { size: 'sm', onClose: () => resolve(result) });
    c.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      result = b.dataset.pick;
      modal.close();
    });
  });
}

// ---------------------------------------------------------------- texto con formato (markdown)

function mdInsert(ta, text, { block = false, select = null } = {}) {
  ta.focus();
  const { selectionStart: a, selectionEnd: b, value } = ta;
  let t = text;
  if (block) {
    const before = value.slice(0, a);
    const after = value.slice(b);
    if (before && !before.endsWith('\n\n')) t = (before.endsWith('\n') ? '\n' : '\n\n') + t;
    if (!after.startsWith('\n')) t += '\n\n';
  }
  ta.setRangeText(t, a, b, 'end');
  if (select) {
    const start = ta.selectionEnd - t.length + t.indexOf(select);
    if (start >= ta.selectionEnd - t.length) ta.setSelectionRange(start, start + select.length);
  }
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function mdWrap(ta, left, right, placeholder) {
  const { selectionStart: a, selectionEnd: b, value } = ta;
  const sel = value.slice(a, b) || placeholder;
  ta.focus();
  ta.setRangeText(`${left}${sel}${right}`, a, b, 'end');
  ta.setSelectionRange(a + left.length, a + left.length + sel.length);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function mdLines(ta, prefix) {
  const { selectionStart: a, selectionEnd: b, value } = ta;
  const start = value.lastIndexOf('\n', a - 1) + 1;
  const end = value.indexOf('\n', b);
  const stop = end < 0 ? value.length : end;
  const lines = value.slice(start, stop).split('\n');
  const out = lines.map((l, i) => (typeof prefix === 'function' ? prefix(i) : prefix) + l.replace(/^(#{1,4}\s|[-*]\s|\d+[.)]\s)/, '')).join('\n');
  ta.focus();
  ta.setRangeText(out, start, stop, 'end');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

const MD_BLOCKS = [
  ['recetas', 'Crafteos de un cambio', 'Todos los crafteos de uno, dos o tres'],
  ['receta', 'Un crafteo', 'La mesa con un crafteo'],
  ['mobs', 'Mobs de un cambio', 'Las tarjetas de los mobs'],
  ['items', 'Items de una categoría', 'La grilla de items con tooltip'],
  ['trabajos', 'Trabajos', 'Los 6 trabajos con su XP y pagos'],
  ['habilidades', 'Habilidades', 'Los niveles y lo que cuestan'],
  ['rangos', 'Rangos', 'Los rangos del servidor'],
  ['pesca', 'Pesca', 'La tabla de premios de pesca'],
  ['calendario', 'Calendario', 'Los días importantes de la página de inicio'],
  ['menu', 'Menú (/menu)', 'Cómo es el menú principal'],
  ['ip', 'IP del servidor', 'Las IP de Java y Bedrock para copiar'],
];

async function mdAction(action, btn) {
  const box = btn.closest('[data-mdx]');
  const ta = box.querySelector('textarea');
  const { selectionStart: a, selectionEnd: b } = ta;
  const restore = () => { ta.focus(); ta.setSelectionRange(a, b); };
  switch (action) {
    case 'bold': mdWrap(ta, '**', '**', 'texto en negrita'); break;
    case 'italic': mdWrap(ta, '*', '*', 'texto'); break;
    case 'h2': mdLines(ta, '## '); break;
    case 'h3': mdLines(ta, '### '); break;
    case 'ul': mdLines(ta, '- '); break;
    case 'ol': mdLines(ta, (i) => `${i + 1}. `); break;
    case 'tip': mdInsert(ta, `> [!tip] ${ta.value.slice(a, b) || 'Un consejo para los jugadores.'}`, { block: true }); break;
    case 'warn': mdInsert(ta, `> [!warn] ${ta.value.slice(a, b) || 'Algo importante que no hay que olvidar.'}`, { block: true }); break;
    case 'table': mdInsert(ta, '| Columna | Columna |\n| --- | --- |\n| Texto | Texto |', { block: true }); break;
    case 'link': {
      const sel = ta.value.slice(a, b);
      const url = await askText({ title: 'Agregar enlace', label: 'Dirección', placeholder: 'https://… o #guia/dinocoins', hint: 'Para ir a otra parte de la web usa #, por ejemplo <b>#misiones</b>.' });
      restore();
      if (url) mdInsert(ta, `[${sel || 'texto del enlace'}](${url})`);
      break;
    }
    case 'image': {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/gif';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const res = await processImage(file, 'shot');
          const path = addPending(res.dataUrl, file.name.replace(/\.[^.]+$/, ''));
          restore();
          mdInsert(ta, `![${file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')}](${path})`, { block: true });
          toast(`Imagen lista (${fmtKB(res.bytes)}). Se sube al publicar.`, { type: 'success' });
        } catch (err) {
          toast(err.message, { type: 'error' });
        }
      };
      input.click();
      break;
    }
    case 'item': {
      const r = await pickItem();
      restore();
      if (r) mdInsert(ta, `[[item:${r.id}${r.n > 1 ? ` x${r.n}` : ''}]]`);
      break;
    }
    case 'mision': {
      const n = await askText({ title: 'Insertar misión', label: 'Número de la misión', type: 'number', placeholder: '12' });
      restore();
      if (n && Number(n) > 0) mdInsert(ta, `[[mision:${Number(n)}]]`);
      break;
    }
    case 'cmd': {
      const c = await askText({ title: 'Insertar comando', label: 'Comando', placeholder: '/menu', hint: 'En la web se puede copiar con un clic.' });
      restore();
      if (c) mdInsert(ta, `[[cmd:${c.startsWith('/') ? c : `/${c}`}]]`);
      break;
    }
    case 'bloque': {
      const kind = await pickFrom('Insertar un bloque', MD_BLOCKS);
      if (!kind) { restore(); return; }
      let arg = '';
      if (kind === 'recetas' || kind === 'mobs') arg = await pickFrom('¿De qué cambio?', [['uno', 'Cambio uno'], ['extra', 'Cambio extra'], ['dos', 'Cambio dos'], ['tres', 'Cambio tres'], ['', 'Todos']]);
      else if (kind === 'receta') arg = await pickFrom('¿Qué crafteo?', game().recetas.map((r) => [r.id, r.id, `Cambio ${r.etapa}`]));
      else if (kind === 'items') {
        const { CATEGORIAS } = await import('../components.js');
        arg = await pickFrom('¿Qué categoría?', [['', 'Todas'], ...Object.entries(CATEGORIAS).map(([k, v]) => [k, v])]);
      }
      restore();
      if (arg === null) return;
      mdInsert(ta, `[[${kind}${arg ? `:${arg}` : ''}]]`, { block: true });
      break;
    }
    case 'preview': {
      const pv = box.querySelector('.mdx__preview');
      const on = pv.hidden;
      pv.hidden = !on;
      btn.classList.toggle('is-on', on);
      if (on) renderMdPreview(box);
      break;
    }
    default:
  }
}

function renderMdPreview(box) {
  const pv = box.querySelector('.mdx__preview');
  if (!pv || pv.hidden) return;
  setGameData(game(), { resolve: resolveAsset });
  const ctx = {
    resolve: (u) => imgSrc(u) || u,
    inline(kind, arg) {
      if (kind === 'item') {
        const m = arg.match(/^(.+?)(?:\s+x(\d+))?$/);
        const id = m[1].trim();
        const n = m[2] ? Number(m[2]) : 1;
        return itemChipHtml(id.startsWith('minecraft:') ? { vanilla: true, material: id.slice(10), n } : { id, n });
      }
      if (kind === 'mision') {
        const ms = game().misiones.find((x) => x.n === Number(arg));
        return `<span class="tag">${icon('scroll')} ${ms ? esc(`#${ms.n} ${ms.nombre}`) : `Misión ${esc(arg)}`}</span>`;
      }
      if (kind === 'cmd') return `<code class="cmd">${esc(arg)}</code>`;
      if (kind === 'icono') return icon(arg, 'i--inline');
      if (kind === 'mc') return `<span class="mc-text">${legacyHtml(arg, { c: '#FFFFFF' })}</span>`;
      if (kind === 'dia') return `<span class="tag">${icon('calendar')} Día ${esc(arg)}</span>`;
      return null;
    },
    block(kind, arg) {
      const b = MD_BLOCKS.find(([k]) => k === kind);
      return b ? `<div class="md-placeholder">${icon('layers')} ${esc(b[1])}${arg ? `: ${esc(arg)}` : ''} <small class="muted">(en la web se arma solo)</small></div>` : null;
    },
  };
  pv.innerHTML = md(box.querySelector('textarea').value, ctx);
}

// ---------------------------------------------------------------- eventos

function bindApp() {
  const ws = $('#workspace');
  bindTooltips(document);

  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    if (b.dataset.tab === S.tab && !S.edit) return;
    S.tab = b.dataset.tab;
    S.edit = null;
    S.filters = { q: '', cat: '', tipo: 'todas' };
    renderTabs();
    renderWorkspace({ keepScroll: false });
    window.scrollTo({ top: 0 });
    ws.focus({ preventScroll: true });
  });

  ws.addEventListener('input', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) {
      S.filters[f.dataset.filter] = f.value;
      const key = f.dataset.filter;
      const pos = f.selectionStart;
      renderWorkspace();
      const again = $(`[data-filter="${key}"]`);
      if (again && key === 'q') { again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* select */ } }
      return;
    }
    const color = e.target.closest('[data-color-for]');
    if (color) {
      const text = color.parentElement.querySelector('[data-path]');
      text.value = color.value;
      text.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const el = e.target.closest('[data-path]');
    if (!el || el.matches('button')) return;
    const v = readValue(el);
    if (v === INVALID) { el.classList.add('is-invalid'); return; }
    el.classList.toggle('is-invalid', el.dataset.kind !== 'url' ? false : Boolean(v) && !safeUrl(v));
    if (el.type === 'url') el.classList.toggle('is-invalid', Boolean(v) && !safeUrl(v));
    setAt(el.dataset.path, v);
    if (el.dataset.kind === 'icon') { const pv = el.parentElement.querySelector('.icon-field__preview'); if (pv) pv.innerHTML = icon(v); }
    if (el.dataset.kind === 'color') { const picker = el.parentElement.querySelector('[data-color-for]'); if (picker && /^#[0-9a-f]{6}$/i.test(v)) picker.value = v; }
    // Mientras el elemento es nuevo, la dirección sigue al título
    const ed = S.edit;
    if (ed?.list && ed.autoId) {
      const base = `${LISTS[ed.list].path}.${ed.index}`;
      if (el.dataset.path === `${base}.titulo`) {
        const id = uniqueId(ed.list, v || LISTS[ed.list].label, ed.index);
        setAt(`${base}.id`, id);
        const idInput = $(`[data-path="${CSS.escape(`${base}.id`)}"]`);
        if (idInput) idInput.value = id;
      } else if (el.dataset.path === `${base}.id`) {
        ed.autoId = false;
      }
    }
    const mdx = el.closest('[data-mdx]');
    if (mdx) renderMdPreviewSoon(mdx);
    changed(docOf(el.dataset.path));
  });

  ws.addEventListener('change', async (e) => {
    const slug = e.target.closest('[data-kind="slug"]');
    if (slug) {
      const v = slugify(slug.value);
      slug.value = v;
      setAt(slug.dataset.path, v);
      changed(docOf(slug.dataset.path));
      return;
    }
    const filterSel = e.target.closest('select[data-filter]');
    if (filterSel) return;
    const up = e.target.closest('[data-upload]');
    if (up) { await uploadInto(up); return; }
    const many = e.target.closest('[data-upload-fondos]');
    if (many) { await uploadFondos(many); return; }
    const imp = e.target.closest('[data-import]');
    if (imp) await importJSON(imp);
  });

  ws.addEventListener('click', async (e) => {
    const mdb = e.target.closest('[data-md]');
    if (mdb) { e.preventDefault(); mdAction(mdb.dataset.md, mdb); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act.startsWith('row-')) {
      const row = b.closest('.row');
      const listId = b.dataset.list || row?.dataset.list;
      if (listId) rowAction(act, listId, Number(row?.dataset.index ?? -1));
      return;
    }
    switch (act) {
      case 'arr-add': {
        const arr = getAt(b.dataset.path);
        const x = TEMPLATES[b.dataset.tpl]();
        if (Array.isArray(arr)) arr.push(x); else setAt(b.dataset.path, [x]);
        if (b.dataset.tpl === 'categoria') x.id = slugify(`${x.nombre}-${Date.now().toString(36)}`);
        refresh([docOf(b.dataset.path)]);
        break;
      }
      case 'arr-del': case 'arr-up': case 'arr-down': {
        const arr = getAt(b.dataset.path);
        const i = Number(b.dataset.index);
        if (!Array.isArray(arr)) break;
        if (act === 'arr-del') {
          const ok = await confirmDialog(modal, { title: '¿Quitar este elemento?', text: 'Se quita del borrador.', ok: 'Quitar', danger: true });
          if (!ok) break;
          arr.splice(i, 1);
        } else if (!moveItem(arr, i, act === 'arr-up' ? i - 1 : i + 1)) break;
        refresh([docOf(b.dataset.path)]);
        break;
      }
      case 'icon-pick': {
        const v = await pickIcon(getAt(b.dataset.path));
        if (v) { setAt(b.dataset.path, v); renderWorkspace(); changed(docOf(b.dataset.path)); }
        break;
      }
      case 'img-url': {
        const field = b.closest('[data-img]');
        const url = await askText({ title: 'Imagen desde una URL', label: 'Dirección de la imagen', placeholder: 'https://…/imagen.png', hint: 'Tiene que empezar por https://' });
        if (url === null || !url) break;
        const safe = safeImage(url);
        if (!safe || !/^https:/i.test(safe)) { toast('La URL de la imagen debe empezar por https://', { type: 'error' }); break; }
        setAt(field.dataset.img, safe);
        renderWorkspace();
        changed(docOf(field.dataset.img));
        break;
      }
      case 'img-clear': {
        const field = b.closest('[data-img]');
        setAt(field.dataset.img, '');
        renderWorkspace();
        changed(docOf(field.dataset.img));
        break;
      }
      case 'ed-back': closeEditor(); break;
      case 'ed-undo': undoEditor(); break;
      case 'ed-delete': deleteFromEditor(); break;
      case 'ed-view': openPreviewAt(routeFor()); break;
      case 'mision-edit': openKindEditor('mision', Number(b.dataset.n)); break;
      case 'item-edit': openKindEditor('item', b.dataset.id); break;
      case 'mob-edit': openKindEditor('mob', b.dataset.id); break;
      case 'receta-edit': openKindEditor('receta', b.dataset.id); break;
      case 'filter-tipo': S.filters.tipo = b.dataset.v; renderWorkspace(); break;
      case 'sub-items': S.sub.items = b.dataset.v; S.filters = { q: '', cat: '', tipo: 'todas' }; renderWorkspace(); updateDock(); break;
      case 'conn-test': connTest(); break;
      case 'copy': if (await copyText(b.dataset.text || '')) toast('Copiado', { type: 'success' }); break;
      case 'bake-catalog': bakeCatalog(); break;
      case 'reload-catalog': {
        b.disabled = true;
        await loadCatalog();
        renderTabs();
        renderWorkspace();
        toast(S.catalogo ? 'Catálogo del plugin actualizado' : S.catalogoEstado, { type: S.catalogo ? 'success' : 'error' });
        break;
      }
      case 'history-refresh': loadHistory(); break;
      case 'restore': restoreVersion(b.dataset.sha); break;
      case 'export': exportJSON(); break;
      default:
    }
  });

  // Arrastrar y soltar para ordenar las filas (escritorio)
  let drag = null;
  ws.addEventListener('dragstart', (e) => {
    const row = e.target.closest?.('.row[draggable="true"]');
    if (!row) return;
    drag = { list: row.dataset.list, index: Number(row.dataset.index) };
    row.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(drag.index));
  });
  ws.addEventListener('dragover', (e) => {
    const row = e.target.closest?.('.row');
    if (!row || !drag || row.dataset.list !== drag.list) return;
    e.preventDefault();
    $$('.row.is-over').forEach((r) => r !== row && r.classList.remove('is-over'));
    row.classList.add('is-over');
  });
  ws.addEventListener('drop', (e) => {
    const row = e.target.closest?.('.row');
    if (!row || !drag || row.dataset.list !== drag.list) return;
    e.preventDefault();
    const arr = listArr(drag.list);
    const doc = docOf(LISTS[drag.list].path);
    const from = drag.index;
    drag = null;
    if (moveItem(arr, from, Number(row.dataset.index))) refresh([doc]);
  });
  ws.addEventListener('dragend', () => {
    drag = null;
    $$('.row.is-dragging, .row.is-over').forEach((r) => r.classList.remove('is-dragging', 'is-over'));
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-top="discard"]')) discard();
  });
  $('#btn-preview').addEventListener('click', () => openPreviewAt(routeFor(), { tab: true }));
  $('#btn-dock').addEventListener('click', () => toggleDock());
  $('#dock-close').addEventListener('click', () => toggleDock(false));
  $('#dock-reload').addEventListener('click', () => { const f = $('#dock-frame'); f.src = previewUrl(routeFor()); });
  $('#btn-publish').addEventListener('click', publish);
  $('#btn-logout').addEventListener('click', logout);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (!modal.isOpen && dirtyDocs().length) publish();
    }
  });
  window.addEventListener('beforeunload', (e) => {
    if (S.publishing) { e.preventDefault(); e.returnValue = ''; }
  });
}

let mdTimer = 0;
function renderMdPreviewSoon(box) {
  clearTimeout(mdTimer);
  mdTimer = setTimeout(() => renderMdPreview(box), 250);
}

async function uploadInto(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const field = input.closest('[data-img]');
  const path = field.dataset.img;
  try {
    toast('Optimizando imagen…');
    const res = await processImage(file, field.dataset.imgKind);
    const stored = addPending(res.dataUrl, field.dataset.imgName);
    setAt(path, stored);
    renderWorkspace();
    changed(docOf(path));
    toast(`Lista: ${res.width}×${res.height} px · ${fmtKB(res.bytes)}. Se sube al publicar.`, { type: 'success' });
  } catch (err) {
    toast(err.message, { type: 'error' });
  }
}

async function uploadFondos(input) {
  const files = [...(input.files || [])];
  input.value = '';
  if (!files.length) return;
  const list = S.draft.sitio.general.fondos;
  for (const file of files) {
    try {
      const res = await processImage(file, 'cover');
      const name = file.name.replace(/\.[^.]+$/, '');
      list.push({ src: addPending(res.dataUrl, `fondo-${name}`), titulo: name.replace(/[-_]+/g, ' '), texto: '' });
    } catch (err) {
      toast(`${file.name}: ${err.message}`, { type: 'error' });
    }
  }
  refresh(['sitio']);
  toast('Fondos listos. Se suben al publicar.', { type: 'success' });
}

async function discard() {
  const ok = await confirmDialog(modal, {
    title: '¿Descartar los cambios?',
    text: 'Se perderán todos los cambios que no has publicado y el borrador volverá a ser igual que la web.',
    ok: 'Descartar',
    danger: true,
  });
  if (!ok) return;
  for (const d of DOCS) S.draft[d] = deepClone(S.published[d]);
  S.pending.clear();
  S.edit = null;
  await idb.del(DRAFT_KEY);
  refresh(DOCS);
  toast('Cambios descartados');
}

async function logout() {
  if (dirtyDocs().length) {
    const ok = await confirmDialog(modal, { title: '¿Cerrar sesión?', text: 'Tu borrador se queda guardado en este navegador para la próxima vez.', ok: 'Cerrar sesión' });
    if (!ok) return;
  }
  clearToken();
  location.reload();
}

// ---------------------------------------------------------------- vista previa

function previewUrl(route) {
  return new URL(`../?preview#${route || 'inicio'}`, location.href).href;
}

function openPreviewAt(route, { tab = false } = {}) {
  if (!tab && matchMedia('(min-width: 1101px)').matches) {
    toggleDock(true);
    updateDock(true);
    return;
  }
  window.open(previewUrl(route), '_blank', 'noopener');
  setTimeout(() => broadcast(DOCS), 900);
  toast('Vista previa abierta en otra pestaña. Se actualiza sola mientras editas.');
}

function toggleDock(force) {
  const on = force ?? $('#dock').hidden;
  $('#dock').hidden = !on;
  $('#app').classList.toggle('has-dock', on);
  $('#btn-dock').classList.toggle('is-on', on);
  try { localStorage.setItem(DOCK_KEY, on ? '1' : '0'); } catch { /* sin almacenamiento */ }
  if (on) {
    const f = $('#dock-frame');
    if (!f.src) f.src = previewUrl(routeFor());
    updateDock(true);
  }
}

let dockRoute = '';
function updateDock(force = false) {
  if ($('#dock').hidden) return;
  const route = routeFor();
  $('#dock-route').textContent = `#${route}`;
  if (!force && route === dockRoute) return;
  dockRoute = route;
  const f = $('#dock-frame');
  try {
    if (f.contentWindow && f.contentWindow.location.href !== 'about:blank') f.contentWindow.location.hash = route;
    else f.src = previewUrl(route);
  } catch {
    f.src = previewUrl(route);
  }
}

// ---------------------------------------------------------------- conexión con el servidor

async function connTest() {
  const box = $('#conn-test');
  if (!box) return;
  const g = S.draft.sitio.general;
  const live = g.live;
  const rows = [];
  const row = (ok, ic, html) => rows.push(`<div class="conn__row ${ok ? 'is-good' : 'is-bad'}">${icon(ic)} <span>${html}</span></div>`);
  box.innerHTML = `<p class="muted">${icon('refresh', 'spin')} Revisando…</p>`;
  try {
    const host = g.puertoJava ? `${g.ipJava}:${g.puertoJava}` : g.ipJava;
    const d = await (await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(host)}`, { cache: 'no-store' })).json();
    row(d.online, 'server', d.online ? `Servidor <b>prendido</b>: ${d.players?.online ?? 0} de ${d.players?.max ?? 0} conectados · ${esc(d.version?.name_clean || '')}` : 'El servidor está <b>apagado</b> o no responde.');
  } catch {
    row(false, 'server', 'No se pudo consultar el estado del servidor.');
  }
  if (!live.repo) {
    row(false, 'alert', 'Falta el repositorio de datos en vivo.');
  } else {
    try {
      const [owner, repo] = live.repo.split('/');
      const { text } = await client(owner, repo, live.rama || 'main').getText('estado.json');
      const e = JSON.parse(text);
      const mins = Math.round((Date.now() - Date.parse(e.generado)) / 60000);
      row(mins < 30, 'wifi', `El plugin subió datos <b>${mins <= 0 ? 'hace menos de un minuto' : `hace ${mins} min`}</b>${mins >= 30 ? ' (¿el servidor está apagado o la conexión desactivada?)' : ''}.`);
      const activas = e.misiones?.activas?.length || 0;
      const cambios = Object.entries(e.cambios || {}).filter(([, v]) => v).map(([k]) => k);
      row(true, 'scroll', `Día <b>${e.dia ?? '—'}</b> · <b>${activas}</b> misiones activas · cambios activos: <b>${esc(cambios.join(', ') || 'ninguno')}</b>`);
      row(Boolean(e.archivos?.catalogo), 'cube', e.archivos?.catalogo ? `Catálogo del plugin subido (versión <code>${esc(e.archivos.catalogo)}</code>).` : 'Todavía no se subió el catálogo.');
      row(Boolean(e.archivos?.jugadores), 'users', e.archivos?.jugadores ? 'Estadísticas de jugadores subidas.' : 'Todavía no se subieron los jugadores (tardan un par de minutos).');
    } catch (err) {
      row(false, 'alert', err?.status === 404
        ? `El repositorio <code>${esc(live.repo)}</code> todavía no tiene datos: configura el plugin con los pasos de abajo.`
        : `No se pudo leer el repositorio de datos: ${esc(explainError(err))}`);
    }
  }
  row(Boolean(live.ntfy), 'bolt', live.ntfy ? `Avisos instantáneos por ntfy.sh en <code>${esc(live.ntfy)}</code>.` : 'Sin canal de avisos: las páginas se actualizan cada minuto.');
  box.innerHTML = rows.join('');
}

async function bakeCatalog() {
  if (!S.catalogo) return;
  const ok = await confirmDialog(modal, {
    title: '¿Guardar la copia del catálogo?',
    text: 'Los items, misiones, crafteos, trabajos, habilidades y mobs de data/juego.json se reemplazan por los del plugin. Las texturas, descripciones, notas e imágenes de la web se conservan. Se publica con el botón Publicar.',
    ok: 'Guardar copia',
  });
  if (!ok) return;
  S.draft.juego = normalizeJuego(mergeCatalog(S.draft.juego, S.catalogo));
  S.draft.juego.meta.fuente = `QuasoPlugin ${S.catalogo.plugin || ''}`.trim();
  refresh(['juego']);
  toast('Copia lista en el borrador. Pulsa Publicar para guardarla.', { type: 'success' });
}

// ---------------------------------------------------------------- publicar

function validate(next) {
  const problems = [];
  const s = next.sitio;
  if (s) {
    if (!s.general.nombre.trim()) problems.push('El nombre del servidor está vacío (General).');
    for (const [k, v] of Object.entries(s.general.redes)) if (v && !safeUrl(v)) problems.push(`El enlace de ${k} no es válido (General).`);
    for (const [k, v] of Object.entries(s.general.viciont)) if (v && !safeUrl(v)) problems.push(`El enlace de Viciont (${k}) no es válido (General).`);
    if (s.general.live.repo && !/^[\w.-]+\/[\w.-]+$/.test(s.general.live.repo)) problems.push('El repositorio de datos en vivo debe ser usuario/nombre (Conexión con el servidor).');
    const lists = [['Guía', s.guia.secciones], ['Cambios', s.jugabilidad.etapas], ['Dimensiones', s.jugabilidad.dimensiones], ['Jefes', s.jugabilidad.jefes]];
    for (const [area, arr] of lists) {
      const seen = new Set();
      arr.forEach((x, i) => {
        if (!x.titulo.trim()) problems.push(`${area}: el elemento #${i + 1} no tiene título.`);
        if (!/^[a-z0-9-]+$/.test(x.id)) problems.push(`${area}: la dirección de “${x.titulo}” solo puede tener minúsculas, números y guiones.`);
        if (seen.has(x.id)) problems.push(`${area}: hay dos con la dirección “${x.id}”.`);
        seen.add(x.id);
      });
    }
  }
  const a = next.anuncios;
  if (a) {
    const seen = new Set();
    a.anuncios.forEach((x, i) => {
      if (!x.titulo.trim()) problems.push(`Anuncios: el #${i + 1} no tiene título.`);
      if (Number.isNaN(new Date(x.fecha).getTime())) problems.push(`Anuncios: “${x.titulo}” no tiene una fecha válida.`);
      if (seen.has(x.id)) problems.push(`Anuncios: hay dos con la dirección “${x.id}”.`);
      seen.add(x.id);
    });
  }
  return problems;
}

function diffList(out, area, A, B, key, name) {
  const ai = new Map(A.map((x) => [x[key], x]));
  const bi = new Map(B.map((x) => [x[key], x]));
  for (const x of B) if (!ai.has(x[key])) out.push({ area, kind: 'add', text: `Añadido: ${name(x)}` });
  for (const x of A) if (!bi.has(x[key])) out.push({ area, kind: 'del', text: `Eliminado: ${name(x)}` });
  for (const x of B) {
    const o = ai.get(x[key]);
    if (o && !same(o, x)) out.push({ area, kind: 'mod', text: `Editado: ${name(x)}` });
  }
  const orderA = A.map((x) => x[key]).filter((k) => bi.has(k)).join('|');
  const orderB = B.map((x) => x[key]).filter((k) => ai.has(k)).join('|');
  if (orderA !== orderB) out.push({ area, kind: 'mod', text: 'Nuevo orden' });
}

function summarize(docs, next) {
  const out = [];
  const push = (area, text, kind = 'mod') => out.push({ area, text, kind });
  for (const d of docs) {
    const A = S.published[d];
    const B = next[d];
    if (d === 'sitio') {
      const areas = { general: 'General', inicio: 'Inicio', misiones: 'Misiones', launcher: 'Launcher', jugadores: 'Jugadores', anuncios: 'Anuncios', footer: 'Pie de página' };
      for (const [k, area] of Object.entries(areas)) if (!same(A[k], B[k])) push(area, 'Textos y opciones');
      if (A.guia.intro !== B.guia.intro) push('Guía', 'Introducción');
      diffList(out, 'Guía', A.guia.secciones, B.guia.secciones, 'id', (x) => x.titulo);
      if (A.jugabilidad.intro !== B.jugabilidad.intro) push('Jugabilidad', 'Introducción');
      diffList(out, 'Cambios', A.jugabilidad.etapas, B.jugabilidad.etapas, 'id', (x) => x.titulo);
      diffList(out, 'Dimensiones', A.jugabilidad.dimensiones, B.jugabilidad.dimensiones, 'id', (x) => x.titulo);
      diffList(out, 'Jefes', A.jugabilidad.jefes, B.jugabilidad.jefes, 'id', (x) => x.titulo);
    } else if (d === 'juego') {
      const ai = A.items;
      const bi = B.items;
      const label = (id, it) => (it?.nombre ? it.nombre.replace(/[§&]x([§&][0-9a-f]){6}|[§&][0-9a-fk-or]/gi, '') : id);
      for (const id of Object.keys(bi)) {
        if (!ai[id]) push('Items', `Añadido: ${label(id, bi[id])}`, 'add');
        else if (!same(ai[id], bi[id])) push('Items', `Editado: ${label(id, bi[id])}`);
      }
      for (const id of Object.keys(ai)) if (!bi[id]) push('Items', `Eliminado: ${label(id, ai[id])}`, 'del');
      diffList(out, 'Misiones', A.misiones, B.misiones, 'n', (x) => `#${x.n} ${x.nombre}`);
      diffList(out, 'Crafteos', A.recetas, B.recetas, 'id', (x) => x.id);
      diffList(out, 'Mobs', A.mobs, B.mobs, 'id', (x) => x.nombre);
      for (const k of ['trabajos', 'habilidades', 'costosHabilidad', 'rangos', 'pesca', 'idioma']) if (!same(A[k], B[k])) push('Juego', k);
    } else {
      if (!same(A.categorias, B.categorias)) push('Anuncios', 'Categorías');
      diffList(out, 'Anuncios', A.anuncios, B.anuncios, 'id', (x) => x.titulo);
    }
  }
  // Las listas muy largas se resumen
  if (out.length > 60) {
    const byArea = new Map();
    for (const c of out) byArea.set(c.area, (byArea.get(c.area) || 0) + 1);
    return [...byArea].map(([area, n]) => ({ area, kind: 'mod', text: `${n} cambios` }));
  }
  return out;
}

function commitTitle(changes) {
  const areas = [...new Set(changes.map((c) => c.area))];
  const text = `Panel: actualiza ${areas.join(', ') || 'la web'}`;
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
}

function publish() {
  if (S.publishing || modal.isOpen) return;
  const docs = dirtyDocs();
  if (!docs.length) { toast('No hay cambios para publicar.'); return; }
  const next = Object.fromEntries(docs.map((d) => [d, NORMALIZE[d](S.draft[d])]));
  const problems = validate(next);
  if (problems.length) {
    modal.open(`<div class="confirm">
      <div class="confirm__icon is-danger">${icon('alert')}</div>
      <h2 class="confirm__title" id="modal-title">Revisa esto antes de publicar</h2>
      <ul class="problems">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <div class="modal__actions"><button class="btn btn--primary" type="button" data-close>Entendido</button></div>
    </div>`, { size: 'sm' });
    return;
  }
  const changes = summarize(docs, next);
  const images = usedUploads(next).length;
  const c = modal.open(`<div class="publish">
    <h2 class="publish__title" id="modal-title">Publicar cambios</h2>
    <p class="publish__text">Se guardará una nueva versión en GitHub${images ? ` junto con <b>${images} ${images === 1 ? 'imagen nueva' : 'imágenes nuevas'}</b>` : ''}. La web se actualiza para todo el mundo en 1-2 minutos.</p>
    <ul class="changes">${(changes.length ? changes : [{ area: 'Web', kind: 'mod', text: 'Ajustes' }]).map((ch) => `<li class="change change--${ch.kind}"><b>${esc(ch.area)}</b><span>${esc(ch.text)}</span></li>`).join('')}</ul>
    <label class="field"><span class="field__label">Descripción del cambio (queda en el historial)</span><input class="input" id="commit-msg" maxlength="100" value="${esc(commitTitle(changes))}"></label>
    <div class="modal__actions"><button class="btn btn--ghost" type="button" data-close>Cancelar</button><button class="btn btn--primary" type="button" id="do-publish">${icon('upload')} Publicar ahora</button></div>
  </div>`, { size: 'lg' });
  c.querySelector('#do-publish').addEventListener('click', () => {
    const msg = c.querySelector('#commit-msg').value.trim() || commitTitle(changes);
    runPublish(docs, next, changes, msg);
  });
}

// Las imágenes pendientes que de verdad se usan en algún documento
function usedUploads(next) {
  const text = Object.values(next).map((d) => JSON.stringify(d)).join('\n');
  return [...S.pending].filter(([path]) => text.includes(path));
}

async function runPublish(docs, next, changes, message, { force = false } = {}) {
  S.publishing = true;
  updateStatus();
  modal.setLocked(true);
  const c = modal.open(`<div class="publish">
    <h2 class="publish__title" id="modal-title">Publicando…</h2>
    <ol class="steps">
      <li class="step" data-step="1"><span class="step__dot"></span><div class="step__text"><strong>Preparando imágenes y contenido</strong><small></small></div></li>
      <li class="step" data-step="2"><span class="step__dot"></span><div class="step__text"><strong>Guardando la nueva versión en GitHub</strong><small></small></div></li>
      <li class="step" data-step="3"><span class="step__dot"></span><div class="step__text"><strong>Actualizando la web</strong><small>Suele tardar menos de dos minutos.</small></div></li>
    </ol>
    <div id="publish-result"></div>
  </div>`, { size: 'lg', lock: true });
  const ui = c.querySelector('.publish');
  const step = (n, state, text) => {
    const el = ui.querySelector(`[data-step="${n}"]`);
    if (!el) return;
    el.className = `step is-${state}`;
    if (text !== undefined) el.querySelector('small').textContent = text;
  };
  const setTitle = (text) => { ui.querySelector('.publish__title').textContent = text; };
  const result = (html, isError = false) => { ui.querySelector('#publish-result').innerHTML = `<div class="publish__result${isError ? ' is-error' : ''}">${html}</div>`; };

  let committed = false;
  try {
    step(1, 'active');
    const files = [];
    const used = usedUploads(next);
    for (const [path, dataUrl] of used) files.push({ path, content: dataUrl.slice(dataUrl.indexOf(',') + 1), encoding: 'base64' });
    const stamp = new Date().toISOString();
    const content = {};
    for (const d of docs) {
      content[d] = deepClone(next[d]);
      content[d].meta = { ...content[d].meta, version: (S.published[d].meta?.version || 1) + 1, updatedAt: stamp, updatedBy: S.user.login };
      files.push({ path: CONFIG.docs[d], content: `${JSON.stringify(content[d], null, 1)}\n`, encoding: 'utf-8' });
    }
    step(1, 'done', `${used.length ? `${used.length} ${used.length === 1 ? 'imagen' : 'imágenes'} + ` : ''}${docs.map((d) => DOC_NAME[d].toLowerCase()).join(', ')}`);

    step(2, 'active', 'Subiendo archivos…');
    const body = changes.slice(0, 40).map((ch) => `- ${ch.area}: ${ch.text}`).join('\n');
    const { commit, shas } = await S.gh.commitFiles({
      files,
      message: `${message}\n\n${body}`,
      expect: force ? null : docs.map((d) => ({ path: CONFIG.docs[d], sha: S.shas[d] })),
      onProgress: (n, t) => step(2, 'active', `Subiendo archivos… ${n}/${t}`),
    });
    committed = true;
    step(2, 'done', `Versión ${commit.sha.slice(0, 7)} guardada`);

    const cache = (await idb.get(UPLOADS_KEY)) || {};
    for (const [path, dataUrl] of used) {
      S.uploads.set(path, dataUrl);
      cache[path] = { d: dataUrl, t: Date.now() };
    }
    if (used.length) idb.set(UPLOADS_KEY, cache);
    S.pending.clear();
    for (const d of docs) {
      S.published[d] = NORMALIZE[d](content[d]);
      S.publishedJson[d] = JSON.stringify(S.published[d]);
      S.shas[d] = shas[CONFIG.docs[d]];
      S.draft[d] = deepClone(S.published[d]);
    }
    S.edit = null;
    await idb.del(DRAFT_KEY);
    S.publishing = false;
    S.rev++;
    renderTabs();
    renderWorkspace();
    updateStatus();
    broadcast(DOCS);
    modal.setLocked(false);

    step(3, 'active', 'Esperando a que la web se actualice… (puedes cerrar esta ventana y seguir editando)');
    const live = await waitForDeploy(CONFIG.docs[docs[0]], stamp, (secs) => step(3, 'active', `Esperando a la web… ${secs} s (puedes cerrar esta ventana)`));
    if (!ui.isConnected) {
      toast(live ? '¡Tus cambios ya están en la web!' : 'Guardado en GitHub; la web se actualizará en unos minutos.', { type: 'success', timeout: 4000 });
      return;
    }
    if (live) {
      step(3, 'done', 'La web ya muestra los cambios');
      setTitle('¡Publicado!');
      result(`<p>${icon('check')} <span>Tus cambios ya están en la web para todo el mundo.</span></p>
        <div class="modal__actions"><button class="btn btn--ghost" type="button" data-close>Cerrar</button><a class="btn btn--primary" href="${esc(SITE_ROOT)}" target="_blank" rel="noopener">${icon('external')} Ver la web</a></div>`);
    } else {
      step(3, 'done', 'GitHub sigue desplegando');
      setTitle('Guardado en GitHub');
      result(`<p>${icon('info')} <span>La versión está guardada. La web está tardando más de lo normal; los cambios aparecerán en unos minutos.</span></p>
        <div class="modal__actions"><button class="btn btn--primary" type="button" data-close>Cerrar</button></div>`);
    }
  } catch (err) {
    S.publishing = false;
    updateStatus();
    modal.setLocked(false);
    if (err.conflict && !committed) {
      modal.open(`<div class="confirm">
        <div class="confirm__icon is-danger">${icon('alert')}</div>
        <h2 class="confirm__title" id="modal-title">La web cambió mientras editabas</h2>
        <p class="confirm__text">Se publicó otra versión (quizá desde otro dispositivo) después de abrir el panel. Puedes cargar esa versión (perderás tu borrador) o sobrescribirla con tus cambios.</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" type="button" data-close>Cancelar</button>
          <button class="btn" type="button" id="c-reload">${icon('refresh')} Cargar la versión nueva</button>
          <button class="btn btn--danger" type="button" id="c-force">${icon('upload')} Sobrescribir</button>
        </div>
      </div>`, { size: 'sm' });
      $('#c-reload').addEventListener('click', async () => {
        modal.close();
        try { await loadRemote(); S.pendingDraft = null; S.edit = null; await idb.del(DRAFT_KEY); refresh(DOCS); toast('Versión más reciente cargada', { type: 'success' }); }
        catch (e2) { toast(explainError(e2), { type: 'error' }); }
      });
      $('#c-force').addEventListener('click', () => runPublish(docs, next, changes, message, { force: true }));
      return;
    }
    if (!ui.isConnected) { toast(explainError(err), { type: 'error', timeout: 6000 }); return; }
    const failed = ui.querySelector('.step.is-active');
    if (failed) failed.className = 'step is-error';
    setTitle('No se pudo publicar');
    result(`<p>${icon('alert')} <span>${esc(explainError(err))}</span></p>
      <p class="muted">Tu borrador sigue guardado; no se ha perdido nada.</p>
      <div class="modal__actions"><button class="btn btn--primary" type="button" data-close>Cerrar</button></div>`, true);
  }
}

async function waitForDeploy(path, stamp, onTick) {
  if (pruebaLocal) { await sleep(1500); return true; }
  const url = new URL(path, SITE_ROOT).href;
  const t0 = Date.now();
  while (Date.now() - t0 < 5 * 60 * 1000) {
    await sleep(6000);
    onTick?.(Math.round((Date.now() - t0) / 1000));
    try {
      const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.meta?.updatedAt === stamp) return true;
      }
    } catch { /* la web aún no responde */ }
  }
  return false;
}

// ---------------------------------------------------------------- historial y copias

async function loadHistory() {
  const box = $('#history-list');
  if (!box) return;
  box.innerHTML = '<p class="muted">Cargando…</p>';
  try {
    const commits = await S.gh.history('data', 20);
    if (!$('#history-list')) return;
    box.innerHTML = historyHtml(commits);
  } catch (err) {
    box.innerHTML = `<p class="form-error">${esc(explainError(err))}</p>`;
  }
}

async function restoreVersion(sha) {
  if (!/^[0-9a-f]{7,40}$/i.test(sha || '')) return;
  const ok = await confirmDialog(modal, { title: '¿Cargar esta versión?', text: 'Se cargará en el borrador para que la revises. No cambia la web hasta que pulses “Publicar”.', ok: 'Cargar versión' });
  if (!ok) return;
  try {
    let loaded = 0;
    for (const d of DOCS) {
      try {
        const { text } = await S.gh.getText(CONFIG.docs[d], sha);
        S.draft[d] = NORMALIZE[d](JSON.parse(text));
        loaded++;
      } catch (err) {
        if (err?.status !== 404) throw err;
      }
    }
    S.edit = null;
    refresh(DOCS);
    toast(loaded ? 'Versión cargada en el borrador. Revísala y pulsa Publicar.' : 'Esa versión no tiene contenido para cargar.', { type: loaded ? 'success' : 'error' });
  } catch (err) {
    toast(explainError(err), { type: 'error' });
  }
}

function exportJSON() {
  const data = { formato: 'croissants-web', exportado: new Date().toISOString() };
  for (const d of DOCS) data[d] = NORMALIZE[d](S.draft[d]);
  if (S.pending.size) data.imagenesPendientes = Object.fromEntries(S.pending);
  const blob = new Blob([`${JSON.stringify(data, null, 1)}\n`], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `croissants-web-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

async function importJSON(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const found = {};
    if (data.sitio || data.juego || data.anuncios) Object.assign(found, data.sitio ? { sitio: data.sitio } : {}, data.juego ? { juego: data.juego } : {}, data.anuncios ? { anuncios: data.anuncios } : {});
    else if (data.general) found.sitio = data;
    else if (data.items) found.juego = data;
    else if (Array.isArray(data.anuncios)) found.anuncios = data;
    const names = Object.keys(found);
    if (!names.length) throw new Error('formato');
    const ok = await confirmDialog(modal, { title: '¿Importar este archivo?', text: `Reemplaza en tu borrador: ${names.map((d) => DOC_NAME[d]).join(', ')}. No se publica hasta que pulses “Publicar”.`, ok: 'Importar' });
    if (!ok) return;
    for (const d of names) S.draft[d] = NORMALIZE[d](found[d]);
    for (const [p, v] of Object.entries(data.imagenesPendientes || {})) if (typeof v === 'string' && v.startsWith('data:image/')) S.pending.set(p, v);
    S.edit = null;
    refresh(names);
    toast('Archivo importado al borrador', { type: 'success' });
  } catch {
    toast('El archivo no es una copia válida de la web.', { type: 'error' });
  }
}

export { getPath };

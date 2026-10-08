// Panel: estado compartido, rutas a los datos y los campos de los formularios.
// Cada campo lleva data-path="doc:ruta.al.valor" (doc = sitio, juego o anuncios) y main.js guarda lo que se escribe
// directo en el borrador.
import { CONFIG } from '../config.js';
import {
  normalizeSitio, normalizeJuego, normalizeAnuncios, mergeCatalog, escapeHtml, icon, safeImage, slugify, ICON_NAMES,
} from '../core.js';

export const REPO_KEY = `${CONFIG.owner}/${CONFIG.repo}`;
export const SITE_ROOT = new URL('../', location.href).href;
export const DOCS = ['sitio', 'juego', 'anuncios'];
export const DOC_NAME = { sitio: 'Textos de la web', juego: 'Datos del juego', anuncios: 'Anuncios' };
export const NORMALIZE = { sitio: normalizeSitio, juego: normalizeJuego, anuncios: normalizeAnuncios };
export const INVALID = Symbol('invalido');

export const S = {
  gh: null,
  user: null,
  published: {},
  publishedJson: {},
  shas: {},
  draft: {},
  pending: new Map(), // ruta en assets/uploads -> dataURL de las imágenes subidas que todavía no se publicaron
  uploads: new Map(), // las recién publicadas, mientras la web se actualiza
  catalogo: null,
  catalogoEstado: '',
  tab: 'general',
  sub: { items: 'items' },
  edit: null,
  filters: { q: '', cat: '', tipo: 'todas' },
  publishing: false,
  rev: 0,
  live: null,
};

export const esc = escapeHtml;

// Una sola lista de íconos para todos los campos de ícono (sugerencias al escribir)
export function ensureIconList() {
  if (document.getElementById('icon-list')) return;
  const dl = document.createElement('datalist');
  dl.id = 'icon-list';
  dl.innerHTML = ICON_NAMES.map((n) => `<option value="${n}">`).join('');
  document.body.appendChild(dl);
}

// ------------------------------------------------------------------ rutas

export function splitPath(p) {
  const i = p.indexOf(':');
  return [p.slice(0, i), p.slice(i + 1)];
}

export const getPath = (o, path) => (path ? path.split('.').reduce((a, k) => (a == null ? a : a[k]), o) : o);

export function setPath(o, path, v) {
  const keys = path.split('.');
  const last = keys.pop();
  let t = o;
  keys.forEach((k, i) => {
    if (t[k] == null || typeof t[k] !== 'object') t[k] = /^\d+$/.test(keys[i + 1] ?? last) ? [] : {};
    t = t[k];
  });
  t[last] = v;
}

export const getAt = (p) => { const [d, path] = splitPath(p); return getPath(S.draft[d], path); };
export const setAt = (p, v) => { const [d, path] = splitPath(p); setPath(S.draft[d], path, v); };
export const docOf = (p) => splitPath(p)[0];
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Los datos del juego como los ve la web: data/juego.json con el catálogo del plugin encima
let gameCache = { rev: -1, data: null };
export function game() {
  if (gameCache.rev !== S.rev || !gameCache.data) gameCache = { rev: S.rev, data: normalizeJuego(mergeCatalog(S.draft.juego, S.catalogo)) };
  return gameCache.data;
}

// Imagen para mostrar dentro del panel (vive en /admin/)
export function imgSrc(value) {
  const s = safeImage(value);
  if (!s) return '';
  if (s.startsWith('data:') || /^https:/i.test(s)) return s;
  return S.pending.get(s) || S.uploads.get(s) || new URL(s, SITE_ROOT).href;
}

// Las texturas y las imágenes relativas se resuelven desde la raíz de la web (mc.js)
export function resolveAsset(u) {
  if (!u || /^(data:|https?:|blob:)/i.test(u)) return u;
  return S.pending.get(u) || S.uploads.get(u) || new URL(u, SITE_ROOT).href;
}

// ------------------------------------------------------------------ piezas de la página

export const wsHead = (title, text = '', extra = '') => `<header class="ws-head">
  <div class="ws-head__top"><h1 class="ws-head__title">${esc(title)}</h1>${extra}</div>
  ${text ? `<p class="ws-head__text">${text}</p>` : ''}
</header>`;

export const card = (title, ic, body, { extra = '', cls = '', count } = {}) => `<section class="card-panel${cls ? ` ${cls}` : ''}">
  ${title ? `<div class="list-head"><h2 class="card-panel__title">${icon(ic || 'sparkle')} ${esc(title)}${count != null ? ` <small>${count}</small>` : ''}</h2>${extra}</div>` : ''}
  ${body}
</section>`;

const hintHtml = (hint) => (hint ? `<span class="field__hint">${hint}</span>` : '');
const labelHtml = (label, required) => `<span class="field__label">${esc(label)}${required ? ' <em>*</em>' : ''}</span>`;

export function fText(p, label, { placeholder = '', hint = '', type = 'text', kind = '', maxlength = 300, required = false, mono = false, list = '' } = {}) {
  const v = getAt(p) ?? '';
  return `<label class="field">
    ${labelHtml(label, required)}
    <input class="input${mono ? ' mono' : ''}" type="${type}" data-path="${esc(p)}"${kind ? ` data-kind="${kind}"` : ''} value="${esc(v)}" placeholder="${esc(placeholder)}" maxlength="${maxlength}"${type === 'url' ? ' inputmode="url" spellcheck="false"' : ''}${list ? ` list="${list}"` : ''}>
    ${hintHtml(hint)}
  </label>`;
}

export function fArea(p, label, { rows = 4, hint = '', placeholder = '', maxlength = 20000, kind = '' } = {}) {
  let v = getAt(p) ?? '';
  if (kind === 'lines' || kind === 'lines-raw') v = (Array.isArray(v) ? v : []).join('\n');
  return `<label class="field">
    ${labelHtml(label)}
    <textarea class="input textarea${kind === 'lines-raw' ? ' textarea--code' : ''}" rows="${rows}" data-path="${esc(p)}"${kind ? ` data-kind="${kind}"` : ''} maxlength="${maxlength}" placeholder="${esc(placeholder)}">${esc(v)}</textarea>
    ${hintHtml(hint)}
  </label>`;
}

export function fNum(p, label, { min = '', max = '', step = 1, hint = '' } = {}) {
  const v = getAt(p);
  return `<label class="field">
    ${labelHtml(label)}
    <input class="input" type="number" data-path="${esc(p)}" data-kind="num" value="${esc(v ?? '')}"${min !== '' ? ` min="${min}"` : ''}${max !== '' ? ` max="${max}"` : ''} step="${step}">
    ${hintHtml(hint)}
  </label>`;
}

export function fCheck(p, label, { hint = '', invert = false } = {}) {
  const v = Boolean(getAt(p));
  const on = invert ? !v : v;
  return `<div class="field"><label class="check"><input type="checkbox" data-path="${esc(p)}" data-kind="${invert ? 'check-inv' : 'check'}"${on ? ' checked' : ''}><span>${esc(label)}</span></label>${hintHtml(hint)}</div>`;
}

export function fSelect(p, label, options, { hint = '', num = false } = {}) {
  const v = getAt(p);
  return `<label class="field">
    ${labelHtml(label)}
    <select class="input select" data-path="${esc(p)}"${num ? ' data-kind="num"' : ''}>${options.map(([k, t]) => `<option value="${esc(k)}"${String(k) === String(v ?? '') ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
    ${hintHtml(hint)}
  </label>`;
}

export function fColor(p, label, { hint = '' } = {}) {
  const v = getAt(p) || '#9d7bff';
  const hex = /^#[0-9a-f]{6}$/i.test(v) ? v : '#9d7bff';
  return `<div class="field">
    ${labelHtml(label)}
    <div class="color-field">
      <input type="color" value="${esc(hex)}" data-color-for="${esc(p)}" aria-label="${esc(label)}">
      <input class="input mono" type="text" data-path="${esc(p)}" data-kind="color" value="${esc(v)}" maxlength="9" spellcheck="false">
    </div>
    ${hintHtml(hint)}
  </div>`;
}

export function fIcon(p, label, { hint = '' } = {}) {
  const v = getAt(p) || 'sparkle';
  return `<div class="field">
    ${labelHtml(label)}
    <div class="icon-field">
      <button class="icon-field__preview" type="button" data-act="icon-pick" data-path="${esc(p)}" title="Elegir ícono">${icon(v)}</button>
      <input class="input mono" type="text" data-path="${esc(p)}" data-kind="icon" value="${esc(v)}" list="icon-list" maxlength="40" spellcheck="false">
    </div>
    ${hintHtml(hint)}
  </div>`;
}

export function fDate(p, label, { hint = '', type = 'datetime-local' } = {}) {
  const v = getAt(p) || '';
  let value = '';
  if (v) {
    const d = new Date(type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      value = type === 'date' ? day : `${day}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  return `<label class="field">
    ${labelHtml(label)}
    <input class="input" type="${type}" data-path="${esc(p)}" data-kind="${type === 'date' ? 'date' : 'datetime'}" value="${value}">
    ${hintHtml(hint)}
  </label>`;
}

// Imagen con vista previa: subir (se optimiza sola), poner una URL o quitarla
export function fImage(p, label, { hint = '', kind = 'cover', name = 'imagen' } = {}) {
  const v = getAt(p) || '';
  const src = imgSrc(v);
  const cls = kind === 'pixel' ? ' imgfield__preview--pixel' : kind === 'wide' ? ' imgfield__preview--wide' : '';
  return `<div class="field imgfield" data-img="${esc(p)}" data-img-kind="${kind}" data-img-name="${esc(slugify(name))}">
    ${labelHtml(label)}
    <div class="imgfield__preview${cls}">${src ? `<img src="${esc(src)}" alt="">` : `<span>${icon('image')} Sin imagen</span>`}</div>
    <div class="imgfield__actions">
      <label class="btn btn--sm">${icon('upload')} Subir<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" data-upload hidden></label>
      <button class="btn btn--sm btn--ghost" type="button" data-act="img-url">${icon('link')} URL</button>
      <button class="btn btn--sm btn--ghost" type="button" data-act="img-clear"${v ? '' : ' disabled'}>${icon('trash')} Quitar</button>
    </div>
    ${hintHtml(hint)}
  </div>`;
}

const MD_BUTTONS = [
  ['bold', '<b>B</b>', 'Negrita'], ['italic', '<i>I</i>', 'Cursiva'], ['h2', 'T1', 'Título'], ['h3', 'T2', 'Subtítulo'],
  ['ul', icon('menu'), 'Lista'], ['ol', '1.', 'Lista numerada'], ['sep'],
  ['tip', icon('sparkle'), 'Consejo'], ['warn', icon('alert'), 'Aviso importante'], ['link', icon('link'), 'Enlace'],
  ['image', icon('image'), 'Subir imagen'], ['table', icon('grid'), 'Tabla'], ['sep'],
  ['item', icon('cube'), 'Item del juego'], ['mision', icon('scroll'), 'Misión'], ['cmd', icon('terminal'), 'Comando'],
  ['bloque', `${icon('layers')}<span>Bloques</span>`, 'Recetas, trabajos, mobs...'], ['sep'],
  ['preview', `${icon('eye')}<span>Ver</span>`, 'Vista previa del texto'],
];

// Texto largo con formato: barra de herramientas, vista previa y los atajos de la web ([[item:...]], [[cmd:...]]...)
export function fMd(p, label, { rows = 12, hint = '' } = {}) {
  const v = getAt(p) ?? '';
  return `<div class="field">
    ${labelHtml(label)}
    <div class="mdx" data-mdx="${esc(p)}">
      <div class="mdx__bar" role="toolbar" aria-label="Formato">${MD_BUTTONS.map(([k, html, title]) => (k === 'sep' ? '<span class="mdx__sep"></span>' : `<button class="mdx__btn" type="button" data-md="${k}" title="${esc(title)}" aria-label="${esc(title)}">${html}</button>`)).join('')}</div>
      <textarea class="input textarea" rows="${rows}" data-path="${esc(p)}">${esc(v)}</textarea>
      <div class="mdx__preview md" hidden></div>
    </div>
    ${hintHtml(hint || 'Deja una línea en blanco entre párrafos. <b>## Título</b>, <b>**negrita**</b>, <b>- lista</b>. Los botones agregan items con su tooltip, comandos que se copian y bloques como las recetas.')}
  </div>`;
}

// Lista dentro de la página (pasos, destacados, días del calendario...): cada elemento con sus campos
export function repeater(p, { title, tpl, add = 'Añadir', render, empty = 'Todavía no hay nada.' }) {
  const arr = Array.isArray(getAt(p)) ? getAt(p) : [];
  return `<div class="repeater" data-rep="${esc(p)}">
    ${arr.length ? arr.map((x, i) => `<div class="rep-item">
      <div class="rep-item__head">
        <span class="rep-item__num">${esc(title(x, i))}</span>
        <div class="rep-item__actions">
          <button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="arr-up" data-path="${esc(p)}" data-index="${i}" title="Subir" aria-label="Subir"${i === 0 ? ' disabled' : ''}>${icon('up')}</button>
          <button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="arr-down" data-path="${esc(p)}" data-index="${i}" title="Bajar" aria-label="Bajar"${i === arr.length - 1 ? ' disabled' : ''}>${icon('down')}</button>
          <button class="btn btn--sm btn--icon btn--danger" type="button" data-act="arr-del" data-path="${esc(p)}" data-index="${i}" title="Quitar" aria-label="Quitar">${icon('trash')}</button>
        </div>
      </div>
      ${render(`${p}.${i}`, x, i)}
    </div>`).join('') : `<p class="muted">${esc(empty)}</p>`}
    <div><button class="btn btn--sm btn--ghost" type="button" data-act="arr-add" data-path="${esc(p)}" data-tpl="${tpl}">${icon('plus')} ${esc(add)}</button></div>
  </div>`;
}

// Lista de cosas que se editan en su propia página (secciones de la guía, jefes, anuncios...)
export function rowsHtml(listId, entries, { sortable = true, empty = 'Todavía no hay nada aquí. Pulsa “Añadir”.' } = {}) {
  if (!entries.length) return `<div class="empty">${icon('sparkle')}<p>${esc(empty)}</p></div>`;
  return `<ul class="rows" data-rows="${listId}">${entries.map((e, k) => `<li class="row${e.hidden ? ' is-hidden' : ''}"${sortable ? ' draggable="true"' : ''} data-list="${listId}" data-index="${e.index}">
    ${sortable ? `<span class="row__handle" title="Arrastra para ordenar">${icon('drag')}</span>` : ''}
    <span class="row__thumb${e.wide ? ' row__thumb--wide' : ''}"${e.color ? ` style="--c:${esc(e.color)}"` : ''}>${e.thumb || icon('sparkle')}</span>
    <div class="row__main">
      <strong class="row__title">${e.titleHtml || esc(e.title)}</strong>
      <span class="row__meta">${(e.meta || []).filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('')}${(e.flags || []).join('')}</span>
    </div>
    <div class="row__actions">
      ${sortable ? `<button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="row-up" title="Subir" aria-label="Subir"${k === 0 ? ' disabled' : ''}>${icon('up')}</button>
      <button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="row-down" title="Bajar" aria-label="Bajar"${k === entries.length - 1 ? ' disabled' : ''}>${icon('down')}</button>` : ''}
      ${e.noToggle ? '' : `<button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="row-toggle" title="${e.hidden ? 'Mostrar en la web' : 'Ocultar de la web'}" aria-label="${e.hidden ? 'Mostrar en la web' : 'Ocultar de la web'}">${icon(e.hidden ? 'eyeOff' : 'eye')}</button>`}
      ${e.noDup ? '' : `<button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="row-dup" title="Duplicar" aria-label="Duplicar">${icon('copy')}</button>`}
      <button class="btn btn--sm" type="button" data-act="row-edit">${icon('edit')}<span>Editar</span></button>
      ${e.noDelete ? '' : `<button class="btn btn--sm btn--icon btn--danger" type="button" data-act="row-del" title="Eliminar" aria-label="Eliminar">${icon('trash')}</button>`}
    </div>
  </li>`).join('')}</ul>`;
}

// ------------------------------------------------------------------ valores de los campos

export function readValue(el) {
  const kind = el.dataset.kind || '';
  const raw = el.value;
  switch (kind) {
    case 'num': {
      if (raw === '') return 0;
      const n = Number(raw);
      return Number.isFinite(n) ? n : INVALID;
    }
    case 'check': return el.checked;
    case 'check-inv': return !el.checked;
    case 'lines': return raw.split('\n').map((s) => s.trim()).filter(Boolean);
    case 'lines-raw': return raw.split('\n');
    case 'csv': return raw.split(',').map((s) => s.trim()).filter(Boolean);
    case 'json':
      try { return JSON.parse(raw); } catch { return INVALID; }
    case 'date': return raw || '';
    case 'datetime': {
      if (!raw) return '';
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? INVALID : d.toISOString();
    }
    case 'color': return /^#[0-9a-f]{3,8}$/i.test(raw.trim()) || !raw.trim() ? raw.trim() : INVALID;
    default: return raw;
  }
}

// ------------------------------------------------------------------ imágenes

const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/avif': 'avif' };

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen. Prueba con PNG o JPG.'));
    img.src = src;
  });
}

// Optimiza la imagen antes de subirla. kind: cover (fotos y portadas), pixel (texturas de 16x16, sin suavizar),
// shot (capturas de los menús)
export async function processImage(file, kind = 'cover') {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (file.size > 20 * 1024 * 1024) throw new Error('La imagen pesa más de 20 MB.');
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);
  const w0 = img.naturalWidth;
  const h0 = img.naturalHeight;
  if (file.type === 'image/gif') {
    if (file.size > 3 * 1024 * 1024) throw new Error('Los GIF animados deben pesar menos de 3 MB.');
    return { dataUrl: original, width: w0, height: h0, bytes: file.size };
  }
  if (kind === 'pixel') {
    // Las texturas se dejan tal cual si son chicas: así no pierden ni un pixel
    if (w0 <= 512 && h0 <= 512 && file.size < 1024 * 1024 && /png|webp/.test(file.type)) return { dataUrl: original, width: w0, height: h0, bytes: file.size };
    const scale = Math.min(1, 256 / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    return { dataUrl, width: canvas.width, height: canvas.height, bytes: Math.round((dataUrl.length * 3) / 4) };
  }
  const max = kind === 'shot' ? 1800 : 1600;
  const scale = Math.min(1, max / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w0 * scale));
  canvas.height = Math.max(1, Math.round(h0 * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let dataUrl = canvas.toDataURL('image/webp', 0.86);
  if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
  return { dataUrl, width: canvas.width, height: canvas.height, bytes: Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4) };
}

// Guarda la imagen como pendiente con la ruta que tendrá en el repositorio; se sube al publicar
export function addPending(dataUrl, name) {
  const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const path = `${CONFIG.uploadsDir}/${slugify(name || 'imagen')}-${stamp}.${EXT[mime] || 'png'}`;
  S.pending.set(path, dataUrl);
  return path;
}

export const fmtKB = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
}

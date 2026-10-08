// Panel: cada pestaña y cada editor como HTML. Los campos se guardan solos (main.js escucha data-path).
import {
  S, esc, getAt, game, imgSrc, wsHead, card, fText, fArea, fNum, fCheck, fSelect, fColor, fIcon, fDate, fImage, fMd,
  repeater, rowsHtml, REPO_KEY, fmtDateTime,
} from './kit.js';
import { icon, SOCIAL_TYPES, plainText, fmtDate, slugify } from '../core.js';
import { itemHtml, tooltipHtml, itemLabel, legacyHtml, recipeHtml, recipeTitle, chestHtml, resolveRef, stripCodes } from '../mc.js';
import { CATEGORIAS, DIF, TIPO } from '../components.js';

// ------------------------------------------------------------------ pestañas, listas y plantillas

export const TABS = [
  { sep: 'Web' },
  { id: 'general', label: 'General', icon: 'sliders' },
  { id: 'inicio', label: 'Página de inicio', icon: 'home' },
  { id: 'guia', label: 'Guía', icon: 'book', count: () => S.draft.sitio.guia.secciones.length },
  { id: 'jugabilidad', label: 'Cambios y jugabilidad', icon: 'layers' },
  { id: 'anuncios', label: 'Anuncios', icon: 'megaphone', count: () => S.draft.anuncios.anuncios.length },
  { id: 'paginas', label: 'Otras páginas', icon: 'file' },
  { sep: 'Juego (sale del plugin)' },
  { id: 'misiones', label: 'Misiones', icon: 'scroll', count: () => game().misiones.length },
  { id: 'items', label: 'Items, mobs y crafteos', icon: 'cube', count: () => Object.keys(game().items).length },
  { sep: 'Servidor y versiones' },
  { id: 'servidor', label: 'Conexión con el servidor', icon: 'server' },
  { id: 'historial', label: 'Historial y copias', icon: 'history' },
];

export const LISTS = {
  guia: { path: 'sitio:guia.secciones', tpl: 'seccion', label: 'sección', editor: 'seccion', route: (x) => `guia/${x.id}` },
  etapas: { path: 'sitio:jugabilidad.etapas', tpl: 'etapa', label: 'cambio', editor: 'etapa', route: (x) => `jugabilidad/cambios/${x.id}` },
  dimensiones: { path: 'sitio:jugabilidad.dimensiones', tpl: 'dimension', label: 'dimensión', editor: 'dimension', route: (x) => `jugabilidad/dimensiones/${x.id}` },
  jefes: { path: 'sitio:jugabilidad.jefes', tpl: 'jefe', label: 'jefe', editor: 'jefe', route: (x) => `jugabilidad/jefes/${x.id}` },
  anuncios: { path: 'anuncios:anuncios', tpl: 'anuncio', label: 'anuncio', editor: 'anuncio', route: (x) => `anuncios/${x.id}`, sortable: false },
};

export const TEMPLATES = {
  paso: () => ({ icono: 'sparkle', titulo: 'Nuevo paso', texto: '' }),
  destacado: () => ({ icono: 'sparkle', titulo: 'Nuevo destacado', texto: '', ruta: 'guia' }),
  calendario: () => ({ dia: 1, icono: 'flag', titulo: 'Nuevo día', texto: '' }),
  beneficio: () => ({ icono: 'sparkle', titulo: 'Nuevo beneficio', texto: '' }),
  imagen: () => ({ src: '', titulo: '', texto: '' }),
  categoria: () => ({ id: '', nombre: 'Nueva categoría', color: '#9d7bff' }),
  seccion: () => ({ id: '', titulo: 'Nueva sección', icono: 'sparkle', resumen: '', contenido: '', imagenes: [], oculto: false }),
  etapa: () => ({ id: '', clave: '', titulo: 'Nuevo cambio', dia: 1, color: '#9d7bff', icono: 'flag', resumen: '', contenido: '', imagenes: [], imagen: '', oculto: false }),
  dimension: () => ({ id: '', titulo: 'Nueva dimensión', dia: 1, color: '#6c9dff', icono: 'globe', bloque: 'grass_block', resumen: '', contenido: '', imagenes: [], imagen: '', oculto: false }),
  jefe: () => ({ id: '', titulo: 'Nuevo jefe', dia: 1, vida: '', donde: '', estado: 'Disponible', huevo: '', color: '#ff9db4', icono: 'skull', resumen: '', contenido: '', imagenes: [], imagen: '', oculto: false }),
  anuncio: () => ({ id: '', titulo: 'Nuevo anuncio', fecha: new Date().toISOString(), categoria: 'actualizacion', portada: '', resumen: '', contenido: '', autor: S.user?.login || '', fijado: false, oculto: false }),
};

const RUTAS = ['inicio', 'guia', 'guia/primeros-pasos', 'guia/dinocoins', 'guia/misiones', 'guia/trabajos', 'guia/habilidades', 'guia/menu', 'misiones',
  'jugabilidad', 'jugabilidad/cambios', 'jugabilidad/dimensiones', 'jugabilidad/jefes', 'jugabilidad/mobs', 'jugabilidad/crafteos', 'jugabilidad/items',
  'jugadores', 'anuncios', 'launcher'];
const ESTADOS_JEFE = ['Disponible', 'En desarrollo', 'Próximamente'];

const addBtn = (list, label) => `<button class="btn btn--sm btn--primary" type="button" data-act="row-add" data-list="${list}">${icon('plus')} ${esc(label)}</button>`;
const flag = (text, cls = '') => `<span class="row__flag${cls ? ` row__flag--${cls}` : ''}">${esc(text)}</span>`;

// Ruta de la web que corresponde a lo que se está editando (para la vista en vivo)
export function routeFor() {
  const e = S.edit;
  if (e?.list) {
    const L = LISTS[e.list];
    const x = getAt(`${L.path}.${e.index}`);
    return x ? L.route(x) : '';
  }
  if (e?.kind === 'mision') return `misiones/${e.n}`;
  if (e?.kind === 'item') return 'jugabilidad/items';
  if (e?.kind === 'mob') return 'jugabilidad/mobs';
  if (e?.kind === 'receta') return 'jugabilidad/crafteos';
  return ({
    general: 'inicio', inicio: 'inicio', guia: 'guia', jugabilidad: 'jugabilidad', anuncios: 'anuncios', paginas: 'launcher',
    misiones: 'misiones', items: S.sub.items === 'mobs' ? 'jugabilidad/mobs' : S.sub.items === 'crafteos' ? 'jugabilidad/crafteos' : 'jugabilidad/items',
    servidor: 'jugadores', historial: 'inicio',
  })[S.tab] || 'inicio';
}

// ------------------------------------------------------------------ dibujo

export function render() {
  if (S.edit) return renderEditor(S.edit);
  switch (S.tab) {
    case 'general': return tabGeneral();
    case 'inicio': return tabInicio();
    case 'guia': return tabGuia();
    case 'jugabilidad': return tabJugabilidad();
    case 'anuncios': return tabAnuncios();
    case 'paginas': return tabPaginas();
    case 'misiones': return tabMisiones();
    case 'items': return tabItems();
    case 'servidor': return tabServidor();
    case 'historial': return tabHistorial();
    default: return '';
  }
}

function tabGeneral() {
  const g = 'sitio:general';
  const host = S.draft.sitio.general.anfitrion || 'el host';
  const fondos = S.draft.sitio.general.fondos || [];
  return `${wsHead('General', 'Todo lo que cambies se guarda como <b>borrador</b> en este navegador. Nada llega a la web hasta que pulses <b>Publicar</b>.')}
  ${card('Cómo funciona', 'sparkle', `<div class="guide">
    <div class="guide__step"><b><span class="guide__num">1</span> Edita</b>Cambia textos, imágenes, secciones o anuncios en cualquier pestaña.</div>
    <div class="guide__step"><b><span class="guide__num">2</span> Revisa</b>Abre la <em>Vista en vivo</em> para ver la web con tus cambios mientras escribes.</div>
    <div class="guide__step"><b><span class="guide__num">3</span> Publica</b>Pulsa <em>Publicar</em>: se guarda en GitHub y la web se actualiza en 1-2 minutos para todo el mundo.</div>
  </div>`)}
  ${card('El servidor', 'server', `<div class="grid-2">
      ${fText(`${g}.nombre`, 'Nombre', { required: true, maxlength: 60 })}
      ${fText(`${g}.edicion`, 'Edición', { maxlength: 60 })}
      ${fText(`${g}.lema`, 'Frase corta', { maxlength: 120, hint: 'Sale debajo del logo.' })}
      ${fText(`${g}.anfitrion`, 'Host del servidor', { maxlength: 40, hint: 'El streamer dueño del server. Sus redes son las de arriba.' })}
    </div>
    ${fArea(`${g}.descripcion`, 'Descripción', { rows: 2, maxlength: 300, hint: 'Sale en Google y cuando se comparte la web.' })}`)}
  ${card('IP y versiones', 'wifi', `<div class="grid-3">
      ${fText(`${g}.ipJava`, 'IP de Java', { mono: true, maxlength: 120 })}
      ${fText(`${g}.puertoJava`, 'Puerto de Java', { placeholder: 'Vacío = 25565', maxlength: 6 })}
      ${fText(`${g}.versionJava`, 'Versión de Java', { maxlength: 30 })}
      ${fText(`${g}.ipBedrock`, 'IP de Bedrock', { mono: true, maxlength: 120 })}
      ${fText(`${g}.puertoBedrock`, 'Puerto de Bedrock', { placeholder: '19132', maxlength: 6 })}
      ${fText(`${g}.versionBedrock`, 'Bedrock (texto)', { maxlength: 60 })}
    </div>`)}
  ${card(`Redes de ${host}`, 'globe', `<p class="card-panel__text">Salen arriba en la barra, en el menú del móvil y en el pie de página. Las vacías no se muestran.</p>
    <div class="grid-2">${Object.entries(SOCIAL_TYPES).map(([k, v]) => fText(`${g}.redes.${k}`, v.label, { type: 'url', placeholder: 'https://…', maxlength: 300 })).join('')}</div>`)}
  ${card('Viciont Studios', 'star', `<div class="grid-2">
      ${fText(`${g}.viciont.url`, 'Web del estudio', { type: 'url', maxlength: 300 })}
      ${fText(`${g}.viciont.discord`, 'Discord', { type: 'url', maxlength: 300 })}
      ${fText(`${g}.viciont.youtube`, 'YouTube', { type: 'url', maxlength: 300 })}
      ${fText(`${g}.viciont.x`, 'X', { type: 'url', maxlength: 300 })}
      ${fText(`${g}.launcherUrl`, 'Página del launcher', { type: 'url', maxlength: 300 })}
      ${fText(`${g}.launcherRepo`, 'Repositorio del launcher', { mono: true, maxlength: 120, hint: 'De ahí se lee la última versión (usuario/repositorio).' })}
      ${fText(`${g}.creditos`, 'Página creada por', { maxlength: 60 })}
    </div>`)}
  ${card('Día de la temporada', 'calendar', `<p class="card-panel__text">Con el servidor conectado, el día lo manda el plugin (la misión normal más alta que está activa). Esto solo se usa mientras no hay conexión.</p>
    <div class="grid-2">${fDate(`${g}.inicioTemporada`, 'Fecha de inicio', { type: 'date' })}${fNum(`${g}.diaManual`, 'Día fijo (0 = automático)', { min: 0 })}</div>`)}
  ${card('Fondos de la web', 'image', `<p class="card-panel__text">Las capturas que pasan despacio detrás de toda la web. Recomendado 1920×1080; se optimizan solas.</p>
    ${fondos.length ? `<div class="img-grid">${fondos.map((f, i) => `<div class="img-card">
      <img class="img-card__img" src="${esc(imgSrc(f.src))}" alt="" loading="lazy">
      ${fText(`sitio:general.fondos.${i}.titulo`, 'Título', { maxlength: 80 })}
      <div class="img-card__actions">
        <button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="arr-up" data-path="sitio:general.fondos" data-index="${i}" aria-label="Antes"${i === 0 ? ' disabled' : ''}>${icon('arrowLeft')}</button>
        <button class="btn btn--sm btn--icon btn--ghost" type="button" data-act="arr-down" data-path="sitio:general.fondos" data-index="${i}" aria-label="Después"${i === fondos.length - 1 ? ' disabled' : ''}>${icon('arrowRight')}</button>
        <button class="btn btn--sm btn--icon btn--danger" type="button" data-act="arr-del" data-path="sitio:general.fondos" data-index="${i}" aria-label="Quitar">${icon('trash')}</button>
      </div>
    </div>`).join('')}</div>` : '<p class="muted">Sin fondos: se usa un degradado.</p>'}`, {
    count: fondos.length,
    extra: `<label class="btn btn--sm btn--primary">${icon('upload')} Subir fondos<input type="file" accept="image/png,image/jpeg,image/webp" multiple data-upload-fondos hidden></label>`,
  })}`;
}

function tabInicio() {
  const i = 'sitio:inicio';
  return `${wsHead('Página de inicio', 'La portada: la frase de arriba, los pasos para empezar, lo destacado, el calendario y el texto de Viciont Studios.')}
  <datalist id="rutas">${RUTAS.map((r) => `<option value="${r}">`).join('')}</datalist>
  ${card('Portada', 'home', `<div class="grid-2">${fText(`${i}.kicker`, 'Etiqueta de arriba', { maxlength: 60, placeholder: 'Servidor de Minecraft' })}${fText(`${i}.titulo`, 'Título de “Qué te espera”', { maxlength: 80 })}</div>
    ${fMd(`${i}.texto`, 'Texto de la portada', { rows: 4 })}`)}
  ${card('Cómo empezar', 'flag', repeater(`${i}.pasos`, {
    title: (x, k) => `Paso ${k + 1}`, tpl: 'paso', add: 'Añadir paso',
    render: (p) => `<div class="grid-2">${fIcon(`${p}.icono`, 'Ícono')}${fText(`${p}.titulo`, 'Título', { maxlength: 80 })}</div>${fArea(`${p}.texto`, 'Texto', { rows: 2, maxlength: 400 })}`,
  }))}
  ${card('Destacados', 'star', repeater(`${i}.destacados`, {
    title: (x) => x.titulo || 'Destacado', tpl: 'destacado', add: 'Añadir destacado',
    render: (p) => `<div class="grid-3">${fIcon(`${p}.icono`, 'Ícono')}${fText(`${p}.titulo`, 'Título', { maxlength: 60 })}${fText(`${p}.ruta`, 'Lleva a', { list: 'rutas', mono: true, hint: 'Una sección de la web, por ejemplo guia/dinocoins.' })}</div>${fArea(`${p}.texto`, 'Texto', { rows: 2, maxlength: 300 })}`,
  }))}
  ${card('Calendario', 'calendar', repeater(`${i}.calendario`, {
    title: (x) => `Día ${x.dia}`, tpl: 'calendario', add: 'Añadir día',
    render: (p) => `<div class="grid-3">${fNum(`${p}.dia`, 'Día', { min: 1 })}${fIcon(`${p}.icono`, 'Ícono')}${fText(`${p}.titulo`, 'Título', { maxlength: 80 })}</div>${fArea(`${p}.texto`, 'Texto', { rows: 2, maxlength: 300 })}`,
  }))}
  ${card('Viciont Studios', 'sparkle', fMd(`${i}.viciont`, 'Texto del estudio', { rows: 4 }))}`;
}

function tabGuia() {
  const list = S.draft.sitio.guia.secciones;
  return `${wsHead('Guía', 'Las secciones de la guía: cómo jugar, DinoCoins, misiones, trabajos, habilidades, el menú y sus menús con imágenes. Arrastra las filas para cambiar el orden.')}
  ${card('', '', fMd('sitio:guia.intro', 'Introducción de la guía', { rows: 3 }))}
  ${card('Secciones', 'book', rowsHtml('guia', list.map((x, i) => ({
    index: i, title: x.titulo, thumb: icon(x.icono), hidden: x.oculto,
    meta: [`#guia/${x.id}`, x.imagenes.length ? `${x.imagenes.length} ${x.imagenes.length === 1 ? 'imagen' : 'imágenes'}` : '', plainText(x.resumen, 70)],
    flags: x.imagenes.some((im) => !im.src) ? [flag('Falta una imagen')] : [],
  }))), { count: list.length, extra: addBtn('guia', 'Añadir sección') })}`;
}

function tabJugabilidad() {
  const j = S.draft.sitio.jugabilidad;
  const entries = (arr, extra) => arr.map((x, i) => ({ index: i, title: x.titulo, thumb: icon(x.icono), color: x.color, hidden: x.oculto, meta: [`Día ${x.dia}`, ...extra(x)] }));
  return `${wsHead('Cambios y jugabilidad', 'Qué desbloquea cada cambio, cómo se juega cada dimensión y los jefes. Los <b>mobs, crafteos e items</b> salen solos del plugin (pestaña <em>Items, mobs y crafteos</em>).')}
  ${card('', '', fMd('sitio:jugabilidad.intro', 'Introducción', { rows: 3 }))}
  ${card('Cambios', 'flag', `<p class="card-panel__text">La <b>clave</b> une cada cambio con el del servidor (<code>/changes</code>): uno, extra, dos o tres. Así la web marca solo cuáles están activos.</p>
    ${rowsHtml('etapas', entries(j.etapas, (x) => [x.clave ? `/changes ${x.clave}` : 'Sin clave', plainText(x.resumen, 60)]))}`, { count: j.etapas.length, extra: addBtn('etapas', 'Añadir cambio') })}
  ${card('Dimensiones', 'globe', rowsHtml('dimensiones', entries(j.dimensiones, (x) => [plainText(x.resumen, 70)])), { count: j.dimensiones.length, extra: addBtn('dimensiones', 'Añadir dimensión') })}
  ${card('Jefes', 'crown', rowsHtml('jefes', entries(j.jefes, (x) => [x.estado, x.vida ? `${x.vida} de vida` : ''])), { count: j.jefes.length, extra: addBtn('jefes', 'Añadir jefe') })}`;
}

function tabAnuncios() {
  const a = S.draft.anuncios;
  const cats = new Map(a.categorias.map((c) => [c.id, c]));
  const order = a.anuncios.map((x, i) => ({ x, i })).sort((p, q) => (q.x.fijado - p.x.fijado) || (new Date(q.x.fecha) - new Date(p.x.fecha)));
  return `${wsHead('Anuncios', 'Las novedades del servidor como páginas: actualizaciones, cambios que se activan, tradeos nuevos... Los fijados salen primero.', addBtn('anuncios', 'Nuevo anuncio'))}
  ${card('Publicados y borradores', 'megaphone', rowsHtml('anuncios', order.map(({ x, i }) => {
    const c = cats.get(x.categoria);
    const src = imgSrc(x.portada);
    return {
      index: i, title: x.titulo, hidden: x.oculto, wide: true,
      thumb: src ? `<img src="${esc(src)}" alt="">` : icon('megaphone'),
      meta: [fmtDate(x.fecha), c?.nombre || x.categoria, x.autor ? `por ${x.autor}` : ''],
      flags: [x.fijado ? flag('Fijado', 'new') : '', x.oculto ? flag('Oculto') : ''],
    };
  }), { sortable: false, empty: 'Todavía no hay anuncios. Pulsa “Nuevo anuncio”.' }), { count: a.anuncios.length })}
  ${card('Categorías', 'filter', repeater('anuncios:categorias', {
    title: (x) => x.nombre || 'Categoría', tpl: 'categoria', add: 'Añadir categoría',
    render: (p) => `<div class="grid-2">${fText(`${p}.nombre`, 'Nombre', { maxlength: 40 })}${fColor(`${p}.color`, 'Color')}</div>`,
  }))}
  ${card('', '', fMd('sitio:anuncios.intro', 'Texto de arriba en Anuncios', { rows: 2 }))}`;
}

function tabPaginas() {
  const l = 'sitio:launcher';
  return `${wsHead('Otras páginas', 'La página del launcher, los textos de arriba de Jugadores y Misiones, y el pie de página.')}
  ${card('Launcher', 'download', `${fText(`${l}.titulo`, 'Título', { maxlength: 80 })}${fMd(`${l}.texto`, 'Texto', { rows: 4 })}
    ${repeater(`${l}.beneficios`, {
      title: (x) => x.titulo || 'Beneficio', tpl: 'beneficio', add: 'Añadir beneficio',
      render: (p) => `<div class="grid-2">${fIcon(`${p}.icono`, 'Ícono')}${fText(`${p}.titulo`, 'Título', { maxlength: 60 })}</div>${fArea(`${p}.texto`, 'Texto', { rows: 2, maxlength: 300 })}`,
    })}
    ${fArea(`${l}.pasos`, 'Pasos para jugar con el launcher', { rows: 5, kind: 'lines', hint: 'Uno por línea.' })}`)}
  ${card('Misiones', 'scroll', `${fMd('sitio:misiones.intro', 'Texto de arriba', { rows: 3 })}${fMd('sitio:misiones.notas', 'Notas al final de la página', { rows: 3 })}
    ${fCheck('sitio:misiones.mostrarBloqueadas', 'Mostrar el nombre de las misiones bloqueadas', { hint: 'Si está apagado, las que no se abrieron salen como “Misión bloqueada”.' })}`)}
  ${card('Jugadores', 'users', fMd('sitio:jugadores.intro', 'Texto de arriba', { rows: 3 }))}
  ${card('Pie de página', 'file', `${fArea('sitio:footer.descripcion', 'Descripción', { rows: 2, maxlength: 400 })}${fText('sitio:footer.legal', 'Aviso legal', { maxlength: 300 })}`)}`;
}

// ------------------------------------------------------------------ juego (sale del plugin)

const srcChip = () => (S.catalogo
  ? `<span class="chip-src chip-src--plugin">${icon('server')} En vivo del plugin</span>`
  : `<span class="chip-src chip-src--web">${icon('info')} Copia guardada (el servidor no mandó el catálogo)</span>`);

function pluginNote(que) {
  return card('', '', `<p class="card-panel__text">${icon('info')} ${que} salen <b>solos del plugin</b>: si los creas, cambias o borras en el plugin, la web se actualiza cuando el servidor prende (o con <code>/web subir</code>). Aquí solo se agrega lo que es de la web: imágenes, texturas, descripciones, notas y qué se oculta.</p>`, { cls: 'card-panel--note' });
}

function tabMisiones() {
  const g = game();
  const f = S.filters;
  const q = f.q.trim().toLowerCase();
  const tipos = [['todas', 'Todas'], ['normal', 'Misiones'], ['extra', 'Extra'], ['trabajo', 'Trabajo']];
  const list = g.misiones.filter((m) => (f.tipo === 'todas' || m.tipo === f.tipo) && (!q || `${m.n} ${m.nombre} ${m.descripcion}`.toLowerCase().includes(q)));
  return `${wsHead('Misiones', 'Las 3 secciones del menú de misiones, como en el juego.', srcChip())}
  ${pluginNote('Las misiones (nombre, objetivos, dificultad, DinoCoins y recompensas)')}
  <div class="toolbar-a">
    <div class="subtabs-a">${tipos.map(([k, t]) => `<button class="subtab-a${f.tipo === k ? ' is-active' : ''}" type="button" data-act="filter-tipo" data-v="${k}">${t} <small>${k === 'todas' ? g.misiones.length : g.misiones.filter((m) => m.tipo === k).length}</small></button>`).join('')}</div>
    <input class="input" type="search" placeholder="Buscar misión…" value="${esc(f.q)}" data-filter="q" aria-label="Buscar misión">
  </div>
  ${card('', '', list.length ? `<ul class="rows">${list.map((m) => {
    const tag = m.tipo === 'extra' ? `Extra #${m.padre}` : `#${m.n}`;
    const raw = (S.draft.juego.misiones || []).find((x) => x.n === m.n) || {};
    return `<li class="row${m.oculto ? ' is-hidden' : ''}">
      <span class="row__thumb" style="--c:var(--m-${m.tipo})">${icon(m.tipo === 'trabajo' ? 'pickaxe' : m.tipo === 'extra' ? 'star' : 'scroll')}</span>
      <div class="row__main"><strong class="row__title">${esc(tag)} · ${esc(m.nombre)}</strong>
        <span class="row__meta"><span>${esc(TIPO[m.tipo])}</span><span>${esc(DIF[m.dificultad])}</span><span>${m.dinocoins} DinoCoins</span>${m.dia ? `<span>Día ${m.dia}</span>` : ''}${raw.nota ? flag('Con nota', 'new') : ''}${raw.imagen ? flag('Con imagen', 'new') : ''}${m.oculto ? flag('Oculta') : ''}</span></div>
      <div class="row__actions"><button class="btn btn--sm" type="button" data-act="mision-edit" data-n="${m.n}">${icon('edit')}<span>Notas e imagen</span></button></div>
    </li>`;
  }).join('')}</ul>` : '<p class="muted">Ninguna misión coincide con la búsqueda.</p>')}`;
}

function tabItems() {
  const g = game();
  const sub = S.sub.items || 'items';
  const subs = [['items', 'Items', Object.keys(g.items).length], ['mobs', 'Mobs', g.mobs.length], ['crafteos', 'Crafteos', g.recetas.length]];
  let body = '';
  if (sub === 'items') {
    const f = S.filters;
    const q = f.q.trim().toLowerCase();
    const items = Object.entries(g.items).filter(([id, it]) => (!f.cat || it.categoria === f.cat) && (!q || `${id} ${stripCodes(it.nombre || '')} ${itemLabel(it)}`.toLowerCase().includes(q)));
    body = `<div class="toolbar-a">
      <input class="input" type="search" placeholder="Buscar item…" value="${esc(f.q)}" data-filter="q" aria-label="Buscar item">
      <select class="input select" data-filter="cat" aria-label="Categoría"><option value="">Todas las categorías</option>${Object.entries(CATEGORIAS).map(([k, v]) => `<option value="${k}"${f.cat === k ? ' selected' : ''}>${esc(v.nombre || v)}</option>`).join('')}</select>
      <span class="muted">${items.length} items</span>
    </div>
    <div class="items-grid">${items.map(([id, it]) => `<button class="icard-a${it.oculto ? ' is-hidden' : ''}" type="button" data-act="item-edit" data-id="${esc(id)}">
      <span class="icard-a__slot">${itemHtml({ id }, { size: 34, tip: false })}</span>
      <span class="icard-a__body"><span class="icard-a__name">${it.nombre ? legacyHtml(it.nombre, { c: '#fff' }) : esc(itemLabel(it))}</span>
      <span class="icard-a__meta"><span>${esc(id)}</span>${it.textura ? '<span>· textura propia</span>' : ''}${it.oculto ? '<span>· oculto</span>' : ''}</span></span>
    </button>`).join('')}</div>`;
  } else if (sub === 'mobs') {
    body = `<ul class="rows">${g.mobs.map((m) => `<li class="row${m.oculto ? ' is-hidden' : ''}">
      <span class="row__thumb" style="--c:${esc(m.color)}">${m.imagen ? `<img src="${esc(imgSrc(m.imagen))}" alt="">` : m.huevo ? itemHtml({ vanilla: true, material: m.huevo, n: 1 }, { size: 34, tip: false }) : icon('skull')}</span>
      <div class="row__main"><strong class="row__title">${esc(m.nombre)}</strong><span class="row__meta"><span>${esc(m.id)}</span><span>Cambio ${esc(m.etapa || '—')}</span>${m.vida ? `<span>${esc(m.vida)} de vida</span>` : ''}${m.imagen ? flag('Con imagen', 'new') : ''}${m.oculto ? flag('Oculto') : ''}</span></div>
      <div class="row__actions"><button class="btn btn--sm" type="button" data-act="mob-edit" data-id="${esc(m.id)}">${icon('edit')}<span>Imagen</span></button></div>
    </li>`).join('')}</ul>`;
  } else {
    body = `<ul class="rows">${g.recetas.map((r) => {
      const res = resolveRef(r.resultado);
      return `<li class="row${r.oculto ? ' is-hidden' : ''}">
        <span class="row__thumb">${itemHtml(r.resultado, { size: 34, tip: false, count: false })}</span>
        <div class="row__main"><strong class="row__title">${esc(res ? itemLabel(res.item) : r.id)}</strong><span class="row__meta"><span>${esc(recipeTitle(r))}</span><span>Cambio ${esc(r.etapa || '—')}</span>${r.nota ? flag('Con nota', 'new') : ''}${r.oculto ? flag('Oculto') : ''}</span></div>
        <div class="row__actions"><button class="btn btn--sm" type="button" data-act="receta-edit" data-id="${esc(r.id)}">${icon('edit')}<span>Nota</span></button></div>
      </li>`;
    }).join('')}</ul>`;
  }
  return `${wsHead('Items, mobs y crafteos', 'Las texturas y descripciones de los items, las imágenes de los mobs y las notas de los crafteos.', srcChip())}
  ${pluginNote(sub === 'mobs' ? 'Los mobs (nombre, vida, dónde salen y qué hacen)' : sub === 'crafteos' ? 'Los crafteos' : 'Los items (nombre, lore, encantamientos)')}
  <div class="subtabs-a">${subs.map(([k, t, n]) => `<button class="subtab-a${sub === k ? ' is-active' : ''}" type="button" data-act="sub-items" data-v="${k}">${t} <small>${n}</small></button>`).join('')}</div>
  ${card('', '', body)}`;
}

function tabServidor() {
  const l = 'sitio:general.live';
  const live = S.draft.sitio.general.live;
  const snippet = `web:\n  activado: true\n  repositorio: "${live.repo || 'CrissyjuanxD/Croissants-Live'}"\n  rama: "${live.rama || 'main'}"\n  token: "PEGA_AQUI_EL_TOKEN"\n  ntfy: "${live.ntfy}"\n  segundos-estado: 15\n  minutos-jugadores: 2`;
  const g = game();
  return `${wsHead('Conexión con el servidor', 'El plugin sube solo a un repositorio de GitHub las misiones activas, los cambios, los jugadores y el catálogo del juego (items, mobs, misiones, crafteos, trabajos y habilidades). La web lo lee en vivo.')}
  ${card('Estado', 'signal', '<div class="conn" id="conn-test"><p class="muted">Pulsa “Probar conexión” para revisar el servidor, el plugin y el catálogo.</p></div>', { extra: `<button class="btn btn--sm" type="button" data-act="conn-test">${icon('refresh')} Probar conexión</button>` })}
  ${card('Configurar el plugin (una sola vez)', 'terminal', `<ol class="steps-list">
      <li>En GitHub crea un <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">fine-grained token</a> con acceso <b>solo</b> al repositorio <code>${esc(live.repo || 'CrissyjuanxD/Croissants-Live')}</code> y el permiso <b>Contents: Read and write</b>. No uses el token del panel.</li>
      <li>En el servidor abre <code>plugins/QuasoPlugin/config.yml</code>, busca <code>web:</code>, pega el token y pon <code>activado: true</code> (o copia este bloque).</li>
      <li>En la consola escribe <code>/web recargar</code> y después <code>/web</code>: tiene que decir <b>activa</b>.</li>
      <li><code>/web subir</code> sube todo al instante (por ejemplo después de cambiar items o misiones en el plugin). Al prender el servidor se sube solo.</li>
    </ol>
    <div class="snippet"><pre>${esc(snippet)}</pre><button class="btn btn--sm" type="button" data-act="copy" data-text="${esc(snippet)}">${icon('copy')} Copiar</button></div>`)}
  ${card('Repositorio de datos en vivo', 'server', `<div class="grid-2">
      ${fText(`${l}.repo`, 'Repositorio (usuario/nombre)', { mono: true, maxlength: 120 })}
      ${fText(`${l}.rama`, 'Rama', { mono: true, maxlength: 60 })}
      ${fText(`${l}.ntfy`, 'Canal de avisos de ntfy.sh', { mono: true, maxlength: 80, hint: 'Avisa al instante a las páginas abiertas. Tiene que ser el mismo que en el plugin.' })}
      ${fSelect(`${l}.estadoApi`, 'Estado público del servidor', [['mcstatus', 'api.mcstatus.io (con respaldo)'], ['mcsrvstat', 'api.mcsrvstat.us']])}
    </div>`)}
  ${card('Copia del catálogo en la web', 'download', `<p class="card-panel__text">Mientras el servidor no manda nada (apagado o sin configurar), la web usa la copia guardada en <code>data/juego.json</code>. Guárdala de vez en cuando para que esté al día; las texturas y descripciones de la web se conservan.</p>
    <p class="card-panel__text">${S.catalogo ? `${icon('check')} Catálogo del plugin cargado: <b>${Object.keys(S.catalogo.items || {}).length}</b> items, <b>${(S.catalogo.misiones || []).length}</b> misiones, <b>${(S.catalogo.recetas || []).length}</b> crafteos y <b>${(S.catalogo.mobs || []).length}</b> mobs${S.catalogo.generado ? ` (${esc(fmtDateTime(S.catalogo.generado))})` : ''}.` : `${icon('info')} ${esc(S.catalogoEstado || 'Todavía no hay catálogo del plugin.')}`}</p>
    <div class="btn-row"><button class="btn btn--sm" type="button" data-act="bake-catalog"${S.catalogo ? '' : ' disabled'}>${icon('download')} Guardar copia del catálogo en la web</button><button class="btn btn--sm btn--ghost" type="button" data-act="reload-catalog">${icon('refresh')} Volver a leer el catálogo</button></div>
    <p class="muted">La copia de ahora tiene ${Object.keys(g.items).length} items y ${g.misiones.length} misiones.</p>`)}`;
}

function tabHistorial() {
  return `${wsHead('Historial y copias', 'Cada vez que publicas se guarda una versión en GitHub. Puedes volver a cualquiera de ellas.')}
  ${card('Versiones publicadas', 'history', '<div id="history-list"><p class="muted">Cargando…</p></div>', { extra: `<button class="btn btn--sm btn--ghost" type="button" data-act="history-refresh">${icon('refresh')} Actualizar</button>` })}
  ${card('Copia de seguridad', 'download', `<p class="card-panel__text">Descarga todo el contenido (con tu borrador) en un archivo .json, o carga uno que hayas guardado.</p>
    <div class="btn-row"><button class="btn btn--sm" type="button" data-act="export">${icon('download')} Exportar JSON</button>
    <label class="btn btn--sm btn--ghost">${icon('upload')} Importar JSON<input type="file" accept="application/json,.json" data-import hidden></label></div>`)}
  ${card('Seguridad', 'shield', `<ul class="tips">
    <li>Tu token ${S.rememberedToken ? 'está guardado en este navegador porque activaste “Recordar”.' : 'solo vive en esta pestaña y se borra al cerrarla.'}</li>
    <li>Si usas un ordenador ajeno, pulsa <b>Cerrar sesión</b> al terminar.</li>
    <li>Para quitar el acceso a cualquier dispositivo, borra el token en <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener noreferrer">GitHub → Fine-grained tokens</a>.</li>
    <li>Nadie puede cambiar la web sin un token con permiso de escritura en <code>${esc(REPO_KEY)}</code>.</li>
  </ul>`)}`;
}

// ------------------------------------------------------------------ editores

function edHead(kicker, title, { canDelete = true, route = true, undo = true } = {}) {
  return `<button class="ws-back" type="button" data-act="ed-back">${icon('arrowLeft')} Volver a la lista</button>
  ${wsHead(title, '', `<div class="ed-actions">
    ${route ? `<button class="btn btn--sm btn--ghost" type="button" data-act="ed-view">${icon('eye')} Ver en la web</button>` : ''}
    ${undo ? `<button class="btn btn--sm btn--ghost" type="button" data-act="ed-undo">${icon('history')} Deshacer cambios</button>` : ''}
    ${canDelete ? `<button class="btn btn--sm btn--danger" type="button" data-act="ed-delete">${icon('trash')} Eliminar</button>` : ''}
    <button class="btn btn--sm btn--primary" type="button" data-act="ed-back">${icon('check')} Listo</button>
  </div>`)}
  <p class="kicker">${esc(kicker)}</p>`;
}

function sideCard(base, extra = '') {
  return card('En la web', 'eye', `${fCheck(`${base}.oculto`, 'Visible en la web', { invert: true })}${extra}`);
}

function renderEditor(e) {
  if (e.list) {
    const L = LISTS[e.list];
    const base = `${L.path}.${e.index}`;
    const x = getAt(base);
    if (!x) return '';
    if (L.editor === 'seccion') return edSeccion(base, x);
    if (L.editor === 'anuncio') return edAnuncio(base, x);
    return edJugabilidad(e.list, base, x);
  }
  if (e.kind === 'item') return edItem(e);
  if (e.kind === 'mision') return edMision(e);
  if (e.kind === 'mob') return edMob(e);
  if (e.kind === 'receta') return edReceta(e);
  return '';
}

function imagesCard(base, name) {
  return card('Imágenes', 'image', repeater(`${base}.imagenes`, {
    title: (im, k) => im.titulo || `Imagen ${k + 1}`, tpl: 'imagen', add: 'Añadir imagen', empty: 'Sin imágenes. Sirven para mostrar los menús (GUI) o capturas del juego.',
    render: (p) => `<div class="grid-2">${fImage(`${p}.src`, 'Imagen', { kind: 'shot', name })}<div>${fText(`${p}.titulo`, 'Título', { maxlength: 100 })}${fArea(`${p}.texto`, 'Descripción', { rows: 3, maxlength: 400 })}</div></div>`,
  }));
}

function edSeccion(base, x) {
  return `${edHead('Guía · sección', x.titulo || 'Sección')}
  <div class="editor-grid">
    <div class="workspace-col">
      ${card('', '', `<div class="grid-2">${fText(`${base}.titulo`, 'Título', { required: true, maxlength: 80 })}${fIcon(`${base}.icono`, 'Ícono')}</div>
        ${fText(`${base}.id`, 'Dirección', { mono: true, maxlength: 60, kind: 'slug', hint: `Se abre en <b>#guia/${esc(x.id)}</b>. Solo minúsculas, números y guiones. Si la cambias, los enlaces viejos dejan de funcionar.` })}
        ${fArea(`${base}.resumen`, 'Resumen', { rows: 2, maxlength: 300, hint: 'Sale en el menú de la guía y en la búsqueda.' })}
        ${fMd(`${base}.contenido`, 'Contenido', { rows: 20 })}`)}
      ${imagesCard(base, `guia-${x.id || 'seccion'}`)}
    </div>
    <aside class="editor-side">${sideCard(base)}</aside>
  </div>`;
}

function edJugabilidad(list, base, x) {
  const kicker = { etapas: 'Cambio', dimensiones: 'Dimensión', jefes: 'Jefe' }[list];
  let fields = '';
  if (list === 'etapas') {
    fields = `<div class="grid-3">${fSelect(`${base}.clave`, 'Clave en el servidor', [['', 'Ninguna'], ['uno', 'uno'], ['extra', 'extra'], ['dos', 'dos'], ['tres', 'tres']], { hint: 'La de /changes.' })}${fNum(`${base}.dia`, 'Día', { min: 0 })}${fColor(`${base}.color`, 'Color')}</div>`;
  } else if (list === 'dimensiones') {
    fields = `<div class="grid-3">${fNum(`${base}.dia`, 'Día en que se abre', { min: 0 })}${fColor(`${base}.color`, 'Color')}${fText(`${base}.bloque`, 'Bloque del ícono', { mono: true, maxlength: 60, hint: 'Material de Minecraft, ej. sculk.' })}</div>`;
  } else {
    fields = `<div class="grid-3">${fNum(`${base}.dia`, 'Día', { min: 0 })}${fText(`${base}.vida`, 'Vida', { maxlength: 20 })}${fSelect(`${base}.estado`, 'Estado', ESTADOS_JEFE.map((s) => [s, s]))}
      ${fText(`${base}.donde`, 'Dónde aparece', { maxlength: 120 })}${fText(`${base}.huevo`, 'Huevo (ícono)', { mono: true, maxlength: 60, hint: 'Ej. warden_spawn_egg.' })}${fColor(`${base}.color`, 'Color')}</div>`;
  }
  return `${edHead(kicker, x.titulo || kicker)}
  <div class="editor-grid">
    <div class="workspace-col">
      ${card('', '', `<div class="grid-2">${fText(`${base}.titulo`, 'Título', { required: true, maxlength: 80 })}${fIcon(`${base}.icono`, 'Ícono')}</div>
        ${fields}
        ${fText(`${base}.id`, 'Dirección', { mono: true, maxlength: 60, kind: 'slug', hint: 'Solo minúsculas, números y guiones.' })}
        ${fArea(`${base}.resumen`, 'Resumen', { rows: 2, maxlength: 300 })}
        ${fMd(`${base}.contenido`, 'Contenido', { rows: 18, hint: 'Puedes poner bloques como <b>[[recetas:dos]]</b> o <b>[[mobs:tres]]</b> con el botón Bloques: se llenan solos con lo del plugin.' })}`)}
      ${imagesCard(base, `${list}-${x.id || 'imagen'}`)}
    </div>
    <aside class="editor-side">${card('Portada', 'image', fImage(`${base}.imagen`, 'Imagen de la tarjeta', { kind: 'wide', name: `${list}-${x.id || 'portada'}` }))}${sideCard(base)}</aside>
  </div>`;
}

function edAnuncio(base, x) {
  const cats = S.draft.anuncios.categorias.map((c) => [c.id, c.nombre]);
  return `${edHead('Anuncio', x.titulo || 'Anuncio')}
  <div class="editor-grid">
    <div class="workspace-col">
      ${card('', '', `${fText(`${base}.titulo`, 'Título', { required: true, maxlength: 120 })}
        <div class="grid-3">${fDate(`${base}.fecha`, 'Fecha')}${fSelect(`${base}.categoria`, 'Categoría', cats)}${fText(`${base}.autor`, 'Autor', { maxlength: 40 })}</div>
        ${fArea(`${base}.resumen`, 'Resumen', { rows: 2, maxlength: 400, hint: 'Sale en la tarjeta y al compartir el anuncio.' })}
        ${fMd(`${base}.contenido`, 'Contenido', { rows: 20 })}
        ${fText(`${base}.id`, 'Dirección', { mono: true, maxlength: 80, kind: 'slug', hint: `Se abre en <b>#anuncios/${esc(x.id)}</b>.` })}`)}
    </div>
    <aside class="editor-side">
      ${card('Portada', 'image', fImage(`${base}.portada`, 'Imagen de portada', { kind: 'wide', name: `anuncio-${x.id || 'portada'}`, hint: 'Recomendado 1600×900.' }))}
      ${sideCard(base, fCheck(`${base}.fijado`, 'Fijar arriba de todo'))}
    </aside>
  </div>`;
}

function edItem(e) {
  const g = game();
  const it = g.items[e.id];
  if (!it) return `${edHead('Item', 'No existe', { canDelete: false, route: false, undo: false })}`;
  const base = `juego:items.${e.id}`;
  const enPlugin = Boolean(S.catalogo?.items?.[e.id]);
  return `${edHead(`Item · ${e.id}`, itemLabel(it), { canDelete: false })}
  <div class="editor-grid">
    <div class="workspace-col">
      ${card('Así se ve en el juego', 'cube', `<div class="tooltip-box" data-live="tooltip">${itemPreview(e.id)}</div>
        <p class="muted">${enPlugin ? 'El nombre, el lore y los encantamientos salen del plugin.' : 'Este item no vino en el catálogo del plugin (puede que ya no exista o que el servidor no se haya conectado).'}</p>`)}
      ${card('Lo que agrega la web', 'edit', `<div class="grid-2">${fSelect(`${base}.categoria`, 'Categoría', Object.entries(CATEGORIAS).map(([k, v]) => [k, v.nombre || v]))}${fText(`${base}.origen`, 'De dónde sale', { maxlength: 200, placeholder: 'Ej. Misión 40 · Tienda Legendario desde el día 50' })}</div>
        ${fArea(`${base}.descripcion`, 'Qué hace', { rows: 3, maxlength: 600 })}`)}
    </div>
    <aside class="editor-side">
      ${card('Textura', 'image', fImage(`${base}.textura`, 'Textura propia', { kind: 'pixel', name: `textura-${e.id}`, hint: 'PNG de 16×16 o 32×32 (la del resource pack). Sin textura se usa la del item vanilla.' }))}
      ${sideCard(base)}
    </aside>
  </div>`;
}

export function itemPreview(id) {
  const it = game().items[id];
  if (!it) return '';
  return `<span class="icard-a__slot" style="width:72px;height:72px">${itemHtml({ id }, { size: 52, tip: false })}</span><div class="mc-tooltip mc-tooltip--static">${tooltipHtml(it)}</div>`;
}

function edMision(e) {
  const g = game();
  const m = g.misiones.find((x) => x.n === e.n);
  if (!m) return `${edHead('Misión', 'No existe', { canDelete: false, route: false, undo: false })}`;
  const idx = (S.draft.juego.misiones || []).findIndex((x) => x.n === e.n);
  const base = `juego:misiones.${idx}`;
  return `${edHead(`${TIPO[m.tipo]} ${m.tipo === 'extra' ? `de la #${m.padre}` : `#${m.n}`}`, m.nombre, { canDelete: false })}
  <div class="editor-grid">
    <div class="workspace-col">
      ${card('Del plugin', 'server', `<p class="card-panel__text">${esc(m.descripcion)}</p>
        <ul class="steps-list">${m.objetivos.map((o) => `<li>${esc(o.texto)}${o.formato === 'flag' ? '' : ` · <b>${o.meta}</b>`}</li>`).join('')}</ul>
        <p class="muted">${esc(DIF[m.dificultad])} · ${m.dinocoins} DinoCoins${m.dia ? ` · día ${m.dia}` : ''}</p>
        <div class="recipe-preview">${chestHtml(m, { size: 34 })}</div>`)}
      ${card('Lo que agrega la web', 'edit', fMd(`${base}.nota`, 'Nota para los jugadores', { rows: 5, hint: 'Sale en la ventana de la misión: consejos, dónde ir, qué llevar…' }))}
    </div>
    <aside class="editor-side">${card('Imagen', 'image', fImage(`${base}.imagen`, 'Imagen de la misión', { kind: 'wide', name: `mision-${m.n}` }))}${sideCard(base)}</aside>
  </div>`;
}

function edMob(e) {
  const g = game();
  const m = g.mobs.find((x) => x.id === e.id);
  if (!m) return `${edHead('Mob', 'No existe', { canDelete: false, route: false, undo: false })}`;
  const idx = (S.draft.juego.mobs || []).findIndex((x) => x.id === e.id);
  const base = `juego:mobs.${idx}`;
  return `${edHead(`Mob · ${m.id}`, m.nombre, { canDelete: false })}
  <div class="editor-grid">
    <div class="workspace-col">${card('Del plugin', 'server', `<p class="card-panel__text">${esc(m.texto)}</p><p class="muted">${esc(m.donde)} · cambio ${esc(m.etapa || '—')}${m.vida ? ` · ${esc(m.vida)} de vida` : ''}</p>`)}</div>
    <aside class="editor-side">${card('Imagen', 'image', fImage(`${base}.imagen`, 'Imagen o render del mob', { name: `mob-${m.id}`, hint: 'Sin imagen se muestra su huevo de spawn.' }))}${sideCard(base)}</aside>
  </div>`;
}

function edReceta(e) {
  const g = game();
  const r = g.recetas.find((x) => x.id === e.id);
  if (!r) return `${edHead('Crafteo', 'No existe', { canDelete: false, route: false, undo: false })}`;
  const idx = (S.draft.juego.recetas || []).findIndex((x) => x.id === e.id);
  const base = `juego:recetas.${idx}`;
  const res = resolveRef(r.resultado);
  return `${edHead(`Crafteo · cambio ${r.etapa || '—'}`, res ? itemLabel(res.item) : r.id, { canDelete: false })}
  <div class="editor-grid">
    <div class="workspace-col">${card('Del plugin', 'crafting', `<div class="recipe-preview">${recipeHtml(r, { size: 44 })}</div>`)}${card('Lo que agrega la web', 'edit', fText(`${base}.nota`, 'Nota', { maxlength: 200, hint: 'Sale debajo del nombre en la tarjeta del crafteo.' }))}</div>
    <aside class="editor-side">${sideCard(base)}</aside>
  </div>`;
}

// ------------------------------------------------------------------ historial

export function historyHtml(commits) {
  if (!commits.length) return '<p class="muted">Aún no hay versiones publicadas.</p>';
  return `<ul class="history">${commits.map((cm, i) => `<li class="history__item">
    ${cm.author?.avatar_url ? `<img class="history__avatar" src="${esc(cm.author.avatar_url)}" alt="">` : ''}
    <div class="history__main">
      <strong>${esc(cm.commit.message.split('\n')[0])}</strong>
      <span>${esc(cm.author?.login || cm.commit.author?.name || '')} · ${esc(fmtDateTime(cm.commit.author?.date))}${i === 0 ? ' · <b>versión actual</b>' : ''}</span>
    </div>
    ${i === 0 ? '' : `<button class="btn btn--sm btn--ghost" type="button" data-act="restore" data-sha="${esc(cm.sha)}">${icon('refresh')}<span>Cargar</span></button>`}
  </li>`).join('')}</ul>`;
}

export { slugify };

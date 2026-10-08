// Datos en vivo del servidor.
//
// 1. Estado público (online, jugadores conectados, versión) desde api.mcstatus.io (o api.mcsrvstat.us de respaldo).
// 2. Lo que manda el plugin (QuasoPlugin, /web): sube a un repositorio de GitHub tres archivos y avisa al instante por
//    ntfy.sh con el commit nuevo:
//      estado.json     misiones activas, cambios, día, quién está conectado y el hash de los otros dos archivos
//      catalogo.json   items, misiones, crafteos, trabajos, habilidades y mobs tal como están en el plugin
//      jugadores.json  las estadísticas de cada jugador
//    La web lee esos archivos por commit (raw.githubusercontent.com/<repo>/<commit>/...), que no tiene caché vieja, y
//    solo vuelve a bajar el catálogo o los jugadores cuando cambia su hash. Si ntfy no responde, cada minuto revisa
//    la rama (con hasta 5 minutos de caché de GitHub).

const listeners = new Map();
const state = {
  cfg: null,
  status: null,
  estado: null,
  jugadores: null,
  sha: '',
  ref: '',
  generado: 0,
  catalogo: null,
  hashes: { catalogo: '', jugadores: '' },
  quierenJugadores: false,
  conectado: false,
  ultimo: 0,
  error: '',
};

function emit(type, data) {
  for (const fn of listeners.get(type) || []) {
    try { fn(data); } catch (e) { console.error('[live]', e); }
  }
}

export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type).delete(fn);
}

export const live = state;

async function getJson(url, opts = {}) {
  const res = await fetch(url, { cache: 'no-store', ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ------------------------------------------------------------------ estado público del servidor

function address(host, port) {
  return port ? `${host}:${port}` : host;
}

async function statusMcstatus(host, port) {
  const d = await getJson(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(address(host, port))}`);
  return {
    online: Boolean(d.online),
    jugadores: d.players?.online ?? 0,
    max: d.players?.max ?? 0,
    lista: (d.players?.list || []).map((p) => ({ nombre: p.name_clean || p.name_raw || '', uuid: p.uuid || '' })),
    version: d.version?.name_clean || '',
    motd: d.motd?.clean || '',
    icono: d.icon || '',
  };
}

async function statusMcsrvstat(host, port) {
  const d = await getJson(`https://api.mcsrvstat.us/3/${encodeURIComponent(address(host, port))}`);
  return {
    online: Boolean(d.online),
    jugadores: d.players?.online ?? 0,
    max: d.players?.max ?? 0,
    lista: (d.players?.list || []).map((p) => ({ nombre: p.name || '', uuid: p.uuid || '' })),
    version: d.version || '',
    motd: (d.motd?.clean || []).join(' '),
    icono: d.icon || '',
  };
}

async function refreshStatus() {
  const { ipJava, puertoJava } = state.cfg;
  if (!ipJava) return;
  let s = null;
  try { s = await statusMcstatus(ipJava, puertoJava); } catch {
    try { s = await statusMcsrvstat(ipJava, puertoJava); } catch { s = null; }
  }
  if (!s) {
    if (!state.status) { state.status = { online: false, jugadores: 0, max: 0, lista: [], version: '', motd: '', error: true }; emit('status', state.status); }
    return;
  }
  // La lista de la API puede venir vacía o recortada: si el plugin mandó quiénes están, se completa con eso
  state.status = s;
  emit('status', s);
}

// ------------------------------------------------------------------ datos del plugin

const rawUrl = (repo, ref, file) => `https://raw.githubusercontent.com/${repo}/${ref}/${file}`;

const CACHE_CATALOGO = 'croissants:catalogo';

function catalogoGuardado(hash) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_CATALOGO) || 'null');
    return c && c.hash === hash ? c.datos : null;
  } catch {
    return null;
  }
}

async function loadCatalogo(ref, hash) {
  if (!hash || hash === state.hashes.catalogo) return;
  let datos = catalogoGuardado(hash);
  if (!datos) {
    datos = await getJson(rawUrl(state.cfg.live.repo, ref, 'catalogo.json')).catch(() => null);
    if (!datos) return;
    try { localStorage.setItem(CACHE_CATALOGO, JSON.stringify({ hash, datos })); } catch {}
  }
  state.hashes.catalogo = hash;
  state.catalogo = datos;
  emit('catalogo', datos);
}

async function loadJugadores(ref, hash) {
  if (hash && hash === state.hashes.jugadores) return;
  const jugadores = await getJson(rawUrl(state.cfg.live.repo, ref, 'jugadores.json')).catch(() => null);
  if (!jugadores) return;
  state.hashes.jugadores = hash || '';
  state.jugadores = jugadores;
  emit('jugadores', jugadores);
}

async function loadAt(ref, { force = false } = {}) {
  const estado = await getJson(rawUrl(state.cfg.live.repo, ref, 'estado.json')).catch(() => null);
  if (!estado) throw new Error('sin datos');
  const generado = Date.parse(estado.generado || '') || 0;
  // Un aviso viejo (o falso) nunca pisa datos más nuevos
  if (!force && generado && generado < state.generado) return false;
  state.generado = generado || state.generado;
  state.ref = ref;
  if (/^[0-9a-f]{40}$/.test(ref)) state.sha = ref;
  state.estado = estado;
  emit('estado', estado);
  const archivos = estado.archivos || {};
  await loadCatalogo(ref, archivos.catalogo);
  // Los jugadores pesan más: solo se bajan en las páginas que los muestran
  if (state.quierenJugadores) await loadJugadores(ref, archivos.jugadores);
  state.ultimo = Date.now();
  emit('sync', { generado: state.generado, conectado: state.conectado });
  return true;
}

// La página de jugadores o la de misiones los piden: se bajan si todavía no están o si cambiaron
export function wantPlayers() {
  if (state.quierenJugadores) return;
  state.quierenJugadores = true;
  if (state.ref && state.estado) loadJugadores(state.ref, state.estado.archivos?.jugadores);
}

// El commit más nuevo según el último aviso de ntfy (guardado 12 h) o la API de GitHub (1 pedido por visita)
async function latestSha() {
  const { repo, rama, ntfy } = state.cfg.live;
  if (ntfy) {
    try {
      const res = await fetch(`https://ntfy.sh/${encodeURIComponent(ntfy)}/json?poll=1&since=latest`, { cache: 'no-store' });
      if (res.ok) {
        const lines = (await res.text()).trim().split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          const sha = parseSha(lines[i]);
          if (sha) return sha;
        }
      }
    } catch {}
  }
  try {
    const d = await getJson(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(rama || 'main')}`, { headers: { Accept: 'application/vnd.github+json' } });
    if (/^[0-9a-f]{40}$/.test(d?.sha || '')) return d.sha;
  } catch {}
  return '';
}

function parseSha(line) {
  try {
    const ev = JSON.parse(line);
    if (ev.event && ev.event !== 'message') return '';
    const msg = typeof ev.message === 'string' ? ev.message : '';
    const m = msg.match(/[0-9a-f]{40}/);
    if (m) return m[0];
    const inner = JSON.parse(msg);
    return /^[0-9a-f]{40}$/.test(inner?.sha || '') ? inner.sha : '';
  } catch {
    return '';
  }
}

let lastFetch = 0;
let pending = '';
async function onPing(sha) {
  if (!sha || sha === state.sha) return;
  pending = sha;
  const wait = Math.max(0, 3000 - (Date.now() - lastFetch));
  setTimeout(async () => {
    if (pending !== sha) return;
    lastFetch = Date.now();
    try { await loadAt(sha); } catch {}
  }, wait);
}

function subscribe() {
  const { ntfy } = state.cfg.live;
  if (!ntfy || typeof EventSource === 'undefined') return;
  let es;
  let retry = 2000;
  const open = () => {
    es = new EventSource(`https://ntfy.sh/${encodeURIComponent(ntfy)}/sse`);
    es.onopen = () => { state.conectado = true; retry = 2000; emit('sync', { generado: state.generado, conectado: true }); };
    es.onmessage = (e) => { const sha = parseSha(e.data); if (sha) onPing(sha); };
    es.onerror = () => {
      state.conectado = false;
      emit('sync', { generado: state.generado, conectado: false });
      es.close();
      setTimeout(open, retry);
      retry = Math.min(60000, retry * 2);
    };
  };
  open();
  addEventListener('pagehide', () => es?.close());
}

async function pollBranch() {
  const { rama } = state.cfg.live;
  try { await loadAt(rama || 'main'); } catch {}
}

export async function start(cfg) {
  state.cfg = cfg;
  refreshStatus();
  setInterval(() => { if (!document.hidden) refreshStatus(); }, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshStatus(); });

  if (!cfg.live?.repo) { emit('sync', { generado: 0, conectado: false, sinConfigurar: true }); return; }
  const sha = await latestSha();
  try {
    if (sha) await loadAt(sha, { force: true });
    else await loadAt(cfg.live.rama || 'main', { force: true });
  } catch {
    try { await pollBranch(); } catch {}
    if (!state.estado) emit('sync', { generado: 0, conectado: false, sinDatos: true });
  }
  subscribe();
  // Respaldo: si el aviso instantáneo no está conectado, se revisa la rama cada minuto
  setInterval(() => { if (!document.hidden && !state.conectado) pollBranch(); }, 60000);
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden || Date.now() - state.ultimo < 30000) return;
    const latest = await latestSha();
    if (latest && latest !== state.sha) onPing(latest);
  });
}

// Mientras el panel de administración muestra la vista previa no hay conexión real
export function feed(estado, jugadores, catalogo) {
  if (catalogo) { state.catalogo = catalogo; emit('catalogo', catalogo); }
  if (estado) { state.estado = estado; emit('estado', estado); }
  if (jugadores) { state.jugadores = jugadores; emit('jugadores', jugadores); }
}

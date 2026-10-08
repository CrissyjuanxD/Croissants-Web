// Estado compartido de la web y lo que se deduce de él (día de la temporada, misiones abiertas, cambios activos...).
import { visible } from './core.js';

export const S = {
  sitio: null,
  juego: null,
  juegoRaw: null,
  catalogo: null,
  anuncios: null,
  status: null,
  estado: null,
  jugadores: null,
  sync: { generado: 0, conectado: false },
  route: { view: '', parts: [] },
  preview: false,
};

export const ETAPA_DIA = { uno: 1, extra: 14, dos: 20, tres: 35 };

// Día de la temporada: lo manda el plugin (la misión normal más alta que está activa). Si el servidor todavía no
// está conectado se usa el día que puso el admin o el que sale de la fecha de inicio
export function currentDay() {
  if (S.estado && S.estado.dia !== undefined && S.estado.dia !== null && Number.isFinite(Number(S.estado.dia))) return Math.max(0, Number(S.estado.dia));
  const act = S.estado?.misiones?.activas;
  if (Array.isArray(act) && act.length) {
    const normales = new Set((S.juego?.misiones || []).filter((m) => m.tipo === 'normal').map((m) => m.n));
    const abiertas = act.map(Number).filter((n) => normales.has(n));
    return abiertas.length ? Math.max(...abiertas) : 0;
  }
  const g = S.sitio?.general;
  if (g?.diaManual > 0) return g.diaManual;
  if (g?.inicioTemporada) {
    const start = new Date(`${g.inicioTemporada}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const d = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
      return Math.max(0, d);
    }
  }
  return 0;
}

export function hasLiveMissions() {
  return Array.isArray(S.estado?.misiones?.activas);
}

export function activeMissions() {
  if (hasLiveMissions()) return new Set(S.estado.misiones.activas.map(Number));
  const day = currentDay();
  const set = new Set();
  for (const m of S.juego?.misiones || []) {
    if (m.tipo === 'trabajo') set.add(m.n);
    else if (m.dia > 0 && m.dia <= day) set.add(m.n);
  }
  return set;
}

export function stageActive(clave) {
  const c = S.estado?.cambios;
  if (c && typeof c === 'object' && clave in c) return Boolean(c[clave]);
  const day = currentDay();
  return day > 0 && day >= (ETAPA_DIA[clave] ?? 999);
}

export function stageKnown() {
  return Boolean(S.estado?.cambios);
}

// Quién está conectado: lo que manda el plugin en estado.json y la lista pública del servidor
function conectadosDelPlugin() {
  const list = S.estado?.servidor?.conectados;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

export function players() {
  const list = Array.isArray(S.jugadores?.jugadores) ? S.jugadores.jugadores : [];
  const online = new Set([...(S.status?.lista || []).map((p) => p.nombre), ...conectadosDelPlugin()].map((n) => String(n).toLowerCase()));
  const pluginSabe = Array.isArray(S.estado?.servidor?.conectados);
  return list.map((p) => ({ ...p, online: (!pluginSabe && Boolean(p.online)) || online.has(String(p.nombre || '').toLowerCase()) }));
}

export function onlineNames() {
  const fromStatus = (S.status?.lista || []).map((p) => p.nombre).filter(Boolean);
  const fromPlugin = conectadosDelPlugin();
  const fromPlayers = !fromPlugin.length && Array.isArray(S.jugadores?.jugadores) ? S.jugadores.jugadores.filter((p) => p.online).map((p) => p.nombre) : [];
  return [...new Set([...fromPlugin, ...fromPlayers, ...fromStatus])];
}

// Los mobs custom: los del catálogo del plugin (o los de data/juego.json mientras el servidor no se conecta)
export function mobsList() {
  return visible(S.juego?.mobs || []);
}

export function missionsBy(tipo) {
  return visible(S.juego?.misiones || []).filter((m) => m.tipo === tipo);
}

export function mission(n) {
  return (S.juego?.misiones || []).find((m) => m.n === Number(n));
}

export function missionTag(m) {
  if (m.tipo === 'extra') return `Extra #${m.padre}`;
  if (m.tipo === 'trabajo') return `#${m.n}`;
  return `#${m.n}`;
}

export function missionToken(m) {
  if (m.tipo === 'extra') return `${m.padre}ex`;
  if (m.tipo === 'trabajo') return `${m.n}tra`;
  return String(m.n);
}

export function completedBy(n) {
  return players().filter((p) => Array.isArray(p.misiones) && p.misiones.includes(n)).length;
}

export function liveReady() {
  return Boolean(S.estado || S.jugadores);
}

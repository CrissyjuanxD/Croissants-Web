import { escapeHtml, icon, md, fmt, ago, fmtDate, plainText, safeImage, safeUrl, visible } from '../core.js';
import { S, currentDay, activeMissions, onlineNames, liveReady } from '../store.js';
import { mdCtx, calendarHtml, socialLinks, ipValue } from '../components.js';
import { countUp } from '../fx.js';

export function title() { return ''; }

function heads(names, max = 14) {
  if (!names.length) return '';
  const shown = names.slice(0, max);
  return `<div class="heads">${shown.map((n) => `<a class="head" href="#jugadores/${encodeURIComponent(n)}" data-route="jugadores" title="${escapeHtml(n)}"><img src="https://mc-heads.net/avatar/${encodeURIComponent(n)}/48" alt="${escapeHtml(n)}" width="48" height="48" loading="lazy" decoding="async"></a>`).join('')}${names.length > max ? `<span class="head head--more">+${names.length - max}</span>` : ''}</div>`;
}

function statusHtml() {
  const st = S.status;
  const names = onlineNames();
  if (!st) {
    return `<div class="status-card__row"><span class="live-dot is-wait"></span><span>Consultando el servidor…</span></div>`;
  }
  if (!st.online) {
    return `<div class="status-card__row"><span class="live-dot is-off"></span><span><b>Servidor apagado</b> por ahora. Vuelve en un rato.</span></div>`;
  }
  return `<div class="status-card__row"><span class="live-dot"></span><span><b data-count-to="${st.jugadores}">${fmt(st.jugadores)}</b> de ${fmt(st.max)} jugadores conectados</span>${st.version ? `<span class="tag">${escapeHtml(st.version)}</span>` : ''}</div>
    ${names.length ? heads(names) : `<p class="status-card__hint">${st.jugadores ? 'Pasa por <a href="#jugadores" data-route="jugadores">Jugadores</a> para ver quién está.' : 'Nadie conectado justo ahora. ¡Sé el primero!'}</p>`}`;
}

// Los hitos del calendario van repartidos parejo en la barra (no por día exacto), así no se amontonan los que
// caen cerca. El server no tiene fecha de cierre: pasado el último hito la barra sigue avanzando sin llegar al final.
function timeline(cal) {
  const days = [...new Set(cal.map((c) => c.dia).filter((d) => d > 0))].sort((a, b) => a - b);
  if (!days.length) return (d) => Math.min(100, (d / 30) * 100);
  const first = 3;
  const last = days.length > 1 ? 90 : first;
  const step = days.length > 1 ? (last - first) / (days.length - 1) : 0;
  return (d) => {
    if (d <= days[0]) return (first * Math.max(0, d)) / days[0];
    for (let i = 1; i < days.length; i++) {
      if (d <= days[i]) return first + step * (i - 1 + (d - days[i - 1]) / (days[i] - days[i - 1]));
    }
    return last + (100 - last) * (1 - Math.exp(-(d - days[days.length - 1]) / 60));
  };
}

function seasonHtml() {
  const day = currentDay();
  const cal = S.sitio.inicio.calendario || [];
  const next = cal.find((c) => c.dia > day);
  const at = timeline(cal);
  const pct = at(day);
  const phases = [{ d: 1, t: 'Fase 1' }, { d: 20, t: 'Fase 2' }, { d: 35, t: 'Fase 3' }, { d: 56, t: 'Fase 4' }];
  const opened = activeMissions();
  const misiones = S.juego?.misiones || [];
  const normales = misiones.filter((m) => m.tipo === 'normal' && opened.has(m.n)).length;
  const extras = misiones.filter((m) => m.tipo === 'extra' && opened.has(m.n)).length;
  const trabajo = misiones.filter((m) => m.tipo === 'trabajo').length;
  return `<div class="season reveal">
    <div class="season__head">
      <div>
        <p class="kicker"><span class="kicker__num">${day || '—'}</span> día de la temporada</p>
        <h2 class="season__title">${day ? `Día ${day}` : 'La temporada está por empezar'}</h2>
      </div>
      <div class="season__counts">
        <span><b>${normales}</b> misiones abiertas</span>
        <span><b>${extras}</b> extras</span>
        <span><b>${trabajo}</b> de trabajo</span>
      </div>
    </div>
    <div class="season__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-valuetext="Día ${day}">
      <span class="season__fill" style="width:${pct}%"></span>
      ${phases.map((p, i) => `<span class="season__mark${i % 2 ? ' season__mark--alt' : ''}" style="left:${at(p.d)}%"><i></i><small>${p.t}</small></span>`).join('')}
      ${cal.map((c) => `<span class="season__pin${day >= c.dia ? ' is-done' : ''}" style="left:${at(c.dia)}%" title="Día ${c.dia}: ${escapeHtml(c.titulo)}"></span>`).join('')}
    </div>
    ${next ? `<a class="season__next" href="#jugabilidad" data-route="jugabilidad"><span class="season__next-icon">${icon(next.icono || 'flag')}</span><span><small>Lo próximo · día ${next.dia}${day ? ` · faltan ${next.dia - day} ${next.dia - day === 1 ? 'día' : 'días'}` : ''}</small><strong>${escapeHtml(next.titulo)}</strong></span>${icon('arrowRight')}</a>` : ''}
    ${!liveReady() ? `<p class="season__note">${icon('info')} El día se actualiza solo cuando el servidor se conecta con la web.</p>` : ''}
  </div>`;
}

function newsHtml() {
  const list = visible(S.anuncios?.anuncios || []).sort((a, b) => (b.fijado - a.fijado) || (new Date(b.fecha) - new Date(a.fecha))).slice(0, 3);
  if (!list.length) return '';
  const cats = Object.fromEntries((S.anuncios.categorias || []).map((c) => [c.id, c]));
  return `<section class="container section" id="inicio-anuncios">
    <header class="section-head reveal"><p class="kicker"><span class="kicker__num">${icon('megaphone')}</span> lo último</p><h2 class="section-title"><span class="gusty">Anuncios</span></h2></header>
    <div class="news-grid">${list.map((a, i) => {
      const cat = cats[a.categoria] || { nombre: a.categoria, color: '#9d7bff' };
      const img = safeImage(a.portada);
      return `<a class="news-card reveal" style="--c:${escapeHtml(cat.color)}" href="#anuncios/${escapeHtml(a.id)}" data-route="anuncios" data-tilt>
        <span class="news-card__media">${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async">` : `<span class="news-card__ph">${icon('megaphone')}</span>`}</span>
        <span class="news-card__body"><span class="news-card__meta"><span class="cat-chip">${escapeHtml(cat.nombre)}</span><time datetime="${escapeHtml(a.fecha)}">${escapeHtml(fmtDate(a.fecha))}</time>${a.fijado ? `<span class="tag">${icon('star')} Fijado</span>` : ''}</span>
        <strong class="news-card__title">${escapeHtml(a.titulo)}</strong><span class="news-card__text">${escapeHtml(a.resumen || plainText(a.contenido, 140))}</span></span>
      </a>`;
    }).join('')}</div>
    <div class="section-more reveal"><a class="btn btn--ghost" href="#anuncios" data-route="anuncios">Ver todos los anuncios ${icon('arrowRight')}</a></div>
  </section>`;
}

export function render(el, parts, ctx) {
  const c = S.sitio;
  const g = c.general;
  const ini = c.inicio;
  const redes = socialLinks(g.redes, 'social-btn social-btn--lg');
  const twitch = safeUrl(g.redes.twitch);
  el.innerHTML = `
    <div class="hero">
      <div class="hero__inner">
        <p class="hero__kicker reveal"><span class="live-dot"></span><span>${escapeHtml(ini.kicker || 'Servidor de Minecraft')}</span></p>
        <h1 class="hero__logo reveal"><img src="assets/img/logo-segunda.png" alt="${escapeHtml(g.nombre)} ${escapeHtml(g.edicion)}" width="1400" height="378"></h1>
        <p class="hero__lema reveal">${escapeHtml(g.lema)}</p>
        <div class="hero__text md reveal">${md(ini.texto || g.descripcion, mdCtx())}</div>
        <div class="hero__cta reveal">
          <button class="btn btn--primary btn--lg" type="button" data-open-ip>${icon('server')} Ver IP del servidor</button>
          <button class="btn btn--lg hero__copy" type="button" data-copy-ip="java">${icon('copy')} <span class="mono">${escapeHtml(ipValue('java') || '—')}</span></button>
          <a class="btn btn--lg btn--ghost" href="#launcher" data-route="launcher">${icon('download')} Launcher</a>
        </div>
        <div class="status-card reveal" id="home-status">${statusHtml()}</div>
      </div>
      <a class="hero__scroll" href="#inicio-temporada" data-scroll-to="inicio-temporada"><span>Desliza</span>${icon('arrowDown')}</a>
    </div>

    <div class="container section" id="inicio-temporada">${seasonHtml()}</div>

    ${ini.destacados.length ? `<section class="container section">
      <header class="section-head reveal"><p class="kicker"><span class="kicker__num">${icon('sparkle')}</span> qué te espera</p><h2 class="section-title"><span class="gusty">${escapeHtml(ini.titulo || 'Todo lo que trae Croissants')}</span></h2></header>
      <div class="features">${ini.destacados.map((d) => `<a class="feature reveal" href="#${escapeHtml(d.ruta || 'guia')}" data-route="${escapeHtml((d.ruta || 'guia').split('/')[0])}" data-tilt>
        <span class="feature__icon">${icon(d.icono)}</span><strong>${escapeHtml(d.titulo)}</strong><span>${escapeHtml(d.texto)}</span><span class="feature__go">${icon('arrowRight')}</span>
      </a>`).join('')}</div>
    </section>` : ''}

    ${ini.pasos.length ? `<section class="container section">
      <header class="section-head reveal"><p class="kicker"><span class="kicker__num">${icon('route')}</span> para empezar</p><h2 class="section-title"><span class="gusty">Cómo entrar al servidor</span></h2></header>
      <ol class="steps-row">${ini.pasos.map((p, i) => `<li class="step-card reveal"><span class="step-card__num">${i + 1}</span><span class="step-card__icon">${icon(p.icono)}</span><strong>${escapeHtml(p.titulo)}</strong><div class="md">${md(p.texto, mdCtx())}</div></li>`).join('')}</ol>
    </section>` : ''}

    ${newsHtml()}

    ${ini.calendario.length ? `<section class="container section">
      <header class="section-head reveal"><p class="kicker"><span class="kicker__num">${icon('calendar')}</span> calendario</p><h2 class="section-title"><span class="gusty">El mundo se abre por partes</span></h2></header>
      <div class="reveal">${calendarHtml()}</div>
    </section>` : ''}

    <section class="container section">
      <div class="host-viciont">
        <article class="host-card reveal" data-tilt>
          <p class="kicker"><span class="kicker__num">${icon('twitch')}</span> el anfitrión</p>
          <h2 class="host-card__title">El servidor de <span class="grad-text">${escapeHtml(g.anfitrion)}</span></h2>
          <p>Croissants es el SMP público de ${escapeHtml(g.anfitrion)}. Síguelo para enterarte de las activaciones de cambios y los directos dentro del servidor.</p>
          ${twitch ? `<a class="btn btn--primary twitch-btn" href="${escapeHtml(twitch)}" target="_blank" rel="noopener noreferrer">${icon('twitch')} Ver a ${escapeHtml(g.anfitrion)} en Twitch</a>` : ''}
          ${redes ? `<div class="host-card__socials">${redes}</div>` : ''}
        </article>
        <a class="viciont-card reveal" href="${escapeHtml(safeUrl(g.viciont.url) || '#')}" target="_blank" rel="noopener noreferrer" data-tilt>
          <img class="viciont-card__emblem" src="assets/img/viciont-emblem.webp" alt="" width="587" height="513" loading="lazy">
          <p class="kicker">un proyecto de</p>
          <h2 class="viciont-card__title">VICIONT <span>STUDIOS</span></h2>
          <div class="md">${md(ini.viciont || 'Croissants está hecho por **Viciont Studios**: el plugin, las misiones, los bosses, las dimensiones, el launcher y esta web.', mdCtx())}</div>
          <span class="viciont-card__go">Conocer el estudio ${icon('external')}</span>
        </a>
      </div>
    </section>`;
}

export function update(el, kind) {
  if (kind === 'status' || kind === 'jugadores') {
    const box = el.querySelector('#home-status');
    if (box) {
      box.innerHTML = statusHtml();
      const n = box.querySelector('[data-count-to]');
      if (n) countUp(n, Number(n.dataset.countTo), { format: (v) => fmt(v) });
    }
  }
  if (kind === 'estado' || kind === 'sync') {
    const box = el.querySelector('#inicio-temporada');
    if (box) { box.innerHTML = seasonHtml(); box.querySelector('.reveal')?.classList.remove('reveal'); }
  }
}

document.addEventListener('click', (e) => {
  const a = e.target.closest?.('[data-scroll-to]');
  if (!a) return;
  e.preventDefault();
  document.getElementById(a.dataset.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

import { escapeHtml, icon, md, safeUrl, fmtDate } from '../core.js';
import { S } from '../store.js';
import { pageHead, mdCtx } from '../components.js';

let release = null;
let asked = false;

export function title() { return ''; }

async function loadRelease(el) {
  if (asked) return;
  asked = true;
  const repo = S.sitio.general.launcherRepo;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) return;
  const KEY = 'croissants-launcher-release';
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < 10 * 60000) release = cached;
  } catch {}
  if (!release) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = await res.json();
      release = { at: Date.now(), version: String(r.tag_name || '').replace(/^v/i, ''), date: r.published_at || null };
      try { sessionStorage.setItem(KEY, JSON.stringify(release)); } catch {}
    } catch {
      return;
    }
  }
  const meta = el.querySelector('#launcher-meta');
  if (meta && release?.version) meta.innerHTML = `<span>Versión ${escapeHtml(release.version)}</span>${release.date ? `<span>${escapeHtml(fmtDate(release.date))}</span>` : ''}`;
}

export function render(el) {
  const g = S.sitio.general;
  const l = S.sitio.launcher;
  const url = safeUrl(g.launcherUrl) || 'https://viciontstudios.pages.dev/#launcher';
  el.innerHTML = `<div class="container">
    ${pageHead({ crumbs: ['launcher'], title: l.titulo || 'Viciont Studios Launcher', intro: l.texto, icon: 'download' })}
    <div class="launcher">
      <div class="launcher__card reveal">
        <div class="launcher__app">
          <img class="launcher__icon" src="assets/img/viciont-launcher.png" alt="" width="96" height="96">
          <div><p class="launcher__name">Viciont Studios Launcher</p><p class="launcher__meta" id="launcher-meta"><span>Última versión</span></p></div>
        </div>
        <a class="dl-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
          <span class="dl-btn__icon">${icon('download')}</span>
          <span class="dl-btn__text"><strong>Descargar el launcher</strong><small>En la página oficial de Viciont Studios · Windows, macOS y Linux</small></span>
          ${icon('external')}
        </a>
        ${l.pasos.length ? `<ol class="launcher__steps">${l.pasos.map((p, i) => `<li><span>${i + 1}</span><div class="md">${md(p, mdCtx())}</div></li>`).join('')}</ol>` : ''}
        <p class="launcher__alt">${icon('info')}<span>¿Prefieres tu propio launcher? Puedes entrar con cualquier Minecraft Java ${escapeHtml(g.versionJava || '')} o desde Bedrock con la <button class="link-btn" type="button" data-open-ip>IP del servidor</button>, pero sin el modpack ni las texturas.</span></p>
      </div>
      <div class="launcher__shots reveal">
        <img src="assets/img/launcher-inicio.webp" alt="Viciont Studios Launcher: pantalla de inicio" loading="lazy" decoding="async" width="1600" height="1000">
        <img src="assets/img/launcher-instancia.webp" alt="Viciont Studios Launcher: la instancia de un servidor" loading="lazy" decoding="async" width="1600" height="1000">
      </div>
    </div>
    ${l.beneficios.length ? `<section class="section">
      <header class="section-head reveal"><p class="kicker"><span class="kicker__num">${icon('sparkle')}</span> por qué usarlo</p><h2 class="section-title"><span class="gusty">La mejor forma de jugar Croissants</span></h2></header>
      <div class="features">${l.beneficios.map((b) => `<div class="feature feature--static reveal"><span class="feature__icon">${icon(b.icono)}</span><strong>${escapeHtml(b.titulo)}</strong><span>${escapeHtml(b.texto)}</span></div>`).join('')}</div>
    </section>` : ''}
  </div>`;
  loadRelease(el);
}

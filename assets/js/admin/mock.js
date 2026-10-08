// Solo para probar el panel en tu PC (http://localhost:…/admin/?prueba): hace como GitHub sin token. Lee los
// archivos de la carpeta y "publica" en memoria. En la web publicada no hace nada.
import { SITE_ROOT } from './kit.js';

export const pruebaLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && new URLSearchParams(location.search).has('prueba');

export class GitHubPrueba {
  constructor({ owner, repo, branch }) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
  }

  async user() { return { login: 'prueba-local', avatar_url: '' }; }

  async repoInfo() { return { permissions: { push: true } }; }

  async getText(path) {
    // El repositorio de datos en vivo: un catálogo armado con data/juego.json para probar
    if (path === 'catalogo.json' || path === 'estado.json') {
      const juego = await (await fetch(new URL('data/juego.json', SITE_ROOT), { cache: 'no-store' })).json();
      if (path === 'estado.json') {
        return { sha: 'prueba', text: JSON.stringify({ generado: new Date().toISOString(), dia: 3, misiones: { activas: [1, 2, 3, 101] }, cambios: { uno: true, extra: false, dos: false, tres: false }, archivos: { catalogo: 'prueba', jugadores: 'prueba' } }) };
      }
      const { items, misiones, recetas, trabajos, habilidades, costosHabilidad, mobs } = juego;
      return { sha: 'prueba', text: JSON.stringify({ version: 1, plugin: 'prueba', generado: new Date().toISOString(), items, misiones, recetas, trabajos, habilidades, costosHabilidad, mobs }) };
    }
    const res = await fetch(new URL(path, SITE_ROOT), { cache: 'no-store' });
    if (!res.ok) { const err = new Error(`HTTP ${res.status}`); err.status = res.status; throw err; }
    return { sha: `prueba-${path}`, text: await res.text() };
  }

  async commitFiles({ files, message, onProgress }) {
    const shas = {};
    files.forEach((f, i) => { shas[f.path] = `prueba-${Date.now()}-${i}`; onProgress?.(i + 1, files.length); });
    console.info('[prueba] commit', message, files.map((f) => `${f.path} (${f.content.length} caracteres)`));
    window.__ultimoCommitPrueba = { message, files };
    return { commit: { sha: `${Date.now().toString(16)}0000000000000000000000000000`.slice(0, 40) }, shas };
  }

  async history() { return []; }
}

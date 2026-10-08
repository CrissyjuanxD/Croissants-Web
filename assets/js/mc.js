// Todo lo que se ve "como en el juego": texto con códigos de color, items con su textura y brillo, tooltips,
// la mesa de crafteo, el alto horno, la herrería y el cofre de recompensas de las misiones.
import { escapeHtml, safeImage, fmt } from './core.js';

const COLORS = {
  0: '#000000', 1: '#0000AA', 2: '#00AA00', 3: '#00AAAA', 4: '#AA0000', 5: '#AA00AA', 6: '#FFAA00', 7: '#AAAAAA',
  8: '#555555', 9: '#5555FF', a: '#55FF55', b: '#55FFFF', c: '#FF5555', d: '#FF55FF', e: '#FFFF55', f: '#FFFFFF',
};
const RARITY = { common: '#FFFFFF', uncommon: '#FFFF55', rare: '#55FFFF', epic: '#FF55FF' };
const VANILLA_RARITY = {
  enchanted_golden_apple: 'epic', golden_apple: 'rare', totem_of_undying: 'uncommon', beacon: 'rare', dragon_head: 'epic',
  dragon_egg: 'epic', elytra: 'epic', experience_bottle: 'uncommon', enchanted_book: 'uncommon', heart_of_the_sea: 'rare',
  nether_star: 'rare', trident: 'epic', player_head: 'uncommon', netherite_upgrade_smithing_template: 'uncommon', mace: 'epic',
  end_crystal: 'rare', conduit: 'rare', creeper_head: 'uncommon', zombie_head: 'uncommon', skeleton_skull: 'uncommon',
  wither_skeleton_skull: 'rare', piglin_head: 'uncommon', knowledge_book: 'epic', nautilus_shell: 'uncommon', echo_shard: 'uncommon',
};
const HARMFUL = new Set(['slowness', 'mining_fatigue', 'instant_damage', 'nausea', 'blindness', 'hunger', 'weakness', 'poison', 'wither',
  'levitation', 'unluck', 'bad_omen', 'darkness', 'infested', 'oozing', 'weaving', 'wind_charged', 'raid_omen', 'trial_omen']);
const POTION_TIME = {
  night_vision: [3600, 9600], invisibility: [3600, 9600], leaping: [3600, 9600, 1800], fire_resistance: [3600, 9600],
  swiftness: [3600, 9600, 1800], slowness: [1800, 4800, 400], water_breathing: [3600, 9600], healing: [0, 0, 0], harming: [0, 0, 0],
  poison: [900, 1800, 432], regeneration: [900, 1800, 450], strength: [3600, 9600, 1800], weakness: [1800, 4800],
  slow_falling: [1800, 4800], turtle_master: [400, 800, 400],
};
const POTION_EFFECT = { swiftness: 'speed', leaping: 'jump_boost', healing: 'instant_health', harming: 'instant_damage' };

// Las rutas que van dentro de variables CSS (máscaras) tienen que ser absolutas: si no, el navegador las resuelve desde
// la carpeta del CSS
const abs = (u) => { try { return new URL(u, document.baseURI).href; } catch { return u; } };

let G = { items: {}, idioma: { vanilla: {}, encantamientos: {}, efectos: {}, atributos: {}, pociones: {}, romanos: {}, ranuras: {} } };
let resolveUrl = (u) => u;

export function setGameData(juego, { resolve } = {}) {
  G = juego;
  if (resolve) resolveUrl = resolve;
}

// ------------------------------------------------------------------ texto con códigos (§ o &)

export function parseLegacy(text, base = {}) {
  const segs = [];
  let style = { c: base.c ?? null, b: base.b ?? false, i: base.i ?? false, u: false, s: false, o: false };
  let buf = '';
  const push = () => { if (buf) { segs.push({ t: buf, ...style }); buf = ''; } };
  const s = String(text ?? '');
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if ((ch === '§' || ch === '&') && k + 1 < s.length) {
      const code = s[k + 1].toLowerCase();
      // §x§R§R§G§G§B§B
      if (code === 'x' && k + 13 < s.length + 0) {
        const hex = s.slice(k + 2, k + 14).replace(/[§&]/g, '');
        if (/^[0-9a-f]{6}$/i.test(hex) && s.slice(k + 2, k + 14).length === 12) {
          push();
          style = { c: `#${hex}`, b: false, i: false, u: false, s: false, o: false };
          k += 13;
          continue;
        }
      }
      // &#RRGGBB (atajo para escribir en el panel)
      if (code === '#' && /^[0-9a-f]{6}$/i.test(s.slice(k + 2, k + 8))) {
        push();
        style = { c: `#${s.slice(k + 2, k + 8)}`, b: false, i: false, u: false, s: false, o: false };
        k += 7;
        continue;
      }
      if (COLORS[code]) { push(); style = { c: COLORS[code], b: false, i: false, u: false, s: false, o: false }; k++; continue; }
      if ('klmnor'.includes(code)) {
        push();
        if (code === 'r') style = { c: base.c ?? null, b: false, i: false, u: false, s: false, o: false };
        else style = { ...style, [{ k: 'o', l: 'b', m: 's', n: 'u', o: 'i' }[code]]: true };
        k++;
        continue;
      }
    }
    buf += ch;
  }
  push();
  return segs;
}

function segStyle(seg, fallback) {
  const css = [];
  css.push(`color:${seg.c || fallback.c || '#FFFFFF'}`);
  const italic = seg.i ?? fallback.i;
  if (italic) css.push('font-style:italic');
  if (seg.b ?? fallback.b) css.push('font-weight:700');
  const deco = [];
  if (seg.u) deco.push('underline');
  if (seg.s) deco.push('line-through');
  if (deco.length) css.push(`text-decoration:${deco.join(' ')}`);
  return css.join(';');
}

export function segsHtml(segs, fallback = {}) {
  return segs.map((seg) => {
    const t = escapeHtml(seg.t);
    const o = seg.o ? ' class="mc-o"' : '';
    return `<span${o} style="${segStyle(seg, fallback)}">${t}</span>`;
  }).join('');
}

// Segmentos que vienen del plugin cuando el texto es un Component (1 = sí, 0 = no, ausente = hereda)
function compSegs(list, base) {
  return (list || []).map((s) => ({ t: s.t, c: s.c || null, b: s.b === 1 ? true : s.b === 0 ? false : base.b, i: s.i === 1 ? true : s.i === 0 ? false : base.i, u: s.u === 1, s: s.s === 1, o: s.o === 1 }));
}

export function legacyHtml(text, fallback = {}) {
  return segsHtml(parseLegacy(text, fallback), fallback);
}

export function stripCodes(text) {
  return String(text ?? '').replace(/[§&]x([§&][0-9a-f]){6}/gi, '').replace(/&#[0-9a-f]{6}/gi, '').replace(/[§&][0-9a-fk-or]/gi, '');
}

// ------------------------------------------------------------------ items

export function resolveRef(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') {
    if (ref.startsWith('minecraft:')) return { item: { material: ref.slice(10), vanilla: true }, n: 1 };
    const it = G.items?.[ref];
    return it ? { item: { ...it, id: ref }, n: 1 } : { item: { material: 'barrier', vanilla: true, nombre: ref }, n: 1 };
  }
  if (ref.id) {
    const it = G.items?.[ref.id];
    if (it) return { item: { ...it, id: ref.id }, n: ref.n ?? 1 };
    if (ref.id.startsWith('minecraft:')) return { item: { material: ref.id.slice(10), vanilla: true }, n: ref.n ?? 1 };
    return { item: { material: 'barrier', vanilla: true, nombre: ref.id }, n: ref.n ?? 1 };
  }
  const { n, ...rest } = ref;
  return { item: { ...rest, vanilla: true }, n: n ?? 1 };
}

const romano = (n) => G.idioma?.romanos?.[n] || ({ 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' })[n] || String(n);
const enchName = (k) => G.idioma?.encantamientos?.[k] || G.idioma?.encantamientos?.[k.replace(/^minecraft:/, '')] || k.replace(/^.*:/, '').replace(/_/g, ' ');
const effectName = (k) => G.idioma?.efectos?.[k] || k.replace(/_/g, ' ');

export function vanillaName(mat) {
  return G.idioma?.vanilla?.[mat] || String(mat || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function potionBase(item) {
  const type = String(item.pocion || '').replace(/^(long|strong)_/, '');
  return type;
}

export function itemNameSegs(item) {
  const rarity = item.rareza || VANILLA_RARITY[item.material] || 'common';
  let color = RARITY[rarity] || '#FFFFFF';
  if ((item.encantamientos && Object.keys(item.encantamientos).length) && (rarity === 'common' || rarity === 'uncommon')) color = RARITY.rare;
  if (item.nombreSeg) return compSegs(item.nombreSeg, { c: color, i: true, b: false });
  if (item.nombre) return parseLegacy(item.nombre, { c: color, i: false });
  let name = vanillaName(item.material);
  if (item.pocion && /potion$/.test(item.material)) {
    const base = potionBase(item);
    const table = item.material === 'splash_potion' ? G.idioma?.pocionesArrojadizas : G.idioma?.pociones;
    name = table?.[base] || name;
  }
  return [{ t: name, c: color, i: false }];
}

export function itemName(item) {
  return itemNameSegs(item).map((s) => s.t).join('');
}

// Nombre para listas y catálogos: igual que en el juego, salvo los libros sin nombre propio, que se llaman por su
// encantamiento (Libro de Paso Ígneo I)
export function itemLabel(item) {
  if (!item.nombre && !item.nombreSeg && item.material === 'enchanted_book' && item.guardados) {
    const [k, lvl] = Object.entries(item.guardados)[0] || [];
    if (k) return `Libro de ${enchName(k)} ${romano(lvl)}`;
  }
  return stripCodes(itemName(item));
}

function ticksToTime(t) {
  const s = Math.round(t / 20);
  if (s >= 3600) return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function attrLine(a) {
  const name = G.idioma?.atributos?.[a.atributo] || G.idioma?.atributos?.[`generic.${a.atributo}`] || a.atributo.replace(/_/g, ' ');
  let v = Number(a.valor) || 0;
  if (a.atributo === 'knockback_resistance') v *= 10;
  const pct = a.operacion && a.operacion !== 'ADD_NUMBER';
  const val = `${v > 0 ? '+' : ''}${pct ? Math.round(v * 100) : Math.round(v * 100) / 100}${pct ? '%' : ''}`;
  return [{ t: `${name}: ${val}`, c: v >= 0 ? '#5555FF' : '#FF5555' }];
}

const SLOT_KEYS = { head: 'head', chest: 'chest', legs: 'legs', feet: 'feet', mainhand: 'mainhand', offhand: 'offhand', hand: 'hand', armor: 'armor', any: 'any', body: 'body' };

// Líneas del tooltip en el orden del juego
export function tooltipLines(item) {
  const lines = [itemNameSegs(item)];
  const hide = new Set(item.ocultar || []);
  const gray = '#AAAAAA';
  for (const [k, lvl] of Object.entries(item.guardados || {})) lines.push([{ t: `${enchName(k)} ${romano(lvl)}`, c: gray }]);
  if (!hide.has('encantamientos')) {
    for (const [k, lvl] of Object.entries(item.encantamientos || {})) {
      const curse = /curse/.test(k);
      lines.push([{ t: `${enchName(k)}${(lvl > 1 || !/mending|infinity|silk_touch|flame|aqua_affinity|channeling|multishot/.test(k)) ? ' ' + romano(lvl) : ''}`, c: curse ? '#FF5555' : gray }]);
    }
  }
  if (!hide.has('extra')) {
    if (item.efectos?.length) {
      for (const e of item.efectos) {
        const harm = HARMFUL.has(e.efecto);
        const lvl = e.nivel > 1 ? ` ${romano(e.nivel)}` : '';
        const dur = e.ticks > 20 ? ` (${ticksToTime(e.ticks)})` : '';
        lines.push([{ t: `${effectName(e.efecto)}${lvl}${dur}`, c: harm ? '#FF5555' : '#5555FF' }]);
      }
    } else if (item.pocion && /potion|tipped/.test(item.material)) {
      const raw = String(item.pocion);
      const base = potionBase(item);
      const eff = POTION_EFFECT[base] || base;
      const times = POTION_TIME[base];
      const idx = raw.startsWith('long_') ? 1 : raw.startsWith('strong_') ? 2 : 0;
      const t = times ? times[idx] ?? times[0] : 0;
      const lvl = raw.startsWith('strong_') ? ' II' : '';
      lines.push([{ t: `${effectName(eff)}${lvl}${t ? ` (${ticksToTime(t)})` : ''}`, c: HARMFUL.has(eff) ? '#FF5555' : '#5555FF' }]);
    }
  }
  if (item.loreSeg) for (const l of item.loreSeg) lines.push(compSegs(l, { c: '#AA00AA', i: true }));
  else if (item.lore) for (const l of item.lore) lines.push(parseLegacy(l, { c: '#AA00AA', i: false }));
  if (!hide.has('atributos') && item.atributos?.length) {
    const bySlot = new Map();
    for (const a of item.atributos) {
      const k = SLOT_KEYS[a.ranura] || a.ranura || 'any';
      if (!bySlot.has(k)) bySlot.set(k, []);
      bySlot.get(k).push(a);
    }
    for (const [slot, attrs] of bySlot) {
      lines.push([{ t: '' }]);
      lines.push([{ t: G.idioma?.ranuras?.[slot] || `${slot}:`, c: gray }]);
      for (const a of attrs) lines.push(attrLine(a));
    }
  }
  if (item.irrompible) lines.push([{ t: 'Irrompible', c: '#5555FF' }]);
  return lines;
}

export function tooltipHtml(item, { n = 1, info = true } = {}) {
  const lines = tooltipLines(item);
  const body = lines.map((l, k) => `<div class="mc-tooltip__line${k === 0 ? ' mc-tooltip__name' : ''}">${segsHtml(l, { c: '#AAAAAA' }) || '&nbsp;'}</div>`).join('');
  let extra = '';
  if (info && (item.descripcion || item.origen)) {
    extra = `<div class="mc-tooltip__info">${item.descripcion ? `<div>${escapeHtml(item.descripcion)}</div>` : ''}${item.origen ? `<div><b>De dónde sale:</b> ${escapeHtml(item.origen)}</div>` : ''}</div>`;
  }
  const count = n > 1 ? `<div class="mc-tooltip__info"><b>Cantidad:</b> ${fmt(n)}</div>` : '';
  return body + extra + count;
}

export function textureOf(item) {
  const custom = safeImage(item.textura);
  if (custom) return resolveUrl(custom);
  return resolveUrl(`assets/textures/${item.material}.png`);
}

const TINTABLE = new Set(['potion', 'splash_potion', 'lingering_potion', 'tipped_arrow', 'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots', 'firework_star']);

export function hasGlint(item) {
  if (item.brillo === false) return false;
  return Boolean(item.brillo || (item.encantamientos && Object.keys(item.encantamientos).length) || (item.guardados && Object.keys(item.guardados).length)
    || item.material === 'enchanted_golden_apple' || item.material === 'experience_bottle' || item.material === 'enchanted_book' || item.material === 'nether_star');
}

// Ícono de un item. ref: {id, n} o {vanilla, material, ...}. data-mc guarda la referencia para el tooltip
export function itemHtml(ref, { size = 40, count = true, tip = true, cls = '' } = {}) {
  const r = resolveRef(ref);
  if (!r) return '';
  const { item, n } = r;
  const glint = hasGlint(item);
  let inner;
  if (item.cabeza) {
    inner = `<img class="mc-item__head" src="https://mc-heads.net/avatar/${encodeURIComponent(item.cabeza)}/64" alt="" loading="lazy" decoding="async">`;
  } else if (!safeImage(item.textura) && item.color && TINTABLE.has(item.material)) {
    const base = resolveUrl(`assets/textures/${item.material}.base.png`);
    const tint = resolveUrl(`assets/textures/${item.material}.tinte.png`);
    inner = `<span class="mc-item__tint" style="--tint:${escapeHtml(item.color)};--mask:url('${escapeHtml(abs(tint))}')"></span><img class="mc-item__layer" src="${base}" alt="" loading="lazy" decoding="async">`;
  } else {
    inner = `<img class="mc-item__img" src="${escapeHtml(textureOf(item))}" alt="" loading="lazy" decoding="async">`;
  }
  const mask = `url('${escapeHtml(abs(textureOf(item)))}')`;
  const label = escapeHtml(itemName(item));
  const data = tip ? ` data-mc="${escapeHtml(JSON.stringify(typeof ref === 'string' ? { id: ref } : ref))}" tabindex="0" role="img" aria-label="${label}${n > 1 ? ` x${n}` : ''}"` : ` aria-hidden="true"`;
  return `<span class="mc-item${glint && !item.cabeza ? ' is-glint' : ''}${cls ? ' ' + cls : ''}" style="--s:${size}px;--mask:${mask}"${data}>${inner}${count && n > 1 ? `<span class="mc-item__count">${n}</span>` : ''}</span>`;
}

// Chip en línea: ícono pequeño + nombre (para textos de la guía)
export function itemChipHtml(ref) {
  const r = resolveRef(ref);
  if (!r) return '';
  return `<span class="item-chip" data-mc="${escapeHtml(JSON.stringify(typeof ref === 'string' ? { id: ref } : ref))}" tabindex="0">${itemHtml(ref, { size: 22, count: false, tip: false })}<span class="item-chip__name">${segsHtml(itemNameSegs(r.item).map((s) => ({ ...s, i: false })), { c: '#fff' })}</span>${r.n > 1 ? `<span class="item-chip__n">x${r.n}</span>` : ''}</span>`;
}

export function slotHtml(ref, { size = 52, cls = '' } = {}) {
  if (!ref) return `<span class="mc-slot is-empty${cls ? ' ' + cls : ''}" style="--slot:${size}px"></span>`;
  return `<span class="mc-slot${cls ? ' ' + cls : ''}" style="--slot:${size}px">${itemHtml(ref, { size: Math.round(size * 0.72) })}</span>`;
}

// ------------------------------------------------------------------ mesas

const RECIPE_TITLES = { crafteo: 'Mesa de crafteo', crafteo_libre: 'Mesa de crafteo (sin forma)', alto_horno: 'Alto horno', horno: 'Horno', ahumador: 'Ahumador', herreria: 'Mesa de herrería' };
const RECIPE_ICON = { crafteo: 'crafting_table', crafteo_libre: 'crafting_table', alto_horno: 'blast_furnace', horno: 'furnace', ahumador: 'smoker', herreria: 'smithing_table' };

export function recipeTitle(r) { return RECIPE_TITLES[r.tipo] || 'Receta'; }
export function recipeStation(r) { return RECIPE_ICON[r.tipo] || 'crafting_table'; }

export function recipeHtml(r, { size = 48 } = {}) {
  const arrow = `<span class="mc-arrow" aria-hidden="true"></span>`;
  const result = `<span class="mc-result">${slotHtml(r.resultado, { size: Math.round(size * 1.3), cls: 'mc-slot--result' })}</span>`;
  if (r.tipo === 'crafteo' || r.tipo === 'crafteo_libre') {
    const grid = [];
    if (r.tipo === 'crafteo') {
      const rows = (r.forma || []).slice(0, 3);
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const ch = rows[y]?.[x];
          grid.push(ch && ch !== ' ' ? r.ingredientes?.[ch] || null : null);
        }
      }
    } else {
      for (let k = 0; k < 9; k++) grid.push(r.lista?.[k] || null);
    }
    return `<div class="mc-panel mc-recipe" style="--slot:${size}px">
      <div class="mc-panel__title">${escapeHtml(recipeTitle(r))}</div>
      <div class="mc-recipe__row"><div class="mc-grid">${grid.map((g) => slotHtml(g, { size })).join('')}</div>${arrow}${result}</div>
    </div>`;
  }
  if (['alto_horno', 'horno', 'ahumador'].includes(r.tipo)) {
    const secs = Number(r.segundos) || 10;
    const time = secs >= 60 ? `${Math.round(secs / 60 * 10) / 10} min` : `${secs} s`;
    return `<div class="mc-panel mc-recipe" style="--slot:${size}px">
      <div class="mc-panel__title">${escapeHtml(recipeTitle(r))}</div>
      <div class="mc-recipe__row">
        <div class="mc-furnace">${slotHtml(r.entrada, { size })}<span class="mc-flame" aria-hidden="true"></span>${slotHtml({ vanilla: true, material: 'coal', n: 1 }, { size, cls: 'mc-slot--fuel' })}</div>
        <div class="mc-cook">${arrow}<span class="mc-cook__time">${escapeHtml(time)}</span></div>
        ${result}
      </div>
    </div>`;
  }
  if (r.tipo === 'herreria') {
    return `<div class="mc-panel mc-recipe" style="--slot:${size}px">
      <div class="mc-panel__title">${escapeHtml(recipeTitle(r))}</div>
      <div class="mc-recipe__row"><div class="mc-smith">${slotHtml(r.plantilla, { size })}${slotHtml(r.base, { size })}${slotHtml(r.adicion, { size })}</div>${arrow}${result}</div>
    </div>`;
  }
  return '';
}

// ------------------------------------------------------------------ cofre de recompensas (igual que MissionRewards.chest)

const LEFT = [11, 10, 12, 9, 2, 20, 1, 19, 3, 21, 0, 18];
const RIGHT = [15, 16, 14, 17, 6, 24, 7, 25, 5, 23, 8, 26];
const XP = { facil: 1, media: 2, dificil: 3, muy_dificil: 4 };

export function maxStack(item) {
  if (item.maxStack) return item.maxStack;
  const n = item.material || '';
  if (/(_sword|_pickaxe|_axe|_shovel|_hoe|_helmet|_chestplate|_leggings|_boots|_spear|_horse_armor|nautilus_armor)$/.test(n)
    || ['bow', 'crossbow', 'trident', 'elytra', 'shield', 'fishing_rod', 'totem_of_undying', 'enchanted_book', 'saddle', 'mace', 'cake', 'knowledge_book'].includes(n)
    || /potion$/.test(n) || /shulker_box$/.test(n) || /_bucket$/.test(n)) return 1;
  if (['ender_pearl', 'egg', 'snowball', 'honey_bottle', 'bucket', 'armor_stand', 'wind_charge'].includes(n) || /_sign$|_banner$/.test(n)) return 16;
  return 64;
}

export function rewardChest(m) {
  const slots = new Array(27).fill(null);
  slots[13] = { id: 'dinocoins', n: m.dinocoins };
  const next = [0, 0];
  (m.recompensas || []).forEach((group, g) => {
    const side = g % 2;
    const order = side === 0 ? LEFT : RIGHT;
    for (const ref of group) {
      const r = resolveRef(ref);
      if (!r) continue;
      const max = Math.max(1, maxStack(r.item));
      let amount = r.n;
      while (amount > 0) {
        const piece = { ...ref, n: Math.min(max, amount) };
        amount -= piece.n;
        let slot = -1;
        while (slot === -1 && next[side] < order.length) {
          const cand = order[next[side]++];
          if (!slots[cand]) slot = cand;
        }
        if (slot === -1) slot = slots.findIndex((x) => !x);
        if (slot === -1) break;
        slots[slot] = piece;
      }
    }
  });
  const xp = XP[m.dificultad] || 1;
  let bottles = 0;
  for (let k = 0; k < 27; k++) if (!slots[k]) { slots[k] = { vanilla: true, material: 'experience_bottle', n: xp }; bottles += xp; }
  return { slots, bottles };
}

export function chestHtml(m, { size = 44 } = {}) {
  const { slots } = rewardChest(m);
  return `<div class="mc-panel mc-chest" style="--slot:${size}px"><div class="mc-panel__title">Cofre de la misión</div><div class="mc-chest__grid">${slots.map((s) => slotHtml(s, { size })).join('')}</div></div>`;
}

// ------------------------------------------------------------------ tooltip flotante

export function bindTooltips(root = document) {
  const tip = document.createElement('div');
  tip.className = 'mc-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  let current = null;
  let raf = 0;
  let px = 0, py = 0;

  const place = () => {
    raf = 0;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = px + 16, y = py - h - 10;
    if (y < 8) y = py + 22;
    if (x + w > innerWidth - 8) x = px - w - 16;
    if (x < 8) x = 8;
    if (y + h > innerHeight - 8) y = innerHeight - h - 8;
    tip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  };
  const show = (el, x, y) => {
    let ref;
    try { ref = JSON.parse(el.dataset.mc); } catch { return; }
    const r = resolveRef(ref);
    if (!r) return;
    current = el;
    tip.innerHTML = tooltipHtml(r.item, { n: r.n });
    tip.classList.add('on');
    px = x; py = y;
    place();
  };
  const hide = () => { current = null; tip.classList.remove('on'); };

  root.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('[data-mc]');
    if (!el || el === current) return;
    if (e.pointerType === 'touch') return;
    show(el, e.clientX, e.clientY);
  });
  root.addEventListener('pointermove', (e) => {
    if (!current) return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(place);
  }, { passive: true });
  root.addEventListener('pointerout', (e) => {
    if (!current) return;
    const to = e.relatedTarget;
    if (to && current.contains(to)) return;
    if (to?.closest?.('[data-mc]') === current) return;
    hide();
  });
  root.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-mc]');
    if (!el) { if (current) hide(); return; }
    if (current === el) { hide(); return; }
    const r = el.getBoundingClientRect();
    show(el, r.left + r.width / 2, r.top);
  });
  root.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-mc]');
    if (!el || !el.matches(':focus-visible')) return;
    const r = el.getBoundingClientRect();
    show(el, r.right, r.top);
  });
  root.addEventListener('focusout', hide);
  window.addEventListener('scroll', () => { if (current && !matchMedia('(hover: hover)').matches) hide(); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  return { hide };
}

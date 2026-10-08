"""Convierte el volcado del plugin (tools/plugin-dump) en data/juego.json.

Uso:
    python tools/importar_plugin.py <dump.json> <es_es.json> [data/juego.json]

El volcado sale de ejecutar QuasoPlugin contra un servidor simulado y trae los items con su nombre
y lore exactos, las misiones con objetivos y recompensas, y las recetas. es_es.json es el
idioma del juego (está en los assets del launcher) y sirve para nombrar en español los items vanilla.

Si data/juego.json ya existe, se conservan las texturas, categorías y notas que se cambiaron desde el panel.
"""
import json
import re
import sys
from pathlib import Path

ROMANOS = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X"}

ENCANTAMIENTOS_CUSTOM = {
    "quaso:paso_igneo": "Paso Ígneo",
    "quaso:purificacion": "Purificación",
    "quaso:vision_abisal": "Visión Abisal",
    "quaso:anclaje": "Anclaje",
    "quaso:retorno_del_vacio": "Retorno del Vacío",
}

DIFICULTAD = {"FACIL": "facil", "MEDIA": "media", "DIFICIL": "dificil", "MUY_DIFICIL": "muy_dificil"}
TIPO = {"NORMAL": "normal", "EXTRA": "extra", "TRABAJO": "trabajo"}
XP_POR_CASILLA = {"facil": 1, "media": 2, "dificil": 3, "muy_dificil": 4}

# Para qué sirve y de dónde sale cada item nuevo (del itinerario)
INFO = {
    "arco_nivel1": ("Flechas espectrales que explotan (explosión 2).", "Misión 46 · Tienda Legendario desde el día 40"),
    "arco_nivel2": ("Explosión 3, gasta 2 flechas por disparo y no acepta Infinidad.", "Misión 68 · Tienda Legendario desde el día 50"),
    "arco_nivel3": ("Explosión 4, gasta 4 flechas por disparo y no acepta Infinidad.", "Misión 87 · Tienda Legendario el día 100"),
    "amuleto_invisiblidad": ("Invisibilidad, Regeneración II y Absorción III por 3 minutos, con 2 minutos de espera.", "Tienda desde el día 30 · Misiones 55 y 75"),
    "energia_warden": ("Munición de la Warden Gun e ingrediente de las mejoras de la armadura de Warden.", "Mesa de crafteo, o el Ultra Warden"),
    "lingote_profundo": ("Material de la armadura de Warden y del Lingote de Celestita.", "Mesa de crafteo con Fragmentos Profundos"),
    "corazon_warden_boss": ("Invoca al Ultra Warden en el altar del templo de la Warden Cave.", "Infested Warden Boss (2 a 4)"),
    "cristal_celestita": ("Material del Lingote de Celestita.", "Racimos de amatista del Bosque Prismático (12%, 18% con pico de Celestita)"),
    "fragmento_astral": ("Ingrediente de la Plantilla de Celestita y del Ojo del Rey Ender.", "Mobs del End"),
    "esencia_marchita": ("Ingrediente del Ojo del Rey Ender.", "Shulkers Negros y Wither Skeletons del Páramo Marchito"),
    "ojo_rey_ender": ("Invoca al Rey Ender en el altar de un Santuario Marchito. No se puede tirar ni poner en un portal.", "Mesa de crafteo"),
    "lingote_celestita": ("Mejora una herramienta de Netherite a Celestita junto con la plantilla.", "Mesa de crafteo"),
    "plantilla_celestita": ("Se usa en la mesa de herrería para hacer las herramientas de Celestita.", "Mesa de crafteo"),
    "enderking_pearl": ("Craftea el Peto de Warden Alado.", "Rey Ender"),
    "peto_warden_alado": ("El Peto de Warden, pero planea como unas Elytras.", "Mesa de herrería"),
    "perla_infinita": ("Tira ender pearls sin gastarse; cada uso puede dar un efecto al azar por 30 segundos.", "Misión 40 · Tienda Legendario desde el día 50"),
    "retorno_warden": ("Te saca de la Warden Cave y te lleva a tu spawn; se gasta al usarla.", "Tienda (Explorador) desde el día 20"),
    "baya_sculk": ("Visión Nocturna por 3 minutos.", "Árboles de la Caverna Sculk (Warden Cave)"),
    "fruta_abisal": ("Quita la Oscuridad por 1 minuto y medio.", "Árboles del Abismo Flotante (Warden Cave)"),
    "baya_luminosa": ("Regeneración II por 5 segundos.", "Árboles del Pantano Profundo (Warden Cave)"),
    "iman_botin": ("En la mano secundaria atrae los items del suelo a 8 bloques (no toca lo que tiró otro jugador).", "Tienda Novedades desde el día 1"),
    "red_animales": ("Atrapa un animal con clic derecho y lo suelta en otro lugar; se reusa.", "Tienda Novedades desde el día 1"),
    "abono_concentrado": ("Hace crecer los cultivos y árboles en 5x5.", "Tienda Novedades desde el día 1"),
    "brujula_explorador": ("Busca la aldea, fortaleza o ciudad del End más cercana y apunta ahí; 3 usos.", "Tienda Novedades desde el día 1"),
    "racion_viaje": ("Llena el hambre y la saturación y da Regeneración I 10 s.", "Tienda Novedades desde el día 1"),
    "bomba_humo": ("Al tirarla te da Invisibilidad y Velocidad II 6 s; donde cae, los mobs te pierden y quedan ciegos.", "Tienda Novedades desde el día 1"),
    "incienso_ahuyentador": ("10 minutos sin mobs hostiles que aparezcan solos a 24 bloques.", "Tienda Novedades desde el día 1"),
    "elixir_minero": ("Visión Nocturna 8 min y Prisa I 4 min.", "Tienda Novedades desde el día 1"),
    "elixir_igneo": ("Resistencia al Fuego 6 min y Resistencia I 2 min.", "Tienda Novedades desde el día 1"),
    "galleta_fortuna": ("Un mensaje de la suerte y un efecto bueno al azar por 1 minuto.", "Tienda Novedades desde el día 1"),
    "bengala_sculk": ("Hace brillar a los mobs a 16 bloques por 15 s.", "Tienda Novedades desde el día 20"),
    "polvo_silencioso": ("3 minutos en los que sensores, chilladores y Wardens no te oyen.", "Tienda Novedades desde el día 20"),
    "elixir_abisal": ("Visión Nocturna y sin Oscuridad 5 min.", "Tienda Novedades desde el día 20"),
    "botiquin": ("Cura 5 corazones y quita veneno, wither, hambre, debilidad, lentitud, fatiga, náusea, ceguera y oscuridad; 20 s de espera.", "Tienda Novedades desde el día 20"),
    "granada_sonica": ("8 de daño y empuje a los monstruos a 5 bloques.", "Tienda Novedades desde el día 20"),
    "radar_minerales": ("Marca los minerales a 8 bloques por 10 s a través de las paredes (también los Minerales Profundos); 3 usos.", "Tienda Novedades desde el día 20"),
    "cristal_eco": ("Guarda un lugar con shift + clic y te lleva de vuelta tras 3 s quieto, en la misma dimensión.", "Tienda Novedades desde el día 20"),
    "elixir_agilidad": ("Velocidad II y Salto II 3 min.", "Tienda Novedades desde el día 20"),
    "caldo_profundo": ("Llena 8 de hambre, Absorción II 2 min y Resistencia I 1 min.", "Tienda Novedades desde el día 20"),
    "linterna_almas": ("En la mano secundaria da Visión Nocturna; no se puede poner.", "Tienda Novedades desde el día 20"),
    "elixir_coloso": ("Vida Extra II (+4 corazones) y Resistencia I 5 min.", "Tienda Novedades desde el día 30"),
    "elixir_furia": ("Fuerza II y Velocidad I 2 min.", "Tienda Novedades desde el día 30"),
    "tonico_antilevitacion": ("4 minutos inmune a la Levitación de los shulkers.", "Tienda Novedades desde el día 30"),
    "antidoto": ("Quita solo los efectos malos.", "Tienda Novedades desde el día 30"),
    "frasco_sabiduria": ("10 minutos de doble experiencia.", "Tienda Novedades desde el día 30"),
    "propulsor_estelar": ("Impulso fuerte mientras planeas con Elytra; 5 cargas.", "Tienda Novedades desde el día 40"),
    "estandarte_guerra": ("Fuerza I y Resistencia I 60 s a todos los jugadores a 12 bloques.", "Tienda Novedades desde el día 40"),
    "talisman_botin": ("10 minutos: los monstruos sueltan hasta el doble y 50% más de experiencia (no cuenta jefes, spawners ni items custom).", "Tienda Novedades desde el día 40"),
    "pluma_vacio": ("Si caes al vacío del End te devuelve al último suelo firme; se gasta.", "Tienda Novedades desde el día 40"),
    "caja_misteriosa": ("Un premio al azar: comida, elixires, tótems y a veces diamantes, netherite o una Mochila Nivel 3.", "Tienda Novedades desde el día 50"),
    "excavator_pickaxe": ("Pico que rompe en área.", "Misión 8 · Tienda Legendario desde el día 40"),
    "doubletotem": ("Un tótem que te salva dos veces.", "Misiones · Tienda Utilidad desde el día 20"),
    "monedero": ("Guarda tus DinoCoins y DinoFichas; es lo único donde se pueden almacenar.", "Tienda Mercado (5 DinoCoins)"),
    "dinocoins": ("La moneda oficial del servidor.", "Misiones, trabajos, bosses, pesca, BloodMoon y eventos"),
    "dinofichas": ("Fichas del casino.", "Tienda de Cambios: 1 DinoCoin = 5 DinoFichas"),
    "blood_fragment": ("Se cambian en la tienda de Cambios: 6 fragmentos = 1 DinoCoin.", "Monstruos durante la BloodMoon (25%)"),
    "libro_habilidades": ("Se gasta para desbloquear el árbol de habilidades en /menu.", "Biblioteca (1 DinoCoin)"),
    "misiones": ("Abre el menú de misiones.", "Biblioteca (1 DinoCoin)"),
    "casco_warden": ("+1 de armadura y dureza sobre Netherite y 2 corazones extra.", "Mesa de herrería (Warden Cave)"),
    "peto_warden": ("+1 de armadura y dureza sobre Netherite y 2 corazones extra.", "Mesa de herrería (Warden Cave)"),
    "pantalon_warden": ("+1 de armadura y dureza sobre Netherite y 2 corazones extra.", "Mesa de herrería (Warden Cave)"),
    "bota_warden": ("+1 de armadura y dureza sobre Netherite y 2 corazones extra.", "Mesa de herrería (Warden Cave)"),
}

for tool in ("espada", "hacha", "lanza", "pico", "pala", "azada"):
    INFO[f"{tool}_celestita"] = ("1 de daño más que Netherite" + ("; +50% de daño al Rey Ender." if tool in ("espada", "hacha", "lanza") else "."),
                                 "Mesa de herrería (End)")
for color, pieza in (("cian", "el casco"), ("verde", "las botas"), ("morado", "el peto"), ("gris", "el pantalón")):
    INFO[f"mineral_crudo_{color}"] = (f"Se funde en alto horno (4 min) y da el Fragmento Profundo {color.capitalize()}.", f"Minerales Profundos del bioma {color.capitalize()} de la Warden Cave")
    INFO[f"fragmento_profundo_{color}"] = (f"4 van en la mejora de {pieza}; cualquier color sirve para el Lingote Profundo.", "Alto horno")
for alma, bioma in (("skeleton", "Cian"), ("cave_spider", "Verde"), ("ghast", "Morado"), ("creeper", "Gris")):
    INFO[f"alma_infested_{alma}"] = ("Una por mejora de armadura de Warden.", f"7% del mob infestado del bioma {bioma}")

PESCA = ["chatarra", "manzana_podrida", "zanahoria_encantada", "pepitas_hierro_oxidadas", "pepitas_diamante",
         "fragmentos_ambar", "fosiles_pequenos", "lingote_platino"]


# Lo que no sale del volcado (está escrito en enums y menús del plugin)
TRABAJOS = [
    {"id": "guerrero", "nombre": "Guerrero", "icono": "⚔", "color": "#D98C7A", "item": "iron_sword",
     "descripcion": "Defiende el server de los monstruos que lo rondan.",
     "fuentes": ["Matar monstruos: 4 a 15 XP", "Monstruos élite: 20 a 60 XP", "Jefes de evento: 250 XP", "Wither y Dragón: 400 y 600 XP"]},
    {"id": "mineria", "nombre": "Minería", "icono": "⛏", "color": "#A9B7C6", "item": "iron_pickaxe",
     "descripcion": "Baja a las cuevas y saca los minerales del mundo.",
     "fuentes": ["Piedra, deepslate y similares: 0,05 XP", "Carbón, cobre y redstone: 2 a 5 XP", "Hierro, oro y lapislázuli: 5 a 8 XP", "Diamante, esmeralda y debris: 15 a 30 XP"]},
    {"id": "lenador", "nombre": "Leñador", "icono": "☘", "color": "#C4A076", "item": "iron_axe",
     "descripcion": "Tala los bosques del server tronco por tronco.",
     "fuentes": ["Troncos: 1,2 XP", "Tallos del Nether: 1,4 XP", "Raíces de manglar: 0,5 XP"]},
    {"id": "constructor", "nombre": "Constructor", "icono": "⚒", "color": "#C9B79C", "item": "bricks",
     "descripcion": "Levanta las construcciones más lindas del mapa.",
     "fuentes": ["Bloques básicos: 0,1 XP", "Bloques comunes: 0,3 XP", "Ladrillos, cuarzo, concreto...: 0,5 XP"]},
    {"id": "granjero", "nombre": "Granjero", "icono": "✿", "color": "#A8C3A0", "item": "wheat",
     "descripcion": "Cosecha cultivos y cría animales para el server.",
     "fuentes": ["Cultivos maduros: 0,6 a 1,5 XP", "Sandías y calabazas: 1 XP", "Criar animales: 4 XP"]},
    {"id": "pescador", "nombre": "Pescador", "icono": "⚓", "color": "#8FB8C9", "item": "fishing_rod",
     "descripcion": "Paciencia y caña: lo que pica en el agua es tuyo.",
     "fuentes": ["Peces: 6 a 8 XP", "Tesoros: 12 XP", "Basura: 3 XP"]},
]

HABILIDADES = [
    {"id": "vitalidad", "nombre": "Vitalidad", "icono": "heart", "color": "#ff9db4",
     "niveles": ["+2,5 corazones permanentes"] * 4 + ["+4 corazones permanentes"] * 4},
    {"id": "resistencia", "nombre": "Resistencia", "icono": "shield", "color": "#9fd3ff",
     "niveles": ["8% de probabilidad de bloquear el daño directo de proyectiles", "8% de probabilidad de bloquear el daño directo de monstruos",
                 "8% de probabilidad de bloquear cualquier daño", "Resistencia I infinita",
                 "14% de probabilidad de bloquear el daño directo de proyectiles", "14% de probabilidad de bloquear el daño directo de monstruos",
                 "14% de probabilidad de bloquear cualquier daño", "Resistencia II infinita"]},
    {"id": "agilidad", "nombre": "Agilidad", "icono": "wind", "color": "#8ff0b8",
     "niveles": ["Prisa minera I infinita", "Doble salto y Gracia del delfín II infinita", "Velocidad I infinita", "Triple salto",
                 "Fuerza I infinita", "Salto alto I infinito", "Velocidad II infinita", "Cuádruple salto"]},
]

COSTOS_HABILIDAD = [
    {"xp": 30, "bloque": "gold_block", "cantidad": 12, "nombre": "bloques de oro", "dinocoins": 5},
    {"xp": 40, "bloque": "diamond_block", "cantidad": 15, "nombre": "bloques de diamante", "dinocoins": 10},
    {"xp": 50, "bloque": "emerald_block", "cantidad": 32, "nombre": "bloques de esmeralda", "dinocoins": 15},
    {"xp": 60, "bloque": "netherite_block", "cantidad": 3, "nombre": "bloques de netherite", "dinocoins": 20},
    {"xp": 70, "bloque": "gold_block", "cantidad": 30, "nombre": "bloques de oro", "dinocoins": 10},
    {"xp": 80, "bloque": "diamond_block", "cantidad": 40, "nombre": "bloques de diamante", "dinocoins": 20},
    {"xp": 90, "bloque": "emerald_block", "cantidad": 64, "nombre": "bloques de esmeralda", "dinocoins": 30},
    {"xp": 100, "bloque": "netherite_block", "cantidad": 6, "nombre": "bloques de netherite", "dinocoins": 40},
]

# Los rangos del scoreboard (TeamType): id del team, nombre, color y cómo se consigue
RANGOS = [
    {"id": "ZMiembro", "nombre": "DinoNugget", "color": "#FDCDA0", "prefijo": "§7§l[§6§lDinoNugget§7§l]", "como": "El rango de todos al entrar por primera vez."},
    {"id": "YMiembro", "nombre": "DinoNugget+", "color": "#F7A1F0", "prefijo": "§7§l[§5§lDinoNugget§6§l+§7§l]", "como": "Se consigue al completar 30 misiones."},
    {"id": "XLeyenda", "nombre": "DinoLeyenda", "color": "#FFD166", "prefijo": "§7§l[§x§F§F§D§1§6§6§lDinoLeyenda§7§l]", "como": "Lo da la misión 100, Jugador Experto."},
    {"id": "USub", "nombre": "DinoSub", "color": "#B57BFF", "prefijo": "§7§l[§x§9§1§4§6§F§F§lDinoSub§7§l]", "como": "Para los subs del canal de Crosszy que vincularon su Twitch con /twitch."},
    {"id": "VVip", "nombre": "DinoVip", "color": "#F58BE0", "prefijo": "§7§l[§x§E§0§0§5§B§9§lDinoVip§7§l]", "como": "Para los VIP del canal de Crosszy que vincularon su Twitch."},
    {"id": "THelper", "nombre": "Helper", "color": "#68E3BA", "prefijo": "§7§l[§x§0§0§A§A§A§A§lHelper§7§l]", "como": "Staff que ayuda a los jugadores."},
    {"id": "Mod", "nombre": "DinoNalgon", "color": "#C056E6", "prefijo": "§7§l[§d§lDinoNalgon§7§l]", "como": "Los moderadores del servidor."},
    {"id": "Admin", "nombre": "Prieto", "color": "#F89130", "prefijo": "§7§l[§8§lPRIETO§7§l]", "como": "Los administradores del servidor."},
    {"id": "TSurvivor", "nombre": "Survivor", "color": "#9455ED", "prefijo": "Survivor", "como": "Rango especial.", "oculto": True},
    {"id": "ZFantasma", "nombre": "Fantasma", "color": "#555555", "prefijo": "Fantasma", "como": "Rango especial.", "oculto": True},
]

PESCA_TABLA = [
    ("chatarra", "Común", "30%", "16%", 64), ("manzana_podrida", "Común", "25%", "14%", 48),
    ("zanahoria_encantada", "Poco común", "15%", "18%", 24), ("pepitas_hierro_oxidadas", "Poco común", "12%", "16%", 16),
    ("pepitas_diamante", "Raro", "8%", "14%", 8), ("fragmentos_ambar", "Raro", "5%", "10%", 4),
    ("fosiles_pequenos", "Épico", "3%", "7%", 2), ("lingote_platino", "Épico", "2%", "5%", 1),
]


def categoria(item_id):
    if item_id in ("dinocoins", "dinofichas", "monedero", "blood_fragment"):
        return "economia"
    if item_id.startswith("mochila_") or item_id == "enderbag":
        return "mochilas"
    if item_id in PESCA:
        return "pesca"
    if item_id.startswith("libro_") or item_id.startswith("happy_ghast_enchant") or item_id == "misiones":
        return "libros"
    if any(item_id.startswith(p) for p in ("mineral_crudo", "fragmento_profundo", "alma_infested", "mejora_")) \
            or item_id in ("lingote_profundo", "energia_warden", "corazon_warden_boss", "baya_sculk", "fruta_abisal",
                           "baya_luminosa", "casco_warden", "peto_warden", "pantalon_warden", "bota_warden", "retorno_warden"):
        return "warden"
    if item_id.endswith("_celestita") or item_id in ("fragmento_astral", "esencia_marchita", "ojo_rey_ender",
                                                     "enderking_pearl", "peto_warden_alado"):
        return "end"
    if item_id.startswith("bar_") or item_id.startswith("potion_") or item_id.startswith("splash_") \
            or item_id in ("corrupted_steak", "tarta_calabaza_mejorada", "corrupted_golden_apple", "panic_apple",
                           "manzana_vida", "frasco_de_velocidad", "keep_inventory_liquido"):
        return "consumibles"
    if "totem" in item_id or item_id.startswith("amulet") or item_id.startswith("amuleto"):
        return "amuletos"
    if item_id.startswith("arco_") or item_id in ("excavator_pickaxe", "perla_infinita", "gancho"):
        return "armas"
    return "utilidad"


def unwrap(text):
    return re.sub(r"\s*\n\s*", " ", text or "").strip()


def main():
    dump_path, lang_path = Path(sys.argv[1]), Path(sys.argv[2])
    out_path = Path(sys.argv[3]) if len(sys.argv) > 3 else Path("data/juego.json")
    dump = json.loads(dump_path.read_text(encoding="utf-8"))
    lang = json.loads(lang_path.read_text(encoding="utf-8"))
    previo = json.loads(out_path.read_text(encoding="utf-8")) if out_path.exists() else {}
    previo_items = previo.get("items", {})

    usados = set()

    def nombre_vanilla(mat):
        return lang.get(f"item.minecraft.{mat}") or lang.get(f"block.minecraft.{mat}") or mat.replace("_", " ").capitalize()

    def item(raw, item_id=None):
        """Item del volcado -> formato de la web."""
        mat = raw.get("material")
        usados.add(mat)
        out = {"material": mat}
        if raw.get("name"):
            out["nombre"] = raw["name"]
        elif raw.get("nameSeg"):
            out["nombreSeg"] = raw["nameSeg"]
        if raw.get("lore"):
            out["lore"] = raw["lore"]
        elif raw.get("loreSeg"):
            out["loreSeg"] = raw["loreSeg"]
        if raw.get("rarity"):
            out["rareza"] = raw["rarity"].lower()
        glint = raw.get("glint")
        if glint is None:
            glint = bool(raw.get("enchants")) or bool(raw.get("stored"))
        if glint:
            out["brillo"] = True
        if raw.get("enchants"):
            out["encantamientos"] = raw["enchants"]
        if raw.get("stored"):
            out["guardados"] = raw["stored"]
        flags = raw.get("flags") or []
        ocultar = []
        if "HIDE_ENCHANTS" in flags:
            ocultar.append("encantamientos")
        if "HIDE_ATTRIBUTES" in flags:
            ocultar.append("atributos")
        if "HIDE_ADDITIONAL_TOOLTIP" in flags:
            ocultar.append("extra")
        if ocultar:
            out["ocultar"] = ocultar
        if raw.get("attributes"):
            out["atributos"] = [{"atributo": a["attribute"], "valor": a["amount"], "operacion": a["operation"],
                                 "ranura": a["slot"]} for a in raw["attributes"]]
        if raw.get("effects"):
            out["efectos"] = [{"efecto": e["type"], "nivel": e["amplifier"] + 1, "ticks": e["duration"]} for e in raw["effects"]]
        if raw.get("potion"):
            out["pocion"] = raw["potion"].lower()
        if raw.get("color"):
            out["color"] = raw["color"]
        if raw.get("unbreakable"):
            out["irrompible"] = True
        if raw.get("glider"):
            out["planeador"] = True
        if raw.get("skull"):
            out["cabeza"] = raw["skull"]
        if raw.get("model"):
            out["modelo"] = raw["model"]
        if item_id:
            out["custom"] = True
            out["categoria"] = categoria(item_id)
            info = INFO.get(item_id)
            if info:
                out["descripcion"], out["origen"] = info
            prev = previo_items.get(item_id, {})
            for keep in ("textura", "categoria", "descripcion", "origen", "oculto"):
                if prev.get(keep):
                    out[keep] = prev[keep]
        return out

    items = {}
    for item_id, raw in dump["items"].items():
        if item_id in ("dinocoins_old",):
            continue
        items[item_id] = item(raw, item_id)

    def ref(r):
        """Referencia del volcado (id custom o item vanilla con datos) -> referencia de la web."""
        if "id" in r:
            return {"id": r["id"], "n": r.get("amount", 1)}
        mat = r.get("material")
        out = item(r)
        out["n"] = r.get("amount", 1)
        return {"vanilla": True, **out}

    misiones = []
    for m in sorted(dump["missions"], key=lambda x: x["n"]):
        n = m["n"]
        tipo = TIPO[m["tipo"]]
        dificultad = DIFICULTAD[m["difficulty"]]
        objetivos = [{"texto": o["label"], "meta": o["target"], "formato": o["format"].lower()} for o in m["objectives"]]
        recompensas = [[ref(r) for r in grupo] for grupo in m.get("rewards", [])]
        dia = n if tipo == "normal" else (m["parent"] if tipo == "extra" else 0)
        misiones.append({
            "n": n,
            "tipo": tipo,
            "nombre": m["name"],
            "descripcion": unwrap(m["description"]),
            "dificultad": dificultad,
            "dinocoins": m["coins"],
            "dia": dia,
            "padre": m["parent"],
            "objetivos": objetivos,
            "recompensas": recompensas,
        })

    def choice(c):
        if c is None:
            return None
        if "exact" in c:
            r = c["exact"][0]
            return ref(r)
        if "materials" in c:
            mats = c["materials"]
            for mt in mats:
                usados.add(mt)
            return {"vanilla": True, "material": mats[0], "n": 1, **({"alternativas": mats[1:]} if len(mats) > 1 else {})}
        return None

    etapa = {"OneChanges": "uno", "TwoChanges": "dos", "ThreeChanges": "tres"}
    recetas = []
    for r in dump["recipes"]:
        out = {"id": r["key"], "etapa": etapa.get(r.get("stage"), ""), "resultado": ref(r["result"])}
        if r["type"] == "shaped":
            out["tipo"] = "crafteo"
            out["forma"] = r["shape"]
            out["ingredientes"] = {k: choice(v) for k, v in r["ingredients"].items()}
        elif r["type"] == "shapeless":
            out["tipo"] = "crafteo_libre"
            out["lista"] = [choice(v) for v in r["ingredients"]]
        elif r["type"] in ("blasting", "furnace", "smoking"):
            out["tipo"] = {"blasting": "alto_horno", "furnace": "horno", "smoking": "ahumador"}[r["type"]]
            out["entrada"] = choice(r["input"])
            out["segundos"] = r["time"] / 20
        elif r["type"] == "smithing":
            out["tipo"] = "herreria"
            out["plantilla"] = choice(r["template"])
            out["base"] = choice(r["base"])
            out["adicion"] = choice(r["addition"])
        recetas.append(out)

    # Para la textura por defecto de cada item custom basta su material
    for it in items.values():
        usados.add(it["material"])
    usados.discard(None)

    vanilla = {mat: nombre_vanilla(mat) for mat in sorted(usados)}
    encantamientos = {}
    for k, v in lang.items():
        if k.startswith("enchantment.minecraft."):
            encantamientos[k.split(".")[-1]] = v
    encantamientos.update(ENCANTAMIENTOS_CUSTOM)
    efectos = {k.split(".")[-1]: v for k, v in lang.items() if k.startswith("effect.minecraft.")}
    atributos = {k[len("attribute.name."):]: v for k, v in lang.items() if k.startswith("attribute.name.")}
    pociones = {k.split(".")[-1]: v for k, v in lang.items() if k.startswith("item.minecraft.potion.effect.")}
    pociones_arrojadizas = {k.split(".")[-1]: v for k, v in lang.items() if k.startswith("item.minecraft.splash_potion.effect.")}

    # Las herramientas de Celestita copian los atributos de la de Netherite en el juego: en el volcado solo queda el +1,
    # así que se ocultan para que el tooltip no muestre un daño que no es el real (el lore ya dice +1 sobre Netherite)
    for tool in ("espada", "hacha", "lanza", "pico", "pala", "azada"):
        it = items.get(f"{tool}_celestita")
        if it:
            it.pop("atributos", None)
            it["ocultar"] = sorted(set(it.get("ocultar", [])) | {"atributos"})

    for it in TRABAJOS:
        usados.add(it["item"])
    for c in COSTOS_HABILIDAD:
        usados.add(c["bloque"])

    juego = {
        "meta": {"version": 1, "updatedAt": "", "updatedBy": "", "fuente": "QuasoPlugin 26.2"},
        "items": items,
        "misiones": misiones,
        "recetas": recetas,
        "trabajos": TRABAJOS,
        "habilidades": HABILIDADES,
        "costosHabilidad": COSTOS_HABILIDAD,
        "rangos": RANGOS,
        "pesca": [{"id": i, "rareza": r, "buena": b, "perfecta": p, "cambio": c} for i, r, b, p, c in PESCA_TABLA],
        "idioma": {
            "vanilla": vanilla,
            "encantamientos": encantamientos,
            "efectos": efectos,
            "atributos": atributos,
            "pociones": pociones,
            "pocionesArrojadizas": pociones_arrojadizas,
            "romanos": ROMANOS,
            "ranuras": {k[len("item.modifiers."):]: v for k, v in lang.items() if k.startswith("item.modifiers.")},
        },
    }
    # Lo que ya manda el plugin en su catálogo (mobs, y el texto de trabajos y habilidades) se conserva de la copia anterior
    for key in ("mobs", "trabajos", "habilidades", "costosHabilidad"):
        if previo.get(key):
            juego[key] = previo[key]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(juego, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    Path(out_path.parent.parent / "tools" / "texturas.txt").write_text("\n".join(sorted(usados)) + "\n", encoding="utf-8")
    print(f"items={len(items)} misiones={len(misiones)} recetas={len(recetas)} materiales={len(usados)}")


if __name__ == "__main__":
    main()

"""Crea data/sitio.json y data/anuncios.json con el contenido inicial de la web (sacado del itinerario y del
código de QuasoPlugin). Después todo se edita desde el panel (/admin); este script solo sirve para empezar de cero.

Uso: python tools/contenido_inicial.py [--forzar]
Sin --forzar no pisa archivos que ya existen.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AHORA = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
NTFY = "croissants-quaso-7f3k9w2m"


def seccion(id_, titulo, icono, resumen, contenido, imagenes=None):
    return {"id": id_, "titulo": titulo, "icono": icono, "resumen": resumen, "contenido": contenido.strip(), "imagenes": imagenes or []}


GUIA = [
    seccion("primeros-pasos", "Primeros pasos", "sparkle",
            "Lo que tienes que hacer el primer día para arrancar bien la temporada.", """
Croissants Segunda Edición es el SMP público de Crosszy: un SMP donde cada día se abre una misión nueva, el mundo se va abriendo por partes y todo lo que haces te da **DinoCoins**, la moneda del servidor.

## Tu primer día, paso a paso

1. **Entra al servidor.** Con el [Viciont Studios Launcher](#launcher) **no necesitas la IP**: abres la instancia **Croissants** y entras directo al servidor, con el modpack y las texturas listos. Si juegas sin el launcher, usa la [IP](#guia/como-conectarse) de Java o de Bedrock.
2. **Abre el menú principal** con [[cmd:/menu]]: desde ahí entras a tus Misiones, Trabajos, Habilidades, Protecciones y Homes.
3. **Haz las misiones 1, 2 y 3**: son fáciles a propósito, para que todos tengan DinoCoins desde el primer día. Mira cuáles están abiertas en [Misiones](#misiones).
4. **Visita las tiendas** con [[cmd:/tiendas]]: te teletransporta a las tiendas del spawn. Revisa qué se puede **comprar** y qué se puede **vender** para gastar o conseguir DinoCoins. Los precios **van cambiando conforme pasan los días**.
5. **Cómprate un [[item:monedero]]** en el Mercado de la tienda (al principio cuesta 5 DinoCoins). Las DinoCoins solo se guardan dentro del monedero.
6. **Pasa por la Biblioteca**: el [[item:misiones]] y el [[item:libro_habilidades]] al principio cuestan 1 DinoCoin cada uno.
7. **Guarda tu base** con [[cmd:/sethome casa]] y protégela con [[cmd:/proteccion]].
8. **Elige un trabajo** con [[cmd:/trabajos]] para ganar DinoCoins mientras juegas.

> [!tip] Un jugador activo junta unas **30 DinoCoins por día**: unas 17 de la misión, unas 6 de su trabajo y el resto de bosses, pesca y BloodMoon.

## Lo que tienes que saber

- **El mundo se abre por partes:** el Overworld y el Nether desde el día 1, la Warden Cave el día 20 y el End el día 35. Todo está en [Cambios y Jugabilidad](#jugabilidad).
- **Cada parte prepara la siguiente:** la armadura de Netherite es la base de la de Warden, la de Warden es la que aguanta el End y del End sale lo que necesitas para el Rey Ender.
- **Si mueres no pierdes todo:** tus cosas quedan en una tumba a tus pies. Usa [[cmd:/muertes]] para encontrarla.
- **Las raids están cambiadas** y cada cinco noches puede salir una **BloodMoon**.
"""),
    seccion("como-conectarse", "Cómo conectarse", "server",
            "IP para Java y Bedrock, versión y por qué conviene el launcher.", """
> [!tip] **Con el [Viciont Studios Launcher](#launcher) no necesitas la IP:** abre la instancia **Croissants** y pulsa **Jugar**; entras directo al servidor. La IP solo hace falta si juegas sin el launcher.

[[ip]]

## Java Edition (sin el launcher)

1. Abre Minecraft Java en la versión del servidor.
2. Ve a **Multijugador → Agregar servidor**.
3. Pega la IP de Java y entra.

## Bedrock Edition (móvil, consola y Windows)

1. Ve a **Jugar → Servidores → Agregar servidor**.
2. Pega la IP de Bedrock y el **puerto**.
3. Guarda y entra. Desde Bedrock juegas el mismo mundo que los de Java.

## Juega con el launcher

El [Viciont Studios Launcher](#launcher) instala la instancia **Croissants** con un clic: el modpack, las texturas de los items custom y el chat de voz (Simple Voice Chat, opcional), siempre actualizados. Así ves los items y los mobs como se pensaron, y **entras directo al servidor sin escribir la IP**.

> [!info] El paquete de texturas es para Java. Desde Bedrock se juega igual, solo cambia cómo se ven algunos items.
"""),
    seccion("menu", "El /menu y sus menús", "grid",
            "Todo lo importante del servidor está a un clic desde /menu.", """
Con [[cmd:/menu]] abres el menú principal. Cada zona del dibujo abre un menú distinto: haz clic en cualquier parte de la zona.

[[menu]]

## Misiones

Abre el menú de misiones (también con [[cmd:/misiones]] o con el [[item:misiones]]). Va en tres secciones, cada una desde una página nueva: las **100 misiones**, las **40 extras** y las **60 de trabajo**. Cada tipo tiene sus colores: morado y rosa para las normales, celeste para las extras y café dorado para las de trabajo. Pasa el cursor sobre una misión para ver su progreso.

## Trabajos

Abre el menú de los 6 trabajos (también con [[cmd:/trabajos]]). Ahí eliges trabajo, ves tu nivel y lo que te falta, y abres la guía de trabajos.

## Habilidades

Abre tu árbol de habilidades. Para que funcione tienes que gastar una vez el [[item:libro_habilidades]] (clic derecho): se gasta con una animación y desde ese momento el árbol queda en [[cmd:/menu]].

## Protecciones

Abre [[cmd:/proteccion]], donde proteges tu base.

## Homes

Abre [[cmd:/home list]] con tus hasta 10 casas guardadas.
""", [
        {"src": "", "titulo": "Menú principal (/menu)", "texto": "Misiones, Trabajos, Habilidades, Protecciones y Homes."},
        {"src": "", "titulo": "Menú de misiones", "texto": "Las tres secciones con los colores de cada tipo."},
        {"src": "", "titulo": "Menú de trabajos", "texto": "Los 6 trabajos y la guía."},
        {"src": "", "titulo": "Árbol de habilidades", "texto": "Vitalidad, Resistencia y Agilidad, 8 niveles cada una."},
        {"src": "", "titulo": "Protecciones", "texto": "Tu base protegida."},
        {"src": "", "titulo": "Homes", "texto": "Tus casas guardadas."},
    ]),
    seccion("dinocoins", "DinoCoins y monedero", "coin",
            "La moneda del servidor: cómo se gana, dónde se guarda y en qué se gasta.", """
Las [[item:dinocoins]] son la moneda oficial del servidor. Todo lo que haces te da DinoCoins y las DinoCoins se gastan en habilidades, la tienda y el casino.

## El monedero

- Las DinoCoins y las [[item:dinofichas]] **solo se pueden guardar dentro de un [[item:monedero]]**: los cofres y las mochilas no las aceptan.
- El monedero tiene 18 espacios y se compra en el Mercado (al principio cuesta 5 DinoCoins).
- Tu saldo (el que ves en el scoreboard y en [Jugadores](#jugadores)) son las monedas que tienes **dentro de tus monederos**.
- Para comprar en la tienda o subir habilidades, **lleva las DinoCoins en el inventario**.

## De dónde salen

| Fuente | Paga | Tope |
| --- | --- | --- |
| Misión del día | 10 a 25 DinoCoins según dificultad + 2 objetos | 1 por día más 40 extras |
| Trabajos | 1 a 5 DinoCoins por nivel y un bonus cada 5 niveles (8 a 55) | 1.500 XP por hora; después rinde la cuarta parte |
| Misiones de trabajo | 5 a 60 DinoCoins al llegar a los niveles 10 a 100 | 60 en total |
| Abeja Floral | 15 la 1ª vez, 10 la 2ª y 5 desde la 3ª | 2 recompensas por día |
| Ultra Warden | 20 la 1ª vez, después 5 | 1 recompensa por día |
| Ender Dragon | 15 la 1ª vez, después 5 | 1 recompensa por día |
| Rey Ender | 25 la 1ª vez, después 5 | 1 recompensa por día |
| Wither | 7 los primeros 5, después 2 | 3 por día |
| Elder Guardian | 5 | Solo hay 3 por monumento |
| BloodMoon | 25% de soltar Fragmentos de BloodMoon; 6 fragmentos = 1 DinoCoin | Lo limita la noche |
| Lago de pesca | Premios que compra la Pescadería | 60 premios especiales por día |

## En qué se gastan

- **Habilidades:** 150 DinoCoins por habilidad para los 8 niveles, más experiencia y bloques. Las 3 completas cuestan 450.
- **Tienda del spawn:** comodidad y consumibles.
- **Casino:** en la tienda de Cambios, 1 DinoCoin son 5 DinoFichas y 6 DinoFichas vuelven a ser 1 DinoCoin.

## Cuánto junta cada jugador

| Jugador | Por día | En un mes (30 días) |
| --- | --- | --- |
| Casual: 1 h, la mitad de las misiones | ~13 | ~390 |
| Activo: 2 a 3 h, casi todas las misiones | ~30 | ~900 |
| Farmeador: llega a todos los topes | ~44 | ~1.320 |

> [!info] Todo lo que se puede repetir tiene un tope diario, así nadie farmea la economía.
"""),
    seccion("misiones", "Misiones", "scroll",
            "Una misión por día, 40 extras y 60 de trabajo: 200 en total.", """
La misión **N se abre el día N** y queda abierta desde ese día en adelante. Mira cuáles están abiertas (se actualiza solo desde el servidor) en [Misiones](#misiones).

## Los tres tipos

| Tipo | Números | Recompensa |
| --- | --- | --- |
| **Misión** | 1 a 100 | Una **Ficha de Misión** para abrir tu cofre en la Estatua de Recompensas |
| **Extra** | 101 a 140 | Solo DinoCoins, directo a tu monedero |
| **De trabajo** | 141 a 200 | Ficha de Misión, como las normales |

- Las **extras** salen junto con la misión normal de su día y se llaman como ella: Misión #1, Extra #1, Misión #2… Unas usan lo nuevo de 1.21.11, 26.1 y 26.2 (lanzas, Nautilus, Sulfur Caves) y otras son fáciles para los que juegan poco.
- Las **de trabajo** están **siempre activas**: piden llegar a los niveles 10, 20… 100 de cada trabajo.

## Cómo se cobra

1. Al completar una misión normal o de trabajo recibes una **Ficha de Misión**.
2. Llévala al spawn y dale **clic derecho a la Estatua de Recompensas**.
3. Se abre tu cofre: las DinoCoins en el centro, los 2 objetos de la misión y el resto en botellas de experiencia.

Las DinoCoins de cada misión van según la dificultad: **Fácil** 10 a 12, **Media** 13 a 16, **Difícil** 17 a 20 y **Muy difícil** 21 a 25.

## Rangos por misiones

- Con **30 misiones** completas pasas a **DinoNugget+**.
- La **misión 100** (completar 95 de las 99 anteriores) te da el rol **DinoLeyenda**.
"""),
    seccion("trabajos", "Trabajos", "pickaxe",
            "Seis oficios con 100 niveles cada uno que pagan DinoCoins al subir.", """
En [[cmd:/trabajos]] (o desde [[cmd:/menu]]) eliges uno de los 6 oficios. Cada uno tiene **100 niveles** y paga DinoCoins y experiencia al subir.

[[trabajos]]

## Cómo funciona

- **Entrar cuesta** 5 DinoCoins, 10 niveles de experiencia y 5 diamantes.
- Para **cambiarte** tienes que esperar 24 horas. El nivel de cada trabajo **se guarda**: si vuelves, sigues donde ibas.
- Cada nivel paga de **1 a 5 DinoCoins** y cada **5 niveles** hay un bonus (8 en el nivel 5, 30 en el 50 y 55 en el 100) que sale en un título.
- Las **60 misiones de trabajo** (141 a 200) te pagan otra vez por llegar a los niveles 10 a 100.

## Contra las granjas

- Los bloques que pusiste no dan XP al romperlos y los mobs de spawner no cuentan.
- Si estás AFK 5 minutos dejas de ganar.
- En Constructor, el mismo lugar no cuenta hasta 30 minutos después.
- Pasadas **1.500 XP en una hora**, lo que sigue rinde la cuarta parte.

## Comandos

- [[cmd:/trabajos]] abre el menú.
- [[cmd:/trabajos info]] te dice tu nivel y lo que falta.
- [[cmd:/trabajos guia]] abre la guía de trabajos en un diálogo.
"""),
    seccion("habilidades", "Habilidades", "star",
            "Vitalidad, Resistencia y Agilidad: 8 niveles cada una.", """
Las habilidades son mejoras permanentes que compras con DinoCoins, experiencia y bloques.

## Cómo se desbloquean

1. Compra el [[item:libro_habilidades]] en la Biblioteca (al principio cuesta 1 DinoCoin).
2. Dale clic derecho: el libro se gasta y tu árbol queda desbloqueado en [[cmd:/menu]] → Habilidades.
3. Sube cada habilidad nivel por nivel (hay que tener el anterior).

[[habilidades]]

> [!tip] Cada habilidad completa cuesta 150 DinoCoins en total y las tres, 450. Un jugador activo junta unas 30 DinoCoins por día, así que las completa en pocas semanas.
"""),
    seccion("homes", "Homes, spawn y viajes", "home",
            "Guarda hasta 10 casas y muévete rápido por el mapa.", """
## Homes

- [[cmd:/sethome nombre]] guarda una casa (hasta **10**).
- [[cmd:/home nombre]] te lleva.
- [[cmd:/home list]] o [[cmd:/menu]] → Homes te las muestra todas.
- [[cmd:/delhome nombre]] la borra.

## Otros viajes

- [[cmd:/spawn]] te lleva al spawn central.
- [[cmd:/tiendas]] te lleva a las tiendas.
- [[cmd:/bosstp]] te lleva a la zona del boss (la dungeon de la Abeja Floral).
- [[cmd:/muertes]] te dice dónde quedó tu tumba.
"""),
    seccion("protecciones", "Protecciones", "shield",
            "Protege tu base para que nadie la rompa ni la saquee.", """
Las protecciones las maneja **Viciont Protections**, el plugin de protecciones de Viciont Studios.

- Ábrelas con [[cmd:/proteccion]] o desde [[cmd:/menu]] → Protecciones.
- Ahí proteges tu base y eliges quién puede entrar y construir.

> [!tip] Protege tu base el primer día: es lo primero que conviene hacer después de guardar tu home.
"""),
    seccion("casino", "Casino", "dice",
            "Juega con DinoFichas en el casino del spawn.", """
En el casino se juega con [[item:dinofichas]].

- En la tienda de **Cambios**, **1 DinoCoin = 5 DinoFichas** y **6 DinoFichas = 1 DinoCoin**. Esa diferencia es lo que se queda la casa.
- Hay **Blackjack** y **tragamonedas**.
- Las DinoFichas también se guardan en el monedero.

> [!info] Próximamente: Piedra, Papel o Tijera y Conecta 4 entre jugadores, con apuestas de 15 a 25 DinoFichas cada uno.
"""),
    seccion("pesca", "Lago de pesca", "fish",
            "Un minijuego de pesca con premios que se cambian por DinoCoins.", """
En las **zonas de pesca** del lago, cuando algo pica sale una barra en el subtítulo con un marcador que acelera y frena como si el pez tirara.

1. Cuando algo pique, **mira la barra** del subtítulo.
2. **Vuelve a usar la caña** justo cuando el marcador esté encima del color que quieres (saltar o agacharse ya no hace nada).
3. Tienes **6 segundos** (la bossbar se pone amarilla y después roja). Si no tiras a tiempo, el pez se escapa.

| Color | Resultado |
| --- | --- |
| Verde | **Pesca perfecta**: premio especial seguro, con más probabilidad de los raros |
| Naranja | **Buena pesca**: 40% de premio especial (+5% por nivel de Suerte marina) |
| Rojo | Pesca normal de Minecraft |

El tiro se juzga con tu ping (hasta 300 ms), así el lag no te hace perder. El tope es de **60 premios especiales por día** y los épicos se anuncian a todo el servidor.

[[pesca]]

La **Pescadería** del lago te compra los premios: con el tope diario, la pesca da de **5 a 9 DinoCoins** por día según cuántas pescas perfectas aciertes.
"""),
    seccion("tumbas", "Tumbas y /muertes", "tomb",
            "Cuando mueres tus cosas quedan en una tumba a tus pies.", """
Al morir, todo lo que llevabas queda en una **tumba** en el bloque de tus pies (si mueres en el vacío del End, en el último suelo que pisaste).

- Los primeros **20 minutos** solo tú puedes abrirla.
- Después queda **abierta 10 minutos** para cualquiera, y luego suelta las cosas.
- El reloj de la tumba se ve gris hasta que se abre y ámbar hasta que suelta las cosas.

## /muertes

[[cmd:/muertes]] lista tus tumbas con el mundo, las coordenadas, el tiempo desde que moriste y si están privadas o abiertas.
"""),
    seccion("rangos", "Rangos", "crown",
            "Los rangos del servidor y cómo se consiguen.", """
[[rangos]]

Los rangos de Twitch (DinoSub y DinoVip) se ponen solos mientras tu sub o VIP del canal de Crosszy siga activo; cuando se termina vuelves al rango que te toca.
"""),
    seccion("twitch", "Twitch", "twitch",
            "Vincula tu Twitch: kits mensuales para subs y VIPs del canal de Crosszy.", """
## Vincular tu cuenta

1. Escribe [[cmd:/twitch vincular]]: el servidor te da un código.
2. Entra a **twitch.tv/activate** con tu cuenta y pega el código.
3. Listo: cada cuenta de Twitch va con un solo jugador.

## Kits

Con [[cmd:/twitch kit]] reclamas un cofre con el kit del mes:

| Kit | Qué trae |
| --- | --- |
| Sub, 1er mes | 25 DinoCoins y armadura de hierro con Protección II |
| Sub, 2º mes | 40 DinoCoins y armadura de diamante con Protección III |
| Sub, desde el 3er mes | 64 DinoCoins y armadura de Netherite con Protección IV |
| VIP | 15 DinoCoins, manzanas de oro, tarta de calabaza mejorada y Mochila Nivel 1 |

Los kits de sub traen además manzanas de oro, carne corrupta, tarta de calabaza mejorada y una mochila (nivel 1, 2 o 3). Si eres sub y VIP recibes el de sub. Hay **un kit por cada mes pagado** (la sub tiene que seguir activa 32 días seguidos para el siguiente).

## /fly

Los subs pueden usar [[cmd:/fly]] en el Overworld y el Nether. No funciona en la Warden Cave, el End ni durante los eventos.
"""),
    seccion("comandos", "Comandos", "terminal",
            "Todos los comandos que puedes usar como jugador.", """
| Comando | Qué hace |
| --- | --- |
| [[cmd:/menu]] | Menú principal: misiones, trabajos, habilidades, protecciones y homes |
| [[cmd:/misiones]] | Menú de misiones |
| [[cmd:/trabajos]] | Menú de trabajos ([[cmd:/trabajos info]] y [[cmd:/trabajos guia]]) |
| [[cmd:/proteccion]] | Protecciones de tu base |
| [[cmd:/sethome nombre]] | Guarda una casa (hasta 10) |
| [[cmd:/home nombre]] | Te lleva a una casa ([[cmd:/home list]] las muestra) |
| [[cmd:/delhome nombre]] | Borra una casa |
| [[cmd:/spawn]] | Te lleva al spawn |
| [[cmd:/tiendas]] | Te lleva a las tiendas |
| [[cmd:/bosstp]] | Te lleva a la zona del boss |
| [[cmd:/muertes]] | Lista tus tumbas |
| [[cmd:/logros]] | Tus logros |
| [[cmd:/bloodmoon show]] | Cuándo es la próxima BloodMoon |
| [[cmd:/twitch]] | Vincula tu Twitch y reclama tu kit |
| [[cmd:/fly]] | Vuelo para los subs (Overworld y Nether) |
| [[cmd:/ping]] | Tu ping |
"""),
]

ETAPAS = [
    {"id": "uno", "clave": "uno", "titulo": "Cambio Uno", "dia": 1, "color": "#c9a7eb", "icono": "flag",
     "resumen": "Desde el día 1: mobs corruptos, raids modificadas, la BloodMoon, el altar de la Abeja Floral y la carne corrupta.",
     "contenido": """
El primer cambio está activo desde el **día 1** y cambia el Overworld y el Nether.

## Raids modificadas

- Parte de los raiders se cambian por **Bombitas** (en cada oleada, una más).
- Desde la **segunda oleada** salen **Iceologers** con su arco de hielo.
- A veces (16% por oleada) llega una **horda de mobs florales**: 10 Zombies Florales y 8 Spiders Florales que van por el jugador más cercano o por los aldeanos.

## Mobs del cambio

[[mobs:uno]]

## La BloodMoon

Cada cinco noches puede salir una **BloodMoon**: los monstruos pegan el doble y aguantan el triple, salen hordas y sueltan [[item:blood_fragment]] (25%). Todo en [BloodMoon](#jugabilidad/dimensiones/bloodmoon).

## La Abeja Floral

En su dungeon ([[cmd:/bosstp]]) está el altar del panal: con **Mal Presagio** (Bad Omen) lo activas y sale la **Abeja Floral**. El altar queda 3 horas en cooldown. Mira [Jefes](#jugabilidad/jefes/abeja-floral).

## Comida corrupta

- La [[item:corrupted_steak]] da Náusea I 10 s y Saturación I 1,5 s. Se craftea con un filete asado y 4 carnes podridas.
- La [[item:tarta_calabaza_mejorada]] da Lentitud I 10 s y Saturación I 2,5 s.

[[recetas:uno]]

## El vacío del End

Si caes al vacío del End con un tótem en la mano, el tótem salta y te levita hacia arriba con caída lenta.
"""},
    {"id": "extra", "clave": "extra", "titulo": "Cambio Extra", "dia": 14, "color": "#f7b8d2", "icono": "sparkle",
     "resumen": "Día 14: el Zombie Floral, la Spider Floral y las Bombitas empiezan a salir solos por el Overworld.",
     "contenido": """
El cambio extra va entre el uno y el dos, el **día 14**. Hasta ese día los mobs florales solo salían en las raids; desde ahora salen **solos por el Overworld**.

| Mob | Sale floral |
| --- | --- |
| Zombie (adulto) | 25% pasa a **Zombie Floral** |
| Araña | 25% pasa a **Spider Floral** |
| Creeper | 20% pasa a **Bombita** |

- Los zombies bebé quedan normales.
- No pasa en la Warden Cave, que tiene sus propios mobs.
- Hacen lo mismo que en las raids: la wind charge con veneno y debilidad, la telaraña, la velocidad y la fuerza.

La [[mision:17]] pide matar 25 Zombies Florales y 25 Spiders Florales: desde este día ya no hace falta esperar una raid.
"""},
    {"id": "dos", "clave": "dos", "titulo": "Cambio Dos", "dia": 20, "color": "#2fd3c4", "icono": "portal",
     "resumen": "Día 20: se abre la Warden Cave con sus 4 biomas, los mobs infestados y la armadura de Warden.",
     "contenido": """
El **día 20** se abre la **Warden Cave**, una dimensión infinita con 4 biomas. Cada bioma da lo que falta para una pieza de la **armadura de Warden**. Todo sobre la dimensión en [Warden Cave](#jugabilidad/dimensiones/warden-cave).

## Lo que trae

- Los **mobs infestados**: uno por bioma, con 7% de soltar su alma.
- El **Warden Zombie**, que sale en los 4 biomas.
- Los **Minerales Profundos** de terracota de cada bioma: al minarlos hay 15% de que salga un Warden Zombie al lado.
- Las **recetas** de la armadura de Warden y la fundición en alto horno.

## Mobs

[[mobs:dos]]

## De mineral a armadura

1. Mina el Mineral Profundo de cada bioma: suelta su [[item:mineral_crudo_cian]] (crudo del color de su bioma).
2. Fúndelo en un **alto horno** (4 minutos): da el [[item:fragmento_profundo_cian]] de su color.
3. Con 4 fragmentos de cualquier color, 4 lingotes de oro y 1 fragmento resonante haces el [[item:lingote_profundo]].
4. Con 5 fragmentos resonantes y 4 lingotes profundos haces la [[item:energia_warden]].
5. La **mejora** de cada pieza lleva 4 fragmentos de su bioma, el alma de su mob, 2 lingotes profundos, 1 energía y una plantilla de Netherite.
6. En la **mesa de herrería**: la mejora + la pieza de Netherite + 1 lingote profundo.

[[recetas:dos]]

> [!tip] Con 4 altos hornos a la vez los 512 minutos de fundición de la armadura completa bajan a unas 2 horas, pero igual hay que minar los 128 minerales.
"""},
    {"id": "tres", "clave": "tres", "titulo": "Cambio Tres", "dia": 35, "color": "#b98cff", "icono": "moon",
     "resumen": "Día 35: el End con biomas nuevos, sus mobs, la Celestita, el Peto de Warden Alado y el Rey Ender.",
     "contenido": """
El **día 35** se abre el **End**. Es la fase más difícil: el dragón, las End Cities y los mobs nuevos están pensados para jugar con la armadura de Warden. Todo sobre la dimensión en [End](#jugabilidad/dimensiones/end).

## Lo que trae

- Los **mobs del End** en las islas de afuera: Ender Blaze, Ender Creeper, Ender Spider, Ender Insect y el Shulker Negro.
- Los **shulkers** cambiados y sus TNT.
- La **Celestita**, el mineral del End, y sus herramientas.
- El **Ojo del Rey Ender** y el altar del **Rey Ender** en los Santuarios Marchitos.
- El **Peto de Warden Alado**.

## Mobs

[[mobs:tres]]

## Recetas del End

[[recetas:tres]]
"""},
]

DIMENSIONES = [
    {"id": "overworld", "titulo": "Overworld y Nether", "dia": 1, "color": "#8ff0b8", "icono": "globe", "bloque": "grass_block",
     "resumen": "Abiertos desde el día 1: raids cambiadas, mobs florales y la dungeon de la Abeja Floral.",
     "contenido": """
El Overworld y el Nether están abiertos desde el **día 1**. La meta de la primera fase es llegar al día 20 con **armadura de Netherite**, que es la base de la de Warden.

## Qué cambia

- **Raids:** Bombitas, Iceologers desde la segunda oleada y hordas de mobs florales. Mira el [Cambio Uno](#jugabilidad/cambios/uno).
- **Desde el día 14** el Zombie Floral, la Spider Floral y las Bombitas salen solos. Mira el [Cambio Extra](#jugabilidad/cambios/extra).
- **BloodMoon** cada cinco noches. Mira [BloodMoon](#jugabilidad/dimensiones/bloodmoon).
- **Abeja Floral** en su dungeon, a la que se llega con [[cmd:/bosstp]].

## Consejos para la fase 1

1. Haz las primeras misiones y compra el monedero.
2. Elige un trabajo y sube tus primeras habilidades.
3. Junta diamantes y Netherite: el día 20 se abre la Warden Cave y la armadura de Warden sale de la de Netherite.
4. La [[mision:8]] da la [[item:excavator_pickaxe]]: ideal para minar.
"""},
    {"id": "bloodmoon", "titulo": "BloodMoon", "dia": 1, "color": "#ff7a7a", "icono": "moon", "bloque": "netherrack",
     "resumen": "Una noche roja cada cinco: monstruos más fuertes, hordas y Fragmentos de BloodMoon.",
     "contenido": """
La **BloodMoon** es una noche roja que sale cada **cinco noches** en el Overworld. Con [[cmd:/bloodmoon show]] ves cuándo es la próxima.

## Qué pasa en una BloodMoon

- El cielo se pone rojo con niebla carmesí y hay tormenta.
- Los monstruos **pegan el doble** y **aguantan el triple**, pero dan **4 veces más experiencia**.
- Cada tanto aparece una **horda** de 3 a 10 mobs cerca de un jugador (cada 30 a 50 segundos).
- No se puede dormir.
- Los monstruos tienen **25% de soltar** 1 o 2 [[item:blood_fragment]].

## Fragmentos de BloodMoon

En la tienda de **Cambios**, **6 fragmentos = 1 DinoCoin**. Una BloodMoon da unas 5 a 10 DinoCoins.

## El Amuleto de BloodMoon

El [[item:amulet_bloodmoon]] (Mochilas y Amuletos, 40 DinoCoins) **cancela las hordas** que iban a salir a 20 bloques de ti. Gasta un diamante por minuto mientras está activo. No borra los mobs que ya existen.

## Misiones de BloodMoon

- [[mision:9]]: mata 100 mobs en BloodMoons.
- [[mision:58]]: mata 500 mobs en BloodMoons.
- [[mision:83]]: mata 50 mobs en una BloodMoon sin armadura.
- [[mision:96]]: sobrevive 3 BloodMoons seguidas sin morir.
"""},
    {"id": "warden-cave", "titulo": "Warden Cave", "dia": 20, "color": "#2fd3c4", "icono": "portal", "bloque": "sculk",
     "resumen": "Una dimensión infinita con 4 biomas: cada uno da una pieza de la armadura de Warden.",
     "contenido": """
La **Warden Cave** se abre el **día 20**. Es una dimensión **infinita** con 4 biomas, y cada bioma da lo que falta para una pieza de la armadura de Warden: hay que recorrerla toda.

## Cómo se entra y se sale

- Se entra por el **portal** del spawn: te levita y caes en un lugar al azar a hasta 3.000 bloques del centro, siempre en suelo seguro.
- En el **0 0** está la build con el **portal de salida**.
- La [[item:retorno_warden]] te saca a tu spawn desde cualquier lado.
- Para la dimensión siempre es de **medianoche** (aunque tú ves mediodía), así los mobs salen también a cielo abierto.

## Los 4 biomas

| Bioma | Cielo | Mob propio | Mineral | Pieza |
| --- | --- | --- | --- | --- |
| Caverna Sculk | Cian | Infested Skeleton | Mineral Profundo Cian (terracota cian) | Casco |
| Pantano Profundo | Verde | Infested Cave Spider | Mineral Profundo Verde (terracota verde lima) | Botas |
| Abismo Flotante | Morado | Infested Ghast | Mineral Profundo Morado (terracota morada) | Peto |
| Ruinas de Ceniza | Gris | Infested Creeper | Mineral Profundo Gris (terracota gris) | Pantalón |

Cada bioma tiene su propio árbol y en los 4 hay sculk, chilladores y sensores. Las **Ancient City** llevan la decoración del bioma donde caen y tienen menos chilladores.

## Mobs y bosses

- **Warden Zombie:** sale en los 4 biomas, es lento, aguanta mucho y su golpe da Oscuridad. 15% de soltar un fragmento resonante.
- **Mobs infestados:** uno por bioma, con 7% de soltar su alma.
- **Wardens de los chilladores:** salen a la mitad de tamaño y pegan la mitad.
- **Infested Warden Boss:** hay uno por Ancient City. Sale arriba del portal cuando alguien se acerca y vuelve a salir a la hora. Tiene 450 de vida, cambia de objetivo, se tepea detrás de otro jugador y llama minions. Suelta de 2 a 4 [[item:corazon_warden_boss]].
- **Ultra Warden** (día 25): se invoca con 1 Corazón de Warden en el altar del templo de la entrada. Suelta la Warden Gun y Energías de Warden.

## Frutas

| Fruta | De dónde sale | Qué hace |
| --- | --- | --- |
| [[item:baya_sculk]] | Árboles de la Caverna Sculk | Visión Nocturna 3 minutos |
| [[item:fruta_abisal]] | Árboles del Abismo Flotante | Quita la Oscuridad 1 minuto y medio |
| [[item:baya_luminosa]] | Enredaderas del Pantano Profundo | Regeneración II 5 segundos |

Las frutas no se plantan ni se pueden farmear.

## La armadura de Warden

Cada pieza da **1 de armadura y 1 de dureza más que la de Netherite** y **2 corazones extra**: el set completo suma 8 corazones para aguantar el End. Cómo se hace, en el [Cambio Dos](#jugabilidad/cambios/dos).

| Objetivo | Lo que pide | Tiempo |
| --- | --- | --- |
| Armadura de Warden completa | 128 Minerales Profundos, 112 lingotes de oro, 48 fragmentos resonantes, 4 almas, 4 plantillas de Netherite y la armadura de Netherite | Varios días en grupo, más de una semana solo |

## Encantamientos nuevos

No salen en la mesa de encantamientos ni con aldeanos: los libros salen de los jefes, de los mobs (1%) y de los cofres de las Ancient City y End City (25%).

| Encantamiento | Va en | Qué hace |
| --- | --- | --- |
| Paso Ígneo I-II | Botas | Al caminar sobre lava la vuelve obsidiana por unos segundos |
| Purificación I-V | Armas | 2,5 de daño más por nivel a los mobs de la Warden Cave y a los Wardens |
| Visión Abisal I | Casco | Protege de la Oscuridad 5 minutos, después se recarga 2 |
"""},
    {"id": "end", "titulo": "End", "dia": 35, "color": "#b98cff", "icono": "moon", "bloque": "end_stone",
     "resumen": "El dragón modificado, biomas nuevos, la Celestita y el camino hacia el Rey Ender.",
     "contenido": """
El **End** se abre el **día 35** y es la fase más difícil: está pensado para jugar con la **armadura de Warden**.

## Qué cambia

- **Ender Dragon:** 1.250 de vida y los End Crystals se regeneran. Invoca mobs corruptos, tira rayos, empuja hacia arriba, hace un remolino de TNT y deja rastros de partículas negras que hacen daño.
- **Mobs nuevos** en las islas de afuera: parte de los endermans se cambian por Ender Blaze, Ender Creeper, Ender Spider o Shulker Negro según el bioma.
- **Shulkers:** 30% de soltar su caja, sus balas pueden dar un efecto malo o explotar y al morir dejan una TNT. Ni la TNT ni las balas rompen bloques.

## Biomas nuevos

Las islas de afuera se reparten en zonas grandes: un tercio queda como el End de siempre, un tercio es **Bosque Prismático** y un tercio **Páramo Marchito**.

| Bioma | Cómo es | Mobs | Qué se saca |
| --- | --- | --- | --- |
| Bosque Prismático | Cielo morado con niebla rosada, pinos de colores y bolas de amatista | Ender Insect y Enderman | [[item:cristal_celestita]] |
| Páramo Marchito | Gris y morado con ceniza, árboles negros y santuarios de obsidiana | Shulker Negro, Wither Skeleton y Enderman | [[item:esencia_marchita]] y rosas del Wither |

## La Celestita

- **Cristal de Celestita:** cada racimo de amatista que rompes en el End tiene 12% de soltar uno (18% con el pico de Celestita). Los racimos vuelven a crecer.
- **Fragmento Astral:** lo sueltan los mobs del End (25% el Shulker Negro, 10% el Ender Insect, 8% el Shulker, 6% Ender Blaze, Creeper y Spider y 2% el Enderman).
- **Herramientas de Celestita:** espada, hacha, lanza, pico, pala y azada. Hacen 1 de daño más que las de Netherite y las armas le pegan **50% más al Rey Ender**.

## Para invocar al Rey Ender

1. Junta [[item:esencia_marchita]] (Shulkers Negros y Wither Skeletons del Páramo), [[item:cristal_celestita]] y [[item:fragmento_astral]].
2. Craftea el [[item:ojo_rey_ender]]: 1 ojo de ender, 4 esencias, 2 cristales y 2 fragmentos. No se puede tirar ni poner en un portal.
3. Ve a un **Santuario Marchito** y dale clic derecho con el ojo a la vara del End sobre las dos obsidianas llorosas del centro.
4. El ojo se gasta y a los 5 segundos sale el **Rey Ender**. Mira [Jefes](#jugabilidad/jefes/rey-ender).

## Encantamientos del End

| Encantamiento | Va en | Qué hace |
| --- | --- | --- |
| Anclaje I-II | Botas | Resistencia al empuje; reduce la levitación de los shulkers y los tepeos de la Ender Spider |
| Retorno del Vacío I | Peto | Si caes al vacío del End te devuelve al último suelo firme (5 minutos de recarga) |
"""},
]

JEFES = [
    {"id": "abeja-floral", "titulo": "Abeja Floral", "dia": 12, "vida": "600", "huevo": "bee_spawn_egg", "color": "#ffb3d9", "icono": "flame",
     "estado": "Disponible", "resumen": "La reina de su dungeon: aguijones, combos de teletransporte y panales que la curan.",
     "contenido": """
La **Abeja Floral** vive en su dungeon, a la que se llega con [[cmd:/bosstp]]. Para invocarla necesitas **Mal Presagio** (Bad Omen): dale clic al panal del altar. El altar queda **3 horas** en cooldown.

## Cómo pelea

- **600 de vida**, ataques cuerpo a cuerpo y combos de teletransporte.
- **Aguijones** venenosos y explosivos, refuerzos florales y una nube tóxica.
- **Polen regenerador:** desde los 200 de vida aparecen 4 panales giratorios que la curan. Cada panal se rompe de un golpe o un flechazo: rómpelos rápido.

## Recompensa

| Victoria | DinoCoins | Manzanas encantadas | Miel de velocidad |
| --- | --- | --- | --- |
| Primera | 15 | 5 | 16 |
| Segunda | 10 | 3 | 8 |
| Siguientes | 5 | 0 | 3 |

Hasta **2 recompensas por día** y 3.500 de experiencia. Las misiones [[mision:12]] y [[mision:67]] piden matarla.
"""},
    {"id": "infested-warden-boss", "titulo": "Infested Warden Boss", "dia": 20, "vida": "450", "huevo": "warden_spawn_egg", "color": "#2fd3c4", "icono": "skull",
     "estado": "Disponible", "resumen": "El guardián de cada Ancient City de la Warden Cave. Suelta los Corazones de Warden.",
     "contenido": """
Hay un **Infested Warden Boss** por cada **Ancient City** de la Warden Cave. Sale arriba del portal cuando alguien se acerca y, si muere, vuelve a salir a la hora.

- **450 de vida.**
- Cambia de objetivo cada 8 a 14 segundos.
- **Paso Sombrío:** se tepea detrás de otro jugador.
- Llama hasta 4 minions.

Suelta de **2 a 4** [[item:corazon_warden_boss]], que sirven para invocar al Ultra Warden. Lo piden las misiones [[mision:24]] y [[mision:86]].
"""},
    {"id": "ultra-warden", "titulo": "Ultra Warden", "dia": 25, "vida": "—", "huevo": "warden_spawn_egg", "color": "#5ee0ff", "icono": "bolt",
     "estado": "En desarrollo", "resumen": "La prueba del día 25: se invoca con un Corazón de Warden en el templo de la entrada.",
     "contenido": """
El **Ultra Warden** se invoca con **1 Corazón de Warden** en el altar del templo de la entrada de la Warden Cave.

- Suelta la **Warden Gun** (segura la primera vez de cada jugador, después 25%) y de 2 a 4 [[item:energia_warden]].
- La **Warden Gun** dispara un sonic boom de 40 de daño que da Debilidad, Lentitud y Náusea; usa la Energía de Warden como munición.
- Recompensa: 20 DinoCoins la primera vez, después 5 (una vez al día).

> [!info] Sus ataques todavía se están terminando. Avisaremos en Anuncios cuando esté listo.
"""},
    {"id": "ender-dragon", "titulo": "Ender Dragon modificado", "dia": 35, "vida": "1.250", "huevo": "ender_dragon_spawn_egg", "color": "#b98cff", "icono": "flame",
     "estado": "En desarrollo", "resumen": "El dragón del End con más vida, cristales que se regeneran y ataques nuevos.",
     "contenido": """
El **Ender Dragon** del día 35 tiene **1.250 de vida** y sus End Crystals se regeneran.

- Invoca mobs corruptos.
- Tira rayos y empuja a los jugadores hacia arriba.
- Hace un remolino de TNT.
- Deja rastros de partículas negras que hacen daño.

Recompensa: 15 DinoCoins la primera vez y el huevo, después 5 (una vez al día). Lo piden [[mision:35]] y [[mision:74]].
"""},
    {"id": "rey-ender", "titulo": "Rey Ender", "dia": 55, "vida": "7.000", "huevo": "enderman_spawn_egg", "color": "#d36bff", "icono": "crown",
     "estado": "Disponible", "resumen": "El boss más fuerte de la temporada. Suelta la EnderKing Pearl para el Peto de Warden Alado.",
     "contenido": """
El **Rey Ender** es el boss más fuerte: un enderman 1,7 veces más grande con **7.000 de vida**, pensado para la armadura de Warden con Protección IV. Se invoca con el [[item:ojo_rey_ender]] en un Santuario Marchito del End.

Hace de 1 a 3 ataques cuerpo a cuerpo y después un especial; con menos del 35% de vida ataca más seguido. Las flechas le pegan, no se tepea solo y si cae al vacío vuelve al altar.

| Tipo | Ataque | Qué hace |
| --- | --- | --- |
| Cuerpo a cuerpo | Zarpazo Abisal | Barre un arco de 150°: 40 de daño y Debilidad |
| Cuerpo a cuerpo | Pisotón Estelar | Salta y golpea a 6 bloques: 36 de daño, levanta y da Lentitud II |
| Cuerpo a cuerpo | Combo Sombrío | Aparece detrás 3 veces seguidas: 20 de daño cada golpe |
| Especial | Lluvia Estelar | Marca círculos y caen estrellas: 38 de daño |
| Especial | Ráfaga Real | Balas de shulker: 14 de daño y levitación corta |
| Especial | Rayo del Vacío | Un rayo de 32 bloques: 46 de daño y Wither II |
| Especial | Agujero Negro | Atrae a todos y explota: 44 de daño y Oscuridad |
| Especial | Ejército del End | Invoca Ender Spiders, un Ender Blaze y Ender Insects |
| Especial | Grieta Dimensional | Cambia de lugar con el jugador más lejano |
| Regeneración | Trono del Vacío | Al 66% y al 33% flota y 4 cristales lo curan: rómpelos (un golpe o flecha cada uno) |

## Recompensa

Suelta la [[item:enderking_pearl]] y 3.000 de experiencia, más 25 DinoCoins la primera vez y 5 después (una vez al día). Con la perla, el Peto de Warden y unas Elytras haces el [[item:peto_warden_alado]] en la mesa de herrería: el peto de Warden, pero planea como Elytra.

[[receta:peto_warden_alado]]
"""},
]

CALENDARIO = [
    {"dia": 1, "titulo": "Overworld, Nether y el Cambio Uno", "texto": "Mobs florales en las raids, BloodMoon y la tienda abre su primera sección.", "icono": "flag"},
    {"dia": 12, "titulo": "La Abeja Floral", "texto": "La misión 12 pide derrotar a la primera boss.", "icono": "flame"},
    {"dia": 14, "titulo": "Cambio Extra", "texto": "Los mobs florales empiezan a salir solos por el Overworld.", "icono": "sparkle"},
    {"dia": 20, "titulo": "Warden Cave", "texto": "Se abre la dimensión de los 4 biomas y la armadura de Warden.", "icono": "portal"},
    {"dia": 25, "titulo": "Ultra Warden", "texto": "El boss de la Warden Cave y la Warden Gun.", "icono": "bolt"},
    {"dia": 35, "titulo": "El End", "texto": "Biomas nuevos, la Celestita y el dragón modificado.", "icono": "moon"},
    {"dia": 55, "titulo": "Rey Ender", "texto": "El boss más fuerte y el Peto de Warden Alado.", "icono": "crown"},
    {"dia": 100, "titulo": "Misión 100: DinoLeyenda", "texto": "La misión 100 da el rol DinoLeyenda.", "icono": "trophy"},
]

SITIO = {
    "meta": {"version": 1, "updatedAt": AHORA, "updatedBy": "CrissyjuanxD"},
    "general": {
        "nombre": "Croissants",
        "edicion": "Segunda Edición",
        "lema": "El SMP público de Crosszy",
        "descripcion": "Misiones diarias, DinoCoins, trabajos, bosses y dimensiones nuevas para Java y Bedrock.",
        "anfitrion": "Crosszy",
        "ipJava": "croissant.holy.gg",
        "puertoJava": "",
        "versionJava": "26.2",
        "ipBedrock": "croissant.holy.gg",
        "puertoBedrock": "19132",
        "versionBedrock": "Móvil, consola y Windows",
        "redes": {"twitch": "https://www.twitch.tv/crosszy", "youtube": "", "tiktok": "", "x": "", "instagram": "", "discord": "", "kick": ""},
        "viciont": {"url": "https://viciontstudios.pages.dev/", "discord": "https://discord.gg/qZPUhPRtX",
                    "youtube": "https://www.youtube.com/@ViciontStudios", "x": "https://x.com/viciontstudios"},
        "launcherUrl": "https://viciontstudios.pages.dev/#launcher",
        "launcherRepo": "CrissyjuanxD/Viciont-Studio-Launcher",
        "creditos": "CrissyjuanxD",
        "fondos": [
            {"src": "assets/img/fondos/fondo-1.webp", "titulo": "El templo del spawn"},
            {"src": "assets/img/fondos/fondo-2.webp", "titulo": "Atardecer en los árboles gigantes"},
            {"src": "assets/img/fondos/fondo-3.webp", "titulo": "La aldea de noche"},
            {"src": "assets/img/fondos/fondo-4.webp", "titulo": "Los jardines del templo"},
            {"src": "assets/img/fondos/fondo-5.webp", "titulo": "El templo a pleno sol"},
            {"src": "assets/img/fondos/fondo-6.webp", "titulo": "El spawn al anochecer"},
        ],
        "inicioTemporada": "",
        "diaManual": 0,
        "live": {"repo": "CrissyjuanxD/Croissants-Live", "rama": "main", "ntfy": NTFY, "estadoApi": "mcstatus"},
    },
    "inicio": {
        "kicker": "Servidor de Minecraft",
        "titulo": "Todo lo que trae Croissants",
        "texto": "Cada día se abre una **misión nueva**, el mundo se abre por partes y todo lo que haces te da **DinoCoins**. Del Overworld a la **Warden Cave** y del End al **Rey Ender**.",
        "pasos": [
            {"icono": "download", "titulo": "Descarga el launcher", "texto": "Instala el [Viciont Studios Launcher](#launcher) y abre la instancia **Croissants**: el modpack y las texturas vienen listos y **entras directo al servidor, sin poner la IP**."},
            {"icono": "server", "titulo": "¿Sin launcher? Copia la IP", "texto": "Si juegas sin el launcher, toca **IP del servidor** y copia la de Java o la de Bedrock."},
            {"icono": "grid", "titulo": "Abre /menu", "texto": "Escribe [[cmd:/menu]] para ver tus misiones, trabajos, habilidades, protecciones y homes."},
            {"icono": "scroll", "titulo": "Haz tu primera misión", "texto": "Las misiones 1, 2 y 3 son fáciles: así tienes DinoCoins desde el primer día."},
        ],
        "destacados": [
            {"icono": "scroll", "titulo": "200 misiones", "texto": "Una por día, 40 extras y 60 de trabajo, con cofres de recompensa.", "ruta": "misiones"},
            {"icono": "coin", "titulo": "DinoCoins", "texto": "La moneda del server: tienda, habilidades y casino.", "ruta": "guia/dinocoins"},
            {"icono": "pickaxe", "titulo": "6 trabajos", "texto": "100 niveles cada uno que pagan al subir.", "ruta": "guia/trabajos"},
            {"icono": "star", "titulo": "Habilidades", "texto": "Vitalidad, Resistencia y Agilidad, 8 niveles cada una.", "ruta": "guia/habilidades"},
            {"icono": "portal", "titulo": "Warden Cave", "texto": "Una dimensión infinita con 4 biomas y la armadura de Warden.", "ruta": "jugabilidad/dimensiones/warden-cave"},
            {"icono": "crown", "titulo": "Bosses", "texto": "La Abeja Floral, el Ultra Warden, el dragón y el Rey Ender.", "ruta": "jugabilidad/jefes"},
        ],
        "calendario": CALENDARIO,
        "viciont": "Croissants está hecho por **Viciont Studios**: el plugin con las misiones, los bosses y las dimensiones, el **launcher** con el que juegas y esta web. Un estudio de servidores, eventos, plugins y mods de Minecraft.",
    },
    "guia": {
        "intro": "Todo lo que necesitas saber para jugar Croissants: desde tu primer día hasta cómo funcionan las misiones, los trabajos y las habilidades.",
        "secciones": GUIA,
    },
    "misiones": {
        "intro": "Las misiones se abren solas cuando el servidor las activa. Toca una para ver qué pide y qué da. Las bloqueadas se revelan el día que se abren.",
        "notas": "",
        "mostrarBloqueadas": False,
    },
    "jugabilidad": {
        "intro": "Qué desbloquea cada cambio del servidor, cómo se juega cada dimensión, los jefes, los mobs nuevos, todos los crafteos y los items con su lore.",
        "etapas": ETAPAS,
        "dimensiones": DIMENSIONES,
        "jefes": JEFES,
    },
    "launcher": {
        "titulo": "Viciont Studios Launcher",
        "texto": "Para la mejor experiencia, juega Croissants con el launcher de **Viciont Studios**: instala todo lo que el servidor necesita con un clic.",
        "beneficios": [
            {"icono": "cube", "titulo": "Modpack listo", "texto": "La instancia Croissants trae los mods del servidor ya configurados."},
            {"icono": "image", "titulo": "Texturas custom", "texto": "Ves los items y los mobs del servidor como se diseñaron."},
            {"icono": "users", "titulo": "Chat de voz", "texto": "Simple Voice Chat opcional para hablar con los que tienes cerca."},
            {"icono": "refresh", "titulo": "Siempre al día", "texto": "Cuando el servidor se actualiza, solo se descarga lo que cambió."},
            {"icono": "shield", "titulo": "Gratis y seguro", "texto": "Sin anuncios y sin tener que instalar Java."},
            {"icono": "gamepad", "titulo": "Entra directo", "texto": "Abres la instancia, pulsas Jugar y entras directo al servidor: no tienes que copiar la IP."},
        ],
        "pasos": [
            "Entra a la página oficial de **Viciont Studios** y descarga el launcher para tu sistema.",
            "Inicia sesión con tu cuenta de Microsoft o con tu nick.",
            "Abre la instancia **Croissants** y pulsa **Jugar**: entras directo al servidor, sin poner la IP.",
        ],
    },
    "jugadores": {"intro": "Todos los que juegan o jugaron en Croissants, con sus misiones, DinoCoins, trabajos, habilidades y horas jugadas. Se actualiza en vivo desde el servidor."},
    "anuncios": {"intro": "Las novedades del servidor: cambios que se activan, tradeos nuevos y actualizaciones."},
    "footer": {
        "descripcion": "Croissants Segunda Edición, el SMP público de Crosszy para Java y Bedrock. Un proyecto de Viciont Studios.",
        "legal": "No afiliado a Mojang Studios ni a Microsoft. Minecraft es una marca de Mojang Studios.",
    },
}

ANUNCIOS = {
    "meta": {"version": 1, "updatedAt": AHORA, "updatedBy": "CrissyjuanxD"},
    "anuncios": [
        {
            "id": "bienvenidos-a-croissants-segunda-edicion",
            "titulo": "¡Bienvenidos a Croissants Segunda Edición!",
            "fecha": AHORA,
            "categoria": "actualizacion",
            "portada": "assets/img/fondos/fondo-1.webp",
            "resumen": "Abrimos la web oficial del servidor: guía, misiones en vivo, crafteos, estadísticas de cada jugador y todos los anuncios.",
            "autor": "CrissyjuanxD",
            "fijado": True,
            "contenido": """
¡La Segunda Edición de Croissants ya tiene su web! Aquí vas a encontrar todo lo que necesitas para jugar la temporada.

## Qué hay en la web

- **[Guía](#guia):** cómo empezar, las DinoCoins, las misiones, los trabajos, las habilidades y todos los comandos.
- **[Misiones](#misiones):** las 200 misiones. Se desbloquean solas en cuanto el servidor las activa.
- **[Cambios y Jugabilidad](#jugabilidad):** qué abre cada cambio, la Warden Cave, el End, los jefes, los mobs, los crafteos y los items con su lore.
- **[Jugadores](#jugadores):** las estadísticas de cada jugador en vivo.
- **Anuncios:** como este, para enterarte de cada novedad.

## Cómo entrar

Lo más fácil es el [Viciont Studios Launcher](#launcher): abres la instancia de Croissants y entras directo al servidor, sin escribir la IP y con el modpack y las texturas listos. Si juegas sin el launcher, toca **IP del servidor** arriba a la derecha para copiar la IP de Java o Bedrock.

> [!tip] Empieza por la [guía de primeros pasos](#guia/primeros-pasos): en 5 minutos sabes todo lo que tienes que hacer el primer día.

¡Nos vemos en el servidor!
""".strip(),
        }
    ],
}


def write(path, data, force):
    if path.exists() and not force:
        print(f"{path.name} ya existe (usa --forzar para pisarlo)")
        return
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"escrito {path.relative_to(ROOT)}")


if __name__ == "__main__":
    force = "--forzar" in sys.argv
    write(ROOT / "data" / "sitio.json", SITIO, force)
    write(ROOT / "data" / "anuncios.json", ANUNCIOS, force)

# Herramientas

Scripts para armar el contenido inicial y las imágenes de la web. Una vez publicada, todo se edita desde el panel
(`/admin/`) y lo del juego llega solo desde el plugin; estos scripts solo hacen falta para empezar de cero.

| Archivo | Para qué sirve |
| --- | --- |
| `contenido_inicial.py` | Crea `data/sitio.json` y `data/anuncios.json` con los textos de la guía, los cambios, las dimensiones y los jefes. `python tools/contenido_inicial.py --forzar` pisa los que ya existen. |
| `importar_plugin.py` | Convierte un volcado de QuasoPlugin en `data/juego.json`: `python tools/importar_plugin.py <volcado.json> <es_es.json> data/juego.json`. Hoy el plugin sube el catálogo solo (`/web subir`) y el panel puede guardar una copia en `juego.json`, así que este script queda de respaldo. |
| `TexTool.java` | Saca del jar del cliente de Minecraft las texturas de los items de `texturas.txt` y `texturas-extra.txt` (los bloques salen en isométrico): `java tools/TexTool.java <cliente.jar> tools/texturas.txt assets/textures`. |
| `ImgTool.java` | Recorta los logos, arma el favicon, los íconos y la imagen para redes: `java tools/ImgTool.java <logo-croissants.png> <logo-segunda-edicion.png> assets/img`. |

`es_es.json` es el idioma del juego (está en los assets del launcher) y sirve para nombrar en español los items vanilla.

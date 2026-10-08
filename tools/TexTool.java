import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.List;
import java.util.regex.*;
import java.util.zip.*;

/**
 * Saca del jar del cliente (26.2) las texturas de los items que usa la web y renderiza los bloques en isométrico.
 *
 * Uso: java TexTool.java <cliente.jar> <tools/texturas.txt> <assets/textures>
 *
 * Por cada material deja <material>.png. Los items que el juego tiñe (pociones, cuero, estrellas de fuegos) dejan
 * además <material>.base.png y <material>.tinte.png para que la web los pinte con el color de cada item.
 */
public class TexTool {

    static ZipFile jar;
    static final Pattern MODEL = Pattern.compile("\"model\"\\s*:\\s*\"([^\"]+)\"");

    public static void main(String[] args) throws Exception {
        jar = new ZipFile(args[0]);
        List<String> mats = Files.readAllLines(Path.of(args[1]), StandardCharsets.UTF_8);
        Path out = Path.of(args[2]);
        Files.createDirectories(out);
        int ok = 0;
        List<String> fail = new ArrayList<>();
        for (String raw : mats) {
            String mat = raw.trim();
            if (mat.isEmpty()) continue;
            try {
                if (render(mat, out)) ok++;
                else fail.add(mat);
            } catch (Exception e) {
                fail.add(mat + " (" + e + ")");
            }
        }
        System.out.println("ok=" + ok + " fallaron=" + fail.size());
        for (String f : fail) System.out.println("  " + f);
    }

    static String read(String path) throws IOException {
        ZipEntry e = jar.getEntry(path);
        if (e == null) return null;
        try (InputStream in = jar.getInputStream(e)) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    static BufferedImage tex(String ref) throws IOException {
        String path = ref.replace("minecraft:", "");
        ZipEntry e = jar.getEntry("assets/minecraft/textures/" + path + ".png");
        if (e == null) return null;
        BufferedImage img;
        try (InputStream in = jar.getInputStream(e)) {
            img = ImageIO.read(in);
        }
        if (img == null) return null;
        // Las animadas vienen en tira vertical: se queda el primer cuadro
        if (img.getHeight() > img.getWidth()) img = img.getSubimage(0, 0, img.getWidth(), img.getWidth());
        BufferedImage argb = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_ARGB);
        argb.getGraphics().drawImage(img, 0, 0, null);
        return argb;
    }

    // El primer modelo del item (los select/condition se quedan con el primero, que es el de la mano/inventario)
    static String itemModel(String mat) throws IOException {
        String def = read("assets/minecraft/items/" + mat + ".json");
        if (def == null) return "minecraft:item/" + mat;
        Matcher m = MODEL.matcher(def);
        while (m.find()) {
            String v = m.group(1);
            if (v.contains("/")) return v;
        }
        return "minecraft:item/" + mat;
    }

    static Integer defaultTint(String mat) throws IOException {
        String def = read("assets/minecraft/items/" + mat + ".json");
        if (def == null) return null;
        Matcher m = Pattern.compile("\"default\"\\s*:\\s*(-?\\d+)").matcher(def);
        if (m.find()) return Integer.parseInt(m.group(1));
        m = Pattern.compile("\"value\"\\s*:\\s*(-?\\d+)").matcher(def);
        if (m.find()) return Integer.parseInt(m.group(1));
        return null;
    }

    static boolean hasTints(String mat) throws IOException {
        String def = read("assets/minecraft/items/" + mat + ".json");
        return def != null && def.contains("\"tints\"");
    }

    // Junta las texturas del modelo y de sus padres; devuelve también si es un item "generated"
    static Map<String, String> textures(String model, List<String> chain) throws IOException {
        Map<String, String> tx = new LinkedHashMap<>();
        String cur = model;
        int guard = 0;
        while (cur != null && guard++ < 12) {
            chain.add(cur.replace("minecraft:", ""));
            String json = read("assets/minecraft/models/" + cur.replace("minecraft:", "") + ".json");
            if (json == null) break;
            String block = braces(json, "\"textures\"");
            if (block != null) {
                // "clave": "textura" o "clave": {"sprite": "textura", ...} (formato nuevo)
                Matcher kv = Pattern.compile("\"([^\"]+)\"\\s*:\\s*(\\{[^{}]*\\}|\"[^\"]*\")").matcher(block);
                while (kv.find()) {
                    String v = kv.group(2);
                    if (v.startsWith("{")) {
                        Matcher sp = Pattern.compile("\"sprite\"\\s*:\\s*\"([^\"]+)\"").matcher(v);
                        if (!sp.find()) continue;
                        v = sp.group(1);
                    } else {
                        v = v.substring(1, v.length() - 1);
                    }
                    tx.putIfAbsent(kv.group(1), v);
                }
            }
            Matcher pm = Pattern.compile("\"parent\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
            cur = pm.find() ? pm.group(1) : null;
        }
        // Resuelve las referencias #variable
        for (int i = 0; i < 6; i++) {
            for (Map.Entry<String, String> e : tx.entrySet()) {
                if (e.getValue().startsWith("#")) {
                    String v = tx.get(e.getValue().substring(1));
                    if (v != null) e.setValue(v);
                }
            }
        }
        return tx;
    }

    // El contenido entre llaves del objeto que sigue a la clave (respetando llaves anidadas)
    static String braces(String json, String key) {
        int i = json.indexOf(key);
        if (i < 0) return null;
        int start = json.indexOf('{', i);
        if (start < 0) return null;
        int depth = 0;
        for (int j = start; j < json.length(); j++) {
            char c = json.charAt(j);
            if (c == '{') depth++;
            else if (c == '}' && --depth == 0) return json.substring(start + 1, j);
        }
        return null;
    }

    static boolean render(String mat, Path out) throws IOException {
        String model = itemModel(mat);
        List<String> chain = new ArrayList<>();
        Map<String, String> tx = textures(model, chain);
        boolean generated = chain.stream().anyMatch(c -> c.endsWith("item/generated") || c.endsWith("item/handheld")
                || c.endsWith("item/handheld_rod") || c.endsWith("item/handheld_mace") || c.contains("item/template_spawn_egg"));
        if (mat.equals("player_head")) return head(out.resolve(mat + ".png"));
        if (mat.endsWith("_banner")) return banner(mat, out.resolve(mat + ".png"));
        if (mat.equals("chest")) return chest(out.resolve(mat + ".png"));
        if (generated || tx.containsKey("layer0")) {
            List<BufferedImage> layers = new ArrayList<>();
            for (int i = 0; i < 4; i++) {
                String ref = tx.get("layer" + i);
                if (ref == null) break;
                BufferedImage img = tex(ref);
                if (img != null) layers.add(img);
            }
            if (layers.isEmpty()) return false;
            boolean tinted = hasTints(mat);
            Integer tint = defaultTint(mat);
            int size = layers.get(0).getWidth();
            BufferedImage comp = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = comp.createGraphics();
            for (int i = 0; i < layers.size(); i++) {
                BufferedImage l = layers.get(i);
                if (tinted && tintedLayer(mat, i) && tint != null) l = tint(l, tint);
                g.drawImage(l, 0, 0, size, size, null);
            }
            g.dispose();
            ImageIO.write(comp, "png", out.resolve(mat + ".png").toFile());
            if (tinted && layers.size() >= 1) {
                // Capa que se tiñe y el resto, para colorear en la web
                BufferedImage base = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
                BufferedImage tinte = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
                Graphics2D gb = base.createGraphics(), gt = tinte.createGraphics();
                for (int i = 0; i < layers.size(); i++) {
                    if (tintedLayer(mat, i)) gt.drawImage(layers.get(i), 0, 0, size, size, null);
                    else gb.drawImage(layers.get(i), 0, 0, size, size, null);
                }
                gb.dispose(); gt.dispose();
                ImageIO.write(base, "png", out.resolve(mat + ".base.png").toFile());
                ImageIO.write(tinte, "png", out.resolve(mat + ".tinte.png").toFile());
            }
            return true;
        }
        // Bloque: cara de arriba y dos laterales
        String top = first(tx, "top", "end", "up", "all", "texture", "particle");
        String left = first(tx, "front", "north", "side", "all", "texture", "particle");
        String right = first(tx, "side", "east", "south", "all", "texture", "particle");
        if (top == null || left == null) return false;
        BufferedImage t = tex(top), l = tex(left), r = tex(right == null ? left : right);
        if (t == null || l == null) return false;
        if (r == null) r = l;
        boolean tintTop = mat.equals("grass_block") || mat.contains("leaves");
        if (tintTop) t = tint(t, 0x7CBD6B);
        BufferedImage iso = iso(t, l, r);
        ImageIO.write(iso, "png", out.resolve(mat + ".png").toFile());
        return true;
    }

    static boolean tintedLayer(String mat, int layer) {
        // Pociones y flechas: se tiñe la capa 0 (el líquido). Cuero y estrella de fuegos: la 0 también, salvo overlay
        if (mat.contains("potion") || mat.equals("tipped_arrow")) return layer == 0;
        if (mat.startsWith("leather_")) return layer == 0;
        if (mat.equals("firework_star")) return layer == 1;
        return layer == 0;
    }

    static String first(Map<String, String> tx, String... keys) {
        for (String k : keys) if (tx.get(k) != null && !tx.get(k).startsWith("#")) return tx.get(k);
        return null;
    }

    static BufferedImage tint(BufferedImage src, int rgb) {
        int tr = (rgb >> 16) & 255, tg = (rgb >> 8) & 255, tb = rgb & 255;
        BufferedImage o = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < src.getHeight(); y++) for (int x = 0; x < src.getWidth(); x++) {
            int p = src.getRGB(x, y);
            int a = p >>> 24, r = (p >> 16) & 255, g = (p >> 8) & 255, b = p & 255;
            o.setRGB(x, y, (a << 24) | ((r * tr / 255) << 16) | ((g * tg / 255) << 8) | (b * tb / 255));
        }
        return o;
    }

    static BufferedImage shade(BufferedImage src, double f) {
        BufferedImage o = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < src.getHeight(); y++) for (int x = 0; x < src.getWidth(); x++) {
            int p = src.getRGB(x, y);
            int a = p >>> 24, r = (int) (((p >> 16) & 255) * f), g = (int) (((p >> 8) & 255) * f), b = (int) ((p & 255) * f);
            o.setRGB(x, y, (a << 24) | (r << 16) | (g << 8) | b);
        }
        return o;
    }

    // Cubo isométrico de 64x64 con las caras a 16 px escaladas sin suavizado
    static BufferedImage iso(BufferedImage top, BufferedImage left, BufferedImage right) {
        int S = 64;
        BufferedImage o = new BufferedImage(S, S, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
        double w = top.getWidth();
        double half = S / 2.0, quarter = S / 4.0;
        // Arriba: rombo
        AffineTransform at = new AffineTransform(half / w, quarter / w, -half / w, quarter / w, half, 0);
        g.drawImage(top, at, null);
        // Izquierda
        AffineTransform al = new AffineTransform(half / w, quarter / w, 0, half / w, 0, quarter);
        g.drawImage(shade(left, 0.82), al, null);
        // Derecha
        AffineTransform ar = new AffineTransform(half / w, -quarter / w, 0, half / w, half, half);
        g.drawImage(shade(right, 0.64), ar, null);
        g.dispose();
        return o;
    }

    // Estandarte plano: la tela de entity/banner/base teñida y un palo
    static boolean banner(String mat, Path dest) throws IOException {
        BufferedImage base;
        try (InputStream in = jar.getInputStream(jar.getEntry("assets/minecraft/textures/entity/banner/base.png"))) {
            base = ImageIO.read(in);
        }
        Map<String, Integer> colors = Map.of("red", 0xB02E26, "white", 0xF9FFFE, "blue", 0x3C44AA, "black", 0x1D1D21, "purple", 0x8932B8);
        int color = colors.getOrDefault(mat.replace("_banner", ""), 0xB02E26);
        BufferedImage cloth = tint(toArgb(base.getSubimage(1, 1, 20, 40)), color);
        BufferedImage o = new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g.setColor(new Color(0x6B4E2E));
        g.fillRect(15, 0, 2, 32);
        g.setColor(new Color(0x8A6A43));
        g.fillRect(6, 1, 20, 2);
        g.drawImage(cloth, 8, 3, 16, 27, null);
        g.dispose();
        ImageIO.write(o, "png", dest.toFile());
        return true;
    }

    // El cofre es un modelo especial: se arma el cubo con la textura de entity/chest/normal
    static boolean chest(Path dest) throws IOException {
        BufferedImage t;
        try (InputStream in = jar.getInputStream(jar.getEntry("assets/minecraft/textures/entity/chest/normal.png"))) {
            t = toArgb(ImageIO.read(in));
        }
        BufferedImage top = t.getSubimage(14, 0, 14, 14);
        BufferedImage front = new BufferedImage(14, 15, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = front.createGraphics();
        g.drawImage(t.getSubimage(14, 14, 14, 5), 0, 0, null);
        g.drawImage(t.getSubimage(14, 33, 14, 10), 0, 5, null);
        g.drawImage(t.getSubimage(1, 1, 2, 4), 6, 3, null);
        g.dispose();
        BufferedImage side = new BufferedImage(14, 15, BufferedImage.TYPE_INT_ARGB);
        g = side.createGraphics();
        g.drawImage(t.getSubimage(0, 14, 14, 5), 0, 0, null);
        g.drawImage(t.getSubimage(0, 33, 14, 10), 0, 5, null);
        g.dispose();
        ImageIO.write(iso(scale16(top), scale16(front), scale16(side)), "png", dest.toFile());
        return true;
    }

    static BufferedImage scale16(BufferedImage src) {
        BufferedImage o = new BufferedImage(16, 16, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g.drawImage(src, 0, 0, 16, 16, null);
        g.dispose();
        return o;
    }

    static BufferedImage toArgb(BufferedImage img) {
        BufferedImage argb = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_ARGB);
        argb.getGraphics().drawImage(img, 0, 0, null);
        return argb;
    }

    // Cabeza de Steve para las cabezas de jugador
    static boolean head(Path dest) throws IOException {
        BufferedImage skin = null;
        for (String p : List.of("entity/player/wide/steve", "entity/steve", "entity/player/slim/steve")) {
            skin = tex(p.replace("entity/", "entity/"));
            if (skin != null) break;
        }
        if (skin == null) {
            ZipEntry e = jar.getEntry("assets/minecraft/textures/entity/player/wide/steve.png");
            if (e == null) return false;
        }
        BufferedImage full;
        try (InputStream in = jar.getInputStream(jar.getEntry("assets/minecraft/textures/entity/player/wide/steve.png"))) {
            full = ImageIO.read(in);
        }
        BufferedImage face = new BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = face.createGraphics();
        g.drawImage(full.getSubimage(8, 8, 8, 8), 0, 0, null);
        g.drawImage(full.getSubimage(40, 8, 8, 8), 0, 0, null);
        g.dispose();
        ImageIO.write(face, "png", dest.toFile());
        return true;
    }
}

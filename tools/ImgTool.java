import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;

/**
 * Prepara las imágenes de la web a partir de los logos originales.
 *
 * Uso: java ImgTool.java <logo-croissants.png> <logo-segunda-edicion.png> <assets/img>
 *
 * Recorta los logos a su contenido, arma el favicon y los iconos con la "C" del logo y la imagen para redes (1200x630).
 */
public class ImgTool {

    public static void main(String[] args) throws Exception {
        BufferedImage logo = crop(ImageIO.read(new File(args[0])));
        BufferedImage segunda = crop(ImageIO.read(new File(args[1])));
        Path out = Path.of(args[2]).toAbsolutePath();
        Files.createDirectories(out);

        write(logo, out.resolve("logo-croissants.png"));
        write(resize(logo, 960), out.resolve("logo-croissants-960.png"));
        write(resize(segunda, 1400), out.resolve("logo-segunda.png"));
        write(resize(segunda, 760), out.resolve("logo-segunda-760.png"));

        // La "C": desde el borde izquierdo hasta el primer hueco transparente entre letras
        int cEnd = firstGap(logo, 120);
        BufferedImage c = logo.getSubimage(0, 0, cEnd, logo.getHeight());
        BufferedImage square = pad(c, 0.08);
        write(resize(square, 512), out.resolve("icon-512.png"));
        write(resize(square, 192), out.resolve("icon-192.png"));
        write(onBackground(resize(square, 150), 180), out.resolve("apple-touch-icon.png"));
        write(resize(square, 32), out.resolve("favicon-32.png"));
        writeIco(new BufferedImage[]{resize(square, 16), resize(square, 32), resize(square, 48)}, out.getParent().getParent().resolve("favicon.ico"));

        write(ogImage(segunda), out.resolve("og-image.png"));
        System.out.println("logo " + logo.getWidth() + "x" + logo.getHeight() + " · segunda " + segunda.getWidth() + "x" + segunda.getHeight() + " · C hasta x=" + cEnd);
    }

    static BufferedImage crop(BufferedImage img) {
        int w = img.getWidth(), h = img.getHeight(), minx = w, miny = h, maxx = -1, maxy = -1;
        for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
            if ((img.getRGB(x, y) >>> 24) > 8) {
                minx = Math.min(minx, x); miny = Math.min(miny, y); maxx = Math.max(maxx, x); maxy = Math.max(maxy, y);
            }
        }
        BufferedImage o = new BufferedImage(maxx - minx + 1, maxy - miny + 1, BufferedImage.TYPE_INT_ARGB);
        o.getGraphics().drawImage(img.getSubimage(minx, miny, o.getWidth(), o.getHeight()), 0, 0, null);
        return o;
    }

    // Primera columna (después de minX) donde casi no hay píxeles opacos en la franja del medio de las letras
    static int firstGap(BufferedImage img, int minX) {
        int h = img.getHeight();
        int best = -1;
        for (int x = minX; x < img.getWidth() / 3; x++) {
            int opaque = 0;
            for (int y = h / 5; y < h * 4 / 5; y++) {
                int p = img.getRGB(x, y);
                int a = p >>> 24, r = (p >> 16) & 255, g = (p >> 8) & 255, b = p & 255;
                // Cuenta solo el relleno claro de las letras (no el contorno oscuro que las une)
                if (a > 200 && (r + g + b) > 260) opaque++;
            }
            if (opaque == 0) { best = x; break; }
        }
        return best > 0 ? Math.min(img.getWidth(), best + 6) : img.getHeight();
    }

    static BufferedImage pad(BufferedImage src, double margin) {
        int side = (int) (Math.max(src.getWidth(), src.getHeight()) * (1 + margin * 2));
        BufferedImage o = new BufferedImage(side, side, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.drawImage(src, (side - src.getWidth()) / 2, (side - src.getHeight()) / 2, null);
        g.dispose();
        return o;
    }

    static BufferedImage onBackground(BufferedImage icon, int size) {
        BufferedImage o = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setPaint(new GradientPaint(0, 0, new Color(0x2A1D63), size, size, new Color(0x13123A)));
        g.fillRect(0, 0, size, size);
        g.drawImage(icon, (size - icon.getWidth()) / 2, (size - icon.getHeight()) / 2, null);
        g.dispose();
        return o;
    }

    // Reducción en pasos (cada uno a la mitad como mucho) para que quede nítida
    static BufferedImage resize(BufferedImage src, int width) {
        BufferedImage cur = src;
        int targetH = (int) Math.round(src.getHeight() * (width / (double) src.getWidth()));
        while (cur.getWidth() / 2 > width) {
            cur = scale(cur, cur.getWidth() / 2, cur.getHeight() / 2);
        }
        return scale(cur, width, targetH);
    }

    static BufferedImage scale(BufferedImage src, int w, int h) {
        BufferedImage o = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return o;
    }

    static BufferedImage ogImage(BufferedImage segunda) {
        int W = 1200, H = 630;
        BufferedImage o = new BufferedImage(W, H, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = o.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setPaint(new GradientPaint(0, 0, new Color(0x0C0A26), 0, H, new Color(0x1B1650)));
        g.fillRect(0, 0, W, H);
        // Nubes y remolinos suaves
        glow(g, 220, 120, 420, new Color(124, 77, 255, 70));
        glow(g, 1000, 520, 460, new Color(110, 193, 255, 60));
        glow(g, 640, 330, 520, new Color(185, 164, 255, 40));
        g.setStroke(new BasicStroke(2.2f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        for (int i = 0; i < 9; i++) {
            float alpha = 0.10f + 0.03f * (i % 3);
            g.setColor(new Color(1f, 1f, 1f, alpha));
            Path2D wind = new Path2D.Double();
            double y = 70 + i * 62;
            wind.moveTo(-40, y);
            wind.curveTo(260, y - 40, 420, y + 50, 700, y - 10);
            wind.curveTo(900, y - 50, 1050, y + 30, 1260, y - 20);
            g.draw(wind);
        }
        BufferedImage logo = resize(segunda, 1000);
        g.drawImage(logo, (W - logo.getWidth()) / 2, 120, null);
        g.setFont(new Font("Segoe UI", Font.BOLD, 34));
        String line = "El SMP público de Crosszy · Java y Bedrock";
        FontMetrics fm = g.getFontMetrics();
        g.setColor(new Color(0xF5F3FF));
        g.drawString(line, (W - fm.stringWidth(line)) / 2, 120 + logo.getHeight() + 70);
        g.setFont(new Font("Segoe UI", Font.PLAIN, 24));
        fm = g.getFontMetrics();
        String sub = "Un proyecto de Viciont Studios";
        g.setColor(new Color(0xB9A4FF));
        g.drawString(sub, (W - fm.stringWidth(sub)) / 2, 120 + logo.getHeight() + 112);
        g.dispose();
        return o;
    }

    static void glow(Graphics2D g, int cx, int cy, int r, Color c) {
        RadialGradientPaint p = new RadialGradientPaint(new Point2D.Double(cx, cy), r, new float[]{0f, 1f},
                new Color[]{c, new Color(c.getRed(), c.getGreen(), c.getBlue(), 0)});
        g.setPaint(p);
        g.fillOval(cx - r, cy - r, r * 2, r * 2);
    }

    static void write(BufferedImage img, Path p) throws IOException {
        ImageIO.write(img, "png", p.toFile());
    }

    // ICO con las imágenes PNG adentro (lo aceptan todos los navegadores)
    static void writeIco(BufferedImage[] imgs, Path dest) throws IOException {
        byte[][] pngs = new byte[imgs.length][];
        for (int i = 0; i < imgs.length; i++) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            ImageIO.write(imgs[i], "png", bo);
            pngs[i] = bo.toByteArray();
        }
        try (DataOutputStream out = new DataOutputStream(new FileOutputStream(dest.toFile()))) {
            out.write(le16(0)); out.write(le16(1)); out.write(le16(imgs.length));
            int offset = 6 + 16 * imgs.length;
            for (int i = 0; i < imgs.length; i++) {
                int s = imgs[i].getWidth();
                out.writeByte(s >= 256 ? 0 : s); out.writeByte(s >= 256 ? 0 : s);
                out.writeByte(0); out.writeByte(0);
                out.write(le16(1)); out.write(le16(32));
                out.write(le32(pngs[i].length)); out.write(le32(offset));
                offset += pngs[i].length;
            }
            for (byte[] p : pngs) out.write(p);
        }
    }

    static byte[] le16(int v) { return new byte[]{(byte) v, (byte) (v >> 8)}; }
    static byte[] le32(int v) { return new byte[]{(byte) v, (byte) (v >> 8), (byte) (v >> 16), (byte) (v >> 24)}; }
}

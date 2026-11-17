package com.bingoshow.tv;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.PorterDuff;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.os.Process;
import android.view.Choreographer;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.animation.PathInterpolator;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * MODO 1 da bola nativa: superfície própria (SurfaceView) por cima do WebView —
 * a versão publicada no APK 1.0.10.
 *
 * A bola é desenhada numa thread só dela, no ritmo da tela (Choreographer). A
 * imagem é a bola do próprio site (scripts/capture-ball.js) e a coreografia repete
 * o CSS original (DrawStage*.module.css): voo em arco 1320ms, giro, número se
 * ajeitando, flash e anel no pouso (1000ms) e pulso (1180ms).
 *
 * Atenção (TV HiSilicon/Mali-450): nela a SurfaceView só é atualizada na tela
 * junto com a página. Por isso o site NÃO segura os eventos durante o voo
 * (NATIVE_HOLD_MS = 0 em src/lib/nativeBall.ts) — com a página parada a bola
 * perdia a entrada.
 * A página só chama TvBridge.ballPreload/ballShow/ballHide (src/lib/nativeBall.ts).
 */
final class BallSurface implements BallRenderer, SurfaceHolder.Callback {

    private static final float STAGE_BALL_PX = 252f;
    private static final float FLIGHT_MS = 1320f;
    private static final float SIMPLE_MS = 600f;

    private static final PathInterpolator FLIGHT_EASE = new PathInterpolator(0.25f, 0.46f, 0.45f, 0.94f);
    private static final PathInterpolator EASE_IN_OUT = new PathInterpolator(0.42f, 0f, 0.58f, 1f);
    private static final PathInterpolator EASE_OUT = new PathInterpolator(0f, 0f, 0.58f, 1f);
    private static final PathInterpolator SIMPLE_EASE = new PathInterpolator(0.22f, 0.8f, 0.3f, 1f);

    /** O que está na tela. Criado na thread principal, lido só na thread da bola. */
    private static final class Scene {
        Bitmap bmp;
        float cx, cy, ballPx, size, k;
        String text;
        int color, ring;
        boolean lightShadow;
        String anim;
        long startNanos;
        float fx = -390, fy = -90;
        boolean fromGlobe;
    }

    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, Bitmap> sprites = new HashMap<>();
    private final Set<String> loading = new HashSet<>();
    private final FrameLayout root;
    private final SurfaceView surface;
    private final HandlerThread thread;
    private final Handler render;
    private final Object lock = new Object();

    private String pendingJson;

    // Só na thread da bola
    private Choreographer choreographer;
    private Scene scene;
    private boolean looping;
    private boolean ready;
    private final Paint bmpPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint flashPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF dst = new RectF();

    private final Choreographer.FrameCallback frame = new Choreographer.FrameCallback() {
        @Override
        public void doFrame(long frameTimeNanos) {
            boolean more = draw(frameTimeNanos);
            if (more) {
                choreographer.postFrameCallback(this);
            } else {
                looping = false;
            }
        }
    };

    BallSurface(Activity activity, FrameLayout root) {
        this.root = root;
        surface = new SurfaceView(activity);
        surface.setZOrderOnTop(true);
        surface.getHolder().setFormat(PixelFormat.TRANSLUCENT);
        surface.getHolder().addCallback(this);
        surface.setFocusable(false);
        surface.setClickable(false);
        root.addView(surface, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        thread = new HandlerThread("ball-anim", Process.THREAD_PRIORITY_DISPLAY);
        thread.start();
        render = new Handler(thread.getLooper());
        render.post(() -> {
            choreographer = Choreographer.getInstance();
            textPaint.setTextAlign(Paint.Align.CENTER);
            textPaint.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
            textPaint.setLetterSpacing(-0.06f);
            ringPaint.setStyle(Paint.Style.STROKE);
        });
    }

    /** Baixa a imagem da bola antes do sorteio (a página chama ao abrir o palco). */
    @Override
    public void preload(final String url) {
        if (url == null || sprites.containsKey(url) || !loading.add(url)) return;
        new Thread(() -> {
            Bitmap bmp = download(url);
            main.post(() -> {
                loading.remove(url);
                if (bmp != null) sprites.put(url, bmp);
                if (pendingJson != null) {
                    String json = pendingJson;
                    pendingJson = null;
                    show(json);
                }
            });
        }, "ball-sprite").start();
    }

    /** JSON da página: n, cx, cy, ball (px físicos), sprite, frac, color, ratio,
     * shadow ("light"/"dark"), ring, anim (full/simple/still). */
    @Override
    public void show(String json) {
        try {
            JSONObject o = new JSONObject(json);
            String url = o.getString("sprite");
            Bitmap bmp = sprites.get(url);
            if (bmp == null) {
                pendingJson = json;
                preload(url);
                return;
            }
            final Scene s = new Scene();
            s.bmp = bmp;
            s.cx = (float) o.getDouble("cx");
            s.cy = (float) o.getDouble("cy");
            s.ballPx = (float) o.getDouble("ball");
            s.size = s.ballPx / (float) o.optDouble("frac", 0.677);
            s.k = s.ballPx / STAGE_BALL_PX;
            s.text = String.valueOf(o.getInt("n"));
            s.color = parseColor(o.optString("color", "#ffffff"));
            s.ring = parseColor(o.optString("ring", "#FFE278"));
            s.lightShadow = "light".equals(o.optString("shadow"));
            s.anim = o.optString("anim", "full");
            s.fx = (float) o.optDouble("fromX", -390);
            s.fy = (float) o.optDouble("fromY", -90);
            s.fromGlobe = o.has("fromX");
            final float ratio = (float) o.optDouble("ratio", 0.4365);
            render.post(() -> {
                textPaint.setTextSize(s.ballPx * ratio);
                textPaint.setColor(s.color);
                if (s.lightShadow) textPaint.setShadowLayer(1f, 0f, s.k, 0xF2FFFFFF);
                else textPaint.setShadowLayer(3f * s.k, 0f, 3f * s.k, 0x8C00081E);
                ringPaint.setStrokeWidth(Math.max(2f, 3f * s.k));
                int rgb = s.ring & 0x00FFFFFF;
                flashPaint.setShader(new RadialGradient(0, 0, s.ballPx * 0.55f,
                        new int[] {0xD9FFFBEA, rgb | 0x66000000, rgb}, new float[] {0f, 0.4f, 1f},
                        Shader.TileMode.CLAMP));
                s.startNanos = System.nanoTime();
                scene = s;
                startLoop();
            });
        } catch (Exception e) {
            hide();
        }
    }

    @Override
    public void hide() {
        pendingJson = null;
        render.post(() -> {
            scene = null;
            startLoop(); // um quadro limpo
        });
    }

    @Override
    public void release() {
        render.post(() -> {
            scene = null;
            if (choreographer != null) choreographer.removeFrameCallback(frame);
        });
        thread.quitSafely();
        root.removeView(surface);
    }

    // ---------- SurfaceHolder.Callback (thread principal) ----------

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        render.post(() -> {
            synchronized (lock) {
                ready = true;
            }
            startLoop();
        });
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
        render.post(this::startLoop);
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        // A thread da bola não pode desenhar depois que isto retornar.
        synchronized (lock) {
            ready = false;
        }
    }

    // ---------- Thread da bola ----------

    private void startLoop() {
        if (looping || choreographer == null) return;
        looping = true;
        choreographer.postFrameCallback(frame);
    }

    /** Desenha um quadro. Devolve true enquanto ainda estiver animando. */
    private boolean draw(long now) {
        synchronized (lock) {
            if (!ready) return false;
            SurfaceHolder holder = surface.getHolder();
            Canvas c;
            try {
                c = Build.VERSION.SDK_INT >= 23 ? holder.lockHardwareCanvas() : holder.lockCanvas();
            } catch (Exception e) {
                c = holder.lockCanvas();
            }
            if (c == null) return false;
            boolean more = false;
            try {
                c.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
                Scene s = scene;
                if (s != null) more = drawScene(c, s, (now - s.startNanos) / 1_000_000f);
            } finally {
                holder.unlockCanvasAndPost(c);
            }
            return more;
        }
    }

    private boolean drawScene(Canvas c, Scene s, float e) {
        float tx = 0, ty = 0, sc = 1, rot = 0, alpha = 1;
        float nAlpha = 1, nRot = 0, nSc = 1, pulse = 1;
        float flashA = 0, flashSc = 1, ringA = 0, ringSc = 1;
        boolean more;

        if ("full".equals(s.anim)) {
            float p = clamp(e / FLIGHT_MS);
            float ox = s.fx < 0 ? 1 : -1; // passa um pouco do centro no sentido do voo
            tx = track(p, s.fx * s.k, 11 * ox * s.k, -4 * ox * s.k, 0);
            if (s.fromGlobe) {
                // Saindo da base do globo: curva única (Bézier para baixo), uma só
                // aceleração até o pouso (76%); depois só o tamanho assenta.
                if (p < 0.76f) {
                    float u = FLIGHT_EASE.getInterpolation(p / 0.76f), v = 1 - u;
                    float x0 = s.fx * s.k, y0 = s.fy * s.k;
                    tx = v * v * x0 + 2 * v * u * (x0 * 0.55f);
                    ty = v * v * y0 + 2 * v * u * ((Math.max(s.fy, 0) + 130) * s.k);
                } else {
                    tx = 0;
                    ty = 0;
                }
            } else {
                ty = track(p, s.fy * s.k, 5 * s.k, -2 * s.k, 0);
            }
            sc = track(p, 0.14f, 1.055f, 0.98f, 1f);
            rot = track(p, -720 * ox, -22 * ox, 6 * ox, 0);
            alpha = EASE_OUT.getInterpolation(clamp(e / 160f));
            // número: fora do giro, assenta aos 78%
            if (p < 0.78f) {
                float u = FLIGHT_EASE.getInterpolation(p / 0.78f);
                nAlpha = u;
                nRot = lerp(-360, -8, u);
                nSc = lerp(0.72f, 1f, u);
            } else {
                nRot = lerp(-8, 0, EASE_OUT.getInterpolation((p - 0.78f) / 0.22f));
            }
            // pulso final 1180–1560ms
            if (e > 1180 && e < 1560) {
                float u = EASE_OUT.getInterpolation((e - 1180) / 380f);
                pulse = u < 0.42f ? lerp(1f, 1.045f, u / 0.42f) : lerp(1.045f, 1f, (u - 0.42f) / 0.58f);
            }
            // flash 1000–1460ms e anel 1000–1440ms
            if (e > 1000 && e < 1460) {
                float u = EASE_OUT.getInterpolation((e - 1000) / 460f);
                flashA = u < 0.3f ? u / 0.3f : 1f - (u - 0.3f) / 0.7f;
                flashSc = lerp(0.8f, 1.15f, u);
            }
            if (e > 1000 && e < 1440) {
                float u = EASE_OUT.getInterpolation((e - 1000) / 440f);
                ringA = 0.95f * (u < 0.25f ? u / 0.25f : 1f - (u - 0.25f) / 0.75f);
                ringSc = lerp(0.72f, 1.36f, u);
            }
            more = e < 1560;
        } else if ("simple".equals(s.anim)) {
            float p = clamp(e / SIMPLE_MS);
            if (p < 0.75f) {
                float u = SIMPLE_EASE.getInterpolation(p / 0.75f);
                tx = lerp(-460 * s.k, 8 * s.k, u);
                ty = lerp(-40 * s.k, 0, u);
                sc = lerp(0.55f, 1.04f, u);
            } else {
                float u = SIMPLE_EASE.getInterpolation((p - 0.75f) / 0.25f);
                tx = lerp(8 * s.k, 0, u);
                sc = lerp(1.04f, 1f, u);
            }
            alpha = clamp(p / 0.15f);
            more = e < SIMPLE_MS;
        } else {
            more = false; // "still": só o quadro final
        }

        if (flashA > 0) {
            flashPaint.setAlpha(Math.round(255 * flashA));
            c.save();
            c.translate(s.cx, s.cy);
            c.scale(flashSc, flashSc);
            c.drawCircle(0, 0, s.ballPx * 0.55f, flashPaint);
            c.restore();
        }

        c.save();
        c.translate(s.cx + tx, s.cy + ty);
        c.scale(sc, sc);

        c.save();
        c.rotate(rot);
        c.scale(pulse, pulse);
        float h = s.size / 2f;
        dst.set(-h, -h, h, h);
        bmpPaint.setAlpha(Math.round(255 * alpha));
        c.drawBitmap(s.bmp, null, dst, bmpPaint);
        c.restore();

        c.save();
        c.rotate(nRot);
        c.scale(nSc, nSc);
        textPaint.setAlpha(Math.round(255 * alpha * nAlpha));
        Paint.FontMetrics fm = textPaint.getFontMetrics();
        c.drawText(s.text, 0, -(fm.ascent + fm.descent) / 2f, textPaint);
        c.restore();

        c.restore();

        if (ringA > 0) {
            ringPaint.setColor(s.ring);
            ringPaint.setAlpha(Math.round(255 * ringA));
            float r = (s.ballPx / 2f) * ringSc - ringPaint.getStrokeWidth() / 2f;
            c.drawCircle(s.cx, s.cy, r, ringPaint);
        }
        return more;
    }

    /** Quadros-chave 0 / 76% / 88% / 100% com a curva de cada trecho do CSS. */
    private static float track(float p, float v0, float v1, float v2, float v3) {
        if (p < 0.76f) return lerp(v0, v1, FLIGHT_EASE.getInterpolation(p / 0.76f));
        if (p < 0.88f) return lerp(v1, v2, EASE_IN_OUT.getInterpolation((p - 0.76f) / 0.12f));
        return lerp(v2, v3, EASE_OUT.getInterpolation(clamp((p - 0.88f) / 0.12f)));
    }

    private static float lerp(float a, float b, float t) {
        return a + (b - a) * t;
    }

    private static float clamp(float v) {
        return v < 0 ? 0 : (v > 1 ? 1 : v);
    }

    private static final Pattern RGB = Pattern.compile("rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*([0-9.]+)\\s*)?\\)");

    /** "rgb(8, 36, 92)", "rgba(…)" ou "#RRGGBB". */
    static int parseColor(String css) {
        try {
            Matcher m = RGB.matcher(css);
            if (m.find()) {
                int a = m.group(4) != null ? Math.round(Float.parseFloat(m.group(4)) * 255) : 255;
                return Color.argb(a, Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
            }
            return Color.parseColor(css.trim());
        } catch (Exception e) {
            return Color.WHITE;
        }
    }

    private static Bitmap download(String url) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(10_000);
            c.setReadTimeout(15_000);
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream()) {
                return BitmapFactory.decodeStream(in);
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }
}

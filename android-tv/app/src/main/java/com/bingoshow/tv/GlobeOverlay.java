package com.bingoshow.tv;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ImageDecoder;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.AnimatedImageDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;

/**
 * Globo do sorteio animado pelo Android, ao lado da bola (tema Loteria'i).
 *
 * Modo principal (APK 1.0.17+): "sprite sheet" — uma imagem comum com todos os
 * quadros (public/themes/loteriai/sm/decorative/globo-quadros.webp). O Android
 * decodifica uma vez (BitmapFactory, como a bola) e troca de quadro recortando a
 * imagem a cada `ms`. Não depende do AnimatedImageDrawable, que na hi352t
 * (Android 9, GPU Mali-450) dizia "ok" mas não aparecia na tela e disputava a
 * thread de desenho com a bola.
 *
 * Sem `sheet` no JSON (página antiga): WebP animado via AnimatedImageDrawable.
 * A página lê o estado em TvBridge.globeState(); "ok" só depois do 1º quadro
 * realmente desenhado. A página chama globeShow/globeHide (DrawStage.tsx).
 */
final class GlobeOverlay {

    private final FrameLayout root;
    private final GlobeView view;
    private final Handler main = new Handler(Looper.getMainLooper());
    private String loadedUrl;
    private String loadingUrl;
    private String pendingJson;
    /** idle | loading | ok | fail — lido pela página (TvBridge.globeState). */
    private volatile String state = "idle";

    String state() {
        return state;
    }

    GlobeOverlay(Activity activity, FrameLayout root) {
        this.root = root;
        view = new GlobeView(activity);
        view.setFocusable(false);
        view.setClickable(false);
        view.setVisibility(View.GONE);
        // Índice 1: logo acima do WebView (índice 0) e abaixo da bola.
        root.addView(view, Math.min(1, root.getChildCount()), new FrameLayout.LayoutParams(1, 1));
    }

    /** JSON da página: url, x, y, w, h (px físicos) e, opcional, sheet {url, frames, cols, w, h, ms}. */
    void show(String json) {
        try {
            JSONObject o = new JSONObject(json);
            JSONObject sheet = o.optJSONObject("sheet");
            String url = sheet != null ? sheet.getString("url") : o.getString("url");
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                    Math.round((float) o.getDouble("w")), Math.round((float) o.getDouble("h")), Gravity.TOP | Gravity.START);
            lp.leftMargin = Math.round((float) o.getDouble("x"));
            lp.topMargin = Math.round((float) o.getDouble("y"));
            view.setLayoutParams(lp);
            if (!view.hasContent() || !url.equals(loadedUrl)) {
                pendingJson = json;
                load(url, sheet);
                return;
            }
            pendingJson = null;
            view.setVisibility(View.VISIBLE);
            view.play();
        } catch (Exception e) {
            state = "fail";
            hide();
        }
    }

    void hide() {
        pendingJson = null;
        view.pause();
        view.setVisibility(View.GONE);
    }

    void release() {
        hide();
        root.removeView(view);
    }

    private void load(final String url, final JSONObject sheet) {
        if (url.equals(loadingUrl)) return;
        loadingUrl = url;
        state = "loading";
        new Thread(() -> {
            // A TV pode estar com a rede lenta: tenta 3 vezes.
            byte[] bytes = null;
            for (int i = 0; i < 3 && bytes == null; i++) {
                bytes = download(url);
                if (bytes == null) sleep(2000L * (i + 1));
            }
            Bitmap bmp = null;
            Drawable anim = null;
            if (bytes != null) {
                if (sheet != null) {
                    try {
                        bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                    } catch (Throwable e) {
                        bmp = null;
                    }
                } else {
                    anim = decodeAnimated(bytes);
                }
            }
            final Bitmap fBmp = bmp;
            final Drawable fAnim = anim;
            main.post(() -> {
                loadingUrl = null;
                if (fBmp == null && fAnim == null) {
                    state = "fail";
                    return;
                }
                if (fBmp != null) {
                    view.setSheet(fBmp, sheet.optInt("frames", 1), sheet.optInt("cols", 1),
                            sheet.optInt("w", fBmp.getWidth()), sheet.optInt("h", fBmp.getHeight()), sheet.optInt("ms", 60));
                } else {
                    view.setAnimated(fAnim);
                }
                loadedUrl = url;
                if (pendingJson != null) {
                    String json = pendingJson;
                    pendingJson = null;
                    show(json);
                }
            });
        }, "globe-load").start();
    }

    private static Drawable decodeAnimated(byte[] bytes) {
        if (Build.VERSION.SDK_INT < 28) return null;
        try {
            Drawable d = ImageDecoder.decodeDrawable(ImageDecoder.createSource(ByteBuffer.wrap(bytes)));
            if (d instanceof AnimatedImageDrawable) {
                ((AnimatedImageDrawable) d).setRepeatCount(AnimatedImageDrawable.REPEAT_INFINITE);
            }
            return d;
        } catch (Throwable e) {
            return null;
        }
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private static byte[] download(String url) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(10_000);
            c.setReadTimeout(45_000);
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                return out.toByteArray();
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    /** Desenha o quadro atual do sprite sheet (ou o WebP animado, no modo antigo). */
    private final class GlobeView extends View {
        private final Paint paint = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
        private final Rect src = new Rect();
        private final Rect dst = new Rect();
        private Bitmap sheet;
        private int frames, cols, fw, fh, ms;
        private Drawable anim;
        private boolean playing;
        private long startedAt;

        private final Runnable tick = new Runnable() {
            @Override
            public void run() {
                if (!playing || sheet == null) return;
                invalidate();
                // Próxima troca no limite do quadro (sem acumular atraso).
                long t = SystemClock.uptimeMillis() - startedAt;
                postDelayed(this, ms - (t % ms));
            }
        };

        GlobeView(Context c) {
            super(c);
        }

        boolean hasContent() {
            return sheet != null || anim != null;
        }

        void setSheet(Bitmap bmp, int frames, int cols, int fw, int fh, int ms) {
            pause();
            anim = null;
            sheet = bmp;
            this.frames = Math.max(1, frames);
            this.cols = Math.max(1, cols);
            this.fw = fw;
            this.fh = fh;
            this.ms = Math.max(16, ms);
        }

        void setAnimated(Drawable d) {
            pause();
            sheet = null;
            anim = d;
            d.setCallback(this);
        }

        @Override
        protected boolean verifyDrawable(Drawable who) {
            return who == anim || super.verifyDrawable(who);
        }

        void play() {
            if (playing) return;
            playing = true;
            startedAt = SystemClock.uptimeMillis();
            if (sheet != null) {
                removeCallbacks(tick);
                post(tick);
            } else if (Build.VERSION.SDK_INT >= 28 && anim instanceof AnimatedImageDrawable) {
                ((AnimatedImageDrawable) anim).start();
            }
            invalidate();
        }

        void pause() {
            playing = false;
            removeCallbacks(tick);
            if (Build.VERSION.SDK_INT >= 28 && anim instanceof AnimatedImageDrawable) {
                ((AnimatedImageDrawable) anim).stop();
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            dst.set(0, 0, getWidth(), getHeight());
            if (sheet != null) {
                int f = (int) (((SystemClock.uptimeMillis() - startedAt) / ms) % frames);
                int x = (f % cols) * fw;
                int y = (f / cols) * fh;
                src.set(x, y, x + fw, y + fh);
                canvas.drawBitmap(sheet, src, dst, paint);
            } else if (anim != null) {
                anim.setBounds(dst);
                anim.draw(canvas);
            } else {
                return;
            }
            // Só agora a página esconde a imagem dela: o globo está de fato na tela.
            state = "ok";
        }
    }
}

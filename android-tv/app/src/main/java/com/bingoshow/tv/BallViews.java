package com.bingoshow.tv;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.Keyframe;
import android.animation.ObjectAnimator;
import android.animation.PropertyValuesHolder;
import android.animation.TimeInterpolator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.Property;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.animation.LinearInterpolator;
import android.view.animation.PathInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * MODO 2 da bola nativa (padrão): views dentro da tela do app, por cima do WebView.
 *
 * Nesta TV (HiSilicon/Mali-450) a SurfaceView do Modo 1 só é atualizada na tela
 * junto com a página. Aqui a bola é parte da tela do app, animada pelo Android, e
 * o site segura os eventos da página durante o voo (NATIVE_HOLD_MS em
 * src/lib/nativeBall.ts, só neste modo) — com a página parada, os quadros do app
 * não esperam o WebView.
 *
 * Imagem da bola: a do próprio site (scripts/capture-ball.js). Coreografia do CSS
 * original (DrawStage*.module.css): voo em arco 1320ms, giro, número se
 * ajeitando, flash e anel no pouso (1000ms) e pulso (1180ms).
 */
final class BallViews implements BallRenderer {

    /** Avisos ao MainActivity: medir os quadros do voo e (Modo 3) congelar a página. */
    interface Hooks {
        void animStart();

        void animEnd();
    }

    private static final float STAGE_BALL_PX = 252f;
    private static final long FLIGHT_MS = 1320;
    private static final long IMPACT_AT_MS = 1000;

    private static final TimeInterpolator FLIGHT_EASE = new PathInterpolator(0.25f, 0.46f, 0.45f, 0.94f);
    private static final TimeInterpolator EASE_IN_OUT = new PathInterpolator(0.42f, 0f, 0.58f, 1f);
    private static final TimeInterpolator EASE_OUT = new PathInterpolator(0f, 0f, 0.58f, 1f);
    private static final TimeInterpolator SIMPLE_EASE = new PathInterpolator(0.22f, 0.8f, 0.3f, 1f);

    private final Activity activity;
    private final FrameLayout root;
    private final Hooks hooks;
    private final FrameLayout layer;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, Bitmap> sprites = new HashMap<>();
    private final Set<String> loading = new HashSet<>();

    private FrameLayout flight;
    private ImageView ball;
    private TextView number;
    private View flash;
    private View ring;
    private AnimatorSet running;
    private float fromX = -390, fromY = -90;
    private boolean fromGlobe;
    private String pendingJson;

    BallViews(Activity activity, FrameLayout root, Hooks hooks) {
        this.activity = activity;
        this.root = root;
        this.hooks = hooks;
        layer = new FrameLayout(activity);
        layer.setClickable(false);
        layer.setFocusable(false);
        layer.setVisibility(View.GONE);
        root.addView(layer, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
    }

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
            String sprite = o.getString("sprite");
            Bitmap bmp = sprites.get(sprite);
            if (bmp == null) {
                pendingJson = json;
                preload(sprite);
                return;
            }
            build(bmp, o);
        } catch (Exception e) {
            hide();
        }
    }

    @Override
    public void hide() {
        pendingJson = null;
        if (running != null) running.cancel();
        running = null;
        layer.setVisibility(View.GONE);
    }

    @Override
    public void release() {
        hide();
        root.removeView(layer);
    }

    private void build(Bitmap bmp, JSONObject o) throws Exception {
        if (running != null) running.cancel();
        running = null;
        layer.removeAllViews();

        float cx = (float) o.getDouble("cx");
        float cy = (float) o.getDouble("cy");
        float ballPx = (float) o.getDouble("ball");
        float frac = (float) o.optDouble("frac", 0.677);
        float k = ballPx / STAGE_BALL_PX; // px físicos por px do palco
        int size = Math.round(ballPx / frac);
        int ringColor = BallSurface.parseColor(o.optString("ring", "#FFE278"));
        // De onde a bola nasce (px do palco): a gaiola do globo, se a página mandar.
        fromX = (float) o.optDouble("fromX", -390);
        fromY = (float) o.optDouble("fromY", -90);
        fromGlobe = o.has("fromX");

        // Flash e anel do pouso ficam no lugar final (fora do voo), como no CSS.
        flash = new View(activity);
        GradientDrawable fd = new GradientDrawable();
        fd.setShape(GradientDrawable.OVAL);
        fd.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        fd.setGradientRadius(ballPx * 0.55f);
        fd.setColors(new int[] {0xD9FFFBEA, (ringColor & 0x00FFFFFF) | 0x66000000, ringColor & 0x00FFFFFF});
        flash.setBackground(fd);
        flash.setAlpha(0f);
        layer.addView(flash, centered(Math.round(ballPx * 1.1f), cx, cy));

        flight = new FrameLayout(activity);
        ball = new ImageView(activity);
        ball.setImageBitmap(bmp);
        ball.setScaleType(ImageView.ScaleType.FIT_XY);
        flight.addView(ball, new FrameLayout.LayoutParams(size, size));

        number = new TextView(activity);
        number.setText(String.valueOf(o.getInt("n")));
        number.setGravity(Gravity.CENTER);
        number.setIncludeFontPadding(false);
        number.setTextColor(BallSurface.parseColor(o.optString("color", "#ffffff")));
        number.setTextSize(TypedValue.COMPLEX_UNIT_PX, ballPx * (float) o.optDouble("ratio", 0.4365));
        number.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
        number.setLetterSpacing(-0.06f);
        if ("light".equals(o.optString("shadow"))) {
            number.setShadowLayer(1f, 0f, k, 0xF2FFFFFF);
        } else {
            number.setShadowLayer(3f * k, 0f, 3f * k, 0x8C00081E);
        }
        flight.addView(number, new FrameLayout.LayoutParams(size, size));
        layer.addView(flight, centered(size, cx, cy));

        ring = new View(activity);
        GradientDrawable rd = new GradientDrawable();
        rd.setShape(GradientDrawable.OVAL);
        rd.setColor(Color.TRANSPARENT);
        rd.setStroke(Math.max(2, Math.round(3 * k)), ringColor);
        ring.setBackground(rd);
        ring.setAlpha(0f);
        layer.addView(ring, centered(Math.round(ballPx), cx, cy));

        layer.setVisibility(View.VISIBLE);

        String anim = o.optString("anim", "full");
        if ("still".equals(anim)) return;
        AnimatorSet set = new AnimatorSet();
        set.playTogether("simple".equals(anim) ? simple(k) : full(k));
        // Número numa camada pronta durante o voo: a sombra do texto não é refeita a
        // cada quadro (só a posição/escala/rotação mudam).
        final TextView num = number;
        num.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        set.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                num.setLayerType(View.LAYER_TYPE_NONE, null);
                hooks.animEnd();
            }
        });
        running = set;
        hooks.animStart();
        set.start();
    }

    /** Coreografia original (ballFlightPath, ballSpinRotate, stabilizeBallNumber,
     * impactFlash, impactRing, finalBallPulse no CSS). */
    private Animator[] full(float k) {
        Animator path = fromGlobe ? globePath(k) : ObjectAnimator.ofPropertyValuesHolder(flight,
                // Passa um pouco do centro no sentido do voo (vindo da direita, para a esquerda).
                track(View.TRANSLATION_X, fromX * k, (fromX < 0 ? 11 : -11) * k, (fromX < 0 ? -4 : 4) * k, 0),
                track(View.TRANSLATION_Y, fromY * k, 5 * k, -2 * k, 0),
                track(View.SCALE_X, 0.14f, 1.055f, 0.98f, 1f),
                track(View.SCALE_Y, 0.14f, 1.055f, 0.98f, 1f));
        path.setDuration(FLIGHT_MS);
        path.setInterpolator(new LinearInterpolator());

        ObjectAnimator fade = ObjectAnimator.ofFloat(flight, View.ALPHA, 0f, 1f);
        fade.setDuration(160);
        fade.setInterpolator(EASE_OUT);

        float rs = fromX < 0 ? 1 : -1; // vindo da direita gira no outro sentido (rolando)
        ObjectAnimator spin = ObjectAnimator.ofPropertyValuesHolder(ball, track(View.ROTATION, -720 * rs, -22 * rs, 6 * rs, 0));
        spin.setDuration(FLIGHT_MS);
        spin.setInterpolator(new LinearInterpolator());

        ObjectAnimator num = ObjectAnimator.ofPropertyValuesHolder(number,
                settle(View.ALPHA, 0f, 1f, 1f, null),
                settle(View.ROTATION, -360f, -8f, 0f, EASE_OUT),
                settle(View.SCALE_X, 0.72f, 1f, 1f, null),
                settle(View.SCALE_Y, 0.72f, 1f, 1f, null));
        num.setDuration(FLIGHT_MS);
        num.setInterpolator(new LinearInterpolator());

        ObjectAnimator fl = ObjectAnimator.ofPropertyValuesHolder(flash,
                PropertyValuesHolder.ofKeyframe(View.ALPHA,
                        Keyframe.ofFloat(0f, 0f), Keyframe.ofFloat(0.3f, 1f), Keyframe.ofFloat(1f, 0f)),
                PropertyValuesHolder.ofFloat(View.SCALE_X, 0.8f, 1.15f),
                PropertyValuesHolder.ofFloat(View.SCALE_Y, 0.8f, 1.15f));
        fl.setStartDelay(IMPACT_AT_MS);
        fl.setDuration(460);
        fl.setInterpolator(EASE_OUT);

        ObjectAnimator rg = ObjectAnimator.ofPropertyValuesHolder(ring,
                PropertyValuesHolder.ofKeyframe(View.ALPHA,
                        Keyframe.ofFloat(0f, 0f), Keyframe.ofFloat(0.25f, 0.95f), Keyframe.ofFloat(1f, 0f)),
                PropertyValuesHolder.ofFloat(View.SCALE_X, 0.72f, 1.36f),
                PropertyValuesHolder.ofFloat(View.SCALE_Y, 0.72f, 1.36f));
        rg.setStartDelay(IMPACT_AT_MS);
        rg.setDuration(440);
        rg.setInterpolator(EASE_OUT);

        ObjectAnimator pulse = ObjectAnimator.ofPropertyValuesHolder(ball,
                PropertyValuesHolder.ofKeyframe(View.SCALE_X,
                        Keyframe.ofFloat(0f, 1f), Keyframe.ofFloat(0.42f, 1.045f), Keyframe.ofFloat(1f, 1f)),
                PropertyValuesHolder.ofKeyframe(View.SCALE_Y,
                        Keyframe.ofFloat(0f, 1f), Keyframe.ofFloat(0.42f, 1.045f), Keyframe.ofFloat(1f, 1f)));
        pulse.setStartDelay(1180);
        pulse.setDuration(380);
        pulse.setInterpolator(EASE_OUT);

        return new Animator[] {path, fade, spin, num, fl, rg, pulse};
    }

    /** Entrada simples (painel, tecla 4): vem da esquerda, cresce e assenta. */
    private Animator[] simple(float k) {
        ObjectAnimator in = ObjectAnimator.ofPropertyValuesHolder(flight,
                PropertyValuesHolder.ofKeyframe(View.TRANSLATION_X,
                        Keyframe.ofFloat(0f, -460 * k), Keyframe.ofFloat(0.75f, 8 * k), Keyframe.ofFloat(1f, 0)),
                PropertyValuesHolder.ofKeyframe(View.TRANSLATION_Y,
                        Keyframe.ofFloat(0f, -40 * k), Keyframe.ofFloat(0.75f, 0), Keyframe.ofFloat(1f, 0)),
                PropertyValuesHolder.ofKeyframe(View.SCALE_X,
                        Keyframe.ofFloat(0f, 0.55f), Keyframe.ofFloat(0.75f, 1.04f), Keyframe.ofFloat(1f, 1f)),
                PropertyValuesHolder.ofKeyframe(View.SCALE_Y,
                        Keyframe.ofFloat(0f, 0.55f), Keyframe.ofFloat(0.75f, 1.04f), Keyframe.ofFloat(1f, 1f)),
                PropertyValuesHolder.ofKeyframe(View.ALPHA,
                        Keyframe.ofFloat(0f, 0f), Keyframe.ofFloat(0.15f, 1f), Keyframe.ofFloat(1f, 1f)));
        in.setDuration(600);
        in.setInterpolator(SIMPLE_EASE);
        return new Animator[] {in};
    }

    /** Quadros-chave 0 / 76% / 88% / 100% com a curva de cada trecho do CSS
     * (no Android a curva vai no quadro-chave de CHEGADA do trecho). */
    private static PropertyValuesHolder track(Property<View, Float> prop, float v0, float v1, float v2, float v3) {
        Keyframe k0 = Keyframe.ofFloat(0f, v0);
        Keyframe k1 = Keyframe.ofFloat(0.76f, v1);
        k1.setInterpolator(FLIGHT_EASE);
        Keyframe k2 = Keyframe.ofFloat(0.88f, v2);
        k2.setInterpolator(EASE_IN_OUT);
        Keyframe k3 = Keyframe.ofFloat(1f, v3);
        k3.setInterpolator(EASE_OUT);
        return PropertyValuesHolder.ofKeyframe(prop, k0, k1, k2, k3);
    }

    /**
     * Saindo da base do globo: a bola anda sobre UMA curva lisa (Bézier quadrática que
     * desce e sobe até o centro), com UMA só aceleração (rápida no globo, desacelerando
     * até pousar aos 76%). Sem pontos de passagem, não há mudança brusca de velocidade.
     * Depois do pouso só o tamanho assenta (1,055 → 0,98 → 1).
     */
    private ValueAnimator globePath(final float k) {
        final float x0 = fromX * k, y0 = fromY * k;
        final float cx = x0 * 0.55f, cy = (Math.max(fromY, 0) + 130) * k; // curva para baixo
        ValueAnimator a = ValueAnimator.ofFloat(0f, 1f);
        a.setDuration(FLIGHT_MS);
        a.setInterpolator(new LinearInterpolator());
        a.addUpdateListener(an -> {
            float p = an.getAnimatedFraction();
            float x = 0, y = 0, sc;
            if (p < 0.76f) {
                float u = FLIGHT_EASE.getInterpolation(p / 0.76f), v = 1 - u;
                x = v * v * x0 + 2 * v * u * cx;
                y = v * v * y0 + 2 * v * u * cy;
                sc = 0.14f + (1.055f - 0.14f) * u;
            } else if (p < 0.88f) {
                sc = 1.055f + (0.98f - 1.055f) * EASE_IN_OUT.getInterpolation((p - 0.76f) / 0.12f);
            } else {
                sc = 0.98f + (1f - 0.98f) * EASE_OUT.getInterpolation((p - 0.88f) / 0.12f);
            }
            flight.setTranslationX(x);
            flight.setTranslationY(y);
            flight.setScaleX(sc);
            flight.setScaleY(sc);
        });
        return a;
    }

    /** (antigo) Saindo do globo: sobe (desacelera até o alto aos 34%), desce em curva até o
     * centro (76%) e assenta. Curva própria do eixo vertical: arco suave, sem tranco. */
    private static PropertyValuesHolder arcY(float y0, float k) {
        Keyframe a0 = Keyframe.ofFloat(0f, y0);
        Keyframe a1 = Keyframe.ofFloat(0.34f, y0 - 86 * k);
        a1.setInterpolator(EASE_OUT);
        Keyframe a2 = Keyframe.ofFloat(0.76f, 5 * k);
        a2.setInterpolator(EASE_IN_OUT);
        Keyframe a3 = Keyframe.ofFloat(0.88f, -2 * k);
        a3.setInterpolator(EASE_IN_OUT);
        Keyframe a4 = Keyframe.ofFloat(1f, 0);
        a4.setInterpolator(EASE_OUT);
        return PropertyValuesHolder.ofKeyframe(View.TRANSLATION_Y, a0, a1, a2, a3, a4);
    }

    /** Número: assenta aos 78% (curva do voo) e depois termina com `tail`. */
    private static PropertyValuesHolder settle(Property<View, Float> prop, float v0, float v1, float v2, TimeInterpolator tail) {
        Keyframe k0 = Keyframe.ofFloat(0f, v0);
        Keyframe k1 = Keyframe.ofFloat(0.78f, v1);
        k1.setInterpolator(FLIGHT_EASE);
        Keyframe k2 = Keyframe.ofFloat(1f, v2);
        if (tail != null) k2.setInterpolator(tail);
        return PropertyValuesHolder.ofKeyframe(prop, k0, k1, k2);
    }

    private static FrameLayout.LayoutParams centered(int size, float cx, float cy) {
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(size, size, Gravity.TOP | Gravity.START);
        lp.leftMargin = Math.round(cx - size / 2f);
        lp.topMargin = Math.round(cy - size / 2f);
        return lp;
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

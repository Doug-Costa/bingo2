package com.bingoshow.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.os.HandlerThread;
import android.view.FrameMetrics;
import android.view.Window;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** Tela única: um WebView em tela cheia com recuperação automática de falhas. */
public class MainActivity extends Activity {

    private static final int BACKGROUND = 0xFF060A14;
    private static final long RETRY_MS = 5_000;
    private static final long WATCHDOG_TICK_MS = 15_000;
    /** A página envia sinal de vida a cada 10s; sem ele por 60s, está travada. */
    private static final long HANG_LIMIT_MS = 60_000;
    /** O teclado só abre logo após um OK físico, nunca pelo "concluir" do próprio teclado. */
    private static final long OK_TO_KEYBOARD_MS = 800;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable retry = this::retryLoad;
    private final Runnable watchdog = this::checkHang;

    private FrameLayout root;
    private TextView overlay;
    private WebView web;
    private BallRenderer ballOverlay;
    /** Globo animado (Loteria'i), entre o WebView e a bola. */
    private GlobeOverlay globeOverlay;
    /** "surface" (Modo 1), "view" (Modo 2, padrão) ou "viewhw" (Modo 3: Modo 2 com a
     * página congelada em camada durante o voo) — menu Voltar → Animação da bola. */
    private String ballEngine;

    // Medição dos quadros da janela durante o voo da bola (FrameMetrics, Android 7+).
    private final Object frameLock = new Object();
    private boolean measuringFrames;
    private int fFrames, fOver17, fOver34;
    private long fSum, fMax, fMaxDraw, fMaxSync, fMaxIssue, fMaxSwap;
    private volatile String lastBallStats = "{}";
    private HandlerThread frameThread;
    private String remoteScript;
    private String lastGoodUrl = BuildConfig.TV_URL;
    private boolean loadFailed;
    private boolean resumed;
    private AlertDialog menu;
    private Updater updater;
    private String pendingUpdate;
    private boolean awaitingInstallPermission;
    private volatile long lastBeat;
    /** Renderer do WebView que morreu nesta sessão: crash ou morto pelo sistema (memória). */
    private volatile int renderCrashes, renderKills;
    private volatile long lastRenderGoneAt;
    private volatile long lastHardwareOk;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        remoteScript = readAsset("tv-remote.js");

        root = new FrameLayout(this);
        root.setBackgroundColor(BACKGROUND);
        overlay = new TextView(this);
        overlay.setBackgroundColor(BACKGROUND);
        overlay.setTextColor(Color.WHITE);
        overlay.setTextSize(22);
        overlay.setGravity(Gravity.CENTER);
        overlay.setPadding(80, 40, 80, 40);
        setContentView(root);

        createWebView();
        ballEngine = getSharedPreferences("tv", MODE_PRIVATE).getString("ball_engine", "view");
        ballOverlay = createBall();
        globeOverlay = new GlobeOverlay(this, root);
        startFrameMetrics();
        showOverlay("Carregando Bingo Show…");
        web.loadUrl(BuildConfig.TV_URL);

        updater = new Updater(this, versionName -> {
            pendingUpdate = versionName;
            if (resumed) showUpdateDialog();
        });
        updater.start();
    }

    private void showUpdateDialog() {
        String versionName = pendingUpdate;
        pendingUpdate = null;
        AlertDialog dialog = new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK)
                .setTitle("Nova versão disponível")
                .setMessage("A versão " + versionName + " do Bingo Show TV já foi baixada.")
                .setPositiveButton("Atualizar agora", (d, which) -> installUpdate())
                .setNegativeButton("Depois", null)
                .setOnDismissListener(d -> {
                    enterImmersive();
                    web.requestFocus();
                })
                .show();
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).requestFocus();
    }

    private void installUpdate() {
        if (updater.canInstall()) {
            if (!updater.install()) {
                showNotice("Esta TV não abriu o instalador. Instale a nova versão manualmente.");
            }
            return;
        }
        awaitingInstallPermission = true;
        try {
            startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getPackageName())));
        } catch (ActivityNotFoundException e) {
            showNotice("Nas configurações da TV, permita que o Bingo Show TV instale aplicativos"
                    + " (fontes desconhecidas) e abra o app de novo.");
        }
    }

    @SuppressWarnings("deprecation")
    private void showNotice(String message) {
        new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private void createWebView() {
        web = new WebView(this);
        web.setBackgroundColor(BACKGROUND);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // PIN e tema ficam no localStorage
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); // locução do sorteio sem clique
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100); // ignora a escala de fonte do sistema: o palco é 1920×1080
        s.setAllowFileAccess(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        // A tela do PIN aceita backend http:// na rede local.
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }
        // Sempre ligado (não só em DEBUG): única forma de pegar um profile de
        // performance real da TV via chrome://inspect com um cabo USB/ADB.
        // Exige acesso físico/ADB ao aparelho — não é uma porta de rede exposta.
        WebView.setWebContentsDebuggingEnabled(true);

        web.addJavascriptInterface(new Bridge(), "TvBridge");
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public Bitmap getDefaultVideoPoster() {
                // Sem isso, vídeos mostram um ícone cinza de play antes de começar.
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
            }
        });
        web.setWebViewClient(new Client());

        root.addView(web, 0, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        web.requestFocus();
        lastBeat = SystemClock.uptimeMillis();
    }

    /** Descarta o WebView (renderer morto ou travado) e reabre na última página boa. */
    private void recreateWebView() {
        handler.removeCallbacks(retry);
        if (web != null) {
            root.removeView(web);
            web.destroy();
        }
        if (ballOverlay != null) ballOverlay.hide();
        if (globeOverlay != null) globeOverlay.hide();
        createWebView();
        showOverlay("Reconectando…");
        loadFailed = false;
        web.loadUrl(lastGoodUrl);
    }

    private BallRenderer createBall() {
        if ("surface".equals(ballEngine)) return new BallSurface(this, root);
        return new BallViews(this, root, new BallViews.Hooks() {
            @Override
            public void animStart() {
                synchronized (frameLock) {
                    fFrames = fOver17 = fOver34 = 0;
                    fSum = fMax = fMaxDraw = fMaxSync = fMaxIssue = fMaxSwap = 0;
                    measuringFrames = true;
                }
                // Modo 3: a página vira uma imagem pronta durante o voo; cada quadro só
                // compõe essa imagem + a bola, sem redesenhar o WebView.
                if ("viewhw".equals(ballEngine)) web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            }

            @Override
            public void animEnd() {
                if ("viewhw".equals(ballEngine)) web.setLayerType(View.LAYER_TYPE_NONE, null);
                synchronized (frameLock) {
                    measuringFrames = false;
                    long avg = fFrames > 0 ? fSum / fFrames : 0;
                    lastBallStats = "{\"engine\":\"" + ballEngine + "\",\"frames\":" + fFrames
                            + ",\"avg\":" + avg + ",\"max\":" + fMax + ",\"over17\":" + fOver17
                            + ",\"over34\":" + fOver34 + ",\"draw\":" + fMaxDraw + ",\"sync\":" + fMaxSync
                            + ",\"issue\":" + fMaxIssue + ",\"swap\":" + fMaxSwap + "}";
                }
            }
        });
    }

    /** Mede cada quadro da janela (ms): total e as etapas que mais pesam. */
    private void startFrameMetrics() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return;
        frameThread = new HandlerThread("frame-metrics");
        frameThread.start();
        getWindow().addOnFrameMetricsAvailableListener(new Window.OnFrameMetricsAvailableListener() {
            @Override
            public void onFrameMetricsAvailable(Window window, FrameMetrics m, int dropCount) {
                synchronized (frameLock) {
                    if (!measuringFrames) return;
                    long total = m.getMetric(FrameMetrics.TOTAL_DURATION) / 1_000_000;
                    fFrames++;
                    fSum += total;
                    if (total > fMax) fMax = total;
                    if (total > 17) fOver17++;
                    if (total > 34) fOver34++;
                    fMaxDraw = Math.max(fMaxDraw, m.getMetric(FrameMetrics.DRAW_DURATION) / 1_000_000);
                    fMaxSync = Math.max(fMaxSync, m.getMetric(FrameMetrics.SYNC_DURATION) / 1_000_000);
                    fMaxIssue = Math.max(fMaxIssue, m.getMetric(FrameMetrics.COMMAND_ISSUE_DURATION) / 1_000_000);
                    fMaxSwap = Math.max(fMaxSwap, m.getMetric(FrameMetrics.SWAP_BUFFERS_DURATION) / 1_000_000);
                }
            }
        }, new Handler(frameThread.getLooper()));
    }

    private String ballMenuLabel() {
        String mode = "surface".equals(ballEngine) ? "Modo 1" : "viewhw".equals(ballEngine) ? "Modo 3" : "Modo 2";
        return "Animação da bola: " + mode;
    }

    /** Troca o modo da bola (1 → 2 → 3 → 1), guarda a escolha e recarrega a página. */
    private void toggleBallEngine() {
        ballEngine = "surface".equals(ballEngine) ? "view" : "view".equals(ballEngine) ? "viewhw" : "surface";
        getSharedPreferences("tv", MODE_PRIVATE).edit().putString("ball_engine", ballEngine).apply();
        ballOverlay.release();
        ballOverlay = createBall();
        Toast.makeText(this, ballMenuLabel(), Toast.LENGTH_LONG).show();
        retryLoad();
    }

    private void showOverlay(String message) {
        overlay.setText(message);
        if (overlay.getParent() == null) root.addView(overlay);
    }

    private void hideOverlay() {
        if (overlay.getParent() != null) root.removeView(overlay);
    }

    private void onLoadError(String message) {
        loadFailed = true;
        showOverlay(message + "\n\nTentando novamente automaticamente…\nPressione OK para tentar agora.");
        handler.removeCallbacks(retry);
        handler.postDelayed(retry, RETRY_MS);
    }

    private void retryLoad() {
        handler.removeCallbacks(retry);
        loadFailed = false;
        lastBeat = SystemClock.uptimeMillis();
        web.loadUrl(lastGoodUrl);
    }

    private void checkHang() {
        handler.removeCallbacks(watchdog);
        if (!resumed) return;
        boolean silent = SystemClock.uptimeMillis() - lastBeat > HANG_LIMIT_MS;
        if (silent && !loadFailed) recreateWebView();
        handler.postDelayed(watchdog, WATCHDOG_TICK_MS);
    }

    private boolean isAppUrl(Uri url) {
        String scheme = url.getScheme();
        if (!"http".equals(scheme) && !"https".equals(scheme)) return true;
        String host = url.getHost();
        return host != null && host.equalsIgnoreCase(Uri.parse(BuildConfig.TV_URL).getHost());
    }

    private void inject() {
        web.evaluateJavascript(remoteScript, null);
    }

    private final class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return request.isForMainFrame() && !isAppUrl(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !isAppUrl(Uri.parse(url));
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            lastBeat = SystemClock.uptimeMillis();
            if (ballOverlay != null) ballOverlay.hide(); // página nova: a bola volta só quando ela pedir
            if (globeOverlay != null) globeOverlay.hide();
        }

        @Override
        public void onPageCommitVisible(WebView view, String url) {
            if (!loadFailed) {
                hideOverlay();
                inject();
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (loadFailed) return;
            lastGoodUrl = url;
            hideOverlay();
            inject(); // Android 5: não existe onPageCommitVisible. O script ignora repetição.
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) onLoadError("Sem conexão com o Bingo Show.");
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int code, String description, String failingUrl) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) onLoadError("Sem conexão com o Bingo Show.");
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame() && response.getStatusCode() >= 500) {
                onLoadError("O servidor do Bingo Show está indisponível.");
            }
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler sslHandler, SslError error) {
            sslHandler.cancel();
            if (error.getUrl() != null && isAppUrl(Uri.parse(error.getUrl()))) {
                onLoadError("Falha no certificado de segurança.\nVerifique a data e a hora da TV.");
            }
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            // Falta de memória ou crash do renderer: sem tratar, o app inteiro fecha.
            // Conta para o medidor da página (tela preta + recarga = renderer morto).
            boolean crashed = Build.VERSION.SDK_INT >= 26 && detail != null && detail.didCrash();
            if (crashed) renderCrashes++;
            else renderKills++;
            lastRenderGoneAt = System.currentTimeMillis();
            handler.post(MainActivity.this::recreateWebView);
            return true;
        }
    }

    /** Chamado pelo tv-remote.js, em uma thread que não é a principal. */
    public final class Bridge {
        @JavascriptInterface
        public void beat() {
            lastBeat = SystemClock.uptimeMillis();
        }

        /** Bola nativa (BallOverlay): a página só manda número e posição. */
        @JavascriptInterface
        public boolean ballSupported() {
            return true;
        }

        /** "view" (Modo 2) ou "surface" (Modo 1): o site só segura a página no voo no Modo 2. */
        @JavascriptInterface
        public String ballEngine() {
            return ballEngine;
        }

        /** Quadros do último voo (FrameMetrics), para o painel/medidor do site. */
        @JavascriptInterface
        public String ballStats() {
            return lastBallStats;
        }

        @JavascriptInterface
        public void ballPreload(String url) {
            runOnUiThread(() -> ballOverlay.preload(url));
        }

        @JavascriptInterface
        public void ballShow(String json) {
            runOnUiThread(() -> ballOverlay.show(json));
        }

        @JavascriptInterface
        public void ballHide() {
            runOnUiThread(() -> ballOverlay.hide());
        }

        /** Globo animado (GlobeOverlay): url + retângulo em px físicos. */
        @JavascriptInterface
        public void globeShow(String json) {
            runOnUiThread(() -> globeOverlay.show(json));
        }

        @JavascriptInterface
        public void globeHide() {
            runOnUiThread(() -> globeOverlay.hide());
        }

        /** Quantas vezes a página morreu (tela preta + recarga) desde que o app abriu. */
        @JavascriptInterface
        public String renderGone() {
            return "{\"crash\":" + renderCrashes + ",\"killed\":" + renderKills + ",\"at\":" + lastRenderGoneAt + "}";
        }

        /** Estado do globo nativo para a página: idle, loading, ok ou fail. */
        @JavascriptInterface
        public String globeState() {
            return globeOverlay != null ? globeOverlay.state() : "fail";
        }

        /** Devolve false se o Enter veio do teclado da TV, e não do OK do controle. */
        @JavascriptInterface
        public boolean showKeyboard() {
            if (SystemClock.uptimeMillis() - lastHardwareOk > OK_TO_KEYBOARD_MS) return false;
            runOnUiThread(() -> {
                InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                web.requestFocus();
                imm.showSoftInput(web, 0);
            });
            return true;
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (code == KeyEvent.KEYCODE_BACK || code == KeyEvent.KEYCODE_MENU) {
            if (event.getAction() == KeyEvent.ACTION_UP) showMenu();
            return true;
        }
        boolean ok = code == KeyEvent.KEYCODE_DPAD_CENTER
                || code == KeyEvent.KEYCODE_ENTER
                || code == KeyEvent.KEYCODE_NUMPAD_ENTER;
        if (ok && event.getAction() == KeyEvent.ACTION_DOWN) {
            lastHardwareOk = SystemClock.uptimeMillis();
            if (loadFailed) {
                retryLoad();
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @SuppressWarnings("deprecation")
    private void showMenu() {
        if (menu != null && menu.isShowing()) return;
        String[] items = {"Continuar", "Recarregar", "Trocar PIN / servidor", ballMenuLabel(), "Sair do aplicativo"};
        menu = new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK)
                .setTitle("Bingo Show TV")
                .setItems(items, (dialog, which) -> {
                    if (which == 1) {
                        retryLoad();
                    } else if (which == 2) {
                        lastGoodUrl = configUrl();
                        retryLoad();
                    } else if (which == 3) {
                        toggleBallEngine();
                    } else if (which == 4) {
                        finish();
                    }
                })
                .setOnDismissListener(dialog -> {
                    enterImmersive();
                    web.requestFocus();
                })
                .show();
    }

    private String configUrl() {
        return Uri.parse(BuildConfig.TV_URL).buildUpon().path("/config").build().toString();
    }

    @SuppressWarnings("deprecation")
    private void enterImmersive() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersive();
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        web.onResume();
        lastBeat = SystemClock.uptimeMillis();
        handler.postDelayed(watchdog, WATCHDOG_TICK_MS);

        if (awaitingInstallPermission) {
            // Voltou da tela de permissão: se liberou, segue direto para a instalação.
            awaitingInstallPermission = false;
            if (updater.canInstall()) installUpdate();
        } else if (pendingUpdate != null) {
            showUpdateDialog();
        }
    }

    @Override
    protected void onPause() {
        resumed = false;
        handler.removeCallbacks(watchdog);
        web.onPause(); // para o áudio quando a TV troca de app
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        updater.stop();
        ballOverlay.release();
        globeOverlay.release();
        if (frameThread != null) frameThread.quitSafely();
        root.removeView(web);
        web.destroy();
        super.onDestroy();
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Asset ausente: " + name, e);
        }
    }
}

package com.bingoshow.tv;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Procura versão nova no version.json publicado pelo deploy.sh e baixa o APK em
 * segundo plano. Só avisa depois que o arquivo está completo e com o hash certo.
 */
final class Updater {

    interface Listener {
        void onUpdateReady(String versionName);
    }

    static final String APK_NAME = "update.apk";
    private static final String APK_MIME = "application/vnd.android.package-archive";
    private static final long FIRST_CHECK_MS = 20_000;
    private static final long CHECK_EVERY_MS = 6 * 60 * 60 * 1000;
    private static final long RETRY_AFTER_FAILURE_MS = 15 * 60 * 1000;
    private static final int CONNECT_TIMEOUT_MS = 15_000;
    private static final int READ_TIMEOUT_MS = 30_000;

    private final Context context;
    private final Listener listener;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable check = this::checkInBackground;

    Updater(Context context, Listener listener) {
        this.context = context;
        this.listener = listener;
    }

    void start() {
        if (!BuildConfig.UPDATE_URL.isEmpty()) handler.postDelayed(check, FIRST_CHECK_MS);
    }

    void stop() {
        handler.removeCallbacksAndMessages(null);
    }

    private void checkInBackground() {
        new Thread(() -> {
            // Prioridade baixa para o download não disputar CPU com a animação do jogo.
            Process.setThreadPriority(Process.THREAD_PRIORITY_BACKGROUND);
            long next = CHECK_EVERY_MS;
            try {
                checkAndDownload();
            } catch (Exception e) {
                next = RETRY_AFTER_FAILURE_MS;
            }
            handler.postDelayed(check, next);
        }, "updater").start();
    }

    private void checkAndDownload() throws IOException, org.json.JSONException, NoSuchAlgorithmException {
        // O parâmetro evita receber um version.json antigo de algum cache.
        String url = BuildConfig.UPDATE_URL + "?t=" + System.currentTimeMillis();
        JSONObject info = new JSONObject(readText(url));
        File apk = apkFile();

        if (info.getInt("versionCode") <= BuildConfig.VERSION_CODE) {
            apk.delete(); // sobra da atualização já instalada
            return;
        }

        String apkUrl = info.getString("apkUrl");
        if (!apkUrl.startsWith("https://")) throw new IOException("APK fora de https");
        String sha256 = info.getString("sha256");
        if (!apk.exists() || !sha256.equalsIgnoreCase(sha256Of(apk))) {
            download(apkUrl, apk, sha256);
        }
        String versionName = info.getString("versionName");
        handler.post(() -> listener.onUpdateReady(versionName));
    }

    private static HttpURLConnection open(String url) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(CONNECT_TIMEOUT_MS);
        c.setReadTimeout(READ_TIMEOUT_MS);
        c.setUseCaches(false);
        if (c.getResponseCode() != HttpURLConnection.HTTP_OK) {
            c.disconnect();
            throw new IOException("HTTP " + c.getResponseCode());
        }
        return c;
    }

    private static String readText(String url) throws IOException {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            copy(in, out);
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        } finally {
            c.disconnect();
        }
    }

    private void download(String url, File target, String sha256) throws IOException, NoSuchAlgorithmException {
        File partial = new File(target.getParentFile(), APK_NAME + ".part");
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(partial)) {
            copy(in, out);
        } finally {
            c.disconnect();
        }
        if (!sha256.equalsIgnoreCase(sha256Of(partial))) {
            partial.delete();
            throw new IOException("APK corrompido");
        }
        if (!partial.renameTo(target)) throw new IOException("Falha ao salvar o APK");
    }

    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[16 * 1024];
        int n;
        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
    }

    private static String sha256Of(File file) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(file)) {
            byte[] buf = new byte[16 * 1024];
            int n;
            while ((n = in.read(buf)) != -1) digest.update(buf, 0, n);
        }
        StringBuilder hex = new StringBuilder();
        for (byte b : digest.digest()) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    /** Android 8+ exige que o usuário libere este app como fonte de instalação. */
    boolean canInstall() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                || context.getPackageManager().canRequestPackageInstalls();
    }

    /** Abre a tela de instalação do Android. Devolve false se o aparelho não tiver uma. */
    boolean install() {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            intent.setDataAndType(ApkProvider.URI, APK_MIME);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            intent.setDataAndType(Uri.fromFile(apkFile()), APK_MIME);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
            return true;
        } catch (android.content.ActivityNotFoundException e) {
            return false;
        }
    }

    /** Até o Android 6 o instalador só lê file://, e não enxerga o cache interno. */
    private File apkFile() {
        File dir = Build.VERSION.SDK_INT < Build.VERSION_CODES.N ? context.getExternalCacheDir() : null;
        return new File(dir != null ? dir : context.getCacheDir(), APK_NAME);
    }
}

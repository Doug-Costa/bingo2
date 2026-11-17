package com.bingoshow.tv;

/**
 * Bola nativa do sorteio (por cima do WebView). Dois modos, escolhidos no menu do
 * controle (Voltar → "Animação da bola"):
 * - "view" (Modo 2, padrão): views dentro da tela do app — BallViews;
 * - "surface" (Modo 1): superfície própria — BallSurface (APK 1.0.10).
 * A página chama TvBridge.ballPreload/ballShow/ballHide (src/lib/nativeBall.ts).
 */
interface BallRenderer {
    void preload(String url);

    void show(String json);

    void hide();

    /** Para tudo e tira a bola da tela (troca de modo / app fechando). */
    void release();
}

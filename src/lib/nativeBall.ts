/**
 * Bola nativa — no APK (1.0.9+) o Android anima a bola do sorteio por cima do
 * WebView (android-tv/.../BallOverlay.java). Nas TVs fracas (Mali-450 + Chrome 91)
 * a animação feita pela página rodava a ~10 FPS; a nativa roda liso.
 *
 * A página só informa número e posição; a imagem da bola é a do próprio site,
 * gerada por `scripts/capture-ball.js` em `public/ball-sprites/`.
 * Sem a ponte (navegador, APK antigo), nada muda: a bola continua sendo da página.
 */

interface BallBridge {
  /** APK 1.0.11+: "surface" (Modo 1), "view" (Modo 2) ou "viewhw" (Modo 3). Sem ele: "surface". */
  ballEngine?(): string;
  ballSupported(): boolean;
  ballPreload(url: string): void;
  ballShow(json: string): void;
  ballHide(): void;
  /** APK 1.0.12+: globo animado pelo Android (Loteria'i). */
  globeShow?(json: string): void;
  globeHide?(): void;
  /** APK 1.0.16+: "idle" | "loading" | "ok" | "fail" do último globeShow. */
  globeState?(): string;
}

interface BallSkin {
  sprite: string;
  /** fração da largura da imagem ocupada pela bola */
  frac: number;
  color: string;
  /** tamanho do número / diâmetro da bola */
  ratio: number;
  /** sombra do número: clara (número escuro) ou escura (número claro) */
  shadow: 'light' | 'dark';
  ring: string;
}

// Valores medidos por scripts/capture-ball.js (public/ball-sprites/meta.json).
const SKINS: Record<string, BallSkin> = {
  loteriai: { sprite: '/ball-sprites/loteriai.png', frac: 0.6774, color: 'rgb(8, 36, 92)', ratio: 0.4365, shadow: 'light', ring: 'rgba(255, 226, 120, 0.95)' },
  'bingo-show-paraguay': { sprite: '/ball-sprites/bingo-show-paraguay.png', frac: 0.6774, color: 'rgb(255, 255, 255)', ratio: 0.4365, shadow: 'dark', ring: 'rgba(255, 226, 120, 0.95)' },
  'bingo-show-blue': { sprite: '/ball-sprites/bingo-show-blue.png', frac: 0.6774, color: 'rgb(255, 255, 255)', ratio: 0.4365, shadow: 'dark', ring: 'rgba(154, 237, 255, 0.92)' },
};

export interface NativeBall {
  bridge: BallBridge;
  skin: BallSkin;
  spriteUrl: string;
}

export function nativeBallFor(themeId: string): NativeBall | null {
  if (typeof window === 'undefined') return null;
  const skin = SKINS[themeId];
  const bridge = (window as unknown as { TvBridge?: Partial<BallBridge> }).TvBridge;
  if (!skin || !bridge || typeof bridge.ballShow !== 'function' || typeof bridge.ballSupported !== 'function') return null;
  try {
    if (!bridge.ballSupported()) return null;
    if (localStorage.getItem('tv_nativeball') === '0') return null;
  } catch {
    return null;
  }
  return { bridge: bridge as BallBridge, skin, spriteUrl: `${location.origin}${skin.sprite}` };
}

/** Mostra a bola nativa no centro do palco. `anim`: full (coreografia), simple ou still. */
export function showNativeBall(
  nb: NativeBall,
  stage: HTMLElement,
  n: number,
  anim: 'full' | 'simple' | 'still',
  /** De onde a bola nasce (px do palco, relativo ao centro). Padrão do APK: -390, -90. */
  from?: { x: number; y: number },
): void {
  const r = stage.getBoundingClientRect();
  const k = stage.offsetWidth > 0 ? r.width / stage.offsetWidth : 1; // escala do TvStage
  const ballCss = parseFloat(getComputedStyle(stage).getPropertyValue('--ball')) || 252;
  const dpr = window.devicePixelRatio || 1;
  nb.bridge.ballShow(
    JSON.stringify({
      n,
      cx: (r.left + r.width / 2) * dpr,
      cy: (r.top + r.height / 2) * dpr,
      ball: ballCss * k * dpr,
      sprite: nb.spriteUrl,
      frac: nb.skin.frac,
      color: nb.skin.color,
      ratio: nb.skin.ratio,
      shadow: nb.skin.shadow,
      ring: nb.skin.ring,
      anim,
      ...(from ? { fromX: from.x, fromY: from.y } : {}),
    }),
  );
}

/**
 * Bola nova direto para o Android, sem esperar o React: o SSE chama
 * `nativeBallNow(n)` na hora em que o `new_ball` chega, e a página processa os
 * eventos `NATIVE_HOLD_MS` depois (ver SSEContext) — com a bola já pousada, o
 * trabalho da página (histórico, prêmios, cupons) não disputa a TV com o voo.
 * O DrawStage registra o handler enquanto a bola nativa está ativa.
 */
// Só no Modo 2 do APK ("view"). No Modo 1 ("surface", APK 1.0.10) nesta TV
// (HiSilicon) a superfície da bola só é atualizada na tela junto com a página —
// com a página parada a bola perdia a entrada; lá a espera fica desligada.
export const NATIVE_HOLD_MS = 1600;
let nowHandler: ((n: number) => void) | null = null;
let holdForEngine = 0;

export function setNativeBallNow(fn: ((n: number) => void) | null, engine = 'surface'): void {
  nowHandler = fn;
  holdForEngine = fn && (engine === 'view' || engine === 'viewhw') ? NATIVE_HOLD_MS : 0;
}

/** Espera a aplicar nos eventos da página (0 = processa na hora). */
export function nativeBallHoldMs(): number {
  return nowHandler ? holdForEngine : 0;
}

/** Modo da bola no APK ("surface" quando o APK não informa). */
export function nativeBallEngine(nb: NativeBall): string {
  try {
    return typeof nb.bridge.ballEngine === 'function' ? nb.bridge.ballEngine() : 'surface';
  } catch {
    return 'surface';
  }
}

export function nativeBallNow(n: number): void {
  nowHandler?.(n);
}

/** Globo animado do Loteria'i (WebP animado; no APK quem anima é o Android). */
export const GLOBE_ANIMATED = '/themes/loteriai/sm/decorative/globo-animado.webp';
export const GLOBE_STATIC = '/themes/loteriai/sm/decorative/globo-estatico.webp';
/** Mesma animação em "sprite sheet" (imagem comum com os 150 quadros, 128×103 cada,
 * 15 por linha, 60 ms) — o APK 1.0.17+ anima recortando quadros, como a bola.
 * Gerado a partir do globo-animado.webp (WebCodecs ImageDecoder no Chrome). */
export const GLOBE_SHEET = { url: '/themes/loteriai/sm/decorative/globo-quadros.webp', frames: 150, cols: 15, w: 128, h: 103, ms: 60 };

export function hasNativeGlobe(nb: NativeBall): boolean {
  return typeof nb.bridge.globeShow === 'function' && typeof nb.bridge.globeHide === 'function';
}

/** Mostra o globo nativo exatamente sobre o espaço reservado na página. */
export function showNativeGlobe(nb: NativeBall, el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  nb.bridge.globeShow?.(
    JSON.stringify({
      url: `${location.origin}${GLOBE_ANIMATED}`,
      sheet: { ...GLOBE_SHEET, url: `${location.origin}${GLOBE_SHEET.url}` },
      x: r.left * dpr,
      y: r.top * dpr,
      w: r.width * dpr,
      h: r.height * dpr,
    }),
  );
}

/** Estado do globo nativo (APK 1.0.16+); null quando o APK não informa. */
export function nativeGlobeState(nb: NativeBall): string | null {
  try {
    return typeof nb.bridge.globeState === 'function' ? String(nb.bridge.globeState()) : null;
  } catch {
    return null;
  }
}

/** Diagnóstico para o medidor da TV ([TV-PERF] globe=...). */
export function setGlobeStatus(status: string): void {
  if (typeof window !== 'undefined') (window as unknown as { __tvGlobe?: string }).__tvGlobe = status;
}

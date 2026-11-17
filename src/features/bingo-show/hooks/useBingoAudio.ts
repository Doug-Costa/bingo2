import { useEffect, useRef } from 'react';

/**
 * Locução do bingo (voz das bolas e dos prêmios) com UMA fila de áudio:
 *
 * - Um som por vez, na ordem em que os eventos chegam — a voz do prêmio entra
 *   depois da voz da bola que fechou a linha, e a bola seguinte espera o prêmio
 *   terminar (antes as vozes tocavam por cima umas das outras).
 * - Voz de bola "mais recente vence": se chegarem várias bolas de uma vez
 *   (reconexão), só a última é falada; bolas antigas ainda não faladas saem da fila.
 * - Voz de prêmio toca quando o POPUP daquela faixa abre (não quando o evento
 *   chega): se o bingo sai com o popup da 2ª linha ainda no ar, a voz do bingo
 *   espera o popup dele. Nunca é descartada; cada faixa (1ª linha, 2ª linha,
 *   bingo) é anunciada uma única vez por sorteio.
 * - Reload/reconexão: enquanto o estado está sendo restaurado (`isLive` false) nada
 *   toca; a bola atual é marcada como falada e prêmios restaurados não abrem
 *   popup — a TV não repete o que já tinha falado.
 * - Só bolas 1–90 (sem o "0.mp3" inexistente do início da rodada).
 * - Idioma da voz pelo tema: português (padrão) em /audio/pt-br/, Paraguay em
 *   /audio/es/, com os mesmos nomes de arquivo. Arquivo que não existir cai para a
 *   voz antiga em /audio/pt/ e fica marcado para não ser tentado de novo.
 * - Sincronia: a voz da bola espera `voiceDelayMs` (tempo do voo da bola na tela) e
 *   sai quando a bola pousa. As vozes ficam em memória, então tocam sem depender da
 *   rede; a que ainda não carregou toca direto da URL.
 */

type Clip = { kind: 'ball' | 'prize'; src: string; fallback?: string; notBefore?: number };
export type VoiceLang = 'pt' | 'es';

const MAX_SOUND_MS = 6000; // proteção caso 'ended' nunca dispare
/** Ultra leve: pouso da bola — 1000ms na coreografia original (ballFlightPath, 76%
 * de 1320ms); 450ms na entrada simples (html.tv-noanim → ultraBallIn). */
const ultraBallLandMs = () => (document.documentElement.classList.contains('tv-noanim') ? 450 : 1000);

let queue: Clip[] = [];
let playing = false;
// Um único player: criar um por bola faz a TV preparar o decodificador toda vez.
let player: HTMLAudioElement | null = null;
let endCurrent: (() => void) | null = null;
let waitTimer: ReturnType<typeof setTimeout> | undefined;
const missing = new Set<string>(); // arquivos que não existem (não tentar de novo)
const voiceBlobs = new Map<string, string>(); // URL do arquivo → blob: em memória
let blobsUsable = true; // WebView antigo pode não tocar blob:; aí usa a URL
let preloadRun = 0;
let stallHooked = false;
/** Contexto da voz, atualizado pelo hook (para o anúncio direto do SSE). */
let voiceCtx: { enabled: boolean; lang: VoiceLang } = { enabled: false, lang: 'pt' };
/** Bola já anunciada pelo SSE (bola nativa); o hook não repete quando o estado chega. */
let preAnnounced: number | null = null;

/** Bola nativa: agenda a voz para o pouso, contado a partir de agora (o voo
 * começa na hora no Android). */
export function announceBallNow(n: number): void {
  preAnnounced = n;
  if (!voiceCtx.enabled) return;
  const land = document.documentElement.classList.contains('tv-noanim') ? 450 : 1000;
  enqueue({ ...voiceClip('ball', `${n}.mp3`, voiceCtx.lang), notBefore: Date.now() + land });
}

function playNext() {
  if (playing || waitTimer !== undefined) return;
  const head = queue[0];
  if (!head) return;
  const wait = (head.notBefore ?? 0) - Date.now();
  if (wait > 0) {
    waitTimer = setTimeout(() => {
      waitTimer = undefined;
      playNext();
    }, wait);
    return;
  }
  queue.shift();
  const clip = missing.has(head.src) && head.fallback ? { ...head, src: head.fallback, fallback: undefined } : head;
  playing = true;
  const audio = player ?? (player = new Audio());
  if (!stallHooked) {
    stallHooked = true;
    // 'waiting' no meio da fala = a voz parou esperando dados/CPU (engasgo).
    audio.addEventListener('waiting', () => {
      if (!audio.currentTime) return;
      const perf = (window.__tvPerf ??= {});
      perf.voiceStalls = (perf.voiceStalls ?? 0) + 1;
    });
  }
  const blob = blobsUsable ? voiceBlobs.get(clip.src) : undefined;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(guard);
    audio.removeEventListener('ended', finish);
    audio.removeEventListener('error', fail);
    endCurrent = null;
    playing = false;
    playNext();
  };
  // Arquivo inexistente/ilegível: tenta pela URL e depois a versão alternativa (português).
  const fail = () => {
    if (done) return;
    if (blob) {
      blobsUsable = false;
      queue.unshift(clip);
    } else if (clip.fallback) {
      missing.add(clip.src);
      queue.unshift({ ...clip, src: clip.fallback, fallback: undefined });
    }
    finish();
  };
  const guard = setTimeout(finish, MAX_SOUND_MS); // proteção caso 'ended' nunca dispare
  endCurrent = finish;
  audio.addEventListener('ended', finish);
  audio.addEventListener('error', fail);
  // Painel de desempenho: quanto a voz atrasou para sair e se engasgou no meio.
  const due = head.notBefore ?? Date.now();
  const onPlaying = () => {
    audio.removeEventListener('playing', onPlaying);
    const perf = (window.__tvPerf ??= {});
    perf.voiceLagMs = Math.max(0, Date.now() - due);
  };
  audio.addEventListener('playing', onPlaying);
  audio.src = blob ?? clip.src;
  audio.play().catch((e) => {
    if (e?.name === 'NotSupportedError') return fail();
    console.log('[AUDIO] reprodução bloqueada:', clip.src, e?.name || e);
    finish();
  });
}

function enqueue(clip: Clip) {
  // Bola nova substitui bolas ainda não faladas (só a mais recente importa).
  if (clip.kind === 'ball') queue = queue.filter((c) => c.kind !== 'ball');
  queue.push(clip);
  // O início da fila pode ter mudado: recalcula a espera.
  clearTimeout(waitTimer);
  waitTimer = undefined;
  playNext();
}

async function loadVoice(src: string): Promise<boolean> {
  if (voiceBlobs.has(src)) return true;
  const res = await fetch(src);
  if (!res.ok) return false;
  voiceBlobs.set(src, URL.createObjectURL(await res.blob()));
  return true;
}

/** Carrega as vozes do idioma, uma por vez, para não disputar a rede com o sorteio. */
export async function preloadVoices(lang: VoiceLang) {
  const run = ++preloadRun;
  const files = [...Array.from({ length: 90 }, (_, i) => `${i + 1}.mp3`), ...Object.values(PRIZE_FILE)];
  for (const file of files) {
    if (run !== preloadRun) return;
    const { src, fallback } = voiceClip('ball', file, lang);
    try {
      if (!missing.has(src) && !(await loadVoice(src))) missing.add(src);
      if (missing.has(src) && fallback) await loadVoice(fallback);
    } catch {
      // Rede instável: esta voz toca direto da URL.
    }
  }
}

/** Chama `cb` quando a fila de voz esvaziar (ou após `maxWaitMs`, no máximo). */
export function whenAudioIdle(cb: () => void, maxWaitMs = 6000): () => void {
  const startedAt = Date.now();
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    if (cancelled) return;
    if ((!playing && queue.length === 0) || Date.now() - startedAt >= maxWaitMs) cb();
    else timer = setTimeout(check, 150);
  };
  check();
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}

function stopAll() {
  queue = [];
  clearTimeout(waitTimer);
  waitTimer = undefined;
  player?.pause();
  endCurrent?.();
}

export type PrizeType = 'line1' | 'line2' | 'bingo';

/** Popup de prêmio que acabou de abrir (`seq` muda a cada abertura). */
export interface ShownPrize {
  type: PrizeType;
  seq: number;
}

const PRIZE_FILE: Record<'line1' | 'line2' | 'bingo', string> = {
  line1: 'win_line1.mp3',
  line2: 'win_line2.mp3',
  bingo: 'win_bingo.mp3',
};

/** Clip no idioma pedido; espanhol leva o português como alternativa. */
/** Clip no idioma pedido. Português usa a voz nova (/audio/pt-br) e espanhol a
 * voz em /audio/es; arquivo que faltar cai para a voz antiga completa (/audio/pt). */
function voiceClip(kind: Clip['kind'], file: string, lang: VoiceLang): Clip {
  const dir = lang === 'es' ? 'es' : 'pt-br';
  return { kind, src: `/audio/${dir}/${file}`, fallback: `/audio/pt/${file}` };
}

export function useBingoAudio(
  soundOn: boolean,
  currentBall: number | null,
  shownPrize: ShownPrize | null,
  isLive: boolean = true,
  drawId: string = '',
  lang: VoiceLang = 'pt',
  voiceDelayMs: number = 0,
) {
  // O que já está na tela quando o componente monta (ex.: reload, troca de tela)
  // conta como já anunciado — só mudanças a partir daqui são faladas.
  const lastBallRef = useRef<number | null>(currentBall && currentBall > 0 ? currentBall : null);
  const announcedRef = useRef<Set<PrizeType>>(new Set());
  const drawRef = useRef(drawId);

  // Sorteio novo: zera o que já foi anunciado e descarta sons pendentes.
  useEffect(() => {
    if (drawRef.current !== drawId) {
      drawRef.current = drawId;
      announcedRef.current = new Set();
      lastBallRef.current = null;
      queue = [];
    }
  }, [drawId]);

  // Som desligado ou tela desmontada: para tudo.
  useEffect(() => {
    if (!soundOn) stopAll();
  }, [soundOn]);
  useEffect(() => () => stopAll(), []);

  useEffect(() => {
    voiceCtx = { enabled: soundOn && isLive, lang };
  }, [soundOn, isLive, lang]);

  // 1. Voz da bola
  useEffect(() => {
    const valid = typeof currentBall === 'number' && currentBall >= 1 && currentBall <= 90;
    if (!valid) {
      if (!currentBall) lastBallRef.current = null;
      return;
    }
    if (currentBall === lastBallRef.current) return;
    lastBallRef.current = currentBall;
    // Já anunciada pelo SSE (bola nativa): não repete.
    if (preAnnounced === currentBall) {
      preAnnounced = null;
      return;
    }
    // Restaurando (reload/reconexão): registra sem falar.
    if (!isLive || !soundOn) return;
    const clip = voiceClip('ball', `${currentBall}.mp3`, lang);
    const rootCls = document.documentElement.classList;
    if ((rootCls.contains('tv-ultra') || rootCls.contains('tv-native-ball')) && typeof requestAnimationFrame === 'function') {
      // TV fraca: conta o pouso a partir do 1º quadro já desenhado com a bola (o 2º
      // quadro só começa depois dele), não do evento — assim a voz nunca chega antes.
      let raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => enqueue({ ...clip, notBefore: Date.now() + ultraBallLandMs() }));
      });
      return () => cancelAnimationFrame(raf);
    }
    enqueue({ ...clip, notBefore: Date.now() + voiceDelayMs });
  }, [currentBall, soundOn, isLive, lang, voiceDelayMs]);

  // 2. Voz do prêmio quando o popup da faixa abre (uma vez por faixa por sorteio)
  useEffect(() => {
    if (!shownPrize) return;
    const t = shownPrize.type;
    if (announcedRef.current.has(t)) return;
    announcedRef.current.add(t);
    if (!isLive || !soundOn) return;
    enqueue(voiceClip('prize', PRIZE_FILE[t], lang));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownPrize?.seq]);
}

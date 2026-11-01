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
 */

type Clip = { kind: 'ball' | 'prize'; src: string; fallback?: string };
export type VoiceLang = 'pt' | 'es';

const MAX_SOUND_MS = 6000; // proteção caso 'ended' nunca dispare

let queue: Clip[] = [];
let playing = false;
let current: HTMLAudioElement | null = null;
const missing = new Set<string>(); // arquivos que não existem (não tentar de novo)

function playNext() {
  if (playing) return;
  let clip = queue.shift();
  if (!clip) return;
  if (missing.has(clip.src) && clip.fallback) clip = { ...clip, src: clip.fallback, fallback: undefined };
  playing = true;
  const thisClip = clip;
  const audio = new Audio(clip.src);
  current = audio;
  audio.volume = 1.0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(guard);
    if (current === audio) current = null;
    playing = false;
    playNext();
  };
  const guard = setTimeout(finish, MAX_SOUND_MS);
  audio.addEventListener('ended', finish, { once: true });
  // Arquivo inexistente/ilegível: marca e toca a versão alternativa (português).
  const fail = () => {
    if (done) return;
    if (thisClip.fallback) {
      missing.add(thisClip.src);
      queue.unshift({ ...thisClip, src: thisClip.fallback, fallback: undefined });
    }
    finish();
  };
  audio.addEventListener('error', fail, { once: true });
  audio.play().catch((e) => {
    if (e?.name === 'NotSupportedError') return fail();
    console.log('[AUDIO] reprodução bloqueada:', thisClip.src, e?.name || e);
    finish();
  });
}

function enqueue(clip: Clip) {
  // Bola nova substitui bolas ainda não faladas (só a mais recente importa).
  if (clip.kind === 'ball') queue = queue.filter((c) => c.kind !== 'ball');
  queue.push(clip);
  playNext();
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
  if (current) {
    current.pause();
    current = null;
  }
  playing = false;
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

  // 1. Voz da bola
  useEffect(() => {
    const valid = typeof currentBall === 'number' && currentBall >= 1 && currentBall <= 90;
    if (!valid) {
      if (!currentBall) lastBallRef.current = null;
      return;
    }
    if (currentBall === lastBallRef.current) return;
    lastBallRef.current = currentBall;
    // Restaurando (reload/reconexão): registra sem falar.
    if (!isLive || !soundOn) return;
    enqueue(voiceClip('ball', `${currentBall}.mp3`, lang));
  }, [currentBall, soundOn, isLive, lang]);

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

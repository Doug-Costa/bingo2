import { useEffect, useRef } from 'react';
import { WinnerEvent } from '../../../contexts/SSEContext';

/**
 * Locução do bingo (voz das bolas e dos prêmios) com UMA fila de áudio:
 *
 * - Um som por vez, na ordem em que os eventos chegam — a voz do prêmio entra
 *   depois da voz da bola que fechou a linha, e a bola seguinte espera o prêmio
 *   terminar (antes as vozes tocavam por cima umas das outras).
 * - Voz de bola "mais recente vence": se chegarem várias bolas de uma vez
 *   (reconexão), só a última é falada; bolas antigas ainda não faladas saem da fila.
 * - Voz de prêmio nunca é descartada; cada faixa (1ª linha, 2ª linha, bingo) é
 *   anunciada uma única vez por sorteio, mesmo com vários ganhadores ou com o
 *   draw_finish reconstruindo a lista.
 * - Reload/reconexão: enquanto o estado está sendo restaurado (`isLive` false) nada
 *   toca; ao ficar ao vivo, a bola atual e os prêmios já existentes são marcados
 *   como anunciados — a TV não repete o que já tinha falado.
 * - Só bolas 1–90 (sem o "0.mp3" inexistente do início da rodada).
 * - Idioma da voz pelo tema (Paraguay → espanhol, em /audio/es/ com os mesmos nomes
 *   de arquivo). Arquivo em espanhol que não existir cai para o mesmo em português,
 *   e fica marcado para não ser tentado de novo.
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

function stopAll() {
  queue = [];
  if (current) {
    current.pause();
    current = null;
  }
  playing = false;
}

function prizeTypeOf(type?: string): 'line1' | 'line2' | 'bingo' | null {
  const t = String(type || '').toLowerCase();
  if (t.includes('line1') || t.includes('linha 1')) return 'line1';
  if (t.includes('line2') || t.includes('linha 2')) return 'line2';
  if (t.includes('bingo') || t.includes('jackpot')) return 'bingo';
  return null;
}

const PRIZE_FILE: Record<'line1' | 'line2' | 'bingo', string> = {
  line1: 'win_line1.mp3',
  line2: 'win_line2.mp3',
  bingo: 'win_bingo.mp3',
};

/** Clip no idioma pedido; espanhol leva o português como alternativa. */
function voiceClip(kind: Clip['kind'], file: string, lang: VoiceLang): Clip {
  return lang === 'es' ? { kind, src: `/audio/es/${file}`, fallback: `/audio/pt/${file}` } : { kind, src: `/audio/pt/${file}` };
}

export function useBingoAudio(
  soundOn: boolean,
  currentBall: number | null,
  winners: WinnerEvent[],
  isLive: boolean = true,
  drawId: string = '',
  lang: VoiceLang = 'pt',
) {
  // O que já está na tela quando o componente monta (ex.: reload, troca de tela)
  // conta como já anunciado — só mudanças a partir daqui são faladas.
  const lastBallRef = useRef<number | null>(currentBall && currentBall > 0 ? currentBall : null);
  const announcedRef = useRef<Set<string>>(
    new Set(winners.map((w) => prizeTypeOf(w.type)).filter((t): t is 'line1' | 'line2' | 'bingo' => !!t)),
  );
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

  // 2. Voz dos prêmios (uma vez por faixa por sorteio)
  useEffect(() => {
    const types = new Set<'line1' | 'line2' | 'bingo'>();
    winners.forEach((w) => {
      const t = prizeTypeOf(w.type);
      if (t) types.add(t);
    });
    if (winners.length === 0) {
      announcedRef.current = new Set();
      return;
    }
    (['line1', 'line2', 'bingo'] as const).forEach((t) => {
      if (!types.has(t) || announcedRef.current.has(t)) return;
      announcedRef.current.add(t);
      // Restaurando: marca como já anunciado, sem tocar.
      if (!isLive || !soundOn) return;
      enqueue(voiceClip('prize', PRIZE_FILE[t], lang));
    });
  }, [winners, soundOn, isLive, lang]);
}

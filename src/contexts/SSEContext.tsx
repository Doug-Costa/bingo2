'use client';

/**
 * SSEContext.tsx — porte de `tvapp1/src/contexts/SSEContext.tsx`.
 *
 * O RN usava XMLHttpRequest com parser SSE manual porque `fetch() +
 * response.body.getReader()` não funciona para SSE no Hermes/OkHttp (fica
 * bloqueado esperando a resposta completa). Isso é uma limitação específica
 * do RN — o browser tem suporte nativo a SSE via `EventSource`, que já
 * entrega `event:`/`data:` parseados (inclusive concatenação correta de
 * múltiplas linhas `data:` do mesmo evento, o bug que a Sprint C2.5.114
 * corrigiu manualmente no XHR). Por isso este porte usa `EventSource`
 * nativo e NÃO replica o parser de chunks — a REGRA (endpoint, query
 * params, nomes de evento, formato de payload, reconexão com backoff,
 * detecção de troca de sorteio, limpeza no unmount) é a mesma, só o
 * mecanismo de transporte muda.
 *
 * Limitação aceita do `EventSource`: ele exige `addEventListener(tipo, cb)`
 * por nome de evento conhecido — não existe um "pega qualquer evento
 * nomeado" (o RN conseguia isso no parser manual). Registramos listeners
 * para todo tipo de evento que o backend já envia hoje (confirmado no
 * `switch` original); um tipo totalmente novo, nunca visto, cairia no
 * `onmessage` (equivalente ao branch `default` do RN) só se vier SEM
 * `event:` explícito — com `event:` só chegaria se adicionarmos o listener
 * aqui.
 *
 * Reconexão: backoff exponencial 1s → 30s, controlado manualmente (não
 * dependemos do auto-retry nativo do `EventSource`, que não tem backoff
 * configurável) — sempre fechamos a conexão no erro e reagendamos nós
 * mesmos, igual ao XHR original.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const DEFAULT_SSE_PATH = '/bingo/realtime-sse/stream';
const TAG = '[SSE]';

// ─── DrawCache — recuperação instantânea após refresh ────────────────────────
// Persiste snapshot da rodada ativa no localStorage.
// Fonte OFICIAL continua sendo o snapshot/SSE do backend.
// O cache serve APENAS para bootstrap/recovery rápido no mount.

const CACHE_KEY_PREFIX = 'bingo-show-current-draw';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutos

export interface CachedDrawState {
  version: number;
  roomId: string;
  drawId?: string;
  incrementalId?: number | string;
  drawnNumbers: number[];
  currentBall: number | null;
  winners: any[];
  topPlayers: any[];
  topStage: string;
  jackpotAmount: number | null;
  triggerBallLimit: number | null;
  thisDraw: any | null;
  nextDraws: any[];
  lastDrawEvent: string | null;
  updatedAt: number;
}

function cacheKey(roomId: string): string {
  return `${CACHE_KEY_PREFIX}:${roomId}`;
}

function readCache(roomId: string): CachedDrawState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(roomId));
    if (!raw) return null;
    const entry: CachedDrawState = JSON.parse(raw);
    if (!entry || typeof entry.updatedAt !== 'number') return null;
    if (Date.now() - entry.updatedAt > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(roomId));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCache(roomId: string, patch: Partial<CachedDrawState>): void {
  if (typeof window === 'undefined' || !roomId) return;
  try {
    const existing = readCache(roomId) ?? {
      version: 1,
      roomId,
      drawnNumbers: [],
      currentBall: null,
      winners: [],
      topPlayers: [],
      topStage: 'finished',
      jackpotAmount: null,
      triggerBallLimit: null,
      thisDraw: null,
      nextDraws: [],
      lastDrawEvent: null,
      updatedAt: 0,
    };
    const next: CachedDrawState = { ...existing, ...patch, updatedAt: Date.now() };
    localStorage.setItem(cacheKey(roomId), JSON.stringify(next));
  } catch {
    // localStorage pode estar desabilitado
  }
}

function clearCache(roomId: string): void {
  if (typeof window === 'undefined' || !roomId) return;
  try {
    localStorage.removeItem(cacheKey(roomId));
    console.log('[CACHE] 🗑️ Cache limpo para room:', roomId);
  } catch {
    // silent
  }
}

// ─── Reconciliação cache × snapshot — não deixa um snapshot atrasado regredir
// a sequência de bolas de uma rodada já mais avançada (mesmo drawId). Ver
// auditoria "FASE CRÍTICA — CORRIGIR F5 / CACHE / RECOVERY SSE". ───────────
export type ReconcileDecision = 'CACHE_AHEAD' | 'SNAPSHOT_AHEAD' | 'EQUAL' | 'DIFFERENT_DRAW' | 'CONFLICT';

export interface ReconcileResult {
  decision: ReconcileDecision;
  finalBalls: number[];
  firstDifferentIndex?: number;
}

function isPrefixOf(shorter: number[], longer: number[]): boolean {
  if (shorter.length > longer.length) return false;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false;
  }
  return true;
}

export function reconcileDrawnNumbers(args: {
  currentDrawId: string | undefined;
  currentBalls: number[];
  snapshotDrawId: string | undefined;
  snapshotBalls: number[];
}): ReconcileResult {
  const { currentDrawId, currentBalls, snapshotDrawId, snapshotBalls } = args;

  // CASO A — draw diferente: snapshot vence, nunca mistura bolas de rodadas diferentes.
  if (currentDrawId !== undefined && snapshotDrawId !== undefined && currentDrawId !== snapshotDrawId) {
    return { decision: 'DIFFERENT_DRAW', finalBalls: snapshotBalls };
  }

  // Sem estado atual pra comparar (primeira vez vendo essa rodada) — snapshot é a fonte.
  if (!currentBalls || currentBalls.length === 0) {
    return { decision: 'SNAPSHOT_AHEAD', finalBalls: snapshotBalls };
  }

  if (currentBalls.length === snapshotBalls.length && currentBalls.every((n, i) => n === snapshotBalls[i])) {
    return { decision: 'EQUAL', finalBalls: snapshotBalls };
  }

  // CASO B — snapshot é prefixo do atual: snapshot chegou atrasado, mantém o que já tínhamos.
  if (isPrefixOf(snapshotBalls, currentBalls)) {
    return { decision: 'CACHE_AHEAD', finalBalls: currentBalls };
  }

  // CASO C — atual é prefixo do snapshot: snapshot está à frente (ex: outra aba avançou).
  if (isPrefixOf(currentBalls, snapshotBalls)) {
    return { decision: 'SNAPSHOT_AHEAD', finalBalls: snapshotBalls };
  }

  // CASO D — divergência real. Não concatena, não ordena, não escolhe por tamanho —
  // mantém o estado atual em memória e só loga o conflito (política confirmada
  // explicitamente pelo usuário até existir uma regra definitiva de negócio).
  let firstDifferentIndex = Math.min(currentBalls.length, snapshotBalls.length);
  for (let i = 0; i < firstDifferentIndex; i++) {
    if (currentBalls[i] !== snapshotBalls[i]) {
      firstDifferentIndex = i;
      break;
    }
  }
  return { decision: 'CONFLICT', finalBalls: currentBalls, firstDifferentIndex };
}

// Todo tipo de evento nomeado que o backend real envia hoje (extraído do
// `switch` do RN) — precisa de `addEventListener` explícito no EventSource.
const KNOWN_EVENT_TYPES = [
  'snapshot',
  'my_tickets',
  'promotions_list',
  'draw_start',
  'draw_closing',
  'new_ball',
  'top_winners',
  'line_winner',
  'jackpot_trigger_update',
  'jackpot_paid',
  'jackpot_won',
  'jackpot_delayed',
  'winners',
  'final_winners',
  'draw_finish',
  'draw_end',
  'draw_cancel',
  'next_draws',
  'hot_draws',
  'jackpot_info',
  'tv_restart',
  'restart',
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Top10Player {
  ticketId: string;
  playerId?: string;
  playerName?: string;
  loginId?: string;
  affiliateName?: string;
  linesCompleted: number;
  minNumbersLeft: number;
  minLeftLine1?: number;
  minLeftLine2?: number;
  minLeftBingo?: number;
  almostWinningLine?: number[];
  missing?: number[];
  missingNumbers?: number[];
  fullTicket?: number[][];
  closestLine?: { lineIdx: number; numbers: number[]; missing: number[] };
}

export interface TopWinnerRealtime {
  roomId: string;
  drawId: string;
  playerId: string;
  playerName: string;
  ticketId: string;
  /** Nº sequencial REAL do bilhete/ganhador (confirmado no payload real de `top_winners`,
   * ao lado de `ticketId`/`playerName` — não confundir com o `incrementalId` do SORTEIO em
   * `DrawSSE`/`ThisDrawInfo`). Só pra exibição — `ticketId` continua a identidade interna. */
  incrementalId?: number | string;
  targetPrize: 'line1' | 'line2' | 'line3' | 'bingo';
  minNumbersLeft: number;
  missingNumbers: number[];
}

/**
 * normalizeTopWinner — converte payload antigo ou novo para TopWinnerRealtime.
 * Formato novo: { roomId, drawId, playerId, playerName, ticketId, targetPrize, minNumbersLeft, missingNumbers }
 * Formato antigo (Top10Player-like): { ticketId, playerId?, playerName?, missing/missingNumbers, minNumbersLeft, closestLine? }
 */
export function normalizeTopWinner(raw: any): TopWinnerRealtime {
  if (raw.targetPrize !== undefined) {
    return {
      roomId: raw.roomId ?? '',
      drawId: raw.drawId ?? '',
      playerId: raw.playerId ?? '',
      playerName: raw.playerName ?? 'COMPRADOR',
      ticketId: raw.ticketId ?? '',
      incrementalId: raw.incrementalId ?? raw.incremental_id,
      targetPrize: raw.targetPrize as TopWinnerRealtime['targetPrize'],
      minNumbersLeft: Number(raw.minNumbersLeft ?? 0),
      missingNumbers: Array.isArray(raw.missingNumbers) ? raw.missingNumbers : [],
    };
  }

  const missing: number[] = Array.isArray(raw.missingNumbers)
    ? raw.missingNumbers
    : Array.isArray(raw.missing)
    ? raw.missing
    : [];

  const linesCompleted: number = Number(raw.linesCompleted ?? 0);
  let targetPrize: TopWinnerRealtime['targetPrize'] = 'line1';
  if (linesCompleted >= 2) {
    targetPrize = 'bingo';
  } else if (linesCompleted === 1) {
    targetPrize = 'line2';
  } else {
    targetPrize = 'line1';
  }

  return {
    roomId: raw.roomId ?? '',
    drawId: raw.drawId ?? '',
    playerId: raw.playerId ?? '',
    playerName: raw.playerName ?? 'COMPRADOR',
    ticketId: raw.ticketId ?? '',
    incrementalId: raw.incrementalId ?? raw.incremental_id,
    targetPrize,
    minNumbersLeft: Number(raw.minNumbersLeft ?? 0),
    missingNumbers: missing,
  };
}

export interface WinnerEvent {
  ticketId?: string;
  playerId?: string;
  playerName?: string;
  affiliateName?: string;
  /** Nº sequencial REAL do bilhete (confirmado no payload real de `line_winner`, ao lado
   * de `ticketId`/`playerName` — do bilhete, não do sorteio). Só pra exibição. */
  incrementalId?: number | string;
  type: 'line1' | 'line2' | 'bingo' | 'jackpot';
  line?: number;
  prizeAmount?: number;
  share?: number;
  prize?: number;
  numbers?: number[][];
  jackpotWon?: boolean;
  drawnNumbersAtWin?: number[];
  winningLines?: number[][];
}

export function normalizeTypeKey(type?: string): 'line1' | 'line2' | 'bingo' | '' {
  if (!type) return '';
  const lower = type.toLowerCase().trim();
  if (lower === 'jackpot' || lower === 'bingo') return 'bingo';
  if (lower === 'line2') return 'line2';
  if (lower === 'line1') return 'line1';
  return '';
}

export function getWinnerKey(w: Partial<WinnerEvent>): string {
  const normType = normalizeTypeKey(w.type);
  if (!normType) return '';
  const rawId = w.ticketId && w.ticketId.trim() !== '' ? w.ticketId : w.playerName;
  const identity = (rawId || '').toLowerCase().trim();
  if (!identity) return '';
  return `${identity}-${normType}`;
}

export function parseWinnerEvent(item: any, currentDrawnNumbers?: number[]): WinnerEvent | null {
  if (!item) return null;
  const lineNum = typeof item.line === 'number' ? item.line : typeof item.line === 'string' ? parseInt(item.line, 10) : undefined;
  const rawType = item.type;
  let type: 'line1' | 'line2' | 'bingo' | null = null;

  if (rawType) {
    const normKey = normalizeTypeKey(rawType);
    if (normKey === 'bingo' || normKey === 'line2' || normKey === 'line1') {
      type = normKey;
    }
  }

  if (!type && lineNum !== undefined) {
    if (lineNum === 1) type = 'line1';
    else if (lineNum === 2) type = 'line2';
    else if (lineNum === 3) type = 'bingo';
  }

  if (!type) return null;

  const ticketId = item.ticketId ? String(item.ticketId).trim() : undefined;
  const playerName = item.playerName ? String(item.playerName).trim() : undefined;
  if (!ticketId && !playerName) return null;

  const incrementalId = item.incrementalId ?? item.incremental_id ?? undefined;

  const rawPrize = item.share !== undefined && item.share !== null
    ? item.share
    : item.prizeAmount !== undefined && item.prizeAmount !== null
    ? item.prizeAmount
    : item.prize !== undefined && item.prize !== null
    ? item.prize
    : undefined;

  const prizeVal = rawPrize !== undefined ? Number(rawPrize) : undefined;

  const rawJackpotWon =
    item.jackpotWon !== undefined && item.jackpotWon !== null
      ? item.jackpotWon
      : item.jackpot_won !== undefined && item.jackpot_won !== null
      ? item.jackpot_won
      : (item.type && String(item.type).toLowerCase().trim() === 'jackpot') ||
        (item.event && String(item.event).toLowerCase().trim() === 'jackpot_won');

  const jackpotWonVal = rawJackpotWon ? true : undefined;

  const drawnNumbersAtWin = Array.isArray(item.drawnNumbersAtWin)
    ? item.drawnNumbersAtWin
    : Array.isArray(currentDrawnNumbers) && currentDrawnNumbers.length > 0
    ? [...currentDrawnNumbers]
    : undefined;

  const winningLines = Array.isArray(item.winningLines)
    ? item.winningLines
    : undefined;

  return {
    ticketId,
    playerId: item.playerId ? String(item.playerId) : undefined,
    playerName,
    affiliateName: item.affiliateName || item.affiliateId || undefined,
    incrementalId,
    type,
    line: lineNum,
    prizeAmount: prizeVal,
    share: item.share !== undefined && item.share !== null ? Number(item.share) : undefined,
    prize: item.prize !== undefined && item.prize !== null ? Number(item.prize) : undefined,
    numbers: Array.isArray(item.numbers) ? item.numbers : undefined,
    jackpotWon: jackpotWonVal,
    drawnNumbersAtWin,
    winningLines,
  };
}

export function auditWinnerEvents(eventName: string, drawId: string | undefined, list: WinnerEvent[]) {
  console.log(`[SSE-WINNER-AUDIT] ----------------------------------------`);
  console.log(`[SSE-WINNER-AUDIT] Event: "${eventName}" | DrawID: "${drawId || 'N/A'}" | Count: ${list.length}`);
  list.forEach((w, idx) => {
    const rawTicket = w.ticketId || 'UNDEFINED';
    const cleanTicket = w.ticketId ? (w.ticketId.split('-')[0] || w.ticketId).toUpperCase().slice(0, 6) : 'N/A';
    const key = getWinnerKey(w);
    console.log(
      `[SSE-WINNER-AUDIT]   [${idx + 1}/${list.length}] RAW_TICKET="${rawTicket}" | CLEAN="#${cleanTicket}" | NAME="${w.playerName || 'N/A'}" | TYPE="${w.type}" | KEY="${key}" | SHARE=${w.share} | PRIZE_AMT=${w.prizeAmount} | JACKPOT_WON=${w.jackpotWon}`,
    );
  });
  console.log(`[SSE-WINNER-AUDIT] ----------------------------------------`);
}

export function mergeWinnerEvents(existing: WinnerEvent, incoming: WinnerEvent): WinnerEvent {
  const normIncoming = normalizeTypeKey(incoming.type);
  const normExisting = normalizeTypeKey(existing.type);
  const finalType = (normIncoming || normExisting || existing.type) as any;

  return {
    ...existing,
    ...incoming,
    ticketId: incoming.ticketId ?? existing.ticketId,
    playerId: incoming.playerId ?? existing.playerId,
    playerName: incoming.playerName ?? existing.playerName,
    affiliateName: incoming.affiliateName ?? existing.affiliateName,
    incrementalId: incoming.incrementalId ?? existing.incrementalId,
    type: finalType,
    line: incoming.line ?? existing.line,
    prizeAmount: incoming.prizeAmount ?? existing.prizeAmount,
    share: incoming.share ?? existing.share,
    prize: incoming.prize ?? existing.prize,
    numbers: incoming.numbers ?? existing.numbers,
    jackpotWon: incoming.jackpotWon ?? existing.jackpotWon,
    drawnNumbersAtWin: incoming.drawnNumbersAtWin ?? existing.drawnNumbersAtWin,
    winningLines: incoming.winningLines ?? existing.winningLines,
  };
}

export interface DrawSSE {
  id: string;
  incrementalId?: number | string;
  scheduledAt?: string | null;
  ticketPrice?: number;
  prizeLine1?: number;
  prizeLine2?: number;
  prizeLine3?: number;
  status?: string;
  hotdraw?: boolean;
  nextBallTimer?: number;
  triggerBallLimit?: number;
  jackpotAmount?: number;
  room?: { name?: string };
}

export function parseDrawItem(item: any): DrawSSE | null {
  if (!item || typeof item !== 'object') return null;
  const id = item.id !== undefined && item.id !== null ? String(item.id) : item.drawId ? String(item.drawId) : '';
  const sched = item.scheduledAt || item.scheduled_at || item.scheduledTime || item.scheduled_time || null;
  return {
    id,
    incrementalId: item.incrementalId ?? item.incremental_id ?? item.drawNumber ?? item.number,
    scheduledAt: sched ? String(sched) : null,
    ticketPrice: item.ticketPrice !== undefined ? Number(item.ticketPrice) : item.price !== undefined ? Number(item.price) : undefined,
    prizeLine1: item.prizeLine1 !== undefined ? Number(item.prizeLine1) : item.prizeLine1Amount !== undefined ? Number(item.prizeLine1Amount) : undefined,
    prizeLine2: item.prizeLine2 !== undefined ? Number(item.prizeLine2) : item.prizeLine2Amount !== undefined ? Number(item.prizeLine2Amount) : undefined,
    prizeLine3: item.prizeLine3 !== undefined ? Number(item.prizeLine3) : item.prizeBingo !== undefined ? Number(item.prizeBingo) : undefined,
    status: item.status ? String(item.status) : undefined,
    hotdraw: item.hotdraw !== undefined ? Boolean(item.hotdraw) : undefined,
    triggerBallLimit: item.triggerBallLimit !== undefined ? Number(item.triggerBallLimit) : undefined,
    jackpotAmount: item.jackpotAmount !== undefined ? Number(item.jackpotAmount) : undefined,
    nextBallTimer: item.nextBallTimer !== undefined ? Number(item.nextBallTimer) : undefined,
  };
}

export function extractNextDrawsList(payload: any): DrawSSE[] {
  if (!payload) return [];
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.draws)
    ? payload.draws
    : Array.isArray(payload?.nextDraws)
    ? payload.nextDraws
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.draws)
    ? payload.data.draws
    : Array.isArray(payload?.data?.nextDraws)
    ? payload.data.nextDraws
    : [];

  return rawList.map(parseDrawItem).filter((d: DrawSSE | null): d is DrawSSE => d !== null);
}

export interface JackpotInfo {
  id?: string;
  name?: string;
  roomId?: string;
  jackpotId?: string;
  type?: string;
  baseAmount?: number;
  currentAmount?: number;
  totalAmount?: number;
  triggerBallLimit?: number;
  triggerBallChoice?: number;
  triggerBallLimitForce?: number;
  triggerBallLimitMin?: number;
  triggerBallLimitMax?: number;
  lastWonAt?: string;
  activeToday: boolean;
}

export interface Promotion {
  id: string;
  urlimg?: string;
  title?: string;
  linkurl?: string;
  video?: string;
  order?: number;
}

export interface MyTicket {
  id: string;
  drawId: string;
  roomId: string;
  playerId: string;
  /**
   * Confirmado por payload real: não é `number[][]` direto, é um array de
   * "grupos" (`{ numbers: number[][], value, status }[]`) — uma compra pode
   * ter várias cartelas físicas. Tipado `any` de propósito (mesma decisão do
   * RN) — quem consome precisa normalizar defensivamente.
   */
  numbers: any;
  createdAt?: string;
}

export interface ThisDrawInfo {
  id?: string;
  incrementalId?: number | string;
  scheduledAt?: string | null;
  ticketPrice?: number;
  prizeLine1?: number;
  prizeLine2?: number;
  prizeLine3?: number;
  /** Segundos configurados pelo backend entre uma bola e a proxima (mesmo
   * campo ja declarado em `DrawSSE.nextBallTimer` e `services/api.ts`
   * `Draw.nextBallTimer` - existia em dois tipos mas nunca era lido/copiado
   * pra ca, causa raiz do contador "PROXIMO NUMERO EM" ficar congelado em
   * um valor fixo hardcoded no hook de leitura). */
  nextBallTimer?: number;
}

// 'boot' = 1º render (SSR-safe, estado neutro) | 'recovered' = cache já aplicado, aguardando
// o snapshot autoritativo reconciliar | 'live' = snapshot já processado, tudo dali pra frente
// é evento genuinamente novo. Ver PARTE F — CORRIGIR F5 / CACHE / RECOVERY SSE.
export type RecoveryPhase = 'boot' | 'recovered' | 'live';

interface SSEContextValue {
  connected: boolean;
  drawnNumbers: number[];
  currentBall: number | null;
  topPlayers: TopWinnerRealtime[];
  topStage: 'line1' | 'line2' | 'bingo' | 'finished';
  jackpotAmount: number | null;
  triggerBallLimit: number | null;
  lastDrawEvent: 'draw_finished' | 'draw_started' | null;
  winners: WinnerEvent[];
  myTickets: MyTicket[];
  promotions: Promotion[];
  drawActive: boolean;
  nextDraws: DrawSSE[];
  hotDraws: DrawSSE[];
  jackpotInfo: JackpotInfo | null;
  hadDrawInSession: boolean;
  thisDraw: ThisDrawInfo | null;
  drawClosingSeconds: number | null;
  recoveryPhase: RecoveryPhase;
  debugUrl: string;
  debugLastEvent: string;
  debugEventCount: number;
}

const SSEContext = createContext<SSEContextValue>({
  connected: false,
  drawnNumbers: [],
  currentBall: null,
  topPlayers: [],
  topStage: 'finished',
  jackpotAmount: null,
  triggerBallLimit: null,
  lastDrawEvent: null,
  winners: [],
  myTickets: [],
  promotions: [],
  drawActive: false,
  nextDraws: [],
  hotDraws: [],
  jackpotInfo: null,
  hadDrawInSession: false,
  thisDraw: null,
  drawClosingSeconds: null,
  recoveryPhase: 'live',
  debugUrl: '',
  debugLastEvent: '',
  debugEventCount: 0,
});

// ─── Provider ────────────────────────────────────────────────────────────────
export function GameSocketProvider({
  baseUrl,
  roomId,
  pin,
  token,
  children,
  onRestartEvent,
}: {
  baseUrl: string;
  roomId: string;
  pin?: string;
  token?: string;
  children: React.ReactNode;
  onRestartEvent?: () => void;
}) {
  // SSR-SAFE: todo estado abaixo começa com o MESMO valor neutro no servidor e no
  // 1º render do cliente (sem lazy initializer lendo `localStorage` — isso é o que
  // causava o hydration mismatch, já que `window` só existe no cliente, então o
  // servidor sempre via estado vazio e o cliente via dado real já no 1º render,
  // gerando duas árvores diferentes). A leitura do cache acontece só dentro do
  // `useEffect` de boot logo abaixo — que nunca roda durante SSR/hidratação.
  const [connected, setConnected] = useState(false);
  const [drawnNumbersState, setDrawnNumbersState] = useState<number[]>([]);
  const drawnNumbersRef = useRef<number[]>([]);
  const [currentBall, setCurrentBall] = useState<number | null>(null);
  const [topPlayers, setTopPlayers] = useState<TopWinnerRealtime[]>([]);
  const [topStage, setTopStage] = useState<'line1' | 'line2' | 'bingo' | 'finished'>('finished');
  const [jackpotAmount, setJackpotAmount] = useState<number | null>(null);
  const [triggerBallLimit, setTriggerBallLimit] = useState<number | null>(null);
  const [lastDrawEvent, setLastDrawEvent] = useState<'draw_finished' | 'draw_started' | null>(null);
  const [winners, setWinners] = useState<WinnerEvent[]>([]);
  const [drawClosingSeconds, setDrawClosingSeconds] = useState<number | null>(null);
  const [recoveryPhase, setRecoveryPhase] = useState<RecoveryPhase>('boot');

  // O ref é atualizado NA HORA (não dentro do updater do setState, que o React só
  // executa no próximo render). Os eventos seguintes do mesmo pacote SSE — p.ex. o
  // `line_winner` que chega logo atrás do `new_ball` decisivo, ou duas bolas
  // seguidas numa reconexão — precisam enxergar a bola que acabou de chegar. Antes
  // eles liam a lista sem ela: a 2ª linha pintava só a linha antiga.
  const setDrawnNumbers = useCallback((val: number[] | ((_prev: number[]) => number[])) => {
    const next = typeof val === 'function' ? val(drawnNumbersRef.current) : val;
    drawnNumbersRef.current = next;
    setDrawnNumbersState(next);
  }, []);
  const [thisDraw, setThisDraw] = useState<ThisDrawInfo | null>(null);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [drawActive, setDrawActive] = useState(false);
  const [nextDraws, setNextDraws] = useState<DrawSSE[]>([]);
  const [hotDraws, setHotDraws] = useState<DrawSSE[]>([]);
  const [jackpotInfo, setJackpotInfo] = useState<JackpotInfo | null>(null);
  const [hadDrawInSession, setHadDrawInSession] = useState(false);
  const [debugUrl, setDebugUrl] = useState('');
  const [debugLastEvent, setDebugLastEvent] = useState('');
  const [debugEventCount, setDebugEventCount] = useState(0);

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  const unmountedRef = useRef(false);
  const eventCountRef = useRef(0);
  // ID do último sorteio visto num `snapshot` — usado para detectar troca de
  // sorteio e limpar `winners`/`topPlayers` mesmo quando `draw_start` não
  // chega (mesmo motivo documentado no RN: backend real nem sempre emite um
  // `draw_start` discreto).
  const lastSeenDrawIdRef = useRef<string | undefined>(undefined);

  // ── Cache Recovery — só roda no cliente, depois do mount (nunca durante
  // SSR/hidratação). `bootedRef` evita reaplicar o cache 2x pelo duplo-invoke
  // de efeitos do React Strict Mode em dev; assume que `roomId` não muda sem
  // um remount completo do Provider (é assim que `TvScreenApp` usa `key`). ──
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const cache = readCache(roomId);
    console.log('[CACHE-RECOVERY] BOOT', {
      cacheFound: !!cache,
      cacheDrawId: cache?.drawId,
      cacheIncrementalId: cache?.incrementalId,
      cacheLength: cache?.drawnNumbers?.length ?? 0,
      cacheCurrentBall: cache?.currentBall ?? null,
    });

    if (!cache) {
      setRecoveryPhase('live');
      console.log('[CACHE-RECOVERY] READY (sem cache — direto pra live)');
      return;
    }

    lastSeenDrawIdRef.current = cache.drawId;
    setDrawnNumbers(cache.drawnNumbers || []);
    setCurrentBall(cache.currentBall ?? null);
    setTopPlayers(cache.topPlayers || []);
    setTopStage((cache.topStage as any) || 'finished');
    setJackpotAmount(cache.jackpotAmount ?? null);
    setTriggerBallLimit(cache.triggerBallLimit ?? null);
    setLastDrawEvent((cache.lastDrawEvent as any) || (cache.drawId ? 'draw_started' : null));
    setWinners(cache.winners || []);
    setThisDraw(cache.thisDraw || null);
    setDrawActive(!!cache.drawId);
    setNextDraws(cache.nextDraws || []);
    setHadDrawInSession(!!cache.drawId);
    // Fica em 'recovered' (não 'live') até o snapshot autoritativo confirmar/
    // reconciliar essa sequência — é o que impede um winner restaurado do
    // cache de ser tratado como evento novo antes da reconciliação acontecer.
    setRecoveryPhase('recovered');

    console.log('[CACHE-RECOVERY] HYDRATED', {
      drawId: cache.drawId,
      length: cache.drawnNumbers?.length ?? 0,
      currentBall: cache.currentBall ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const buildUrl = useCallback((): string => {
    const parts: string[] = [];
    if (pin && pin.trim()) {
      parts.push(`pin=${encodeURIComponent(pin.trim())}`);
    }
    if (token && token.trim()) {
      parts.push(`token=${encodeURIComponent(token.trim())}`);
    }
    if (roomId && roomId.trim()) {
      parts.push(`roomId=${encodeURIComponent(roomId.trim())}`);
    }
    parts.push(`_t=${String(Date.now())}`);

    const directUrl = `${baseUrl.replace(/\/$/, '')}${DEFAULT_SSE_PATH}?${parts.join('&')}`;
    console.log(`${TAG} 🔌 Conectando direto ao SSE do backend → "${directUrl}"`);
    return directUrl;
  }, [baseUrl, roomId, pin, token]);

  // ── dispatch ──────────────────────────────────────────────────────────────
  const dispatch = useCallback(
    (eventType: string, rawData: string) => {
      if (unmountedRef.current) {
        return;
      }

      eventCountRef.current += 1;
      setDebugEventCount(eventCountRef.current);
      setDebugLastEvent(`${eventType} #${eventCountRef.current}`);

      const timeStr = new Date().toLocaleTimeString();

      try {
        const parsed = JSON.parse(rawData);
        const payload = parsed?.data ?? parsed;

        // Log visual em destaque colorido no console do navegador (DevTools)
        console.log(
          `%c[SSE EVENTO] %c[${eventType.toUpperCase()}] #${eventCountRef.current} %c@ ${timeStr}`,
          'background: #00E5FF; color: #000000; font-weight: 900; padding: 3px 8px; border-radius: 4px;',
          'background: #FFDE38; color: #000000; font-weight: 900; padding: 3px 8px; border-radius: 4px;',
          'color: #00FF88; font-weight: 800;',
          payload,
        );

        // Se for um evento crítico de ganhadores ou alteração de estado do sorteio, destaca em vermelho/ouro
        if (
          ['line_winner', 'winners', 'final_winners', 'draw_finish', 'draw_end', 'jackpot_won', 'jackpot_paid'].includes(eventType)
        ) {
          console.group(
            `%c🏆 [SSE GANHADOR DETECTADO] Evento: ${eventType.toUpperCase()} #${eventCountRef.current}`,
            'background: #FF0055; color: #FFFFFF; font-weight: 900; font-size: 14px; padding: 6px 12px; border-radius: 6px;',
          );
          console.log('📦 Payload dos Ganhadores:', payload);
          console.log('📄 Evento Bruto Original:', parsed);
          console.groupEnd();
        }

        switch (eventType) {
          case 'snapshot': {
            console.log(
              `%c📸 [SSE SNAPSHOT] status="${payload?.state?.status || payload?.status}" bolas=${payload?.state?.balls?.length || 0}`,
              'color: #00E5FF; font-weight: 800;',
              payload?.state ?? payload,
            );

            if (payload?.state === null || payload?.state === undefined) {
              console.log(`${TAG} 📸 state null — sem sorteio ativo`);
              lastSeenDrawIdRef.current = undefined;
              setCurrentBall(null);
              setDrawnNumbers([]);
              setTopPlayers([]);
              setWinners([]);
              setLastDrawEvent(null);
              setTopStage('finished');
              setDrawActive(false);
              setThisDraw(null);
              if (Array.isArray(payload?.nextDraws)) {
                setNextDraws(payload.nextDraws);
              }
              if (Array.isArray(payload?.hotDraws)) {
                setHotDraws(payload.hotDraws);
              }
              if (payload?.jackpotInfo) {
                setJackpotInfo(payload.jackpotInfo);
              }
              setRecoveryPhase('live');
              console.log('[CACHE-RECOVERY] READY (snapshot sem rodada ativa)');
              break;
            }

            const s = payload?.state ?? payload;
            const balls = s?.balls ?? s?.drawnNumbers;
            const tdForIdCheck =
              s?.thisDraw ?? (s?.status === 'started' && Array.isArray(s?.nextDraws) ? s.nextDraws[0] : undefined);

            const isStarted = s?.status === 'started';
            const currentDrawId: string | undefined =
              tdForIdCheck?.id ??
              (tdForIdCheck?.incrementalId !== undefined
                ? String(tdForIdCheck.incrementalId)
                : undefined);

            console.log('[CACHE-RECOVERY] SNAPSHOT', {
              snapshotDrawId: currentDrawId,
              snapshotIncrementalId: tdForIdCheck?.incrementalId,
              snapshotLength: Array.isArray(balls) ? balls.length : 0,
            });

            // Reconcilia com o que já temos em memória ANTES de sobrescrever nada —
            // um snapshot atrasado da MESMA rodada não pode regredir a sequência (ver
            // PARTE F — CORRIGIR F5 / CACHE / RECOVERY SSE). Usa `lastSeenDrawIdRef`/
            // `drawnNumbersRef` (estado atual, já vindo do cache no boot) como lado
            // "atual" da comparação — não o localStorage bruto, que pode estar mais
            // desatualizado que a memória se `new_ball` já chegou entretanto.
            let reconciledBalls: number[] = Array.isArray(balls) ? balls : drawnNumbersRef.current;
            if (Array.isArray(balls)) {
              const reconciled = reconcileDrawnNumbers({
                currentDrawId: lastSeenDrawIdRef.current,
                currentBalls: drawnNumbersRef.current,
                snapshotDrawId: currentDrawId,
                snapshotBalls: balls,
              });
              reconciledBalls = reconciled.finalBalls;
              console.log('[CACHE-RECOVERY] RECONCILE', {
                sameDraw: reconciled.decision !== 'DIFFERENT_DRAW',
                decision: reconciled.decision,
                finalLength: reconciled.finalBalls.length,
                finalCurrentBall: reconciled.finalBalls.length > 0 ? reconciled.finalBalls[reconciled.finalBalls.length - 1] : null,
                ...(reconciled.decision === 'CONFLICT'
                  ? {
                      drawId: lastSeenDrawIdRef.current,
                      cacheBalls: drawnNumbersRef.current,
                      snapshotBalls: balls,
                      firstDifferentIndex: reconciled.firstDifferentIndex,
                    }
                  : {}),
              });
              setDrawnNumbers(reconciledBalls);
              const lastReconciled = reconciledBalls[reconciledBalls.length - 1];
              if (lastReconciled !== undefined) {
                setCurrentBall(lastReconciled);
              }
            }

            setDrawActive(isStarted);

            if (currentDrawId !== undefined && currentDrawId !== lastSeenDrawIdRef.current && isStarted) {
              console.log(
                `${TAG} 🆕 novo sorteio detectado (snapshot ativo): ${lastSeenDrawIdRef.current} → ${currentDrawId} — limpando winners/topPlayers`,
              );
              setWinners([]);
              setTopPlayers([]);
              setTopStage('line1');
              lastSeenDrawIdRef.current = currentDrawId;
            }

            let jAmt = s?.jackpotAmount;
            if (jAmt === undefined && s?.jackpot?.currentAmount !== undefined) {
              jAmt = Number(s.jackpot.baseAmount || 0) + Number(s.jackpot.currentAmount || 0);
            }
            if (jAmt !== undefined && jAmt !== null) {
              setJackpotAmount(Number(jAmt));
            }

            const trigger = s?.triggerBallLimit ?? s?.jackpot?.triggerBallLimit;
            if (trigger !== undefined) {
              setTriggerBallLimit(Number(trigger) || null);
            }

            const topW = s?.topWinners ?? s?.topPlayers;
            if (Array.isArray(topW)) {
              setTopPlayers(topW.map((tp: any) => normalizeTopWinner(tp)));
            }
            if (s?.topWinnersStage || s?.topStage) {
              setTopStage(s.topWinnersStage ?? s.topStage);
            }
            const hasExplicitWinnersField = Array.isArray(s?.winners) || Array.isArray(s?.lineWinners);
            const rawWinnerList = [
              ...(Array.isArray(s?.winners) ? s.winners : []),
              ...(Array.isArray(s?.lineWinners) ? s.lineWinners : []),
            ];

            if (hasExplicitWinnersField && isStarted) {
              const snapshotWinners: WinnerEvent[] = [];
              rawWinnerList.forEach((w: any) => {
                const parsed = parseWinnerEvent(w, drawnNumbersRef.current);
                if (!parsed) return;
                const key = getWinnerKey(parsed);
                if (!key) return;
                const idx = snapshotWinners.findIndex(sw => getWinnerKey(sw) === key);
                if (idx >= 0) {
                  snapshotWinners[idx] = mergeWinnerEvents(snapshotWinners[idx]!, parsed);
                } else {
                  snapshotWinners.push(parsed);
                }
              });
              // O snapshot real manda `winners`/`lineWinners` VAZIOS no meio da rodada
              // (confirmado gravando rodadas reais), mesmo depois de prêmios saírem.
              // Lista vazia não pode apagar os ganhadores que já temos desta mesma
              // rodada (vindos do cache ou dos `line_winner`) — se fosse outra rodada,
              // eles já foram limpos acima ("novo sorteio detectado").
              if (snapshotWinners.length > 0) {
                setWinners(snapshotWinners);
              }
              auditWinnerEvents('snapshot', currentDrawId, snapshotWinners);
            }

            if (isStarted) {
              setLastDrawEvent('draw_started');
              setHadDrawInSession(true);
              console.log(`${TAG} 📸 ✅ DRAW ATIVO (snapshot)`);
            }

            const td = s?.thisDraw;
            if (td) {
              setThisDraw({
                id: String(td.id ?? ''),
                incrementalId: td.incrementalId ?? td.incremental_id ?? td.drawNumber ?? td.id,
                scheduledAt: td.scheduledAt ?? td.scheduled_at ?? null,
                ticketPrice: td.ticketPrice !== undefined ? Number(td.ticketPrice) : undefined,
                prizeLine1: td.prizeLine1 !== undefined ? Number(td.prizeLine1) : undefined,
                prizeLine2: td.prizeLine2 !== undefined ? Number(td.prizeLine2) : undefined,
                prizeLine3: td.prizeLine3 !== undefined ? Number(td.prizeLine3) : undefined,
                nextBallTimer: td.nextBallTimer !== undefined ? Number(td.nextBallTimer) : undefined,
              });
            }
            if (Array.isArray(s?.nextDraws)) {
              setNextDraws(s.nextDraws);
            }
            if (Array.isArray(s?.hotDraws)) {
              setHotDraws(s.hotDraws);
            }
            if (s?.jackpotInfo) {
              setJackpotInfo(s.jackpotInfo);
            }

            // Snapshot é autoritativo pro RESTO do estado (jackpot/trigger/thisDraw/etc) —
            // mas o cache grava a sequência RECONCILIADA, não a bruta do snapshot, senão
            // persistiríamos de volta uma regressão que acabamos de evitar em memória.
            if (isStarted) {
              const cacheEntry = readCache(roomId);
              writeCache(roomId, {
                drawId: currentDrawId ?? cacheEntry?.drawId,
                incrementalId: tdForIdCheck?.incrementalId,
                drawnNumbers: reconciledBalls,
                currentBall: reconciledBalls.length > 0 ? reconciledBalls[reconciledBalls.length - 1] : null,
                topStage: s?.topWinnersStage ?? s?.topStage ?? cacheEntry?.topStage ?? 'line1',
                jackpotAmount: jAmt !== undefined && jAmt !== null ? Number(jAmt) : cacheEntry?.jackpotAmount ?? null,
                triggerBallLimit: trigger !== undefined ? Number(trigger) : cacheEntry?.triggerBallLimit ?? null,
                thisDraw: td ?? cacheEntry?.thisDraw ?? null,
              });
            }

            // Esse é o snapshot autoritativo que fecha a reconciliação — a partir daqui,
            // qualquer winner que chegar é genuinamente novo (não mais um restaurado do
            // cache aguardando confirmação).
            setRecoveryPhase('live');
            console.log('[CACHE-RECOVERY] READY');
            break;
          }

          case 'my_tickets': {
            const mtData = payload?.data ?? payload;
            const tickets = Array.isArray(mtData)
              ? mtData
              : Array.isArray(mtData?.tickets)
              ? mtData.tickets
              : [];
            console.log(`${TAG} 🎟️ my_tickets: count=${tickets.length}`);
            setMyTickets(tickets);
            break;
          }

          case 'promotions_list': {
            const promos = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.promotions)
              ? payload.promotions
              : [];
            console.log(`${TAG} 📣 promotions_list: ${promos.length}`);
            setPromotions(promos);
            break;
          }

          case 'draw_start': {
            const dData = payload?.data ?? payload;
            const drawInfo = dData?.thisDraw ?? dData;
            console.log(
              `${TAG} 🚀 DRAW_START! jackpot=${dData?.jackpotAmount || drawInfo?.jackpotAmount} trigger=${dData?.triggerBallLimit || drawInfo?.triggerBallLimit} drawId=${dData?.drawId || drawInfo?.id} incrementalId=${drawInfo?.incrementalId}`,
            );
            const drawId = dData?.drawId ?? drawInfo?.id;
            if (drawId !== undefined) {
              lastSeenDrawIdRef.current = String(drawId);
            }
            setCurrentBall(null);
            setDrawnNumbers([]);
            setTopPlayers([]);
            setTopStage('line1');
            setWinners([]);
            setLastDrawEvent('draw_started');
            setDrawActive(true);
            setHadDrawInSession(true);
            setDrawClosingSeconds(null);
            if (dData?.jackpotAmount !== undefined || drawInfo?.jackpotAmount !== undefined) {
              setJackpotAmount(Number(dData?.jackpotAmount ?? drawInfo?.jackpotAmount));
            }
            if (dData?.triggerBallLimit !== undefined || drawInfo?.triggerBallLimit !== undefined) {
              setTriggerBallLimit(Number(dData?.triggerBallLimit ?? drawInfo?.triggerBallLimit) || null);
            }
            setThisDraw(prev => ({
              id: String(drawInfo?.id ?? dData?.drawId ?? prev?.id ?? ''),
              incrementalId:
                drawInfo?.incrementalId ??
                drawInfo?.incremental_id ??
                dData?.incrementalId ??
                dData?.incremental_id ??
                dData?.drawNumber ??
                prev?.incrementalId,
              ticketPrice: drawInfo?.ticketPrice !== undefined ? Number(drawInfo.ticketPrice) : dData?.ticketPrice !== undefined ? Number(dData.ticketPrice) : prev?.ticketPrice,
              scheduledAt: drawInfo?.scheduledAt ?? drawInfo?.scheduled_at ?? dData?.scheduledAt ?? dData?.scheduled_at ?? prev?.scheduledAt,
              prizeLine1: drawInfo?.prizeLine1 !== undefined ? Number(drawInfo.prizeLine1) : dData?.prizeLine1 !== undefined ? Number(dData.prizeLine1) : prev?.prizeLine1,
              prizeLine2: drawInfo?.prizeLine2 !== undefined ? Number(drawInfo.prizeLine2) : dData?.prizeLine2 !== undefined ? Number(dData.prizeLine2) : prev?.prizeLine2,
              prizeLine3: drawInfo?.prizeLine3 !== undefined ? Number(drawInfo.prizeLine3) : dData?.prizeLine3 !== undefined ? Number(dData.prizeLine3) : prev?.prizeLine3,
              nextBallTimer: drawInfo?.nextBallTimer !== undefined ? Number(drawInfo.nextBallTimer) : dData?.nextBallTimer !== undefined ? Number(dData.nextBallTimer) : prev?.nextBallTimer,
            }));
            // Inicia cache limpo para a nova rodada
            clearCache(roomId);
            console.log('[CACHE-RECOVERY-AUDIT] NEW_DRAW_RESET');
            writeCache(roomId, {
              drawId: String(drawInfo?.id ?? dData?.drawId ?? ''),
              incrementalId: drawInfo?.incrementalId ?? drawInfo?.incremental_id ?? dData?.incrementalId,
              drawnNumbers: [],
              currentBall: null,
              winners: [],
              topStage: 'line1',
              jackpotAmount: dData?.jackpotAmount !== undefined ? Number(dData.jackpotAmount) : drawInfo?.jackpotAmount !== undefined ? Number(drawInfo.jackpotAmount) : null,
              triggerBallLimit: dData?.triggerBallLimit !== undefined ? Number(dData.triggerBallLimit) : drawInfo?.triggerBallLimit !== undefined ? Number(drawInfo.triggerBallLimit) : null,
              thisDraw: {
                id: String(drawInfo?.id ?? dData?.drawId ?? ''),
                incrementalId: drawInfo?.incrementalId ?? drawInfo?.incremental_id ?? dData?.incrementalId,
                scheduledAt: drawInfo?.scheduledAt ?? drawInfo?.scheduled_at ?? dData?.scheduledAt,
                prizeLine1: drawInfo?.prizeLine1 ?? dData?.prizeLine1,
                prizeLine2: drawInfo?.prizeLine2 ?? dData?.prizeLine2,
                prizeLine3: drawInfo?.prizeLine3 ?? dData?.prizeLine3,
                nextBallTimer: drawInfo?.nextBallTimer ?? dData?.nextBallTimer,
              },
            });
            break;
          }

          case 'draw_closing': {
            const dcData = payload?.data ?? payload;
            const secs = Number(dcData?.secondsToStart ?? dcData?.seconds ?? dcData?.time ?? 30);
            console.log(`${TAG} ⏳ draw_closing: secondsToStart=${secs}`);
            if (!Number.isNaN(secs) && secs > 0) {
              setDrawClosingSeconds(secs);
            }
            break;
          }

          case 'new_ball': {
            const ball = payload?.number ?? payload?.ball ?? payload?.value;
            console.log(`${TAG} 🎱 NEW_BALL: ${ball}`);
            if (ball !== undefined) {
              setCurrentBall(ball);
              
              const prev = drawnNumbersRef.current;
              const nextDrawnNumbers = prev.includes(ball) ? prev : [...prev, ball];
              
              setDrawnNumbers(nextDrawnNumbers);
              
              writeCache(roomId, {
                currentBall: ball,
                drawnNumbers: nextDrawnNumbers,
                drawId: lastSeenDrawIdRef.current,
              });
              
              console.log(`[CACHE-RECOVERY-AUDIT] NEW_BALL ${ball} | drawnNumbers.length=${nextDrawnNumbers.length}`);
            }
            if (Array.isArray(payload?.topPlayers)) {
              setTopPlayers(
                payload.topPlayers.map((tp: any) => normalizeTopWinner(tp)),
              );
            }
            if (payload?.topStage) {
              setTopStage(payload.topStage);
            }
            if (payload?.jackpotAmount !== undefined) {
              setJackpotAmount(Number(payload.jackpotAmount));
            }
            setLastDrawEvent(null);
            break;
          }

          case 'top_winners': {
            const twData = payload?.data ?? payload;

            if (twData?.targetPrize !== undefined) {
              const normalized = normalizeTopWinner(twData);
              setTopPlayers(prev => {
                const next = prev.filter(p => p.ticketId !== normalized.ticketId);
                return [...next, normalized];
              });
              console.log(
                `${TAG} 🏆 top_winners (novo) ticket=${normalized.ticketId} target=${normalized.targetPrize} left=${normalized.minNumbersLeft}`,
              );
              break;
            }

            if (twData?.stage) {
              const st =
                twData.stage === 1
                  ? 'line1'
                  : twData.stage === 2
                  ? 'line2'
                  : twData.stage === 3
                  ? 'bingo'
                  : String(twData.stage);
              setTopStage(st as any);
            }
            const items = twData?.items ?? twData?.topWinners;
            if (Array.isArray(items)) {
              setTopPlayers(items.map((tp: any) => normalizeTopWinner(tp)));
              console.log(`${TAG} 🏆 top_winners (antigo) count=${items.length}`);
            }
            break;
          }

          case 'line_winner': {
            const lwData = payload?.data ?? payload;
            const lineNum = lwData?.line;
            const typeStr = lwData?.type
              ? lwData.type
              : lineNum === 1
              ? 'line1'
              : lineNum === 2
              ? 'line2'
              : lineNum === 3
              ? 'bingo'
              : undefined;

            if (typeStr === 'line1' || lineNum === 1) {
              setTopStage('line2');
            }
            if (typeStr === 'line2' || lineNum === 2) {
              setTopStage('bingo');
            }
            if (typeStr === 'bingo' || lineNum === 3) {
              setTopStage('finished');
            }

            const winnerList: WinnerEvent[] = [];
            if (Array.isArray(lwData?.winners)) {
              lwData.winners.forEach((w: any) => {
                const norm = parseWinnerEvent(
                  { ...w, type: w.type || typeStr, line: w.line || lineNum },
                  drawnNumbersRef.current,
                );
                if (norm) winnerList.push(norm);
              });
            } else if (lwData?.ticketId || lwData?.playerName) {
              const norm = parseWinnerEvent(lwData, drawnNumbersRef.current);
              if (norm) winnerList.push(norm);
            }

            if (winnerList.length > 0) {
              auditWinnerEvents('line_winner', lastSeenDrawIdRef.current, winnerList);
              setWinners(prev => {
                const next = [...prev];
                for (const nw of winnerList) {
                  const key = getWinnerKey(nw);
                  if (!key) continue;
                  const idx = next.findIndex(w => getWinnerKey(w) === key);
                  if (idx >= 0) {
                    next[idx] = mergeWinnerEvents(next[idx]!, nw);
                  } else {
                    next.push(nw);
                  }
                }
                writeCache(roomId, { winners: next });
                return next;
              });
            }
            break;
          }

          case 'jackpot_trigger_update': {
            const jtuData = payload?.data ?? payload;
            if (jtuData?.triggerBallLimit !== undefined) {
              setTriggerBallLimit(Number(jtuData.triggerBallLimit) || null);
            }
            if (jtuData?.jackpotAmount !== undefined) {
              setJackpotAmount(Number(jtuData.jackpotAmount));
            }
            break;
          }

          case 'jackpot_paid':
          case 'jackpot_won': {
            const jwData = payload?.data ?? payload;
            console.log(
              `${TAG} 💎 JACKPOT PAID/WON! amt=${jwData?.jackpotAmount ?? jwData?.totalJackpot}`,
            );
            const amt = jwData?.jackpotAmount ?? jwData?.totalJackpot;
            if (amt !== undefined) {
              setJackpotAmount(Number(amt));
            }
            if (jwData?.triggerBallLimit !== undefined) {
              setTriggerBallLimit(Number(jwData.triggerBallLimit));
            }

            const jWinners: WinnerEvent[] = [];
            if (Array.isArray(jwData?.winners)) {
              jwData.winners.forEach((w: any) => {
                const norm = parseWinnerEvent(
                  { ...w, type: 'jackpot', jackpotWon: true },
                  drawnNumbersRef.current,
                );
                if (norm) jWinners.push(norm);
              });
            } else if (jwData?.ticketId || jwData?.playerName) {
              const norm = parseWinnerEvent(
                { ...jwData, type: 'jackpot', jackpotWon: true },
                drawnNumbersRef.current,
              );
              if (norm) jWinners.push(norm);
            }

            if (jWinners.length > 0) {
              auditWinnerEvents('jackpot_won/paid', lastSeenDrawIdRef.current, jWinners);
              setWinners(prev => {
                const next = [...prev];
                for (const nw of jWinners) {
                  const key = getWinnerKey(nw);
                  if (!key) continue;
                  const idx = next.findIndex(w => getWinnerKey(w) === key);
                  if (idx >= 0) {
                    next[idx] = mergeWinnerEvents(next[idx]!, nw);
                  } else {
                    next.push(nw);
                  }
                }
                return next;
              });
            }
            break;
          }

          case 'jackpot_delayed': {
            const jdData = payload?.data ?? payload;
            if (jdData?.jackpotAmount !== undefined) {
              setJackpotAmount(Number(jdData.jackpotAmount));
            }
            if (jdData?.newTriggerLimit !== undefined) {
              setTriggerBallLimit(Number(jdData.newTriggerLimit));
            }
            if (jdData?.triggerBallLimit !== undefined) {
              setTriggerBallLimit(Number(jdData.triggerBallLimit));
            }
            break;
          }

          case 'winners':
          case 'final_winners': {
            const wData = payload?.data ?? payload;
            const arr = Array.isArray(wData)
              ? wData
              : Array.isArray(wData?.winners)
              ? wData.winners
              : [wData];
            const list: WinnerEvent[] = [];

            arr.forEach((item: any) => {
              if (!item) {
                return;
              }
              if (Array.isArray(item.winners)) {
                item.winners.forEach((w: any) => {
                  const norm = parseWinnerEvent({ ...item, ...w }, drawnNumbersRef.current);
                  if (norm) list.push(norm);
                });
              } else {
                const norm = parseWinnerEvent(item, drawnNumbersRef.current);
                if (norm) list.push(norm);
              }
            });

            if (list.length > 0) {
              auditWinnerEvents('winners/final_winners', lastSeenDrawIdRef.current, list);
              setWinners(prev => {
                const next = [...prev];
                for (const nw of list) {
                  const key = getWinnerKey(nw);
                  if (!key) continue;
                  const idx = next.findIndex(w => getWinnerKey(w) === key);
                  if (idx >= 0) {
                    next[idx] = mergeWinnerEvents(next[idx]!, nw);
                  } else {
                    next.push(nw);
                  }
                }
                return next.slice(0, 30);
              });
            }
            break;
          }

          case 'draw_finish': {
            const dfData = payload?.data ?? payload;
            console.log(
              `${TAG} 🏁 DRAW_FINISH drawId=${dfData?.drawId} winners=${dfData?.winners?.length ?? 0}`,
            );
            setCurrentBall(null);
            setTopStage('finished');
            setDrawActive(false);
            if (Array.isArray(dfData?.nextDraws)) {
              setNextDraws(dfData.nextDraws);
            }
            if (Array.isArray(dfData?.winners)) {
              console.log(
                '[DRAW-FINISH-RAW-AUDIT]',
                JSON.stringify(dfData?.winners, null, 2)
              );

              const freshWinners: WinnerEvent[] = [];
              dfData.winners.forEach((group: any, groupIndex: number) => {
                if (!group) return;

                if (Array.isArray(group.winners) && group.winners.length > 0) {
                  group.winners.forEach((winner: any, winnerIndex: number) => {
                    if (!winner) return;
                    const mergedItem = {
                      ...group,
                      ...winner,
                      line: winner.line ?? group.line,
                      prize: winner.prize ?? group.prize,
                      winners: undefined,
                    };
                    const norm = parseWinnerEvent(mergedItem, drawnNumbersRef.current);
                    console.log(
                      `[DRAW-FINISH-RAW-AUDIT] group[${groupIndex}] winner[${winnerIndex}] PARSED`,
                      norm,
                    );
                    if (norm) freshWinners.push(norm);
                  });
                } else if (group.ticketId || group.playerName) {
                  const norm = parseWinnerEvent(group, drawnNumbersRef.current);
                  console.log(
                    `[DRAW-FINISH-RAW-AUDIT] group[${groupIndex}] FLAT PARSED`,
                    norm,
                  );
                  if (norm) freshWinners.push(norm);
                }
              });

              auditWinnerEvents('draw_finish', dfData?.drawId, freshWinners);
              setWinners(prev => {
                // FOTOGRAFIA CONSOLIDADA UNICA DA RODADA:
                // A lista final e construida exclusivamente com os cupons presentes em dfData.winners,
                // reconciliando com prev caso contenha dados adicionais (ex: numbers). Se dfData.winners for [], limpa a lista.
                const finalResult: WinnerEvent[] = [];
                for (const fresh of freshWinners) {
                  const key = getWinnerKey(fresh);
                  const prevMatch = prev.find(p => getWinnerKey(p) === key);
                  if (prevMatch) {
                    finalResult.push(mergeWinnerEvents(prevMatch, fresh));
                  } else {
                    finalResult.push(fresh);
                  }
                }
                // Persistir fotografia final no cache — NÃO limpar drawnNumbers ainda
                writeCache(roomId, { winners: finalResult, topStage: 'finished' });
                return finalResult;
              });
            }
            setLastDrawEvent('draw_finished');
            break;
          }

          case 'draw_end': {
            const deData = payload?.data ?? payload;
            console.log(`${TAG} 🏁 DRAW_END drawId=${deData?.drawId}`);
            setCurrentBall(null);
            setTopStage('finished');
            setDrawActive(false);
            if (deData?.jackpotAmount !== undefined) {
              setJackpotAmount(Number(deData.jackpotAmount));
            }
            break;
          }

          case 'draw_cancel': {
            const dcData = payload?.data ?? payload;
            console.log(`${TAG} ⚠️ DRAW_CANCEL drawId=${dcData?.drawId}`);
            setCurrentBall(null);
            setDrawnNumbers([]);
            setTopPlayers([]);
            setTopStage('finished');
            setWinners([]);
            setDrawActive(false);
            setThisDraw(null);
            clearCache(roomId);
            break;
          }

          case 'next_draws': {
            const draws = extractNextDrawsList(payload);
            console.log(`${TAG} 📅 next_draws: ${draws.length}`);
            if (draws.length > 0) {
              setNextDraws(draws);
            }
            break;
          }

          case 'hot_draws': {
            const hdData = payload?.data ?? payload;
            if (Array.isArray(hdData?.draws)) {
              setHotDraws(hdData.draws);
            }
            break;
          }

          case 'jackpot_info': {
            const jiData = payload?.data ?? payload;
            console.log(
              `${TAG} 💎 jackpot_info: activeToday=${jiData?.activeToday} total=${jiData?.totalAmount ?? jiData?.currentAmount}`,
            );
            setJackpotInfo(jiData ?? null);
            const total =
              jiData?.totalAmount ??
              (jiData?.currentAmount !== undefined && jiData?.baseAmount !== undefined
                ? jiData.baseAmount + jiData.currentAmount
                : jiData?.currentAmount);
            if (total !== undefined && jiData?.activeToday) {
              setJackpotAmount(Number(total));
            }
            if (jiData?.triggerBallLimit !== undefined) {
              setTriggerBallLimit(Number(jiData.triggerBallLimit) || null);
            }
            break;
          }

          case 'tv_restart':
          case 'restart':
            console.log(`${TAG} 🔁 restart`);
            clearCache(roomId);
            if (onRestartEvent) {
              onRestartEvent();
            }
            break;

          default: {
            const inner: string = parsed?.event || parsed?.type || '';
            console.log(`${TAG} ❓ não mapeado: "${eventType}" inner="${inner}"`);
            if (inner && inner !== eventType) {
              dispatch(inner, rawData);
            }
          }
        }
      } catch (e) {
        console.error(`${TAG} ❌ parse erro evento="${eventType}":`, e, 'raw=', rawData.substring(0, 100));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRestartEvent],
  );

  // ── scheduleRetry ────────────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  const scheduleRetry = useCallback(() => {
    const delay = retryDelay.current;
    console.log(`${TAG} 🔄 Retry em ${delay}ms...`);
    retryRef.current = setTimeout(() => {
      if (!unmountedRef.current) {
        connect();
      }
    }, delay);
    retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dependência circular com `connect` (definido logo abaixo, mesma decisão documentada no RN original): incluir `connect` recriaria `scheduleRetry` toda vez que `connect` mudasse, que por sua vez muda sempre que `scheduleRetry` muda — loop sem ganho real.
  }, []);

  // ── startDemoFallback ──────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  const startDemoFallback = useCallback(() => {
    console.log(`${TAG} 🌟 Backend inalcançável — ativando modo de demonstração local`);
    setConnected(true);

    const now = Date.now();
    const demoNextDraws: DrawSSE[] = [
      {
        id: 'demo-101',
        incrementalId: '101',
        scheduledAt: new Date(now + 45000).toISOString(),
        prizeLine1: 1500,
        prizeLine2: 3000,
        prizeLine3: 10000,
        ticketPrice: 5.0,
        status: 'SCHEDULED',
      },
      {
        id: 'demo-102',
        incrementalId: '102',
        scheduledAt: new Date(now + 180000).toISOString(),
        prizeLine1: 2000,
        prizeLine2: 4000,
        prizeLine3: 15000,
        ticketPrice: 5.0,
        status: 'SCHEDULED',
        hotdraw: true,
      },
      {
        id: 'demo-103',
        incrementalId: '103',
        scheduledAt: new Date(now + 360000).toISOString(),
        prizeLine1: 2500,
        prizeLine2: 5000,
        prizeLine3: 20000,
        ticketPrice: 10.0,
        status: 'SCHEDULED',
      },
    ];

    setNextDraws(demoNextDraws);
    setJackpotInfo({
      activeToday: true,
      totalAmount: 50000,
      triggerBallLimit: 38,
    });
    setJackpotAmount(50000);
    setTriggerBallLimit(38);

    setTopPlayers([
      {
        roomId: roomId || 'tv_demo',
        drawId: 'demo-101',
        playerId: 'p1',
        playerName: 'Carlos M.',
        ticketId: '0482',
        targetPrize: 'bingo',
        minNumbersLeft: 2,
        missingNumbers: [14, 77],
      },
      {
        roomId: roomId || 'tv_demo',
        drawId: 'demo-101',
        playerId: 'p2',
        playerName: 'Ana P.',
        ticketId: '1290',
        targetPrize: 'line1',
        minNumbersLeft: 1,
        missingNumbers: [42],
      },
      {
        roomId: roomId || 'tv_demo',
        drawId: 'demo-101',
        playerId: 'p3',
        playerName: 'Roberto S.',
        ticketId: '0831',
        targetPrize: 'line2',
        minNumbersLeft: 3,
        missingNumbers: [5, 23, 89],
      },
    ]);
  }, [roomId]);

  // ── connect via EventSource ──────────────────────────────────────────────
  const connect = useCallback(() => {
    if (unmountedRef.current) {
      return;
    }

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = buildUrl();
    setDebugUrl(url);

    console.log(`${TAG} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${TAG} 🔌 EventSource CONECTANDO → "${url}"`);
    console.log(`${TAG} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        if (unmountedRef.current) {
          return;
        }
        console.log(`${TAG} ✅ conectado`);
        setConnected(true);
        retryDelay.current = 1000;
      };

      es.onmessage = event => {
        if (unmountedRef.current || !event.data) {
          return;
        }
        dispatch('message', event.data);
      };

      for (const eventType of KNOWN_EVENT_TYPES) {
        es.addEventListener(eventType, (event: MessageEvent) => {
          if (unmountedRef.current || !event.data) {
            return;
          }
          dispatch(eventType, event.data);
        });
      }

      es.onerror = () => {
        console.warn(`${TAG} ⚠️ EventSource onerror — tentando reconectar...`);
        setConnected(false);
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
        if (!unmountedRef.current) {
          scheduleRetry();
        }
      };
    } catch {
      scheduleRetry();
    }
  }, [buildUrl, dispatch, scheduleRetry]);

  // ── lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log(`${TAG} 🟢 Provider montado — baseUrl="${baseUrl}" roomId="${roomId}"`);
    if (!roomId || !baseUrl) {
      console.error(`${TAG} ❌ baseUrl ou roomId VAZIO`);
      return;
    }
    unmountedRef.current = false;
    connect();

    return () => {
      console.log(`${TAG} 🔴 Provider desmontando`);
      unmountedRef.current = true;
      if (retryRef.current) {
        clearTimeout(retryRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setConnected(false);
    };
  }, [roomId, baseUrl, connect]);

  // Log de estado para diagnóstico
  useEffect(() => {
    console.log(
      `${TAG} STATE → conn=${connected} draw=${drawActive} balls=${drawnNumbersState.length} jackpot=${jackpotAmount} trigger=${triggerBallLimit}`,
    );
  }, [connected, drawActive, drawnNumbersState.length, jackpotAmount, triggerBallLimit]);

  useEffect(() => {
    console.log(
      `${TAG} nextDraws → ${nextDraws.length} | jackpotInfo → active=${jackpotInfo?.activeToday} total=${jackpotInfo?.totalAmount}`,
    );
  }, [nextDraws.length, jackpotInfo]);

  return (
    <SSEContext.Provider
      value={{
        connected,
        drawnNumbers: drawnNumbersState,
        currentBall,
        topPlayers,
        topStage,
        jackpotAmount,
        triggerBallLimit,
        lastDrawEvent,
        winners,
        myTickets,
        promotions,
        drawActive,
        nextDraws,
        hotDraws,
        jackpotInfo,
        hadDrawInSession,
        thisDraw,
        drawClosingSeconds,
        recoveryPhase,
        debugUrl,
        debugLastEvent,
        debugEventCount,
      }}
    >
      {children}
    </SSEContext.Provider>
  );
}

export const useGameSocket = () => useContext(SSEContext);

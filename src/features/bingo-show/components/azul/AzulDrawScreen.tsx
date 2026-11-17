/**
 * AzulDrawScreen.tsx — tela de sorteio do tema `bingo-show-azul`.
 *
 * Segue o mockup do tema: prêmios à esquerda, palco com a bola grande no
 * centro, quadro das 90 bolas embaixo e cupons (com as cartelas, quando há) à
 * direita. Os dados, a voz e os popups são os mesmos da tela clássica
 * (useBingoShowRealtimeDraw, useBingoAudio, BingoShowWinnerPopup); só a
 * apresentação é própria.
 *
 * `AzulDrawView` só desenha (recebe os dados prontos) — é o que a página
 * /preview-azul usa com dados de exemplo, sem PIN nem backend.
 *
 * TVs fracas: cada bloco é memorizado e só redesenha quando o seu dado muda;
 * nenhuma animação contínua; a entrada da bola é transform/opacity (o modo
 * ultra leve a reduz a 1ms). Ver AzulDraw.module.css.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { BingoShowTvLayout } from '../../layouts/BingoShowTvLayout';
import { BingoShowAmbientBackground } from '../BingoShowAmbientBackground';
import { BingoShowCouponsTable } from '../BingoShowCouponsTable';
import { BingoShowTicketsGrid } from '../BingoShowTicketsGrid';
import { BingoShowWinnerPopup } from '../BingoShowWinnerPopup';
import { useBingoShowRealtimeDraw, type BingoShowRealtimeDraw, type PrizeStatusType } from '../../hooks/useBingoShowRealtimeDraw';
import { useBingoAudio, type PrizeType, type ShownPrize } from '../../hooks/useBingoAudio';
import { useTvConfig, useT } from '@/contexts/TvConfigContext';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import css from './AzulDraw.module.css';

const A = '/themes/bingo-show-azul';

/** Relógio com estado próprio: atualiza só este texto a cada segundo.
 * Começa vazio e liga após montar (o HTML do servidor não tem a hora da TV). */
const LiveClock: React.FC = () => {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return <span>{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : '--:--:--'}</span>;
};

// ─── Cabeçalho ───────────────────────────────────────────────────────────────

// Bolhas decorativas no canto direito do topo; `d` desencontra a flutuação.
const BUBBLES = [
  { n: 15, x: 0, y: 6, s: 52, d: 0 },
  { n: 42, x: 92, y: 0, s: 60, d: 900 },
  { n: 63, x: 196, y: 10, s: 52, d: 1800 },
  { n: 90, x: 290, y: 2, s: 64, d: 2700 },
];

const AzulHeader = React.memo(function AzulHeader({
  drawNumber,
  donationAmount,
  drawTime,
}: {
  drawNumber: string;
  donationAmount: string;
  drawTime: string;
}) {
  const t = useT();
  // Dados do sorteio em cards no topo (sem data).
  const info = [
    { label: t('azul.draw'), value: drawNumber },
    { label: t('azul.value'), value: donationAmount },
    { label: t('azul.time'), value: drawTime },
  ];
  return (
    <div className={css.header}>
      <div className={css.headerLeft}>
        {/* eslint-disable-next-line @next/next/no-img-element -- marca do tema */}
        <img className={css.logo} src="/themes/bingo-show-blue/logos/logo-main.webp" alt="BINGO SHOW" />
        <div className={`${css.infoCard} ${css.infoClock}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ícone do tema */}
          <img src="/themes/bingo-show-blue/relogio.webp" alt="" />
          <span className={css.infoValue}>
            <LiveClock />
          </span>
        </div>
        {info.map((item) => (
          <div key={item.label} className={css.infoCard}>
            <span className={css.infoLabel}>{item.label}</span>
            <span className={css.infoValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className={css.bubbles} aria-hidden="true">
        {BUBBLES.map((b) => (
          <span
            key={b.n}
            className={css.bubble}
            style={{ left: b.x, top: b.y, '--s': `${b.s}px`, '--d': `${b.d}ms` } as React.CSSProperties}
          >
            {b.n}
          </span>
        ))}
      </div>
    </div>
  );
});

// ─── Prêmios ────────────────────────────────────────────────────────────────

type RowState = 'active' | 'done' | 'waiting';

function rowState(status: PrizeStatusType): RowState {
  if (status === 'EM DISPUTA') return 'active';
  if (status === 'PREMIADO') return 'done';
  return 'waiting';
}

const PrizeRow: React.FC<{ label: string; amount: string; state: RowState }> = ({ label, amount, state }) => {
  const t = useT();
  return (
    <div className={`${css.prizeRow} ${state === 'active' ? css.prizeActive : state === 'done' ? css.prizeDone : ''}`}>
      <div className={css.prizeLabelBox}>
        <span className={css.prizeLabel}>{label}</span>
        <span className={`${css.prizeStatus} ${state === 'done' ? css.statusDone : ''}`}>
          {state === 'done' ? `✓ ${t('azul.done')}` : state === 'active' ? t('azul.active') : t('azul.waiting')}
        </span>
      </div>
      <div className={css.prizeValue}>{amount}</div>
    </div>
  );
};

const AzulPrizes = React.memo(function AzulPrizes({
  accumulatedPrize,
  triggerBallLimit,
  jackpotActive,
  line1Prize,
  line1Status,
  line2Prize,
  line2Status,
  bingoPrize,
  bingoStatus,
}: Pick<
  BingoShowRealtimeDraw,
  | 'accumulatedPrize'
  | 'triggerBallLimit'
  | 'jackpotActive'
  | 'line1Prize'
  | 'line1Status'
  | 'line2Prize'
  | 'line2Status'
  | 'bingoPrize'
  | 'bingoStatus'
>) {
  const t = useT();
  return (
    <div className={css.prizes}>
      <div className={css.jackpot}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.trophy} src={`${A}/trofeu.webp`} alt="" />
        {/* Brilho que passa pelo card (só transform; parado no ultra leve). */}
        <span className={css.shine} aria-hidden="true" />
        <div className={css.jackpotText}>
          <span className={css.jackpotLabel}>{t('azul.jackpot1')}</span>
          <span className={css.jackpotLabel}>{t('azul.jackpot2')}</span>
          <span className={css.jackpotValue}>{accumulatedPrize}</span>
        </div>
        {jackpotActive && triggerBallLimit > 0 && (
          <div className={css.untilBall}>
            <span className={css.untilBallSmall}>{t('azul.untilBall1')}</span>
            <span className={css.untilBallSmall}>{t('azul.untilBall2')}</span>
            <span className={css.untilBallNum}>{triggerBallLimit}</span>
          </div>
        )}
      </div>

      <PrizeRow label={t('azul.line1')} amount={line1Prize} state={rowState(line1Status)} />
      <PrizeRow label={t('azul.line2')} amount={line2Prize} state={rowState(line2Status)} />
      <PrizeRow label={t('azul.bingo')} amount={bingoPrize} state={rowState(bingoStatus)} />

    </div>
  );
});

// ─── Palco ──────────────────────────────────────────────────────────────────

const LAST_TONES = [css.gGold, css.gBlue, css.gRed];

// Arco de luzes em volta da bola: 23 luzes de -132° a +132° (aberto embaixo,
// onde a bola encosta na área da faixa). Posições fixas, calculadas uma vez.
const LIGHTS = Array.from({ length: 23 }, (_, i) => -132 + i * 12);

const AzulStage = React.memo(function AzulStage({
  currentBall,
  lastBalls,
  count,
  total,
}: {
  currentBall: number;
  lastBalls: number[];
  count: number;
  total: number;
}) {
  const t = useT();
  const hasBall = currentBall > 0;
  return (
    <div className={css.stage}>
      <div className={css.rays} aria-hidden="true" />
      <div className={css.stageTitleRow}>
        <span className={css.stageTitle}>
          <span className={css.star}>★</span>
          {t('azul.drawnBalls')}
          <span className={css.star}>★</span>
        </span>
      </div>
      <div className={css.lastLabel}>
        {t('azul.lastBalls1')}
        <br />
        {t('azul.lastBalls2')}
      </div>
      <div className={css.lastBalls}>
        {lastBalls.map((n, i) => (
          // key pelo número: a bola que acabou de entrar na lista faz a entrada.
          <span key={n} className={`${css.gball} ${LAST_TONES[i % LAST_TONES.length]} ${i === 0 ? css.gballEnter : ''}`}>
            {n}
          </span>
        ))}
      </div>

      {/* Cartelas e globo nos cantos de baixo, inclinados para a bola. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.cardsArt} src={`${A}/cartelas.webp`} alt="" />
      <div className={css.arena}>
        <div className={css.glow} />
        <div className={css.halo} />
        <div className={css.lights} aria-hidden="true">
          {LIGHTS.map((a, i) => (
            <span
              key={a}
              className={`${css.light} ${i % 2 ? css.lightGold : ''}`}
              style={{ transform: `rotate(${a}deg) translateY(-198px)` }}
            />
          ))}
        </div>
        <div className={css.haloSpin} />
        {/* key: a bola remonta (e faz a entrada) só quando o número muda. */}
        <div key={hasBall ? currentBall : 'none'} className={`${css.bigBall} ${hasBall ? css.ballPop : ''}`}>
          <div className={css.bigInner}>
            <span className={css.bigNumber}>{hasBall ? currentBall : '--'}</span>
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.globeArt} src={`${A}/globo.webp`} alt="" />

      {/* Faixa branca: bola sorteada, rótulo e progresso (ex.: 55 / 90). */}
      <div className={css.countPill}>
        <span key={hasBall ? currentBall : 'none'} className={`${css.countBall} ${css.countPop}`}>
          {hasBall ? currentBall : '--'}
        </span>
        <span className={css.countText}>
          {t('azul.ballLabel')}
          <span className={css.countProgress}>
            {count} / {total}
          </span>
        </span>
      </div>
    </div>
  );
});

// ─── Quadro das 90 bolas ────────────────────────────────────────────────────

const NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);

/** Cor da bola sorteada pela linha do quadro (como no mockup). */
function drawnTone(n: number): string {
  const row = Math.floor((n - 1) / 18);
  return (row === 2 ? css.cellBlue : row % 3 === 1 ? css.cellRing : css.cellRed) ?? '';
}

const AzulBoard = React.memo(
  function AzulBoard({ drawnBalls, currentBall }: { drawnBalls: number[]; currentBall: number }) {
    const t = useT();
    const drawn = new Set(drawnBalls);
    return (
      <div className={css.board}>
        <div className={css.boardTitle}>
          <span className={css.boardStar}>★</span>
          {t('azul.board')}
          <span className={css.boardStar}>★</span>
        </div>
        <div className={css.grid}>
          {NUMBERS.map((n) => {
            const tone = n === currentBall ? css.cellCurrent : drawn.has(n) ? drawnTone(n) : '';
            return (
              <span key={n} className={`${css.cell} ${tone}`}>
                {n}
              </span>
            );
          })}
        </div>
      </div>
    );
  },
  // A lista chega nova a cada evento: só redesenha quando muda de verdade.
  (a, b) => a.currentBall === b.currentBall && a.drawnBalls.length === b.drawnBalls.length && a.drawnBalls[a.drawnBalls.length - 1] === b.drawnBalls[b.drawnBalls.length - 1],
);

// ─── Tela ───────────────────────────────────────────────────────────────────

export type AzulDrawData = Pick<
  BingoShowRealtimeDraw,
  | 'drawNumber'
  | 'donationAmount'
  | 'currentBall'
  | 'drawnBalls'
  | 'totalBalls'
  | 'accumulatedPrize'
  | 'triggerBallLimit'
  | 'jackpotActive'
  | 'line1Prize'
  | 'line1Status'
  | 'line2Prize'
  | 'line2Status'
  | 'bingoPrize'
  | 'bingoStatus'
  | 'dateStr'
  | 'timeStr'
  | 'coupons'
  | 'tickets'
>;

export interface AzulDrawViewProps {
  data: AzulDrawData;
}

export const AzulDrawView: React.FC<AzulDrawViewProps> = ({ data }) => {
  const lastBalls = React.useMemo(() => {
    const list = data.drawnBalls;
    const withoutCurrent = data.currentBall && list[list.length - 1] === data.currentBall ? list.slice(0, -1) : list;
    return withoutCurrent.slice(-3).reverse();
  }, [data.drawnBalls, data.currentBall]);
  const hasTickets = data.tickets.length > 0;

  return (
    <div className={css.screen}>
      <AzulHeader
        drawNumber={data.drawNumber}
        donationAmount={data.donationAmount}
        drawTime={data.timeStr}
      />
      <AzulPrizes
        accumulatedPrize={data.accumulatedPrize}
        triggerBallLimit={data.triggerBallLimit}
        jackpotActive={data.jackpotActive}
        line1Prize={data.line1Prize}
        line1Status={data.line1Status}
        line2Prize={data.line2Prize}
        line2Status={data.line2Status}
        bingoPrize={data.bingoPrize}
        bingoStatus={data.bingoStatus}
      />
      <AzulStage currentBall={data.currentBall} lastBalls={lastBalls} count={data.drawnBalls.length} total={data.totalBalls} />
      <div className={css.side}>
        <div className={`${css.sideCoupons} ${hasTickets ? css.sideCouponsSplit : ''}`}>
          <BingoShowCouponsTable coupons={data.coupons} compact={hasTickets} />
        </div>
        {hasTickets && (
          <div className={css.sideTickets}>
            <BingoShowTicketsGrid tickets={data.tickets} drawnBalls={data.drawnBalls} latestBall={data.currentBall} />
          </div>
        )}
      </div>
      <AzulBoard drawnBalls={data.drawnBalls} currentBall={data.currentBall} />
    </div>
  );
};

export const AzulDrawScreen: React.FC = () => {
  const mock = useBingoShowRealtimeDraw();
  const { voice, soundEnabled } = useTvConfig();

  // Mesma voz da tela clássica; sai quando a bola termina de entrar no palco.
  const [shownPrize, setShownPrize] = useState<ShownPrize | null>(null);
  const handlePrizeShown = React.useCallback((type: PrizeType) => setShownPrize((prev) => ({ type, seq: (prev?.seq ?? 0) + 1 })), []);
  const reducedMotion = usePrefersReducedMotion();
  // Sem botão de som na tela: liga/desliga só pelo painel (theme.enableSound).
  useBingoAudio(soundEnabled, mock.currentBall, shownPrize, mock.isLive, mock.drawNumber, voice, reducedMotion ? 150 : 500);

  return (
    <BingoShowAmbientBackground brightness="light">
      <BingoShowTvLayout
        mainFlex={1}
        style={{ padding: 0 }}
        fullBody={<AzulDrawView data={mock} />}
        overlay={
          <BingoShowWinnerPopup
            winners={mock.winners}
            onPrizeShown={handlePrizeShown}
            isDrawFinished={mock.isDrawFinished}
            drawNumber={mock.drawNumber}
            dateStr={mock.dateStr}
            timeStr={mock.timeStr}
            line1Prize={mock.line1Prize}
            line2Prize={mock.line2Prize}
            bingoPrize={mock.bingoPrize}
            jackpotAmount={mock.accumulatedPrize}
            drawnNumbers={mock.drawnBalls}
            isLive={mock.isLive}
          />
        }
      />
    </BingoShowAmbientBackground>
  );
};

export default AzulDrawScreen;

/**
 * AzulLobbyScreen.tsx — lobby (próximos sorteios) do tema `bingo-show-azul`.
 *
 * Layout padrão dos lobbies (mesma grade do Loteria'i), com a paleta, as artes
 * e a identidade do Azul (cards claros com filete ciano, painéis azul-royal,
 * ouro nos números de destaque):
 *   - topo: logo, próximo sorteio, data, hora e acumulado;
 *   - esquerda: "PRÓXIMOS SORTEIOS", 3 cards por página (girando a cada 6s);
 *   - centro: "PRÓXIMO SORTEIO", contagem regressiva e faixa do acumulado
 *     (com o selo "ATÉ A BOLA");
 *   - direita: as 3 faixas de prêmio do próximo sorteio;
 *   - rodapé: mensagem da promoção (ou a frase padrão).
 *
 * Só usa dados do SSE. `AzulLobbyView` é a parte visual pura (usada também
 * pela prévia `/preview-azul?lobby=1`).
 *
 * TVs fracas: cada bloco é memorizado e só redesenha quando o seu dado muda
 * (por segundo mudam só o contador e o relógio). Animações só de
 * transform/opacity; o tv-ultra desliga as contínuas.
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useGameSocket, type DrawSSE } from '@/contexts/SSEContext';
import { useT } from '@/contexts/TvConfigContext';
import { BingoShowAmbientBackground } from '../BingoShowAmbientBackground';
import { useBingoShowRealtimeLobby } from '../../hooks/useBingoShowRealtimeLobby';
import { formatBrl, formatDrawTime } from '../../utils/format';
import { formatCountdown } from '../../utils/countdown';
import { moneyLengthTier } from '../../utils/moneyLength';
import css from './AzulLobby.module.css';

const A = '/themes/bingo-show-azul';
const B = '/themes/bingo-show-blue';
const PAGE_SIZE = 3;
const PAGE_INTERVAL_MS = 6000;

export interface AzulLobbyData {
  /** Nº do próximo sorteio (sem "#"), ou '---'. */
  nextNumber: string;
  date: string;
  accumulatedPrize: string;
  hasLimit: boolean;
  triggerBallLimit: number;
  /** Contagem regressiva já formatada (ex.: "02:13"). */
  countdown: string;
  line1Prize: string;
  line2Prize: string;
  bingoPrize: string;
  /** Fila de sorteios (SSE `nextDraws`). */
  draws: DrawSSE[];
  message: string;
}

/** Relógio com estado próprio: só este texto muda a cada segundo. */
const LiveClock: React.FC = () => {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return <>{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : '--:--:--'}</>;
};

function drawNo(d: DrawSSE | undefined): string {
  return d?.incrementalId !== undefined && d?.incrementalId !== null && String(d.incrementalId) !== '' ? String(d.incrementalId) : '---';
}

/** Fonte do valor pelo comprimento do texto (guarani/real grandes cabem). */
function sizeFor(value: string, sizes: [number, number, number]): number {
  const tier = moneyLengthTier(value);
  return tier === 'normal' ? sizes[0] : tier === 'long' ? sizes[1] : sizes[2];
}

// ─── Topo ───────────────────────────────────────────────────────────────────

const LobbyHeader = React.memo(function LobbyHeader({
  nextNumber,
  date,
  accumulatedPrize,
}: {
  nextNumber: string;
  date: string;
  accumulatedPrize: string;
}) {
  const t = useT();
  return (
    <div className={css.header}>
      {/* eslint-disable-next-line @next/next/no-img-element -- marca do tema */}
      <img className={css.logo} src={`${B}/logos/logo-main.webp`} alt="BINGO SHOW" />

      <div className={`${css.infoCard} ${css.infoNext}`}>
        <span className={css.infoLabelStack}>{t('lobby.nextDraw')}</span>
        <span className={css.nextBall} style={{ fontSize: nextNumber.length > 4 ? 30 : 36 }}>
          {nextNumber}
        </span>
      </div>

      <div className={css.infoCard}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ícone do tema */}
        <img className={css.infoIcon} src={`${B}/calendario.webp`} alt="" />
        <span className={css.infoText}>
          <span className={css.infoLabel}>{t('lobby.date')}</span>
          <span className={css.infoValue} suppressHydrationWarning>
            {date}
          </span>
        </span>
      </div>

      <div className={css.infoCard}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ícone do tema */}
        <img className={css.infoIcon} src={`${B}/relogio.webp`} alt="" />
        <span className={css.infoText}>
          <span className={css.infoLabel}>{t('lobby.time')}</span>
          <span className={css.infoValue}>
            <LiveClock />
          </span>
        </span>
      </div>

      <div className={css.topJackpot}>
        <span className={css.topJackpotText}>
          <span className={css.topJackpotLabel}>
            {t('azul.jackpot1')} {t('azul.jackpot2')}
          </span>
          <span key={accumulatedPrize} className={css.topJackpotValue} style={{ fontSize: sizeFor(accumulatedPrize, [44, 38, 32]) }}>
            {accumulatedPrize}
          </span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.topJackpotArt} src={`${A}/trofeu.webp`} alt="" />
      </div>
    </div>
  );
});

// ─── Esquerda: próximos sorteios ────────────────────────────────────────────

const DrawCard = React.memo(function DrawCard({ draw, index }: { draw: DrawSSE; index: number }) {
  const t = useT();
  const no = drawNo(draw);
  const rows = [
    { label: t('azul.line1'), value: formatBrl(draw.prizeLine1), tone: css.tagRed },
    { label: t('azul.line2'), value: formatBrl(draw.prizeLine2), tone: css.tagIce },
    { label: t('azul.bingo'), value: formatBrl(draw.prizeLine3), tone: css.tagRoyal },
  ];
  return (
    <div className={css.drawCard} style={{ '--i': index } as React.CSSProperties}>
      <div className={css.drawHead}>
        <span className={css.drawNo}>{t('lobby.drawNo', { n: no })}</span>
        <span className={css.drawTime}>{formatDrawTime(draw.scheduledAt)}</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className={css.drawRow}>
          <span className={`${css.tag} ${r.tone}`}>{r.label}</span>
          <span className={css.drawValue} style={{ fontSize: sizeFor(r.value, [30, 26, 22]) }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
});

const NextDrawsColumn = React.memo(function NextDrawsColumn({ draws }: { draws: DrawSSE[] }) {
  const t = useT();
  const pages = useMemo(() => {
    const out: DrawSSE[][] = [];
    for (let i = 0; i < draws.length; i += PAGE_SIZE) out.push(draws.slice(i, i + PAGE_SIZE));
    return out;
  }, [draws]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
    if (pages.length <= 1) return;
    const timer = setInterval(() => setPage((p) => (p + 1) % pages.length), PAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pages.length]);

  const list = pages[page] ?? [];

  return (
    <div className={css.leftCol}>
      <div className={css.colTitle}>{t('lobby.nextDraws')}</div>
      {list.length === 0 ? (
        <div className={css.empty}>
          {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
          <img className={css.emptyArt} src={`${A}/lobby-globo.webp`} alt="" />
          <span>{t('lobby.waitingDraws')}</span>
        </div>
      ) : (
        <div key={page} className={css.drawList}>
          {list.map((d, i) => (
            <DrawCard key={d.id || `${page}-${i}`} draw={d} index={i} />
          ))}
          {/* Página com menos de 3 sorteios: espaço livre (invisível) no lugar
              dos que faltam, para os cards não esticarem. */}
          {Array.from({ length: PAGE_SIZE - list.length }).map((_, i) => (
            <div key={`gap-${i}`} className={css.drawGap} aria-hidden="true" />
          ))}
        </div>
      )}
      {pages.length > 1 && (
        <div className={css.dots}>
          {pages.map((_, i) => (
            <span key={i} className={`${css.dot} ${i === page ? css.dotOn : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Centro: contagem e acumulado ───────────────────────────────────────────

const CenterCountdown = React.memo(function CenterCountdown({ countdown }: { countdown: string }) {
  const t = useT();
  return (
    <>
      <div className={css.centerTitle}>{t('lobby.nextDraw')}</div>
      <div className={css.countRow}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.countArtL} src={`${A}/lobby-cartelas.webp`} alt="" />
        <div className={css.countPill}>
          <span className={css.countValue} style={{ fontSize: countdown.length > 5 ? 112 : 138 }} suppressHydrationWarning>
            {countdown}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.countArtR} src={`${A}/lobby-globo.webp`} alt="" />
      </div>
    </>
  );
});

const CenterJackpot = React.memo(function CenterJackpot({
  accumulatedPrize,
  hasLimit,
  triggerBallLimit,
}: {
  accumulatedPrize: string;
  hasLimit: boolean;
  triggerBallLimit: number;
}) {
  const t = useT();
  return (
    <div className={css.jackpotStrip}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.jackpotArt} src={`${A}/trofeu-louros.webp`} alt="" />
      <div className={css.jackpotText}>
        <span className={css.jackpotLabel}>
          {t('azul.jackpot1')} {t('azul.jackpot2')}
        </span>
        <span key={accumulatedPrize} className={css.jackpotValue} style={{ fontSize: sizeFor(accumulatedPrize, [72, 60, 50]) }}>
          {accumulatedPrize}
        </span>
      </div>
      {hasLimit ? (
        <div className={css.untilBall}>
          <span className={css.untilBallSmall}>{t('azul.untilBall1')}</span>
          <span className={css.untilBallSmall}>{t('azul.untilBall2')}</span>
          <span className={css.untilBallNum}>{triggerBallLimit}</span>
        </div>
      ) : (
        <span className={css.untilBallSpacer} />
      )}
    </div>
  );
});

// ─── Direita: faixas de prêmio ──────────────────────────────────────────────

const PrizeColumn = React.memo(function PrizeColumn({ line1, line2, bingo }: { line1: string; line2: string; bingo: string }) {
  const t = useT();
  const cards = [
    { label: t('azul.line1'), value: line1, head: css.headRed, art: `${A}/bolas.webp` },
    { label: t('azul.line2'), value: line2, head: css.headIce, art: `${A}/cartelas.webp` },
    { label: t('azul.bingo'), value: bingo, head: css.headRoyal, art: `${A}/trofeu.webp` },
  ];
  return (
    <div className={css.rightCol}>
      {cards.map((c) => (
        <div key={c.label} className={css.prizeCard}>
          <div className={`${css.prizeHead} ${c.head}`}>
            <span>{c.label}</span>
            <span className={css.prizeStar}>★</span>
          </div>
          <div className={css.prizeBody}>
            {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
            <img className={css.prizeArt} src={c.art} alt="" />
            <span key={c.value} className={css.prizeValue} style={{ fontSize: sizeFor(c.value, [56, 46, 38]) }}>
              {c.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

// ─── Rodapé ─────────────────────────────────────────────────────────────────

const LobbyFooter = React.memo(function LobbyFooter({ message }: { message: string }) {
  return (
    <div className={css.footer}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.footerArtL} src={`${A}/bolas.webp`} alt="" />
      <span className={css.footerStar}>★</span>
      <span className={css.footerText} style={{ fontSize: message.length > 70 ? 32 : 44 }}>
        {message}
      </span>
      <span className={css.footerStar}>★</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.footerArtR} src={`${A}/bolas.webp`} alt="" />
    </div>
  );
});

// ─── Tela ───────────────────────────────────────────────────────────────────

/** Visual puro do lobby (sem SSE). */
export function AzulLobbyView({ data }: { data: AzulLobbyData }) {
  return (
    <div className={css.screen}>
      <LobbyHeader nextNumber={data.nextNumber} date={data.date} accumulatedPrize={data.accumulatedPrize} />
      <div className={css.main}>
        <NextDrawsColumn draws={data.draws} />
        <div className={css.center}>
          <span className={css.centerRays} aria-hidden="true" />
          <CenterCountdown countdown={data.countdown} />
          <CenterJackpot accumulatedPrize={data.accumulatedPrize} hasLimit={data.hasLimit} triggerBallLimit={data.triggerBallLimit} />
        </div>
        <PrizeColumn line1={data.line1Prize} line2={data.line2Prize} bingo={data.bingoPrize} />
      </div>
      <LobbyFooter message={data.message} />
    </div>
  );
}

export const AzulLobbyScreen: React.FC = () => {
  const lobby = useBingoShowRealtimeLobby();
  const { nextDraws } = useGameSocket();

  const data: AzulLobbyData = {
    nextNumber: drawNo(nextDraws[0]),
    date: lobby.currentDate,
    accumulatedPrize: lobby.accumulatedPrize,
    hasLimit: lobby.hasTriggerBallLimit,
    triggerBallLimit: lobby.triggerBallLimit,
    countdown: formatCountdown(Math.max(0, lobby.countdownSeconds || 0)),
    line1Prize: lobby.line1Prize,
    line2Prize: lobby.line2Prize,
    bingoPrize: lobby.bingoPrize,
    draws: nextDraws,
    message: lobby.promotionalMessage,
  };

  return (
    <BingoShowAmbientBackground brightness="light">
      <AzulLobbyView data={data} />
    </BingoShowAmbientBackground>
  );
};

export default AzulLobbyScreen;

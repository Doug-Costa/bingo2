/**
 * AzulLobbyScreen.tsx — lobby (próximos sorteios) do tema `bingo-show-azul`.
 *
 * Mesmo visual da tela de sorteio do Azul (AzulDrawScreen): cards claros com
 * filete ciano, painéis azul-royal e ouro só nos valores. Só usa dados do SSE:
 *   - topo: relógio, data, próximo sorteio e acumulado (até a bola);
 *   - destaque: nº do próximo sorteio no anel, contagem regressiva e o prêmio
 *     total do próximo sorteio (soma das 3 faixas), com cada faixa abaixo;
 *   - "PRÓXIMOS SORTEIOS": até 4 cards por página (horário, valor da cartela,
 *     prêmio total e as 3 faixas), girando a cada 8s quando há mais;
 *   - rodapé: mensagem da promoção (ou a frase padrão).
 *
 * TVs fracas: o hook do lobby atualiza a cada segundo; cada bloco é memorizado
 * e só redesenha quando o seu dado muda (só o contador e o relógio mudam por
 * segundo). Animações só de transform/opacity; o tv-ultra as desliga.
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
const PAGE_SIZE = 4;
const PAGE_INTERVAL_MS = 8000;

/** Relógio com estado próprio: só este texto muda a cada segundo. */
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

/** "Hoje, às 14:30" ou "18/11 às 14:30". */
function useWhenLabel() {
  const t = useT();
  return (scheduledAt: string | null | undefined): string => {
    const time = formatDrawTime(scheduledAt);
    if (!scheduledAt) return time;
    const d = new Date(String(scheduledAt).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return time;
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) return t('azul.lobbyToday', { time });
    const pad = (n: number) => String(n).padStart(2, '0');
    return t('azul.lobbyOnDate', { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, time });
  };
}

/** Soma das 3 faixas de um sorteio (null se o backend não mandou nenhuma). */
function totalOf(d: DrawSSE | undefined): number | null {
  if (!d) return null;
  const parts = [d.prizeLine1, d.prizeLine2, d.prizeLine3].filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
}

function drawNo(d: DrawSSE | undefined): string {
  return d?.incrementalId !== undefined && d?.incrementalId !== null && String(d.incrementalId) !== '' ? String(d.incrementalId) : '---';
}

/** Fonte do valor pelo comprimento do texto (guarani/real grandes cabem). */
function sizeFor(value: string, sizes: [number, number, number]): number {
  const tier = moneyLengthTier(value);
  return tier === 'normal' ? sizes[0] : tier === 'long' ? sizes[1] : sizes[2];
}

// ─── Cabeçalho ───────────────────────────────────────────────────────────────

const LobbyHeader = React.memo(function LobbyHeader({
  date,
  drawNumber,
  accumulatedPrize,
  hasLimit,
  triggerBallLimit,
}: {
  date: string;
  drawNumber: string;
  accumulatedPrize: string;
  hasLimit: boolean;
  triggerBallLimit: number;
}) {
  const t = useT();
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
        <div className={css.infoCard}>
          <span className={css.infoLabel}>{t('azul.date')}</span>
          <span className={css.infoValue} suppressHydrationWarning>
            {date}
          </span>
        </div>
        <div className={css.infoCard}>
          <span className={css.infoLabel}>{t('lobby.nextDraw')}</span>
          <span className={css.infoValue}>{drawNumber}</span>
        </div>
      </div>

      <div className={css.jackpot}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.jackpotArt} src={`${A}/trofeu.webp`} alt="" />
        <div className={css.jackpotText}>
          <span className={css.jackpotLabel}>
            {t('azul.jackpot1')} {t('azul.jackpot2')}
          </span>
          <span key={accumulatedPrize} className={css.jackpotValue} style={{ fontSize: sizeFor(accumulatedPrize, [40, 34, 28]) }}>
            {accumulatedPrize}
          </span>
        </div>
        {hasLimit && (
          <div className={css.untilBall}>
            <span className={css.untilBallSmall}>{t('azul.untilBall1')}</span>
            <span className={css.untilBallSmall}>{t('azul.untilBall2')}</span>
            <span className={css.untilBallNum}>{triggerBallLimit}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Destaque: próximo sorteio ──────────────────────────────────────────────

const HeroCountdown = React.memo(function HeroCountdown({ drawNumber, countdown }: { drawNumber: string; countdown: string }) {
  const t = useT();
  return (
    <div className={css.heroLeft}>
      <div className={css.ring}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.ringArt} src={`${A}/anel.webp`} alt="" />
        <span className={css.ringLabel}>{t('azul.draw')}</span>
        <span className={css.ringNumber} style={{ fontSize: drawNumber.length > 4 ? 64 : 78 }}>
          {drawNumber}
        </span>
      </div>
      <div className={css.countBox}>
        <span className={css.countTitle}>{t('azul.lobbyNextIn')}</span>
        <div className={css.countFrame}>
          <span className={css.countValue} style={{ fontSize: countdown.length > 5 ? 104 : 132 }} suppressHydrationWarning>
            {countdown}
          </span>
        </div>
      </div>
    </div>
  );
});

const HeroPrizes = React.memo(function HeroPrizes({
  total,
  line1,
  line2,
  bingo,
}: {
  total: string;
  line1: string;
  line2: string;
  bingo: string;
}) {
  const t = useT();
  const rows = [
    { label: t('azul.line1'), value: line1, tone: css.tagRed },
    { label: t('azul.line2'), value: line2, tone: css.tagBlue },
    { label: t('azul.bingo'), value: bingo, tone: css.tagGold },
  ];
  return (
    <div className={css.heroPrizes}>
      <div className={css.totalRow}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={css.totalArt} src={`${A}/trofeu-louros.webp`} alt="" />
        <div className={css.totalText}>
          <span className={css.totalLabel}>{t('azul.lobbyTotal')}</span>
          <span key={total} className={css.totalValue} style={{ fontSize: sizeFor(total, [76, 62, 50]) }}>
            {total}
          </span>
        </div>
      </div>
      {/* Sem sorteio na fila: só o título (sem as faixas zeradas). */}
      {total !== '—' && (
      <div className={css.lineRow}>
        {rows.map((r) => (
          <div key={r.label} className={css.linePill}>
            <span className={`${css.lineTag} ${r.tone}`}>{r.label}</span>
            <span className={css.lineValue} style={{ fontSize: sizeFor(r.value, [28, 24, 20]) }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
});

// ─── Próximos sorteios ──────────────────────────────────────────────────────

const BALL_TONES = [css.ballRed, css.ballBlue, css.ballGold, css.ballBlue];

const DrawCard = React.memo(function DrawCard({
  draw,
  index,
  isNext,
  when,
}: {
  draw: DrawSSE;
  index: number;
  isNext: boolean;
  when: string;
}) {
  const t = useT();
  const no = drawNo(draw);
  const total = totalOf(draw);
  const totalText = total !== null ? formatBrl(total) : '—';
  const price = typeof draw.ticketPrice === 'number' && draw.ticketPrice > 0 ? formatBrl(draw.ticketPrice) : null;
  const lines = [
    { label: t('azul.line1'), value: formatBrl(draw.prizeLine1) },
    { label: t('azul.line2'), value: formatBrl(draw.prizeLine2) },
    { label: t('azul.bingo'), value: formatBrl(draw.prizeLine3) },
  ];
  return (
    <div className={`${css.card} ${isNext ? css.cardNext : ''}`} style={{ '--i': index } as React.CSSProperties}>
      <div className={css.cardHead}>
        <span className={`${css.cardBall} ${BALL_TONES[index % BALL_TONES.length]}`} style={{ fontSize: no.length > 4 ? 15 : no.length > 3 ? 18 : 24 }}>
          {no}
        </span>
        <span className={css.cardTitle}>{t('lobby.drawNo', { n: no })}</span>
        {isNext && <span className={css.cardNextTag}>{t('lobby.nextTag')}</span>}
      </div>
      <div className={css.cardBody}>
        <div className={css.cardRow}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ícone do tema */}
          <img className={css.cardIcon} src="/themes/bingo-show-blue/relogio.webp" alt="" />
          <span className={css.cardRowLabel}>{t('azul.lobbyStart')}:</span>
          <span className={css.cardRowValue}>{when}</span>
        </div>
        {price && (
          <div className={css.cardRow}>
            {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
            <img className={css.cardIcon} src={`${A}/cartelas.webp`} alt="" />
            <span className={css.cardRowLabel}>{t('azul.lobbyCardPrice')}:</span>
            <span className={css.cardRowValue}>{price}</span>
          </div>
        )}
        <div className={css.cardTotal}>
          {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
          <img className={css.cardTotalArt} src={`${A}/trofeu.webp`} alt="" />
          <span className={css.cardTotalLabel}>{t('azul.lobbyTotalShort')}:</span>
          <span className={css.cardTotalValue} style={{ fontSize: sizeFor(totalText, [26, 22, 19]) }}>
            {totalText}
          </span>
        </div>
        <div className={css.cardLines}>
          {lines.map((l) => (
            <div key={l.label} className={css.cardLine}>
              <span className={css.cardLineLabel}>{l.label}</span>
              <span className={css.cardLineValue}>{l.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const NextDrawsSection = React.memo(function NextDrawsSection({ draws }: { draws: DrawSSE[] }) {
  const t = useT();
  const whenLabel = useWhenLabel();
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
    <div className={css.section}>
      <div className={css.sectionTitle}>
        <span className={css.sectionLine} />
        <span className={css.sectionText}>
          <span className={css.sectionStar}>★</span>
          {t('lobby.nextDraws')}
          <span className={css.sectionStar}>★</span>
        </span>
        <span className={css.sectionLine} />
      </div>

      {list.length === 0 ? (
        <div className={css.empty}>
          {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
          <img className={css.emptyArt} src={`${A}/lobby-globo.webp`} alt="" />
          <span>{t('lobby.waitingDraws')}</span>
        </div>
      ) : (
        <div key={page} className={css.cards}>
          {list.map((d, i) => (
            <DrawCard key={d.id || `${page}-${i}`} draw={d} index={i} isNext={page === 0 && i === 0} when={whenLabel(d.scheduledAt)} />
          ))}
          {/* Mantém a largura dos cards quando a página tem menos de 4. */}
          {Array.from({ length: PAGE_SIZE - list.length }).map((_, i) => (
            <div key={`ph-${i}`} className={css.cardPlaceholder} />
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

// ─── Rodapé ─────────────────────────────────────────────────────────────────

const LobbyFooter = React.memo(function LobbyFooter({ message }: { message: string }) {
  return (
    <div className={css.footer}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.footerArtL} src={`${A}/lobby-cartelas.webp`} alt="" />
      <span className={css.footerText} style={{ fontSize: message.length > 70 ? 30 : 38 }}>
        {message}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
      <img className={css.footerArtR} src={`${A}/bolas.webp`} alt="" />
    </div>
  );
});

// ─── Tela ───────────────────────────────────────────────────────────────────

export const AzulLobbyScreen: React.FC = () => {
  const lobby = useBingoShowRealtimeLobby();
  const { nextDraws } = useGameSocket();
  const next = nextDraws[0];
  const countdown = formatCountdown(Math.max(0, lobby.countdownSeconds || 0));
  const total = totalOf(next);

  return (
    <BingoShowAmbientBackground brightness="light">
      <div className={css.screen}>
        <LobbyHeader
          date={lobby.currentDate}
          drawNumber={lobby.drawNumberShort}
          accumulatedPrize={lobby.accumulatedPrize}
          hasLimit={lobby.hasTriggerBallLimit}
          triggerBallLimit={lobby.triggerBallLimit}
        />

        <div className={css.hero}>
          <span className={css.heroRays} aria-hidden="true" />
          <HeroCountdown drawNumber={drawNo(next)} countdown={countdown} />
          <HeroPrizes
            total={total !== null ? formatBrl(total) : '—'}
            line1={lobby.line1Prize}
            line2={lobby.line2Prize}
            bingo={lobby.bingoPrize}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
          <img className={css.heroGlobe} src={`${A}/lobby-globo.webp`} alt="" />
        </div>

        <NextDrawsSection draws={nextDraws} />

        <LobbyFooter message={lobby.promotionalMessage} />
      </div>
    </BingoShowAmbientBackground>
  );
};

export default AzulLobbyScreen;

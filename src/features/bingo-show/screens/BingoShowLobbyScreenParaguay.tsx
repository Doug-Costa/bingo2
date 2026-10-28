/**
 * BingoShowLobbyScreenParaguay.tsx — home (próximos sorteios) do tema
 * `bingo-show-paraguay`. Textos em espanhol, valores em guarani (formatador da
 * moeda do tema), Loteria'i como marca principal e Bingo Show Paraguay secundária.
 *
 * Componente de APRESENTAÇÃO: mesmos dados das outras homes
 * (useBingoShowRealtimeLobby → SSE). Nenhuma lógica nova, nenhum dado inventado.
 * Animações respondem aos dados reais (ex.: contador), sem timers próprios.
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useBingoShowRealtimeLobby } from '../hooks/useBingoShowRealtimeLobby';
import { BingoShowAmbientBackground } from '../components/BingoShowAmbientBackground';
import { moneyLengthTier } from '../utils/moneyLength';
import { formatCountdown } from '../utils/countdown';
import type { NextDrawItem } from '../mocks/lobbyMock';
import py from '../components/paraguay/ParaguayTheme.module.css';
import styles from './BingoShowLobbyScreenParaguay.module.css';
import { useT } from '@/contexts/TvConfigContext';

const A = '/themes/bingo-show-paraguay';
const DRAW_PAGE_SIZE = 5;
const DRAW_PAGE_INTERVAL_MS = 6000;
// Mensagem padrão do hook (em português) → versão em espanhol neste tema.

function moneySize(value: string, sizes: [number, number, number]): number {
  const tier = moneyLengthTier(value);
  return tier === 'normal' ? sizes[0] : tier === 'long' ? sizes[1] : sizes[2];
}

/** Valores dos cards de próximos sorteios (coluna de ~119px): guarani pode ter
 * 9+ dígitos ("₲ 150.000.000" = 13 caracteres), então a fonte encolhe por
 * comprimento além das faixas padrão. */
function drawValueSize(value: string): number {
  const len = value.trim().length;
  if (len <= 9) return 22;
  if (len <= 11) return 18;
  if (len <= 12) return 15.5;
  if (len <= 13) return 14;
  return 12;
}

const NextDraws: React.FC<{ draws: NextDrawItem[] }> = ({ draws }) => {
  const t = useT();
  const pages = useMemo(() => {
    const out: NextDrawItem[][] = [];
    for (let i = 0; i < draws.length; i += DRAW_PAGE_SIZE) out.push(draws.slice(i, i + DRAW_PAGE_SIZE));
    return out.length > 0 ? out : [[]];
  }, [draws]);
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (pages.length <= 1) return;
    const t = setInterval(() => setPage((p) => (p + 1) % pages.length), DRAW_PAGE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [pages.length]);
  useEffect(() => {
    if (page >= pages.length) setPage(0);
  }, [page, pages.length]);

  const list = pages[page] ?? [];
  if (list.length === 0) {
    return (
      <div className={styles.drawsEmpty}>
        <Image className={`${py.art} ${styles.emptyHarp}`} src={`${A}/decorative/harpa.png`} alt="" width={150} height={306} sizes="150px" />
        <span>{t('lobby.waitingDraws')}</span>
      </div>
    );
  }
  return (
    <>
      <div key={page} className={styles.drawsList}>
        {list.map((d, i) => {
          const longest = [d.line1Prize, d.line2Prize, d.bingoPrize].reduce((m, v) => (v.length > m.length ? v : m), '');
          const valueSize = drawValueSize(longest);
          return (
            <div key={d.id || i} className={`${styles.drawCard} ${d.isNext ? styles.drawCardNext : ''}`} style={{ '--i': i } as React.CSSProperties}>
              <div className={styles.drawTop}>
                <span className={`${py.goldText} ${styles.drawNumber}`}>{d.number}</span>
                {d.isNext && <span className={styles.nextTag}>{t('lobby.nextTag')}</span>}
                <span className={styles.drawTime}>{d.time}</span>
              </div>
              <div className={styles.drawPrizes}>
                {(
                  [
                    [t('prize.line1'), d.line1Prize],
                    [t('prize.line2'), d.line2Prize],
                    [t('prize.bingo'), d.bingoPrize],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className={styles.drawPrize}>
                    <span className={styles.drawPrizeLabel}>{label}</span>
                    <span className={styles.drawPrizeValue} style={{ fontSize: valueSize }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {pages.length > 1 && (
        <div className={styles.dots}>
          {pages.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === page ? styles.dotOn : ''}`} />
          ))}
        </div>
      )}
    </>
  );
};

type CardTone = 'cobalt' | 'pearl' | 'red';

const PrizeCard: React.FC<{ label: string; value: string; tone: CardTone; art: string; artW: number; artH: number; slot: number }> = ({
  label,
  value,
  tone,
  art,
  artW,
  artH,
  slot,
}) => (
  <div
    className={`${py.panel} ${tone === 'red' ? py.panelRed : tone === 'pearl' ? py.panelPearl : ''} ${styles.prizeCard} ${styles[`card_${tone}`]}`}
    style={{ '--slot': slot } as React.CSSProperties}
  >
    <span className={styles.inspectGlow} />
    <span className={`${py.ribbon} ${styles.prizeTag}`}>{label}</span>
    <Image className={`${py.art} ${styles.prizeArt}`} src={art} alt="" width={artW} height={artH} sizes={`${artW}px`} />
    <div className={styles.prizeValueRow}>
      <span className={`${tone === 'pearl' ? styles.valueNavy : py.goldValue} ${styles.prizeValue}`} style={{ fontSize: moneySize(value, [58, 50, 42]) }}>
        {value}
      </span>
    </div>
  </div>
);

export const BingoShowLobbyScreenParaguay: React.FC = () => {
  const mock = useBingoShowRealtimeLobby();
  const t = useT();
  const secs = Math.max(0, mock.countdownSeconds || 0);
  const countdown = formatCountdown(secs);
  // Contador com hora (H:MM:SS) é mais largo: fonte menor para caber no palco.
  const timerSize = countdown.length > 5 ? 96 : 132;
  // Faixas do contador (respondem ao tempo REAL): globo vibra perto do sorteio.
  const near = secs > 0 && secs <= 30;
  const drawTitle = mock.drawNumberShort && mock.drawNumberShort !== '#---' ? t('draw.numbered', { n: mock.drawNumberShort }) : t('draw.soon');
  const footerText = mock.promotionalMessage;

  return (
    <BingoShowAmbientBackground>
      <div className={`${py.vars} ${styles.screen}`} data-theme="paraguay">
        {/* ─── HEADER ─────────────────────────────────────────────────────── */}
        <header className={`${py.panel} ${py.sweep} ${styles.header}`} style={{ '--sweep-delay': '2s' } as React.CSSProperties}>
          <div className={styles.brand}>
            <Image className={`${py.art} ${styles.logoMain}`} src={`${A}/logos/logo-loteriai.png`} alt="Loteria'i" width={150} height={139} sizes="150px" priority />
          </div>

          <div className={styles.infoGroup}>
            <div className={styles.info} style={{ '--d': '120ms' } as React.CSSProperties}>
              <span className={styles.infoLabel}>{t('lobby.nextDraw')}</span>
              <span className={`${py.goldText} ${styles.infoValue}`}>{mock.drawNumberShort}</span>
            </div>
            <span className={styles.infoSep} />
            <div className={styles.info} style={{ '--d': '220ms' } as React.CSSProperties}>
              <span className={styles.infoLabel}>{t('lobby.date')}</span>
              <span className={styles.infoValuePearl} suppressHydrationWarning>
                {mock.currentDate}
              </span>
            </div>
            <span className={styles.infoSep} />
            <div className={styles.info} style={{ '--d': '320ms' } as React.CSSProperties}>
              <span className={styles.infoLabel}>{t('lobby.time')}</span>
              <span className={styles.infoValuePearl} suppressHydrationWarning>
                {mock.currentTime}
              </span>
            </div>
          </div>

          <div className={styles.headerJackpot} style={{ '--d': '440ms' } as React.CSSProperties}>
            <Image className={`${py.art} ${styles.headerCoins}`} src={`${A}/decorative/moedas-guarani.png`} alt="" width={150} height={96} sizes="150px" />
            <div className={styles.headerJackpotText}>
              <span className={styles.infoLabel}>{t('lobby.specialJackpot')}</span>
              <span key={mock.accumulatedPrize} className={`${py.goldValue} ${styles.headerJackpotValue}`} style={{ fontSize: moneySize(mock.accumulatedPrize, [40, 34, 28]) }}>
                {mock.accumulatedPrize}
              </span>
            </div>
            {mock.hasTriggerBallLimit && (
              <div className={styles.limitBadge}>
                <span className={styles.limitLabel}>{t('lobby.untilBall')}</span>
                <span className={`${py.goldText} ${styles.limitValue}`}>{mock.triggerBallLimit}</span>
              </div>
            )}
          </div>
        </header>

        {/* ─── MAIN ───────────────────────────────────────────────────────── */}
        <main className={styles.main}>
          <section className={`${py.panel} ${py.sweep} ${styles.left}`} style={{ '--sweep-delay': '5s' } as React.CSSProperties}>
            <div className={styles.sectionTitle}>
              <span className={py.goldText}>{t('lobby.nextDraws')}</span>
            </div>
            <div className={py.divider} />
            <NextDraws draws={mock.nextDraws} />
          </section>

          <section className={`${py.panel} ${styles.center}`}>
            <div className={styles.centerTitles}>
              {/* Cuia de tereré como enfeite ao lado do título (fora do fluxo: o
                  título continua centrado no painel). */}
              <span className={styles.titleRow}>
                <span className={`${py.goldText} ${styles.drawTitle}`}>{drawTitle}</span>
                <Image className={`${py.art} ${py.float} ${styles.guampa}`} src={`${A}/decorative/guampa-terere.png`} alt="" width={70} height={105} sizes="70px" />
              </span>
              <span className={styles.startsIn}>{t('lobby.startsIn')}</span>
            </div>

            <div className={styles.stage}>
              <span className={styles.stageNanduti} />
              <div className={styles.hourglassWrap}>
                <Image className={`${py.art} ${styles.hourglass}`} src={`${A}/icons/ampulheta.png`} alt="" width={132} height={208} sizes="132px" />
              </div>
              <div className={styles.timerFrame}>
                <span key={countdown} className={`${py.goldValue} ${styles.timer}`} style={{ fontSize: timerSize }} suppressHydrationWarning>
                  {countdown}
                </span>
              </div>
              <div className={`${styles.globeWrap} ${near ? styles.globeNear : ''}`}>
                <Image className={`${py.art} ${styles.globe}`} src={`${A}/decorative/globo.png`} alt="" width={210} height={195} sizes="210px" />
              </div>
            </div>

            <div className={`${py.panel} ${py.panelRed} ${py.sweep} ${styles.jackpotBand}`} style={{ '--sweep-delay': '7s' } as React.CSSProperties}>
              <Image className={`${py.art} ${styles.bandCoins}`} src={`${A}/decorative/moedas-guarani.png`} alt="" width={150} height={96} sizes="150px" />
              <span className={styles.bandLabel}>{t('prize.jackpot')}</span>
              <span key={mock.accumulatedPrize} className={`${py.goldValue} ${styles.bandValue}`} style={{ fontSize: moneySize(mock.accumulatedPrize, [62, 54, 46]) }}>
                {mock.accumulatedPrize}
              </span>
              <Image className={`${py.art} ${styles.bandLapacho}`} src={`${A}/decorative/lapacho.png`} alt="" width={150} height={78} sizes="150px" />
            </div>
          </section>

          <section className={styles.right}>
            <PrizeCard label={t('prize.line1')} value={mock.line1Prize} tone="cobalt" art={`${A}/sm/decorative/nanduti.png`} artW={110} artH={108} slot={0} />
            <PrizeCard label={t('prize.line2')} value={mock.line2Prize} tone="pearl" art={`${A}/decorative/lapacho.png`} artW={170} artH={88} slot={1} />
            <PrizeCard label={t('prize.bingo')} value={mock.bingoPrize} tone="red" art={`${A}/decorative/moedas-guarani.png`} artW={170} artH={108} slot={2} />
          </section>
        </main>

        {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className={`${py.panel} ${styles.footer}`}>
          <span className={`${py.tricolorLine} ${styles.footerLine}`} />
          <Image className={`${py.art} ${styles.footerHarp}`} src={`${A}/decorative/harpa.png`} alt="" width={36} height={73} sizes="36px" />
          <span className={styles.footerText}>{footerText}</span>
          <Image className={`${py.art} ${styles.footerGuampa}`} src={`${A}/decorative/guampa-terere.png`} alt="" width={46} height={69} sizes="46px" />
          <span className={`${py.tricolorLine} ${styles.footerLine}`} />
        </footer>
      </div>
    </BingoShowAmbientBackground>
  );
};

export default BingoShowLobbyScreenParaguay;

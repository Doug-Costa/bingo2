/**
 * BingoShowLobbyScreenGold.tsx — home (próximos sorteios) do tema `tema-ouro`
 * ("Fortuna": Maneki-Neko dourado, ouro metálico, preto profundo, vermelho laca).
 *
 * Componente de APRESENTAÇÃO: os dados vêm do mesmo hook das outras homes
 * (useBingoShowRealtimeLobby → SSE). Nada de lógica nova, nada inventado:
 * campos ausentes aparecem como os demais temas mostram ("---", R$ 0,00).
 *
 * Assets: só os PNG/GIF de public/themes/tema-ouro (moldura, fundo e ornamentos
 * são CSS). PNGs via next/image (servidos redimensionados para a TV); o GIF do
 * gato vai direto (animação preservada).
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useBingoShowRealtimeLobby } from '../hooks/useBingoShowRealtimeLobby';
import { BingoShowAmbientBackground } from '../components/BingoShowAmbientBackground';
import { moneyLengthTier } from '../utils/moneyLength';
import { formatCountdown } from '../utils/countdown';
import type { NextDrawItem } from '../mocks/lobbyMock';
import gold from '../components/gold/GoldTheme.module.css';
import styles from './BingoShowLobbyScreenGold.module.css';
import { useT } from '@/contexts/TvConfigContext';

const ASSET = '/themes/tema-ouro';
const DRAW_PAGE_SIZE = 5;
const DRAW_PAGE_INTERVAL_MS = 6000;

/** Fonte do valor pela faixa de comprimento do texto formatado (cabe sempre). */
function moneySize(value: string, sizes: [number, number, number]): number {
  const tier = moneyLengthTier(value);
  return tier === 'normal' ? sizes[0] : tier === 'long' ? sizes[1] : sizes[2];
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
    return <div className={styles.drawsEmpty}>{t('lobby.waitingDraws')}</div>;
  }

  return (
    <>
      <div key={page} className={styles.drawsList}>
        {list.map((d, i) => {
          const longest = [d.line1Prize, d.line2Prize, d.bingoPrize].reduce((m, v) => (v.length > m.length ? v : m), '');
          const valueSize = moneySize(longest, [22, 15, 13]);
          return (
            <div
              key={d.id || i}
              className={`${styles.drawCard} ${d.isNext ? styles.drawCardNext : ''}`}
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className={styles.drawTop}>
                <span className={`${gold.goldText} ${styles.drawNumber}`}>{d.number}</span>
                {d.isNext && (
                  <span className={styles.nextTag}>
                    <span className={gold.jadeDot} /> {t('lobby.nextTag')}
                  </span>
                )}
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

const PrizeCard: React.FC<{ label: string; value: string; img: string; imgW: number; imgH: number; hot?: boolean; delay: number }> = ({
  label,
  value,
  img,
  imgW,
  imgH,
  hot = false,
  delay,
}) => (
  <div className={`${gold.panel} ${hot ? gold.panelHot : ''} ${styles.prizeCard}`} style={{ '--d': `${delay}ms` } as React.CSSProperties}>
    <span className={`${gold.lacquer} ${styles.prizeTag}`}>{label}</span>
    <Image className={styles.prizeArt} src={img} alt="" width={imgW} height={imgH} sizes={`${imgW}px`} draggable={false} />
    <div className={styles.prizeValueRow}>
      <span className={`${gold.goldValue} ${styles.prizeValue}`} style={{ fontSize: moneySize(value, [58, 48, 40]) }}>
        {value}
      </span>
    </div>
  </div>
);

export const BingoShowLobbyScreenGold: React.FC = () => {
  const mock = useBingoShowRealtimeLobby();
  const t = useT();

  const countdown = useMemo(() => {
    const total = Math.max(0, mock.countdownSeconds || 0);
    return formatCountdown(total);
  }, [mock.countdownSeconds]);

  return (
    <BingoShowAmbientBackground>
      <div className={`${gold.vars} ${styles.screen}`}>
        {/* ─── HEADER ─────────────────────────────────────────────────────── */}
        <header className={`${gold.panel} ${styles.header}`}>
          <Image className={styles.logo} src={`${ASSET}/logos/logo-bingo-show.png`} alt="Bingo Show" width={290} height={104} sizes="290px" priority />

          <div className={styles.infoGroup}>
            <div className={styles.info}>
              <span className={`${gold.lacquer} ${styles.infoTag}`}>{t('lobby.nextDraw')}</span>
              <span className={`${gold.goldText} ${styles.infoValue}`}>{mock.drawNumberShort}</span>
            </div>
            <span className={styles.infoSep} />
            <div className={styles.info}>
              <span className={`${gold.lacquer} ${styles.infoTag}`}>{t('lobby.date')}</span>
              <span className={styles.infoValueCream} suppressHydrationWarning>
                {mock.currentDate}
              </span>
            </div>
            <span className={styles.infoSep} />
            <div className={styles.info}>
              <span className={`${gold.lacquer} ${styles.infoTag}`}>{t('lobby.time')}</span>
              <span className={styles.infoValueCream} suppressHydrationWarning>
                {mock.currentTime}
              </span>
            </div>
          </div>

          <div className={styles.headerJackpot}>
            <Image className={`${styles.headerBag} ${gold.bagAlive}`} style={{ '--bag-delay': '1.5s' } as React.CSSProperties} src={`${ASSET}/decorative/saco-moedas-pata.png`} alt="" width={120} height={102} sizes="120px" />
            <div className={styles.headerJackpotText}>
              <span className={styles.headerJackpotLabel}>{t('lobby.specialJackpot')}</span>
              <span className={`${gold.goldValue} ${styles.headerJackpotValue}`} style={{ fontSize: moneySize(mock.accumulatedPrize, [40, 34, 28]) }}>
                {mock.accumulatedPrize}
              </span>
            </div>
            {mock.hasTriggerBallLimit && (
              <div className={styles.limitBadge} title={t('lobby.untilBallHint')}>
                <span className={styles.limitLabel}>{t('lobby.untilBall')}</span>
                <span className={`${gold.goldText} ${styles.limitValue}`}>{mock.triggerBallLimit}</span>
              </div>
            )}
          </div>
        </header>

        {/* ─── MAIN ───────────────────────────────────────────────────────── */}
        <main className={styles.main}>
          {/* Próximos sorteios */}
          <section className={`${gold.panel} ${styles.left}`}>
            <div className={styles.sectionTitle}>
              <Image src={`${ASSET}/icons/pata.png`} alt="" width={30} height={25} sizes="30px" />
              <span className={gold.goldText}>{t('lobby.nextDraws')}</span>
              <Image src={`${ASSET}/icons/pata.png`} alt="" width={30} height={25} sizes="30px" />
            </div>
            <div className={gold.divider} />
            <NextDraws draws={mock.nextDraws} />
          </section>

          {/* Palco central: contagem + Maneki-Neko */}
          <section className={`${gold.panel} ${gold.panelHot} ${styles.center}`}>
            <div className={styles.centerTitles}>
              <span className={`${gold.goldText} ${styles.drawTitle}`}>{mock.drawNumber}</span>
              <span className={styles.startsIn}>{t('lobby.startsIn')}</span>
            </div>

            <div className={styles.stage}>
              <span className={styles.stageGlow} />
              <Image className={styles.hourglass} src={`${ASSET}/icons/ampulheta.png`} alt="" width={124} height={188} sizes="124px" />
              <div className={styles.timerFrame}>
                <span className={`${gold.goldValue} ${styles.timer}`} style={{ fontSize: countdown.length > 5 ? 92 : undefined }} suppressHydrationWarning>
                  {countdown}
                </span>
              </div>
              <div className={styles.catFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado (sem otimização) */}
                <img className={styles.cat} src={`${ASSET}/decorative/maneki-neko.gif`} alt="Gato da sorte" draggable={false} />
              </div>
            </div>

            <div className={`${gold.lacquer} ${styles.jackpotBand}`}>
              <Image className={styles.bandArt} src={`${ASSET}/decorative/pilha-moedas.png`} alt="" width={120} height={88} sizes="120px" />
              <span className={styles.bandLabel}>{t('prize.jackpot')}</span>
              <span className={`${gold.goldValue} ${styles.bandValue}`} style={{ fontSize: moneySize(mock.accumulatedPrize, [62, 52, 44]) }}>
                {mock.accumulatedPrize}
              </span>
              <Image className={`${styles.bandArt} ${gold.bagAlive}`} style={{ '--bag-delay': '6s' } as React.CSSProperties} src={`${ASSET}/decorative/saco-moedas-pata.png`} alt="" width={104} height={88} sizes="104px" />
            </div>
          </section>

          {/* Prêmios do próximo sorteio */}
          <section className={styles.right}>
            <PrizeCard label={t('prize.line1')} value={mock.line1Prize} img={`${ASSET}/decorative/pilha-moedas.png`} imgW={150} imgH={110} delay={150} />
            <PrizeCard label={t('prize.line2')} value={mock.line2Prize} img={`${ASSET}/decorative/dinheiro-moedas.png`} imgW={176} imgH={103} delay={300} />
            <PrizeCard label={t('prize.bingo')} value={mock.bingoPrize} img={`${ASSET}/icons/coroa.png`} imgW={140} imgH={115} hot delay={450} />
          </section>
        </main>

        {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className={`${gold.lacquer} ${styles.footer}`}>
          <Image src={`${ASSET}/icons/pata.png`} alt="" width={44} height={36} sizes="44px" />
          <span className={styles.footerText}>{mock.promotionalMessage}</span>
          <Image src={`${ASSET}/icons/pata.png`} alt="" width={44} height={36} sizes="44px" />
        </footer>
      </div>
    </BingoShowAmbientBackground>
  );
};

export default BingoShowLobbyScreenGold;

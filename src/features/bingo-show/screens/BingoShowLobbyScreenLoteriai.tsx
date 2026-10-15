/**
 * BingoShowLobbyScreenLoteriai.tsx — home (próximos sorteios) do tema `loteriai`.
 * Solar, popular e festiva: fundo amarelo, painéis creme, cabeçalhos vermelho/
 * azul/verde, ouro só nos valores. Textos em espanhol, valores em guarani
 * (formatador da moeda do tema).
 *
 * Componente de APRESENTAÇÃO: mesmos dados das outras homes
 * (useBingoShowRealtimeLobby → SSE). Nenhuma lógica nova, nenhum dado inventado.
 * Animações respondem aos dados reais (ex.: contador), sem timers próprios além
 * da paginação dos próximos sorteios (igual às outras homes).
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useBingoShowRealtimeLobby } from '../hooks/useBingoShowRealtimeLobby';
import { BingoShowAmbientBackground } from '../components/BingoShowAmbientBackground';
import { moneyLengthTier } from '../utils/moneyLength';
import { formatCountdown } from '../utils/countdown';
import type { NextDrawItem } from '../mocks/lobbyMock';
import lt from '../components/loteriai/LoteriaiTheme.module.css';
import styles from './BingoShowLobbyScreenLoteriai.module.css';

const A = '/themes/loteriai';
const DRAW_PAGE_SIZE = 3;
const DRAW_PAGE_INTERVAL_MS = 6000;
// Mensagem padrão do hook (em português) → slogan do tema.
const PT_FALLBACK = 'COMPRE SUAS CARTELAS COM OS AGENTES AUTORIZADOS • BOA SORTE!';

function moneySize(value: string, sizes: [number, number, number]): number {
  const tier = moneyLengthTier(value);
  return tier === 'normal' ? sizes[0] : tier === 'long' ? sizes[1] : sizes[2];
}

/** Valor dos cards de prêmio (coluna de 430px, arte ao lado): encolhe pelo
 * comprimento do texto formatado — guarani chega a 13+ caracteres. */
function cardValueSize(value: string): number {
  const len = value.trim().length;
  if (len <= 9) return 54;
  if (len <= 11) return 46;
  if (len <= 13) return 40;
  if (len <= 15) return 34;
  return 28;
}

/** Valores das linhas dos próximos sorteios: guarani pode ter 9+ dígitos. */
function drawValueSize(value: string): number {
  const len = value.trim().length;
  if (len <= 11) return 30;
  if (len <= 13) return 27;
  if (len <= 15) return 23;
  return 20;
}

const NextDraws: React.FC<{ draws: NextDrawItem[] }> = ({ draws }) => {
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
        <Image className={`${lt.art} ${styles.emptyArt}`} src={`${A}/sm/decorative/ferradura.png`} alt="" width={140} height={137} sizes="140px" />
        <span>ESPERANDO PRÓXIMOS SORTEOS</span>
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
                <span className={styles.drawTag}>SORTEO Nº {d.number.replace(/^#/, '')}</span>
                <span className={styles.drawWhen}>
                  {d.isNext && <span className={styles.drawNext}>PRÓXIMO</span>}
                  <span className={styles.drawTime}>{d.time}</span>
                </span>
              </div>
              <div className={styles.drawPrizes}>
                {(
                  [
                    ['1ª LÍNEA', d.line1Prize],
                    ['2ª LÍNEA', d.line2Prize],
                    ["LOTERIA'I", d.bingoPrize],
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

type CardTone = 'blue' | 'red' | 'green';

/** Card de prêmio: cabeçalho colorido + valor. `slot` encadeia o destaque
 * (1ª linha → 2ª linha → prêmio principal → pausa), um card por vez. */
const PrizeCard: React.FC<{ label: string; value: string; tone: CardTone; art: string; artW: number; artH: number; slot: number }> = ({
  label,
  value,
  tone,
  art,
  artW,
  artH,
  slot,
}) => (
  <div className={`${styles.prizeCard} ${styles[`tone_${tone}`]}`} style={{ '--slot': slot } as React.CSSProperties}>
    <div className={styles.prizeHead}>
      <span className={styles.prizeLabel}>{label}</span>
      <span className={styles.prizeSpark} />
    </div>
    <div className={styles.prizeBody}>
      <Image className={`${lt.art} ${styles.prizeArt}`} src={art} alt="" width={artW} height={artH} sizes={`${artW}px`} />
      <span className={styles.prizeValue} style={{ fontSize: cardValueSize(value) }}>
        {value}
      </span>
    </div>
  </div>
);

export const BingoShowLobbyScreenLoteriai: React.FC = () => {
  const mock = useBingoShowRealtimeLobby();
  const secs = Math.max(0, mock.countdownSeconds || 0);
  const countdown = formatCountdown(secs);
  // Contador com hora (H:MM:SS) é mais largo: fonte menor para caber no palco.
  const timerSize = countdown.length > 5 ? 112 : 150;
  // Últimos segundos (tempo REAL): contador ganha um pouco mais de intensidade.
  const final = secs > 0 && secs <= 10;
  const near = secs > 0 && secs <= 30;
  const drawTitle = secs > 0 && secs <= 3600 ? 'SORTEO EN BREVE' : 'PRÓXIMO SORTEO';
  const drawNumber = mock.drawNumberShort && mock.drawNumberShort !== '#---' ? mock.drawNumberShort.replace(/^#/, '') : '---';
  const isSlogan = !mock.promotionalMessage || mock.promotionalMessage === PT_FALLBACK;

  return (
    <BingoShowAmbientBackground>
      <div className={`${lt.vars} ${styles.screen}`} data-theme="loteriai">
        {/* ─── HEADER ─────────────────────────────────────────────────────── */}
        <header className={styles.header}>
          <Image className={`${lt.art} ${styles.logo}`} src={`${A}/sm/logos/logo-loteriai.png`} alt="Loteria'i" width={220} height={204} sizes="220px" priority />

          <div className={styles.infoGroup}>
            <div className={styles.info} style={{ '--d': '120ms' } as React.CSSProperties}>
              <span className={styles.infoLabel}>
                PRÓXIMO
                <br />
                SORTEO
              </span>
              <span className={styles.infoBall}>{drawNumber}</span>
            </div>
            <div className={styles.info} style={{ '--d': '220ms' } as React.CSSProperties}>
              <Image className={`${lt.art} ${styles.infoIcon}`} src={`${A}/sm/decorative/trevo.png`} alt="" width={44} height={46} sizes="44px" />
              <span className={styles.infoText}>
                <span className={styles.infoLabel}>FECHA</span>
                <span className={styles.infoValue} suppressHydrationWarning>
                  {mock.currentDate}
                </span>
              </span>
            </div>
            <div className={styles.info} style={{ '--d': '320ms' } as React.CSSProperties}>
              <Image className={`${lt.art} ${styles.infoIcon}`} src={`${A}/sm/icons/ampulheta.png`} alt="" width={30} height={52} sizes="30px" />
              <span className={styles.infoText}>
                <span className={styles.infoLabel}>HORA</span>
                <span className={styles.infoValue} suppressHydrationWarning>
                  {mock.currentTime}
                </span>
              </span>
            </div>
          </div>

          <div className={`${lt.panel} ${lt.panelRed} ${styles.headerJackpot}`} style={{ '--d': '440ms' } as React.CSSProperties}>
            <div className={styles.headerJackpotText}>
              <span className={styles.headerJackpotLabel}>PREMIO MAYOR</span>
              <span key={mock.accumulatedPrize} className={`${lt.goldValue} ${styles.headerJackpotValue}`} style={{ fontSize: moneySize(mock.accumulatedPrize, [46, 40, 32]) }}>
                {mock.accumulatedPrize}
              </span>
            </div>
            <Image className={`${lt.art} ${styles.headerCoins}`} src={`${A}/sm/decorative/moedas.png`} alt="" width={130} height={81} sizes="130px" />
          </div>
        </header>
        <span className={`${lt.tricolorLine} ${styles.headerLine}`} />

        {/* ─── MAIN ───────────────────────────────────────────────────────── */}
        <main className={styles.main}>
          <section className={`${lt.panel} ${styles.left}`}>
            <div className={styles.sectionHead}>
              <span>PRÓXIMOS SORTEOS</span>
            </div>
            <NextDraws draws={mock.nextDraws} />
          </section>

          <section className={`${lt.panel} ${styles.center}`}>
            <span className={styles.centerRays} />
            <div className={styles.centerTitles}>
              <span className={`${lt.titleText} ${styles.drawTitle}`}>{drawTitle}</span>
              <span className={styles.startsIn}>EL SORTEO COMIENZA EN</span>
            </div>

            <div className={styles.stage}>
              <div className={styles.hourglassWrap}>
                <Image className={`${lt.art} ${styles.hourglass}`} src={`${A}/sm/icons/ampulheta.png`} alt="" width={160} height={276} sizes="160px" />
                <span className={styles.glassGlint} />
              </div>
              <div className={`${lt.shimmer} ${styles.timerFrame} ${final ? styles.timerFinal : ''}`}>
                <span key={countdown.length} className={`${lt.goldValue} ${styles.timer}`} style={{ fontSize: timerSize }} suppressHydrationWarning>
                  {countdown}
                </span>
              </div>
              <div className={`${styles.globeWrap} ${near ? styles.globeNear : ''}`}>
                <Image className={`${lt.art} ${styles.globe}`} src={`${A}/sm/decorative/globo-sorteio.png`} alt="" width={250} height={230} sizes="250px" />
                <span className={styles.globeGlint} />
              </div>
              <Image className={`${lt.art} ${lt.float} ${styles.clover}`} src={`${A}/sm/decorative/trevo.png`} alt="" width={70} height={73} sizes="70px" />
            </div>

            <div className={`${lt.shimmer} ${styles.jackpotBand}`} style={{ '--shimmer-delay': '3s' } as React.CSSProperties}>
              <Image className={`${lt.art} ${styles.bandPot}`} src={`${A}/sm/decorative/pote-premio.png`} alt="" width={160} height={136} sizes="160px" />
              <div className={styles.bandText}>
                <span className={styles.bandLabel}>PREMIO MAYOR ACUMULADO</span>
                <span key={mock.accumulatedPrize} className={styles.bandValue} style={{ fontSize: moneySize(mock.accumulatedPrize, [76, 64, 54]) }}>
                  {mock.accumulatedPrize}
                </span>
              </div>
              {mock.hasTriggerBallLimit && (
                <div className={styles.limitBadge}>
                  <span className={styles.limitLabel}>HASTA LA BOLA</span>
                  <span className={styles.limitValue}>{mock.triggerBallLimit}</span>
                </div>
              )}
            </div>
          </section>

          <section className={styles.right}>
            <PrizeCard label="1ª LÍNEA" value={mock.line1Prize} tone="blue" art={`${A}/sm/decorative/moedas.png`} artW={120} artH={75} slot={0} />
            <PrizeCard label="2ª LÍNEA" value={mock.line2Prize} tone="red" art={`${A}/sm/decorative/moedas.png`} artW={120} artH={75} slot={1} />
            <PrizeCard label="LOTERIA'I" value={mock.bingoPrize} tone="green" art={`${A}/sm/decorative/pote-premio.png`} artW={104} artH={88} slot={2} />
          </section>
        </main>

        {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className={styles.footer}>
          <span className={styles.footerRibbonL} />
          <Image className={`${lt.art} ${styles.footerClover}`} src={`${A}/sm/decorative/trevo.png`} alt="" width={50} height={52} sizes="50px" />
          {isSlogan ? (
            <span className={styles.footerSlogan}>
              <span className={styles.sloganRed}>¡TU SUERTE</span> <span className={styles.sloganBlue}>PUEDE CAMBIAR</span>{' '}
              <span className={styles.sloganRed}>HOY!</span>
            </span>
          ) : (
            <span className={styles.footerText}>{mock.promotionalMessage}</span>
          )}
          <Image className={`${lt.art} ${styles.footerClover}`} src={`${A}/sm/decorative/trevo.png`} alt="" width={50} height={52} sizes="50px" />
          <span className={styles.footerRibbonR} />
        </footer>
      </div>
    </BingoShowAmbientBackground>
  );
};

export default BingoShowLobbyScreenLoteriai;

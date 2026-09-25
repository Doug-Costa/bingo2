'use client';

/**
 * BingoShowLobbyScreenBlue.tsx — Tela Oficial Exclusiva de Lobby para o "Tema Azul Live" (Cassino TV).
 *
 * Palco fixo com Glassmorphism, bordas neon azul safira e douradas,
 * tipografia Barlow Condensed nos contadores e números, e assets tridimensionais (3D).
 */

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { BingoShowAmbientBackground } from '../components/BingoShowAmbientBackground';
import { useBingoShowRealtimeLobby } from '../hooks/useBingoShowRealtimeLobby';
import type { NextDrawItem } from '../mocks/lobbyMock';
import styles from './BingoShowLobbyScreenBlue.module.css';
import { BingoShowBlueBenefitsStrip } from '../components/BingoShowBlueBenefitsStrip';

const DRAW_PAGE_SIZE = 5;
const DRAW_PAGE_INTERVAL_MS = 6000;

/**
 * Reduz o tamanho da fonte do valor do prêmio de forma controlada conforme o
 * comprimento da string ja formatada (vinda do backend/SSE) - evita quebra de
 * linha ou corte em valores grandes sem depender de `vw` (que ignoraria a
 * escala do TvStage) nem de recursos CSS recentes de suporte incerto no
 * WebView alvo (container query units).
 */
function getPrizeAmountFontSize(value: string): number {
  const len = value.length;
  if (len <= 10) return 52;
  if (len <= 13) return 46;
  if (len <= 16) return 40;
  return 34;
}

/**
 * Camada 3 do painel central (partículas): componentes decorativos reais,
 * não gravados na textura de fundo (overlay de raios) - posicionados nas
 * margens laterais do painel, fora do título, contador e acumulado.
 */
const CENTER_PARTICLES: Array<{ left: string; top: string; size: number; duration: number; delay: number; gold?: boolean }> = [
  { left: '9%', top: '24%', size: 4, duration: 9, delay: 0 },
  { left: '91%', top: '21%', size: 3, duration: 11, delay: 1.2 },
  { left: '7%', top: '50%', size: 3, duration: 13, delay: 2.4, gold: true },
  { left: '93%', top: '48%', size: 4, duration: 10, delay: 0.6 },
  { left: '11%', top: '74%', size: 3, duration: 15, delay: 3 },
  { left: '89%', top: '76%', size: 3, duration: 12, delay: 1.8 },
  { left: '16%', top: '36%', size: 2.5, duration: 14, delay: 0.9, gold: true },
  { left: '84%', top: '62%', size: 2.5, duration: 9.5, delay: 2.1 },
];

export const BingoShowLobbyScreenBlue: React.FC = () => {
  const mock = useBingoShowRealtimeLobby();

  // Paginação automática dos Próximos Sorteios (5 por página a cada 6s)
  const pages = useMemo(() => {
    const chunks: NextDrawItem[][] = [];
    const list = mock.nextDraws || [];
    for (let i = 0; i < list.length; i += DRAW_PAGE_SIZE) {
      chunks.push(list.slice(i, i + DRAW_PAGE_SIZE));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [mock.nextDraws]);

  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;
    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % pages.length);
    }, DRAW_PAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pages.length]);

  useEffect(() => {
    if (pageIndex >= pages.length) {
      setPageIndex(0);
    }
  }, [pageIndex, pages.length]);

  // Formatação do relógio MM:SS
  const formattedCountdown = useMemo(() => {
    const totalSecs = Math.max(0, mock.countdownSeconds || 0);
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [mock.countdownSeconds]);

  // =========================================================================
  // 1. RENDER HEADER (Topo Oficial)
  // =========================================================================
  const renderHeader = () => {
    const drawNumberDisplay = mock.drawNumberShort !== '#---' ? mock.drawNumberShort : '#465149';

    return (
      <header className={styles.header}>
        {/* Esquerda: Logo + Pills Informativas com Icons 3D */}
        <div className={styles.headerLeft}>
          <div className={styles.logoWrapper}>
            <Image
              src="/themes/bingo-show-blue/logos/logo-main.png"
              alt="Bingo Show Logo"
              width={160}
              height={60}
              className={styles.logoImage}
              priority
            />
          </div>

          <div className={styles.headerPillsGroup}>
            {/* Pill 1: Próximo Sorteio */}
            <div className={`${styles.pill} ${styles.pillDraw}`}>
              <span className={styles.pillLabel}>PRÓXIMO SORTEIO:</span>
              <span className={styles.pillValue}>{drawNumberDisplay}</span>
            </div>

            {/* Pill 2: Data com Ícone 3D */}
            <div className={`${styles.pill} ${styles.pillDate}`}>
              <span className={styles.pillLabelRow}>
                <Image
                  src="/themes/bingo-show/assets/icons/calendario.png"
                  alt="Calendário 3D"
                  width={16}
                  height={16}
                  className={styles.pillIcon}
                />
                <span className={styles.pillLabel}>DATA</span>
              </span>
              <span className={styles.pillValue}>{mock.currentDate}</span>
            </div>

            {/* Pill 3: Hora com Ícone 3D */}
            <div className={`${styles.pill} ${styles.pillTime}`}>
              <span className={styles.pillLabelRow}>
                <Image
                  src="/themes/bingo-show/assets/icons/relogio.png"
                  alt="Relógio 3D"
                  width={16}
                  height={16}
                  className={styles.pillIcon}
                />
                <span className={styles.pillLabel}>HORA</span>
              </span>
              <span className={styles.pillValue}>{mock.currentTime}</span>
            </div>
          </div>
        </div>

        {/* Direita: Acumulado Especial com Baú de Ouro 3D + Estrela de Limite */}
        <div className={styles.headerRight}>
          <div className={styles.specialJackpotBox}>
            <Image
              src="/themes/bingo-show/assets/icons/bau-ouro.png"
              alt="Baú de Ouro 3D"
              width={64}
              height={48}
              className={styles.chestImage}
            />

            <div className={styles.jackpotTextCol}>
              <span className={styles.jackpotHeaderLabel}>ACUMULADO ESPECIAL:</span>
              <span className={styles.jackpotHeaderValue}>{mock.accumulatedPrize}</span>
            </div>

            <div className={`${styles.starBadge} ${styles.starBadgeFloating}`}>
              <Image
                src="/bingoshow-v2/jackpot/4x/jackpot-star.png"
                alt="Estrela Limite de Bola"
                width={50}
                height={50}
                className={styles.starBgImage}
              />
              {/* Só o trigger ball limit real do backend — sem número inventado. */}
              {mock.hasTriggerBallLimit && <span className={styles.starNumber}>{mock.triggerBallLimit}</span>}
            </div>
          </div>
        </div>
      </header>
    );
  };

  // =========================================================================
  // 2. RENDER COLUNA ESQUERDA (Próximos Sorteios)
  // =========================================================================
  const renderLeftColumn = () => {
    const currentPage = pages[pageIndex] ?? [];
    const hasDraws = currentPage.length > 0;

    return (
      <aside className={styles.leftColumn}>
        <div className={styles.columnHeader}>
          <h2 className={styles.columnTitle}>PRÓXIMOS SORTEIOS</h2>
          <div className={styles.columnDivider} />
        </div>

        {hasDraws ? (
          <div className={styles.drawsList}>
            {currentPage.map((item, idx) => {
              const isHot = Boolean((item as any).hotdraw || idx === 0);
              return (
                <div
                  key={item.id || idx}
                  className={`${styles.drawCard} ${item.isNext ? styles.drawCardActive : ''}`}
                >
                  <div className={styles.drawCardTop}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        className={`${styles.drawCardNumber} ${
                          item.isNext ? styles.drawCardNumberActive : ''
                        }`}
                      >
                        {item.number}
                      </span>
                      {isHot && <span className={styles.hotTag}>[🔥 HOT]</span>}
                    </div>
                    <span className={styles.drawCardTime}>{item.time}</span>
                  </div>

                  <div className={styles.drawCardPrizesRow}>
                    <div className={styles.drawCardPrizeCol}>
                      <span className={`${styles.drawCardPrizeLabel} ${styles.drawCardPrizeLabelGold}`}>
                        1ª LINHA
                      </span>
                      <span className={styles.drawCardPrizeValue}>{item.line1Prize}</span>
                    </div>
                    <div className={styles.drawCardPrizeCol}>
                      <span className={`${styles.drawCardPrizeLabel} ${styles.drawCardPrizeLabelCyan}`}>
                        2ª LINHA
                      </span>
                      <span className={styles.drawCardPrizeValue}>{item.line2Prize}</span>
                    </div>
                    <div className={styles.drawCardPrizeCol}>
                      <span className={`${styles.drawCardPrizeLabel} ${styles.drawCardPrizeLabelGreen}`}>
                        BINGO
                      </span>
                      <span className={styles.drawCardPrizeValue}>{item.bingoPrize}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyDrawsContainer}>
            <div className={styles.emptyDrawsIconWrapper}>
              <Image
                src="/themes/bingo-show/assets/icons/relogio.png"
                alt="Aguardando sorteios"
                width={36}
                height={36}
                className={styles.emptyDrawsIcon}
              />
            </div>
            <p className={styles.emptyDrawsTitle}>NENHUM SORTEIO NA FILA</p>
            <span className={styles.emptyDrawsSub}>Aguardando abertura de novas rodadas</span>

            <div className={styles.drawsSkeletonList}>
              <div className={styles.drawCardSkeleton} />
              <div className={styles.drawCardSkeleton} />
            </div>
          </div>
        )}

        {hasDraws && pages.length > 1 && (
          <div className={styles.carouselDots}>
            {pages.map((_, idx) => (
              <div
                key={idx}
                className={`${styles.dot} ${idx === pageIndex ? styles.dotActive : ''}`}
              />
            ))}
          </div>
        )}
      </aside>
    );
  };

  // =========================================================================
  // 3. RENDER COLUNA CENTRAL (Contador Regressivo & Acumulado)
  // =========================================================================
  // Painel central unico: titulo/subtitulo, palco do relogio (ampulheta +
  // contador + globo) e o acumulado ficam todos dentro do MESMO container
  // visual (borda/glow/fundo do .centerColumn), em vez do acumulado ser uma
  // caixa preta/dourada separada abaixo do painel.
  const renderCenterColumn = () => {
    return (
      <main className={styles.centerColumn}>
        {/* Camada 3: particulas decorativas (atras do conteudo, na frente do
            overlay de raios do ::before) */}
        <div className={styles.centerParticles} aria-hidden="true">
          {CENTER_PARTICLES.map((p, i) => (
            <span
              key={i}
              className={`${styles.centerParticleDot} ${p.gold ? styles.centerParticleDotGold : ''}`}
              style={
                {
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  '--p-duration': `${p.duration}s`,
                  '--p-delay': `${p.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Títulos do Topo */}
        <div className={styles.centerTitlesGroup}>
          <h1 className={styles.centerDrawNumberTitle}>
            {mock.drawNumber || 'SORTEIO EM BREVE'}
          </h1>
          <span className={styles.centerSubTitle}>O SORTEIO COMEÇA EM</span>
        </div>

        {/* Palco do Relógio com Ampulheta 3D, Timer Central e Globo de Bingo GIF em Tamanho Destaque */}
        <div className={styles.clockStageWrapper}>
          {/* Slot Esquerdo: Ampulheta 3D */}
          <div className={styles.clockSideSlot}>
            <Image
              src="/themes/bingo-show-blue/relogio-areia-dourado.png"
              alt="Ampulheta 3D"
              width={159}
              height={226}
              className={styles.decoHourglass}
              priority
            />
          </div>

          {/* Dígitos Gigantes do Relógio (Centro Rigoroso) */}
          <div className={styles.clockDigitsWrapper}>
            <div className={styles.clockDigits}>{formattedCountdown}</div>
          </div>

          {/* Slot Direito: Globo de Bingo Animado GIF (Tamanho Grande de Destaque) */}
          <div className={styles.clockSideSlot}>
            <Image
              src="/themes/bingo-show-blue/globo-bingo.gif"
              alt="Globo de Bingo Animado 3D"
              width={250}
              height={250}
              className={styles.decoGlobeGif}
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Acumulado — agora vive dentro do painel central (mesma borda/glow) */}
        <div className={styles.centerAccumulatedBanner}>
          <Image
            src="/themes/bingo-show/assets/icons/bau-ouro.png"
            alt="Baú Acumulado 3D"
            width={140}
            height={86}
            className={styles.centerAccumulatedChest}
          />

          <div className={styles.centerAccumulatedTextGroup}>
            <span className={styles.centerAccumulatedLabel}>ACUMULADO</span>
            <span
              className={styles.centerAccumulatedValue}
              style={{ fontSize: getPrizeAmountFontSize(mock.accumulatedPrize) }}
            >
              {mock.accumulatedPrize}
            </span>
          </div>

          <div className={styles.centerAccumulatedStarBadge}>
            <Image
              src="/bingoshow-v2/jackpot/4x/jackpot-star.png"
              alt="Estrela Limite"
              width={108}
              height={108}
              className={styles.starBgImage}
            />
            {mock.hasTriggerBallLimit && (
              <span className={styles.centerAccumulatedStarNumber}>{mock.triggerBallLimit}</span>
            )}
          </div>
        </div>
      </main>
    );
  };

  // =========================================================================
  // 4. RENDER COLUNA DIREITA (Prêmios: 1ª Linha, 2ª Linha, Bingo com 3D Coins)
  // =========================================================================
  const renderRightColumn = () => {
    return (
      <section className={styles.rightColumn}>
        {/* CARD 1: 1ª LINHA (Painel Azul-Ciano Elétrico) */}
        <div className={`${styles.prizeCard} ${styles.prizeCardLine1}`}>
          <div className={styles.prizeTop}>
            <div className={`${styles.prizeBadge} ${styles.prizeBadgeLine1}`}>
              1ª LINHA
            </div>
            <Image
              src="/themes/bingo-show/assets/icons/moedas-pilha.png"
              alt=""
              aria-hidden="true"
              width={170}
              height={152}
              className={styles.prizeCoins}
            />
          </div>
          <div className={styles.prizeDivider} aria-hidden="true" />
          <div className={styles.prizeAmount} style={{ fontSize: getPrizeAmountFontSize(mock.line1Prize) }}>
            {mock.line1Prize}
          </div>
        </div>

        {/* CARD 2: 2ª LINHA (Painel Dourado/Âmbar) */}
        <div className={`${styles.prizeCard} ${styles.prizeCardLine2}`}>
          <div className={styles.prizeTop}>
            <div className={`${styles.prizeBadge} ${styles.prizeBadgeLine2}`}>
              2ª LINHA
            </div>
            <Image
              src="/themes/bingo-show/assets/icons/moedas-pilha.png"
              alt=""
              aria-hidden="true"
              width={170}
              height={152}
              className={styles.prizeCoins}
            />
          </div>
          <div className={styles.prizeDivider} aria-hidden="true" />
          <div className={styles.prizeAmount} style={{ fontSize: getPrizeAmountFontSize(mock.line2Prize) }}>
            {mock.line2Prize}
          </div>
        </div>

        {/* CARD 3: BINGO (Painel Verde-Esmeralda com Acabamento Dourado) */}
        <div className={`${styles.prizeCard} ${styles.prizeCardBingo}`}>
          <div className={styles.prizeTop}>
            <div className={`${styles.prizeBadge} ${styles.prizeBadgeBingo}`}>
              BINGO
            </div>
            <Image
              src="/themes/bingo-show/assets/icons/moedas-pilha.png"
              alt=""
              aria-hidden="true"
              width={170}
              height={152}
              className={styles.prizeCoins}
            />
          </div>
          <div className={styles.prizeDivider} aria-hidden="true" />
          <div className={styles.prizeAmount} style={{ fontSize: getPrizeAmountFontSize(mock.bingoPrize) }}>
            {mock.bingoPrize}
          </div>
        </div>
      </section>
    );
  };

  return (
    <BingoShowAmbientBackground brightness="light">
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.mainBody}>
          {renderLeftColumn()}
          {renderCenterColumn()}
          {renderRightColumn()}
        </div>
        {/* Faixa de benefícios dentro do painel inferior (mesmo tamanho de antes). */}
        <div className={styles.bottomSection}>
          <BingoShowBlueBenefitsStrip />
        </div>
      </div>
    </BingoShowAmbientBackground>
  );
};

export default BingoShowLobbyScreenBlue;

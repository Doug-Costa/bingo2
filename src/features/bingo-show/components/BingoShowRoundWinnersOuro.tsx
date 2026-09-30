/**
 * BingoShowRoundWinnersOuro.tsx — resumo "Ganhadores da Rodada" SOMENTE no tema
 * Bingo Show (Ouro & Espaço, id `bingo-show`). Mesma interface do resumo Blue
 * (mesmos ganhadores deduplicados, mesmos valores do backend, mesmo tempo total e
 * mesma paginação) — só a apresentação muda, no acabamento dos cards do tema.
 * Estilos em BingoShowRoundWinnersOuro.module.css.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useFitText } from '../hooks/useFitText';
import { useCountUp } from '../hooks/useCountUp';
import { BingoShowAssets } from '../assets';
import type { BingoShowRoundWinnersBlueProps, RoundCategoryKey, RoundCategoryView, RoundWinnerView } from './BingoShowRoundWinnersBlue';
import goldStyles from './goldMetalText.module.css';
import styles from './BingoShowRoundWinnersOuro.module.css';

const TITLES: Record<RoundCategoryKey, string> = { line1: '1ª LINHA', line2: '2ª LINHA', bingo: 'BINGO' };
const TONE: Record<RoundCategoryKey, string> = { line1: styles.gold ?? '', line2: styles.cyan ?? '', bingo: styles.green ?? '' };
const PER_PAGE = 4;
const MIN_PAGE_MS = 5000;

// Tipografia por quantidade de cards na coluna (px): [máx, mín] do useFitText.
const SIZES: Record<1 | 2 | 3 | 4, { name: [number, number]; value: [number, number]; coupon: number }> = {
  1: { name: [52, 30], value: [60, 34], coupon: 20 },
  2: { name: [40, 26], value: [46, 30], coupon: 17 },
  3: { name: [32, 22], value: [36, 24], coupon: 15 },
  4: { name: [28, 20], value: [30, 22], coupon: 14 },
};

const RoundCard: React.FC<{ w: RoundWinnerView; label: string; mode: 1 | 2 | 3 | 4; delay: number; jackpotAmount?: string }> = ({
  w,
  label,
  mode,
  delay,
  jackpotAmount,
}) => {
  const sz = SIZES[mode];
  const name = useFitText(w.name, sz.name[0], sz.name[1]);
  const value = useFitText(w.prize, sz.value[0], sz.value[1]);
  const counting = useCountUp(w.prize, delay + 400, 1600);
  return (
    <div className={styles.card} style={{ '--d-card': `${delay}ms` } as React.CSSProperties}>
      <span className={styles.cardLabel}>{label}</span>
      <div className={styles.nameBox} data-fit-box>
        <span ref={name.ref} className={`${styles.name} ${name.wrap ? styles.nameWrap : ''}`} style={{ fontSize: name.size }}>
          {w.name}
        </span>
      </div>
      {w.coupon && (
        <span className={styles.coupon} style={{ fontSize: sz.coupon }}>
          CUPOM {w.coupon}
        </span>
      )}
      <div className={styles.valueCapsule}>
        <div className={styles.valueBox} data-fit-box>
          <span ref={value.ref} aria-hidden="true" className={`${styles.value} ${goldStyles.goldValueActive}`} style={{ position: 'absolute', visibility: 'hidden', fontSize: value.size }}>
            {w.prize}
          </span>
          <span className={`${styles.value} ${goldStyles.goldValueActive}`} style={{ fontSize: value.size }} aria-label={w.prize}>
            {counting}
          </span>
        </div>
      </div>
      {w.jackpot && <span className={styles.jackpotTag}>+ ACUMULADO{jackpotAmount ? ` ${jackpotAmount}` : ''}</span>}
    </div>
  );
};

const Column: React.FC<{ category: RoundCategoryView; index: number; jackpotAmount?: string; totalDurationMs: number }> = ({
  category,
  index,
  jackpotAmount,
  totalDurationMs,
}) => {
  const total = category.winners.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const [page, setPage] = useState(0);
  const [turns, setTurns] = useState(0);

  // Mesma rotação do resumo Blue: só com mais de 4 ganhadores na faixa, dividindo o
  // tempo real do resumo, com mínimo de leitura por página.
  useEffect(() => {
    setPage(0);
    if (pages <= 1) return;
    const pageMs = Math.max(MIN_PAGE_MS, totalDurationMs / pages);
    const t = setInterval(() => {
      setPage((p) => (p + 1) % pages);
      setTurns((n) => n + 1);
    }, pageMs);
    return () => clearInterval(t);
  }, [pages, totalDurationMs]);

  const isSplit = total > 1;
  const start = page * PER_PAGE;
  const list = category.winners.slice(start, start + PER_PAGE);
  const mode = Math.max(1, Math.min(4, list.length)) as 1 | 2 | 3 | 4;
  const firstShow = turns === 0;
  const dCol = 350 + index * 130;
  const dTitle = dCol + 300;

  return (
    <div className={`${styles.column} ${TONE[category.key]}`} style={{ '--d-col': `${dCol}ms`, '--d-title': `${dTitle}ms` } as React.CSSProperties}>
      <div className={styles.titleCapsule}>
        <span className={styles.title}>{TITLES[category.key]}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset estático do tema */}
      <img className={`${styles.coins} ${isSplit ? styles.coinsSmall : ''}`} src={BingoShowAssets.decorative.coinStack} alt="" draggable={false} />
      {isSplit && (
        <div className={styles.splitBand}>
          <span>
            PRÊMIO DIVIDIDO • <span className={styles.splitCount}>{total} GANHADORES</span>
          </span>
          {pages > 1 && (
            <span className={styles.pagePill}>
              {page + 1}/{pages}
            </span>
          )}
        </div>
      )}

      {total === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyStar}>★</span>
          <span>NENHUM GANHADOR</span>
          <span>NESTA FAIXA</span>
        </div>
      ) : (
        <div key={page} className={`${styles.cards} ${mode >= 3 ? styles.cardsTop : ''}`}>
          {list.map((w, j) => (
            <RoundCard
              key={w.id}
              w={w}
              label={isSplit ? `GANHADOR ${start + j + 1}/${total}` : '★ GANHADOR CONTEMPLADO ★'}
              mode={mode}
              delay={firstShow ? dTitle + 350 + j * 160 : 80 + j * 120}
              jackpotAmount={jackpotAmount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const BingoShowRoundWinnersOuro: React.FC<BingoShowRoundWinnersBlueProps> = ({
  drawNumber,
  dateStr,
  timeStr,
  categories,
  jackpotAmount,
  totalDurationMs,
  onClose,
}) => (
  <div className={styles.root} role="dialog" aria-label="Ganhadores da rodada">
    {/* eslint-disable-next-line @next/next/no-img-element -- asset estático do tema */}
    <img className={styles.confetti} src={BingoShowAssets.particles.confetti} alt="" />

    <div className={styles.layout}>
      <header className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element -- asset estático do tema */}
        <img className={styles.logo} src={BingoShowAssets.logos.badge} alt="Bingo Show" draggable={false} />
        <div className={styles.headerCenter}>
          <div className={styles.headerTitle}>
            <span>🏆</span>
            <span className={goldStyles.goldMetalText}>GANHADORES DA RODADA</span>
            <span>🏆</span>
          </div>
          <span className={styles.headerSub}>
            SORTEIO {drawNumber} • {dateStr} às {timeStr}
          </span>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </header>

      <div className={styles.columns}>
        {categories.map((c, i) => (
          <Column key={c.key} category={c} index={i} jackpotAmount={jackpotAmount} totalDurationMs={totalDurationMs} />
        ))}
      </div>

      <footer className={styles.footer}>BINGO SHOW • RESULTADOS DA RODADA</footer>
    </div>
  </div>
);

export default BingoShowRoundWinnersOuro;

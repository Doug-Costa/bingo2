/**
 * BingoShowRoundWinnersBlue.tsx — tela final "Ganhadores da Rodada" no tema
 * Bingo Show Blue: três pódios televisivos (1ª linha, 2ª linha, bingo).
 *
 * Componente PURAMENTE VISUAL. Ganhadores (já deduplicados), nomes, cupons, valores
 * individuais (exatamente como o backend mandou — nada é somado ou dividido aqui),
 * split e o tempo total da tela chegam prontos do BingoShowWinnerPopup.
 *
 * Paginação: até 4 cards por página por categoria. As páginas se dividem no tempo em
 * que a tela fica REALMENTE visível — o menor entre o tempo do popup e os 20s em que
 * o LoopScreen segura o resumo antes de voltar ao lobby/próximo sorteio — para que
 * todas apareçam antes da saída (nenhum ganhador fica sem ser mostrado). Os tempos
 * em si não mudam. A sequência de entrada
 * roda uma vez por rodada (o popup monta com `key` = sorteio + ganhadores); troca de
 * página só reanima os cards daquela coluna, com transição curta.
 *
 * Assets: somente existentes (logo Blue, trevo, estrela 45). Confete, partículas,
 * silhueta de estrela e ornamentos são CSS (os PNGs de partícula têm fundo opaco; não
 * há asset de troféu/coroa/louros).
 */
'use client';

import React, { useEffect, useState } from 'react';
import { BingoShowAssets } from '../assets';
import { useFitText } from '../hooks/useFitText';
import { FINISH_SCREEN_HOLD_MS } from '../timing';
import goldStyles from './goldMetalText.module.css';
import styles from './BingoShowRoundWinnersBlue.module.css';

export type RoundCategoryKey = 'line1' | 'line2' | 'bingo';

export interface RoundWinnerView {
  id: string;
  name: string;
  coupon: string;
  prize: string;
  jackpot: boolean;
}

export interface RoundCategoryView {
  key: RoundCategoryKey;
  winners: RoundWinnerView[];
}

export interface BingoShowRoundWinnersBlueProps {
  drawNumber: string;
  dateStr: string;
  timeStr: string;
  categories: RoundCategoryView[];
  jackpotAmount?: string;
  /** Tempo total da tela (calculado pelo popup) — base da rotação de páginas. */
  totalDurationMs: number;
  onClose: () => void;
}

const TITLES: Record<RoundCategoryKey, string> = { line1: '1ª LINHA', line2: '2ª LINHA', bingo: 'BINGO' };
const TONE: Record<RoundCategoryKey, string> = { line1: styles.gold ?? '', line2: styles.cyan ?? '', bingo: styles.green ?? '' };
const PER_PAGE = 4;
const MIN_PAGE_MS = 5000;

// Tipografia por quantidade de cards na página (px). Nome e valor encolhem só se
// não couberem (useFitText), nunca abaixo do mínimo de leitura em TV.
const MODE = {
  1: { label: 22, name: [54, 30], coupon: 28, plabel: 20, value: [88, 46] },
  2: { label: 18, name: [42, 26], coupon: 23, plabel: 16, value: [60, 34] },
  3: { label: 16, name: [32, 22], coupon: 19, plabel: 14, value: [44, 28] },
  4: { label: 14, name: [26, 20], coupon: 17, plabel: 13, value: [34, 22] },
} as const;

// Confete só nas extremidades — lista fixa (sem Math.random no render).
const CONFETTI = [
  { x: 1.5, c: '#ffd23f', d: 300, dur: 1800, r: 520, dx: 40 },
  { x: 4, c: '#2fa8ff', d: 520, dur: 1700, r: -420, dx: -30 },
  { x: 6.5, c: '#ffffff', d: 760, dur: 1900, r: 380, dx: 50 },
  { x: 2.5, c: '#21ec8c', d: 1100, dur: 1700, r: -480, dx: 20 },
  { x: 8, c: '#ffe066', d: 1400, dur: 1600, r: 440, dx: -40 },
  { x: 5, c: '#20dfff', d: 1700, dur: 1500, r: -360, dx: 30 },
  { x: 98.5, c: '#ffd23f', d: 360, dur: 1800, r: -520, dx: -40 },
  { x: 96, c: '#20dfff', d: 580, dur: 1700, r: 420, dx: 30 },
  { x: 93.5, c: '#ffffff', d: 820, dur: 1900, r: -380, dx: -50 },
  { x: 97.5, c: '#21ec8c', d: 1160, dur: 1700, r: 480, dx: -20 },
  { x: 92, c: '#ffe066', d: 1460, dur: 1600, r: -440, dx: 40 },
  { x: 95, c: '#2fa8ff', d: 1760, dur: 1500, r: 360, dx: -30 },
];

// Partículas subindo dentro de cada pódio (6 por pódio), discretas e lentas.
const PARTICLES = [
  { x: 10, d: 1600, dur: 6800 },
  { x: 26, d: 2600, dur: 7600 },
  { x: 42, d: 2100, dur: 7200 },
  { x: 60, d: 3200, dur: 8000 },
  { x: 76, d: 1900, dur: 7000 },
  { x: 90, d: 2900, dur: 7800 },
];

const RoundCard: React.FC<{
  winner: RoundWinnerView;
  indexLabel: string;
  isSplit: boolean;
  mode: 1 | 2 | 3 | 4;
  jackpotAmount?: string;
  delays: { card: number; value: number; flash: number };
}> = ({ winner, indexLabel, isSplit, mode, jackpotAmount, delays }) => {
  const m = MODE[mode];
  const name = useFitText(winner.name, m.name[0], m.name[1], 'ellipsis');
  const value = useFitText(winner.prize, m.value[0], m.value[1], 'ellipsis');

  return (
    <div
      className={styles.card}
      style={
        {
          '--label': `${m.label}px`,
          '--coupon': `${m.coupon}px`,
          '--plabel': `${m.plabel}px`,
          '--d-card': `${delays.card}ms`,
          '--d-value': `${delays.value}ms`,
          '--d-flash': `${delays.flash}ms`,
          '--shine-delay': `${delays.card + 300}ms`,
        } as React.CSSProperties
      }
    >
      <span className={styles.cardFlash} />
      <span className={styles.winnerLabel}>{indexLabel}</span>
      <div className={styles.fitBox} data-fit-box>
        <div className={styles.nameGlow}>
          <span ref={name.ref} className={styles.name} style={{ fontSize: name.size }}>
            {winner.name}
          </span>
        </div>
      </div>
      {winner.coupon && <span className={styles.coupon}>CUPOM {winner.coupon}</span>}
      {mode <= 2 && (
        <span className={styles.cardDivider}>
          <span className={goldStyles.goldIcon}>★</span>
        </span>
      )}
      <span className={styles.prizeLabel}>{isSplit ? 'PRÊMIO INDIVIDUAL' : 'PRÊMIO DO GANHADOR'}</span>
      <div className={styles.fitBox} data-fit-box>
        <div className={styles.valueGlow}>
          <span ref={value.ref} className={styles.value} style={{ fontSize: value.size }}>
            {winner.prize}
          </span>
        </div>
      </div>
      {winner.jackpot && jackpotAmount && (
        <span className={styles.jackpotTag}>
          <img className={styles.jackpotStar} src={BingoShowAssets.jackpot.star} alt="" draggable={false} />
          + ACUMULADO {jackpotAmount}
        </span>
      )}
    </div>
  );
};

const Podium: React.FC<{
  category: RoundCategoryView;
  index: number;
  jackpotAmount?: string;
  totalDurationMs: number;
}> = ({ category, index, jackpotAmount, totalDurationMs }) => {
  const total = category.winners.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const [page, setPage] = useState(0);
  const [turns, setTurns] = useState(0);

  // Rotação só quando há mais de 4 ganhadores. Janela = tempo em que o resumo fica
  // visível de fato (o LoopScreen volta ao lobby aos FINISH_SCREEN_HOLD_MS), com um
  // mínimo de leitura por página. Com 4 por página, 20s mostram até 16 ganhadores
  // por categoria a 5s cada.
  useEffect(() => {
    setPage(0);
    if (pages <= 1) return;
    const visibleMs = Math.min(totalDurationMs, FINISH_SCREEN_HOLD_MS);
    const pageMs = Math.max(MIN_PAGE_MS, visibleMs / pages);
    const timer = setInterval(() => {
      setPage((p) => (p + 1) % pages);
      setTurns((t) => t + 1);
    }, pageMs);
    return () => clearInterval(timer);
  }, [pages, totalDurationMs]);

  const isSplit = total > 1;
  const start = page * PER_PAGE;
  const pageWinners = category.winners.slice(start, start + PER_PAGE);
  const mode = Math.max(1, Math.min(4, pageWinners.length)) as 1 | 2 | 3 | 4;
  const firstShow = turns === 0;

  const dPodium = 500 + index * 130;
  const dTitle = 850 + index * 120;
  const dFinal = 2800 + index * 150;

  return (
    <div
      className={`${styles.podiumWrap} ${TONE[category.key]}`}
      style={
        {
          '--d-podium': `${dPodium}ms`,
          '--d-title': `${dTitle}ms`,
          '--d-split': `${2000 + index * 100}ms`,
          '--d-final': `${dFinal}ms`,
          '--shine-delay': `${dTitle + 500}ms`,
        } as React.CSSProperties
      }
    >
      <span className={styles.baseLight} />
      <span className={styles.podiumBase} />
      <div className={`${styles.podium} ${total === 0 ? styles.podiumEmpty : ''}`}>
        <span className={styles.spots} />
        <span className={styles.silhouette} />
        <span className={styles.frameSweep} />
        {total > 0 &&
          PARTICLES.map((p, i) => (
            <span
              key={i}
              className={styles.particle}
              style={{ left: `${p.x}%`, '--delay': `${p.d + index * 150}ms`, '--dur': `${p.dur}ms` } as React.CSSProperties}
            />
          ))}

        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <span className={styles.ornament} />
            {category.key === 'bingo' && <img className={styles.clover} src="/themes/bingo-show-blue/trevo.png" alt="" draggable={false} />}
            <div className={styles.titleCapsule}>
              <div className={styles.headingGlow}>
                <span className={styles.heading}>{TITLES[category.key]}</span>
              </div>
            </div>
            {category.key === 'bingo' && <img className={styles.clover} src="/themes/bingo-show-blue/trevo.png" alt="" draggable={false} />}
            <span className={`${styles.ornament} ${styles.ornamentRight}`} />
          </div>
          {isSplit && (
            <div className={styles.splitBand} style={{ '--shine-delay': `${2000 + index * 100 + 200}ms` } as React.CSSProperties}>
              <span className={styles.splitBolt}>⚡</span>
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
        </div>

        {total === 0 ? (
          <div className={styles.empty} style={{ '--d-card': `${1100 + index * 120}ms` } as React.CSSProperties}>
            <span>NENHUM GANHADOR</span>
            <span>NESTA CATEGORIA</span>
          </div>
        ) : (
          <div key={page} className={`${styles.cards} ${styles[`mode${mode}`]}`}>
            {pageWinners.map((w, j) => {
              const card = firstShow ? 1100 + index * 120 + j * 180 : 80 + j * 120;
              const value = firstShow ? Math.max(card + 400, 1500 + index * 150 + j * 180) : card + 300;
              const flash = firstShow ? 2200 + index * 150 + j * 200 : card + 500;
              const node = (
                <RoundCard
                  key={w.id}
                  winner={w}
                  indexLabel={isSplit ? `GANHADOR ${start + j + 1}/${total}` : 'GANHADOR CONTEMPLADO'}
                  isSplit={isSplit}
                  mode={mode}
                  jackpotAmount={jackpotAmount}
                  delays={{ card, value, flash }}
                />
              );
              // 2 ganhadores: divisor ornamental entre os dois cards.
              if (mode === 2 && j === 1) {
                return (
                  <React.Fragment key={w.id}>
                    <span className={styles.divider} style={{ '--d-divider': `${card - 60}ms` } as React.CSSProperties}>
                      <span className={styles.dividerStar}>★</span>
                    </span>
                    {node}
                  </React.Fragment>
                );
              }
              return node;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const BingoShowRoundWinnersBlue: React.FC<BingoShowRoundWinnersBlueProps> = ({
  drawNumber,
  dateStr,
  timeStr,
  categories,
  jackpotAmount,
  totalDurationMs,
  onClose,
}) => (
  <div className={styles.root} role="dialog" aria-label="Ganhadores da rodada">
    <div className={styles.vignette} />
    {CONFETTI.map((p, i) => (
      <span
        key={i}
        className={styles.confetti}
        style={
          {
            left: `${p.x}%`,
            background: p.c,
            '--delay': `${p.d}ms`,
            '--dur': `${p.dur}ms`,
            '--rot': `${p.r}deg`,
            '--drift': `${p.dx}px`,
          } as React.CSSProperties
        }
      />
    ))}

    <div className={styles.layout}>
      <header className={styles.header}>
        <img className={styles.logo} src="/themes/bingo-show-blue/logos/logo-main.png" alt="Bingo Show" draggable={false} />
        <div className={styles.headerCenter}>
          <div className={styles.headerTitle}>
            <span>🏆</span>
            <span className={goldStyles.goldMetalText}>GANHADORES DA RODADA DO BINGO SHOW</span>
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

      <div className={styles.podiums}>
        {categories.map((c, i) => (
          <Podium key={c.key} category={c} index={i} jackpotAmount={jackpotAmount} totalDurationMs={totalDurationMs} />
        ))}
      </div>

      <footer className={styles.footer}>BINGO SHOW • RESULTADOS DA RODADA</footer>
    </div>
  </div>
);

export default BingoShowRoundWinnersBlue;

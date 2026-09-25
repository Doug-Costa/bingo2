/**
 * BingoShowWinnerPresentationBlue.tsx — popup individual de ganhador no tema
 * Bingo Show Blue ("cerimônia de premiação").
 *
 * Componente PURAMENTE VISUAL: não decide nada. Nome, cupom, valor, selo e as
 * linhas vencedoras da cartela chegam prontos do BingoShowWinnerPopup (mesma fila,
 * mesmos tempos, mesma regra `computeRowsToPaint` usada pelos outros temas).
 *
 * A sequência de animação roda uma vez na montagem. O popup monta este componente
 * com `key` = sorteio + ganhador, então só uma NOVA vitória reinicia a
 * apresentação — re-renders do relógio/SSE não.
 *
 * Assets: apenas imagens já existentes no projeto (estrela 45, baú e pilha de
 * moedas de BingoShowAssets). Confete e partículas são CSS: os PNGs de partícula
 * do projeto têm fundo escuro opaco, então não são usados aqui.
 */
'use client';

import React from 'react';
import { BingoShowAssets } from '../assets';
import { useFitText } from '../hooks/useFitText';
import goldStyles from './goldMetalText.module.css';
import styles from './BingoShowWinnerPresentationBlue.module.css';

export type WinnerPresentationKind = 'line1' | 'line2' | 'bingo' | 'jackpot';

export interface BingoShowWinnerPresentationBlueProps {
  kind: WinnerPresentationKind;
  /** Texto do selo (vem de getPrizeDisplay — nunca fixo aqui). */
  sealText: string;
  displayName: string;
  couponText: string;
  prizeLabel: string;
  prizeValue: string;
  /** Valor do acumulado quando o ganhador levou o jackpot. */
  jackpotAmount?: string;
  /** Cartela real do ganhador (linhas × 5 colunas), se o backend enviou. */
  cardNumbers?: number[][];
  /** Índices das linhas vencedoras, pela regra `computeRowsToPaint`. */
  paintedRows?: number[];
}

// Confete só nas extremidades (x em % da largura) — lista fixa, determinística.
const CONFETTI = [
  { x: 2, c: '#ffd23f', d: 1700, dur: 1500, r: 540, dx: 40 },
  { x: 5, c: '#2fa8ff', d: 1820, dur: 1400, r: -420, dx: -30 },
  { x: 8, c: '#ffffff', d: 1760, dur: 1600, r: 380, dx: 60 },
  { x: 11, c: '#ffb53a', d: 1900, dur: 1450, r: -500, dx: 20 },
  { x: 14, c: '#00d2ff', d: 2000, dur: 1350, r: 460, dx: -40 },
  { x: 3.5, c: '#ffe066', d: 2080, dur: 1500, r: -360, dx: 50 },
  { x: 16, c: '#ffd23f', d: 2150, dur: 1300, r: 420, dx: 10 },
  { x: 84, c: '#ffd23f', d: 1720, dur: 1500, r: -540, dx: -40 },
  { x: 87, c: '#00d2ff', d: 1840, dur: 1450, r: 400, dx: 30 },
  { x: 90, c: '#ffffff', d: 1780, dur: 1600, r: -380, dx: -60 },
  { x: 93, c: '#ffb53a', d: 1920, dur: 1400, r: 500, dx: -20 },
  { x: 96, c: '#2fa8ff', d: 2020, dur: 1350, r: -460, dx: 40 },
  { x: 98.5, c: '#ffe066', d: 2100, dur: 1500, r: 360, dx: -50 },
  { x: 85.5, c: '#ffd23f', d: 2170, dur: 1300, r: -420, dx: -10 },
];

// Partículas douradas subindo devagar (ficam, discretas, no estado estável).
const DUST = [
  { x: 4, d: 1800, dur: 7200 },
  { x: 9, d: 3100, dur: 8400 },
  { x: 13, d: 2400, dur: 6800 },
  { x: 18, d: 4200, dur: 9000 },
  { x: 24, d: 2900, dur: 7600 },
  { x: 76, d: 2100, dur: 7000 },
  { x: 81, d: 3600, dur: 8800 },
  { x: 87, d: 2600, dur: 7400 },
  { x: 92, d: 3900, dur: 8200 },
  { x: 97, d: 2300, dur: 6900 },
  { x: 45, d: 5200, dur: 9600 },
  { x: 58, d: 4600, dur: 9200 },
];

// Tempos da cartela (ms desde a montagem) — ver linha do tempo no CSS.
const CELL_IN_START = 1180;
const WIN_START = 1500;

export const BingoShowWinnerPresentationBlue: React.FC<BingoShowWinnerPresentationBlueProps> = ({
  kind,
  sealText,
  displayName,
  couponText,
  prizeLabel,
  prizeValue,
  jackpotAmount,
  cardNumbers,
  paintedRows = [],
}) => {
  const name = useFitText(displayName, 92, 52);
  const prize = useFitText(prizeValue, 118, 64);

  const hasCard = Array.isArray(cardNumbers) && cardNumbers.length > 0;
  const winRows = new Set(paintedRows);
  const isFullCard = hasCard && winRows.size >= cardNumbers!.length;
  // Bingo completo acende rápido (≤ ~1,5s no total); linhas, ~110ms por célula.
  const winStep = isFullCard ? 55 : 110;

  // Ordem de acendimento: linhas vencedoras de cima para baixo, esquerda→direita.
  const winOrder = new Map<string, number>();
  let seq = 0;
  if (hasCard) {
    cardNumbers!.forEach((row, r) => {
      if (!winRows.has(r)) return;
      row.forEach((_, c) => winOrder.set(`${r}-${c}`, seq++));
    });
  }
  const lastWinDelay = WIN_START + Math.max(seq - 1, 0) * winStep + 360;

  return (
    <div className={`${styles.root} ${styles[`kind_${kind}`]}`} role="dialog" aria-label={`${sealText}: ${displayName}`}>
      <div className={styles.rays} />
      <div className={styles.dots} />
      <div className={styles.vignette} />

      {CONFETTI.map((p, i) => (
        <span
          key={`c${i}`}
          className={styles.confetti}
          style={
            {
              left: `${p.x}%`,
              background: p.c,
              '--delay': `${p.d}ms`,
              '--dur': `${p.dur}ms`,
              '--rot': `${p.r}deg`,
              '--drift': `${p.dx}px`,
              '--fall': '1160px',
            } as React.CSSProperties
          }
        />
      ))}
      {DUST.map((p, i) => (
        <span
          key={`d${i}`}
          className={styles.dust}
          style={{ left: `${p.x}%`, '--delay': `${p.d}ms`, '--dur': `${p.dur}ms` } as React.CSSProperties}
        />
      ))}

      <div className={styles.frame}>
        <span className={`${styles.edgeLight} ${styles.edgeTop}`} />
        <span className={`${styles.edgeLight} ${styles.edgeBottom}`} />
        <span className={styles.frameFlash} />

        {/* GANHADOR */}
        <div className={styles.winner} data-fit-box>
          <div className={styles.winnerTitle}>
            <span className={`${goldStyles.goldIcon} ${styles.titleStar}`}>★</span>
            <span className={goldStyles.goldMetalTextCompact}>GANHADOR CONTEMPLADO</span>
            <span className={`${goldStyles.goldIcon} ${styles.titleStar}`}>★</span>
          </div>

          <div className={styles.nameShadow}>
            <span
              ref={name.ref}
              className={`${styles.name} ${name.wrap ? styles.nameWrap : ''}`}
              style={{ fontSize: name.size, display: 'block' }}
            >
              {displayName}
            </span>
          </div>

          {couponText && (
            <div className={styles.coupon}>
              <span className={goldStyles.goldMetalTextCompact}>CUPOM {couponText}</span>
            </div>
          )}

          <span className={styles.prizeLabel}>{prizeLabel}</span>

          <div className={styles.prizeRow}>
            <img className={styles.star} src={BingoShowAssets.jackpot.star} alt="" draggable={false} />
            <div className={styles.prizeValueBox} data-fit-box>
              <div className={styles.prizeGlow} style={{ maxWidth: '100%' }}>
                <span ref={prize.ref} className={styles.prizeValue} style={{ fontSize: prize.size, display: 'block' }}>
                  {prizeValue}
                </span>
              </div>
            </div>
            <div className={styles.chestBox}>
              <img className={styles.chest} src={BingoShowAssets.jackpot.artwork} alt="" draggable={false} />
              <img className={styles.coins} src={BingoShowAssets.decorative.coinStack} alt="" draggable={false} />
            </div>
          </div>

          {kind === 'jackpot' && jackpotAmount && (
            <div className={styles.jackpotTag}>
              <span className={styles.jackpotLabel}>+ ACUMULADO</span>
              <span className={styles.jackpotValue}>{jackpotAmount}</span>
            </div>
          )}
        </div>

        {/* CARTELA CONTEMPLADA */}
        {hasCard && (
          <div className={styles.card}>
            <span className={styles.cardFlash} style={{ '--flash-delay': `${lastWinDelay + 700}ms` } as React.CSSProperties} />
            <div className={styles.cardTitle}>
              <span className={goldStyles.goldIcon}>★</span>
              <span className={goldStyles.goldMetalTextCompact}>CARTELA CONTEMPLADA</span>
              <span className={goldStyles.goldIcon}>★</span>
            </div>
            <div className={styles.bingoHead}>
              {['B', 'I', 'N', 'G', 'O'].map((l) => (
                <div key={l} className={styles.headCell}>
                  {l}
                </div>
              ))}
            </div>
            <div className={styles.grid} style={{ gridTemplateRows: `repeat(${cardNumbers!.length}, 1fr)` }}>
              {cardNumbers!.flatMap((row, r) =>
                row.map((num, c) => {
                  const order = winOrder.get(`${r}-${c}`);
                  const isWin = order !== undefined && num > 0;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`${styles.cell} ${isWin ? styles.cellWin : ''}`}
                      style={
                        {
                          gridRow: r + 1,
                          gridColumn: c + 1,
                          '--in-delay': `${CELL_IN_START + r * 50 + c * 20}ms`,
                          '--win-delay': isWin ? `${WIN_START + order! * winStep}ms` : undefined,
                        } as React.CSSProperties
                      }
                    >
                      {isWin && <span className={styles.cellGold} />}
                      <span className={styles.cellNum}>{num}</span>
                    </div>
                  );
                }),
              )}
              {/* Feixe dourado sobre cada linha vencedora, depois que ela acende. */}
              {cardNumbers!.map((row, r) => {
                if (!winRows.has(r)) return null;
                const lastInRow = winOrder.get(`${r}-${row.length - 1}`) ?? 0;
                return (
                  <span
                    key={`beam-${r}`}
                    className={styles.beam}
                    style={
                      {
                        gridRow: r + 1,
                        gridColumn: '1 / -1',
                        '--beam-delay': `${WIN_START + lastInRow * winStep + 300}ms`,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selo por cima da moldura (fora dela, para não ser recortado). */}
      <div className={styles.seal}>
        <span className={`${goldStyles.goldMetalText} ${styles.sealText}`}>{sealText}</span>
      </div>
    </div>
  );
};

export default BingoShowWinnerPresentationBlue;

/**
 * BingoShowWinnerOuro.tsx — popup de ganhador(es) SOMENTE no tema Bingo Show
 * (Ouro & Espaço, id `bingo-show`). Serve para 1 ganhador e para vários do mesmo
 * prêmio (a fila, os tempos e os dados vêm prontos do BingoShowWinnerPopup — este
 * componente é só apresentação).
 *
 * Acabamento = o dos cards de prêmio do tema (assets em 9-slice, cantos exatos):
 * moldura externa dos painéis, card-prize nos cards, card-prize-value no selo e no
 * valor, card-metadata-gold na cartela. Estilos em BingoShowWinnerOuro.module.css.
 *
 * Layout pela quantidade na página (máx. GROUP_PAGE_SIZE; mais que isso vira
 * páginas de WINNER_POPUP_MS, igual ao Blue):
 *   1 → card único grande · 2 → dois cards largos empilhados · 3 → 2 em cima e 1
 *   centralizado · 4 → 2×2 · 5–6 → 3×2. Card: dados (45%) | cartela (55%).
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useFitText } from '../hooks/useFitText';
import { useCountUp } from '../hooks/useCountUp';
import { WINNER_POPUP_MS } from '../timing';
import { BingoShowAssets } from '../assets';
import { BingoShowTopWinnersFrame } from './BingoShowTopWinnersFrame';
import { GROUP_PAGE_SIZE, type GroupWinnerView } from './BingoShowWinnerGroupBlue';
import goldStyles from './goldMetalText.module.css';
import styles from './BingoShowWinnerOuro.module.css';

export interface BingoShowWinnerOuroProps {
  sealText: string;
  winners: GroupWinnerView[];
}

type Density = 'solo' | 'duo' | 'grid' | 'grid6';

// Tamanhos por densidade (palco 1920×1080).
const SIZES: Record<Density, { name: [number, number]; value: [number, number]; coupon: number; label: number; cell: number; head: number }> = {
  solo: { name: [86, 44], value: [96, 52], coupon: 26, label: 18, cell: 52, head: 30 },
  duo: { name: [60, 34], value: [66, 38], coupon: 22, label: 15, cell: 32, head: 20 },
  grid: { name: [48, 28], value: [54, 32], coupon: 19, label: 14, cell: 28, head: 18 },
  grid6: { name: [36, 22], value: [40, 26], coupon: 16, label: 12, cell: 22, head: 15 },
};

const CARD_STAGGER = 180;

const OuroCard: React.FC<{ w: GroupWinnerView; index: number; slot: number; total: number; density: Density; style?: React.CSSProperties }> = ({
  w,
  index,
  slot,
  total,
  density,
  style,
}) => {
  const sz = SIZES[density];
  const name = useFitText(w.name, sz.name[0], sz.name[1]);
  const value = useFitText(w.prize, sz.value[0], sz.value[1]);
  const enter = 650 + slot * CARD_STAGGER;
  const counting = useCountUp(w.prize, enter + 450, 1700);

  const hasCard = Array.isArray(w.cardNumbers) && w.cardNumbers.length > 0;
  const winRows = new Set(w.paintedRows);
  const winOrder = new Map<string, number>();
  let seq = 0;
  if (hasCard) {
    w.cardNumbers!.forEach((row, r) => {
      if (winRows.has(r)) row.forEach((_, c) => winOrder.set(`${r}-${c}`, seq++));
    });
  }
  const winStart = enter + 750;
  const winStep = seq > 10 ? 45 : 90;

  return (
    <div className={styles.card} style={{ '--enter': `${enter}ms`, ...style } as React.CSSProperties}>
      {total > 1 && (
        <span className={styles.badge}>
          GANHADOR {index + 1}/{total}
        </span>
      )}

      <div className={styles.info} data-fit-box>
        {total === 1 && (
          <div className={styles.soloTitle}>
            <span className={goldStyles.goldIcon}>★</span>
            <span className={goldStyles.goldMetalTextCompact}>GANHADOR CONTEMPLADO</span>
            <span className={goldStyles.goldIcon}>★</span>
          </div>
        )}
        <div className={styles.nameBox}>
          <span ref={name.ref} className={`${styles.name} ${name.wrap ? styles.nameWrap : ''}`} style={{ fontSize: name.size }}>
            {w.name}
          </span>
        </div>
        {w.coupon && (
          <span className={styles.coupon} style={{ fontSize: sz.coupon }}>
            CUPOM {w.coupon}
          </span>
        )}
        <span className={styles.prizeLabel} style={{ fontSize: sz.label }}>
          {total > 1 ? 'PRÊMIO INDIVIDUAL' : 'PRÊMIO DO GANHADOR'}
        </span>
        <div className={styles.valueCapsule}>
          <div className={styles.valueBox} data-fit-box>
            {/* Cópia invisível com o valor final: fonte fixa enquanto conta. */}
            <span ref={value.ref} aria-hidden="true" className={`${styles.value} ${goldStyles.goldValueActive}`} style={{ position: 'absolute', visibility: 'hidden', fontSize: value.size }}>
              {w.prize}
            </span>
            <span className={`${styles.value} ${goldStyles.goldValueActive}`} style={{ fontSize: value.size }} aria-label={w.prize}>
              {counting}
            </span>
          </div>
        </div>
        {w.jackpot && <span className={styles.jackpotTag}>+ ACUMULADO</span>}
        {total === 1 && (
          // eslint-disable-next-line @next/next/no-img-element -- asset estático do tema
          <img className={styles.soloChest} src={BingoShowAssets.jackpot.artwork} alt="" draggable={false} />
        )}
      </div>

      {hasCard && (
        <div className={styles.cartela}>
          <div className={styles.head}>
            {['B', 'I', 'N', 'G', 'O'].map((l) => (
              <div key={l} className={styles.headCell} style={{ fontSize: sz.head }}>
                {l}
              </div>
            ))}
          </div>
          <div className={styles.grid} style={{ gridTemplateRows: `repeat(${w.cardNumbers!.length}, 1fr)` }}>
            {w.cardNumbers!.flatMap((row, r) =>
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
                        fontSize: sz.cell,
                        '--in-delay': `${enter + 300 + r * 40 + c * 15}ms`,
                        '--win-delay': isWin ? `${winStart + order! * winStep}ms` : undefined,
                      } as React.CSSProperties
                    }
                  >
                    {isWin && <span className={styles.cellGold} />}
                    <span className={styles.cellNum}>{num}</span>
                    {isWin && <span className={styles.check}>✓</span>}
                  </div>
                );
              }),
            )}
            {/* Brilho sobre cada linha vencedora depois que ela acende. */}
            {w.cardNumbers!.map((row, r) => {
              if (!winRows.has(r)) return null;
              const last = winOrder.get(`${r}-${row.length - 1}`) ?? 0;
              return (
                <span
                  key={`beam-${r}`}
                  className={styles.beam}
                  style={{ gridRow: r + 1, gridColumn: '1 / -1', '--beam-delay': `${winStart + last * winStep + 300}ms` } as React.CSSProperties}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const BingoShowWinnerOuro: React.FC<BingoShowWinnerOuroProps> = ({ sealText, winners }) => {
  const pages = Math.max(1, Math.ceil(winners.length / GROUP_PAGE_SIZE));
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (pages <= 1) return;
    const t = setInterval(() => setPage((p) => (p + 1) % pages), WINNER_POPUP_MS);
    return () => clearInterval(t);
  }, [pages]);

  const list = winners.slice(page * GROUP_PAGE_SIZE, (page + 1) * GROUP_PAGE_SIZE);
  const n = list.length;
  const density: Density = n === 1 ? 'solo' : n === 2 ? 'duo' : n <= 4 ? 'grid' : 'grid6';
  // Grade de 4 colunas (cards de 2 colunas quando há 2 por linha) → o 3º card de
  // 3 fica centralizado. 5–6: 3 por linha.
  const gridStyle: React.CSSProperties =
    n <= 2
      ? { gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }
      : n <= 4
      ? { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }
      : { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' };
  const spanOf = (i: number): React.CSSProperties | undefined =>
    n === 3 || n === 4 ? { gridColumn: n === 3 && i === 2 ? '2 / span 2' : 'span 2' } : undefined;

  return (
    <div className={styles.root} role="dialog" aria-label={`${sealText}: ${winners.map((w) => w.name).join(', ')}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset estático do tema */}
      <img className={styles.confetti} src={BingoShowAssets.particles.confetti} alt="" />

      <div className={styles.frameBox}>
        <BingoShowTopWinnersFrame
          padding="sm"
          contentStyle={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '64px 34px 30px' }}
        >
          {winners.length > 1 && (
            <div className={styles.subtitle}>
              <span className={goldStyles.goldIcon}>★</span>
              <span className={goldStyles.goldMetalTextCompact}>
                {winners.length} GANHADORES • PRÊMIO DIVIDIDO{pages > 1 ? ` • ${page + 1}/${pages}` : ''}
              </span>
              <span className={goldStyles.goldIcon}>★</span>
            </div>
          )}
          <div key={page} className={styles.cards} style={gridStyle}>
            {list.map((w, i) => (
              <OuroCard key={w.id} w={w} index={page * GROUP_PAGE_SIZE + i} slot={i} total={winners.length} density={density} style={spanOf(i)} />
            ))}
          </div>
        </BingoShowTopWinnersFrame>
      </div>

      <div className={styles.seal}>
        <span className={`${goldStyles.goldMetalText} ${styles.sealText}`}>{sealText}</span>
      </div>
    </div>
  );
};

export default BingoShowWinnerOuro;

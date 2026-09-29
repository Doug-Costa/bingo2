/**
 * BingoShowWinnerGroupBlue.tsx — popup de VÁRIOS ganhadores do mesmo prêmio
 * (mesma linha ou bingo dividido) no tema Bingo Show Blue.
 *
 * Puramente visual, como o BingoShowWinnerPresentationBlue (mesmo fundo, selo e
 * células da cartela): nome, cupom, valor e linhas vencedoras chegam prontos do
 * BingoShowWinnerPopup. Cada ganhador vira um card menor COM a cartela.
 *
 * Layout pelo nº de ganhadores na página (máx. GROUP_PAGE_SIZE):
 *   2–3 → uma fileira de cards em pé (dados em cima, cartela embaixo)
 *   4   → 2×2 cards deitados (dados à esquerda, cartela à direita)
 *   5–6 → 3×2 cards deitados
 * Mais de 6: páginas de 6, cada uma por WINNER_POPUP_MS (o popup fica o tempo
 * de todas as páginas — ver groupDurationMs).
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useFitText } from '../hooks/useFitText';
import { useCountUp } from '../hooks/useCountUp';
import { WINNER_POPUP_MS } from '../timing';
import goldStyles from './goldMetalText.module.css';
import P from './BingoShowWinnerPresentationBlue.module.css';
import styles from './BingoShowWinnerGroupBlue.module.css';
import type { WinnerPresentationKind } from './BingoShowWinnerPresentationBlue';

export const GROUP_PAGE_SIZE = 6;

/** Tempo em tela de um grupo: WINNER_POPUP_MS por página. */
export function groupDurationMs(count: number): number {
  return Math.max(1, Math.ceil(count / GROUP_PAGE_SIZE)) * WINNER_POPUP_MS;
}

export interface GroupWinnerView {
  id: string;
  name: string;
  coupon: string;
  prize: string;
  jackpot: boolean;
  cardNumbers?: number[][];
  paintedRows: number[];
}

export interface BingoShowWinnerGroupBlueProps {
  kind: WinnerPresentationKind;
  sealText: string;
  winners: GroupWinnerView[];
}

type Density = 'row' | 'grid4' | 'grid6';

// Tamanhos por densidade (palco 1920×1080).
const SIZES: Record<Density, { name: [number, number]; value: [number, number]; cell: number; head: number }> = {
  row: { name: [54, 30], value: [70, 38], cell: 38, head: 26 },
  grid4: { name: [46, 28], value: [58, 34], cell: 30, head: 20 },
  grid6: { name: [36, 22], value: [44, 28], cell: 24, head: 16 },
};

const CARD_STAGGER = 180;

const GroupCard: React.FC<{ w: GroupWinnerView; index: number; density: Density }> = ({ w, index, density }) => {
  const sz = SIZES[density];
  const name = useFitText(w.name, sz.name[0], sz.name[1]);
  const value = useFitText(w.prize, sz.value[0], sz.value[1]);
  const enter = 700 + index * CARD_STAGGER;
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
  const winStart = enter + 700;
  const winStep = seq > 10 ? 40 : 80;

  return (
    <div
      className={`${styles.card} ${density === 'row' ? styles.cardTall : styles.cardWide}`}
      style={{ '--enter': `${enter}ms` } as React.CSSProperties}
    >
      <div className={styles.info} data-fit-box>
        <div className={styles.nameBox}>
          <span ref={name.ref} className={`${styles.name} ${name.wrap ? styles.nameWrap : ''}`} style={{ fontSize: name.size }}>
            {w.name}
          </span>
        </div>
        {w.coupon && <span className={styles.coupon}>CUPOM {w.coupon}</span>}
        <span className={styles.prizeLabel}>PRÊMIO DO GANHADOR</span>
        <div className={styles.valueBox}>
          {/* Cópia invisível com o valor final: fonte fixa enquanto conta. */}
          <span ref={value.ref} aria-hidden="true" className={styles.value} style={{ position: 'absolute', visibility: 'hidden', fontSize: value.size }}>
            {w.prize}
          </span>
          <span className={styles.value} style={{ fontSize: value.size }} aria-label={w.prize}>
            {counting}
          </span>
        </div>
        {w.jackpot && <span className={styles.jackpotTag}>+ ACUMULADO</span>}
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
                    className={`${P.cell} ${styles.cell} ${isWin ? P.cellWin : ''}`}
                    style={
                      {
                        fontSize: sz.cell,
                        '--in-delay': `${enter + 300 + r * 40 + c * 15}ms`,
                        '--win-delay': isWin ? `${winStart + order! * winStep}ms` : undefined,
                      } as React.CSSProperties
                    }
                  >
                    {isWin && <span className={P.cellGold} />}
                    <span className={P.cellNum}>{num}</span>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const BingoShowWinnerGroupBlue: React.FC<BingoShowWinnerGroupBlueProps> = ({ kind, sealText, winners }) => {
  const pages = Math.max(1, Math.ceil(winners.length / GROUP_PAGE_SIZE));
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (pages <= 1) return;
    const t = setInterval(() => setPage((p) => (p + 1) % pages), WINNER_POPUP_MS);
    return () => clearInterval(t);
  }, [pages]);

  const pageWinners = winners.slice(page * GROUP_PAGE_SIZE, (page + 1) * GROUP_PAGE_SIZE);
  const n = pageWinners.length;
  const density: Density = n <= 3 ? 'row' : n === 4 ? 'grid4' : 'grid6';
  const cols = n <= 3 ? n : n === 4 ? 2 : 3;

  return (
    <div className={`${P.root} ${P[`kind_${kind}`]}`} role="dialog" aria-label={`${sealText}: ${winners.length} ganhadores`}>
      <div className={P.rays} />
      <div className={P.dots} />
      <div className={P.vignette} />

      <div className={styles.frame}>
        <div className={styles.subtitle}>
          <span className={goldStyles.goldIcon}>★</span>
          <span className={goldStyles.goldMetalTextCompact}>
            {winners.length} GANHADORES • PRÊMIO DIVIDIDO{pages > 1 ? ` • ${page + 1}/${pages}` : ''}
          </span>
          <span className={goldStyles.goldIcon}>★</span>
        </div>
        <div
          key={page}
          className={styles.cards}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: density === 'row' ? '1fr' : '1fr 1fr' }}
        >
          {pageWinners.map((w, i) => (
            <GroupCard key={w.id} w={w} index={i} density={density} />
          ))}
        </div>
      </div>

      <div className={P.seal}>
        <span className={`${goldStyles.goldMetalText} ${P.sealText}`}>{sealText}</span>
      </div>
    </div>
  );
};

export default BingoShowWinnerGroupBlue;

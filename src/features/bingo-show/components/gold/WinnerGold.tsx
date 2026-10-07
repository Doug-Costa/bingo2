/**
 * WinnerGold.tsx — popup de ganhador(es) do tema `tema-ouro` ("Fortuna").
 * Mesma estrutura do popup do Ouro & Espaço (dados, fila e tempos vêm prontos do
 * BingoShowWinnerPopup; layouts 1/2/3/4/6; páginas de 6). Molduras em CSS; assets
 * só do tema: Maneki-Neko (linhas) e coroa (bingo) no card único.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useFitText } from '../../hooks/useFitText';
import { useCountUp } from '../../hooks/useCountUp';
import { WINNER_POPUP_MS } from '../../timing';
import { GROUP_PAGE_SIZE, type GroupWinnerView } from '../BingoShowWinnerGroupBlue';
import goldStyles from '../goldMetalText.module.css';
import goldTheme from './GoldTheme.module.css';
import styles from './WinnerGold.module.css';

export interface WinnerGoldProps {
  sealText: string;
  winners: GroupWinnerView[];
  /** Bingo: coroa no card único; linhas: o Maneki-Neko. */
  isBingo?: boolean;
}

// Confete em CSS (cores do tema), só nas laterais.
const PIECES = [
  { x: 3, c: '#ffd95a', d: 1500, dur: 2600, r: 520, dx: 40 },
  { x: 7, c: '#c71f25', d: 1650, dur: 2400, r: -420, dx: -30 },
  { x: 11, c: '#e9a91a', d: 1800, dur: 2700, r: 380, dx: 50 },
  { x: 15, c: '#16a778', d: 1950, dur: 2500, r: -480, dx: 20 },
  { x: 85, c: '#ffd95a', d: 1550, dur: 2600, r: -520, dx: -40 },
  { x: 89, c: '#c71f25', d: 1700, dur: 2450, r: 420, dx: 30 },
  { x: 93, c: '#e9a91a', d: 1850, dur: 2700, r: -380, dx: -50 },
  { x: 97, c: '#16a778', d: 2000, dur: 2500, r: 480, dx: -20 },
];

type Density = 'solo' | 'duo' | 'grid' | 'grid6';

// Tamanhos por densidade (palco 1920×1080).
const SIZES: Record<Density, { name: [number, number]; value: [number, number]; coupon: number; label: number; cell: number; head: number }> = {
  solo: { name: [86, 44], value: [96, 52], coupon: 26, label: 18, cell: 52, head: 30 },
  duo: { name: [60, 34], value: [66, 38], coupon: 22, label: 15, cell: 32, head: 20 },
  grid: { name: [48, 28], value: [54, 32], coupon: 19, label: 14, cell: 28, head: 18 },
  grid6: { name: [36, 22], value: [40, 26], coupon: 16, label: 12, cell: 22, head: 15 },
};

const CARD_STAGGER = 180;

const GoldCard: React.FC<{ w: GroupWinnerView; index: number; slot: number; total: number; density: Density; isBingo: boolean; style?: React.CSSProperties }> = ({
  w,
  index,
  slot,
  total,
  density,
  isBingo,
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
            <span className={goldTheme.goldText}>GANHADOR CONTEMPLADO</span>
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
            <span ref={value.ref} aria-hidden="true" className={`${styles.value} ${goldTheme.goldValue}`} style={{ position: 'absolute', visibility: 'hidden', fontSize: value.size }}>
              {w.prize}
            </span>
            <span className={`${styles.value} ${goldTheme.goldValue}`} style={{ fontSize: value.size }} aria-label={w.prize}>
              {counting}
            </span>
          </div>
        </div>
        {w.jackpot && <span className={styles.jackpotTag}>+ ACUMULADO</span>}
        {total === 1 &&
          (isBingo ? (
            // eslint-disable-next-line @next/next/no-img-element -- asset do tema
            <img className={`${styles.soloChest} ${styles.soloCrown}`} src="/themes/tema-ouro/icons/coroa.png" alt="" draggable={false} />
          ) : (
            <div className={styles.soloArtFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado do tema */}
              <img className={styles.soloCat} src="/themes/tema-ouro/decorative/maneki-neko.gif" alt="" draggable={false} />
            </div>
          ))}
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

export const WinnerGold: React.FC<WinnerGoldProps> = ({ sealText, winners, isBingo = false }) => {
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
    <div className={`${goldTheme.vars} ${styles.root}`} role="dialog" aria-label={`${sealText}: ${winners.map((w) => w.name).join(', ')}`}>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={
            {
              left: `${p.x}%`,
              background: p.c,
              '--delay': `${p.d}ms`,
              '--dur': `${p.dur}ms`,
              '--rot': `${p.r}deg`,
              '--dx': `${p.dx}px`,
            } as React.CSSProperties
          }
        />
      ))}

      <div className={styles.frameBox}>
        <div
          className={goldTheme.panel}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: '64px 34px 30px' }}
        >
          {winners.length > 1 && (
            <div className={styles.subtitle}>
              <span className={goldStyles.goldIcon}>★</span>
              <span className={goldTheme.goldText}>
                {winners.length} GANHADORES • PRÊMIO DIVIDIDO{pages > 1 ? ` • ${page + 1}/${pages}` : ''}
              </span>
              <span className={goldStyles.goldIcon}>★</span>
            </div>
          )}
          <div key={page} className={styles.cards} style={gridStyle}>
            {list.map((w, i) => (
              <GoldCard key={w.id} w={w} index={page * GROUP_PAGE_SIZE + i} slot={i} total={winners.length} density={density} isBingo={isBingo} style={spanOf(i)} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.seal}>
        <span className={`${goldTheme.goldText} ${styles.sealText}`}>{sealText}</span>
      </div>
    </div>
  );
};

export default WinnerGold;

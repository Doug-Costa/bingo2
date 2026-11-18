/**
 * WinnerAzul.tsx — popup de ganhador(es) do tema `bingo-show-azul`.
 *
 * Mesma interface e mesmos dados dos popups dos outros temas (fila, tempos,
 * divisão do prêmio e cartela pintada vêm prontos do BingoShowWinnerPopup);
 * só a aparência é do Azul: painel claro com filete ciano, selo azul-royal com
 * texto ouro, raios ciano girando atrás, valor ouro numa cápsula royal e a
 * cartela com as células vencedoras em ouro. 1 ganhador = card grande;
 * 2+ = cards menores (páginas de 6).
 *
 * TVs fracas: animações só de transform/opacity, uma vez na entrada (os raios
 * giram devagar); o tv-ultra esconde os raios e o confete.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useFitText } from '../../hooks/useFitText';
import { CountUpText } from '../../hooks/useCountUp';
import { useDeferredMount } from '../../hooks/useDeferredMount';
import { WINNER_POPUP_MS } from '../../timing';
import { GROUP_PAGE_SIZE, type GroupWinnerView } from '../BingoShowWinnerGroupBlue';
import { useT } from '@/contexts/TvConfigContext';
import css from './WinnerAzul.module.css';

const A = '/themes/bingo-show-azul';

export interface WinnerAzulProps {
  sealText: string;
  winners: GroupWinnerView[];
  isBingo?: boolean;
  prizeType?: 'line1' | 'line2' | 'bingo';
}

// Confete nas cores do tema (vermelho, royal, ouro, ciano), só nas laterais, uma vez.
const PIECES = [
  { x: 3, c: '#e51d36', d: 1200, dur: 2600, r: 520, dx: 40 },
  { x: 7, c: '#ffffff', d: 1350, dur: 2400, r: -420, dx: -30 },
  { x: 11, c: '#0757d6', d: 1500, dur: 2700, r: 380, dx: 50 },
  { x: 15, c: '#f7c948', d: 1650, dur: 2500, r: -480, dx: 20 },
  { x: 85, c: '#35d6f4', d: 1250, dur: 2600, r: -520, dx: -40 },
  { x: 89, c: '#e51d36', d: 1400, dur: 2450, r: 420, dx: 30 },
  { x: 93, c: '#0757d6', d: 1550, dur: 2700, r: -380, dx: -50 },
  { x: 97, c: '#f7c948', d: 1700, dur: 2500, r: 480, dx: -20 },
];

type Density = 'solo' | 'duo' | 'grid' | 'grid6';

const SIZES: Record<Density, { name: [number, number]; value: [number, number]; coupon: number; label: number; cell: number; head: number }> = {
  solo: { name: [92, 46], value: [92, 50], coupon: 28, label: 20, cell: 50, head: 30 },
  duo: { name: [60, 34], value: [62, 36], coupon: 22, label: 16, cell: 32, head: 20 },
  grid: { name: [46, 28], value: [50, 30], coupon: 19, label: 14, cell: 26, head: 17 },
  grid6: { name: [36, 22], value: [38, 24], coupon: 16, label: 12, cell: 21, head: 14 },
};

const CARD_STAGGER = 180;

const ART: Record<'line1' | 'line2' | 'bingo', string> = {
  line1: `${A}/bolas.webp`,
  line2: `${A}/cartelas.webp`,
  bingo: `${A}/trofeu-louros.webp`,
};

const WinnerCard: React.FC<{
  w: GroupWinnerView;
  index: number;
  slot: number;
  total: number;
  density: Density;
  art: string;
  style?: React.CSSProperties;
}> = ({ w, index, slot, total, density, art, style }) => {
  const t = useT();
  const sz = SIZES[density];
  const name = useFitText(w.name, sz.name[0], sz.name[1]);
  const value = useFitText(w.prize, sz.value[0], sz.value[1]);
  const enter = 650 + slot * CARD_STAGGER;
  const solo = total === 1;

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
    <div className={`${css.card} ${solo ? css.cardSolo : ''}`} style={{ '--enter': `${enter}ms`, ...style } as React.CSSProperties}>
      {total > 1 && <span className={css.badge}>{t('winner.nOfTotal', { i: index + 1, n: total })}</span>}

      <div className={css.info} data-fit-box>
        {solo && (
          <div className={css.soloTitle}>
            <span className={css.star}>★</span>
            <span>{t('winner.contemplated')}</span>
            <span className={css.star}>★</span>
          </div>
        )}
        <div className={css.nameBox}>
          <span ref={name.ref} className={`${css.name} ${name.wrap ? css.nameWrap : ''}`} style={{ fontSize: name.size }}>
            {w.name}
          </span>
        </div>
        {w.coupon && (
          <span className={css.coupon} style={{ fontSize: sz.coupon }}>
            {t('winner.coupon', { c: w.coupon })}
          </span>
        )}
        <span className={css.prizeLabel} style={{ fontSize: sz.label }}>
          {total > 1 ? t('winner.individualPrize') : t('winner.prize')}
        </span>
        <div className={css.valueRow}>
          {solo && (
            // eslint-disable-next-line @next/next/no-img-element -- arte do tema
            <img className={css.soloArt} src={art} alt="" draggable={false} />
          )}
          <div className={css.valueCapsule}>
            <div className={css.valueBox} data-fit-box>
              {/* Cópia invisível com o valor final: fonte fixa enquanto conta. */}
              <span ref={value.ref} aria-hidden="true" className={css.value} style={{ position: 'absolute', visibility: 'hidden', fontSize: value.size }}>
                {w.prize}
              </span>
              <span className={css.value} style={{ fontSize: value.size }} aria-label={w.prize}>
                <CountUpText text={w.prize} delayMs={enter + 450} durationMs={1700} />
              </span>
            </div>
          </div>
        </div>
        {w.jackpot && <span className={css.jackpotTag}>{t('winner.plusJackpot')}</span>}
      </div>

      {hasCard && (
        <div className={css.cartela}>
          {solo && (
            <div className={css.cartelaTitle}>
              <span className={css.star}>★</span> {t('winner.card')} <span className={css.star}>★</span>
            </div>
          )}
          <div className={css.head}>
            {['B', 'I', 'N', 'G', 'O'].map((l) => (
              <div key={l} className={css.headCell} style={{ fontSize: sz.head }}>
                {l}
              </div>
            ))}
          </div>
          <div className={css.grid} style={{ gridTemplateRows: `repeat(${w.cardNumbers!.length}, 1fr)` }}>
            {w.cardNumbers!.flatMap((row, r) =>
              row.map((num, c) => {
                const order = winOrder.get(`${r}-${c}`);
                const isWin = order !== undefined && num > 0;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${css.cell} ${isWin ? css.cellWin : ''}`}
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
                    {isWin && <span className={css.cellGold} />}
                    <span className={css.cellNum}>{num}</span>
                    {isWin && <span className={css.check}>✓</span>}
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

export const WinnerAzul: React.FC<WinnerAzulProps> = ({ sealText, winners, isBingo = false, prizeType }) => {
  const t = useT();
  const art = ART[prizeType ?? (isBingo ? 'bingo' : 'line1')];
  // TV: casca primeiro, cards no quadro seguinte (ver useDeferredMount).
  const contentReady = useDeferredMount();
  const pages = Math.max(1, Math.ceil(winners.length / GROUP_PAGE_SIZE));
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (pages <= 1) return;
    const timer = setInterval(() => setPage((p) => (p + 1) % pages), WINNER_POPUP_MS);
    return () => clearInterval(timer);
  }, [pages]);

  const list = winners.slice(page * GROUP_PAGE_SIZE, (page + 1) * GROUP_PAGE_SIZE);
  const n = list.length;
  const density: Density = n === 1 ? 'solo' : n === 2 ? 'duo' : n <= 4 ? 'grid' : 'grid6';
  // 1–2: uma coluna; 3–4: grade de 4 colunas com cards de 2 (o 3º de 3 fica no
  // meio); 5–6: 3 por linha.
  const gridStyle: React.CSSProperties =
    n <= 2
      ? { gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }
      : n <= 4
      ? { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }
      : { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' };
  const spanOf = (i: number): React.CSSProperties | undefined =>
    n === 3 || n === 4 ? { gridColumn: n === 3 && i === 2 ? '2 / span 2' : 'span 2' } : undefined;

  return (
    <div className={css.root} role="dialog" aria-label={`${sealText}: ${winners.map((w) => w.name).join(', ')}`}>
      <span className={css.rays} aria-hidden="true" />
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={css.piece}
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

      <div className={css.frame}>
        {winners.length > 1 && (
          <div className={css.subtitle}>
            <span className={css.star}>★</span>
            <span>
              {t('winner.split', { n: winners.length })}
              {pages > 1 ? ` • ${page + 1}/${pages}` : ''}
            </span>
            <span className={css.star}>★</span>
          </div>
        )}
        <div key={page} className={css.cards} style={gridStyle}>
          {contentReady &&
            list.map((w, i) => (
              <WinnerCard key={w.id} w={w} index={page * GROUP_PAGE_SIZE + i} slot={i} total={winners.length} density={density} art={art} style={spanOf(i)} />
            ))}
        </div>
      </div>

      <div className={css.seal}>
        <span className={css.sealText}>{sealText}</span>
      </div>
    </div>
  );
};

export default WinnerAzul;

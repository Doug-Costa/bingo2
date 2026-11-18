/**
 * RoundWinnersAzul.tsx — resumo "Ganhadores da Rodada" do tema `bingo-show-azul`.
 *
 * Mesma interface, dados, paginação e tempo dos resumos dos outros temas (vêm
 * do BingoShowWinnerPopup); só a aparência é do Azul: topo com logo e título,
 * faixa royal com sorteio/data/hora, 3 colunas com cabeçalho vermelho / claro /
 * royal (as mesmas cores das faixas no lobby e no sorteio), cards claros com
 * o valor ouro em cápsula royal, e rodapé royal.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useFitText } from '../../hooks/useFitText';
import { CountUpText } from '../../hooks/useCountUp';
import { useDeferredMount } from '../../hooks/useDeferredMount';
import type { BingoShowRoundWinnersBlueProps, RoundCategoryKey, RoundCategoryView, RoundWinnerView } from '../BingoShowRoundWinnersBlue';
import { useT } from '@/contexts/TvConfigContext';
import css from './RoundWinnersAzul.module.css';

const A = '/themes/bingo-show-azul';
const PER_PAGE = 4;
const MIN_PAGE_MS = 5000;

const SIZES: Record<1 | 2 | 3 | 4, { name: [number, number]; value: [number, number]; coupon: number }> = {
  1: { name: [54, 30], value: [58, 34], coupon: 20 },
  2: { name: [40, 26], value: [44, 28], coupon: 17 },
  3: { name: [32, 22], value: [34, 24], coupon: 15 },
  4: { name: [28, 20], value: [30, 22], coupon: 14 },
};

const ART: Record<RoundCategoryKey, string> = {
  line1: `${A}/bolas.webp`,
  line2: `${A}/cartelas.webp`,
  bingo: `${A}/trofeu-louros.webp`,
};

const RoundCard: React.FC<{ w: RoundWinnerView; label: string; mode: 1 | 2 | 3 | 4; delay: number; jackpotAmount?: string }> = ({
  w,
  label,
  mode,
  delay,
  jackpotAmount,
}) => {
  const t = useT();
  const sz = SIZES[mode];
  const name = useFitText(w.name, sz.name[0], sz.name[1]);
  const value = useFitText(w.prize, sz.value[0], sz.value[1]);
  return (
    <div className={css.card} style={{ '--d-card': `${delay}ms` } as React.CSSProperties}>
      <span className={css.cardLabel}>{label}</span>
      <div className={css.nameBox} data-fit-box>
        <span ref={name.ref} className={`${css.name} ${name.wrap ? css.nameWrap : ''}`} style={{ fontSize: name.size }}>
          {w.name}
        </span>
      </div>
      {w.coupon && (
        <span className={css.coupon} style={{ fontSize: sz.coupon }}>
          {t('winner.coupon', { c: w.coupon })}
        </span>
      )}
      <div className={css.valueCapsule}>
        <div className={css.valueBox} data-fit-box>
          <span ref={value.ref} aria-hidden="true" className={css.value} style={{ position: 'absolute', visibility: 'hidden', fontSize: value.size }}>
            {w.prize}
          </span>
          <span className={css.value} style={{ fontSize: value.size }} aria-label={w.prize}>
            <CountUpText text={w.prize} delayMs={delay + 400} durationMs={1600} />
          </span>
        </div>
      </div>
      {w.jackpot && (
        <span className={css.jackpotTag}>
          {t('winner.plusJackpot')}
          {jackpotAmount ? ` ${jackpotAmount}` : ''}
        </span>
      )}
    </div>
  );
};

const Column: React.FC<{ category: RoundCategoryView; index: number; jackpotAmount?: string; totalDurationMs: number }> = ({
  category,
  index,
  jackpotAmount,
  totalDurationMs,
}) => {
  const t = useT();
  const TITLES: Record<RoundCategoryKey, string> = { line1: t('azul.line1'), line2: t('azul.line2'), bingo: t('azul.bingo') };
  const HEAD: Record<RoundCategoryKey, string> = { line1: css.headRed ?? '', line2: css.headIce ?? '', bingo: css.headRoyal ?? '' };
  const contentReady = useDeferredMount();
  const total = category.winners.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const [page, setPage] = useState(0);
  const [turns, setTurns] = useState(0);

  // Mesma rotação dos outros resumos: só com mais de 4 ganhadores na faixa,
  // dividindo o tempo real do resumo, com mínimo de leitura por página.
  useEffect(() => {
    setPage(0);
    if (pages <= 1) return;
    const pageMs = Math.max(MIN_PAGE_MS, totalDurationMs / pages);
    const timer = setInterval(() => {
      setPage((p) => (p + 1) % pages);
      setTurns((n) => n + 1);
    }, pageMs);
    return () => clearInterval(timer);
  }, [pages, totalDurationMs]);

  const isSplit = total > 1;
  const start = page * PER_PAGE;
  const list = category.winners.slice(start, start + PER_PAGE);
  const mode = Math.max(1, Math.min(4, list.length)) as 1 | 2 | 3 | 4;
  const firstShow = turns === 0;
  const dCol = 350 + index * 130;
  const dTitle = dCol + 300;

  return (
    <div className={css.column} style={{ '--d-col': `${dCol}ms`, '--d-title': `${dTitle}ms` } as React.CSSProperties}>
      <div className={`${css.colHead} ${HEAD[category.key]}`}>
        <span>{TITLES[category.key]}</span>
        <span className={css.colStar}>★</span>
      </div>
      <div className={css.colBody}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
        <img className={`${css.art} ${isSplit ? css.artSmall : ''}`} src={ART[category.key]} alt="" draggable={false} />
        {isSplit && (
          <div className={css.splitBand}>
            <span>
              {t('round.splitPrize')} • {t('round.nWinners', { n: total })}
            </span>
            {pages > 1 && (
              <span className={css.pagePill}>
                {page + 1}/{pages}
              </span>
            )}
          </div>
        )}

        {total === 0 ? (
          <div className={css.empty}>
            <span className={css.emptyStar}>★</span>
            <span>{t('round.noWinner')}</span>
            <span>{t('round.inTier')}</span>
          </div>
        ) : (
          <div key={page} className={css.cards}>
            {contentReady &&
              list.map((w, j) => (
                <RoundCard
                  key={w.id}
                  w={w}
                  label={isSplit ? t('winner.nOfTotal', { i: start + j + 1, n: total }) : `★ ${t('winner.contemplated')} ★`}
                  mode={mode}
                  delay={firstShow ? dTitle + 350 + j * 160 : 80 + j * 120}
                  jackpotAmount={jackpotAmount}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const RoundWinnersAzul: React.FC<BingoShowRoundWinnersBlueProps> = ({
  drawNumber,
  dateStr,
  timeStr,
  categories,
  jackpotAmount,
  totalDurationMs,
  onClose,
}) => {
  const t = useT();
  return (
    <div className={css.root} role="dialog" aria-label={t('round.aria')}>
      <span className={css.rays} aria-hidden="true" />
      <div className={css.layout}>
        <header className={css.header}>
          {/* eslint-disable-next-line @next/next/no-img-element -- marca do tema */}
          <img className={css.logo} src="/themes/bingo-show-blue/logos/logo-main.webp" alt="BINGO SHOW" draggable={false} />
          <div className={css.headerCenter}>
            <div className={css.title}>
              {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
              <img className={css.titleIcon} src={`${A}/trofeu.webp`} alt="" draggable={false} />
              <span>{t('round.title')}</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- arte do tema */}
              <img className={css.titleIcon} src={`${A}/trofeu.webp`} alt="" draggable={false} />
            </div>
            <span className={css.sub}>{t('round.drawAt', { draw: drawNumber, date: dateStr, time: timeStr })}</span>
          </div>
          <button type="button" className={css.close} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className={css.columns}>
          {categories.map((c, i) => (
            <Column key={c.key} category={c} index={i} jackpotAmount={jackpotAmount} totalDurationMs={totalDurationMs} />
          ))}
        </div>

        <footer className={css.footer}>
          <span className={css.footerStar}>★</span>
          {t('round.footer', { brand: 'BINGO SHOW' })}
          <span className={css.footerStar}>★</span>
        </footer>
      </div>
    </div>
  );
};

export default RoundWinnersAzul;

// src/features/bingo-show/components/BingoShowDrawnBalls.tsx
import React, { useMemo } from 'react';
import { BingoShowBall } from './BingoShowBall';
import { BingoShowAssets } from '../assets';
import { useAppTheme } from '@/contexts/ThemeContext';

export interface BingoShowDrawnBallsProps {
  drawnBalls: number[];
  totalBalls?: number;
  testJackpotPanelBackground?: boolean;
  style?: React.CSSProperties;
}

const ALL_90_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);

export const BingoShowDrawnBalls: React.FC<BingoShowDrawnBallsProps> = ({
  drawnBalls,
  style,
}) => {
  const { themeId, theme } = useAppTheme();
  const drawnSet = useMemo(() => new Set(drawnBalls), [drawnBalls]);
  const latestBall = drawnBalls.length > 0 ? drawnBalls[drawnBalls.length - 1] : undefined;

  const isBlueTheme = themeId === 'bingo-show-blue';

  const panelBg = isBlueTheme
    ? `url(/themes/bingo-show-blue/panels/panel-main.png), ${theme.panelBg}`
    : themeId === 'bingo-show'
    ? `url(${BingoShowAssets.jackpot.panel})`
    : theme.panelBg;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: panelBg,
        backgroundSize: '100% 100%',
        backgroundColor: theme.panelBg,
        border: !isBlueTheme && themeId !== 'bingo-show' ? `2px solid ${theme.borderPrimary}` : undefined,
        borderRadius: 24,
        padding: '16px 28px 20px 28px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        position: 'relative',
        ...style,
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, position: 'relative', marginTop: -2, marginBottom: 8 }}>
        {isBlueTheme ? (
          <span style={{ fontSize: 20, color: theme.primary }}>★</span>
        ) : null}
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: theme.primary || '#FFDE38',
            textShadow: `0 0 16px ${theme.primaryGlow || 'rgba(255, 222, 56, 0.7)'}`,
            letterSpacing: 4,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {isBlueTheme ? 'NÚMEROS SORTEADOS' : '• ÚLTIMOS NÚMEROS SORTEADOS •'}
        </span>
        {isBlueTheme ? (
          <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        ) : null}
      </div>

      {/* 90 3D BALLS GRID (5 ROWS x 18 COLS) */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(18, 1fr)',
          gridTemplateRows: 'repeat(5, 42px)',
          rowGap: 6,
          columnGap: 4,
          alignItems: 'center',
          justifyItems: 'center',
          alignContent: 'center',
          justifyContent: 'center',
          marginTop: -22,
          padding: '8px 24px 8px 24px',
        }}
      >
        {ALL_90_NUMBERS.map((num) => {
          const isDrawn = drawnSet.has(num);
          const isLatest = num === latestBall;
          const ballState = isDrawn ? 'drawn' : 'default';

          const animationName = isLatest
            ? 'bs-grid-cell-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both, bs-ball-light-up 650ms ease-out both'
            : undefined;

          return (
            <BingoShowBall
              key={num}
              number={num}
              state={ballState}
              size="sm"
              diameterOverride={38}
              fontSizeOverride={16}
              style={{
                opacity: isDrawn ? 1 : 0.22,
                filter: isDrawn ? 'brightness(1.1) saturate(1.05)' : 'grayscale(0.55) brightness(0.45)',
                transform: isLatest ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 200ms ease-out, opacity 350ms ease-out, filter 350ms ease-out',
                animation: animationName,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BingoShowDrawnBalls;

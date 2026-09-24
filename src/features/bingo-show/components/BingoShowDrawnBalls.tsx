// src/features/bingo-show/components/BingoShowDrawnBalls.tsx
import React, { useMemo } from 'react';
import { BingoShowBall } from './BingoShowBall';
import { BingoShowAssets } from '../assets';
import { useAppTheme } from '@/contexts/ThemeContext';
import goldStyles from './goldMetalText.module.css';

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
      {/* HEADER: 🍀 ÚLTIMOS NÚMEROS SORTEADOS 🍀 */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, position: 'relative', marginTop: -2, marginBottom: 8 }}>
        {/* Blue: título em ouro metálico compacto + glow verde discreto nos trevos
            (goldMetalText.module.css); demais temas inalterados. */}
        <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" className={isBlueTheme ? goldStyles.cloverIcon : undefined} style={{ width: 22, height: 22, objectFit: 'contain' }} />
        <span
          className={isBlueTheme ? goldStyles.goldMetalTextCompact : undefined}
          style={{
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: 'Barlow Condensed, sans-serif',
            ...(isBlueTheme ? {} : { color: '#FFCF12', textShadow: `0 0 14px rgba(255, 207, 18, 0.7)` }),
          }}
        >
          ÚLTIMOS NÚMEROS SORTEADOS
        </span>
        <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" className={isBlueTheme ? goldStyles.cloverIcon : undefined} style={{ width: 22, height: 22, objectFit: 'contain' }} />
      </div>

      {/* 90 3D BALLS GRID (5 ROWS x 18 COLS) - diametro/fonte maiores no Blue
          (34->39px / 15->20px, topo do intervalo 34-40px/17-21px pedido),
          usando melhor a largura disponivel em vez de bolas pequenas boiando
          em celulas grandes. */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(18, 1fr)',
          gridTemplateRows: isBlueTheme ? 'repeat(5, 42px)' : 'repeat(5, 38px)',
          rowGap: isBlueTheme ? 8 : 6,
          columnGap: 4,
          alignItems: 'center',
          justifyItems: 'center',
          alignContent: 'center',
          justifyContent: 'center',
          padding: '4px 16px 8px 16px',
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
              diameterOverride={isBlueTheme ? 39 : 34}
              fontSizeOverride={isBlueTheme ? 20 : 15}
              style={{
                opacity: 1,
                filter: isDrawn ? 'drop-shadow(0 0 6px rgba(23, 200, 255, 0.8))' : 'none',
                transform: isLatest ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 200ms ease-out, filter 350ms ease-out',
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

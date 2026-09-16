// src/features/bingo-show/components/BingoShowDrawnBalls.tsx
import React, { useMemo } from 'react';
import { BingoShowBall } from './BingoShowBall';
import { BingoShowAssets } from '../assets';

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
  const drawnSet = useMemo(() => new Set(drawnBalls), [drawnBalls]);
  const latestBall = drawnBalls.length > 0 ? drawnBalls[drawnBalls.length - 1] : undefined;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `url(${BingoShowAssets.jackpot.panel})`,
        backgroundSize: '100% 100%',
        borderRadius: 24,
        padding: '16px 28px 20px 28px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative', marginTop: -2, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: '#FFDE38', textShadow: '0 0 16px rgba(255, 222, 56, 0.7)', letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center' }}>
          • ÚLTIMOS NÚMEROS SORTEADOS •
        </span>
      </div>

      {/* 90 3D BALLS GRID (5 ROWS x 18 COLS) — subida um pouco (menos padding embaixo,
          margin-top negativo) para caber inteira dentro da moldura do card, sem a última
          linha encostando/cortando na borda inferior. */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(18, 1fr)',
          // Linhas com altura FIXA (não mais `1fr`, que esticava cada linha pra preencher
          // o `flex:1` inteiro e deixava um vão grande acima/abaixo de cada bola mesmo com
          // `rowGap:0`) — do tamanho real da bola + uma folga mínima, bem mais compacto.
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

          // Não sorteadas ficam "apagadas" (escuras/dessaturadas); ao serem sorteadas,
          // acendem com um flash de luz (`bs-ball-light-up`) em vez de só trocar opacidade
          // de um frame pro outro — pedido explícito do usuário.
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

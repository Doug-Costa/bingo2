import React from 'react';
import { BingoShowBall } from './BingoShowBall';
import { BingoShowIcon } from './BingoShowIcon';
import { BingoShowColors, BingoShowSpacing } from '../design-system';

export interface BingoShowCurrentBallProps {
  number: number;
  nextBalls?: { number: number; color: string }[];
  countdownSeconds?: number;
  style?: React.CSSProperties;
}

export const BingoShowCurrentBall: React.FC<BingoShowCurrentBallProps> = ({
  number,
  nextBalls = [
    { number: 30, color: '#E53935' },
    { number: 65, color: '#FFB300' },
    { number: 90, color: '#8E24AA' },
  ],
  countdownSeconds = 30,
  style,
}) => {
  const isWarning = countdownSeconds <= 10 && countdownSeconds > 0;
  const formattedTimer = `00:${Math.max(0, countdownSeconds).toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: BingoShowSpacing.md,
        boxSizing: 'border-box',
        position: 'relative',
        ...style,
      }}
    >
      {/* CENTER STAGE: HERO BALL & HALF-MOON ARC OF 3 NEXT BALLS ON RIGHT */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 }}>
        
        {/* 3D HERO MAIN BALL */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* GLOW RING */}
          <div
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: '50%',
              border: '6px solid #00E5FF',
              boxShadow: '0 0 60px #00E5FF, inset 0 0 40px #00E5FF',
              animation: 'bs-pulse-glow 2s ease-in-out infinite',
            }}
          />

          <BingoShowBall
            number={number}
            state="active"
            size="current"
            diameterOverride={210}
            fontSizeOverride={100}
            style={{
              animation: 'bs-active-scale-in 400ms ease-out',
            }}
          />
        </div>

        {/* 3 NEXT BALLS IN HALF-MOON ARC ON THE RIGHT */}
        <div
          style={{
            position: 'absolute',
            right: '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {nextBalls.slice(0, 3).map((b, idx) => {
            const sizes = [
              { diameter: 80, fontSize: 34, offsetX: -20 },
              { diameter: 64, fontSize: 26, offsetX: 25 },
              { diameter: 48, fontSize: 20, offsetX: -15 },
            ] as const;
            const cfg = sizes[idx] ?? sizes[0];

            return (
              <div
                key={idx}
                style={{
                  transform: `translateX(${cfg.offsetX}px)`,
                  transition: 'all 300ms ease-out',
                  filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.4))',
                }}
              >
                <BingoShowBall
                  number={b.number}
                  state="drawn"
                  size="md"
                  diameterOverride={cfg.diameter}
                  fontSizeOverride={cfg.fontSize}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* TIMER AT BOTTOM */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: isWarning ? '#FF3366' : BingoShowColors.textSecondary, letterSpacing: 2, textTransform: 'uppercase' }}>
          SORTEIO COMEÇA EM
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: isWarning ? 'rgba(255, 51, 102, 0.15)' : 'rgba(6,12,40,0.8)',
            border: `3px solid ${isWarning ? '#FF3366' : '#00E5FF'}`,
            borderRadius: 40,
            padding: '8px 28px',
            animation: isWarning ? 'bs-pulse-glow 1s ease-in-out infinite' : 'none',
            transform: isWarning ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease',
          }}
        >
          <BingoShowIcon name="clock" size={30} color={isWarning ? '#FF3366' : '#00E5FF'} transparentBg />
          <span style={{ fontSize: 32, fontWeight: 900, color: isWarning ? '#FF3366' : '#00E5FF', fontFamily: 'monospace' }}>
            {formattedTimer}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BingoShowCurrentBall;

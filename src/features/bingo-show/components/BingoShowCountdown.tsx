import React, { useMemo } from 'react';
import { BingoShowColors, BingoShowSpacing, BingoShowRadius, BingoShowTypography } from '../design-system';

export interface BingoShowCountdownProps {
  seconds: number;
  label?: string;
  style?: React.CSSProperties;
  showTimerFrame?: boolean;
  timerTextStyle?: React.CSSProperties;
}

export const BingoShowCountdown: React.FC<BingoShowCountdownProps> = ({
  seconds,
  label = 'PRÓXIMO SORTEIO',
  style,
  showTimerFrame = true,
  timerTextStyle,
}) => {
  const formattedTime = useMemo(() => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  const isDanger = seconds <= 10 && seconds > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: BingoShowSpacing.xs,
        ...style,
      }}
    >
      {isDanger && (
        <style>{`
          @keyframes bs-danger-pulse {
            0% { transform: scale(1); text-shadow: 0 0 15px rgba(255, 51, 51, 0.8); color: #FF3333; }
            50% { transform: scale(1.08); text-shadow: 0 0 35px rgba(255, 51, 51, 1); color: #FF6666; }
            100% { transform: scale(1); text-shadow: 0 0 15px rgba(255, 51, 51, 0.8); color: #FF3333; }
          }
        `}</style>
      )}
      {label ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: BingoShowColors.textSecondary,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      ) : null}
      <div
        style={
          showTimerFrame
            ? {
                backgroundColor: isDanger ? 'rgba(255, 51, 51, 0.15)' : 'rgba(255, 222, 56, 0.15)',
                border: `1.5px solid ${isDanger ? '#FF3333' : BingoShowColors.primary}`,
                borderRadius: BingoShowRadius.md,
                paddingLeft: BingoShowSpacing.lg,
                paddingRight: BingoShowSpacing.lg,
                paddingTop: BingoShowSpacing.xs,
                paddingBottom: BingoShowSpacing.xs,
                boxShadow: isDanger ? `0 0 12px rgba(255,51,51,0.4)` : `0 0 12px ${BingoShowColors.primary}66`,
              }
            : {}
        }
      >
        <span
          style={{
            fontFamily: 'monospace, sans-serif',
            fontSize: BingoShowTypography.presets.digitalCountdown.fontSize,
            fontWeight: 900,
            color: BingoShowColors.primary,
            letterSpacing: 3,
            display: 'inline-block',
            animation: isDanger ? 'bs-danger-pulse 1s ease-in-out infinite' : 'none',
            ...timerTextStyle,
            ...(isDanger && { color: '#FF3333' }), // fallback
          }}
        >
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

export default BingoShowCountdown;

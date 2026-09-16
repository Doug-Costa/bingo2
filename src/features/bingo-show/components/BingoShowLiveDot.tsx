import React from 'react';
import { BingoShowColors, BingoShowSpacing } from '../design-system';

export interface BingoShowLiveDotProps {
  label?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const BingoShowLiveDot: React.FC<BingoShowLiveDotProps> = ({
  label,
  color = BingoShowColors.greenSuccess,
  size = 9,
  style,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: BingoShowSpacing.xs, ...style }}>
      <div style={{ position: 'relative', width: size * 2.4, height: size * 2.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            width: size * 2.4,
            height: size * 2.4,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
            animation: 'bs-live-ring 1400ms ease-out infinite',
          }}
        />
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            animation: 'bs-live-dot 1400ms ease-in-out infinite',
          }}
        />
      </div>
      {label ? <span style={{ fontSize: 10, fontWeight: 900, color, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span> : null}
    </div>
  );
};

export default BingoShowLiveDot;

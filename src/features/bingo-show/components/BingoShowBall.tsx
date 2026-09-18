import React, { useMemo } from 'react';
import { BingoShowAssets } from '../assets';
import { useAppTheme } from '@/contexts/ThemeContext';

export type BingoShowBallState = 'default' | 'active' | 'drawn' | 'winner';
export type BingoShowBallSize = 'sm' | 'md' | 'lg' | 'current';
export type BingoShowBallColorName = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gold';

export function getBallTextColor(colorName: BingoShowBallColorName): string {
  if (colorName === 'yellow') {
    return '#0A1230';
  }
  return '#FFFFFF';
}

export interface BingoShowBallProps {
  number: number;
  state?: BingoShowBallState;
  size?: BingoShowBallSize;
  fontSizeOverride?: number;
  diameterOverride?: number;
  style?: React.CSSProperties;
}

export const BingoShowBall: React.FC<BingoShowBallProps> = ({
  number,
  state = 'default',
  size = 'md',
  fontSizeOverride,
  diameterOverride,
  style,
}) => {
  const { isBlue } = useAppTheme();

  const diameter = useMemo(() => {
    if (diameterOverride) return diameterOverride;
    switch (size) {
      case 'sm':
        return 30;
      case 'lg':
        return 58;
      case 'current':
        return 110;
      case 'md':
      default:
        return 42;
    }
  }, [size, diameterOverride]);

  const fontSize = useMemo(() => {
    if (fontSizeOverride) return fontSizeOverride;
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 24;
      case 'current':
        return 48;
      case 'md':
      default:
        return 17;
    }
  }, [size, fontSizeOverride]);

  const colorName = useMemo<BingoShowBallColorName>(() => {
    if (state === 'winner') return 'gold';
    if (number <= 18) return 'blue';
    if (number <= 36) return 'red';
    if (number <= 54) return 'green';
    if (number <= 72) return 'yellow';
    return 'purple';
  }, [number, state]);

  const colorGroup = BingoShowAssets.balls[colorName];

  const ballTexture = useMemo(() => {
    if (isBlue) {
      if (state === 'default') {
        return `/themes/bingo-show-blue/balls/2x/ball-silver-default.png`;
      }
      const stateSuffix =
        state === 'winner'
          ? 'winner'
          : state === 'active'
          ? 'glow'
          : 'selected';
      return `/themes/bingo-show-blue/balls/2x/ball-${colorName}-${stateSuffix}.png`;
    }

    switch (state) {
      case 'winner':
        return colorGroup.winner;
      case 'active':
        return colorGroup.glow;
      case 'drawn':
        return colorGroup.selected;
      case 'default':
      default:
        return colorGroup.default;
    }
  }, [colorGroup, state, isBlue, colorName]);

  const textColor = useMemo(() => {
    if (state === 'default') {
      return '#0A193C';
    }
    return getBallTextColor(colorName);
  }, [state, colorName]);

  return (
    <div
      style={{
        position: 'relative',
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        backgroundImage: `url(${ballTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace, sans-serif',
          fontSize,
          fontWeight: 900,
          color: textColor,
          textShadow: textColor === '#FFFFFF' ? '0 2px 6px rgba(0,0,0,0.85)' : 'none',
          userSelect: 'none',
        }}
      >
        {number > 0 ? number : ''}
      </span>
    </div>
  );
};

export default BingoShowBall;


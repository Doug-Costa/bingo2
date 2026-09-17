import React from 'react';
import { BingoShowSpacing } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';

export interface BingoShowNineSliceFrameSpec {
  cornerTL: string;
  cornerTR: string;
  cornerBL: string;
  cornerBR: string;
  center: string;
  topLeft: string;
  topRight: string;
  topSpark?: string;
  bottomLeft: string;
  bottomRight: string;
  bottomSpark?: string;
  leftTop: string;
  leftBottom?: string;
  leftSpark?: string;
  rightTop: string;
  rightBottom?: string;
  rightSpark?: string;
}

export interface BingoShowNineSliceFrameProps {
  frames: BingoShowNineSliceFrameSpec;
  nativeCorner?: number;
  nativeTopSparkWidth?: number;
  nativeSideSparkHeight?: number;
  displayCorner?: number;
  padding?: keyof typeof BingoShowSpacing;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BingoShowNineSliceFrame: React.FC<BingoShowNineSliceFrameProps> = ({
  frames,
  displayCorner = 20,
  padding = 'sm',
  style,
  contentStyle,
  children,
}) => {
  const { themeId, theme } = useAppTheme();
  const padVal = BingoShowSpacing[padding] ?? 8;
  const c = displayCorner;

  const isDefaultTheme = themeId === 'bingo-show';

  if (!isDefaultTheme) {
    const borderColor = theme.borderPrimary || '#087FFC';
    const glowColor = theme.primaryGlow || 'rgba(8, 127, 252, 0.4)';
    const bgColor = theme.panelBg || 'rgba(3, 17, 48, 0.92)';

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          backgroundColor: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: 20,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px ${glowColor}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            padding: padVal,
            ...contentStyle,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* 9-SLICE BACKGROUND LAYER */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* CENTER */}
        <div
          style={{
            position: 'absolute',
            inset: `${c}px`,
            backgroundImage: `url(${frames.center})`,
            backgroundSize: '100% 100%',
          }}
        />

        {/* CORNERS */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: c, height: c, backgroundImage: `url(${frames.cornerTL})`, backgroundSize: '100% 100%' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: c, height: c, backgroundImage: `url(${frames.cornerTR})`, backgroundSize: '100% 100%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: c, height: c, backgroundImage: `url(${frames.cornerBL})`, backgroundSize: '100% 100%' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: c, height: c, backgroundImage: `url(${frames.cornerBR})`, backgroundSize: '100% 100%' }} />

        {/* EDGES */}
        <div style={{ position: 'absolute', top: 0, left: c, right: c, height: c, backgroundImage: `url(${frames.topLeft})`, backgroundSize: '100% 100%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: c, right: c, height: c, backgroundImage: `url(${frames.bottomLeft})`, backgroundSize: '100% 100%' }} />
        <div style={{ position: 'absolute', left: 0, top: c, bottom: c, width: c, backgroundImage: `url(${frames.leftTop})`, backgroundSize: '100% 100%' }} />
        <div style={{ position: 'absolute', right: 0, top: c, bottom: c, width: c, backgroundImage: `url(${frames.rightTop})`, backgroundSize: '100% 100%' }} />
      </div>

      {/* CONTENT LAYER */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: padVal,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};


export default BingoShowNineSliceFrame;

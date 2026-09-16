import React from 'react';
import { BingoShowSpacing } from '../design-system';

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
  const padVal = BingoShowSpacing[padding] ?? 8;
  const c = displayCorner;

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

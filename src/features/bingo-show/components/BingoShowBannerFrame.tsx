import React from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowSpacing } from '../design-system';
import { BingoShowNineSliceFrame } from './BingoShowNineSliceFrame';

export interface BingoShowBannerFrameProps {
  padding?: keyof typeof BingoShowSpacing;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BingoShowBannerFrame: React.FC<BingoShowBannerFrameProps> = ({
  padding = 'sm',
  style,
  contentStyle,
  children,
}) => {
  const src = BingoShowAssets.framesBannerBlue;

  return (
    <BingoShowNineSliceFrame
      frames={{
        cornerTL: src.cornerTL,
        cornerTR: src.cornerTR,
        cornerBL: src.cornerBL,
        cornerBR: src.cornerBR,
        center: src.center,
        topLeft: src.topLeft,
        topSpark: src.topSpark,
        topRight: src.topRight,
        bottomLeft: src.bottomLeft,
        bottomSpark: src.bottomSpark,
        bottomRight: src.bottomRight,
        leftTop: src.left,
        leftBottom: src.left,
        rightTop: src.right,
        rightBottom: src.right,
      }}
      displayCorner={12}
      padding={padding}
      style={style}
      contentStyle={contentStyle}
    >
      {children}
    </BingoShowNineSliceFrame>
  );
};

export default BingoShowBannerFrame;

import React from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowSpacing } from '../design-system';
import { BingoShowNineSliceFrame } from './BingoShowNineSliceFrame';

export interface BingoShowTopWinnersFrameProps {
  padding?: keyof typeof BingoShowSpacing;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BingoShowTopWinnersFrame: React.FC<BingoShowTopWinnersFrameProps> = ({
  padding = 'sm',
  style,
  contentStyle,
  children,
}) => (
  <BingoShowNineSliceFrame
    frames={BingoShowAssets.framesTopWinners}
    displayCorner={20}
    padding={padding}
    style={style}
    contentStyle={contentStyle}
  >
    {children}
  </BingoShowNineSliceFrame>
);

export default BingoShowTopWinnersFrame;

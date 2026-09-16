/**
 * BingoShowFooterBlueFrame.tsx — moldura 9-slice usando o asset `footerblue-*`
 * (`assets/cards/9slice/footerblue-*.png`, mesmo formato de 13 peças do
 * `framesBannerBlue`), pedido explícito do usuário para montar o card do popup de
 * ganhador ("tem um card que vc pode montar ele e renderir e redimencionar isso").
 * Segue exatamente o padrão de `BingoShowBannerFrame.tsx`.
 */
import React from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowSpacing } from '../design-system';
import { BingoShowNineSliceFrame } from './BingoShowNineSliceFrame';

export interface BingoShowFooterBlueFrameProps {
  padding?: keyof typeof BingoShowSpacing;
  displayCorner?: number;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BingoShowFooterBlueFrame: React.FC<BingoShowFooterBlueFrameProps> = ({
  padding = 'sm',
  displayCorner = 12,
  style,
  contentStyle,
  children,
}) => {
  const src = BingoShowAssets.framesFooterBlue;

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
      displayCorner={displayCorner}
      padding={padding}
      style={style}
      contentStyle={contentStyle}
    >
      {children}
    </BingoShowNineSliceFrame>
  );
};

export default BingoShowFooterBlueFrame;

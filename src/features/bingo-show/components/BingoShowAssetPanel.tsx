import React from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowGlowHalo } from './BingoShowGlowHalo';
import { BingoShowRadius, BingoShowSpacing } from '../design-system';

export type BingoShowAssetPanelVariant =
  | 'glass'
  | 'header'
  | 'footer'
  | 'neon'
  | 'dark'
  | 'main'
  | 'modal'
  | 'popup'
  | 'sidebar'
  | 'ranking'
  | 'prize'
  | 'jackpot'
  | 'ticket'
  | 'tableHeader'
  | 'tableRow'
  | 'topWinners';

const VARIANT_ASSET: Record<BingoShowAssetPanelVariant, string> = {
  glass: BingoShowAssets.panels.glass,
  header: BingoShowAssets.panels.header,
  footer: BingoShowAssets.panels.footer,
  neon: BingoShowAssets.panels.neon,
  dark: BingoShowAssets.panels.dark,
  main: BingoShowAssets.panels.main,
  modal: BingoShowAssets.panels.modal,
  popup: BingoShowAssets.panels.popup,
  sidebar: BingoShowAssets.panels.sidebar,
  ranking: BingoShowAssets.cards.ranking,
  prize: BingoShowAssets.cards.prize,
  jackpot: BingoShowAssets.cards.jackpot,
  ticket: BingoShowAssets.cards.ticket,
  tableHeader: BingoShowAssets.cards.tableHeader,
  tableRow: BingoShowAssets.cards.tableRow,
  topWinners: BingoShowAssets.cards.topWinners,
};

export interface BingoShowAssetPanelProps {
  variant?: BingoShowAssetPanelVariant;
  padding?: keyof typeof BingoShowSpacing;
  radius?: keyof typeof BingoShowRadius;
  glow?: { color: string; bleed?: number; intensity?: number; pulse?: boolean } | false;
  resizeMode?: 'cover' | 'stretch' | 'contain';
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BingoShowAssetPanel: React.FC<BingoShowAssetPanelProps> = ({
  variant = 'glass',
  padding = 'md',
  radius = 'md',
  glow = false,
  resizeMode = 'cover',
  style,
  contentStyle,
  children,
}) => {
  const padVal = BingoShowSpacing[padding] ?? 12;
  const radVal = BingoShowRadius[radius] ?? 12;
  const assetUrl = VARIANT_ASSET[variant];

  const content = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: radVal,
        backgroundImage: `url(${assetUrl})`,
        backgroundSize: resizeMode === 'stretch' ? '100% 100%' : resizeMode === 'contain' ? 'contain' : 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
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

  if (glow) {
    return (
      <BingoShowGlowHalo color={glow.color} bleed={glow.bleed ?? 14} intensity={glow.intensity ?? 0.4} pulse={glow.pulse ?? false}>
        {content}
      </BingoShowGlowHalo>
    );
  }

  return content;
};

export default BingoShowAssetPanel;

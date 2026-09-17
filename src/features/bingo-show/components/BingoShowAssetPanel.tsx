import React from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowGlowHalo } from './BingoShowGlowHalo';
import { BingoShowRadius, BingoShowSpacing } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';

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

const BLUE_VARIANT_ASSET: Partial<Record<BingoShowAssetPanelVariant, string>> = {
  glass: '/themes/bingo-show-blue/panels/panel-glass.png',
  header: '/themes/bingo-show-blue/panels/panel-header.png',
  footer: '/themes/bingo-show-blue/panels/panel-footer.png',
  neon: '/themes/bingo-show-blue/panels/panel-neon.png',
  dark: '/themes/bingo-show-blue/panels/panel-dark.png',
  main: '/themes/bingo-show-blue/panels/panel-main.png',
  modal: '/themes/bingo-show-blue/panels/panel-modal.png',
  popup: '/themes/bingo-show-blue/panels/panel-popup.png',
  sidebar: '/themes/bingo-show-blue/panels/panel-sidebar.png',
  ranking: '/themes/bingo-show-blue/cards/card-ranking.png',
  prize: '/themes/bingo-show-blue/cards/card-prize.png',
  jackpot: '/themes/bingo-show-blue/cards/card-jackpot.png',
  ticket: '/themes/bingo-show-blue/cards/card-ticket.png',
  tableHeader: '/themes/bingo-show-blue/cards/card-table-header.png',
  tableRow: '/themes/bingo-show-blue/cards/card-table-row.png',
  topWinners: '/themes/bingo-show-blue/cards/card-ranking.png',
};

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
  const { themeId, theme } = useAppTheme();
  const padVal = BingoShowSpacing[padding] ?? 12;
  const radVal = BingoShowRadius[radius] ?? 12;

  const isBlueTheme = themeId === 'bingo-show-blue';
  const assetUrl = (isBlueTheme && BLUE_VARIANT_ASSET[variant])
    ? BLUE_VARIANT_ASSET[variant]!
    : (themeId === 'bingo-show' ? VARIANT_ASSET[variant] : undefined);

  const content = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: radVal,
        backgroundColor: assetUrl ? undefined : theme.panelBg,
        backgroundImage: assetUrl ? `url(${assetUrl})` : undefined,
        border: !assetUrl ? `2px solid ${theme.borderPrimary}` : undefined,
        backgroundSize: resizeMode === 'stretch' ? '100% 100%' : resizeMode === 'contain' ? 'contain' : 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        boxShadow: !assetUrl ? `0 8px 32px rgba(0,0,0,0.4)` : undefined,
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
      <BingoShowGlowHalo color={glow.color || theme.primaryGlow || theme.secondary} bleed={glow.bleed ?? 14} intensity={glow.intensity ?? 0.4} pulse={glow.pulse ?? false}>
        {content}
      </BingoShowGlowHalo>
    );
  }

  return content;
};

export default BingoShowAssetPanel;

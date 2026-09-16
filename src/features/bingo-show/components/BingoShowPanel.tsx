/**
 * BingoShowPanel.tsx — porte de `tvapp1/src/features/bingo-show/components/BingoShowPanel.tsx`.
 * `shadow(Color/Offset/Opacity/Radius)`/`elevation` → `box-shadow` via
 * `toCssBoxShadow` (mesma técnica do resto do porte).
 */
import type { CSSProperties, ReactNode } from 'react';
import { BingoShowRadius, BingoShowSpacing } from '../design-system';
import { toCssBoxShadow } from '../design-system/shadows';

export type BingoShowPanelVariant = 'surface' | 'glass' | 'elevated' | 'deep' | 'neonBlue' | 'neonGold';

export interface BingoShowPanelProps {
  variant?: BingoShowPanelVariant;
  padding?: keyof typeof BingoShowSpacing;
  radius?: keyof typeof BingoShowRadius;
  style?: CSSProperties;
  children?: ReactNode;
}

export function BingoShowPanel({ variant = 'surface', padding = 'md', radius = 'md', style, children }: BingoShowPanelProps) {
  const paddingVal = BingoShowSpacing[padding];
  const radiusVal = BingoShowRadius[radius];

  let variantStyle: CSSProperties;
  switch (variant) {
    case 'neonGold':
      variantStyle = {
        backgroundColor: 'rgba(6, 18, 48, 0.92)',
        borderColor: '#FFDE38',
        borderWidth: 2,
        boxShadow: toCssBoxShadow({ shadowColor: '#FF9100', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12, elevation: 12 }),
      };
      break;
    case 'neonBlue':
    case 'glass':
      variantStyle = {
        backgroundColor: 'rgba(6, 18, 48, 0.92)',
        borderColor: '#00E5FF',
        borderWidth: 2,
        boxShadow: toCssBoxShadow({ shadowColor: '#0088FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 }),
      };
      break;
    case 'elevated':
      variantStyle = {
        backgroundColor: 'rgba(10, 25, 60, 0.95)',
        borderColor: '#00E5FF',
        borderWidth: 2,
        boxShadow: toCssBoxShadow({ shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 14, elevation: 14 }),
      };
      break;
    case 'deep':
      variantStyle = {
        backgroundColor: 'rgba(2, 5, 20, 0.95)',
        borderColor: 'rgba(0, 229, 255, 0.4)',
        borderWidth: 1.5,
      };
      break;
    case 'surface':
    default:
      variantStyle = {
        backgroundColor: 'rgba(6, 18, 48, 0.85)',
        borderColor: 'rgba(0, 229, 255, 0.6)',
        borderWidth: 1.5,
      };
      break;
  }

  return (
    <div
      style={{
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderStyle: 'solid',
        ...variantStyle,
        padding: paddingVal,
        borderRadius: radiusVal,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default BingoShowPanel;

/**
 * NumberGrid.tsx — porte de `tvapp1/src/components/NumberGrid.tsx`.
 *
 * `FlatList numColumns` → CSS Grid (`display: grid; grid-template-columns:
 * repeat(columns, cellSize)`), convenção já usada no restante do porte.
 * `useWindowDimensions()` → constantes fixas do palco (`TV_STAGE_WIDTH`/
 * `TV_STAGE_HEIGHT`), mesma decisão de `AnimatedActiveBall.tsx`: o grid é
 * sempre calculado para o perfil `tv1080` (90/18 = 5 linhas, cellSize=38,
 * gap=4 — determinístico, ver `theme/responsive.ts`).
 *
 * Escopo confirmado (só tema04): o ramo "Modo Legado" (tema01/02/03) do RN
 * nunca é alcançável aqui (`isBingoShow` sempre `true`), removido — mesma
 * decisão já tomada em `Ball.tsx`/`ThemeLogo.tsx`.
 *
 * `Animated.sequence` (scale 0.8→1.2→1.0 na bola `current`) → keyframe CSS
 * `bs-grid-cell-pop` (ver `globals.css`), disparado ao `animation-name`
 * passar de nenhum para o keyframe quando `isCurrent` fica `true`.
 */
'use client';

import { memo, useMemo, type CSSProperties } from 'react';
import { TV_STAGE_HEIGHT, TV_STAGE_WIDTH } from '@/components/tv/TvStageContext';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import { getGridMetrics, getLayoutProfile } from '@/theme/responsive';
import { getBallColorGroup } from '../theme/resolveBallAsset';
import Icon from '../Icon';

export interface NumberGridProps {
  drawnNumbers: number[];
  currentBall: number | null;
  theme: ThemeTokens;
}

export type GridCellState = 'default' | 'drawn' | 'current' | 'selected' | 'disabled';

interface NumberGridCellProps {
  num: number;
  state: GridCellState;
  cellSize: number;
  theme: ThemeTokens;
}

const NumberGridCell = memo(function NumberGridCell({ num, state, cellSize, theme }: NumberGridCellProps) {
  const isCurrent = state === 'current';

  const group = getBallColorGroup(num);
  let accentColor = '#facc15';
  if (group === 'green') accentColor = '#10b981';
  else if (group === 'red') accentColor = '#ef4444';
  else if (group === 'blue') accentColor = '#3b82f6';
  else if (group === 'purple') accentColor = '#a855f7';

  let cellBg = 'rgba(6, 7, 26, 0.5)';
  let cellBorder = alphaColor(accentColor, '15');
  let textColor = 'rgba(255, 255, 255, 0.35)';
  let fontWeight: 600 | 900 = 600;
  let hasGlow = false;

  switch (state) {
    case 'current':
      cellBg = '#ffde38';
      cellBorder = '#ffffff';
      textColor = '#000000';
      fontWeight = 900;
      hasGlow = true;
      break;
    case 'drawn':
      cellBg = alphaColor(accentColor, '33');
      cellBorder = accentColor;
      textColor = '#ffffff';
      fontWeight = 900;
      break;
    case 'selected':
      cellBg = theme.primary;
      cellBorder = '#ffffff';
      textColor = '#000000';
      fontWeight = 900;
      break;
    case 'disabled':
      cellBg = 'rgba(255, 255, 255, 0.02)';
      cellBorder = 'rgba(255, 255, 255, 0.03)';
      textColor = 'rgba(255, 255, 255, 0.15)';
      break;
    case 'default':
    default:
      break;
  }

  let voiceLabel = `Número ${num} não sorteado`;
  if (state === 'current') voiceLabel = `Número atual ${num}`;
  else if (state === 'drawn') voiceLabel = `Número ${num} sorteado`;
  else if (state === 'selected') voiceLabel = `Número ${num} selecionado`;
  else if (state === 'disabled') voiceLabel = `Número ${num} indisponível`;

  return (
    <div
      data-testid={`number-grid-cell-${num}`}
      aria-label={voiceLabel}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: cellSize,
        height: cellSize,
        borderRadius: cellSize / 2,
        border: '1px solid',
        backgroundColor: cellBg,
        borderColor: cellBorder,
        opacity: 1,
        boxShadow: hasGlow ? '0px 0px 8px #ffde38' : undefined,
        animation: isCurrent ? 'bs-grid-cell-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : undefined,
      }}
    >
      <span
        style={{
          textAlign: 'center',
          fontSize: Math.max(8, cellSize * 0.44),
          color: textColor,
          fontWeight,
        }}
      >
        {num}
      </span>
    </div>
  );
});

const NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);

export function NumberGrid({ drawnNumbers, currentBall, theme }: NumberGridProps) {
  const width = TV_STAGE_WIDTH;
  const height = TV_STAGE_HEIGHT;
  const profile = getLayoutProfile(width, height);
  const metrics = getGridMetrics(width * (profile === 'mobilePortrait' ? 0.92 : 0.65), height, profile);

  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${metrics.columns}, ${metrics.cellSize}px)`,
    gap: metrics.gap,
    justifyContent: 'center',
  };

  return (
    <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} data-testid="number-grid">
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
        <Icon name="grid" size={14} color={theme.textMuted} />
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: theme.textMuted }}>
          CONTAGEM DAS 90 PEDRAS ({drawnNumbers.length}/90)
        </span>
      </div>

      <div style={gridStyle}>
        {NUMBERS.map((n) => {
          const isCurrent = currentBall === n;
          const isDrawn = drawnSet.has(n);
          let cellState: GridCellState = 'default';
          if (isCurrent) cellState = 'current';
          else if (isDrawn) cellState = 'drawn';

          return <NumberGridCell key={n} num={n} state={cellState} cellSize={metrics.cellSize} theme={theme} />;
        })}
      </div>
    </div>
  );
}

export default NumberGrid;

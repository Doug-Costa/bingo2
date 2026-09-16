/**
 * BingoShowGlowHalo.tsx — porte de `tvapp1/src/features/bingo-show/components/BingoShowGlowHalo.tsx`.
 *
 * `react-native-svg` (RadialGradient) → SVG nativo do DOM — mesma técnica de
 * duas camadas (bloom externo + núcleo). IDs de gradiente gerados via
 * `useId()` (em vez de string fixa) para não colidir quando múltiplas
 * instâncias renderizam ao mesmo tempo (RN não tinha esse problema —
 * cada `<Svg>` era uma árvore nativa isolada).
 *
 * `Animated.loop`/`useSharedValue` (pulso de opacidade, shine diagonal) →
 * keyframes CSS. `pulse`: opacity 0.75↔1 a cada `pulseDuration` (ciclo total
 * `pulseDuration*2`), `animationDuration` setado inline (prop dinâmica).
 * `shine`: aproximação em CSS do sweep diagonal com pausa (`shineDuration`
 * de varredura + `shinePause` de espera) — mesma lógica (traço de luz
 * atravessando e parando), técnica de temporização levemente simplificada
 * (percentuais fixos de fade nas bordas do sweep em vez dos thresholds
 * exatos `>0.85`/`<-0.85` do RN). `shine` não é usado pela `ConfigScreen`
 * (só `pulse`), mantido para paridade de API.
 */
'use client';

import { useId, type CSSProperties, type ReactNode } from 'react';

export interface BingoShowGlowHaloProps {
  color?: string;
  bleed?: number;
  intensity?: number;
  pulse?: boolean;
  pulseDuration?: number;
  borderRadius?: number;
  shine?: boolean;
  shineDuration?: number;
  shinePause?: number;
  style?: CSSProperties;
  children?: ReactNode;
}

export function BingoShowGlowHalo({
  color = '#00E5FF',
  bleed = 28,
  intensity = 0.6,
  pulse = true,
  pulseDuration = 2600,
  borderRadius = 0,
  shine = false,
  shineDuration = 2200,
  shinePause = 2800,
  style,
  children,
}: BingoShowGlowHaloProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bloomId = `bs-halo-bloom-${uid}`;
  const coreId = `bs-halo-core-${uid}`;

  const pulseAnimation: CSSProperties = pulse ? { animation: `bs-glow-halo-pulse ${pulseDuration * 2}ms ease-in-out infinite` } : {};

  const totalShine = shineDuration + shinePause;

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* CAMADA DE DIFUSÃO EXTERNA — bloom largo e suave */}
      <div
        style={{
          position: 'absolute',
          top: -bleed,
          left: -bleed,
          right: -bleed,
          bottom: -bleed,
          pointerEvents: 'none',
          opacity: pulse ? undefined : 1,
          ...pulseAnimation,
        }}
      >
        <svg width="100%" height="100%">
          <defs>
            <radialGradient id={bloomId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={color} stopOpacity={intensity} />
              <stop offset="55%" stopColor={color} stopOpacity={intensity * 0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill={`url(#${bloomId})`} />
        </svg>
      </div>

      {/* CAMADA DE NÚCLEO — anel mais próximo e mais brilhante, lê como neon aceso */}
      <div
        style={{
          position: 'absolute',
          top: -bleed * 0.35,
          left: -bleed * 0.35,
          right: -bleed * 0.35,
          bottom: -bleed * 0.35,
          pointerEvents: 'none',
          opacity: pulse ? undefined : 1,
          ...pulseAnimation,
        }}
      >
        <svg width="100%" height="100%">
          <defs>
            <radialGradient id={coreId} cx="50%" cy="50%" r="52%">
              <stop offset="0%" stopColor={color} stopOpacity={0} />
              <stop offset="78%" stopColor={color} stopOpacity={Math.min(intensity * 1.4, 1)} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill={`url(#${coreId})`} />
        </svg>
      </div>

      {/* `children` continua filho direto do wrapper, sem envolvê-lo — mesmo
          comportamento do RN (o `shine` é uma camada IRMÃ absoluta). */}
      {children}

      {shine && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: borderRadius || undefined, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: -80,
              bottom: -80,
              width: 100,
              backgroundColor: '#FFFFFF',
              transform: 'rotate(16deg)',
              animation: `bs-glow-halo-shine ${totalShine}ms linear infinite`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default BingoShowGlowHalo;

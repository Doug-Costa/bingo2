/**
 * Ball.tsx — porte de `tvapp1/src/components/Ball.tsx`.
 *
 * Escopo confirmado pelo usuário: SÓ tema04 (Bingo Show) — o ramo "MODO
 * LEGADO" do RN (tema01/02/03, bolas coloridas sem PNG) nunca é alcançável
 * aqui porque `resolveTheme()` sempre retorna `temaBingoShow`
 * (`isBingoShow` sempre `true`), então esse ramo foi descartado, igual à
 * mesma decisão já tomada em `ThemeLogo.tsx` (ver `docs/migration-map-tvscreen.md`).
 * Mantido apenas um fallback mínimo para o caso teórico de `visual.source`
 * nulo (não deve ocorrer — os 49 PNGs de bola do tema04 foram copiados).
 *
 * Animação de entrada (`Animated.spring` + `rotate`) → keyframe CSS
 * `ball-enter` (ver `globals.css`), reiniciada via remount (`key={nonce}`)
 * quando `number` muda e `animate` é `true` — mesma lógica (anima ao trocar
 * de número), técnica diferente (CSS em vez de spring physics do RN).
 * `logAssetLoad` (logger de diagnóstico só de dev) não portado — não afeta
 * dado/visual real.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { resolveTheme, type ThemeTokens } from '@/theme/themes';
import { resolveBallAsset, type BallVisualState } from '../theme/resolveBallAsset';
import { combineStyles } from '../theme/utils';

export type BallSize = 'sm' | 'md' | 'lg' | 'xl' | 'tiny' | 'small' | 'medium' | 'large' | 'active' | 'hero' | number;

export interface BallProps {
  number: number;
  size?: BallSize;
  active?: boolean;
  animate?: boolean;
  state?: BallVisualState;
  theme?: ThemeTokens;
  style?: CSSProperties;
  textStyle?: CSSProperties;
  testID?: string;
  accessibilityLabel?: string;
}

const LEGACY_SIZES: Record<string, { diameter: number; fontSize: number }> = {
  sm: { diameter: 32, fontSize: 11 },
  md: { diameter: 52, fontSize: 18 },
  lg: { diameter: 176, fontSize: 72 },
  xl: { diameter: 220, fontSize: 110 },
};

const SIZE_KEY_MAP: Record<string, string> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'active',
};

export function Ball({
  number,
  size = 'lg',
  active = false,
  animate = true,
  state,
  theme: propsTheme,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}: BallProps) {
  const theme = propsTheme || resolveTheme('tema01');

  let diameter = 52;
  let fontSize = 18;

  if (typeof size === 'number') {
    diameter = size;
    fontSize = size * 0.44;
  } else {
    const resolvedKey = SIZE_KEY_MAP[size] || size;
    const ballsConfig = theme.ballsConfig as unknown as Record<string, { size: number; fontSize?: number }> | undefined;
    const cfg = ballsConfig?.[resolvedKey];
    if (cfg) {
      diameter = cfg.size;
      fontSize = cfg.fontSize || cfg.size * 0.42;
    } else {
      const sz = LEGACY_SIZES[size as string] || LEGACY_SIZES.md;
      diameter = sz?.diameter ?? 52;
      fontSize = sz?.fontSize ?? 18;
    }
  }

  const ballState: BallVisualState = state || (active ? 'active' : 'default');
  const visual = resolveBallAsset(theme, number, ballState);

  const [nonce, setNonce] = useState(0);
  const prevNumber = useRef<number | null>(null);
  useEffect(() => {
    if (animate && number !== prevNumber.current) {
      setNonce((n) => n + 1);
    }
    prevNumber.current = number;
  }, [animate, number]);

  let voiceLabel = `Bola ${number}`;
  if (ballState === 'active') voiceLabel = `Bola atual ${number}`;
  else if (ballState === 'previous') voiceLabel = `Bola anterior ${number}`;
  else if (ballState === 'called') voiceLabel = `Bola sorteada ${number}`;
  else if (ballState === 'winner') voiceLabel = `Bola vencedora ${number}`;

  const entranceStyle: CSSProperties = animate
    ? { animation: 'bs-ball-enter 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }
    : {};

  if (visual.source) {
    const containerStyle = combineStyles<CSSProperties>(
      {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: diameter,
        height: diameter,
        overflow: 'visible',
      },
      style,
    );

    const textFontSize = fontSize * 0.95;
    const imgSize = Math.round(diameter * (ballState === 'winner' || ballState === 'active' ? 1.32 : 1.0));

    return (
      <div
        key={animate ? nonce : 'static'}
        style={{ ...containerStyle, ...entranceStyle }}
        data-testid={testID}
        aria-label={accessibilityLabel || voiceLabel}
      >
        {visual.glowColor && (
          <div
            style={{
              position: 'absolute',
              opacity: 0.25,
              zIndex: -1,
              width: diameter + 10,
              height: diameter + 10,
              borderRadius: (diameter + 10) / 2,
              backgroundColor: visual.glowColor,
              boxShadow: `0px 0px 10px color-mix(in srgb, ${visual.glowColor} 80%, transparent)`,
            }}
          />
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.source}
          alt=""
          style={{
            position: 'absolute',
            width: imgSize,
            height: imgSize,
            objectFit: 'contain',
          }}
        />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '6%', paddingRight: '6%' }}>
          <span
            style={{
              fontWeight: 900,
              textAlign: 'center',
              fontSize: textFontSize,
              color: visual.textColor,
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...textStyle,
            }}
          >
            {number}
          </span>
        </div>
      </div>
    );
  }

  // Fallback mínimo (não deve ocorrer no escopo tema04) — bola sólida sem PNG.
  return (
    <div
      key={animate ? nonce : 'static'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: theme.primary,
        border: '1.5px solid rgba(255,255,255,0.3)',
        ...entranceStyle,
        ...style,
      }}
      data-testid={testID}
      aria-label={accessibilityLabel || voiceLabel}
    >
      <span style={{ fontWeight: 900, fontSize, color: visual.textColor, ...textStyle }}>{number}</span>
    </div>
  );
}

export default Ball;

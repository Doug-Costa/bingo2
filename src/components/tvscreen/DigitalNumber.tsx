/**
 * DigitalNumber.tsx — porte de `tvapp1/src/components/DigitalNumber.tsx`.
 * `elevation` descartado, `includeFontPadding`/`textAlignVertical` (métricas
 * de texto Android-only) sem equivalente/necessidade na web — removidos.
 */
import type { ThemeTokens } from '@/theme/themes';

export interface DigitalNumberProps {
  value: string;
  theme: ThemeTokens;
  size?: number;
}

export function DigitalNumber({ value, theme, size = 64 }: DigitalNumberProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size * 0.75,
        height: size,
        borderRadius: size * 0.18,
        backgroundColor: theme.countdownBg,
        borderColor: theme.borderPrimary,
        borderWidth: 2,
        borderStyle: 'solid',
        boxShadow: `0px 0px 12px color-mix(in srgb, ${theme.primaryGlow} 40%, transparent)`,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: size * 0.75,
          color: theme.countdownText,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default DigitalNumber;

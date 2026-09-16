/**
 * typography.ts — porte de `tvapp1/src/theme/typography.ts`.
 *
 * Só as 18 variantes usadas por `temaBingoShow.typography` (o resto do
 * arquivo original é de outros temas, fora do escopo). No RN cada entrada é
 * um objeto de estilo `StyleSheet.create`; aqui viram objetos simples
 * (`React.CSSProperties`-compatíveis) consumidos por `ThemeText`.
 */
export interface TypographyStyle {
  fontSize: number;
  fontWeight: number | string;
  letterSpacing?: number;
  lineHeight?: number;
  fontFamily?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export const Typography: Record<string, TypographyStyle> = {
  displayLarge: { fontSize: 56, fontWeight: 900, letterSpacing: -1.5, lineHeight: 64 },
  displayMedium: { fontSize: 44, fontWeight: 900, letterSpacing: -1, lineHeight: 52 },
  titleLarge: { fontSize: 24, fontWeight: 800, letterSpacing: -0.2, lineHeight: 30 },
  titleMedium: { fontSize: 20, fontWeight: 700, lineHeight: 26 },
  titleSmall: { fontSize: 16, fontWeight: 600, lineHeight: 22 },
  bodyLarge: { fontSize: 16, fontWeight: 400, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: 400, lineHeight: 22 },
  bodySmall: { fontSize: 12, fontWeight: 400, lineHeight: 18 },
  labelLarge: { fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' },
  labelMedium: { fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' },
  labelSmall: { fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' },
  numberLarge: { fontSize: 36, fontWeight: 900, letterSpacing: -1 },
  numberMedium: { fontSize: 28, fontWeight: 900, letterSpacing: -0.5 },
  numberSmall: { fontSize: 20, fontWeight: 900 },
  digital: { fontSize: 64, fontWeight: 900, fontFamily: 'monospace' },
  winner: { fontSize: 48, fontWeight: 900, letterSpacing: 0.5 },
  ranking: { fontSize: 15, fontWeight: 700 },
  ticket: { fontSize: 14, fontWeight: 800, fontFamily: 'monospace' },
};

export default Typography;

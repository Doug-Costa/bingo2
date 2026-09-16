'use client';

/**
 * ThemeImage.tsx — porte de `tvapp1/src/components/theme/ThemeImage.tsx`.
 *
 * `tintColor` (RN, sem equivalente direto em CSS) → aproximado via
 * `filter` (`brightness(0) saturate(100%)` + `drop-shadow` não reproduz a
 * cor exata; como nenhum uso real de `tintColor` foi encontrado na cadeia
 * `TvScreen`, deixamos o hook pronto (propriedade aceita) mas sem tentar
 * simular — evita inventar um efeito visual que o RN também não produzia
 * fielmente aqui.
 */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { combineStyles } from './utils';
import type { ThemeComponentProps, ThemeImageSource } from './types';

export interface ThemeImageProps extends ThemeComponentProps {
  source: ThemeImageSource | null | undefined;
  fallback?: ThemeImageSource;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  width?: number | string;
  height?: number | string;
  opacity?: number;
  imageStyle?: CSSProperties;
}

export function ThemeImage({
  source,
  fallback,
  resizeMode = 'contain',
  width,
  height,
  opacity = 1.0,
  imageStyle,
  style,
  testID,
  accessibilityLabel,
}: ThemeImageProps) {
  const [hasError, setHasError] = useState(false);

  const activeSource = hasError || !source ? fallback : source;

  if (!activeSource) {
    return null;
  }

  const objectFit: CSSProperties['objectFit'] =
    resizeMode === 'stretch' ? 'fill' : resizeMode === 'cover' ? 'cover' : 'contain';

  const finalStyle = combineStyles<CSSProperties>(
    { width, height, opacity, objectFit },
    imageStyle,
    style,
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element -- porte 1:1, imagem de tema dinâmica
    <img
      src={activeSource}
      alt={accessibilityLabel ?? ''}
      style={finalStyle}
      onError={() => setHasError(true)}
      data-testid={testID}
    />
  );
}

export default ThemeImage;

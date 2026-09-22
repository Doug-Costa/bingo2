'use client';

import type { CSSProperties } from 'react';
import { useAppTheme } from '@/contexts/ThemeContext';
import styles from './TvViewportBackdrop.module.css';

/**
 * TvViewportBackdrop — ambientacao fora do palco 1920x1080.
 *
 * Quando `TvViewport` usa escala `contain`, sobra margem lateral ou vertical
 * em janelas que nao sao exatamente 16:9. Esta camada preenche 100vw x 100dvh
 * atras do `TvStage` com o gradiente de fundo do tema ativo + vinheta suave,
 * para que a margem pareca continuacao do fundo em vez de barra preta.
 *
 * Puramente decorativa: nenhum dado, nenhum componente funcional, nenhum
 * contorno. Fica sempre atras do palco (z-index abaixo) e nao intercepta
 * ponteiro/click.
 */
export function TvViewportBackdrop() {
  const { theme } = useAppTheme();
  const [bgFrom, bgTo] = theme.gradients?.mainBackground ?? [theme.bgColor, theme.bgColor];

  return (
    <div
      className={styles.backdrop}
      style={
        {
          '--backdrop-from': bgFrom,
          '--backdrop-to': bgTo,
          '--backdrop-glow': theme.primaryGlow || theme.primary,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className={styles.glow} />
      <div className={styles.specks} />
      <div className={styles.vignette} />
    </div>
  );
}

export default TvViewportBackdrop;

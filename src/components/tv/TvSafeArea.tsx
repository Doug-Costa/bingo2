'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './TvSafeArea.module.css';

export interface TvSafeAreaProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * TvSafeArea — margem interna de segurança contra overscan.
 *
 * Usa `--bs-spacing-overscan-margin-tv` (16, mesmo valor de
 * `BingoShowSpacing.overscanMarginTV` no RN) como padding, já que os tokens
 * de spacing do design system foram calibrados diretamente na resolução de
 * referência de 1920×1080 (mesmo espaço lógico do `TvStage`).
 *
 * O fundo (`TvStage`/`BingoShowAmbientBackground`) pode ocupar 100% da tela;
 * apenas o CONTEÚDO (textos, logos, números, prêmios, cartelas) deve ficar
 * dentro desta área — replicando a regra do documento original.
 */
export function TvSafeArea({ children, className, style }: TvSafeAreaProps) {
  const classNames = [styles.safeArea, className].filter(Boolean).join(' ');
  return (
    <div className={classNames} style={style}>
      {children}
    </div>
  );
}

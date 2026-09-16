'use client';

import { TV_STAGE_HEIGHT, TV_STAGE_WIDTH, useTvStage } from './TvStageContext';
import styles from './ViewportDebugger.module.css';

export interface ViewportDebuggerProps {
  /** Permite esconder o overlay sem removê-lo da árvore. Padrão: true. */
  visible?: boolean;
}

/**
 * ViewportDebugger — overlay com a resolução real do viewport e a escala
 * calculada em tempo real. Usado na página de validação `/tv` desta Fase 1;
 * em fases futuras deve ficar condicionado a modo de desenvolvimento.
 */
export function ViewportDebugger({ visible = true }: ViewportDebuggerProps) {
  const { viewportWidth, viewportHeight, scale } = useTvStage();

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.debugger}>
      <div className={styles.row}>
        <span className={styles.label}>viewport</span>
        <span className={styles.value}>
          {Math.round(viewportWidth)} × {Math.round(viewportHeight)}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>stage</span>
        <span className={styles.value}>
          {TV_STAGE_WIDTH} × {TV_STAGE_HEIGHT}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>scale</span>
        <span className={styles.value}>{scale.toFixed(4)}</span>
      </div>
    </div>
  );
}

'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTvStage } from './TvStageContext';
import styles from './TvStage.module.css';

export interface TvStageProps {
  children: ReactNode;
  className?: string;
}

/**
 * TvStage — palco lógico de 1920×1080.
 *
 * Todo o conteúdo dentro do TvStage é posicionado como se a tela sempre
 * fosse exatamente 1920×1080 — a escala real (calculada pelo `TvViewport`)
 * é aplicada uma única vez, via `transform: scale()`, ao container inteiro.
 * Isso garante:
 * - proporção 16:9 sempre preservada (nunca deforma H ou V separadamente,
 *   porque é um único fator de escala uniforme, não width/height
 *   independentes);
 * - toda a composição escala como UMA interface de TV, não como colunas
 *   independentes escalando cada uma do seu jeito.
 *
 * Deve ser usado sempre dentro de um `TvViewport` (para ter contexto de
 * escala). Fora dele, renderiza oculto (scale 0) até ter uma medição válida.
 */
export function TvStage({ children, className }: TvStageProps) {
  const { scale } = useTvStage();

  const style = {
    '--tv-scale': scale > 0 ? scale : 1,
  } as CSSProperties;

  // scale === 0 → TvViewport ainda não mediu: oculta o palco em vez de exibi-lo
  // em 1920×1080 reais por um frame. Servidor e 1º render do cliente saem
  // idênticos (scale 0), então a hidratação não diverge.
  const classNames = [styles.stage, scale > 0 ? null : styles.hidden, className].filter(Boolean).join(' ');

  return (
    <div className={classNames} style={style}>
      {children}
    </div>
  );
}

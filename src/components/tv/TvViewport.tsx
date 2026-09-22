'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useElementSize } from '@/hooks/useElementSize';
import {
  TV_STAGE_HEIGHT,
  TV_STAGE_WIDTH,
  TvStageContext,
  type TvViewportContextValue,
} from './TvStageContext';
import { TvViewportBackdrop } from './TvViewportBackdrop';
import styles from './TvViewport.module.css';

export interface TvViewportProps {
  children: ReactNode;
}

/**
 * TvViewport — container raiz de tela cheia.
 *
 * Responsabilidades (conforme especificação da Fase 1):
 * - ocupar 100% da largura/altura disponíveis, fixo na tela;
 * - impedir scroll (herdado também do reset em `globals.css`, redundância
 *   proposital: overflow escondido tanto no `html/body` quanto aqui);
 * - medir a si mesmo via `ResizeObserver` (reage a mudanças do WebView, não
 *   só a `window.resize`);
 * - calcular `scale = min(viewportWidth / 1920, viewportHeight / 1080)` e
 *   disponibilizar isso (junto com as dimensões reais) via contexto para
 *   `TvStage` e `ViewportDebugger`.
 *
 * Não desenha o palco em si (quem centraliza e escala o conteúdo 1920×1080 é
 * o `TvStage`) — apenas mede, provê contexto, e renderiza o
 * `TvViewportBackdrop` atrás do palco para preencher a margem quando a
 * janela não é 16:9.
 */
export function TvViewport({ children }: TvViewportProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  const contextValue = useMemo<TvViewportContextValue>(() => {
    const { width, height } = size;
    const w = width > 0 ? width : typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = height > 0 ? height : typeof window !== 'undefined' ? window.innerHeight : 1080;
    // contain (nao cover): o palco 1920x1080 fica sempre 100% visivel, sem
    // cortar cabecalho/rodape em janelas fora de 16:9. A sobra de espaco nos
    // eixos vira margem, preenchida pelo TvViewportBackdrop (nao barras pretas).
    const scale = Math.min(w / TV_STAGE_WIDTH, h / TV_STAGE_HEIGHT);

    return {
      viewportWidth: w,
      viewportHeight: h,
      scale,
      scaledStageWidth: TV_STAGE_WIDTH * scale,
      scaledStageHeight: TV_STAGE_HEIGHT * scale,
    };
  }, [size]);

  return (
    <div ref={ref} className={styles.viewport}>
      <TvViewportBackdrop />
      <TvStageContext.Provider value={contextValue}>{children}</TvStageContext.Provider>
    </div>
  );
}

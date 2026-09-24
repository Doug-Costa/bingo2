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
    const { width: w, height: h } = size;
    // Antes da 1a medicao, scale = 0 ("ainda nao medido") tanto no servidor
    // quanto no 1o render do cliente — o TvStage fica oculto ate medir. Nao usar
    // window.innerWidth como fallback: o servidor nao tem window (calculava 1),
    // o HTML hidratava com --tv-scale:1 e, como a medicao real repetia o valor
    // do fallback, o React nunca corrigia o DOM — palco preso em 1920x1080 sem
    // escala, cortando header e rodape em qualquer janela menor.
    // contain (nao cover): o palco 1920x1080 fica sempre 100% visivel, sem
    // cortar cabecalho/rodape em janelas fora de 16:9. A sobra de espaco nos
    // eixos vira margem, preenchida pelo TvViewportBackdrop (nao barras pretas).
    const scale = w > 0 && h > 0 ? Math.min(w / TV_STAGE_WIDTH, h / TV_STAGE_HEIGHT) : 0;

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

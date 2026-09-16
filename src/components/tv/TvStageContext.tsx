'use client';

import { createContext, useContext } from 'react';

export const TV_STAGE_WIDTH = 1920;
export const TV_STAGE_HEIGHT = 1080;

export interface TvViewportContextValue {
  /** Largura real do viewport disponível (container do TvViewport), em px. */
  viewportWidth: number;
  /** Altura real do viewport disponível, em px. */
  viewportHeight: number;
  /** scale = min(viewportWidth / 1920, viewportHeight / 1080). */
  scale: number;
  /** Largura do palco 1920 já escalado (viewportWidth do palco renderizado). */
  scaledStageWidth: number;
  /** Altura do palco 1080 já escalada. */
  scaledStageHeight: number;
}

const defaultValue: TvViewportContextValue = {
  viewportWidth: 0,
  viewportHeight: 0,
  scale: 0,
  scaledStageWidth: 0,
  scaledStageHeight: 0,
};

export const TvStageContext = createContext<TvViewportContextValue>(defaultValue);

/**
 * Lê o estado atual do palco de TV (tamanho real do viewport + escala
 * calculada). Deve ser usado por qualquer componente dentro de `TvViewport`
 * que precise saber a escala atual (ex.: `ViewportDebugger`).
 */
export function useTvStage(): TvViewportContextValue {
  return useContext(TvStageContext);
}

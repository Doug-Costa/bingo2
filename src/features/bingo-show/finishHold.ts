'use client';

/**
 * Tempo EXTRA da janela pós-`draw_finish` (além de FINISH_SCREEN_HOLD_MS).
 *
 * Quem sabe quanto tempo a janela precisa é o BingoShowWinnerPopup (quantos
 * popups de ganhador ainda faltam — p.ex. vários ganhadores do BINGO); quem segura
 * a tela é o BingoShowLoopScreen. Este mini-store liga os dois sem prop drilling.
 * Só apresentação: não mexe em dados nem no SSE.
 */
import { useSyncExternalStore } from 'react';

let extraMs = 0;
const listeners = new Set<() => void>();

export function setFinishHoldExtraMs(ms: number): void {
  const next = Math.max(0, Math.round(ms));
  if (next === extraMs) return;
  extraMs = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFinishHoldExtraMs(): number {
  return useSyncExternalStore(subscribe, () => extraMs, () => 0);
}

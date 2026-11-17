'use client';

import { useEffect, useState } from 'react';

/**
 * Lê `prefers-reduced-motion` via `matchMedia` para componentes que animam
 * por inline style (sem CSS Module próprio, onde uma `@media` normal não
 * teria seletor de classe pra se prender) — ex.: `DrawStage`, que hoje é
 * 100% `style={{}}` e não importa nenhum `.module.css`.
 *
 * SSR-safe: começa em `false` (mesmo valor no server e no 1º render do
 * cliente) e só lê a preferência real dentro do `useEffect`, evitando
 * hydration mismatch.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const mql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    // TV fraca (html.tv-ultra, ligado pelo PerfMonitor): mesmo caminho do movimento
    // reduzido — bola aparece sem voo, sem passagem medida no DOM, voz quase imediata.
    const check = () =>
      Boolean(mql?.matches) || root.classList.contains('tv-ultra') || root.classList.contains('tv-native-ball');
    setReduced(check());

    const handler = () => setReduced(check());
    mql?.addEventListener?.('change', handler);
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(handler) : null;
    mo?.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mql?.removeEventListener?.('change', handler);
      mo?.disconnect();
    };
  }, []);

  return reduced;
}

export default usePrefersReducedMotion;

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
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export default usePrefersReducedMotion;

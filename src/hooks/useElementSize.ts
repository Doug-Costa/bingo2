'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Mede o tamanho real (content-box) de um elemento via `ResizeObserver`,
 * reagindo a qualquer mudança — inclusive as que só acontecem dentro de um
 * WebView (rotação, barra de sistema aparecendo/sumindo, etc.), que não
 * disparam necessariamente `window.resize`.
 *
 * Equivalente web do `useWindowDimensions` do React Native, mas escopado ao
 * elemento (não à janela inteira) — o que é o que o `TvViewport` precisa.
 *
 * Usa callback ref (em vez de `useRef`/`RefObject`) de propósito: um
 * `RefObject<T | null>` não é atribuível a `Ref<T>` em algumas versões de
 * `@types/react` (o tipo de retorno de `useRef<T>(null)` não bate com o que
 * `ref={...}` espera). Callback ref evita esse descompasso de tipos —
 * funciona igual, independentemente da versão de `@types/react` instalada —
 * e também nos dá o gancho natural para (re)anexar o `ResizeObserver` quando
 * o nó muda.
 */
export function useElementSize<T extends HTMLElement>(): [
  (_node: T | null) => void,
  ElementSize,
] {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  const ref = useCallback((n: T | null) => {
    setNode(n);
  }, []);

  useEffect(() => {
    if (!node) {
      return;
    }

    const measure = () => {
      const { clientWidth, clientHeight } = node;
      setSize(prev =>
        prev.width === clientWidth && prev.height === clientHeight
          ? prev
          : { width: clientWidth, height: clientHeight },
      );
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      // Fallback defensivo — todo WebView Android moderno tem ResizeObserver,
      // mas evita quebrar em ambientes muito antigos.
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [ref, size];
}

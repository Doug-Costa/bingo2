'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Encolhe a fonte de um texto de uma linha só quando ele não cabe na largura da
 * área marcada com `data-fit-box` mais próxima (entre `max` e `min` px). No mínimo:
 * - `overflow: 'wrap'` libera quebra de linha (nunca corta o texto);
 * - `overflow: 'ellipsis'` mantém uma linha e deixa o CSS aplicar reticências —
 *   último recurso para nomes que não podem quebrar.
 * Mede uma vez por texto/limites (não a cada render).
 */
export function useFitText(text: string, max: number, min: number, overflow: 'wrap' | 'ellipsis' = 'wrap') {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState({ size: max, wrap: false });

  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.closest<HTMLElement>('[data-fit-box]');
    if (!el || !box) return;
    const available = box.clientWidth;
    // Mede no tamanho máximo e depois RESTAURA os estilos inline que o React
    // aplicou (limpar deixaria o texto sem tamanho quando o valor calculado não
    // muda, já que o React não reaplica uma prop igual).
    const prev = { fontSize: el.style.fontSize, whiteSpace: el.style.whiteSpace, overflow: el.style.overflow };
    el.style.fontSize = `${max}px`;
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'visible';
    const natural = el.scrollWidth;
    let size = max;
    if (natural > available && natural > 0) {
      size = Math.max(min, Math.floor((max * available) / natural));
    }
    el.style.fontSize = prev.fontSize;
    el.style.whiteSpace = prev.whiteSpace;
    el.style.overflow = prev.overflow;
    setFit({ size, wrap: overflow === 'wrap' && size === min && (natural * min) / max > available });
  }, [text, max, min, overflow]);

  return { ref, ...fit };
}

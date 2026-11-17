'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * Montagem em duas etapas para os popups de ganhador na TV (html.tv-lite).
 *
 * Ao abrir o card do ganhador, a TV montava o popup inteiro de uma vez — fundo,
 * moldura, selo, cards, cartela de 15 casas — e calculava estilo, layout e pintura
 * de tudo num único quadro. Na TV fraca esse quadro levava quase 1s: a "travada"
 * na abertura. Com o hook, o primeiro quadro tem só a casca (fundo + moldura), cujo
 * fade/escala roda na GPU; o conteúdo pesado entra dois quadros depois, enquanto a
 * casca ainda está aparecendo — a animação dela segue fluida durante o trabalho. Os
 * cards só entram na tela ~650ms depois de abrir, então nada visível atrasa.
 *
 * Fora da TV devolve `true` antes do primeiro paint (useLayoutEffect): nada muda.
 */
export function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!document.documentElement.classList.contains('tv-lite')) setReady(true);
  }, []);

  useEffect(() => {
    if (!document.documentElement.classList.contains('tv-lite')) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);

  return ready;
}

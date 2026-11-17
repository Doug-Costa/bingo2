'use client';

import { useEffect, useState } from 'react';

/**
 * Heurística para TV antiga: WebView velha (Chrome embutido < 80) ou CPU com
 * poucos núcleos. `backdropFilter`/blur custam caro nesse hardware — os
 * componentes que usam este hook desligam só o blur, sem mudar o resto do
 * visual, e só nas TVs que realmente precisam.
 */
function detectLowPerf(): boolean {
  if (typeof navigator === 'undefined') return false;
  const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
  const chromeVersion = chromeMatch?.[1] ? parseInt(chromeMatch[1], 10) : null;
  const oldWebView = chromeVersion !== null && chromeVersion < 80;
  const weakCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;
  return oldWebView || weakCpu;
}

let cached: boolean | null = null;

export function useLowPerfDevice(): boolean {
  const [lowPerf, setLowPerf] = useState(cached ?? false);

  useEffect(() => {
    if (cached === null) cached = detectLowPerf();
    if (cached !== lowPerf) setLowPerf(cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return lowPerf;
}

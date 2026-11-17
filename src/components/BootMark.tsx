'use client';

import { useEffect } from 'react';

/**
 * Avisa o TV_BOOT_GUARD (layout.tsx) que o React subiu nesta TV. Sem esta marca
 * em ~20s, o guard mostra na tela a versão do Chrome/WebView e o erro de JS, e
 * manda os dois para /api/perf ([TV-PERF] boot-fail no log da Vercel).
 */
export function BootMark() {
  useEffect(() => {
    document.documentElement.setAttribute('data-tv-booted', '1');
    const box = document.getElementById('tv-boot-fail');
    if (box) box.remove();
  }, []);
  return null;
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { formatNumberPt } from '../utils/format';

/**
 * Contagem de um valor monetário JÁ FORMATADO (ex.: "R$ 1.250,00", "₲ 12.500.000")
 * de zero até o valor final, mantendo o mesmo prefixo e o mesmo nº de casas
 * decimais. Só apresentação: o texto final é exatamente o recebido.
 *
 * - Começa após `delayMs` e dura `durationMs` (easeOutCubic: rápido no início,
 *   desacelera ao chegar — dá tempo de "ver" o valor final).
 * - Texto sem número (ex.: "VALOR NÃO INFORMADO") é devolvido como está.
 * - `prefers-reduced-motion`: mostra o valor final direto.
 * - Atualiza ~30x/s; na TV (html.tv-lite) ~12x/s: cada troca do texto redesenha o
 *   valor dourado (filtros de sombra) e, na TV fraca, isso disputava os quadros com
 *   a entrada do card.
 *
 * Use de preferência via <CountUpText>: só ele re-renderiza a cada passo da
 * contagem. Com o hook direto no card, o card INTEIRO (cartela de 15 casas,
 * imagens, nome) re-renderizava 30x/s enquanto entrava na tela — era a travada
 * ao abrir o card do ganhador.
 */
export function useCountUp(text: string, delayMs: number, durationMs: number): string {
  const parsed = useMemo(() => parseMoney(text), [text]);
  const [display, setDisplay] = useState(() => (parsed ? parsed.format(0) : text));

  useEffect(() => {
    if (!parsed) {
      setDisplay(text);
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('tv-ultra'));
    if (reduced || durationMs <= 0 || parsed.value === 0) {
      setDisplay(text);
      return;
    }
    setDisplay(parsed.format(0));
    let raf = 0;
    let last = 0;
    const step = document.documentElement.classList.contains('tv-lite') ? 80 : 33;
    const start = performance.now() + delayMs;
    const tick = (t: number) => {
      if (t < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, (t - start) / durationMs);
      if (p >= 1) {
        setDisplay(text); // termina exatamente no texto recebido
        return;
      }
      if (t - last >= step) {
        last = t;
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(parsed.format(parsed.value * eased));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, parsed, delayMs, durationMs]);

  return display;
}

/** Texto da contagem isolado num componente próprio: a cada passo só ele
 * re-renderiza, não o card que o contém. */
export const CountUpText = React.memo(function CountUpText({
  text,
  delayMs,
  durationMs,
}: {
  text: string;
  delayMs: number;
  durationMs: number;
}) {
  return React.createElement(React.Fragment, null, useCountUp(text, delayMs, durationMs));
});

/** "R$ 1.250,00" → { value: 1250, format(n) → "R$ 1.234,56" }. Separadores pt-BR:
 * "." milhar e "," decimal. Sem "," o valor é inteiro (ex.: guarani). */
function parseMoney(text: string): { value: number; format: (n: number) => string } | null {
  const first = text.search(/\d/);
  if (first < 0) return null;
  const prefix = text.slice(0, first);
  const numPart = text.slice(first).trim();
  if (!/^[\d.,]+$/.test(numPart)) return null;
  const comma = numPart.lastIndexOf(',');
  const decimals = comma >= 0 ? numPart.length - comma - 1 : 0;
  const value = Number(numPart.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  const fmt = (n: number) => prefix + formatNumberPt(n, decimals);
  return { value, format: (n: number) => fmt(Math.min(n, value)) };
}

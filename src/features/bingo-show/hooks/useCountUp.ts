'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Contagem de um valor monetário JÁ FORMATADO (ex.: "R$ 1.250,00", "₲ 12.500.000")
 * de zero até o valor final, mantendo o mesmo prefixo e o mesmo nº de casas
 * decimais. Só apresentação: o texto final é exatamente o recebido.
 *
 * - Começa após `delayMs` e dura `durationMs` (easeOutCubic: rápido no início,
 *   desacelera ao chegar — dá tempo de "ver" o valor final).
 * - Texto sem número (ex.: "VALOR NÃO INFORMADO") é devolvido como está.
 * - `prefers-reduced-motion`: mostra o valor final direto.
 * - Atualiza ~30x/s (leve para TV Box).
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
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || durationMs <= 0 || parsed.value === 0) {
      setDisplay(text);
      return;
    }
    setDisplay(parsed.format(0));
    let raf = 0;
    let last = 0;
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
      if (t - last >= 33) {
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
  const fmt = (n: number) =>
    prefix +
    n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return { value, format: (n: number) => fmt(Math.min(n, value)) };
}

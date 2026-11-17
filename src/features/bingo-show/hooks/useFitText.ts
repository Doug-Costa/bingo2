'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Encolhe a fonte de um texto de uma linha só quando ele não cabe na largura da
 * área marcada com `data-fit-box` mais próxima (entre `max` e `min` px). No mínimo:
 * - `overflow: 'wrap'` libera quebra de linha (nunca corta o texto);
 * - `overflow: 'ellipsis'` mantém uma linha e deixa o CSS aplicar reticências —
 *   último recurso para nomes que não podem quebrar.
 *
 * Desempenho (TV fraca): a medida NÃO força layout da página. Antes, a cada bola
 * o valor do acumulado mudava e a medida lia `clientWidth`, trocava a fonte e lia
 * `scrollWidth` — dois layouts da tela inteira no meio da atualização das bolas e
 * do top de ganhadores (~100-200 ms de trava por bola na TV). Agora:
 * - a largura do texto vem do canvas (`measureText`), com a fonte do elemento;
 * - a largura disponível vem do ResizeObserver (entregue já calculada) e fica
 *   guardada; só sem `observe` ela é lida na hora, como antes.
 */

let canvasCtx: CanvasRenderingContext2D | null | undefined;
function ctx(): CanvasRenderingContext2D | null {
  if (canvasCtx === undefined) {
    try {
      canvasCtx = document.createElement('canvas').getContext('2d');
    } catch {
      canvasCtx = null;
    }
  }
  return canvasCtx;
}

interface FontInfo {
  key: string;
  /** fonte do canvas sem o tamanho: "italic 800 " + família */
  style: string;
  family: string;
  /** espaçamento entre letras em px, no tamanho atual da fonte */
  letter: number;
  fontPx: number;
  upper: boolean;
  /** padding + borda horizontais do próprio texto */
  extra: number;
}

function fontInfo(el: HTMLElement, prev: FontInfo | null): FontInfo {
  // Recalcula só quando a classe muda (ex.: prêmio ativo → concluído troca o peso).
  const key = el.className;
  if (prev && prev.key === key) return prev;
  const cs = getComputedStyle(el);
  const px = (v: string) => parseFloat(v) || 0;
  return {
    key,
    style: `${cs.fontStyle} ${cs.fontWeight} `,
    family: cs.fontFamily,
    letter: px(cs.letterSpacing),
    fontPx: px(cs.fontSize) || 1,
    upper: cs.textTransform === 'uppercase',
    extra: px(cs.paddingLeft) + px(cs.paddingRight) + px(cs.borderLeftWidth) + px(cs.borderRightWidth),
  };
}

/** Largura natural do texto em uma linha no tamanho `size` (px), sem layout. */
function textWidth(text: string, f: FontInfo, size: number): number | null {
  const c = ctx();
  if (!c) return null;
  c.font = `${f.style}${size}px ${f.family}`;
  const t = f.upper ? text.toUpperCase() : text;
  const letter = (f.letter * size) / f.fontPx;
  return c.measureText(t).width + letter * t.length + f.extra;
}

export function useFitText(
  text: string,
  max: number,
  min: number,
  overflow: 'wrap' | 'ellipsis' = 'wrap',
  /** Remede quando a LARGURA da área muda depois (ex.: outro elemento da linha
   * aparece/some). Use só com áreas cujo tamanho não depende do próprio texto. */
  observe = false,
) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState({ size: max, wrap: false });
  const widthRef = useRef(-1);
  const fontRef = useRef<FontInfo | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.closest<HTMLElement>('[data-fit-box]');
    if (!el || !box) return;

    // Medida antiga (força layout): só quando não há canvas.
    const measureDom = () => {
      const prev = { fontSize: el.style.fontSize, whiteSpace: el.style.whiteSpace, overflow: el.style.overflow };
      el.style.fontSize = `${max}px`;
      el.style.whiteSpace = 'nowrap';
      el.style.overflow = 'visible';
      const natural = el.scrollWidth;
      el.style.fontSize = prev.fontSize;
      el.style.whiteSpace = prev.whiteSpace;
      el.style.overflow = prev.overflow;
      return natural;
    };

    const apply = (available: number) => {
      if (available <= 0) return;
      fontRef.current = fontInfo(el, fontRef.current);
      const natural = textWidth(text, fontRef.current, max) ?? measureDom();
      let size = max;
      if (natural > available && natural > 0) {
        size = Math.max(min, Math.floor((max * available) / natural));
      }
      const wrap = overflow === 'wrap' && size === min && (natural * min) / max > available;
      setFit((f) => (f.size === size && f.wrap === wrap ? f : { size, wrap }));
    };

    const hasRO = typeof ResizeObserver !== 'undefined';
    // Largura disponível: guardada (observe) ou medida agora. Ao montar (ex.: popup
    // de ganhador) ela vem do ResizeObserver, entregue depois do layout do quadro —
    // ler clientWidth/getComputedStyle aqui forçava dois layouts no meio da
    // montagem. O texto fica invisível só até essa medida (um quadro).
    const known = observe && widthRef.current >= 0;
    let pendingFirst = false;
    if (known) apply(widthRef.current);
    else if (!hasRO) {
      widthRef.current = box.clientWidth;
      apply(widthRef.current);
    } else {
      pendingFirst = true;
      el.style.visibility = 'hidden';
    }

    // Fonte da web carregou depois: a largura do texto muda.
    let alive = true;
    // Só enquanto ainda carregam: depois disso o `ready` já resolvido rodaria a
    // medida de novo (com getComputedStyle) no meio de cada atualização.
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown>; status?: string } }).fonts;
    if (fonts?.status === 'loading') fonts.ready?.then(() => {
      if (!alive) return;
      fontRef.current = null;
      apply(widthRef.current);
    });

    let ro: ResizeObserver | null = null;
    if (hasRO && (observe || pendingFirst)) {
      // Chamado depois do layout do quadro: ler clientWidth aqui não custa nada.
      ro = new ResizeObserver(() => {
        const w = box.clientWidth;
        if (pendingFirst) {
          pendingFirst = false;
          el.style.visibility = '';
          widthRef.current = w;
          apply(w);
          if (!observe) ro?.disconnect();
          return;
        }
        if (w === widthRef.current) return;
        widthRef.current = w;
        apply(w);
      });
      ro.observe(box);
    }
    return () => {
      alive = false;
      ro?.disconnect();
      if (pendingFirst) el.style.visibility = '';
    };
  }, [text, max, min, overflow, observe]);

  return { ref, ...fit };
}

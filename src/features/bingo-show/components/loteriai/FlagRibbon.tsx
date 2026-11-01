/**
 * FlagRibbon.tsx — faixas da bandeira paraguaia em SVG (tema `loteriai`).
 *
 * Desenhadas no código (sem asset): três listras vermelho/branco/azul que
 * ondulam juntas, com filete de ouro nas bordas e um brilho suave por cima.
 * Sem o brasão oficial — a roseta central é só tricolor com uma estrela.
 */
import React from 'react';

const RED = '#d7192d';
const WHITE = '#ffffff';
const BLUE = '#0648a8';
const GOLD = '#f6c443';

type WaveOpts = {
  /** Largura e altura do viewBox. */
  w: number;
  h: number;
  /** Espessura de cada listra. */
  stripe: number;
  /** Amplitude e número de ondas ao longo da largura. */
  amp: number;
  waves: number;
  phase?: number;
  /** Arco extra (positivo = centro mais alto), para faixas tipo guirlanda. */
  arch?: number;
};

/** Linha do topo da faixa no ponto x (onda + arco). */
function topAt(x: number, o: WaveOpts): number {
  const t = x / o.w;
  const wave = o.amp * Math.sin(2 * Math.PI * o.waves * t + (o.phase ?? 0));
  const arch = (o.arch ?? 0) * (1 - Math.pow(2 * t - 1, 2));
  return (o.h - o.stripe * 3) / 2 + wave - arch;
}

/** Caminho de uma listra (índice 0 = topo). */
function stripePath(i: number, o: WaveOpts): string {
  const steps = 48;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let s = 0; s <= steps; s++) {
    const x = (o.w * s) / steps;
    const y = topAt(x, o) + i * o.stripe;
    top.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    bottom.unshift(`${x.toFixed(1)},${(y + o.stripe).toFixed(1)}`);
  }
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

function edgePath(offset: number, o: WaveOpts): string {
  const steps = 48;
  const pts: string[] = [];
  for (let s = 0; s <= steps; s++) {
    const x = (o.w * s) / steps;
    pts.push(`${x.toFixed(1)},${(topAt(x, o) + offset).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
}

/** Faixa tricolor ondulada. `className` posiciona/dimensiona; o SVG estica. */
export function FlagWave({ className, opts, id }: { className?: string; opts: WaveOpts; id: string }) {
  const shineId = `${id}-shine`;
  return (
    <svg className={className} viewBox={`0 0 ${opts.w} ${opts.h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.1" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <path d={stripePath(0, opts)} fill={RED} />
      <path d={stripePath(1, opts)} fill={WHITE} />
      <path d={stripePath(2, opts)} fill={BLUE} />
      <path d={`${stripePath(0, { ...opts, stripe: opts.stripe * 3 })}`} fill={`url(#${shineId})`} />
      <path d={edgePath(0, opts)} stroke={GOLD} strokeWidth={opts.stripe * 0.18} fill="none" />
      <path d={edgePath(opts.stripe * 3, opts)} stroke={GOLD} strokeWidth={opts.stripe * 0.18} fill="none" />
    </svg>
  );
}

/** Roseta tricolor com estrela dourada (centro da faixa do topo). */
export function FlagRosette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={GOLD} />
      <circle cx="50" cy="50" r="44" fill={RED} />
      <circle cx="50" cy="50" r="35" fill={WHITE} />
      <circle cx="50" cy="50" r="26" fill={BLUE} />
      <circle cx="50" cy="50" r="19" fill={WHITE} />
      <path
        d="M50 35 L54.1 46.2 L66 46.6 L56.6 53.9 L59.9 65.4 L50 58.6 L40.1 65.4 L43.4 53.9 L34 46.6 L45.9 46.2 Z"
        fill={GOLD}
        stroke="#a65c00"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="47" fill="none" stroke="#a65c00" strokeWidth="1.5" />
    </svg>
  );
}

/* Formatos prontos usados no lobby. */
export const TOP_GARLAND: WaveOpts = { w: 1600, h: 60, stripe: 15, amp: 4, waves: 2.5, arch: 6 };
export const BANNER_TAIL: WaveOpts = { w: 200, h: 80, stripe: 17, amp: 7, waves: 1.25 };
export const CORNER_WAVE: WaveOpts = { w: 400, h: 90, stripe: 17, amp: 9, waves: 1.5, phase: 0.6 };

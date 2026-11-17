/**
 * AzulBackground.tsx — fundo do tema `bingo-show-azul` (ver o .module.css).
 * Usado pelo BingoShowAmbientBackground quando o tema ativo é o Azul.
 * Elementos fixos (sem estado, sem animação): nada remonta com o SSE.
 */
'use client';

import React from 'react';
import styles from './AzulBackground.module.css';

// Bolinhas desfocadas: poucas, grandes, longe do centro dos dados.
const BOKEH = [
  { x: '6%', y: '22%', s: 120, o: 0.18 },
  { x: '94%', y: '30%', s: 150, o: 0.16 },
  { x: '30%', y: '8%', s: 70, o: 0.22 },
  { x: '72%', y: '6%', s: 90, o: 0.2 },
  { x: '3%', y: '70%', s: 180, o: 0.1 },
  { x: '97%', y: '78%', s: 160, o: 0.1 },
];

// Brilhos de estrela no topo (faixa do cabeçalho).
const SPARKLES = [
  { x: '24%', y: '5%', s: 26, o: 0.8 },
  { x: '35%', y: '9%', s: 18, o: 0.7 },
  { x: '58%', y: '4%', s: 22, o: 0.75 },
  { x: '68%', y: '10%', s: 16, o: 0.6 },
  { x: '79%', y: '3%', s: 20, o: 0.7 },
];

const AzulBackgroundInner: React.FC = () => (
  <div className={styles.root} aria-hidden="true">
    <span className={styles.rays} />
    <span className={styles.rings} />
    {BOKEH.map((b, i) => (
      <span key={`b${i}`} className={styles.bokeh} style={{ left: b.x, top: b.y, '--s': `${b.s}px`, '--o': b.o } as React.CSSProperties} />
    ))}
    <span className={styles.dots} />
    {SPARKLES.map((s, i) => (
      <span key={`s${i}`} className={styles.sparkle} style={{ left: s.x, top: s.y, '--s': `${s.s}px`, '--o': s.o } as React.CSSProperties} />
    ))}
    <span className={styles.veil} />
  </div>
);

export const AzulBackground = React.memo(AzulBackgroundInner);
export default AzulBackground;

/**
 * GoldBackground.tsx — fundo do tema `tema-ouro` (só CSS, ver GoldBackground.module.css).
 * Usado pelo BingoShowAmbientBackground quando o tema ativo é `tema-ouro`.
 */
'use client';

import React from 'react';
import styles from './GoldBackground.module.css';

// Poucas partículas, só nas faixas laterais (x em %), longe dos textos centrais.
const PARTICLES = [
  { x: 2, s: 5, dur: 19000, delay: 0, dx: 14, o: 0.7 },
  { x: 5.5, s: 3, dur: 24000, delay: 6000, dx: -10, o: 0.55 },
  { x: 9, s: 4, dur: 21000, delay: 12000, dx: 18, o: 0.6 },
  { x: 13, s: 3, dur: 26000, delay: 3000, dx: -8, o: 0.45 },
  { x: 87, s: 4, dur: 22000, delay: 2000, dx: -14, o: 0.6 },
  { x: 91, s: 5, dur: 20000, delay: 9000, dx: 10, o: 0.7 },
  { x: 94.5, s: 3, dur: 25000, delay: 15000, dx: -12, o: 0.5 },
  { x: 98, s: 4, dur: 23000, delay: 5000, dx: 8, o: 0.55 },
];

export const GoldBackground: React.FC = () => (
  <div className={styles.root} aria-hidden="true">
    <div className={styles.base} />
    <div className={styles.halo} />
    <div className={styles.pattern} />
    <div className={styles.sweep} />
    {PARTICLES.map((p, i) => (
      <span
        key={i}
        className={styles.particle}
        style={
          {
            left: `${p.x}%`,
            '--s': `${p.s}px`,
            '--dur': `${p.dur}ms`,
            '--delay': `${p.delay}ms`,
            '--dx': `${p.dx}px`,
            '--o': p.o,
          } as React.CSSProperties
        }
      />
    ))}
    <div className={styles.vignette} />
  </div>
);

export default GoldBackground;

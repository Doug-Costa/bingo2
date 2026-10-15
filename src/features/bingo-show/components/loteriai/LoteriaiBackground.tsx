/**
 * LoteriaiBackground.tsx — fundo do tema `loteriai` (ver o .module.css).
 * Usado pelo BingoShowAmbientBackground quando o tema ativo é a Loteria'i.
 * Elementos fixos (sem estado): nada remonta com atualizações do SSE.
 */
'use client';

import React from 'react';
import styles from './LoteriaiBackground.module.css';

// Ñandutí: textura quase estática, baixíssima opacidade, nos cantos.
const NANDUTI = [
  { x: '4%', y: '10%', s: 460, o: 0.1 },
  { x: '97%', y: '8%', s: 520, o: 0.09 },
  { x: '2%', y: '94%', s: 540, o: 0.1 },
  { x: '96%', y: '92%', s: 480, o: 0.09 },
];

// Partículas douradas: poucas, pequenas, só nas faixas laterais.
const PARTICLES = [
  { x: 2, s: 4, dur: 21000, delay: 0, dx: 12, o: 0.75 },
  { x: 6, s: 3, dur: 25000, delay: 8000, dx: -8, o: 0.6 },
  { x: 11, s: 4, dur: 23000, delay: 14000, dx: 14, o: 0.65 },
  { x: 88, s: 4, dur: 24000, delay: 3000, dx: -12, o: 0.65 },
  { x: 93, s: 3, dur: 22000, delay: 11000, dx: 8, o: 0.6 },
  { x: 97.5, s: 4, dur: 26000, delay: 17000, dx: -6, o: 0.7 },
];

export const LoteriaiBackground: React.FC = () => (
  <div className={styles.root} aria-hidden="true">
    <span className={styles.rays} />
    {NANDUTI.map((n, i) => (
      <span
        key={`n${i}`}
        className={styles.nanduti}
        style={{ left: n.x, top: n.y, '--s': `${n.s}px`, '--o': n.o } as React.CSSProperties}
      />
    ))}
    <span className={styles.sheen} />
    {PARTICLES.map((p, i) => (
      <span
        key={`p${i}`}
        className={styles.particle}
        style={
          {
            left: `${p.x}%`,
            '--ps': `${p.s}px`,
            '--pdur': `${p.dur}ms`,
            '--pdelay': `${p.delay}ms`,
            '--pdx': `${p.dx}px`,
            '--po': p.o,
          } as React.CSSProperties
        }
      />
    ))}
    <span className={styles.vignette} />
  </div>
);

export default LoteriaiBackground;

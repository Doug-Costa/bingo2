/**
 * ParaguayBackground.tsx — fundo do tema `bingo-show-paraguay` (ver o .module.css).
 * Usado pelo BingoShowAmbientBackground quando o tema ativo é o Paraguay.
 * Elementos fixos (sem estado): nada remonta com atualizações do SSE.
 */
'use client';

import React from 'react';
import styles from './ParaguayBackground.module.css';

// Ñandutí: tamanhos variados, alguns cortados nas bordas, sentidos alternados.
const NANDUTI = [
  { x: '6%', y: '14%', s: 420, o: 0.07, dur: 120, dir: 'normal' },
  { x: '96%', y: '10%', s: 520, o: 0.06, dur: 150, dir: 'reverse' },
  { x: '3%', y: '92%', s: 560, o: 0.08, dur: 140, dir: 'reverse' },
  { x: '94%', y: '88%', s: 460, o: 0.07, dur: 110, dir: 'normal' },
  { x: '50%', y: '102%', s: 380, o: 0.045, dur: 160, dir: 'normal' },
  { x: '30%', y: '-4%', s: 300, o: 0.04, dur: 90, dir: 'reverse' },
  { x: '72%', y: '-6%', s: 340, o: 0.04, dur: 100, dir: 'normal' },
];

// Partículas: maioria dourada, algumas brancas, raras vermelha/azul.
const PARTICLES = [
  { x: 2, s: 4, c: '#f3ce63', dur: 20000, delay: 0, dx: 12, o: 0.7 },
  { x: 5, s: 3, c: '#ffffff', dur: 25000, delay: 7000, dx: -8, o: 0.5 },
  { x: 9, s: 4, c: '#f3ce63', dur: 22000, delay: 13000, dx: 16, o: 0.6 },
  { x: 13, s: 3, c: '#d01f2f', dur: 27000, delay: 4000, dx: -10, o: 0.45 },
  { x: 87, s: 4, c: '#f3ce63', dur: 23000, delay: 2000, dx: -12, o: 0.6 },
  { x: 91, s: 3, c: '#ffffff', dur: 21000, delay: 10000, dx: 8, o: 0.5 },
  { x: 94.5, s: 3, c: '#2f6fd6', dur: 26000, delay: 16000, dx: -10, o: 0.5 },
  { x: 98, s: 4, c: '#f3ce63', dur: 24000, delay: 5500, dx: 6, o: 0.6 },
];

export const ParaguayBackground: React.FC = () => (
  <div className={styles.root} aria-hidden="true">
    {NANDUTI.map((n, i) => (
      <span
        key={`n${i}`}
        className={styles.nanduti}
        style={
          {
            left: n.x,
            top: n.y,
            '--s': `${n.s}px`,
            '--o': n.o,
            '--dur': `${n.dur}s`,
            '--dir': n.dir,
          } as React.CSSProperties
        }
      />
    ))}
    <span className={`${styles.halo} ${styles.haloBlue}`} />
    <span className={`${styles.halo} ${styles.haloRed}`} />
    <span className={`${styles.halo} ${styles.haloGold}`} />
    {PARTICLES.map((p, i) => (
      <span
        key={`p${i}`}
        className={styles.particle}
        style={
          {
            left: `${p.x}%`,
            '--ps': `${p.s}px`,
            '--pc': p.c,
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

export default ParaguayBackground;

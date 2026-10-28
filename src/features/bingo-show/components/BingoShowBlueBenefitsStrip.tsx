/**
 * BingoShowBlueBenefitsStrip.tsx — faixa inferior de benefícios do lobby
 * (SOMENTE tema Bingo Show Blue). Puramente visual, sem dados do backend.
 *
 * Cinco itens (ícone em cima, título + subtítulo embaixo), com os textos exatos da
 * arte aprovada. Entrada em sequência e, depois, movimentos discretos e distintos
 * por item (ciclos lentos e defasados). O brilho especular é uma camada recortada
 * pelo próprio PNG (mask-image), então só aparece sobre o objeto.
 *
 * Assets: /themes/bingo-show-blue/footer/*.png (transparência real).
 */
'use client';

import React from 'react';
import Image from 'next/image';
import styles from './BingoShowBlueBenefitsStrip.module.css';
import { useT } from '@/contexts/TvConfigContext';

type Motion = 'tilt' | 'shield' | 'float' | 'sway' | 'trophy';

interface Benefit {
  asset: string;
  key: 'cards' | 'secure' | 'chances' | 'prizes' | 'luck';
  tone: 'gold' | 'cyan';
  motion: Motion;
  alt: string;
  /** Ciclo contínuo e brilho especular (ms) — lentos e defasados entre os itens. */
  idle: { dur: number; delay: number };
  shine: { dur: number; delay: number };
}

// Ordem e textos exatamente como na arte aprovada (Recorte 3).
// Ciclos lentos (3,6–6s) e defasados: nenhum par começa junto.
const BENEFITS: Benefit[] = [
  { asset: 'cartela', key: 'cards', tone: 'gold', motion: 'tilt', alt: 'Cartela', idle: { dur: 4600, delay: 1500 }, shine: { dur: 6000, delay: 3400 } },
  { asset: 'escudo', key: 'secure', tone: 'cyan', motion: 'shield', alt: 'Escudo', idle: { dur: 5200, delay: 2300 }, shine: { dur: 5000, delay: 1700 } },
  { asset: 'trofeu', key: 'chances', tone: 'cyan', motion: 'trophy', alt: 'Troféu', idle: { dur: 3800, delay: 3100 }, shine: { dur: 4400, delay: 2200 } },
  { asset: 'presente', key: 'prizes', tone: 'cyan', motion: 'float', alt: 'Presente', idle: { dur: 4200, delay: 1900 }, shine: { dur: 6000, delay: 4600 } },
  { asset: 'trevo', key: 'luck', tone: 'gold', motion: 'sway', alt: 'Trevo', idle: { dur: 5600, delay: 2700 }, shine: { dur: 6000, delay: 5800 } },
];

const ENTRY_START_MS = 240;
const ENTRY_STEP_MS = 120;

export const BingoShowBlueBenefitsStrip: React.FC = () => {
  const t = useT();
  return (
  <div className={styles.strip} aria-label={t('benefits.aria')}>
    {BENEFITS.map((b, i) => {
      const src = `/themes/bingo-show-blue/footer/${b.asset}.png`;
      return (
        <div
          key={b.asset}
          className={styles.item}
          style={{ '--enter-delay': `${ENTRY_START_MS + i * ENTRY_STEP_MS}ms` } as React.CSSProperties}
        >
          <div
            className={`${styles.icon} ${styles[`motion_${b.motion}`]}`}
            style={
              {
                '--idle-dur': `${b.idle.dur}ms`,
                '--idle-delay': `${b.idle.delay}ms`,
                '--shine-dur': `${b.shine.dur}ms`,
                '--shine-delay': `${b.shine.delay}ms`,
              } as React.CSSProperties
            }
          >
            <Image src={src} alt={b.alt} width={96} height={88} className={styles.iconImg} draggable={false} priority />
            <span
              className={`${styles.shine} ${b.motion === 'trophy' ? styles.shineGold : ''}`}
              style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }}
            />
          </div>
          <span className={`${styles.title} ${b.tone === 'gold' ? styles.titleGold : styles.titleCyan}`}>{t(`benefits.${b.key}.title`)}</span>
          <span className={styles.subtitle}>{t(`benefits.${b.key}.subtitle`)}</span>
        </div>
      );
    })}
  </div>
  );
};

export default BingoShowBlueBenefitsStrip;

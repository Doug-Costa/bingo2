/**
 * FlagArt.tsx — faixas da bandeira paraguaia do tema `loteriai` (arte em PNG).
 *
 * A faixa do topo vem em três peças: as listras da esquerda e da direita
 * esticam na largura disponível e o selo do centro mantém a proporção.
 * As pontas (dos lados das faixas vermelhas) e as asas (cantos do rodapé)
 * são imagens inteiras.
 */
import React from 'react';
import styles from './FlagArt.module.css';

const D = '/themes/loteriai/sm/decorative';

export const FLAG_ART = {
  tailLeft: `${D}/faixa-ponta-esq.png`,
  tailRight: `${D}/faixa-ponta-dir.png`,
  cornerLeft: `${D}/faixa-bandeira-canto-esq.png`,
  cornerRight: `${D}/faixa-bandeira-canto-dir.png`,
};

/** Faixa do topo com o selo no centro. `className`/`style` posicionam e definem a altura. */
export function TopFlagBand({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${styles.band} ${className ?? ''}`} style={style} aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element -- peças estáticas do tema */}
      <img className={styles.stripes} src={`${D}/faixa-topo-esq.png`} alt="" draggable={false} />
      <img className={styles.seal} src={`${D}/faixa-topo-selo.png`} alt="" draggable={false} />
      <img className={styles.stripes} src={`${D}/faixa-topo-dir.png`} alt="" draggable={false} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

/** Só as listras onduladas (sem selo), para faixas de base. */
export function FlagStripes({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${styles.band} ${className ?? ''}`} style={style} aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element -- peças estáticas do tema */}
      <img className={styles.stripes} src={`${D}/faixa-topo-esq.png`} alt="" draggable={false} />
      <img className={styles.stripes} src={`${D}/faixa-topo-dir.png`} alt="" draggable={false} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

/** Imagem decorativa de bandeira (ponta ou asa). */
export function FlagImage({ src, className }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- arte estática do tema
  return <img className={className} src={src} alt="" aria-hidden="true" draggable={false} />;
}

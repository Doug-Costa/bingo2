/**
 * FlagArt.tsx — faixas da bandeira paraguaia do tema `loteriai` (arte em PNG).
 *
 * A faixa do topo (guirlanda com o brasão) vem em três peças: o brasão no
 * centro mantém a proporção e as ondas dos lados esticam até a largura pedida.
 * As pontas (dos lados das faixas vermelhas) e as asas (cantos do rodapé)
 * são imagens inteiras.
 */
import React from 'react';
import styles from './FlagArt.module.css';

const D = '/themes/loteriai/sm/decorative';

export const FLAG_ART = {
  tailLeft: `${D}/faixa-ponta-esq.png`,
  tailRight: `${D}/faixa-ponta-dir.png`,
  cornerLeft: `${D}/asa-esq.png`,
  cornerRight: `${D}/asa-dir.png`,
};

/** Guirlanda do topo com o brasão, centralizada. O brasão mantém a proporção
 * e só as ondas dos lados esticam na horizontal até `width`. */
export function TopFlagBand({ height, width, top = 0, style }: { height: number; width: number; top?: number; style?: React.CSSProperties }) {
  return (
    <div className={`${styles.band} ${styles.garland}`} style={{ top, height, width, ...style }} aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element -- peças estáticas do tema */}
      <img className={styles.stripes} src={`${D}/guirlanda-esq.png`} alt="" draggable={false} />
      <img className={styles.seal} src={`${D}/guirlanda-selo.png`} alt="" draggable={false} />
      <img className={styles.stripes} src={`${D}/guirlanda-dir.png`} alt="" draggable={false} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

/** Faixa ondulada sem selo, para a base de painéis (estica na largura). */
export function FlagStripes({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${styles.band} ${className ?? ''}`} style={style} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- arte estática do tema */}
      <img className={styles.stripes} src={`${D}/faixa-onda.png`} alt="" draggable={false} />
    </div>
  );
}

/** Imagem decorativa de bandeira (ponta ou asa). */
export function FlagImage({ src, className }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- arte estática do tema
  return <img className={className} src={src} alt="" aria-hidden="true" draggable={false} />;
}

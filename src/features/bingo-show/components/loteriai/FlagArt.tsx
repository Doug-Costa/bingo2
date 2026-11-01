/**
 * FlagArt.tsx — faixas da bandeira paraguaia do tema `loteriai` (arte em PNG).
 *
 * A faixa do topo (guirlanda com o brasão) é uma imagem inteira, sempre na
 * proporção original (nunca esticada): a altura define o tamanho e ela fica
 * centralizada.
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

/** Guirlanda do topo com o brasão, centralizada. `height` define o tamanho
 * (largura = altura × 8,92, a proporção do asset). */
export function TopFlagBand({ height, top = 0, style }: { height: number; top?: number; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arte estática do tema
    <img
      className={styles.garland}
      src={`${D}/guirlanda.png`}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ top, height, ...style }}
    />
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

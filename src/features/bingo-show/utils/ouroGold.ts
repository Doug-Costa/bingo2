import type React from 'react';

/**
 * Ouro metálico do tema (mesma receita de goldMetalText.module.css → `.goldValueActive`)
 * como estilo inline, para componentes que só aceitam `style` (ex.: o contador da home).
 * Relevo por drop-shadow (text-shadow pintaria por cima do gradiente recortado).
 */
export const GOLD_METAL_INLINE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(180deg, #6f3e00 0%, #b97808 8%, #fff4b8 18%, #ffd76a 25%, #d9a514 42%, #fff0a0 51%, #b97808 59%, #f5c542 73%, #fff4b8 82%, #a86200 92%, #5c3100 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
  WebkitTextStroke: '1px rgba(100, 47, 0, 0.72)',
  textShadow: 'none',
  filter: 'drop-shadow(0 2px 0 #713600) drop-shadow(0 4px 1px rgba(25, 9, 0, 0.66)) drop-shadow(0 0 4px rgba(255, 199, 34, 0.45))',
};

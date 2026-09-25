/**
 * Faixa de comprimento de um valor monetário JÁ FORMATADO — só para escolher o
 * tamanho visual da fonte (nada de regra financeira). Preparado para moedas com
 * mais algarismos (ex.: "₲ 12.500.000") sem depender do texto atual em reais.
 */
export type MoneyLengthTier = 'normal' | 'long' | 'xlong';

export function moneyLengthTier(formatted: string): MoneyLengthTier {
  const len = formatted.trim().length;
  if (len <= 10) return 'normal';
  if (len <= 14) return 'long';
  return 'xlong';
}

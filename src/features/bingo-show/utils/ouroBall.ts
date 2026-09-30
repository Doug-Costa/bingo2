/**
 * Bola 3D do tema Bingo Show (Ouro & Espaço) pela faixa do número — mesma cor do
 * histórico: 1–18 azul, 19–36 vermelha, 37–54 verde, 55–72 amarela, 73–90 roxa.
 */
export function ouroBallAsset(n: number): string {
  const c = n <= 18 ? 'blue' : n <= 36 ? 'red' : n <= 54 ? 'green' : n <= 72 ? 'yellow' : 'purple';
  return `/bingoshow-v2/balls/4x/ball-${c}-default.png`;
}

/**
 * Contagem regressiva até o próximo sorteio. Até 1h: "MM:SS"; acima disso,
 * "H:MM:SS" (antes uma espera longa — ex.: próximo sorteio só no dia seguinte —
 * aparecia como "1288:03", minutos totais).
 */
export function formatCountdown(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

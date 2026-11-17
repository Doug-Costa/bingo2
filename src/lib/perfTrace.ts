/**
 * perfTrace — mede onde a TV gasta o processador a cada bola (diagnóstico).
 *
 * - `markBall()` no SSE, quando o `new_ball` chega;
 * - `onRenderTrace` nos <Profiler> da tela do sorteio soma o tempo de render de
 *   cada parte (palco, histórico, cupons, ...) desde a última bola;
 * - o PerfMonitor lê `takeTrace()` no fim da janela de cada bola e envia junto.
 *
 * O <Profiler> só mede em produção com `reactProductionProfiling` (next.config.js).
 */
import type { ProfilerOnRenderCallback } from 'react';

let t0 = 0;
let comps: Record<string, number> = {};

export function markBall(): void {
  t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  comps = {};
}

export const onRenderTrace: ProfilerOnRenderCallback = (id, _phase, actualDuration) => {
  if (!t0) return;
  comps[id] = (comps[id] ?? 0) + actualDuration;
};

/** ms desde a chegada da bola (SSE) até agora. */
export function sinceBall(): number {
  return t0 ? Math.round(performance.now() - t0) : -1;
}

export function takeTrace(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of Object.keys(comps)) out[k] = Math.round(comps[k] ?? 0);
  return out;
}

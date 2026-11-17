/**
 * POST /api/perf — medições de desempenho enviadas pela TV (PerfMonitor).
 * Só escreve no log da Vercel (linha começando com [TV-PERF]); nada é guardado.
 * Ler: `vercel logs <deployment>` e procurar [TV-PERF].
 */
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.text()).slice(0, 8000);
    console.warn('[TV-PERF]', body);
  } catch {
    // medição perdida: sem problema
  }
  return new Response(null, { status: 204 });
}

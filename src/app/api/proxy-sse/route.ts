import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Proxy de SSE Server-Side para eliminar erros de CORS e Mixed Content no navegador.
 * O navegador conecta em `/api/proxy-sse?pin=...&roomId=...` (same-origin),
 * e este route handler abre o stream com o backend oficial server-to-server.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin') || '';
  const roomId = searchParams.get('roomId') || '';
  const token = searchParams.get('token') || '';
  const targetBackend = searchParams.get('target') || 'https://backend.bingotiopatinhas.com';

  const queryParams = new URLSearchParams();
  if (pin) queryParams.set('pin', pin);
  if (roomId) queryParams.set('roomId', roomId);
  if (token) queryParams.set('token', token);
  queryParams.set('_t', String(Date.now()));

  const targetUrl = `${targetBackend.replace(/\/$/, '')}/bingo/realtime-sse/stream?${queryParams.toString()}`;

  console.log(`[Proxy-SSE] Conectando ao backend: ${targetUrl}`);

  try {
    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!backendRes.ok || !backendRes.body) {
      console.warn(`[Proxy-SSE] Backend retornou HTTP ${backendRes.status}`);
      return new Response(`event: error\ndata: ${JSON.stringify({ status: backendRes.status, message: 'Backend indisponível' })}\n\n`, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Stream direto do body do backend para o cliente
    return new Response(backendRes.body as any, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    console.error('[Proxy-SSE] Erro ao conectar com backend:', err);
    return new Response(`event: error\ndata: ${JSON.stringify({ error: err instanceof Error ? err.message : 'Erro de conexão' })}\n\n`, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

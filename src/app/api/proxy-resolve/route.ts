import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Proxy Server-Side para resolução de PIN sem bloqueios de CORS do browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin') || '';
  const targetBackend = searchParams.get('target') || 'https://backend.bingotiopatinhas.com';

  const targetUrl = `${targetBackend.replace(/\/$/, '')}/bingo/tvapp/resolve?pin=${encodeURIComponent(pin)}&type=bingo`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: true,
          status: res.status,
          message: body?.message || `Erro no backend (${res.status})`,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: true,
        message: err instanceof Error ? err.message : 'Falha na comunicação com o backend',
      },
      { status: 502 }
    );
  }
}

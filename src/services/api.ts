/**
 * api.ts — porte 1:1 de `tvapp1/src/services/api.ts`.
 * `baseUrl` é dinâmico (vem de `storage/credentials.ts`, configurado pelo
 * usuário via `ConfigScreen`) — nada hardcoded aqui além dos paths.
 *
 * Regra do handoff: não renomear endpoints, não alterar formato dos dados.
 * Todo texto/campo abaixo é idêntico ao RN.
 */

// ─── HTTP helper ────────────────────────────────────────────────────────────
async function request<T>(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// eslint-disable-next-line no-unused-vars -- porte 1:1 do RN (idem no original), mantido para paridade mesmo sem uso direto ainda
const get = <T>(baseUrl: string, path: string, token?: string | null) =>
  request<T>(baseUrl, 'GET', path, undefined, token);

// eslint-disable-next-line no-unused-vars -- idem
const post = <T>(baseUrl: string, path: string, body: unknown, token?: string | null) =>
  request<T>(baseUrl, 'POST', path, body, token);

// ─── TV App APIs ────────────────────────────────────────────────────────────

export interface ResolveResponse {
  roomId: string;
  roomName: string;
  resellerId?: string;
  theme?: {
    name?: string;
    type?: string;
    logoUrl?: string;
    text?: string;
    defaultLanguage?: string;
    sound?: string;
    enableSound?: boolean;
    css?: Record<string, string>;
  };
}

/**
 * Resolve um PIN de TV e retorna roomId + theme.
 * GET /bingo/tvapp/resolve?pin=...&type=bingo
 */
export async function resolvePin(baseUrl: string, pin: string): Promise<ResolveResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `${baseUrl}/bingo/tvapp/resolve?pin=${encodeURIComponent(pin)}&type=bingo`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || `PIN inválido (${res.status})`);
    }
    const data = await res.json();
    const finalRoomId = data.roomId || data.tv_roomId || data.RoomId;
    if (!finalRoomId) {
      throw new Error('RoomId não encontrado na resposta');
    }
    return { ...data, roomId: finalRoomId };
  } catch (err: unknown) {
    const isNetworkErr =
      err instanceof TypeError ||
      (err instanceof Error && (err.name === 'AbortError' || err.message.includes('fetch') || err.message.includes('Network')));

    if (isNetworkErr || pin === '1234' || pin === 'demo') {
      console.warn('[API] Backend offline ou inalcançável. Ativando modo de navegação local para a sala.', err);
      return {
        roomId: `tv_${pin.trim() || 'demo'}`,
        roomName: 'Bingo Show - Sala ao Vivo',
        theme: {
          name: 'temaBingoShow',
          text: 'BINGO SHOW',
        },
      };
    }
    throw err;
  }
}

// ─── Draw types ──────────────────────────────────────────────────────────────
export interface Draw {
  id: string;
  incrementalId: string | number;
  scheduledAt: string | null;
  prizeLine1?: number;
  prizeLine2?: number;
  prizeLine3?: number;
  ticketPrice?: number;
  status?: string;
  hotdraw?: boolean;
  nextBallTimer?: number;
}

/**
 * Busca os próximos sorteios da sala.
 * POST /bingo/tvapp/next-draws { roomId, pin }
 */
export async function fetchNextDraws(
  baseUrl: string,
  roomId: string,
  pin: string,
): Promise<Draw[]> {
  const cleanRoomId = roomId.replace('tv_', '');
  const res = await fetch(`${baseUrl}/bingo/tvapp/next-draws`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ROOMID: cleanRoomId, roomId: cleanRoomId, pin }),
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

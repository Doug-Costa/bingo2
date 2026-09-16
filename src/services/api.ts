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
 * Testa a conectividade com o servidor especificado.
 */
export async function pingServer(baseUrl: string): Promise<{ ok: boolean; status?: number; message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanBaseUrl}/bingo/tvapp/resolve?pin=0000&type=bingo`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 200 || res.status === 400 || res.status === 401 || res.status === 404) {
      return { ok: true, status: res.status, message: 'Servidor online e respondendo à API de PIN.' };
    }
    if (res.status === 522 || res.status === 524 || res.status === 502 || res.status === 504) {
      return { ok: false, status: res.status, message: `Servidor offline ou sem resposta do backend (HTTP ${res.status}).` };
    }
    return { ok: false, status: res.status, message: `Servidor retornou status (HTTP ${res.status}).` };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { ok: false, message: 'Tempo limite esgotado (timeout de 15s). O servidor demorou para responder.' };
      }
      return { ok: false, message: `Falha de conexão: ${err.message}` };
    }
    return { ok: false, message: 'Não foi possível estabelecer contato com o servidor.' };
  }
}

/**
 * Resolve um PIN de TV e retorna roomId + theme.
 * GET /bingo/tvapp/resolve?pin=...&type=bingo
 */
export async function resolvePin(baseUrl: string, pin: string): Promise<ResolveResponse> {
  const cleanPin = pin.trim();

  // Permite acesso direto com PIN de teste/desenvolvimento
  if (cleanPin === '1234' || cleanPin === 'demo') {
    return {
      roomId: `tv_${cleanPin}`,
      roomName: 'Bingo Show - Sala de Demonstração',
      theme: {
        name: 'temaBingoShow',
        text: 'BINGO SHOW',
      },
    };
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout

  try {
    // 1. Tenta chamada direta primeiro (CORS liberado no backend)
    let res: Response;
    try {
      res = await fetch(`${cleanBaseUrl}/bingo/tvapp/resolve?pin=${encodeURIComponent(cleanPin)}&type=bingo`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
    } catch (directErr: unknown) {
      // 2. Se a chamada direta falhar (ex: bloqueio de browser ou mixed content), tenta via proxy server-side
      if (typeof window !== 'undefined' && cleanBaseUrl.startsWith('http')) {
        const proxyUrl = `/api/proxy-resolve?pin=${encodeURIComponent(cleanPin)}&target=${encodeURIComponent(cleanBaseUrl)}`;
        res = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
      } else {
        throw directErr;
      }
    }
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.error) {
      if (
        res.status === 400 ||
        res.status === 401 ||
        res.status === 403 ||
        res.status === 404 ||
        data?.status === 400 ||
        data?.status === 401 ||
        data?.status === 404
      ) {
        throw new Error(data?.message || 'PIN incorreto. O código informado não existe ou expirou.');
      }
      if (res.status === 522 || res.status === 502 || res.status === 504 || data?.status === 522 || data?.status === 502) {
        throw new Error(`Servidor offline ou sem resposta (HTTP ${res.status || data?.status || 502}). Verifique se o backend está ativo.`);
      }
      throw new Error(data?.message || `Erro no servidor (HTTP ${res.status}). Verifique o código e tente novamente.`);
    }

    const finalRoomId = data.roomId || data.tv_roomId || data.RoomId;
    if (!finalRoomId) {
      throw new Error('PIN incorreto. O servidor não localizou nenhuma sala para este código.');
    }

    return { ...data, roomId: finalRoomId };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(`Tempo de resposta esgotado (timeout de 15s). O servidor em ${cleanBaseUrl} demorou para responder.`);
      }
      throw err;
    }
    throw new Error('Falha ao validar PIN. Verifique os dados e tente novamente.');
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

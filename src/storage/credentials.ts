/**
 * credentials.ts — porte de `tvapp1/src/services/storage.ts`
 * (AsyncStorage → localStorage). Mesmas chaves de produção do RN:
 * `tv_ip`, `tv_port`, `tv_pin`, `tv_roomId`, `tv_roomName`, `tv_theme`.
 *
 * API pedida (ver handoff da integração de dados): `getCredentials`,
 * `saveCredentials`, `clearCredentials`, `hasSavedCredentials`,
 * `getRoomId`, `getRoomName`, `getTheme` — mais os helpers de URL/porta
 * padrão que já existiam (`buildBaseUrl`, `getDefaultIp`, `getDefaultPort`)
 * e que `ConfigScreen`/`api.ts` precisam.
 *
 * Regra preservada do RN (`getSavedCredentials` original): só considera
 * "configurado" se houver IP, PIN e roomId — porta cai no fallback padrão,
 * roomName cai em string vazia, theme cai em objeto vazio quando o JSON
 * salvo está ausente ou corrompido (nunca lança, nunca quebra a leitura).
 */

const KEY_IP = 'tv_ip';
const KEY_PORT = 'tv_port';
const KEY_PIN = 'tv_pin';
const KEY_ROOM_ID = 'tv_roomId';
const KEY_ROOM_NAME = 'tv_roomName';
const KEY_THEME = 'tv_theme';

// Fallback do .env/processo — mesmos valores do RN (`storage.ts`).
const DEFAULT_IP = 'https://backend.bingotiopatinhas.com';
const DEFAULT_PORT = '';

export interface ThemeConfig {
  name?: string;
  type?: string;
  logoUrl?: string;
  text?: string;
  defaultLanguage?: string;
  sound?: string;
  enableSound?: boolean;
  css?: Record<string, string>;
}

export interface SavedCredentials {
  ip: string;
  port: string;
  pin: string;
  roomId: string;
  roomName: string;
  theme: ThemeConfig;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`[storage/credentials] getItem("${key}") error:`, error);
    return null;
  }
}

/**
 * getCredentials — lê as credenciais salvas. `null` quando não há
 * configuração válida (mesma regra do RN: exige IP + PIN + roomId).
 * Nunca lança: dados ausentes ou JSON de `theme` inválido/de formato antigo
 * caem em fallback silencioso.
 */
export function getCredentials(): SavedCredentials | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const ip = safeGetItem(KEY_IP);
    const port = safeGetItem(KEY_PORT);
    const pin = safeGetItem(KEY_PIN);
    const roomId = safeGetItem(KEY_ROOM_ID);
    const roomName = safeGetItem(KEY_ROOM_NAME);
    const themeRaw = safeGetItem(KEY_THEME);

    if (!ip || !pin || !roomId) {
      return null;
    }

    let theme: ThemeConfig = {};
    if (themeRaw) {
      try {
        const parsed = JSON.parse(themeRaw);
        // Defesa contra valor antigo/formato inesperado (ex.: string solta
        // salva por uma versão anterior) — só aceita objeto.
        theme = parsed && typeof parsed === 'object' ? (parsed as ThemeConfig) : {};
      } catch {
        theme = {};
      }
    }

    return {
      ip,
      port: port || getDefaultPort(),
      pin,
      roomId,
      roomName: roomName || '',
      theme,
    };
  } catch (error) {
    console.error('[storage/credentials] getCredentials error:', error);
    return null;
  }
}

/** @deprecated use `getCredentials` — mantido só por compatibilidade de nome durante a migração. */
export const getSavedCredentials = getCredentials;

export function hasSavedCredentials(): boolean {
  return getCredentials() !== null;
}

/**
 * saveCredentials — grava/atualiza as credenciais. Aceita chamada parcial
 * repetida (ex.: reconectar com PIN novo mantendo o mesmo IP) — sempre
 * sobrescreve as 6 chaves com o objeto completo passado, igual ao
 * `AsyncStorage.multiSet` do RN.
 */
export function saveCredentials(creds: SavedCredentials): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(KEY_IP, creds.ip);
    window.localStorage.setItem(KEY_PORT, creds.port);
    window.localStorage.setItem(KEY_PIN, creds.pin);
    window.localStorage.setItem(KEY_ROOM_ID, creds.roomId);
    window.localStorage.setItem(KEY_ROOM_NAME, creds.roomName);
    window.localStorage.setItem(KEY_THEME, JSON.stringify(creds.theme ?? {}));
  } catch (error) {
    console.error('[storage/credentials] saveCredentials error:', error);
  }
}

/** clearCredentials — remove as 6 chaves (logout / "limpar configuração"). */
export function clearCredentials(): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(KEY_IP);
    window.localStorage.removeItem(KEY_PORT);
    window.localStorage.removeItem(KEY_PIN);
    window.localStorage.removeItem(KEY_ROOM_ID);
    window.localStorage.removeItem(KEY_ROOM_NAME);
    window.localStorage.removeItem(KEY_THEME);
  } catch (error) {
    console.error('[storage/credentials] clearCredentials error:', error);
  }
}

export function getRoomId(): string | null {
  return safeGetItem(KEY_ROOM_ID);
}

export function getRoomName(): string | null {
  return safeGetItem(KEY_ROOM_NAME);
}

/** getTheme — mesma tolerância a JSON ausente/inválido de `getCredentials`. */
export function getTheme(): ThemeConfig {
  const raw = safeGetItem(KEY_THEME);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ThemeConfig) : {};
  } catch {
    return {};
  }
}

export function getDefaultIp(): string {
  return DEFAULT_IP;
}

export function getDefaultPort(): string {
  return DEFAULT_PORT;
}

export function buildBaseUrl(ip: string, port: string): string {
  const isUrl = ip.startsWith('http://') || ip.startsWith('https://');
  const base = isUrl ? ip : `http://${ip}`;
  return port ? `${base}:${port}` : base;
}

/**
 * saveTestCredentials — só para o placeholder de dev de `/config` (Fase 1).
 * Será removido quando a `ConfigScreen` real substituir o placeholder.
 * Gated por `NODE_ENV !== 'production'` — nunca disponível em build de
 * produção (mesma regra pedida: "mocks só em modo de desenvolvimento").
 */
export function saveTestCredentials(): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  saveCredentials({
    ip: getDefaultIp(),
    port: getDefaultPort(),
    pin: '0000',
    roomId: 'test-room',
    roomName: 'Sala de Teste (dev)',
    theme: {},
  });
}

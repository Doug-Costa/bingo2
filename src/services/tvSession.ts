/**
 * tvSession.ts — aplica o resultado do resolve por PIN (login e restart remoto).
 *
 * Grava credenciais + configuração completa e fixa tema/idioma vindos do
 * backend. Sem tema no payload → tema padrão; sem idioma → padrão do tema.
 * Quem chama recarrega a página logo depois: o boot lê tudo do armazenamento.
 */
import { getThemeKey } from '@/theme/themes';
import { STORAGE_THEME_KEY } from '@/contexts/ThemeContext';
import { storeLanguageOverride } from '@/contexts/TvConfigContext';
import { resolvePin } from '@/services/api';
import { buildBaseUrl, getCredentials, saveCredentials } from '@/storage/credentials';
import { extractTvConfig, saveTvConfig, type TvConfig } from '@/storage/tvConfig';

export const DEFAULT_THEME_ID = 'bingo-show';

export interface SessionTarget {
  ip: string;
  port: string;
  pin: string;
}

/** Salva tudo que veio do resolve e devolve a configuração normalizada. */
export function applyResolvedSession(target: SessionTarget, data: unknown): TvConfig {
  const cfg = extractTvConfig(data);
  const roomId = cfg.roomId ?? (data as { roomId?: string })?.roomId ?? '';
  const themeId = cfg.theme?.name || cfg.theme?.type ? getThemeKey(cfg.theme?.name || cfg.theme?.type) : DEFAULT_THEME_ID;

  saveCredentials({
    ip: target.ip,
    port: target.port,
    pin: target.pin,
    roomId,
    roomName: cfg.roomName ?? '',
    theme: { ...(cfg.theme ?? {}), name: themeId, type: themeId },
  });
  saveTvConfig(cfg);

  try {
    window.localStorage.setItem(STORAGE_THEME_KEY, themeId);
  } catch {
    // ignora
  }
  // O backend decide o idioma de novo: some a escolha manual anterior.
  storeLanguageOverride(null);
  return cfg;
}

/** Recarrega a TV inteira (aplica tema/idioma/moeda do zero). */
export function reloadTv(path = '/tv'): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) window.location.reload();
  else window.location.assign(path);
}

const KEY_LAST_RESTART = 'tv_last_restart_at';
/** Janela mínima entre dois restarts (evita loop se o evento for reenviado). */
const RESTART_GUARD_MS = 20000;

/**
 * Restart remoto (SSE `tv_restart`): busca a configuração atual do PIN salvo,
 * grava e recarrega. Se o backend não responder, recarrega com o que já tinha.
 */
export async function restartTvFromServer(): Promise<void> {
  try {
    const last = Number(window.sessionStorage.getItem(KEY_LAST_RESTART) || 0);
    if (Date.now() - last < RESTART_GUARD_MS) {
      console.log('[tvSession] restart ignorado (acabou de reiniciar)');
      return;
    }
    window.sessionStorage.setItem(KEY_LAST_RESTART, String(Date.now()));
  } catch {
    // sem sessionStorage: segue
  }

  const creds = getCredentials();
  if (creds) {
    try {
      const data = await resolvePin(buildBaseUrl(creds.ip, creds.port), creds.pin);
      applyResolvedSession({ ip: creds.ip, port: creds.port, pin: creds.pin }, data);
    } catch (err) {
      console.warn('[tvSession] resolve falhou no restart; mantendo configuração salva:', err);
    }
  }
  reloadTv(window.location.pathname);
}

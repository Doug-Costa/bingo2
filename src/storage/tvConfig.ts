/**
 * tvConfig.ts — configuração da TV recebida no login por PIN
 * (GET /bingo/tvapp/resolve).
 *
 * O backend resolve tema e promoções em cascata (operador → sala → padrão do
 * reseller/sala) e devolve o resultado em dois endereços: `theme`/`promotes` na
 * raiz (compatibilidade) e `options.config.themetv`/`options.config.promote`
 * (espelho). São o mesmo dado: lemos o espelho e caímos na raiz se faltar.
 *
 * A TV guarda o payload inteiro e só aplica no boot. Login e restart remoto
 * gravam a configuração nova e recarregam a página.
 */
import type { Promotion } from '@/contexts/SSEContext';
import type { VoiceLang } from '@/features/bingo-show/hooks/useBingoAudio';

const KEY_TV_CONFIG = 'tv_config';

export type TvLanguage = 'pt-BR' | 'es';
export const TV_LANGUAGES: TvLanguage[] = ['pt-BR', 'es'];

export interface TvThemeConfig {
  name?: string;
  type?: string;
  enableSound?: boolean;
  enableSoundSelector?: boolean;
  enableLanguageSelector?: boolean;
  enableLogo?: boolean;
  enableText?: boolean;
  enableAvatar?: boolean;
  enableSpritesheet1?: boolean;
  defaultLanguage?: string;
  defaultCoin?: string;
  sound?: string;
  logoUrl?: string;
  text?: string;
  avatarUrl?: string;
  css?: Record<string, string>;
}

export interface TvPlayer {
  id?: string;
  name?: string;
  type?: string;
}

export interface TvConfig {
  roomId?: string;
  roomName?: string;
  resellerId?: string;
  urlsite?: string;
  affiliateId?: string;
  theme: TvThemeConfig | null;
  promotes: Promotion[];
  options: Record<string, unknown> | null;
  player: TvPlayer | null;
  /** Quando foi recebido (ms). */
  receivedAt: number;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Extrai a configuração do payload do resolve (tolera campos ausentes). */
export function extractTvConfig(data: unknown): TvConfig {
  const d = isObject(data) ? data : {};
  const options = isObject(d.options) ? d.options : null;
  const config = options && isObject(options.config) ? options.config : null;

  const mirrorTheme = config && isObject(config.themetv) ? config.themetv : null;
  const rootTheme = isObject(d.theme) ? d.theme : null;
  const theme = (mirrorTheme ?? rootTheme) as TvThemeConfig | null;

  const mirrorPromotes = config && Array.isArray(config.promote) ? config.promote : null;
  const rootPromotes = Array.isArray(d.promotes) ? d.promotes : null;
  const promotes = ((mirrorPromotes && mirrorPromotes.length ? mirrorPromotes : rootPromotes) ?? []) as Promotion[];

  const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

  return {
    roomId: str(d.roomId),
    roomName: str(d.roomName),
    resellerId: str(d.resellerId),
    urlsite: str(d.urlsite),
    affiliateId: str(d.affiliateId),
    theme,
    // Promoções de override (JSON) não têm id; o carrossel exige um.
    promotes: promotes
      .filter(isObject)
      .map((p, i) => ({ ...p, id: String((p as Promotion).id ?? `cfg-${i}`) }) as Promotion),
    options,
    player: isObject(d.player) ? (d.player as TvPlayer) : null,
    receivedAt: Date.now(),
  };
}

export function saveTvConfig(cfg: TvConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY_TV_CONFIG, JSON.stringify(cfg));
  } catch (error) {
    console.error('[storage/tvConfig] save error:', error);
  }
}

export function getTvConfig(): TvConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY_TV_CONFIG);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? (parsed as unknown as TvConfig) : null;
  } catch {
    return null;
  }
}

export function clearTvConfig(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY_TV_CONFIG);
  } catch {
    // ignora
  }
}

/** "pt", "pt-BR", "es-PY"... → idioma suportado; null se vazio/desconhecido. */
export function normalizeLanguage(raw: unknown): TvLanguage | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith('pt')) return 'pt-BR';
  if (v.startsWith('es')) return 'es';
  return null;
}

/** `theme.sound` do PIN ("pt", "pt-br", "es", "es-PY"...) → voz; null se vazio/desconhecido. */
export function normalizeVoice(raw: unknown): VoiceLang | null {
  const lang = normalizeLanguage(raw);
  if (lang === 'es') return 'es';
  if (lang === 'pt-BR') return 'pt';
  return null;
}

/** Moeda padrão de cada idioma (quando o PIN não manda `defaultCoin`). */
export function currencyForLanguage(lang: TvLanguage): 'BRL' | 'PYG' {
  return lang === 'es' ? 'PYG' : 'BRL';
}

/** "brl", "R$", "PYG", "gs"... → código ISO em maiúsculas; null se vazio. */
export function normalizeCurrency(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toUpperCase();
  if (!v) return null;
  if (v === 'R$') return 'BRL';
  if (v === '₲' || v === 'GS' || v === 'GS.') return 'PYG';
  if (v === 'US$' || v === '$') return 'USD';
  return /^[A-Z]{3}$/.test(v) ? v : null;
}

/**
 * themeProfile.ts — idioma, moeda e voz de cada tema, num lugar só.
 *
 * Substitui as comparações soltas `themeId === '...'` para decidir moeda/voz:
 * um tema novo declara o seu perfil aqui e o resto do app só consulta.
 * Temas sem perfil usam o padrão (pt-BR, real, voz pt-br).
 */
import type { VoiceLang } from '@/features/bingo-show/hooks/useBingoAudio';
import type { MoneyCurrency } from '@/features/bingo-show/utils/format';

export interface ThemeAudio {
  /** Locução da bola (camada futura; o player atual usa `voice`). */
  ball: (_n: number) => string;
  /** Vinheta de evento (ex.: 'win_line1', 'win_bingo'). */
  event: (_name: string) => string;
}

export interface ThemeProfile {
  locale: 'pt-BR' | 'es-PY';
  currency: MoneyCurrency;
  /** Voz usada hoje pelo useBingoAudio. */
  voice: VoiceLang;
  audio: ThemeAudio;
}

const folderAudio = (base: string): ThemeAudio => ({
  ball: (n) => `${base}/balls/${n}.mp3`,
  event: (name) => `${base}/events/${name}.mp3`,
});

const PT_BR: ThemeProfile = { locale: 'pt-BR', currency: 'BRL', voice: 'pt', audio: folderAudio('/audio/pt-BR') };
const ES_PY: ThemeProfile = { locale: 'es-PY', currency: 'PYG', voice: 'es', audio: folderAudio('/audio/es-PY') };

const PROFILES: Record<string, ThemeProfile> = {
  'bingo-show-paraguay': ES_PY,
  loteriai: ES_PY,
};

export function getThemeProfile(themeId: string): ThemeProfile {
  return PROFILES[themeId] ?? PT_BR;
}

/** Textos em espanhol (família es-PY). */
export function isSpanishTheme(themeId: string): boolean {
  return getThemeProfile(themeId).locale === 'es-PY';
}

'use client';

/**
 * TvConfigContext — configuração recebida no login por PIN (tema, idioma,
 * moeda, promoções e o resto do payload do resolve), já resolvida contra os
 * padrões do tema ativo.
 *
 * Ordem de decisão (tudo vem do PIN; o padrão do tema só cobre campo ausente):
 *   idioma: seleção manual na TV → theme.defaultLanguage do PIN → padrão do
 *           tema (Paraguay/Loteria'i = espanhol, demais = português)
 *   moeda:  theme.defaultCoin do PIN → idioma do PIN (es = PYG, pt = BRL).
 *           A seleção manual não troca a moeda: o valor não é convertido.
 *   voz:    theme.sound do PIN → idioma ativo (es → /audio/es; pt → /audio/pt-br)
 *
 * Fica DENTRO do ThemeProvider (precisa do themeId para os padrões).
 */
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getThemeProfile } from '@/theme/themeProfile';
import { setMoneyCurrency, type MoneyCurrency } from '@/features/bingo-show/utils/format';
import type { VoiceLang } from '@/features/bingo-show/hooks/useBingoAudio';
import type { Promotion } from '@/contexts/SSEContext';
import type { TFunction } from 'i18next';
import { i18n } from '@/i18n';
import {
  currencyForLanguage,
  getTvConfig,
  normalizeCurrency,
  normalizeLanguage,
  normalizeVoice,
  type TvConfig,
  type TvLanguage,
  type TvThemeConfig,
} from '@/storage/tvConfig';

const KEY_LANGUAGE = 'tv_language';

export interface TvConfigContextValue {
  /** Payload do resolve salvo no login (null antes do 1º login). */
  config: TvConfig | null;
  /** Tema bruto do backend (flags, textos, logo...). */
  remoteTheme: TvThemeConfig | null;
  /** Promoções recebidas no login (fallback do carrossel enquanto o SSE não manda). */
  promotes: Promotion[];
  language: TvLanguage;
  currency: MoneyCurrency;
  voice: VoiceLang;
  /** theme.enableSound do painel (ausente → ligado). false desliga todo o som. */
  soundEnabled: boolean;
  /** Troca manual de idioma (persistida até o próximo login/restart). */
  setLanguage: (_lang: TvLanguage) => void;
}

const TvConfigContext = createContext<TvConfigContextValue>({
  config: null,
  remoteTheme: null,
  promotes: [],
  language: 'pt-BR',
  currency: 'BRL',
  voice: 'pt',
  soundEnabled: true,
  setLanguage: () => {},
});

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function readStoredLanguage(): TvLanguage | null {
  try {
    return normalizeLanguage(window.localStorage.getItem(KEY_LANGUAGE));
  } catch {
    return null;
  }
}

/** Grava (ou limpa, com null) a escolha manual de idioma. */
export function storeLanguageOverride(lang: TvLanguage | null): void {
  try {
    if (lang) window.localStorage.setItem(KEY_LANGUAGE, lang);
    else window.localStorage.removeItem(KEY_LANGUAGE);
  } catch {
    // ignora
  }
}

export function TvConfigProvider({ children }: { children: React.ReactNode }) {
  const { themeId } = useAppTheme();
  // 1º render igual ao servidor (sem localStorage); o salvo entra antes do paint.
  const [config, setConfig] = useState<TvConfig | null>(null);
  const [manualLanguage, setManualLanguage] = useState<TvLanguage | null>(null);

  useIsomorphicLayoutEffect(() => {
    setConfig(getTvConfig());
    setManualLanguage(readStoredLanguage());
  }, []);

  const setLanguage = useCallback((lang: TvLanguage) => {
    storeLanguageOverride(lang);
    setManualLanguage(lang);
  }, []);

  const remoteTheme = config?.theme ?? null;
  const profile = getThemeProfile(themeId);

  const pinLanguage: TvLanguage =
    normalizeLanguage(remoteTheme?.defaultLanguage) ?? normalizeLanguage(profile.locale) ?? 'pt-BR';
  const language: TvLanguage = manualLanguage ?? pinLanguage;
  const currency: MoneyCurrency = normalizeCurrency(remoteTheme?.defaultCoin) ?? currencyForLanguage(pinLanguage);
  const voice: VoiceLang = normalizeVoice(remoteTheme?.sound) ?? (language === 'es' ? 'es' : 'pt');
  const soundEnabled = remoteTheme?.enableSound !== false;

  // Definida no render, antes dos filhos formatarem valores.
  setMoneyCurrency(currency);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const value = useMemo<TvConfigContextValue>(
    () => ({
      config,
      remoteTheme,
      promotes: config?.promotes ?? [],
      language,
      currency,
      voice,
      soundEnabled,
      setLanguage,
    }),
    [config, remoteTheme, language, currency, voice, soundEnabled, setLanguage],
  );

  return <TvConfigContext.Provider value={value}>{children}</TvConfigContext.Provider>;
}

export function useTvConfig() {
  return useContext(TvConfigContext);
}

/** Tradutor no idioma ativo da TV: `const t = useT(); t('lobby.nextDraw')`. */
export function useT(): TFunction {
  const { language } = useContext(TvConfigContext);
  return useMemo(() => i18n.getFixedT(language), [language]);
}

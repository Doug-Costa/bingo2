'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { resolveTheme, getThemeKey, AVAILABLE_THEMES, type ThemeTokens, type ThemeOption } from '@/theme/themes';
import { getTheme, saveCredentials, getCredentials } from '@/storage/credentials';

const STORAGE_THEME_KEY = 'bingo_show_selected_theme';

export interface ThemeContextValue {
  themeId: string;
  theme: ThemeTokens;
  setThemeId: (id: string) => void;
  availableThemes: ThemeOption[];
  isBlue: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'bingo-show',
  theme: resolveTheme('bingo-show'),
  setThemeId: () => {},
  availableThemes: AVAILABLE_THEMES,
  isBlue: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'bingo-show';
    try {
      const stored = localStorage.getItem(STORAGE_THEME_KEY);
      if (stored) return getThemeKey(stored);

      const credTheme = getTheme();
      if (credTheme?.name || credTheme?.type) {
        return getThemeKey(credTheme.name || credTheme.type);
      }
    } catch {
      // fallback
    }
    return 'bingo-show';
  });

  const setThemeId = useCallback((newId: string) => {
    const validKey = getThemeKey(newId);
    setThemeIdState(validKey);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_THEME_KEY, validKey);
        document.documentElement.setAttribute('data-theme', validKey);

        // Atualiza as credenciais salvas com o novo tema
        const currentCreds = getCredentials();
        if (currentCreds) {
          saveCredentials({
            ...currentCreds,
            theme: {
              ...currentCreds.theme,
              name: validKey,
              type: validKey,
            },
          });
        }
      } catch (err) {
        console.warn('[ThemeContext] Falha ao persistir tema:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  }, [themeId]);

  const activeTheme = useMemo(() => resolveTheme(themeId), [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      theme: activeTheme,
      setThemeId,
      availableThemes: AVAILABLE_THEMES,
      isBlue: themeId === 'bingo-show-blue',
    }),
    [themeId, activeTheme, setThemeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;

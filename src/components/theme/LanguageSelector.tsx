'use client';

import React from 'react';
import { useTvConfig } from '@/contexts/TvConfigContext';
import { TV_LANGUAGES, type TvLanguage } from '@/storage/tvConfig';

const LABELS: Record<TvLanguage, string> = { 'pt-BR': 'PT', es: 'ES', en: 'EN' };

/**
 * Troca manual de idioma da TV (PT/ES/EN). Some quando o backend manda
 * `theme.enableLanguageSelector: false`. A escolha vale até o próximo
 * login/restart, que volta ao idioma do backend.
 */
export function LanguageSelector({ style }: { style?: React.CSSProperties }) {
  const { language, setLanguage, remoteTheme } = useTvConfig();
  if (remoteTheme?.enableLanguageSelector === false) return null;

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: 'rgba(3, 10, 30, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        ...style,
      }}
    >
      {TV_LANGUAGES.map((lang) => {
        const active = lang === language;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={active}
            style={{
              minWidth: 36,
              padding: '5px 8px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              color: active ? '#0A1024' : '#FFFFFF',
              background: active ? '#FFD84A' : 'transparent',
            }}
          >
            {LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSelector;

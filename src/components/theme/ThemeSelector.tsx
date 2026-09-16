'use client';

import React from 'react';
import { useAppTheme } from '@/contexts/ThemeContext';
import { type ThemeOption } from '@/theme/themes';

export interface ThemeSelectorProps {
  variant?: 'cards' | 'compact' | 'modal';
  onSelect?: (themeId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeSelector({
  variant = 'cards',
  onSelect,
  style,
}: ThemeSelectorProps) {
  const { themeId, setThemeId, availableThemes } = useAppTheme();

  const handleSelect = (id: string) => {
    setThemeId(id);
    if (onSelect) {
      onSelect(id);
    }
  };

  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'rgba(4, 8, 38, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 999,
          padding: 3,
          gap: 4,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          ...style,
        }}
      >
        {availableThemes.map((t) => {
          const isActive = themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive
                  ? t.id === 'bingo-show-blue'
                    ? '#087FFC'
                    : '#FFDE38'
                  : 'transparent',
                color: isActive
                  ? t.id === 'bingo-show-blue'
                    ? '#FFFFFF'
                    : '#000000'
                  : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 800,
                fontSize: 12,
                transition: 'all 200ms ease',
                boxShadow: isActive
                  ? t.id === 'bingo-show-blue'
                    ? '0 0 14px rgba(8, 127, 252, 0.6)'
                    : '0 0 14px rgba(255, 222, 56, 0.6)'
                  : 'none',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: t.previewColors.primary,
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              />
              {t.displayName.split(' ')[0]} {t.badge && `(${t.badge})`}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        width: '100%',
        ...style,
      }}
    >
      {availableThemes.map((item: ThemeOption) => {
        const isSelected = themeId === item.id;
        const isBlueTheme = item.id === 'bingo-show-blue';
        const accentBorder = isBlueTheme ? '#087FFC' : '#FFDE38';
        const glowColor = isBlueTheme ? 'rgba(8, 127, 252, 0.35)' : 'rgba(255, 222, 56, 0.35)';

        return (
          <div
            key={item.id}
            onClick={() => handleSelect(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(item.id);
              }
            }}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
              borderRadius: 16,
              backgroundColor: isSelected ? 'rgba(8, 18, 54, 0.95)' : 'rgba(4, 8, 38, 0.6)',
              border: `2px solid ${isSelected ? accentBorder : 'rgba(255, 255, 255, 0.12)'}`,
              boxShadow: isSelected ? `0 8px 24px ${glowColor}` : 'none',
              cursor: 'pointer',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              outline: 'none',
              userSelect: 'none',
            }}
          >
            {/* Header do Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: item.previewColors.background,
                    border: `1.5px solid ${accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 10px ${glowColor}`,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: item.previewColors.primary,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                  }}
                >
                  {item.displayName}
                </span>
              </div>

              {/* Badge de status */}
              {isSelected ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: 999,
                    backgroundColor: accentBorder,
                    color: isBlueTheme ? '#FFFFFF' : '#000000',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}
                >
                  ATIVO
                </span>
              ) : item.badge ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </div>

            {/* Descrição */}
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.65)',
                margin: 0,
                marginBottom: 14,
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              {item.description}
            </p>

            {/* Amostra da Paleta de Cores */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>Paleta:</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div
                  title="Fundo"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: item.previewColors.background,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <div
                  title="Primária"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: item.previewColors.primary,
                  }}
                />
                <div
                  title="Secundária"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: item.previewColors.secondary,
                  }}
                />
                <div
                  title="Destaque"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: item.previewColors.accent,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ThemeSelector;

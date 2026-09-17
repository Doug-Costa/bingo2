'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppTheme } from '@/contexts/ThemeContext';
import { type ThemeOption } from '@/theme/themes';

export interface ThemeSelectorProps {
  variant?: 'dropdown' | 'cards' | 'compact' | 'modal';
  onSelect?: (_themeId: string) => void;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'right';
}

/** Ícone de Paleta de Cores em SVG de alta fidelidade */
function PaletteIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <circle cx="13.5" cy="6.5" r="1.5" fill={color} />
      <circle cx="17.5" cy="10.5" r="1.5" fill={color} />
      <circle cx="8.5" cy="7.5" r="1.5" fill={color} />
      <circle cx="6.5" cy="12.5" r="1.5" fill={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.992 6.012 17.465 2 12 2z" />
    </svg>
  );
}

/** Ícone de Chevron para Dropdown */
function ChevronIcon({ isOpen, size = 14, color = 'currentColor' }: { isOpen: boolean; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        transition: 'transform 200ms ease',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ThemeSelector({
  variant = 'dropdown',
  onSelect,
  style,
  align = 'right',
}: ThemeSelectorProps) {
  const { themeId, setThemeId, availableThemes } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTheme = availableThemes.find((t) => t.id === themeId) || availableThemes[0];

  const handleSelect = useCallback(
    (id: string) => {
      setThemeId(id);
      setIsOpen(false);
      if (onSelect) {
        onSelect(id);
      }
    },
    [setThemeId, onSelect]
  );

  // Fechamento automático ao clicar fora ou ao pressionar ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // ─── Variante 1: DROPDOWN (Padrão com Ícone e Menu Flutuante) ───────────────
  if (variant === 'dropdown') {
    const triggerBg = 'rgba(4, 8, 38, 0.82)';
    const primaryAccent = currentTheme?.previewColors.primary || '#FFDE38';

    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          userSelect: 'none',
          ...style,
        }}
      >
        {/* Botão Gatilho do Dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title="Alternar Tema Visual do Telão"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 999,
            backgroundColor: triggerBg,
            border: `1.5px solid ${isOpen ? primaryAccent : 'rgba(255, 255, 255, 0.18)'}`,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isOpen
              ? `0 0 20px ${primaryAccent}55, 0 4px 14px rgba(0, 0, 0, 0.6)`
              : '0 4px 12px rgba(0, 0, 0, 0.35)',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = primaryAccent;
              e.currentTarget.style.boxShadow = `0 0 14px ${primaryAccent}44`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.35)';
            }
          }}
        >
          {/* Ícone de Paleta */}
          <PaletteIcon size={18} color={primaryAccent} />

          {/* Nome do Tema Atual */}
          <span style={{ letterSpacing: 0.3 }}>
            {currentTheme?.displayName.split(' (')[0] || 'Tema'}
          </span>

          {/* Amostra da cor principal */}
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: primaryAccent,
              border: '1.5px solid rgba(255, 255, 255, 0.6)',
              boxShadow: `0 0 8px ${primaryAccent}`,
              display: 'inline-block',
            }}
          />

          {/* Seta Chevron */}
          <ChevronIcon isOpen={isOpen} size={14} color="rgba(255, 255, 255, 0.8)" />
        </button>

        {/* Menu Flutuante Dropdown */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: align === 'right' ? 0 : 'auto',
              left: align === 'left' ? 0 : 'auto',
              width: 320,
              maxHeight: 420,
              overflowY: 'auto',
              backgroundColor: 'rgba(3, 10, 32, 0.95)',
              border: '1.5px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 18,
              padding: 10,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(8, 127, 252, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              animation: 'bs-dropdown-fade 180ms ease-out',
            }}
          >
            {/* Header do Menu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px 8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PaletteIcon size={14} color="#00E5FF" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: 'rgba(255, 255, 255, 0.8)',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  TEMAS DISPONÍVEIS ({availableThemes.length})
                </span>
              </div>
              <span style={{ fontSize: 10, color: '#00E5FF', fontWeight: 700 }}>
                Ao Vivo
              </span>
            </div>

            {/* Lista de Opções de Temas */}
            {availableThemes.map((item: ThemeOption) => {
              const isSelected = themeId === item.id;
              const accentColor = item.previewColors.primary;

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
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px 12px',
                    borderRadius: 12,
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${isSelected ? accentColor : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    boxShadow: isSelected ? `0 0 16px ${accentColor}44` : 'none',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {/* Linha Superior: Nome + Badge + Checkmark */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                        }}
                      >
                        {item.displayName}
                      </span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: 4,
                            backgroundColor: isSelected ? accentColor : 'rgba(255, 255, 255, 0.12)',
                            color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Descrição Curta */}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.55)',
                      lineHeight: 1.3,
                      marginBottom: 8,
                    }}
                  >
                    {item.description}
                  </div>

                  {/* Prévia das 4 Cores da Paleta */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 8px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, marginRight: 2 }}>
                      CORES:
                    </span>
                    <div
                      title="Fundo"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.previewColors.background,
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    />
                    <div
                      title="Primária"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.previewColors.primary,
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    />
                    <div
                      title="Secundária"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.previewColors.secondary,
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    />
                    <div
                      title="Destaque"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: item.previewColors.accent,
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Variante 2: COMPACT (Pílulas Horizontais) ─────────────────────────────
  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'rgba(4, 8, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: 999,
          padding: 3,
          gap: 4,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          ...style,
        }}
      >
        {availableThemes.map((t) => {
          const isActive = themeId === t.id;
          const accent = t.previewColors.primary;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? accent : 'transparent',
                color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.75)',
                fontWeight: 800,
                fontSize: 12,
                transition: 'all 200ms ease',
                boxShadow: isActive ? `0 0 14px ${accent}88` : 'none',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#000000' : accent,
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

  // ─── Variante 3: CARDS (Grade de Cards Grandes para Configuração) ────────────
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        width: '100%',
        ...style,
      }}
    >
      {availableThemes.map((item: ThemeOption) => {
        const isSelected = themeId === item.id;
        const accentBorder = item.previewColors.primary;
        const glowColor = `${accentBorder}44`;

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
              padding: 14,
              borderRadius: 14,
              backgroundColor: isSelected ? 'rgba(8, 18, 54, 0.95)' : 'rgba(4, 8, 38, 0.65)',
              border: `2px solid ${isSelected ? accentBorder : 'rgba(255, 255, 255, 0.12)'}`,
              boxShadow: isSelected ? `0 8px 24px ${glowColor}` : 'none',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              outline: 'none',
              userSelect: 'none',
            }}
          >
            {/* Header do Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: item.previewColors.background,
                    border: `1.5px solid ${accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 8px ${glowColor}`,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.previewColors.primary,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: 0.3,
                  }}
                >
                  {item.displayName}
                </span>
              </div>

              {isSelected ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: 999,
                    backgroundColor: accentBorder,
                    color: '#000000',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  ATIVO
                </span>
              ) : item.badge ? (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 4,
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
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                marginBottom: 10,
                lineHeight: 1.35,
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
                padding: '6px 10px',
                borderRadius: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>Paleta:</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <div
                  title="Fundo"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: item.previewColors.background,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <div
                  title="Primária"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: item.previewColors.primary,
                  }}
                />
                <div
                  title="Secundária"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: item.previewColors.secondary,
                  }}
                />
                <div
                  title="Destaque"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
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

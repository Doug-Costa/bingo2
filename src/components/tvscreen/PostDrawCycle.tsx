/**
 * PostDrawCycle.tsx — porte de `tvapp1/src/components/PostDrawCycle.tsx`,
 * simplificado a pedido do usuário: ao final do sorteio, mostra só o card
 * dos 3 ganhadores (1ª linha/2ª linha/bingo) por 20s, com o visual neon do
 * tema Bingo Show (glow por tipo de prêmio, cartela com números pintados,
 * caixa de prêmio dourada), e volta direto ao lobby — sem o ciclo de slides
 * de próximos sorteios/jackpot/promoções que existia antes.
 */
'use client';

import { useEffect } from 'react';
import type { WinnerEvent } from '@/contexts/SSEContext';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import { ThemeBorder, ThemeCard } from '../theme';
import { DecoStarGoldSm } from '../theme/svg/DecoStarGoldSm';

const WINNERS_DURATION_MS = 20_000;

export interface PostDrawCycleProps {
  theme: ThemeTokens;
  winners: WinnerEvent[];
  drawnNumbers: number[];
  onDone: () => void;
}

const WINNER_TYPES = ['line1', 'line2', 'bingo'] as const;

function winnerTypeLabel(t: string) {
  return t === 'line1' ? '1ª LINHA' : t === 'line2' ? '2ª LINHA' : 'BINGO TOTAL';
}

function winnerTypeAccent(t: string, theme: ThemeTokens) {
  return t === 'line1' ? theme.primary : t === 'line2' ? theme.secondary : theme.success;
}

// Mesmo agrupamento de cor do `winnerTypeAccent` acima, mas apontando pros
// assets reais do tema (`border-neon-gold/blue.png`, `border-winner.png`) —
// os mesmos já usados no `WinnerModal` e em `AnimatedActiveBall`/`ThemePanel`.
function winnerTypeThemeVariant(t: string): 'gold' | 'blue' | 'winner' {
  return t === 'line1' ? 'gold' : t === 'line2' ? 'blue' : 'winner';
}

// ─── Slide: Vencedores ────────────────────────────────────────────────────────
function WinnersSlide({ winners, drawnNumbers, theme }: { winners: WinnerEvent[]; drawnNumbers: number[]; theme: ThemeTokens }) {
  return (
    <div style={{ ...slideContentStyle, overflowY: 'auto' }}>
      <span style={{ fontSize: 72, textAlign: 'center', display: 'inline-block', animation: 'bs-postdraw-trophy 1400ms ease-in-out infinite' }}>🏆</span>
      <span style={{ ...slideTitleStyle, color: theme.primary, textShadow: `0 0 18px ${alphaColor(theme.primary, 'aa')}` }}>PREMIAÇÃO FINAL</span>
      <span style={{ ...slideSubtitleStyle, color: theme.textMuted }}>A SORTE SORRIU PARA ELES!</span>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', width: '100%' }}>
        {WINNER_TYPES.map((type) => {
          const win = winners.find((w) => w.type === type);
          const accent = winnerTypeAccent(type, theme);
          const isBingoShow = theme.meta?.id === 'theme-bingo-show';
          const useAsset = isBingoShow && !!win;

          return (
            <ThemeBorder
              key={type}
              theme={theme}
              variant={winnerTypeThemeVariant(type)}
              useImageBorder={useAsset}
              borderRadius={28}
              borderWidth={2.5}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 200,
                maxWidth: 300,
                borderColor: win ? accent : theme.borderMuted,
                backgroundColor: useAsset ? undefined : win ? alphaColor(accent, '14') : theme.glassBg,
                opacity: win ? 1 : 0.3,
                boxShadow: win ? `0px 0px 24px ${alphaColor(accent, '55')}` : undefined,
              }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: useAsset ? 14 : 18 }}>
                {win && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundImage: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />}
                {win && (
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <DecoStarGoldSm size={18} />
                  </div>
                )}

                <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 5, paddingBottom: 5, borderRadius: 20, border: `1px solid ${alphaColor(accent, '88')}`, backgroundColor: alphaColor(accent, '22') }}>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: accent }}>{winnerTypeLabel(type)}</span>
                </div>
                <span
                  style={{
                    fontSize: 19,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    color: theme.textPrimary,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {win?.playerName ?? '---'}
                </span>
                {win?.affiliateName ? (
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, color: theme.textMuted }}>
                    LOJA: {win.affiliateName}
                  </span>
                ) : null}

                {/* Mini cartela */}
                {win?.numbers && (
                  <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center', maxWidth: 220 }}>
                    {win.numbers.flat().map((n, i) => {
                      const isHit = drawnNumbers.includes(n);
                      return (
                        <div
                          key={i}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 5,
                            border: `1px solid ${isHit ? theme.success : theme.borderMuted}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isHit ? alphaColor(theme.success, '33') : theme.gridEmpty,
                          }}
                        >
                          <span style={{ fontSize: 9, fontWeight: 900, color: isHit ? '#fff' : 'rgba(255,255,255,0.2)' }}>{n}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Wrapper com a largura real — o `ThemeCard` tem um wrapper interno
                    de `transform` que não herda largura via `style` sozinho. */}
                <div style={{ width: '100%' }}>
                <ThemeCard
                  theme={theme}
                  variant="promo"
                  useImageBg={useAsset}
                  borderRadius={16}
                  padding={12}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    borderColor: accent,
                    borderWidth: 1.5,
                    backgroundColor: useAsset ? undefined : alphaColor(accent, '1f'),
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 900, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 }}>PRÊMIO PAGO</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: accent }}>
                    R$ {win?.prizeAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}
                  </span>
                </ThemeCard>
                </div>
              </div>
            </ThemeBorder>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function CountdownBar({ duration, theme }: { duration: number; theme: ThemeTokens }) {
  return (
    <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 12 }}>
      <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: theme.borderMuted }}>
        <div
          style={{
            height: '100%',
            borderRadius: 2,
            backgroundColor: theme.primary,
            width: 0,
            animation: `bs-postdraw-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

const slideContentStyle = { flexGrow: 1, padding: 16, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 };
const slideTitleStyle = { fontSize: 28, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: 2, textAlign: 'center' as const };
const slideSubtitleStyle = { fontSize: 12, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: 3, textAlign: 'center' as const };

// ─── Main component ───────────────────────────────────────────────────────────
export function PostDrawCycle({ theme, winners, drawnNumbers, onDone }: PostDrawCycleProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, WINNERS_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', backgroundColor: theme.bgColor, alignItems: 'center', justifyContent: 'center' }}>
      {/* Área dos ganhadores ocupa 90% do palco, centralizada. */}
      <div style={{ width: '90%', height: '90%', display: 'flex', flexDirection: 'column', animation: 'bs-winner-overlay-in 300ms ease both' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <WinnersSlide winners={winners} drawnNumbers={drawnNumbers} theme={theme} />
        </div>
        <CountdownBar duration={WINNERS_DURATION_MS} theme={theme} />
      </div>
    </div>
  );
}

export default PostDrawCycle;

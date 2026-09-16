/**
 * WinnerModal.tsx — porte de `tvapp1/src/components/WinnerModal.tsx`.
 *
 * `Modal transparent` (RN) → `div` `position: fixed` full-screen (overlay),
 * montado/desmontado exatamente como o RN (`if (!winner) return null`) —
 * o mesmo ciclo de mount/unmount já dispara as animações de entrada via
 * CSS `animation` (sem precisar de truque de remount/`key`).
 * `LinearGradient` → CSS `linear-gradient(to right, transparent, accent,
 * transparent)`. `Animated.loop` (trophy bounce, glow pulse) → keyframes
 * CSS infinitas (`bs-trophy-bounce`, `bs-glow-pulse`, ver `globals.css`).
 * `useWindowDimensions().width` → `TV_STAGE_WIDTH` (sempre 1920, então
 * `isMobile` é sempre `false` neste escopo — mesma decisão de
 * `AnimatedActiveBall.tsx`/`NumberGrid.tsx`).
 * Duração de exibição (8s) continua controlada externamente por quem
 * passa/limpa a prop `winner` — não alterado.
 */
import { TV_STAGE_WIDTH } from '@/components/tv/TvStageContext';
import type { WinnerEvent } from '@/contexts/SSEContext';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import { ThemeBorder, ThemeCard, ThemeGlow } from '../theme';
import Ball from './Ball';
import WinnerTicketCard from './WinnerTicketCard';

export interface WinnerModalProps {
  winner: WinnerEvent | null;
  drawnNumbers: number[];
  theme: ThemeTokens;
}

function getWinnerDisplayName(w: WinnerEvent): string {
  return w.playerName || 'GANHADOR';
}

function getWinnerTicketLabel(w: WinnerEvent): string {
  if (!w.ticketId) return '';
  return `CARTELA #${w.ticketId.substring(0, 8).toUpperCase()}`;
}

function getWinnerAmount(w: WinnerEvent): string | null {
  const val = w.prizeAmount ?? w.prize ?? w.share;
  if (val === undefined || val === null) return null;
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

type WinnerVisualType = 'line1' | 'line2' | 'bingo' | 'jackpot' | 'generic';

function normalizeWinnerVisualType(type: string): WinnerVisualType {
  switch (type) {
    case 'line1':
      return 'line1';
    case 'line2':
      return 'line2';
    case 'line3':
    case 'bingo':
      return 'bingo';
    case 'jackpot':
      return 'jackpot';
    default:
      return 'generic';
  }
}

interface WinnerVisualConfig {
  label: string;
  emoji: string;
  headline: string;
  accentColor: (_theme: ThemeTokens) => string;
}

const WINNER_VISUAL: Record<WinnerVisualType, WinnerVisualConfig> = {
  line1: { label: '1ª LINHA BATIDA!', emoji: '🎯', headline: 'TEMOS GANHADOR', accentColor: (t) => t.primary },
  line2: { label: '2ª LINHA BATIDA!', emoji: '🎯', headline: 'TEMOS GANHADOR', accentColor: (t) => t.secondary },
  bingo: { label: 'BINGO!', emoji: '🏆', headline: 'BINGO COMPLETO', accentColor: (t) => t.success },
  jackpot: { label: 'JACKPOT!', emoji: '💰', headline: 'JACKPOT PREMIADO', accentColor: (t) => t.primary },
  generic: { label: 'VENCEDOR!', emoji: '🏆', headline: 'TEMOS GANHADOR', accentColor: (t) => t.primary },
};

// Mesmo agrupamento de cor da `WINNER_VISUAL.accentColor` acima, mas apontando
// pros assets reais do tema (`border-neon-gold/blue.png`, `border-winner.png`)
// em vez de cor CSS pura — os mesmos assets já usados em `AnimatedActiveBall`/`ThemePanel`.
function themeAssetVariant(type: WinnerVisualType): 'gold' | 'blue' | 'winner' {
  if (type === 'line2') return 'blue';
  if (type === 'bingo') return 'winner';
  return 'gold'; // line1, jackpot, generic
}

export function WinnerModal({ winner, drawnNumbers, theme }: WinnerModalProps) {
  if (!winner) return null;

  const width = TV_STAGE_WIDTH;
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';
  const visualType = normalizeWinnerVisualType(winner.type);
  const config = WINNER_VISUAL[visualType];
  const accent = config.accentColor(theme);
  const displayName = getWinnerDisplayName(winner);
  const ticketLabel = getWinnerTicketLabel(winner);
  const amount = getWinnerAmount(winner);

  const topLineGradient = `linear-gradient(to right, transparent, ${isBingoShow ? accent : theme.primary}, transparent)`;
  const bottomLineGradient = `linear-gradient(to right, transparent, ${alphaColor(accent, '66')}, transparent)`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: isBingoShow ? 'rgba(4,8,38,0.95)' : 'rgba(0,0,0,0.92)',
        animation: 'bs-winner-overlay-in 300ms ease both',
        zIndex: 100,
      }}
    >
      <ThemeGlow
        theme={theme}
        variant={themeAssetVariant(visualType)}
        useImageEffect={isBingoShow}
        borderRadius={48}
        style={{ width: '100%', maxWidth: Math.round(width * 0.9) }}
      >
      <ThemeBorder
        theme={theme}
        variant={themeAssetVariant(visualType)}
        useImageBorder={isBingoShow}
        borderRadius={48}
        borderWidth={8}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '90%',
          backgroundColor: isBingoShow ? undefined : '#0b1575',
          boxShadow: isBingoShow ? `0px 0px 30px color-mix(in srgb, ${accent} 80%, transparent)` : undefined,
          animation: 'bs-winner-card-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Linha de acento superior */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundImage: topLineGradient }} />

        {/* Glow animado (Bingo Show only) */}
        {isBingoShow && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 40,
              backgroundColor: alphaColor(accent, '08'),
              animation: 'bs-glow-pulse 2000ms ease-in-out infinite',
            }}
          />
        )}

        {/* Tipo do prêmio */}
        <div
          style={{
            paddingLeft: 30,
            paddingRight: 30,
            paddingTop: 11,
            paddingBottom: 11,
            borderRadius: 18,
            border: `1.5px solid ${alphaColor(accent, '88')}`,
            marginBottom: 22,
            backgroundColor: alphaColor(accent, '22'),
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, color: accent }}>{config.label}</span>
        </div>

        {/* Trophy animado */}
        <span style={{ fontSize: 110, marginBottom: 20, display: 'inline-block', animation: 'bs-trophy-bounce 1200ms ease-in-out infinite' }}>
          {config.emoji}
        </span>

        {/* Headline */}
        <span
          style={{
            fontSize: 62,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: -1,
            marginBottom: 14,
            textAlign: 'center',
            color: isBingoShow ? '#ffffff' : theme.textPrimary,
          }}
        >
          {config.headline}
        </span>

        {/* Nome do jogador */}
        <span style={{ fontSize: 48, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10, color: accent }}>
          {displayName}
        </span>

        {/* Affiliate / Ticket */}
        {winner.affiliateName ? (
          <span style={{ fontSize: 21, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 7, color: isBingoShow ? theme.textSecondary : theme.textMuted }}>
            LOJA: {winner.affiliateName}
          </span>
        ) : null}
        {ticketLabel ? (
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1, opacity: 0.6, marginBottom: 20, color: isBingoShow ? theme.textMuted : theme.textSecondary }}>
            {ticketLabel}
          </span>
        ) : null}

        {/* Bola vencedora (visual ball) — mostrar apenas se Bingo Show */}
        {isBingoShow && visualType === 'jackpot' && (
          <div style={{ marginTop: 20, marginBottom: 20, display: 'flex', alignItems: 'center' }}>
            <Ball number={42} size={100} state="winner" theme={theme} animate={false} />
          </div>
        )}

        {/* Cartela de Vencedor 3x5 com Pedra da Vitória */}
        <WinnerTicketCard
          ticketId={winner.ticketId}
          numbers={winner.numbers}
          drawnNumbers={drawnNumbers}
          lastWinningBall={drawnNumbers[drawnNumbers.length - 1] ?? null}
          theme={theme}
          isMobile={width < 768}
          scale={1.7}
        />

        {/* Valor do prêmio */}
        {amount !== null && (
          // Wrapper com a largura real: o `ThemeCard` tem um wrapper interno de
          // `transform` que não herda largura via `style` — sem essa div externa,
          // ele encolhe pro tamanho do texto dentro do flex column centralizado.
          <div style={{ width: '80%' }}>
          <ThemeCard
            theme={theme}
            variant="promo"
            useImageBg={isBingoShow}
            borderRadius={36}
            padding={26}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: isBingoShow ? undefined : theme.success,
              borderColor: isBingoShow ? accent : undefined,
              borderWidth: isBingoShow ? 2 : undefined,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.7, marginBottom: 7, color: isBingoShow ? theme.textSecondary : '#000000' }}>
              PRÊMIO TOTAL RECEBIDO
            </span>
            <span style={{ fontSize: 82, fontWeight: 900, fontFamily: 'serif', color: isBingoShow ? accent : '#000000' }}>{amount}</span>
          </ThemeCard>
          </div>
        )}

        {/* Linha inferior */}
        {isBingoShow && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundImage: bottomLineGradient }} />}
      </div>
      </ThemeBorder>
      </ThemeGlow>
    </div>
  );
}

export default WinnerModal;

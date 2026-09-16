/**
 * MyTicketsPanel.tsx — porte de `tvapp1/src/components/MyTicketsPanel.tsx`.
 *
 * `ScrollView horizontal={layout === 'horizontal'}` → `div` com
 * `overflowX`/`overflowY: auto` conforme `layout`. `Animated.loop` do shake
 * (sequência de `translateX` + `delay(1800)`) → keyframe CSS
 * `bs-ticket-shake` de 2100ms (5×60ms de movimento + 1800ms de pausa),
 * aplicado só quando `isClosest` é `true` (mesma condição do RN).
 * Nenhuma regra de normalização de `ticket.numbers` (1D/2D/string JSON) ou
 * cálculo de `missingCounts`/`bestMissing`/`closestTicketId` alterada.
 */
import { useMemo, type CSSProperties } from 'react';
import type { MyTicket, TopWinnerRealtime } from '@/contexts/SSEContext';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import Icon from '../Icon';

export interface MyTicketsPanelProps {
  tickets: MyTicket[];
  drawnNumbers: number[];
  currentBall: number | null;
  topPlayers: TopWinnerRealtime[];
  theme: ThemeTokens;
  layout?: 'vertical' | 'horizontal';
}

function TicketCard({
  ticket,
  drawnNumbers,
  currentBall,
  isClosest,
  theme,
}: {
  ticket: MyTicket;
  drawnNumbers: number[];
  currentBall: number | null;
  isClosest: boolean;
  theme: ThemeTokens;
}) {
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  // Normalização ultra-segura de ticket.numbers (trata 1D array, 2D array, strings)
  const formattedLines = useMemo<number[][]>(() => {
    if (!ticket || !ticket.numbers) {
      return [];
    }
    let raw: unknown = ticket.numbers;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(raw) || raw.length === 0) {
      return [];
    }

    if (typeof raw[0] === 'number') {
      const nums = raw as number[];
      const lines: number[][] = [];
      const chunkSize = Math.ceil(nums.length / 3) || 5;
      for (let i = 0; i < nums.length; i += chunkSize) {
        lines.push(nums.slice(i, i + chunkSize));
      }
      return lines;
    }

    return (raw as unknown[])
      .map((line) => {
        if (Array.isArray(line)) {
          return line.map((n) => Number(n)).filter((n) => !isNaN(n));
        }
        if (typeof line === 'number') {
          return [line];
        }
        return [];
      })
      .filter((line: number[]) => line.length > 0);
  }, [ticket]);

  const missingCounts = useMemo(() => {
    if (formattedLines.length === 0) {
      return [15];
    }
    return formattedLines.map((line) => line.filter((n) => !drawnNumbers.includes(n)).length);
  }, [formattedLines, drawnNumbers]);

  const bestMissing = missingCounts.length > 0 ? Math.min(...missingCounts) : 15;

  const borderColor = isClosest
    ? theme.success
    : bestMissing <= 2
    ? alphaColor(theme.primary, 'aa')
    : isBingoShow
    ? alphaColor(theme.borderSecondary, '55')
    : theme.borderMuted;

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1.5px solid ${borderColor}`,
        padding: 6,
        position: 'relative',
        backgroundColor: isClosest ? alphaColor(theme.success, '15') : isBingoShow ? 'rgba(11,21,117,0.4)' : 'rgba(0,0,0,0.35)',
        boxShadow: isBingoShow && isClosest ? `0px 0px 8px color-mix(in srgb, ${theme.success} 40%, transparent)` : undefined,
        animation: isClosest ? 'bs-ticket-shake 2100ms ease-in-out infinite' : undefined,
      }}
    >
      {/* Badge "QUASE!" */}
      {isClosest && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: 8,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            paddingLeft: 7,
            paddingRight: 7,
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 8,
            zIndex: 10,
            backgroundColor: isBingoShow ? theme.primary : theme.success,
          }}
        >
          <Icon name="fire" size={10} color="#000" />
          <span style={{ fontSize: 8, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>QUASE!</span>
        </div>
      )}

      {/* Identificador da cartela */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
        <span style={{ fontSize: 8, fontWeight: 900, fontFamily: 'monospace', color: isBingoShow ? theme.textSecondary : theme.textMuted }}>
          #{(ticket.id || '').substring(0, 6)}
        </span>
      </div>

      {/* Grade de números da cartela */}
      {formattedLines.map((line, lineIdx) => (
        <div key={lineIdx} style={{ display: 'flex', flexDirection: 'row', gap: 3, marginBottom: 3 }}>
          {line.map((num, numIdx) => {
            const isDrawn = drawnNumbers.includes(num);
            const isCurrent = num === currentBall;

            const cellBg = isCurrent
              ? theme.primary
              : isDrawn
              ? isBingoShow
                ? alphaColor(theme.success, '33')
                : theme.gridDrawn
              : isBingoShow
              ? 'rgba(4,8,38,0.6)'
              : theme.gridEmpty;

            const cellBorder = isCurrent
              ? isBingoShow
                ? '#ffffff'
                : theme.primary
              : isDrawn
              ? isBingoShow
                ? theme.success
                : alphaColor(theme.success, '99')
              : isBingoShow
              ? alphaColor(theme.borderSecondary, '33')
              : 'rgba(255,255,255,0.06)';

            const textColor = isCurrent ? '#000000' : isDrawn ? '#ffffff' : isBingoShow ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.25)';

            return (
              <div
                key={numIdx}
                style={{
                  flex: 1,
                  height: 22,
                  borderRadius: 4,
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: cellBg,
                  borderColor: cellBorder,
                }}
              >
                <span style={{ fontSize: 9, color: textColor, fontWeight: isCurrent || isDrawn ? 900 : 700 }}>{num}</span>
              </div>
            );
          })}
        </div>
      ))}

      {/* Faltam X pedras */}
      <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: isBingoShow ? theme.textSecondary : theme.textMuted }}>
          Faltam:{' '}
          <span style={{ color: bestMissing <= 2 ? theme.success : theme.primary, fontWeight: 900 }}>{bestMissing} pedras</span>
        </span>
      </div>
    </div>
  );
}

export function MyTicketsPanel({ tickets, drawnNumbers, currentBall, topPlayers, theme, layout = 'vertical' }: MyTicketsPanelProps) {
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  const displayTickets = useMemo(() => {
    if (!Array.isArray(tickets)) {
      return [];
    }
    return tickets.slice(0, 3);
  }, [tickets]);

  const closestTicketId = useMemo(() => {
    if (displayTickets.length === 0 || !Array.isArray(topPlayers)) {
      return null;
    }
    const myIds = new Set(displayTickets.map((t) => t.id));
    const found = topPlayers.find((p) => p && p.ticketId && myIds.has(p.ticketId));
    return found?.ticketId ?? null;
  }, [topPlayers, displayTickets]);

  if (displayTickets.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: `1px dashed ${isBingoShow ? alphaColor(theme.borderSecondary, '44') : theme.borderMuted}`,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          opacity: 0.5,
        }}
      >
        <Icon name="cards" size={18} color={theme.textMuted} />
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: isBingoShow ? theme.textSecondary : theme.textMuted }}>TOP MY CARD</span>
        <span style={{ fontSize: 9, color: theme.textMuted }}>Sem cartelas nesta rodada</span>
      </div>
    );
  }

  const scrollStyle: CSSProperties =
    layout === 'horizontal'
      ? { display: 'flex', flexDirection: 'row', gap: 8, overflowX: 'auto', overflowY: 'hidden' }
      : { display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', overflowX: 'hidden' };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${isBingoShow ? alphaColor(theme.borderSecondary, '55') : theme.borderSecondary}`,
        padding: 10,
        maxHeight: 260,
        backgroundColor: isBingoShow ? 'rgba(11,21,117,0.3)' : theme.glassBg,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
        <Icon name="cards" size={14} color={theme.primary} />
        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: theme.primary }}>TOP MY CARD</span>
      </div>

      <div style={scrollStyle}>
        {displayTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            drawnNumbers={drawnNumbers}
            currentBall={currentBall}
            isClosest={ticket.id === closestTicketId}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

export default MyTicketsPanel;

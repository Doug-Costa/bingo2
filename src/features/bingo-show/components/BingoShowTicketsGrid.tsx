import React, { useMemo } from 'react';
import { TicketCardItem } from '../mocks/drawMock';
import { BingoShowIcon } from './BingoShowIcon';
import { BingoShowAssets } from '../assets';
import { BingoShowColors } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';

export interface BingoShowTicketsGridProps {
  tickets: TicketCardItem[];
  drawnBalls?: number[];
  style?: React.CSSProperties;
}

// Rótulos de posição — ranqueados por proximidade do bingo
const RANK_LABELS = ['PRIMEIRO LUGAR', 'SEGUNDO LUGAR', 'TERCEIRO LUGAR', 'QUARTO LUGAR'];

/** Quantos números da cartela (excluindo a estrela central, `0`) ainda NÃO saíram —
 * quanto menor, mais perto de bater o bingo. */
function countMissing(ticket: TicketCardItem, drawnSet: Set<number>): number {
  let missing = 0;
  for (const row of ticket.numbers) {
    for (const num of row) {
      if (num !== 0 && !drawnSet.has(num)) {
        missing += 1;
      }
    }
  }
  return missing;
}

export const BingoShowTicketsGrid: React.FC<BingoShowTicketsGridProps> = ({
  tickets,
  drawnBalls = [],
  style,
}) => {
  const { themeId, theme } = useAppTheme();
  const drawnSet = useMemo(() => new Set(drawnBalls), [drawnBalls]);

  // As 4 cartelas mais PRÓXIMAS de bater o bingo com o resultado sendo sorteado agora
  const rankedTickets = useMemo(() => {
    return [...tickets]
      .map((ticket) => ({ ticket, missing: countMissing(ticket, drawnSet) }))
      .sort((a, b) => a.missing - b.missing)
      .slice(0, 4)
      .map((entry) => entry.ticket);
  }, [tickets, drawnSet]);

  if (!tickets || tickets.length === 0) {
    return null;
  }

  const isBlueTheme = themeId === 'bingo-show-blue';

  const containerBg = isBlueTheme
    ? `url(/themes/bingo-show-blue/cards/card-ranking.png), ${theme.panelBg}`
    : themeId === 'bingo-show'
    ? `url(${BingoShowAssets.cards.topWinners})`
    : theme.panelBg;

  const ticketCardBg = isBlueTheme
    ? `url(/themes/bingo-show-blue/cards/card-ticket.png)`
    : themeId === 'bingo-show'
    ? `url(${BingoShowAssets.cards.ticket})`
    : 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: containerBg,
        backgroundSize: '100% 100%',
        backgroundColor: theme.panelBg,
        border: !isBlueTheme && themeId !== 'bingo-show' ? `2px solid ${theme.borderPrimary}` : undefined,
        borderRadius: 24,
        padding: 16,
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        ...style,
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
        {isBlueTheme ? (
          <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        ) : (
          <BingoShowIcon name="star" size={24} color={theme.primary || '#FFDE38'} transparentBg />
        )}
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: theme.primary || '#FFDE38',
            textShadow: `0 0 12px ${theme.primaryGlow || 'rgba(255,222,56,0.6)'}`,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          MINHAS CARTELAS
        </span>
        {isBlueTheme ? (
          <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        ) : (
          <BingoShowIcon name="star" size={24} color={theme.primary || '#FFDE38'} transparentBg />
        )}
      </div>

      {/* 2X2 GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12 }}>
        {rankedTickets.map((ticket, idx) => (
          <div
            key={ticket.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundImage: ticketCardBg,
              backgroundSize: '100% 100%',
              backgroundColor: isBlueTheme ? '#D9EDF8' : 'rgba(10, 25, 60, 0.7)',
              border: isBlueTheme ? '2px solid #57C3FF' : `1.5px solid ${theme.borderSecondary || 'rgba(255,255,255,0.15)'}`,
              borderRadius: 16,
              padding: '6px 8px 8px 8px',
              boxSizing: 'border-box',
              boxShadow: isBlueTheme ? '0 4px 14px rgba(0, 50, 120, 0.3)' : undefined,
            }}
          >
            {/* TICKET HEADER */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  backgroundColor: isBlueTheme ? '#FFCF12' : 'transparent',
                  color: isBlueTheme ? '#1A1100' : (theme.primary || BingoShowColors.primary),
                  padding: isBlueTheme ? '2px 14px' : undefined,
                  borderRadius: isBlueTheme ? 10 : undefined,
                  letterSpacing: 1,
                  boxShadow: isBlueTheme ? '0 2px 6px rgba(0,0,0,0.2)' : undefined,
                }}
              >
                {RANK_LABELS[idx] ?? `${idx + 1}º LUGAR`}
              </span>
            </div>

            {/* TICKET NUMBERS (3x5 GRID) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: 4 }}>
              {(ticket.numbers || []).flatMap((row, rIdx) =>
                (row || []).map((num, cIdx) => {
                  const isHit = drawnSet.has(num);
                  const isStar = rIdx === 1 && cIdx === 2;

                  let cellBg = 'rgba(255,255,255,0.06)';
                  let cellColor = '#FFFFFF';
                  let cellBorder = '1px solid rgba(255,255,255,0.1)';

                  if (isBlueTheme) {
                    if (isHit) {
                      cellBg = '#10B981';
                      cellColor = '#FFFFFF';
                      cellBorder = '1.5px solid #059669';
                    } else {
                      cellBg = '#E6F3FB';
                      cellColor = '#0F172A';
                      cellBorder = '1px solid #BCE0F5';
                    }
                  } else {
                    if (isHit) {
                      cellBg = theme.primary || BingoShowColors.primary;
                      cellColor = '#000000';
                      cellBorder = `1.5px solid ${theme.primary}`;
                    } else {
                      cellBg = 'rgba(255,255,255,0.06)';
                      cellColor = '#FFFFFF';
                      cellBorder = '1px solid rgba(255,255,255,0.1)';
                    }
                  }

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        borderRadius: 6,
                        backgroundColor: cellBg,
                        color: cellColor,
                        border: cellBorder,
                        fontSize: 16,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isHit ? `0 0 8px ${isBlueTheme ? 'rgba(16,185,129,0.5)' : (theme.primaryGlow || 'rgba(255,222,56,0.6)')}` : undefined,
                      }}
                    >
                      {isStar ? '★' : num}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BingoShowTicketsGrid;

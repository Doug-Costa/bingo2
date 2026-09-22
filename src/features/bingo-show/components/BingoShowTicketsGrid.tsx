import React, { useMemo } from 'react';
import { TicketCardItem } from '../mocks/drawMock';
import { useAppTheme } from '@/contexts/ThemeContext';

export interface BingoShowTicketsGridProps {
  tickets: TicketCardItem[];
  drawnBalls?: number[];
  style?: React.CSSProperties;
}

// Rótulos de cartela idênticos à imagem de referência
const TICKET_LABELS = ['CARTELA 01', 'CARTELA 02', 'CARTELA 03', 'CARTELA 04'];

/** Quantos números da cartela ainda NÃO saíram */
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
  const { theme, isBlue } = useAppTheme();
  const drawnSet = useMemo(() => new Set(drawnBalls), [drawnBalls]);

  // As 4 primeiras cartelas (ou ranqueadas por proximidade)
  const displayTickets = useMemo(() => {
    return [...tickets]
      .map((ticket) => ({ ticket, missing: countMissing(ticket, drawnSet) }))
      .sort((a, b) => a.missing - b.missing)
      .slice(0, 4)
      .map((entry) => entry.ticket);
  }, [tickets, drawnSet]);

  if (!tickets || tickets.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isBlue ? 'rgba(3, 17, 48, 0.95)' : theme.panelBg,
        border: `2px solid ${isBlue ? '#087FFC' : theme.borderPrimary}`,
        borderRadius: 24,
        padding: '10px 14px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: `0 0 24px rgba(8, 127, 252, 0.35)`,
        position: 'relative',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {/* HEADER: 🍀 MINHAS CARTELAS 🍀 */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
        <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          MINHAS CARTELAS
        </span>
        <img src="/themes/bingo-show-blue/trevo.png" alt="trevo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
      </div>

      {/* 2X2 GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, minHeight: 0 }}>
        {displayTickets.map((ticket, idx) => (
          <div
            key={ticket.id || idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #57C3FF',
              borderRadius: 14,
              padding: '4px 6px 6px 6px',
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(0, 50, 120, 0.25)',
              justifyContent: 'space-between',
            }}
          >
            {/* TICKET HEADER */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  backgroundColor: '#FFCF12',
                  color: '#1A1100',
                  padding: '1px 12px',
                  borderRadius: 10,
                  letterSpacing: 1,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  textTransform: 'uppercase',
                }}
              >
                {TICKET_LABELS[idx] ?? `CARTELA ${String(idx + 1).padStart(2, '0')}`}
              </span>
            </div>

            {/* TICKET NUMBERS (3x5 GRID) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: 3, alignItems: 'center', justifyItems: 'center' }}>
              {(ticket.numbers || []).flatMap((row, rIdx) =>
                (row || []).map((num, cIdx) => {
                  const isHit = drawnSet.has(num);
                  const isStar = rIdx === 1 && cIdx === 2;

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: isHit ? '#10B981' : isStar ? 'rgba(255, 207, 18, 0.15)' : 'transparent',
                        color: isHit ? '#FFFFFF' : isStar ? '#FFCF12' : '#0F172A',
                        border: isHit ? '1px solid #059669' : '1px solid rgba(188, 224, 245, 0.6)',
                        fontSize: 14,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isHit ? '0 0 6px rgba(16, 185, 129, 0.6)' : undefined,
                        lineHeight: 1,
                      }}
                    >
                      {isStar ? '⭐' : String(num).padStart(2, '0')}
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

import React, { useMemo } from 'react';
import { TicketCardItem } from '../mocks/drawMock';
import { BingoShowIcon } from './BingoShowIcon';
import { BingoShowAssets } from '../assets';
import { BingoShowColors } from '../design-system';

export interface BingoShowTicketsGridProps {
  tickets: TicketCardItem[];
  drawnBalls?: number[];
  style?: React.CSSProperties;
}

// Rótulos de posição — substituem "CARTELA 01/02/03/04" e o UUID cru do ticket (pedido
// explícito do usuário: sem UUID na tela, e ranqueado por proximidade do bingo).
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
  const drawnSet = useMemo(() => new Set(drawnBalls), [drawnBalls]);

  // As 4 cartelas mais PRÓXIMAS de bater o bingo com o resultado sendo sorteado agora
  // (pedido explícito do usuário) — ranqueadas por menor quantidade de números faltando,
  // não mais pela ordem bruta em que vieram do SSE.
  const rankedTickets = useMemo(() => {
    return [...tickets]
      .map((ticket) => ({ ticket, missing: countMissing(ticket, drawnSet) }))
      .sort((a, b) => a.missing - b.missing)
      .slice(0, 4)
      .map((entry) => entry.ticket);
  }, [tickets, drawnSet]);

  // Se não há tickets, não renderiza nada — o pai controla o layout
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
        backgroundImage: `url(${BingoShowAssets.cards.topWinners})`,
        backgroundSize: '100% 100%',
        borderRadius: 24,
        padding: 16,
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
        <BingoShowIcon name="star" size={24} color="#FFDE38" transparentBg />
        <span style={{ fontSize: 22, fontWeight: 900, color: '#FFDE38', letterSpacing: 3, textTransform: 'uppercase' }}>
          MINHAS CARTELAS
        </span>
        <BingoShowIcon name="star" size={24} color="#FFDE38" transparentBg />
      </div>

      {/* 2X2 GRID — as 4 cartelas mais perto de bater o bingo agora, sem UUID, com rótulo
          de posição ("PRIMEIRO LUGAR"..."QUARTO LUGAR") em vez do nome/ID cru do ticket. */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12 }}>
        {rankedTickets.map((ticket, idx) => (
          <div
            key={ticket.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundImage: `url(${BingoShowAssets.cards.ticket})`,
              backgroundSize: '100% 100%',
              borderRadius: 16,
              padding: 8,
              boxSizing: 'border-box',
            }}
          >
            {/* TICKET HEADER */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: BingoShowColors.primary, letterSpacing: 1 }}>
                {RANK_LABELS[idx] ?? `${idx + 1}º LUGAR`}
              </span>
            </div>

            {/* TICKET NUMBERS (3x5 GRID) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: 4 }}>
              {(ticket.numbers || []).flatMap((row, rIdx) =>
                (row || []).map((num, cIdx) => {
                  const isHit = drawnSet.has(num);
                  const isStar = rIdx === 1 && cIdx === 2;
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        borderRadius: 6,
                        backgroundColor: isHit ? BingoShowColors.primary : 'rgba(255,255,255,0.06)',
                        color: isHit ? '#000000' : '#FFFFFF',
                        fontSize: 16,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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

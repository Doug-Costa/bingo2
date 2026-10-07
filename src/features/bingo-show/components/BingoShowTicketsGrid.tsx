import React, { useMemo } from 'react';
import { TicketCardItem } from '../mocks/drawMock';
import { BingoShowIcon } from './BingoShowIcon';
import { BingoShowAssets } from '../assets';
import { BingoShowColors } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';
import goldTheme from './gold/GoldTheme.module.css';

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
  const { themeId, theme, isBlue } = useAppTheme();
  // tema-ouro ("Fortuna"): cartelas preto-quente com filete de ouro, acertos em ouro.
  const isGold = themeId === 'tema-ouro';
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

  // Fonte das células/rótulo pelo tamanho da cartela na grade.
  const sizes =
    displayTickets.length === 1 ? { cell: 30, label: 16 } : displayTickets.length === 2 ? { cell: 20, label: 14 } : { cell: 14, label: 12 };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isBlue ? 'rgba(3, 17, 48, 0.95)' : isGold ? '#0a0a10' : theme.panelBg,
        border: `2px solid ${isBlue ? '#087FFC' : isGold ? '#E9A91A' : theme.borderPrimary}`,
        borderRadius: 24,
        padding: '10px 14px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: isGold ? '0 10px 30px rgba(0, 0, 0, 0.55), 0 0 14px rgba(233, 169, 26, 0.2)' : `0 0 24px rgba(8, 127, 252, 0.35)`,
        position: 'relative',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {/* HEADER: 🍀 MINHAS CARTELAS 🍀 */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
        <img src={isGold ? '/themes/tema-ouro/icons/pata.png' : '/themes/bingo-show-blue/trevo.png'} alt="" style={{ width: isGold ? 24 : 20, height: 20, objectFit: 'contain' }} />
        <span
          className={isGold ? goldTheme.goldText : undefined}
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
        <img src={isGold ? '/themes/tema-ouro/icons/pata.png' : '/themes/bingo-show-blue/trevo.png'} alt="" style={{ width: isGold ? 24 : 20, height: 20, objectFit: 'contain' }} />
      </div>

      {/* GRADE pela quantidade (grade de 4 colunas, cada cartela ocupa 2 quando há
          2 por linha): 1 → quadro inteiro; 2 → lado a lado; 3 → 2 em cima e 1
          centralizada embaixo; 4 → 2×2. Menos cartelas = números maiores. */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: displayTickets.length <= 2 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          minHeight: 0,
        }}
      >
        {displayTickets.map((ticket, idx) => (
          <div
            key={ticket.id || idx}
            style={{
              gridColumn:
                displayTickets.length === 1 ? '1 / -1' : displayTickets.length === 3 && idx === 2 ? '2 / span 2' : 'span 2',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isGold ? '#151008' : '#FFFFFF',
              border: isGold ? '1.5px solid rgba(233, 169, 26, 0.7)' : '1.5px solid #57C3FF',
              borderRadius: 14,
              padding: '4px 6px 6px 6px',
              boxSizing: 'border-box',
              boxShadow: isGold ? '0 4px 10px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 50, 120, 0.25)',
              justifyContent: 'space-between',
            }}
          >
            {/* TICKET HEADER */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
              <span
                style={{
                  fontSize: sizes.label,
                  fontWeight: 900,
                  background: isGold ? 'linear-gradient(180deg, #e0353a 0%, #a3161c 60%, #620b12 100%)' : '#FFCF12',
                  color: isGold ? '#FFF3CF' : '#1A1100',
                  border: isGold ? '1px solid #E9A91A' : undefined,
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

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 4,
                        background: isGold
                          ? isHit
                            ? 'linear-gradient(180deg, #fff1a0 0%, #ffd43f 22%, #f0a315 60%, #b36304 100%)'
                            : 'rgba(255, 243, 207, 0.04)'
                          : isHit
                          ? '#10B981'
                          : 'transparent',
                        color: isGold ? (isHit ? '#2A1600' : '#FFF3CF') : isHit ? '#FFFFFF' : '#0F172A',
                        border: isGold
                          ? isHit
                            ? '1px solid #FFF2A0'
                            : '1px solid rgba(233, 169, 26, 0.25)'
                          : isHit
                          ? '1px solid #059669'
                          : '1px solid rgba(188, 224, 245, 0.6)',
                        fontSize: sizes.cell,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isHit ? (isGold ? '0 0 6px rgba(255, 179, 0, 0.55)' : '0 0 6px rgba(16, 185, 129, 0.6)') : undefined,
                        lineHeight: 1,
                      }}
                    >
                      {String(num).padStart(2, '0')}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* BANNER AQUI É SORTE! TODO DIA! */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
        <img
          src="/themes/bingo-show-blue/banner-luck.png"
          alt="Aqui é Sorte! Todo dia!"
          style={{
            maxHeight: 48,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(255, 207, 18, 0.5))',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default BingoShowTicketsGrid;

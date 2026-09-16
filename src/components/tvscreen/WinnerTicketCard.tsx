/**
 * WinnerTicketCard.tsx — porte de `tvapp1/src/components/WinnerTicketCard.tsx`.
 * Grade de Cartela Vencedora 3×5 (15 números). Nenhuma regra de
 * normalização (1D/2D, dados parciais) alterada — "Dados parciais da
 * cartela" continua exibido sem inventar números ausentes.
 *
 * Escopo (só tema04): `isBingoShow` sempre `true`, ramos condicionais
 * `isBingoShow ? X : Y` mantidos só onde o RN original também os tinha
 * (aqui viravam sempre o ramo `true` — mantido por fidelidade de leitura).
 */
import { useMemo } from 'react';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import { DecoStarGoldSm } from '../theme/svg/DecoStarGoldSm';

export interface WinnerTicketCardProps {
  ticketId?: string;
  numbers?: number[][] | number[];
  drawnNumbers: number[];
  lastWinningBall?: number | null;
  theme: ThemeTokens;
  isMobile?: boolean;
  /** Fator de escala do cartão (1 = tamanho original). Usado pelo `WinnerModal` ampliado. */
  scale?: number;
}

export function WinnerTicketCard({
  ticketId,
  numbers,
  drawnNumbers,
  lastWinningBall,
  theme,
  isMobile = false,
  scale = 1,
}: WinnerTicketCardProps) {
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  const { lines, isPartial } = useMemo(() => {
    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return { lines: [] as number[][], isPartial: true };
    }

    if (typeof numbers[0] === 'number') {
      const flat = numbers as number[];
      if (flat.length === 15) {
        return {
          lines: [flat.slice(0, 5), flat.slice(5, 10), flat.slice(10, 15)],
          isPartial: false,
        };
      }
      return { lines: [flat.slice(0, 5)], isPartial: flat.length < 15 };
    }

    const validLines = (numbers as number[][]).map((l) => (Array.isArray(l) ? l.filter((n) => typeof n === 'number') : []));
    const isPart = validLines.length < 3 || validLines.some((l) => l.length < 5);

    return { lines: validLines, isPartial: isPart };
  }, [numbers]);

  const cellWidth = (isMobile ? 44 : 56) * scale;
  const cellHeight = (isMobile ? 38 : 48) * scale;
  const fontSize = (isMobile ? 12 : 15) * scale;

  return (
    <div
      style={{
        borderRadius: 16 * scale,
        border: `2px solid ${isBingoShow ? alphaColor(theme.primary, '88') : theme.borderSecondary}`,
        padding: 12 * scale,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: isBingoShow ? 'rgba(4,8,38,0.85)' : 'rgba(0,0,0,0.6)',
      }}
    >
      {/* Rótulo superior / Alerta de dados parciais */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 * scale, paddingLeft: 4, paddingRight: 4 }}>
        <span style={{ fontSize: 10 * scale, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 1, color: isBingoShow ? theme.primary : theme.textSecondary }}>
          {ticketId ? `CARTELA #${ticketId.substring(0, 8).toUpperCase()}` : 'CARTELA VENCEDORA'}
        </span>
        {isPartial && (
          <div style={{ backgroundColor: 'rgba(255, 136, 0, 0.2)', border: '1px solid #ff8800', paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 6 }}>
            <span style={{ color: '#ff8800', fontSize: 8 * scale, fontWeight: 900, textTransform: 'uppercase' }}>Dados parciais da cartela</span>
          </div>
        )}
      </div>

      {/* Grade 3x5 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * scale }}>
        {lines.length > 0 ? (
          lines.map((line, lineIdx) => (
            <div key={lineIdx} style={{ display: 'flex', flexDirection: 'row', gap: 6 * scale }}>
              {line.map((num, numIdx) => {
                const isDrawn = drawnNumbers.includes(num);
                const isWinningBall = lastWinningBall !== undefined && lastWinningBall !== null && num === lastWinningBall;

                return (
                  <div
                    key={numIdx}
                    style={{
                      borderRadius: 8 * scale,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      width: cellWidth,
                      height: cellHeight,
                      backgroundColor: isWinningBall ? theme.primary : isDrawn ? alphaColor(theme.success, '33') : 'rgba(255,255,255,0.04)',
                      border: `${isWinningBall ? 2 : 1}px solid ${isWinningBall ? '#ffffff' : isDrawn ? theme.success : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: isWinningBall ? `0px 0px 10px color-mix(in srgb, ${theme.primary} 90%, transparent)` : undefined,
                    }}
                  >
                    {/* Estrela sobreposta na Pedra da Vitória */}
                    {isWinningBall && (
                      <div style={{ position: 'absolute', top: -4, right: -4, zIndex: 10 }}>
                        <DecoStarGoldSm size={(isMobile ? 14 : 18) * scale} />
                      </div>
                    )}

                    <span
                      style={{
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: isWinningBall ? fontSize + 2 : fontSize,
                        color: isWinningBall ? '#000000' : isDrawn ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        fontWeight: isWinningBall || isDrawn ? 900 : 600,
                      }}
                    >
                      {num}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted }}>Números não disponíveis</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default WinnerTicketCard;

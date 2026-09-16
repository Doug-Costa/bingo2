/**
 * TopPlayers.tsx — porte de `tvapp1/src/components/TopPlayers.tsx`.
 * `ScrollView` → `div` com `overflowY: auto`. Nenhuma regra de
 * ordenação/cor/label alterada (a ordenação em si já chega pronta de quem
 * chama, igual ao RN).
 */
import type { TopWinnerRealtime } from '@/contexts/SSEContext';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import Icon, { type IconName } from '../Icon';

export interface TopPlayersProps {
  players: TopWinnerRealtime[];
  theme: ThemeTokens;
}

const PRIZE_LABELS: Record<TopWinnerRealtime['targetPrize'], string> = {
  line1: '🎯 LINHA 1',
  line2: '🎯 LINHA 2',
  line3: '🎯 LINHA 3',
  bingo: '🎯 BINGO',
};

function getPrizeColor(targetPrize: TopWinnerRealtime['targetPrize'], theme: ThemeTokens): string {
  switch (targetPrize) {
    case 'line1':
      return theme.primary;
    case 'line2':
      return theme.secondary;
    case 'line3':
      return theme.accent;
    case 'bingo':
      return theme.success;
    default:
      return theme.textMuted;
  }
}

const RANK_ICONS: IconName[] = ['crown', 'star', 'sparkle'];

function RankBadge({ index, theme, isBingoShow }: { index: number; theme: ThemeTokens; isBingoShow: boolean }) {
  const isTop3 = index < 3;
  const rankColor =
    index === 0 ? theme.primary : index === 1 ? theme.textSecondary : index === 2 ? theme.accent : theme.textMuted;

  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1.5px solid ${alphaColor(rankColor, isBingoShow ? '90' : '70')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: alphaColor(rankColor, '18'),
        boxShadow: isBingoShow && index === 0 ? `0px 0px 8px color-mix(in srgb, ${theme.primary} 60%, transparent)` : undefined,
      }}
    >
      {isTop3 ? (
        <Icon name={RANK_ICONS[index] ?? 'star'} size={12} color={rankColor} />
      ) : (
        <span style={{ fontSize: 11, fontWeight: 900, color: rankColor }}>{index + 1}</span>
      )}
    </div>
  );
}

export function TopPlayers({ players, theme }: TopPlayersProps) {
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  if (players.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5,
          gap: 10,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <Icon name="trophy" size={28} color={theme.textMuted} />
        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: theme.textMuted }}>
          AGUARDANDO SORTEIO...
        </span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 4 }}>
      {players.map((p, i) => {
        const isCritical = p.minNumbersLeft <= 1;
        const isAlmostThere = p.minNumbersLeft <= 3;
        const isTop = i === 0;
        const prizeColor = getPrizeColor(p.targetPrize, theme);
        const rankColor = i === 0 ? theme.primary : i === 1 ? theme.textSecondary : i === 2 ? theme.accent : theme.textMuted;

        const missingLabel =
          p.missingNumbers.length === 1 ? `FALTA ${p.missingNumbers.length} NÚMERO` : `FALTAM ${p.missingNumbers.length} NÚMEROS`;

        const stableKey = p.ticketId || `${p.playerId}-${p.targetPrize}`;

        return (
          <div
            key={stableKey}
            style={{
              borderRadius: 10,
              border: `1px solid ${
                isCritical
                  ? alphaColor(prizeColor, 'aa')
                  : isAlmostThere
                  ? alphaColor(prizeColor, '55')
                  : isBingoShow
                  ? alphaColor(theme.borderSecondary, '44')
                  : alphaColor(rankColor, '30')
              }`,
              borderLeftWidth: isTop ? 3 : 1.5,
              borderLeftColor: alphaColor(rankColor, isBingoShow ? 'cc' : '90'),
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 9,
              paddingBottom: 9,
              marginBottom: 5,
              backgroundColor: isBingoShow
                ? isTop
                  ? alphaColor(theme.primary, '12')
                  : 'rgba(11,21,117,0.4)'
                : isTop
                ? alphaColor(theme.primary, '10')
                : alphaColor(theme.secondary, '08'),
              boxShadow: isBingoShow && isTop ? `0px 0px 10px color-mix(in srgb, ${theme.primary} 30%, transparent)` : undefined,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RankBadge index={i} theme={theme} isBingoShow={isBingoShow} />

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    color: isBingoShow && isTop ? theme.primary : theme.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.playerName || 'COMPRADOR'}
                </span>

                {isBingoShow ? (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 2,
                      paddingBottom: 2,
                      borderRadius: 6,
                      border: `1px solid ${alphaColor(prizeColor, '66')}`,
                      backgroundColor: alphaColor(prizeColor, '18'),
                    }}
                  >
                    <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8, color: prizeColor }}>
                      {PRIZE_LABELS[p.targetPrize] ?? `🎯 ${p.targetPrize.toUpperCase()}`}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.9, color: prizeColor }}>
                    {PRIZE_LABELS[p.targetPrize] ?? `🎯 ${p.targetPrize.toUpperCase()}`}
                  </span>
                )}
              </div>

              {isAlmostThere && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    paddingLeft: 7,
                    paddingRight: 7,
                    paddingTop: 3,
                    paddingBottom: 3,
                    borderRadius: 8,
                    border: `1px solid ${alphaColor(prizeColor, '80')}`,
                    backgroundColor: alphaColor(prizeColor, '20'),
                    flexShrink: 0,
                  }}
                >
                  <Icon name="fire" size={9} color={prizeColor} />
                  <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3, color: prizeColor }}>
                    {isCritical ? '1 FALTA!' : `${p.minNumbersLeft} FALTAM`}
                  </span>
                </div>
              )}
            </div>

            {p.missingNumbers && p.missingNumbers.length > 0 ? (
              <div
                style={{
                  borderTop: `1px solid ${isBingoShow ? alphaColor(theme.borderSecondary, '33') : alphaColor(theme.borderMuted, '40')}`,
                  paddingTop: 7,
                  marginTop: 7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.9, color: theme.textSecondary }}>
                  {missingLabel}
                </span>
                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                  {p.missingNumbers.map((mn, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1.5px solid ${
                          isCritical
                            ? alphaColor(prizeColor, 'cc')
                            : isAlmostThere
                            ? alphaColor(prizeColor, '70')
                            : isBingoShow
                            ? alphaColor(theme.borderSecondary, '66')
                            : alphaColor(theme.borderMuted, '80')
                        }`,
                        backgroundColor: isCritical
                          ? alphaColor(prizeColor, '18')
                          : isAlmostThere
                          ? alphaColor(prizeColor, '10')
                          : isBingoShow
                          ? 'rgba(4,8,38,0.6)'
                          : alphaColor(theme.secondary, '20'),
                        boxShadow: isBingoShow && isCritical ? `0px 0px 6px color-mix(in srgb, ${prizeColor} 50%, transparent)` : undefined,
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 900, color: isCritical || isAlmostThere ? prizeColor : theme.textSecondary }}>
                        {mn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default TopPlayers;

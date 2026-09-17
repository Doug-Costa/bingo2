import React from 'react';
import { CouponItem } from '../mocks/drawMock';
import { BingoShowColors } from '../design-system';
import { BingoShowTopWinnersFrame } from './BingoShowTopWinnersFrame';
import { useAppTheme } from '@/contexts/ThemeContext';

export interface BingoShowCouponsTableProps {
  coupons: CouponItem[];
  style?: React.CSSProperties;
}

const MISSING_SLOTS = 5;
const VISIBLE_ROWS = 10;

export const BingoShowCouponsTable: React.FC<BingoShowCouponsTableProps> = ({
  coupons,
  style,
}) => {
  const { theme } = useAppTheme();

  const rows = React.useMemo(() => {
    const list = [...coupons];
    while (list.length < VISIBLE_ROWS) {
      list.push({ coupon: '---', donor: '---', missing: [] });
    }
    return list.slice(0, VISIBLE_ROWS);
  }, [coupons]);

  return (
    <BingoShowTopWinnersFrame style={{ width: '100%', height: '100%', ...style }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: 64,
            borderBottom: `2px solid ${theme.secondary || BingoShowColors.cyanNeon}66`,
            marginBottom: 8,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <span style={{ width: '28%', fontSize: 22, fontWeight: 900, color: theme.secondary || BingoShowColors.cyanNeon, letterSpacing: 2 }}>CUPOM</span>
          <span style={{ width: '40%', fontSize: 22, fontWeight: 900, color: theme.secondary || BingoShowColors.cyanNeon, letterSpacing: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>DOADOR</span>
          <span style={{ width: '32%', fontSize: 22, fontWeight: 900, color: theme.secondary || BingoShowColors.cyanNeon, letterSpacing: 2, textAlign: 'center' }}>FALTAM</span>
        </div>

        {/* ROWS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          {rows.map((row, idx) => {
            const hasData = row.coupon !== '---';
            const missing = row.missing || [];
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 48,
                  paddingLeft: 8,
                  paddingRight: 8,
                  backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderRadius: 12,
                }}
              >
                {/* CUPOM */}
                <div style={{ width: '28%' }}>
                  {hasData ? (
                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        fontSize: 20,
                        fontWeight: 900,
                        borderRadius: 20,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 2,
                        paddingBottom: 2,
                        display: 'inline-block',
                        boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
                      }}
                    >
                      {row.coupon}
                    </span>
                  ) : (
                    <span style={{ color: theme.textMuted || BingoShowColors.textMuted, fontSize: 20 }}>---</span>
                  )}
                </div>

                {/* DOADOR */}
                <span
                  style={{
                    width: '40%',
                    fontSize: 22,
                    fontWeight: 700,
                    color: hasData ? (theme.textPrimary || BingoShowColors.textPrimary) : (theme.textMuted || BingoShowColors.textMuted),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.donor}
                </span>

                {/* FALTAM */}
                <div style={{ width: '32%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {Array.from({ length: MISSING_SLOTS }).map((_, slotIdx) => {
                    const val = missing[slotIdx];
                    if (val !== undefined) {
                      return (
                        <div
                          key={slotIdx}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            backgroundColor: theme.primary || BingoShowColors.primary,
                            color: '#000000',
                            fontSize: 16,
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 8px ${theme.primaryGlow || 'rgba(255,222,56,0.6)'}`,
                          }}
                        >
                          {val}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={slotIdx}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: `2px solid ${theme.borderSecondary || BingoShowColors.borderSubtle}`,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BingoShowTopWinnersFrame>
  );
};

export default BingoShowCouponsTable;

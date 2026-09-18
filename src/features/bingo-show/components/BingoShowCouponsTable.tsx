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
            height: 48,
            borderBottom: `2px solid rgba(23, 200, 255, 0.4)`,
            marginBottom: 6,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <span style={{ width: '26%', fontSize: 18, fontWeight: 900, color: '#E52B21', letterSpacing: 1.5 }}>CUPOM</span>
          <span style={{ width: '42%', fontSize: 18, fontWeight: 900, color: '#8FD9FF', letterSpacing: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>DOADOR</span>
          <span style={{ width: '32%', fontSize: 18, fontWeight: 900, color: '#8FD9FF', letterSpacing: 1.5, textAlign: 'center' }}>FALTAM</span>
        </div>

        {/* ROWS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 3 }}>
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
                  height: 38,
                  paddingLeft: 10,
                  paddingRight: 10,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  boxSizing: 'border-box',
                }}
              >
                {/* CUPOM */}
                <div style={{ width: '26%' }}>
                  {hasData ? (
                    <span
                      style={{
                        color: '#E52B21',
                        fontSize: 16,
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        fontFamily: 'monospace, sans-serif',
                      }}
                    >
                      {row.coupon}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: 16, fontWeight: 700 }}>---</span>
                  )}
                </div>

                {/* DOADOR */}
                <span
                  style={{
                    width: '42%',
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#0F172A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
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
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: '#0F172A',
                            border: '1.5px solid #FFCF12',
                            color: '#FFCF12',
                            fontSize: 12,
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 6px rgba(255, 207, 18, 0.4)',
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
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#F8FAFC',
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

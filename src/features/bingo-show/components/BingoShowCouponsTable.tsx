import React from 'react';
import { CouponItem } from '../mocks/drawMock';
import { BingoShowColors } from '../design-system';
import { BingoShowTopWinnersFrame } from './BingoShowTopWinnersFrame';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/TvConfigContext';
import blueTable from './BingoShowCouponsTableBlue.module.css';
import ouroTable from './BingoShowCouponsTableOuro.module.css';
import goldTable from './BingoShowCouponsTableGold.module.css';
import { getEsSkin } from './esSkin';
import goldPanel from './gold/GoldTheme.module.css';
import { ouroBallAsset } from '../utils/ouroBall';

/** Módulo de estilos da tabela em cards (Blue, Ouro, Paraguay — mesmos nomes de classe). */
type CardTableCss = typeof blueTable;

/** Textos da tabela (traduzidos pelo idioma da TV). */
type TableLabels = { coupon: string; donor: string; missing: string; almost: string };

export interface BingoShowCouponsTableProps {
  coupons: CouponItem[];
  style?: React.CSSProperties;
  /** Tema Blue: `true` quando o quadro divide a coluna com "MINHAS CARTELAS" —
   * linhas compactas para os 10 caberem sem corte. `false`: linhas esticam até
   * preencher o quadro inteiro (fontes/bolas maiores). */
  compact?: boolean;
}

const MISSING_SLOTS = 5;
const VISIBLE_ROWS = 10;

/** Card de um registro (temas Blue e Bingo Show/Ouro — só muda o módulo de CSS e,
 * no Ouro, a imagem da bola). Só apresentação: mesmos campos, mesma ordem.
 * A proximidade vem do tamanho de `missing` — a lista de números que ainda faltam
 * enviada pelo backend (`missingNumbers`) — só quando o registro tem dados e a
 * lista não está vazia; sem isso, nenhuma marca é exibida. */
const CardCouponRow: React.FC<{ row: CouponItem; css: CardTableCss; ballImage?: (n: number) => string; almostText: string }> = ({
  row,
  css: blueTable,
  ballImage,
  almostText,
}) => {
  const hasData = row.coupon !== '---';
  const missing = row.missing || [];
  const missingCount = hasData ? missing.length : 0;
  const signature = missing.join(',');

  // Flash + entrada das bolas novas SÓ quando os números deste registro mudam
  // por SSE (não na 1ª renderização, não em re-renders do relógio).
  const [update, setUpdate] = React.useState<{ n: number; fresh: Set<number> }>({ n: 0, fresh: new Set() });
  const prevRef = React.useRef<number[] | null>(null);
  React.useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = missing;
    if (prev === null || !hasData || prev.join(',') === signature) return;
    setUpdate((u) => ({ n: u.n + 1, fresh: new Set(missing.filter((v) => !prev.includes(v))) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, hasData]);

  const tier =
    missingCount === 1 ? blueTable.cardCritical : missingCount === 2 ? blueTable.cardNear : '';

  return (
    <div className={`${blueTable.card} ${tier} ${hasData ? '' : blueTable.cardEmpty}`}>
      {update.n > 0 && <span key={update.n} className={blueTable.flash} />}
      {missingCount === 1 && <span className={blueTable.almostBadge}>{almostText}</span>}

      <span className={`${blueTable.coupon} ${hasData ? '' : blueTable.placeholderText}`}>{row.coupon}</span>
      <span className={`${blueTable.donor} ${hasData ? '' : blueTable.placeholderText}`}>{row.donor}</span>

      <div className={blueTable.missing}>
        {Array.from({ length: MISSING_SLOTS }).map((_, slotIdx) => {
          const val = missing[slotIdx];
          return val !== undefined ? (
            <div
              key={`n${val}`}
              className={`${blueTable.ball} ${blueTable.ballActive} ${update.fresh.has(val) ? blueTable.ballEnter : ''}`}
              style={ballImage ? ({ '--ball-img': `url(${ballImage(val)})` } as React.CSSProperties) : undefined}
            >
              {val}
            </div>
          ) : (
            <div key={`e${slotIdx}`} className={`${blueTable.ball} ${blueTable.ballEmpty}`} />
          );
        })}
      </div>
    </div>
  );
};

const CardCouponsTable: React.FC<{ rows: CouponItem[]; compact: boolean; css: CardTableCss; ballImage?: (n: number) => string; labels: TableLabels }> = ({
  rows,
  compact,
  css: blueTable,
  ballImage,
  labels,
}) => {
  // Key estável por registro (cupom + ocorrência, pois o mesmo cupom pode vir
  // em mais de uma linha), para o card manter o estado de "antes" quando o
  // backend reordena a lista numa atualização. Não altera a ordem exibida.
  const seen = new Map<string, number>();
  return (
    <div className={`${blueTable.table} ${compact ? blueTable.compact : blueTable.full}`}>
      <div className={blueTable.header}>
        <span className={blueTable.headCoupon}>{labels.coupon}</span>
        <span className={blueTable.headDonor}>{labels.donor}</span>
        <span className={blueTable.headMissing}>{labels.missing}</span>
      </div>
      <div className={blueTable.list}>
        {rows.map((row, idx) => {
          if (row.coupon === '---') return <CardCouponRow key={`empty-${idx}`} row={row} css={blueTable} ballImage={ballImage} almostText={labels.almost} />;
          const n = seen.get(row.coupon) ?? 0;
          seen.set(row.coupon, n + 1);
          return <CardCouponRow key={`${row.coupon}#${n}`} row={row} css={blueTable} ballImage={ballImage} almostText={labels.almost} />;
        })}
      </div>
    </div>
  );
};

export const BingoShowCouponsTable: React.FC<BingoShowCouponsTableProps> = ({
  coupons,
  style,
  compact = false,
}) => {
  const { isBlue, themeId } = useAppTheme();
  const t = useT();
  const isOuro = themeId === 'bingo-show';
  // Família es-PY (Paraguay, Loteria'i): coluna do nome própria da marca.
  const es = getEsSkin(themeId);
  const labels: TableLabels = {
    coupon: t('coupons.coupon'),
    donor: t(es ? es.text.playerColumnKey : 'coupons.donor'),
    missing: t('coupons.missing'),
    almost: t('coupons.almost'),
  };

  const rows = React.useMemo(() => {
    const list = [...coupons];
    while (list.length < VISIBLE_ROWS) {
      list.push({ coupon: '---', donor: '---', missing: [] });
    }
    return list.slice(0, VISIBLE_ROWS);
  }, [coupons]);

  if (isBlue) {
    return (
      <BingoShowTopWinnersFrame style={{ width: '100%', height: '100%', ...style }}>
        <CardCouponsTable rows={rows} compact={compact} css={blueTable} labels={labels} />
      </BingoShowTopWinnersFrame>
    );
  }

  // Família es-PY (Paraguay, Loteria'i): mesma tabela em cards.
  if (es) {
    return (
      <div className={`${es.css.theme.vars} ${es.css.theme.panel}`} style={{ width: '100%', height: '100%', padding: 10, boxSizing: 'border-box', ...style }}>
        <CardCouponsTable rows={rows} compact={compact} css={es.css.coupons} labels={labels} />
      </div>
    );
  }

  // tema-ouro ("Fortuna"): mesma tabela em cards, bolas de ouro em CSS.
  if (themeId === 'tema-ouro') {
    return (
      <div className={`${goldPanel.vars} ${goldPanel.panel}`} style={{ width: '100%', height: '100%', padding: 10, boxSizing: 'border-box', ...style }}>
        <CardCouponsTable rows={rows} compact={compact} css={goldTable} labels={labels} />
      </div>
    );
  }

  // Bingo Show (Ouro & Espaço): mesma tabela em cards, com o visual do tema e as
  // bolas 3D do tema no FALTAM.
  if (isOuro) {
    return (
      <BingoShowTopWinnersFrame style={{ width: '100%', height: '100%', ...style }}>
        <CardCouponsTable rows={rows} compact={compact} css={ouroTable} ballImage={ouroBallAsset} labels={labels} />
      </BingoShowTopWinnersFrame>
    );
  }

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
          <span style={{ width: '26%', fontSize: 18, fontWeight: 900, color: '#E52B21', letterSpacing: 1.5 }}>{labels.coupon}</span>
          <span style={{ width: '42%', fontSize: 18, fontWeight: 900, color: '#8FD9FF', letterSpacing: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labels.donor}</span>
          <span style={{ width: '32%', fontSize: 18, fontWeight: 900, color: '#8FD9FF', letterSpacing: 1.5, textAlign: 'center' }}>{labels.missing}</span>
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

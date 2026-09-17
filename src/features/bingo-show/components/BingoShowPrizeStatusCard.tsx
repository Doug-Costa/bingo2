import React from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowIcon, type BingoShowIconName } from './BingoShowIcon';
import { BingoShowColors, BingoShowSpacing } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';

export type PrizeRowStatus = 'pending' | 'active' | 'completed';

export interface BingoShowPrizeStatusCardProps {
  accumulatedAmount?: string;
  triggerBallLimit?: number;
  jackpotActive?: boolean;
  line1Amount?: string;
  line2Amount?: string;
  bingoAmount?: string;
  line1Status?: PrizeRowStatus;
  line2Status?: PrizeRowStatus;
  bingoStatus?: PrizeRowStatus;
  drawNumber?: string;
  donationAmount?: string;
  dateStr?: string;
  timeStr?: string;
  style?: React.CSSProperties;
}

interface MetaAccent {
  color: string;
  soft: string;
}

const META_ACCENTS: Record<'sorteio' | 'doacao' | 'data' | 'hora', MetaAccent> = {
  sorteio: { color: BingoShowColors.secondary, soft: 'rgba(72, 104, 255, 0.16)' },
  doacao: { color: BingoShowColors.cyanNeon, soft: 'rgba(0, 229, 255, 0.14)' },
  data: { color: '#8FD9FF', soft: 'rgba(143, 217, 255, 0.14)' },
  hora: { color: '#F0CE7A', soft: 'rgba(240, 206, 122, 0.16)' },
};

const PrizeRow: React.FC<{
  label: string;
  value: string;
  status: PrizeRowStatus;
  bgAsset: string;
}> = ({ label, value, status, bgAsset }) => {
  const { theme, isBlue } = useAppTheme();
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  const statusText = isActive ? 'EM DISPUTA' : isCompleted ? 'CONCLUÍDO' : 'AGUARDANDO';
  const opacity = isActive ? 1 : 0.55;

  const activeColor = theme.primary || '#FFDE38';
  const secondaryColor = theme.secondary || BingoShowColors.cyanNeon;
  const successColor = theme.success || '#00FF88';

  const cardBgStyle = isBlue
    ? {
        backgroundColor: isActive ? 'rgba(8, 127, 252, 0.22)' : 'rgba(3, 17, 48, 0.75)',
        border: `1.5px solid ${isActive ? theme.borderPrimary : 'rgba(25, 117, 210, 0.3)'}`,
        boxShadow: isActive ? '0 0 20px rgba(8, 127, 252, 0.4)' : 'none',
      }
    : {
        backgroundImage: `url(${bgAsset})`,
        backgroundSize: '100% 100%',
      };

  const cardContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 16,
        padding: '12px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity,
        transition: 'all 300ms ease',
        ...cardBgStyle,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', letterSpacing: 1.5 }}>{label}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: isActive ? secondaryColor : isCompleted ? successColor : 'rgba(255,255,255,0.6)',
            marginTop: 2,
          }}
        >
          {isCompleted ? '✓ ' : ''}
          {statusText}
        </span>
      </div>

      <div
        style={{
          backgroundImage: isBlue ? undefined : `url(${BingoShowAssets.cards.prizeValue})`,
          backgroundColor: isBlue ? 'rgba(0, 0, 0, 0.5)' : undefined,
          border: isBlue ? `1.5px solid ${activeColor}` : undefined,
          borderRadius: isBlue ? 12 : undefined,
          backgroundSize: '100% 100%',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isBlue && isActive ? `0 0 14px ${activeColor}55` : undefined,
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: isActive ? activeColor : '#FFFFFF',
            textShadow: isActive ? `0 0 16px ${activeColor}` : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ flex: isActive ? 1.4 : 0.9, width: '100%', transition: 'flex 300ms ease' }}>
      {cardContent}
    </div>
  );
};

const MetaCard: React.FC<{
  icon: BingoShowIconName;
  label: string;
  value: string;
  accent: MetaAccent;
}> = ({ icon, label, value, accent }) => {
  const { isBlue, theme } = useAppTheme();

  return (
    <div
      style={{
        flex: 1,
        backgroundImage: isBlue ? undefined : `url(${BingoShowAssets.cards.metadata})`,
        backgroundColor: isBlue ? 'rgba(3, 17, 48, 0.85)' : undefined,
        border: isBlue ? '1px solid rgba(25, 117, 210, 0.4)' : undefined,
        borderRadius: isBlue ? 14 : undefined,
        backgroundSize: '100% 100%',
        padding: '12px 20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: accent.soft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <BingoShowIcon name={icon} size={36} color={isBlue ? theme.secondary : accent.color} transparentBg />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: isBlue ? theme.secondary : accent.color, letterSpacing: 1.6, textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
      </div>
    </div>
  );
};

export const BingoShowPrizeStatusCard: React.FC<BingoShowPrizeStatusCardProps> = ({
  accumulatedAmount = 'GS. 0',
  triggerBallLimit,
  jackpotActive = false,
  line1Amount = 'GS. 0',
  line2Amount = 'GS. 0',
  bingoAmount = 'GS. 0',
  line1Status = 'active',
  line2Status = 'pending',
  bingoStatus = 'pending',
  drawNumber = '---',
  donationAmount = '',
  dateStr = '',
  timeStr = '',
  style,
}) => {
  const { theme, isBlue } = useAppTheme();
  const primaryColor = theme.primary || '#FFDE38';
  const secondaryColor = theme.secondary || BingoShowColors.cyanNeon;

  const prizes = [
    { label: '1 LINHA', value: line1Amount, status: line1Status, asset: BingoShowAssets.cards.prize },
    { label: '2 LINHAS', value: line2Amount, status: line2Status, asset: BingoShowAssets.cards.prize },
    { label: 'BINGO', value: bingoAmount, status: bingoStatus, asset: BingoShowAssets.cards.prize },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: BingoShowSpacing.xs,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 1. COFRE ACUMULADO HERO CARD */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 140,
          backgroundImage: isBlue ? undefined : `url(${BingoShowAssets.jackpot.panel})`,
          backgroundColor: isBlue ? 'rgba(3, 17, 48, 0.95)' : undefined,
          border: isBlue ? `2px solid ${theme.borderPrimary}` : undefined,
          borderRadius: isBlue ? 20 : undefined,
          boxShadow: isBlue ? `0 0 24px rgba(8, 127, 252, 0.4)` : undefined,
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          paddingRight: 12,
          boxSizing: 'border-box',
          overflow: 'visible',
          opacity: jackpotActive ? 1 : 0.45,
          filter: jackpotActive ? 'none' : 'grayscale(0.5)',
          transition: 'opacity 300ms ease, filter 300ms ease',
        }}
      >
        {/* 3D CHEST ARTWORK */}
        <img src={BingoShowAssets.jackpot.artwork} alt="Baú 3D" style={{ height: 160, objectFit: 'contain', flexShrink: 0, marginLeft: -8 }} />

        {/* ACCUMULATED AMOUNT */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, paddingLeft: 4, paddingRight: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: secondaryColor, letterSpacing: 2, textTransform: 'uppercase' }}>
            ACUMULADO
          </span>
          <span style={{ fontSize: 32, fontWeight: 900, color: primaryColor, textShadow: `0 0 16px ${primaryColor}`, marginTop: 2, whiteSpace: 'nowrap' }}>
            {accumulatedAmount}
          </span>
        </div>

        {/* 3D STAR WITH TRIGGER BALL */}
        {typeof triggerBallLimit === 'number' && triggerBallLimit > 0 ? (
          <div
            style={{
              width: 140,
              height: 140,
              backgroundImage: `url(${BingoShowAssets.jackpot.star})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#FFF6D6', fontSize: 44, fontWeight: 900, textShadow: '0 2px 6px rgba(0,10,45,0.95)' }}>
              {triggerBallLimit}
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. 3 PRIZE ROWS WITH REAL PNG CARDS */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {prizes.map((p) => (
          <PrizeRow key={p.label} label={p.label} value={p.value} status={p.status} bgAsset={p.asset} />
        ))}
      </div>

      {/* 3. METADATA 2X2 GRID (SORTEIO, DOAÇÃO, DATA, HORA) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
          <MetaCard icon="ticket" label="SORTEIO" value={drawNumber} accent={META_ACCENTS.sorteio} />
          <MetaCard icon="star" label="DOAÇÃO" value={donationAmount} accent={META_ACCENTS.doacao} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
          <MetaCard icon="calendar" label="DATA" value={dateStr} accent={META_ACCENTS.data} />
          <MetaCard icon="clock" label="HORA" value={timeStr} accent={META_ACCENTS.hora} />
        </div>
      </div>
    </div>
  );
};

export default BingoShowPrizeStatusCard;


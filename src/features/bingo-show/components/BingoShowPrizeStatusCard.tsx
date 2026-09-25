import React, { useEffect, useRef, useState } from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowIcon, type BingoShowIconName } from './BingoShowIcon';
import { BingoShowColors, BingoShowSpacing } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';
import goldStyles from './goldMetalText.module.css';
import blueStyles from './BingoShowPrizeStatusBlue.module.css';
import { useFitText } from '../hooks/useFitText';
import { moneyLengthTier, type MoneyLengthTier } from '../utils/moneyLength';

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

/** Conta mudanças reais de um valor (não conta a 1ª renderização) — usado como key
 * do flash dourado, para ele tocar uma vez por atualização e nunca em re-renders. */
function useChangeTick(value: string): number {
  const prev = useRef(value);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setTick((t) => t + 1);
    }
  }, [value]);
  return tick;
}

/** Tamanhos (px, palco 1920×1080) por faixa de comprimento do valor formatado. */
const MONEY_SIZES: Record<'active' | 'idle' | 'jackpot', Record<MoneyLengthTier, number>> = {
  active: { normal: 44, long: 36, xlong: 30 },
  jackpot: { normal: 42, long: 34, xlong: 28 },
  idle: { normal: 30, long: 26, xlong: 22 },
};

/** Valor monetário do tema Blue: linha única, algarismos tabulares, fonte pela
 * faixa de comprimento e reduzida (até 70%) só se ainda não couber na área
 * reservada — nunca quebra, corta ou rola. Aceita qualquer string já formatada
 * (hoje "R$ 150,00"; no futuro algo como "₲ 12.500.000"). */
const BlueMoney: React.FC<{ value: string; role: 'active' | 'idle' | 'jackpot'; className?: string }> = ({
  value,
  role,
  className,
}) => {
  const max = MONEY_SIZES[role][moneyLengthTier(value)];
  const fit = useFitText(value, max, Math.round(max * 0.7), 'ellipsis', true);
  return (
    <span className={blueStyles.valueFit} data-fit-box style={{ height: Math.round(max * 1.12) }}>
      <span ref={fit.ref} className={`${blueStyles.money} ${className ?? ''}`} style={{ fontSize: fit.size }}>
        {value}
      </span>
    </span>
  );
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
  const valueTick = useChangeTick(value);
  // Blue: ouro metálico por estado (em disputa / aguardando / concluído).
  const blueValueClass = isActive
    ? goldStyles.goldValueActive
    : isCompleted
    ? goldStyles.goldValueDone
    : goldStyles.goldValueWaiting;

  const cardBgStyle = isBlue
    ? {
        backgroundColor: isActive ? 'rgba(12, 140, 255, 0.28)' : 'rgba(3, 17, 48, 0.75)',
        border: `1.5px solid ${isActive ? '#2fd8ff' : 'rgba(25, 117, 210, 0.3)'}`,
        boxShadow: isActive ? '0 0 20px rgba(8, 127, 252, 0.45)' : 'none',
      }
    : {
        backgroundImage: `url(${bgAsset})`,
        backgroundSize: '100% 100%',
      };

  const cardContent = (
    <div
      className={isBlue ? blueStyles.card : undefined}
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
      {isBlue && isActive && (
        <>
          <span className={blueStyles.neonGlow} />
          <span className={blueStyles.neonRing}>
            <span className={blueStyles.neonSweep} />
          </span>
        </>
      )}
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

      {isBlue ? (
        <div
          className={blueStyles.valueCapsule}
          style={{
            border: `1.5px solid ${activeColor}`,
            boxShadow: isActive ? `0 0 14px ${activeColor}55` : undefined,
          }}
        >
          {/* Reflexo: montado só quando o prêmio ENTRA em disputa → toca uma vez. */}
          {isActive && <span className={goldStyles.goldShine} />}
          {/* Flash dourado único a cada mudança real do valor. */}
          {valueTick > 0 && <span key={valueTick} className={goldStyles.goldFlash} />}
          <BlueMoney value={value} role={isActive ? 'active' : 'idle'} className={blueValueClass} />
        </div>
      ) : (
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
          position: isBlue ? 'relative' : undefined,
          overflow: isBlue ? 'hidden' : undefined,
        }}
      >
        {/* Reflexo: montado só quando o prêmio ENTRA em disputa → toca uma vez. */}
        {isBlue && isActive && <span className={goldStyles.goldShine} />}
        {/* Flash dourado único a cada mudança real do valor. */}
        {isBlue && valueTick > 0 && <span key={valueTick} className={goldStyles.goldFlash} />}
        <span
          className={isBlue ? blueValueClass : undefined}
          style={{
            fontSize: 26,
            fontWeight: 900,
            whiteSpace: 'nowrap',
            ...(isBlue
              ? { position: 'relative' }
              : { color: isActive ? activeColor : '#FFFFFF', textShadow: isActive ? `0 0 16px ${activeColor}` : 'none' }),
          }}
        >
          {value}
        </span>
      </div>
      )}
    </div>
  );

  return (
    <div style={{ flex: isActive ? 1.4 : 0.9, width: '100%', transition: 'flex 300ms ease' }}>
      {cardContent}
    </div>
  );
};

const META_ICONS_PNG: Record<string, string> = {
  ticket: '/themes/bingo-show-blue/trevo.png',
  star: '/themes/bingo-show-blue/coracao.png',
  calendar: '/themes/bingo-show-blue/calendario.png',
  clock: '/themes/bingo-show-blue/relogio.png',
  sorteio: '/themes/bingo-show-blue/trevo.png',
  doacao: '/themes/bingo-show-blue/coracao.png',
  data: '/themes/bingo-show-blue/calendario.png',
  hora: '/themes/bingo-show-blue/relogio.png',
};

const MetaCard: React.FC<{
  icon: BingoShowIconName;
  label: string;
  value: string;
  accent: MetaAccent;
  /** Valor em reais — no Blue recebe o ouro metálico (compacto, texto pequeno). */
  monetary?: boolean;
}> = ({ icon, label, value, accent, monetary = false }) => {
  const { isBlue, theme } = useAppTheme();
  const pngIcon = isBlue ? META_ICONS_PNG[icon] : undefined;

  return (
    <div
      style={{
        flex: 1,
        backgroundImage: isBlue ? undefined : `url(${BingoShowAssets.cards.metadata})`,
        backgroundColor: isBlue ? 'rgba(3, 17, 48, 0.88)' : undefined,
        border: isBlue ? '1.5px solid rgba(25, 117, 210, 0.5)' : undefined,
        borderRadius: 14,
        backgroundSize: '100% 100%',
        padding: '8px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
        boxShadow: isBlue ? '0 0 12px rgba(8, 127, 252, 0.2)' : undefined,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: isBlue ? 'rgba(8, 127, 252, 0.15)' : accent.soft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {pngIcon ? (
          <img src={pngIcon} alt={label} className={`${blueStyles.metaIcon} ${blueStyles[`metaIcon_${icon}`] ?? ''}`} />
        ) : (
          <BingoShowIcon name={icon} size={28} color={isBlue ? theme.secondary : accent.color} transparentBg />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: isBlue ? '#8FD9FF' : accent.color, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {label}
        </span>
        <span
          className={isBlue && monetary && value ? goldStyles.goldMetalTextCompact : undefined}
          style={{
            fontSize: 18,
            fontWeight: 900,
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...(isBlue && monetary && value ? {} : { color: '#FFFFFF' }),
          }}
        >
          {value || '---'}
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
    { label: isBlue ? 'PRÊMIO 1' : '1 LINHA', value: line1Amount, status: line1Status, asset: BingoShowAssets.cards.prize },
    { label: isBlue ? 'PRÊMIO 2' : '2 LINHAS', value: line2Amount, status: line2Status, asset: BingoShowAssets.cards.prize },
    { label: isBlue ? 'PRÊMIO 3' : 'BINGO', value: bingoAmount, status: bingoStatus, asset: BingoShowAssets.cards.prize },
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
        // Blue: largura estável da coluna. Antes ela era decidida pelo texto do
        // acumulado (596px com "R$ 600,00", 641px com "R$ 12.500,00"), deslocando o
        // palco central conforme o valor. Agora o valor encolhe dentro da área e a
        // coluna fica fixa no tamanho atual de produção.
        ...(isBlue ? { minWidth: 600 } : {}),
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
          // Blue: laterais menores para a área central (valor) ganhar espaço.
          paddingLeft: isBlue ? 8 : 12,
          paddingRight: isBlue ? 8 : 12,
          boxSizing: 'border-box',
          overflow: 'visible',
          opacity: jackpotActive ? 1 : 0.45,
          filter: jackpotActive ? 'none' : 'grayscale(0.5)',
          transition: 'opacity 300ms ease, filter 300ms ease',
        }}
      >
        {/* 3D CHEST ARTWORK — Blue: pulso ocasional + reflexo recortado pelo PNG. */}
        {isBlue ? (
          <div className={blueStyles.chest}>
            <img src={BingoShowAssets.jackpot.artwork} alt="Baú 3D" style={{ height: 144, objectFit: 'contain', display: 'block' }} />
            <span
              className={blueStyles.assetShine}
              style={{ WebkitMaskImage: `url(${BingoShowAssets.jackpot.artwork})`, maskImage: `url(${BingoShowAssets.jackpot.artwork})` }}
            />
          </div>
        ) : (
          <img src={BingoShowAssets.jackpot.artwork} alt="Baú 3D" style={{ height: 160, objectFit: 'contain', flexShrink: 0, marginLeft: -8 }} />
        )}

        {/* ACCUMULATED AMOUNT */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, paddingLeft: 4, paddingRight: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: secondaryColor, letterSpacing: 2, textTransform: 'uppercase' }}>
            ACUMULADO
          </span>
          {isBlue ? (
            <BlueMoney value={accumulatedAmount} role="jackpot" className={goldStyles.goldValueActive} />
          ) : (
            <span style={{ fontSize: 32, fontWeight: 900, marginTop: 2, whiteSpace: 'nowrap', color: primaryColor, textShadow: `0 0 16px ${primaryColor}` }}>
              {accumulatedAmount}
            </span>
          )}
        </div>

        {/* 3D STAR WITH TRIGGER BALL */}
        {typeof triggerBallLimit === 'number' && triggerBallLimit > 0 && isBlue ? (
          /* Blue: só a arte da estrela pulsa/gira (com reflexo); o número fica estável. */
          <div className={blueStyles.starWrap} style={{ width: 128, height: 128 }}>
            <span className={blueStyles.starArt} style={{ backgroundImage: `url(${BingoShowAssets.jackpot.star})` }}>
              <span
                className={blueStyles.assetShine}
                style={{ WebkitMaskImage: `url(${BingoShowAssets.jackpot.star})`, maskImage: `url(${BingoShowAssets.jackpot.star})` }}
              />
            </span>
            <span className={blueStyles.starNumber} style={{ color: '#FFF6D6', fontSize: 40, fontWeight: 900, textShadow: '0 2px 6px rgba(0,10,45,0.95)' }}>
              {triggerBallLimit}
            </span>
          </div>
        ) : typeof triggerBallLimit === 'number' && triggerBallLimit > 0 ? (
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
          <MetaCard icon="star" label="DOAÇÃO" value={donationAmount} accent={META_ACCENTS.doacao} monetary />
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


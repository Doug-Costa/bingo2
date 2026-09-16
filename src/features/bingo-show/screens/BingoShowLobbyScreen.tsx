import React, { useEffect, useMemo, useState } from 'react';
import { BingoShowTvLayout } from '../layouts/BingoShowTvLayout';
import {
  BingoShowText,
  BingoShowCountdown,
  BingoShowBadge,
  BingoShowTopWinnersFrame,
  BingoShowBannerFrame,
  BingoShowGlowHalo,
} from '../components';
import { BingoShowAssetPanel } from '../components/BingoShowAssetPanel';
import { BingoShowIcon, type BingoShowIconName } from '../components/BingoShowIcon';
import { BingoShowAssets } from '../assets';
import { useBingoShowRealtimeLobby } from '../hooks/useBingoShowRealtimeLobby';
import type { NextDrawItem } from '../mocks/lobbyMock';
import { BingoShowColors, BingoShowSpacing } from '../design-system';

const AccumulatedSparkle: React.FC<{
  left: string;
  top: string;
  size: number;
}> = ({ left, top, size }) => (
  <img
    src={BingoShowAssets.particles.gold}
    alt="sparkle"
    style={{
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
      objectFit: 'contain',
      opacity: 0.7,
      animation: 'bs-pulse 2s ease-in-out infinite',
      pointerEvents: 'none',
    }}
  />
);

const HeaderDivider: React.FC = () => (
  <div style={{ width: 1, height: '55%', backgroundColor: 'rgba(0, 229, 255, 0.3)', margin: '0 4px' }} />
);

const HeaderInfoBlock: React.FC<{
  label: string;
  value: string;
  icon?: BingoShowIconName;
  labelColor?: string;
  valueColor?: string;
}> = ({ label, value, icon, labelColor = BingoShowColors.cyanNeon, valueColor = '#FFFFFF' }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
    <span style={{ fontSize: 15, fontWeight: 900, color: labelColor, letterSpacing: 1, whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
      {icon ? <BingoShowIcon name={icon} size={18} color={labelColor} transparentBg /> : null}
      <span suppressHydrationWarning style={{ fontSize: 26, fontWeight: 900, color: valueColor, letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  </div>
);

const DRAW_PAGE_SIZE = 5;
const DRAW_PAGE_INTERVAL_MS = 6000;

const NextDrawsCarousel: React.FC<{ draws: NextDrawItem[] }> = ({ draws }) => {
  const pages = useMemo(() => {
    const chunks: NextDrawItem[][] = [];
    for (let i = 0; i < draws.length; i += DRAW_PAGE_SIZE) {
      chunks.push(draws.slice(i, i + DRAW_PAGE_SIZE));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [draws]);

  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;
    const id = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % pages.length);
    }, DRAW_PAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pages.length]);

  useEffect(() => {
    if (pageIndex >= pages.length) {
      setPageIndex(0);
    }
  }, [pageIndex, pages.length]);

  const currentPage = pages[pageIndex] ?? [];

  return (
    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {currentPage.map((item) => (
          <div
            key={item.id}
            style={{
              width: '100%',
              backgroundColor: item.isNext ? 'rgba(255, 222, 56, 0.12)' : 'rgba(0, 229, 255, 0.05)',
              border: item.isNext ? '1px solid rgba(255, 222, 56, 0.45)' : '1px solid rgba(0, 229, 255, 0.16)',
              borderRadius: 8,
              padding: '6px 8px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: item.isNext ? BingoShowColors.primary : BingoShowColors.textPrimary,
                  fontFamily: 'monospace',
                }}
              >
                {item.number}
              </span>
              <span style={{ fontSize: 22, fontWeight: 700, color: BingoShowColors.textPrimary }}>{item.time}</span>
            </div>

            <div style={{ height: 1, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 800, color: '#FFDE38', textAlign: 'center', letterSpacing: 0.5 }}>1ª LINHA</span>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 800, color: '#00E5FF', textAlign: 'center', letterSpacing: 0.5 }}>2ª LINHA</span>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 800, color: '#00FF88', textAlign: 'center', letterSpacing: 0.5 }}>BINGO</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', marginTop: 2 }}>
              <span style={{ flex: 1, fontSize: 24, fontWeight: 800, color: '#FFDE38', textAlign: 'center' }}>{item.line1Prize}</span>
              <span style={{ flex: 1, fontSize: 24, fontWeight: 800, color: '#00E5FF', textAlign: 'center' }}>{item.line2Prize}</span>
              <span style={{ flex: 1, fontSize: 24, fontWeight: 800, color: '#00FF88', textAlign: 'center' }}>{item.bingoPrize}</span>
            </div>
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 4 }}>
          {pages.map((_, idx) => (
            <div
              key={idx}
              style={{
                height: 5,
                width: idx === pageIndex ? 14 : 5,
                borderRadius: 2.5,
                backgroundColor: idx === pageIndex ? BingoShowColors.primary : 'rgba(255, 255, 255, 0.25)',
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PrizeCardDivider: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: '100%', height: 8, marginBottom: 6, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'absolute', width: '92%', height: 6, borderRadius: 3, opacity: 0.3, backgroundColor: color }} />
    <div style={{ width: '92%', height: 1.5, borderRadius: 1, opacity: 0.85, backgroundColor: color }} />
  </div>
);

export const BingoShowLobbyScreen: React.FC = () => {
  const mock = useBingoShowRealtimeLobby();

  const header = (
    <BingoShowGlowHalo color={BingoShowColors.cyanNeon} bleed={14} intensity={0.42} pulse={false} style={{ width: '100%', height: '100%' }}>
      <BingoShowBannerFrame padding="sm" style={{ width: '100%', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: BingoShowSpacing.sm, paddingRight: BingoShowSpacing.sm, boxSizing: 'border-box' }}>
          <div style={{ flexShrink: 0 }}>
            <img src={BingoShowAssets.logos.badge} alt="Bingo Show Logo" style={{ height: 120, aspectRatio: '616 / 349', objectFit: 'contain' }} />
          </div>

          <HeaderDivider />
          <HeaderInfoBlock label="PRÓXIMO SORTEIO" value={mock.drawNumberShort} />
          <HeaderDivider />
          <HeaderInfoBlock label="DATA" value={mock.currentDate} icon="calendar" />
          <HeaderDivider />
          <HeaderInfoBlock label="HORA" value={mock.currentTime} icon="clock" />
          <HeaderDivider />

          <div style={{ flex: 2, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <img src={BingoShowAssets.jackpot.artwork} alt="Baú de Ouro" style={{ width: 136, height: 86, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', minWidth: 0 }}>
              <span style={{ color: BingoShowColors.cyanNeon, fontSize: 15, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
                ACUMULADO ESPECIAL
              </span>
              <span style={{ color: '#FFDE38', fontSize: 28, fontWeight: 900, marginTop: 1, textShadow: '0 0 6px #FF9100' }}>
                {mock.accumulatedPrize}
              </span>
            </div>
            <div
              style={{
                width: 92,
                height: 92,
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
              <span style={{ color: '#FFF6D6', fontSize: 24, fontWeight: 900, textShadow: '0 1px 3px rgba(0,10,45,0.95)' }}>
                {mock.triggerBallLimit}
              </span>
            </div>
          </div>
        </div>
      </BingoShowBannerFrame>
    </BingoShowGlowHalo>
  );

  const left = (
    <BingoShowGlowHalo color={BingoShowColors.cyanNeon} bleed={8} intensity={0.24} pulse={false} style={{ width: '100%', height: '100%' }}>
      <BingoShowTopWinnersFrame padding="sm" style={{ width: '100%', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <BingoShowText preset="label" color="primary" style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>
              PRÓXIMOS SORTEIOS
            </BingoShowText>
            <div style={{ height: 1.5, width: '100%', backgroundColor: 'rgba(0, 229, 255, 0.4)', marginTop: 4 }} />
          </div>

          <NextDrawsCarousel draws={mock.nextDraws} />
        </div>
      </BingoShowTopWinnersFrame>
    </BingoShowGlowHalo>
  );

  const center = (
    <BingoShowGlowHalo color={BingoShowColors.cyanNeon} bleed={26} intensity={0.48} pulse={false} style={{ width: '100%', height: '100%' }}>
      <BingoShowAssetPanel variant="topWinners" resizeMode="stretch" padding="sm" radius="md" style={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '94%', alignItems: 'center', marginTop: BingoShowSpacing.lg, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '98%', minHeight: 400, backgroundImage: `url(${BingoShowAssets.stage.countdownPanel})`, backgroundSize: '100% 100%', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '23.5%', top: '36.5%', width: '53%', height: '33%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: BingoShowSpacing.xxs }}>
              <div style={{ position: 'absolute', top: -128, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: BingoShowSpacing.xxs, pointerEvents: 'none' }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: BingoShowColors.primary, letterSpacing: 2.8, textShadow: '0 0 10px rgba(255, 193, 7, 0.45)' }}>
                  {mock.drawNumber}
                </span>
                <span style={{ fontSize: 28, fontWeight: 700, color: BingoShowColors.textSecondary, letterSpacing: 3, textTransform: 'uppercase' }}>
                  O SORTEIO COMEÇA EM
                </span>
              </div>

              <BingoShowCountdown
                seconds={mock.countdownSeconds}
                label=""
                showTimerFrame={false}
                style={{ marginTop: 48 }}
                timerTextStyle={{ fontSize: 92, letterSpacing: 4 }}
              />
            </div>
          </div>
        </div>

        <div style={{ width: '94%', alignSelf: 'flex-start', marginLeft: '3%', marginBottom: BingoShowSpacing.xl }}>
          <div
            style={{
              width: '100%',
              paddingTop: 24,
              paddingBottom: 24,
              paddingLeft: BingoShowSpacing.md,
              paddingRight: BingoShowSpacing.md,
              backgroundImage: `url(${BingoShowAssets.jackpot.panel})`,
              backgroundSize: '100% 100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48%', backgroundImage: `url(${BingoShowAssets.effects.glassHighlight})`, backgroundSize: 'cover', opacity: 0.2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BingoShowAssets.effects.innerGlow})`, backgroundSize: 'cover', opacity: 0.24, pointerEvents: 'none' }} />

            <AccumulatedSparkle left="10%" top="20%" size={12} />
            <AccumulatedSparkle left="88%" top="65%" size={9} />

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, position: 'relative', zIndex: 2 }}>
              <img src={BingoShowAssets.jackpot.artwork} alt="Baú de Ouro" style={{ width: 120, height: 80, objectFit: 'contain', flexShrink: 0, marginLeft: 28 }} />

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ color: '#00E5FF', fontSize: 24, fontWeight: 900, letterSpacing: 1.4, flexShrink: 0, textShadow: '0 0 6px #0088FF' }}>
                  ACUMULADO
                </span>
                <span style={{ color: '#FFDE38', fontSize: 36, fontWeight: 900, letterSpacing: 0.3, textShadow: '0 0 10px #FF9100', flexShrink: 1, whiteSpace: 'nowrap' }}>
                  {mock.accumulatedPrize}
                </span>
              </div>

              {mock.triggerBallLimit !== undefined && (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    marginRight: 48,
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
                  <span style={{ color: '#FFF6D6', fontSize: 16, fontWeight: 900, textShadow: '0 1px 4px rgba(0,10,45,0.95)' }}>
                    {mock.triggerBallLimit}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </BingoShowAssetPanel>
    </BingoShowGlowHalo>
  );

  const right = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: BingoShowSpacing.xs, height: '100%' }}>
      {/* CARD 1: 1ª LINHA */}
      <BingoShowGlowHalo color={BingoShowColors.primary} bleed={8} intensity={0.5} pulse={false} style={{ flex: 1, width: '100%' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${BingoShowAssets.cards.prizeLineGold})`,
            backgroundSize: '100% 100%',
            borderRadius: 8,
            position: 'relative',
            padding: BingoShowSpacing.sm,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
        >
          <img src={BingoShowAssets.decorative.coinStack} alt="Moedas 3D" style={{ position: 'absolute', top: 20, right: 16, width: 144, height: (144 * 678) / 760, opacity: 0.97, objectFit: 'contain', pointerEvents: 'none' }} />

          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BingoShowBadge label="1ª LINHA" variant="gold" style={{ alignSelf: 'center', padding: '6px 12px' }} textStyle={{ fontSize: 22, letterSpacing: 1.6, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }} />
          </div>

          <PrizeCardDivider color={BingoShowColors.primary} />

          <div style={{ width: '100%', padding: '4px 0', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: 0.4, color: '#FFDE38', textShadow: '0 0 7px #FF9100' }}>
              {mock.line1Prize}
            </span>
          </div>
        </div>
      </BingoShowGlowHalo>

      {/* CARD 2: 2ª LINHA */}
      <BingoShowGlowHalo color={BingoShowColors.cyanNeon} bleed={8} intensity={0.5} pulse={false} style={{ flex: 1, width: '100%' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${BingoShowAssets.cards.prizeLineCyan})`,
            backgroundSize: '100% 100%',
            borderRadius: 8,
            position: 'relative',
            padding: BingoShowSpacing.sm,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
        >
          <img src={BingoShowAssets.decorative.coinStack} alt="Moedas 3D" style={{ position: 'absolute', top: 20, right: 16, width: 144, height: (144 * 678) / 760, opacity: 0.97, objectFit: 'contain', pointerEvents: 'none' }} />

          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BingoShowBadge label="2ª LINHA" variant="cyan" style={{ alignSelf: 'center', padding: '6px 12px' }} textStyle={{ fontSize: 22, letterSpacing: 1.6, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }} />
          </div>

          <PrizeCardDivider color={BingoShowColors.cyanNeon} />

          <div style={{ width: '100%', padding: '4px 0', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: 0.4, color: BingoShowColors.cyanNeon, textShadow: '0 0 7px rgba(0, 229, 255, 0.7)' }}>
              {mock.line2Prize}
            </span>
          </div>
        </div>
      </BingoShowGlowHalo>

      {/* CARD 3: BINGO */}
      <BingoShowGlowHalo color={BingoShowColors.greenSuccess} bleed={8} intensity={0.55} pulse={false} style={{ flex: 1, width: '100%' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${BingoShowAssets.cards.prizeBingoGreen})`,
            backgroundSize: '100% 100%',
            borderRadius: 8,
            position: 'relative',
            padding: BingoShowSpacing.sm,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
        >
          <img src={BingoShowAssets.decorative.coinStack} alt="Moedas 3D" style={{ position: 'absolute', top: 20, right: 16, width: 144, height: (144 * 678) / 760, opacity: 0.97, objectFit: 'contain', pointerEvents: 'none' }} />

          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BingoShowBadge label="BINGO" variant="green" style={{ alignSelf: 'center', padding: '6px 12px' }} textStyle={{ fontSize: 22, letterSpacing: 1.6, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }} />
          </div>

          <PrizeCardDivider color={BingoShowColors.greenSuccess} />

          <div style={{ width: '100%', padding: '4px 0', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: 0.4, color: BingoShowColors.greenSuccess, textShadow: '0 0 7px rgba(60, 220, 140, 0.7)' }}>
              {mock.bingoPrize}
            </span>
          </div>
        </div>
      </BingoShowGlowHalo>
    </div>
  );

  const footer = (
    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={BingoShowAssets.panels.footerComplete}
        alt="Rodapé Completo Bingo Show"
        style={{ width: '100%', height: '100%', objectFit: 'contain', aspectRatio: '2400 / 227', alignSelf: 'center' }}
      />
    </div>
  );

  return (
    <div style={{ flex: 1, backgroundColor: 'transparent', width: '100%', height: '100%' }}>
      <BingoShowTvLayout
        headerFlex={0.12}
        mainFlex={0.71}
        footerFlex={0.17}
        leftFlex={0.24}
        centerFlex={0.52}
        rightFlex={0.24}
        header={header}
        left={left}
        center={center}
        right={right}
        footer={footer}
      />
    </div>
  );
};

export default BingoShowLobbyScreen;

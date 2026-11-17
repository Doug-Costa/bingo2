/**
 * BingoShowDrawScreen.tsx — porte de
 * `tvapp1/src/features/bingo-show/screens/BingoShowDrawScreen.tsx` (Tela de Sorteio,
 * Bingo Show V2).
 *
 * Reescrito para bater card a card com o original RN: wrapper
 * `BingoShowAmbientBackground brightness="light"` (Ken Burns + glow respirando +
 * partículas + vinheta — estava ausente, causa raiz de "sem efeitos"), proporções de
 * flex idênticas (`topRow`60/`historyRow`40, `leftBox`38/`centerBox`62,
 * `couponsBox`55/`ticketsBox`45 SEMPRE renderizados — sem o `hasTickets` condicional
 * inventado), botão de som 30×30/ícone-16 (era 60×60/ícone-32), segundo `TimePill` usando
 * `mock.timeStr` (campo real do hook, não `currentTimeStr`), `DrawStage` sem
 * `countdownSeconds` (prop que não existe no original nem no hook), e
 * `BingoShowPrizeStatusCard` recebendo `line1Status`/`line2Status`/`bingoStatus`
 * DIRETO do hook (já são `'active'|'completed'|'pending'` — a tradução de string
 * `'EM DISPUTA'/'PREMIADO'` que existia aqui nunca batia com o valor real do hook e
 * fazia todo prêmio cair sempre em `'pending'`) mais `dateStr`/`timeStr` (props que
 * faltavam por completo).
 *
 * Áudio (`audioService`) permanece fora de escopo, conforme instrução original do
 * projeto ("não migrar áudio ainda") — o botão de som aqui só controla o próprio ícone/
 * estado visual, igual ao original antes da integração de áudio ser religada.
 */
'use client';

import { Profiler } from 'react';
import { onRenderTrace } from '@/lib/perfTrace';
import React, { useEffect, useState } from 'react';
import { BingoShowTvLayout } from '../layouts/BingoShowTvLayout';
import { BingoShowAmbientBackground } from '../components/BingoShowAmbientBackground';
import {
  BingoShowPrizeStatusCard,
  BingoShowCouponsTable,
  BingoShowTicketsGrid,
  BingoShowDrawnBalls,
  BingoShowTimePill,
  BingoShowIcon,
  BingoShowWinnerPopup,
} from '../components';
import { DrawStage } from '../components/DrawStage';
import { useBingoShowRealtimeDraw, type PrizeStatusType } from '../hooks/useBingoShowRealtimeDraw';
import { useBingoAudio, type PrizeType, type ShownPrize } from '../hooks/useBingoAudio';
import { type PrizeRowStatus } from '../components/BingoShowPrizeStatusCard';
import { BingoShowColors, BingoShowSpacing } from '../design-system';
import goldStyles from '../components/goldMetalText.module.css';
import goldTheme from '../components/gold/GoldTheme.module.css';
import { getEsSkin } from '../components/esSkin';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useTvConfig, useT } from '@/contexts/TvConfigContext';
import { TopFlagBand } from '../components/loteriai/FlagArt';
import { LoteriaiHeaderJackpot, LoteriaiHeaderMeta } from '../components/BingoShowPrizeStatusCard';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { AzulDrawScreen } from '../components/azul/AzulDrawScreen';

// O hook (`useBingoShowRealtimeDraw`) expõe o status de cada prêmio como o rótulo de
// exibição em si (`PrizeStatusType`, ex.: "EM DISPUTA"), não como o enum visual que
// `BingoShowPrizeStatusCard` espera (`PrizeRowStatus`). Tradução mínima, só de tipo —
// nenhuma lógica de negócio nova.
function toPrizeRowStatus(status: PrizeStatusType): PrizeRowStatus {
  if (status === 'EM DISPUTA') return 'active';
  if (status === 'PREMIADO') return 'completed';
  return 'pending';
}

/** Relógio com estado próprio: atualiza só este texto, sem redesenhar a tela a cada segundo. */
const LiveClock: React.FC<{ style: React.CSSProperties }> = ({ style }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return <span style={style}>{`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`}</span>;
};

/** Pozo do Loteria'i no cabeçalho (objeto fixo: o card é memorizado). */
const LT_JACKPOT_STYLE: React.CSSProperties = { position: 'absolute', top: 10, right: 10, zIndex: 3 };

interface DrawHeaderProps {
  accumulatedPrize: string;
  triggerBallLimit: number;
  jackpotActive: boolean;
  drawNumber: string;
  donationAmount: string;
  dateStr: string;
  timeStr: string;
  soundEnabled: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
}

/** Cabeçalho da tela do sorteio (logo, título, data/hora, som). Componente próprio
 * e memorizado: antes era redesenhado (com todos os estilos inline) a cada bola,
 * cupom e evento do sorteio — agora só quando um dado dele muda. */
const DrawHeader = React.memo(function DrawHeader({
  accumulatedPrize,
  triggerBallLimit,
  jackpotActive,
  drawNumber,
  donationAmount,
  dateStr,
  timeStr,
  soundEnabled,
  soundOn,
  onToggleSound,
}: DrawHeaderProps) {
  const { isBlue, themeId } = useAppTheme();
  const t = useT();
  // Ouro metálico dos títulos: Blue e Bingo Show (Ouro & Espaço).
  const goldTitle = isBlue || themeId === 'bingo-show';
  // tema-ouro ("Fortuna"): ouro em vários tons, laca vermelha e o logo dourado.
  const isGold = themeId === 'tema-ouro';
  // Família es-PY (Paraguay, Loteria'i): textos em espanhol, Loteria'i como marca
  // principal; cores, logos e textos do cabeçalho vêm da skin do tema.
  const es = getEsSkin(themeId);
  const isParaguay = es !== null;
  // Temas com o título em ouro próprio (classe do tema) e acentos dourados.
  const warm = isGold || isParaguay;
  // Loteria'i: cabeçalho sem título → data/hora e som maiores, na proporção da faixa.
  const isLt = es?.id === 'loteriai';
  const pillFont = isLt ? 16 : 14;
  const pillIcon = isLt ? 20 : 18;
  const soundSize = isLt ? 40 : 36;
  return (
    <div
      style={{
        display: 'flex',
        // Loteria'i: logo à direita e data/hora à esquerda (lados trocados).
        flexDirection: isLt ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: isLt ? 20 : 8,
        paddingBottom: es?.id === 'loteriai' ? 0 : 8,
        // Loteria'i: cabeçalho um pouco mais alto, com a faixa da bandeira
        // inteira ACIMA do título (sem passar por trás das letras).
        // Loteria'i (sem título): faixa, logo e data centralizados na altura.
        paddingTop: es?.id === 'loteriai' ? 0 : undefined,
        paddingRight: 8,
        height: es?.id === 'loteriai' ? 128 : 68,
        boxSizing: 'border-box',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Loteria'i: faixa da bandeira com o selo, acima do título. */}
      {/* Loteria'i: sem a faixa da bandeira (os cards do cabeçalho ficam limpos). */}
      {/* Loteria'i: pozo acumulado no canto superior direito (antes era a logo). */}
      {isLt && (
        <LoteriaiHeaderJackpot
          accumulatedAmount={accumulatedPrize}
          triggerBallLimit={triggerBallLimit}
          jackpotActive={jackpotActive}
          style={LT_JACKPOT_STYLE}
        />
      )}
      {/* LEFT: 3D LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 220, gap: 6 }}>
        {es && (
          // eslint-disable-next-line @next/next/no-img-element -- marca principal do tema
          <img
            src={es.id === 'loteriai' ? '/themes/loteriai/logos/logo-loteriai-md.webp' : es.art.logo}
            alt="Loteria'i"
            className={es.id === 'loteriai' ? es.css.theme.logoPulse : undefined}
            style={{ height: es.art.logoSecondary ? 60 : es.id === 'loteriai' ? 126 : 64, width: 'auto', flexShrink: 0, ...(es.id === 'loteriai' ? { position: 'absolute', top: 1, left: 18, zIndex: 2 } : {}), objectFit: 'contain', filter: es.art.logoSecondary ? 'drop-shadow(0 3px 6px rgba(0, 3, 12, 0.6))' : 'drop-shadow(0 3px 5px rgba(104, 57, 0, 0.35))' }}
          />
        )}
        {(!es || es.art.logoSecondary) && (
        <img
          src={
            es?.art.logoSecondary
              ? es.art.logoSecondary
              : isGold
              ? '/themes/tema-ouro/sm/logos/logo-bingo-show.webp'
              : '/themes/bingo-show-blue/logos/logo-main.webp'
          }
          alt="BINGO SHOW"
          style={{
            height: isParaguay ? 50 : isGold ? 58 : 52,
            objectFit: 'contain',
            filter: warm ? 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6))' : 'drop-shadow(0 0 12px rgba(8, 127, 252, 0.6))',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        )}
      </div>

      {/* CENTER: BINGO AO VIVO (Loteria'i: só a faixa da bandeira, sem título). */}
      {es?.id !== 'loteriai' && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {/* Blue: ouro metálico (goldMetalText.module.css) no lugar do amarelo
            chapado — cor/sombra saem do inline e vêm da classe; tamanho,
            fonte e espaçamento continuam os mesmos em todos os temas. */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <span
            className={es?.css.theme.starIcon ?? (goldTitle || warm ? goldStyles.goldIcon : undefined)}
            style={{ fontSize: 22, ...(goldTitle || warm ? {} : { color: '#FFCF12', textShadow: '0 0 10px rgba(255, 207, 18, 0.8)' }) }}
          >
            ★
          </span>
          <span
            className={es ? es.css.theme.titleText ?? es.css.theme.goldText : isGold ? goldTheme.goldText : goldTitle ? goldStyles.goldMetalText : undefined}
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 3,
              fontFamily: 'Barlow Condensed, sans-serif',
              textTransform: 'uppercase',
              ...(goldTitle || warm ? {} : { color: '#FFCF12', textShadow: '0 0 20px rgba(255, 207, 18, 0.85), 0 2px 4px rgba(0,0,0,0.9)' }),
            }}
          >
            {t('draw.liveTitle', { brand: es ? es.text.liveBrand : 'BINGO' })}
          </span>
          <span
            className={es?.css.theme.starIcon ?? (goldTitle || warm ? goldStyles.goldIcon : undefined)}
            style={{ fontSize: 22, ...(goldTitle || warm ? {} : { color: '#FFCF12', textShadow: '0 0 10px rgba(255, 207, 18, 0.8)' }) }}
          >
            ★
          </span>
        </div>
        <span
          className={es?.css.theme.liveSubtitle ?? (goldTitle || warm ? goldStyles.liveSubtitle : undefined)}
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginTop: -4,
            ...(goldTitle || warm ? {} : { color: '#FFDE38', textShadow: '0 0 8px rgba(255, 222, 56, 0.6)' }),
          }}
        >
          {es?.text.slogan ?? t('draw.liveSubtitle')}
        </span>
      </div>
      )}

      {/* RIGHT: DATE/TIME PILL + SOUND */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220, justifyContent: isLt ? 'flex-start' : 'flex-end', position: 'relative', zIndex: 2, ...(isLt ? { marginLeft: 168 } : {}) }}>
        {/* Loteria'i: sorteo / valor / fecha / hora em linha (no lugar da pílula). */}
        {isLt && (
          <LoteriaiHeaderMeta drawNumber={drawNumber} donationAmount={donationAmount} dateStr={dateStr} timeStr={timeStr} />
        )}
        {/* Integrated Date & Time pill [📅 28/07/2026 | 15:40:25] */}
        {!isLt && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            background: es ? es.tone.pillBg : isGold ? 'rgba(21, 16, 8, 0.92)' : 'rgba(3, 17, 48, 0.88)',
            border: es ? es.tone.pillBorder : warm ? '1.5px solid rgba(233, 169, 26, 0.75)' : '1.5px solid rgba(25, 117, 210, 0.6)',
            borderRadius: es?.id === 'loteriai' ? 22 : 20,
            padding: es?.id === 'loteriai' ? '7px 16px' : '6px 14px',
            boxShadow: es ? es.tone.pillGlow : warm ? '0 0 12px rgba(255, 179, 0, 0.25)' : '0 0 14px rgba(8, 127, 252, 0.3)',
            boxSizing: 'border-box',
          }}
        >
          <img src="/themes/bingo-show-blue/calendario.webp" alt="calendário" style={{ width: pillIcon, height: pillIcon, objectFit: 'contain' }} />
          <span style={{ color: es ? es.tone.pillText : '#FFFFFF', fontSize: pillFont, fontWeight: 900, letterSpacing: 1 }}>{dateStr || '28/07/2026'}</span>
          <span style={{ color: es ? es.tone.pillText : 'rgba(255,255,255,0.35)', opacity: es ? 0.35 : 1, fontWeight: 700, fontSize: pillFont }}>|</span>
          <LiveClock style={{ color: es ? es.tone.pillText : '#FFFFFF', fontSize: pillFont, fontWeight: 900, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }} />
        </div>
        )}

        {/* Sound button — Circular Blue Speaker (Loteria'i: sem o botão; o som segue ligado) */}
        {soundEnabled && !isLt && (
        <div
          onClick={onToggleSound}
          style={{
            width: soundSize,
            height: soundSize,
            borderRadius: soundSize / 2,
            backgroundColor: warm ? (soundOn ? '#A3161C' : 'rgba(21, 16, 8, 0.92)') : soundOn ? '#087FFC' : 'rgba(3, 17, 48, 0.88)',
            borderColor: warm ? '#E9A91A' : soundOn ? '#17C8FF' : 'rgba(25, 117, 210, 0.5)',
            borderWidth: 1.5,
            borderStyle: 'solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxSizing: 'border-box',
            boxShadow: soundOn ? (warm ? '0 0 12px rgba(255, 179, 0, 0.5)' : '0 0 14px rgba(23, 200, 255, 0.6)') : 'none',
            transition: 'all 200ms ease',
          }}
        >
          <BingoShowIcon
            name={soundOn ? 'sound' : 'speaker-off'}
            size={soundSize / 2}
            color="#FFFFFF"
            transparentBg
          />
        </div>
        )}
      </div>
    </div>
  );
});

const ClassicDrawScreen: React.FC = () => {
  const mock = useBingoShowRealtimeDraw();
  const { isBlue, themeId } = useAppTheme();
  // Família es-PY (Paraguay, Loteria'i): o resto do visual do cabeçalho fica no DrawHeader.
  const es = getEsSkin(themeId);
  const isParaguay = es !== null;
  const [soundOn, setSoundOn] = useState(true);
  const toggleSound = React.useCallback(() => setSoundOn((prev) => !prev), []);
  // Voz do PIN (theme.sound) ou, sem ela, pelo idioma da TV (es → /audio/es; pt → pt-br).
  // theme.enableSound: false (painel) → sem som e sem botão de som.
  const { voice, soundEnabled } = useTvConfig();
  const t = useT();

  // Hook responsável pela locução (voz) do bingo (Bolas e Prêmios)
  // Fila única de áudio; silêncio enquanto o estado é restaurado (reload/reconexão).
  // A voz do prêmio sai quando o popup da faixa abre (não quando o evento chega).
  const [shownPrize, setShownPrize] = useState<ShownPrize | null>(null);
  const handlePrizeShown = React.useCallback((type: PrizeType) => setShownPrize((prev) => ({ type, seq: (prev?.seq ?? 0) + 1 })), []);
  // A voz sai quando a bola pousa no palco: impacto aos 1000ms nos temas com voo
  // (DrawStageBlue/Paraguay/Loteriai) e aos 600ms nos demais; sem animação, quase na hora.
  const reducedMotion = usePrefersReducedMotion();
  const voiceDelayMs = reducedMotion ? 150 : isBlue || isParaguay ? 1000 : 600;
  useBingoAudio(soundEnabled && soundOn, mock.currentBall, shownPrize, mock.isLive, mock.drawNumber, voice, voiceDelayMs);
  const last3Balls = React.useMemo(() => {
    if (!mock.drawnBalls || mock.drawnBalls.length === 0) return [];
    const withoutCurrent = mock.currentBall && mock.drawnBalls[mock.drawnBalls.length - 1] === mock.currentBall
      ? mock.drawnBalls.slice(0, -1)
      : mock.drawnBalls;
    return withoutCurrent.slice(-3).reverse();
  }, [mock.drawnBalls, mock.currentBall]);

  const hasTickets = mock.tickets.length > 0;
  // Diagnóstico (medidor da TV): estado dos prêmios que esta tela está mostrando.
  if (typeof window !== 'undefined') {
    (window as unknown as { __tvPrize?: unknown }).__tvPrize = {
      draw: mock.drawNumber,
      balls: mock.drawnBalls.length,
      l1: mock.line1Status,
      l2: mock.line2Status,
      bingo: mock.bingoStatus,
      winners: mock.winners.map((w) => w.type),
      live: mock.isLive,
      finished: mock.isDrawFinished,
    };
  }
  const isLt = es?.id === 'loteriai';

  const screenBody = (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <DrawHeader
        accumulatedPrize={mock.accumulatedPrize}
        triggerBallLimit={mock.triggerBallLimit}
        jackpotActive={mock.jackpotActive}
        drawNumber={mock.drawNumber}
        donationAmount={mock.donationAmount}
        dateStr={mock.dateStr}
        timeStr={mock.timeStr}
        soundEnabled={soundEnabled}
        soundOn={soundOn}
        onToggleSound={toggleSound}
      />

      {/* BODY ROW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', width: '100%', minHeight: 0, gap: BingoShowSpacing.sm }}>
        {/* LEFT CENTER COLUMN */}
        <div style={{ flex: 68, minHeight: 0, display: 'flex', flexDirection: 'column', gap: BingoShowSpacing.sm }}>
          {/* TOP ROW */}
          <div style={{ flex: 60, display: 'flex', flexDirection: 'row', width: '100%', gap: BingoShowSpacing.sm }}>
            <div style={{ flex: isLt ? 31 : 38, minHeight: 0 }}>
              <Profiler id="premios" onRender={onRenderTrace}>
              <BingoShowPrizeStatusCard
                accumulatedAmount={mock.accumulatedPrize}
                triggerBallLimit={mock.triggerBallLimit}
                jackpotActive={mock.jackpotActive}
                line1Amount={mock.line1Prize}
                line2Amount={mock.line2Prize}
                bingoAmount={mock.bingoPrize}
                line1Status={toPrizeRowStatus(mock.line1Status)}
                line2Status={toPrizeRowStatus(mock.line2Status)}
                bingoStatus={toPrizeRowStatus(mock.bingoStatus)}
                drawNumber={mock.drawNumber}
                donationAmount={mock.donationAmount}
                dateStr={mock.dateStr}
                timeStr={mock.timeStr}
              />
              </Profiler>
            </div>
            <div style={{ flex: isLt ? 69 : 62, minHeight: 0, display: 'flex' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Profiler id="palco" onRender={onRenderTrace}>
                <DrawStage
                  title={t('draw.drawnNumber')}
                  currentNumber={mock.currentBall}
                  nextBalls={last3Balls}
                  sequenceNumber={mock.drawnBalls.length}
                />
                </Profiler>
              </div>
            </div>
          </div>

          {/* HISTORY ROW */}
          <div style={{ flex: 40, width: '100%', minHeight: 0 }}>
            <Profiler id="historico" onRender={onRenderTrace}>
            <BingoShowDrawnBalls drawnBalls={mock.drawnBalls} totalBalls={mock.totalBalls} testJackpotPanelBackground />
            </Profiler>
          </div>
        </div>

        {/* RIGHT COLUMN — Cupons (Top Winners) + Cartelas. Sem cartelas do usuário, o
            card de Cupons se expande até o rodapé (pedido explícito do usuário). */}
        <div style={{ flex: 32, minHeight: 0, display: 'flex', flexDirection: 'column', gap: BingoShowSpacing.xs }}>
          <div style={{ flex: hasTickets ? 55 : 1, minHeight: 0 }}>
            <Profiler id="cupons" onRender={onRenderTrace}>
            <BingoShowCouponsTable coupons={mock.coupons} compact={hasTickets} />
            </Profiler>
          </div>
          {hasTickets ? (
            <div style={{ flex: 45, minHeight: 0 }}>
              <Profiler id="cartelas" onRender={onRenderTrace}>
              <BingoShowTicketsGrid tickets={mock.tickets} drawnBalls={mock.drawnBalls} latestBall={mock.currentBall} />
              </Profiler>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <Profiler id="tela" onRender={onRenderTrace}>
    <BingoShowAmbientBackground brightness="light">
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 6, boxSizing: 'border-box' }}>
        <BingoShowTvLayout
          mainFlex={1}
          fullBody={screenBody}
          overlay={
            <Profiler id="popup" onRender={onRenderTrace}>
            <BingoShowWinnerPopup
              winners={mock.winners}
              onPrizeShown={handlePrizeShown}
              isDrawFinished={mock.isDrawFinished}
              drawNumber={mock.drawNumber}
              dateStr={mock.dateStr}
              timeStr={mock.timeStr}
              line1Prize={mock.line1Prize}
              line2Prize={mock.line2Prize}
              bingoPrize={mock.bingoPrize}
              jackpotAmount={mock.accumulatedPrize}
              drawnNumbers={mock.drawnBalls}
              isLive={mock.isLive}
            />
            </Profiler>
          }
        />
      </div>
    </BingoShowAmbientBackground>
    </Profiler>
  );
};

/** Bingo Show Azul tem tela de sorteio própria (components/azul/); os demais
 * temas seguem com a tela clássica acima. */
export const BingoShowDrawScreen: React.FC = () => {
  const { isAzul } = useAppTheme();
  return isAzul ? <AzulDrawScreen /> : <ClassicDrawScreen />;
};

export default BingoShowDrawScreen;

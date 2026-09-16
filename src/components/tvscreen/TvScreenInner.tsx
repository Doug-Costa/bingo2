/**
 * TvScreenInner.tsx — porte de `tvapp1/src/screens/TvScreen.tsx`.
 *
 * Contém: `fmtCurrency`/`fmtTime`, `TriggerBallStar`, `JackpotTag`,
 * `LobbyView`, `InGameView`, `LoadingView`, `TvHeader` e o componente
 * principal (`TvScreenInner`, equivalente ao `TvScreenInner` do RN — a
 * máquina de estados `drawUiState` + montagem final). Deve ser renderizado
 * DENTRO de um `GameSocketProvider` (consome `useGameSocket()`), que é
 * responsabilidade de `TvScreenApp.tsx`.
 *
 * Decisões de escopo aplicadas de forma consistente com o resto do porte:
 * - `useWindowDimensions()` → constantes fixas do palco (`TV_STAGE_WIDTH`/
 *   `TV_STAGE_HEIGHT`, sempre 1920×1080 → `isLandscape` sempre `true`).
 *   Os ramos "portrait" do RN (`LobbyView`/`InGameView`) nunca executavam
 *   nesse contexto e foram removidos — só o ramo landscape permanece.
 * - Áudio (`services/audioService`) NÃO migrado ainda (pedido explícito do
 *   usuário) — os controles de som/idioma do header continuam visíveis
 *   (fidelidade visual) mas são só estado local sem efeito sonoro real.
 * - Controle remoto (grafo de foco D-pad) NÃO migrado ainda — `TvFocusable`
 *   já trata isso como no-op (ver `components/theme/TvFocusable.tsx`).
 * - `logger.log('DRAW', 'info', ...)` (dev logger não portado) → `console.log`
 *   direto, mesma decisão já usada em `SSEContext.tsx`.
 * - `SafeAreaView` (RN, insets de notch de dispositivo) → `TvSafeArea`
 *   (margem de overscan de TV, já estabelecida na Fase 1) — mesmo papel
 *   estrutural (delimitar onde o CONTEÚDO pode ficar), implementação web
 *   apropriada para TV em vez de celular.
 * - `StatusBar` (RN, barra de status do SO) — sem equivalente/necessidade
 *   na web, removido.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TvSafeArea } from '@/components/tv/TvSafeArea';
import { clearCredentials, type ThemeConfig } from '@/storage/credentials';
import { alphaColor, getThemeKey, resolveTheme, type ThemeTokens } from '@/theme/themes';
import { useGameSocket, type DrawSSE, type JackpotInfo, type MyTicket, type TopWinnerRealtime, type WinnerEvent } from '@/contexts/SSEContext';
import { ThemeBackground, ThemeBadge, ThemeCard, ThemeDivider, ThemeLogo, ThemePanel, ThemeText, TvFocusable } from '../theme';
import Icon from '../Icon';
import AnimatedActiveBall from './AnimatedActiveBall';
import NumberGrid from './NumberGrid';
import DigitalNumber from './DigitalNumber';
import TopPlayers from './TopPlayers';
import WinnerModal from './WinnerModal';
import MyTicketsPanel from './MyTicketsPanel';
import PostDrawCycle from './PostDrawCycle';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(val: number | undefined | null): string {
  return `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type DisplayDraw = Partial<DrawSSE> & {
  incrementalId: string | number;
  prizeLine1: number;
  prizeLine2: number;
  prizeLine3: number;
  ticketPrice: number;
};

// ─── TriggerBallStar — estrelinha vermelha pulsante ─────────────────────────
function TriggerBallStar({ limit }: { limit: number; theme: ThemeTokens }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'bs-trigger-star-pulse 2500ms ease-in-out infinite',
      }}
    >
      <div
        style={{
          borderRadius: 12,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 6,
          paddingBottom: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          minWidth: 44,
          backgroundImage: 'linear-gradient(to right, #ff3333, #cc0000)',
        }}
      >
        <Icon name="star" size={12} color="#ffffff" />
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{limit}</span>
      </div>
    </div>
  );
}

function JackpotTag({ amount, theme }: { amount: number; theme: ThemeTokens }) {
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';
  const goldGradient = theme.gradients?.gold ?? [`${theme.primary}22`, `${theme.primary}44`, `${theme.primary}22`];

  return (
    <ThemePanel theme={theme} variant={isBingoShow ? 'gold' : 'glass'} useImageBg={false} style={{ borderRadius: 18, borderWidth: 2, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 8,
          paddingBottom: 8,
          gap: 8,
          backgroundImage: `linear-gradient(to right, ${goldGradient.join(', ')})`,
        }}
      >
        <Icon name="jackpot" size={24} color={isBingoShow ? '#000000' : theme.primary} />
        <div style={{ marginLeft: 4 }}>
          <ThemeText theme={theme} variant="labelSmall" color={isBingoShow ? 'textOnGold' : 'primary'} textStyle={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
            COFRE ACUMULADO
          </ThemeText>
          <ThemeText theme={theme} variant="titleLarge" color={isBingoShow ? 'textOnGold' : 'textPrimary'} textStyle={{ fontWeight: 900 }}>
            {fmtCurrency(amount)}
          </ThemeText>
        </div>
      </div>
    </ThemePanel>
  );
}

// ─── Lobby — Countdown + prizes + próximas rodadas ─────────────────────────────
function LobbyView({
  theme,
  nextDraw,
  countdown,
  upcomingDraws,
  jackpotAmount,
  jackpotInfo,
  triggerBallLimit,
}: {
  theme: ThemeTokens;
  nextDraw: DrawSSE | null;
  countdown: number;
  upcomingDraws: DrawSSE[];
  jackpotAmount: number | null;
  jackpotInfo: JackpotInfo | null;
  triggerBallLimit: number | null;
}) {
  const mins = Math.floor(countdown / 60).toString().padStart(2, '0');
  const secs = (countdown % 60).toString().padStart(2, '0');
  const d = (nextDraw ?? {}) as Partial<DrawSSE>;

  const effectiveJackpot = jackpotAmount ?? jackpotInfo?.totalAmount ?? null;
  const showJackpot = jackpotInfo?.activeToday === true && (effectiveJackpot ?? 0) > 0;
  const effectiveTrigger = triggerBallLimit ?? jackpotInfo?.triggerBallLimit ?? null;
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  const countdownContent = (
    <>
      {/* Header do Painel Aberto */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <ThemeText theme={theme} variant="labelSmall" color="textSecondary" textStyle={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
            Painel Aberto
          </ThemeText>
          <ThemeText theme={theme} variant="titleLarge" color="textPrimary" textStyle={{ fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>
            Aguarde o Sorteio
          </ThemeText>
        </div>
        <ThemeBadge theme={theme} variant={isBingoShow ? 'gold' : 'default'} title="SORTEIO AO VIVO" />
      </div>

      {/* Jackpot se houver */}
      {showJackpot && effectiveJackpot !== null && <JackpotTag amount={effectiveJackpot} theme={theme} />}

      {/* Rótulo Começa Em */}
      <ThemeText theme={theme} variant="labelSmall" color="textSecondary" textStyle={{ letterSpacing: 3, marginTop: 8, fontWeight: 900, textTransform: 'uppercase' }}>
        O SORTEIO COMEÇA EM
      </ThemeText>

      {/* Relógio digital */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <DigitalNumber value={mins[0] ?? '0'} theme={theme} size={64} />
        <DigitalNumber value={mins[1] ?? '0'} theme={theme} size={64} />
        <ThemeText theme={theme} variant="displayMedium" color="primary" textStyle={{ fontSize: 48, opacity: 0.8, marginLeft: 2, marginRight: 2 }}>
          :
        </ThemeText>
        <DigitalNumber value={secs[0] ?? '0'} theme={theme} size={64} />
        <DigitalNumber value={secs[1] ?? '0'} theme={theme} size={64} />
      </div>

      {/* Trigger ball */}
      {effectiveTrigger !== null && effectiveTrigger > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TriggerBallStar limit={effectiveTrigger} theme={theme} />
          <ThemeText theme={theme} variant="bodySmall" color="textMuted">{`COFRE ≤ ${effectiveTrigger}`}</ThemeText>
        </div>
      )}

      {/* Info: Rodada Nº, Valor Cartela, Abertura */}
      <ThemePanel theme={theme} variant="glass" useImageBg={false} style={{ width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', borderColor: theme.borderSecondary, marginTop: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12 }}>
            <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Rodada Nº
            </ThemeText>
            <ThemeText theme={theme} variant="titleLarge" color="primary" textStyle={{ fontWeight: 900 }}>
              #{d.incrementalId || '---'}
            </ThemeText>
          </div>
          <ThemeDivider theme={theme} orientation="vertical" thickness={1} size="auto" margin={0} style={{ backgroundColor: theme.borderSecondary }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12 }}>
            <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Valor Cartela
            </ThemeText>
            <ThemeText theme={theme} variant="titleLarge" color="success" textStyle={{ fontWeight: 900 }}>
              {fmtCurrency(d.ticketPrice)}
            </ThemeText>
          </div>
          <ThemeDivider theme={theme} orientation="vertical" thickness={1} size="auto" margin={0} style={{ backgroundColor: theme.borderSecondary }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12 }}>
            <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Horário
            </ThemeText>
            <ThemeText theme={theme} variant="titleLarge" color="textPrimary" textStyle={{ fontWeight: 900 }}>
              {fmtTime(d.scheduledAt)}
            </ThemeText>
          </div>
        </div>
      </ThemePanel>

      {/* Prizes */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, width: '100%', marginTop: 12 }}>
        {[
          { label: '1ª LINHA', value: d.prizeLine1, emoji: '🥇' },
          { label: '2ª LINHA', value: d.prizeLine2, emoji: '🥈' },
          { label: 'BINGO', value: d.prizeLine3, emoji: '👑' },
        ].map((p, idx) => (
          <ThemePanel key={idx} theme={theme} variant="glass" useImageBg={false} style={{ flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderColor: theme.borderSecondary }}>
            <ThemeText theme={theme} variant="titleMedium" textStyle={{ fontSize: 20 }}>
              {p.emoji}
            </ThemeText>
            <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
              {p.label}
            </ThemeText>
            <ThemeText theme={theme} variant="titleMedium" color="primary" textStyle={{ fontWeight: 900 }}>
              {fmtCurrency(p.value)}
            </ThemeText>
          </ThemePanel>
        ))}
      </div>
    </>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: 10, gap: 10 }}>
      <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ flex: 1, borderRadius: 22, borderWidth: 1.5, overflow: 'hidden' }}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, overflowY: 'auto', height: '100%' }}>{countdownContent}</div>
      </ThemePanel>

      <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ width: 300, borderRadius: 20, borderWidth: 1, padding: 14, display: 'flex', flexDirection: 'column' }}>
        <ThemeText theme={theme} variant="labelLarge" color="textPrimary" textStyle={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          🕐 PRÓXIMAS RODADAS
        </ThemeText>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {upcomingDraws.length > 0 ? (
            upcomingDraws.map((d2) => {
              const isHot = d2.hotdraw === true;
              return (
                <ThemeCard
                  theme={theme}
                  key={d2.id}
                  variant={isHot ? 'promo' : 'default'}
                  useImageBg={isBingoShow}
                  style={{ borderRadius: 12, borderWidth: 1, marginBottom: 7, paddingTop: 7, paddingBottom: 7, paddingLeft: 9, paddingRight: 9, borderColor: isHot ? '#ff6b00' : theme.borderMuted }}
                >
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {isHot && <ThemeBadge theme={theme} variant="error" size="small" title="🔥 HOT" />}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 }}>
                      <ThemeText theme={theme} variant="labelMedium" color="primary" textStyle={{ fontSize: 11, fontWeight: 900, fontFamily: 'monospace' }}>
                        #{d2.incrementalId}
                      </ThemeText>
                      <ThemeText theme={theme} variant="labelMedium" color="textSecondary" textStyle={{ fontSize: 14, fontWeight: 900 }}>
                        {fmtTime(d2.scheduledAt)}
                      </ThemeText>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {d2.prizeLine1 !== undefined && (
                      <ThemeText theme={theme} variant="labelSmall" color="success" textStyle={{ fontSize: 10, fontWeight: 900 }}>
                        🥇 {fmtCurrency(d2.prizeLine1)}
                      </ThemeText>
                    )}
                    {d2.prizeLine2 !== undefined && (
                      <ThemeText theme={theme} variant="labelSmall" color="textSecondary" textStyle={{ fontSize: 10, fontWeight: 900 }}>
                        🥈 {fmtCurrency(d2.prizeLine2)}
                      </ThemeText>
                    )}
                    {d2.prizeLine3 !== undefined && (
                      <ThemeText theme={theme} variant="labelSmall" color="primary" textStyle={{ fontSize: 10, fontWeight: 900 }}>
                        👑 {fmtCurrency(d2.prizeLine3)}
                      </ThemeText>
                    )}
                  </div>
                </ThemeCard>
              );
            })
          ) : (
            <ThemeText theme={theme} variant="bodyMedium" color="textMuted" textStyle={{ textAlign: 'center', fontSize: 11, fontWeight: 700, marginTop: 16 }}>
              Nenhum sorteio agendado
            </ThemeText>
          )}
        </div>
      </ThemePanel>
    </div>
  );
}

// ─── Em jogo ────────────────────────────────────────────────────────────────
function InGameView({
  theme,
  themeName,
  drawnNumbers,
  currentBall,
  topPlayers,
  jackpotAmount,
  triggerBallLimit,
  displayDraw,
  topStage,
  winners,
  myTickets,
}: {
  theme: ThemeTokens;
  themeName: string;
  drawnNumbers: number[];
  currentBall: number | null;
  topPlayers: TopWinnerRealtime[];
  jackpotAmount: number | null;
  triggerBallLimit: number | null;
  displayDraw: DisplayDraw;
  topStage: string;
  winners: WinnerEvent[];
  myTickets: MyTicket[];
}) {
  const sequenceCount = drawnNumbers.length;
  const isJackpotActive = triggerBallLimit === null || triggerBallLimit === undefined || triggerBallLimit === 0 ? true : sequenceCount <= triggerBallLimit;

  const prizes = [
    { id: 'line1', label: '1ª LINHA', value: Number(displayDraw.prizeLine1 || 0), emoji: '🥇' },
    { id: 'line2', label: '2ª LINHA', value: Number(displayDraw.prizeLine2 || 0), emoji: '🥈' },
    { id: 'bingo', label: 'BINGO', value: Number(displayDraw.prizeLine3 || 0), emoji: '👑' },
  ];

  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: 8, gap: 8 }}>
      {/* ── COLUNA PRINCIPAL / ESQUERDA: 3 SEÇÕES VERTICAIS ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 1️⃣ PARTE 1: EXIBIÇÃO DAS BOLAS DE SORTEIO */}
        <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ borderRadius: 18, borderWidth: 1.5, overflow: 'hidden', minHeight: 175 }}>
          <AnimatedActiveBall currentBall={currentBall} drawnNumbers={drawnNumbers} theme={theme} themeName={themeName} triggerBallLimit={triggerBallLimit} />
        </ThemePanel>

        {/* 2️⃣ PARTE 2: PREMIAÇÃO AO LADO DO JACKPOT */}
        <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 8, gap: 8 }}>
          {/* Prêmios 1, 2, 3 */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'row', gap: 6 }}>
            {prizes.map((p, pIdx) => {
              const isWon = winners.some((w) => w.type === p.id);
              const isActive = topStage === p.id && !isWon;
              const bsAccent = pIdx === 0 ? theme.primary : pIdx === 1 ? theme.secondary : theme.success;
              return (
                <ThemePanel
                  key={p.id}
                  theme={theme}
                  variant={isActive ? 'gold' : 'glass'}
                  useImageBg={false}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 12,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 8,
                    paddingBottom: 8,
                    gap: 6,
                    borderColor: isActive ? bsAccent : isWon ? theme.success : alphaColor(theme.borderSecondary, '55'),
                    borderWidth: isActive ? 2 : 1,
                    backgroundColor: isActive ? alphaColor(bsAccent, '15') : isWon ? alphaColor(theme.success, '10') : 'rgba(4,8,38,0.5)',
                    boxShadow: isActive ? `0px 0px 10px color-mix(in srgb, ${bsAccent} 40%, transparent)` : undefined,
                  }}
                >
                  <ThemeText theme={theme} variant="titleMedium" textStyle={{ fontSize: 18 }}>
                    {isWon ? '✅' : p.emoji}
                  </ThemeText>
                  <div style={{ flex: 1, marginLeft: 4 }}>
                    <ThemeText theme={theme} variant="labelSmall" color={isActive ? 'primary' : isWon ? 'success' : 'textSecondary'} textStyle={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      {p.label}
                      {isWon ? ' ✓' : ''}
                    </ThemeText>
                    <ThemeText theme={theme} variant="labelLarge" color={isActive ? 'primary' : isWon ? 'success' : 'textPrimary'} textStyle={{ fontWeight: 900 }}>
                      {fmtCurrency(p.value)}
                    </ThemeText>
                  </div>
                </ThemePanel>
              );
            })}
          </div>

          {/* Ao Lado: Jackpot */}
          <ThemePanel
            theme={theme}
            variant={isJackpotActive ? 'gold' : 'glass'}
            useImageBg={false}
            style={{
              flex: 1.2,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 8,
              paddingBottom: 8,
              gap: 8,
              borderColor: isJackpotActive ? theme.primary : alphaColor(theme.borderSecondary, '33'),
              borderWidth: isJackpotActive ? 2 : 1,
              backgroundColor: isJackpotActive ? alphaColor(theme.primary, '12') : 'rgba(4,8,38,0.5)',
              opacity: isJackpotActive ? 1 : 0.35,
              boxShadow: isJackpotActive ? `0px 0px 12px color-mix(in srgb, ${theme.primary} 50%, transparent)` : undefined,
            }}
          >
            <Icon name="jackpot" size={24} color={isJackpotActive ? theme.primary : theme.textMuted} />
            <div style={{ flex: 1, marginLeft: 4 }}>
              <ThemeText theme={theme} variant="labelSmall" color={isJackpotActive ? 'primary' : 'textMuted'} textStyle={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                {isJackpotActive ? 'COFRE ACUMULADO' : `COFRE EXPIRADO (> ${triggerBallLimit})`}
              </ThemeText>
              <ThemeText theme={theme} variant="titleMedium" color={isJackpotActive ? 'primary' : 'textMuted'} textStyle={{ fontWeight: 900, textDecoration: isJackpotActive ? 'none' : 'line-through' }}>
                {isJackpotActive ? fmtCurrency(jackpotAmount) : 'INATIVO'}
              </ThemeText>
            </div>
            {triggerBallLimit !== null && triggerBallLimit > 0 && isJackpotActive && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TriggerBallStar limit={triggerBallLimit} theme={theme} />
              </div>
            )}
          </ThemePanel>
        </ThemePanel>

        {/* 3️⃣ PARTE 3: CONTAGEM DAS 90 PEDRAS */}
        <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ flex: 1, borderRadius: 18, borderWidth: 1, padding: 4, display: 'flex', justifyContent: 'center' }}>
          <NumberGrid drawnNumbers={drawnNumbers} currentBall={currentBall} theme={theme} />
        </ThemePanel>
      </div>

      {/* ── COLUNA VERTICAL DA DIREITA: TOP WINNER + TOP MY CARD ── */}
      <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Top Winner */}
        <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ flex: 1.3, borderRadius: 18, borderWidth: 1, padding: 10, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Icon name="trophy" size={14} color={theme.primary} />
            <ThemeText theme={theme} variant="labelMedium" color="textPrimary" textStyle={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, flex: 1, marginLeft: 6 }}>
              TOP WINNER
            </ThemeText>
            <div style={{ paddingLeft: 7, paddingRight: 7, paddingTop: 2, paddingBottom: 2, borderRadius: 8, border: `1px solid ${alphaColor(theme.success, '66')}`, backgroundColor: alphaColor(theme.success, '22') }}>
              <ThemeText theme={theme} variant="labelSmall" color="success" textStyle={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                AO VIVO
              </ThemeText>
            </div>
          </div>
          <TopPlayers players={topPlayers} theme={theme} />
        </ThemePanel>

        {/* Top My Card */}
        <ThemePanel theme={theme} variant="glass" useImageBg={isBingoShow} style={{ flex: 1, borderRadius: 18, borderWidth: 1, padding: 4 }}>
          <MyTicketsPanel tickets={myTickets} drawnNumbers={drawnNumbers} currentBall={currentBall} topPlayers={topPlayers} theme={theme} layout="vertical" />
        </ThemePanel>
      </div>
    </div>
  );
}

// ─── Loading ───────────────────────────────────────────────────────────────────
function LoadingView({ theme }: { theme: ThemeTokens }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `4px solid ${alphaColor(theme.primary, '33')}`,
          borderTopColor: theme.primary,
          animation: 'bs-spin 800ms linear infinite',
        }}
      />
      <ThemeText theme={theme} variant="bodyLarge" color="textSecondary" align="center" uppercase textStyle={{ letterSpacing: 2 }}>
        Conectando ao Sorteio...
      </ThemeText>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function TvHeader({
  theme,
  t,
  connected,
  displayDraw,
  onLogout,
  soundOn,
  onToggleSound,
  lang,
  onSelectLang,
}: {
  theme: ThemeTokens;
  t: ThemeConfig;
  connected: boolean;
  displayDraw: DisplayDraw;
  jackpotAmount: number | null;
  triggerBallLimit: number | null;
  drawnNumbers: number[];
  isInProgress: boolean;
  onLogout: () => void;
  soundOn?: boolean;
  onToggleSound?: () => void;
  lang?: 'pt' | 'es' | 'en';
  onSelectLang?: (_l: 'pt' | 'es' | 'en') => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  return (
    <ThemePanel
      theme={theme}
      variant="header"
      padding={8}
      borderRadius={0}
      useImageBg={isBingoShow}
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderBottom: `1px solid ${theme.borderSecondary}`, marginBottom: 4 }}
    >
      {/* Esquerda: Logo + Status Conexao */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ThemeLogo theme={theme} size="small" />
        <div style={{ marginLeft: 6 }}>
          <ThemeText theme={theme} variant="titleMedium" color="primary" textStyle={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.text || 'BINGO SHOW'}
          </ThemeText>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: connected ? theme.success : '#f59e0b',
                opacity: connected ? 1 : undefined,
                animation: connected ? undefined : 'bs-conn-dot-pulse 1200ms ease-in-out infinite',
              }}
            />
            <ThemeText theme={theme} variant="labelSmall" color={connected ? 'success' : 'warning'} textStyle={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {connected ? '● AO VIVO' : '○ CONECTANDO...'}
            </ThemeText>
          </div>
        </div>
      </div>

      {/* Centro: Numero do Sorteio, Data e Hora */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 10, border: `1px solid ${theme.borderSecondary}`, gap: 6, backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Icon name="dice" size={15} color={theme.primary} />
          <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontWeight: 900, letterSpacing: 1 }}>
            SORTEIO:
          </ThemeText>
          <ThemeText theme={theme} variant="labelLarge" color="primary" textStyle={{ fontWeight: 900, fontFamily: 'monospace' }}>
            #{displayDraw?.incrementalId || '---'}
          </ThemeText>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 10, border: `1px solid ${theme.borderSecondary}`, gap: 6, backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Icon name="calendar" size={14} color={theme.textSecondary} />
          <ThemeText theme={theme} variant="labelLarge" color="textPrimary" textStyle={{ fontWeight: 900 }}>
            {dateStr}
          </ThemeText>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 10, border: `1px solid ${theme.borderSecondary}`, gap: 6, backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Icon name="clock" size={14} color={theme.textSecondary} />
          <ThemeText theme={theme} variant="labelLarge" color="textPrimary" textStyle={{ fontWeight: 900 }}>
            {timeStr}
          </ThemeText>
        </div>
      </div>

      {/* Direita: Som, Idioma, Logout */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {onToggleSound && (
          <TvFocusable theme={theme} onPress={onToggleSound} style={{ paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 10, border: `1px solid ${soundOn ? theme.success : theme.borderMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={soundOn ? 'volume-on' : 'volume-off'} size={16} color={soundOn ? theme.success : theme.textMuted} />
          </TvFocusable>
        )}

        {onSelectLang && (
          <div style={{ display: 'flex', flexDirection: 'row', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 2, gap: 2 }}>
            {(['pt', 'es', 'en'] as const).map((l) => (
              <TvFocusable key={l} theme={theme} onPress={() => onSelectLang(l)} style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 8, backgroundColor: lang === l ? theme.primary : 'transparent' }}>
                <ThemeText theme={theme} variant="labelSmall" color={lang === l ? 'textOnGold' : 'textMuted'} textStyle={{ fontWeight: 900 }}>
                  {l.toUpperCase()}
                </ThemeText>
              </TvFocusable>
            ))}
          </div>
        )}

        <TvFocusable theme={theme} style={{ padding: 8, borderRadius: 10, border: `1px solid ${theme.borderSecondary}` }} onPress={onLogout}>
          <Icon name="logout" size={16} color={theme.textMuted} />
        </TvFocusable>
      </div>
    </ThemePanel>
  );
}

// ─── Componente principal (consome o contexto SSE) ─────────────────────────────
export interface TvScreenInnerProps {
  themeConfig: ThemeConfig;
  onLogout: () => void;
}

export function TvScreenInner({ themeConfig, onLogout }: TvScreenInnerProps) {
  const {
    connected,
    drawnNumbers,
    currentBall,
    jackpotAmount,
    triggerBallLimit,
    lastDrawEvent,
    topPlayers,
    topStage,
    winners,
    drawActive,
    nextDraws,
    jackpotInfo,
    myTickets,
    hadDrawInSession,
  } = useGameSocket();

  const themeKey = useMemo(() => getThemeKey(themeConfig), [themeConfig]);
  const theme = useMemo(() => resolveTheme(themeKey), [themeKey]);
  const themeName = themeKey;

  // Ordenar TopWinners: minNumbersLeft ASC → targetPrize priority → playerName
  const PRIZE_ORDER: Record<string, number> = { line1: 0, line2: 1, line3: 2, bingo: 3 };
  const enrichedTopPlayers = useMemo(() => {
    return [...topPlayers].sort((a, b) => {
      if (a.minNumbersLeft !== b.minNumbersLeft) return a.minNumbersLeft - b.minNumbersLeft;
      const pa = PRIZE_ORDER[a.targetPrize] ?? 99;
      const pb = PRIZE_ORDER[b.targetPrize] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.playerName ?? '').localeCompare(b.playerName ?? '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- porte 1:1 do RN: `PRIZE_ORDER` é constante local recriada a cada render, incluí-la como dependência geraria reordenação a cada render sem ganho real.
  }, [topPlayers]);

  const [postDrawCycle, setPostDrawCycle] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [nextDrawObj, setNextDrawObj] = useState<DrawSSE | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      let bestDraw = nextDraws[0] || null;
      for (const d of nextDraws) {
        const sched = d.scheduledAt || (d as any).scheduled_at;
        if (sched) {
          const dateStr = typeof sched === 'string' ? sched.replace(' ', 'T') : sched;
          const timeMs = new Date(dateStr).getTime();
          if (!Number.isNaN(timeMs) && timeMs > now - 5000) {
            bestDraw = d;
            break;
          }
        }
      }
      setNextDrawObj(bestDraw);

      const sched = bestDraw?.scheduledAt || (bestDraw as any)?.scheduled_at;
      if (!sched) {
        setCountdown(0);
        return;
      }
      const dateStr = typeof sched === 'string' ? sched.replace(' ', 'T') : sched;
      const targetMs = new Date(dateStr).getTime();
      if (Number.isNaN(targetMs)) {
        setCountdown(0);
        return;
      }
      const diff = Math.floor((targetMs - now) / 1000);
      setCountdown(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(t);
  }, [nextDraws]);

  const nextDraw = nextDrawObj || nextDraws[0] || null;
  const upcomingDraws = nextDraws.filter((d) => d.id !== nextDraw?.id);

  type DrawUiState = 'LOBBY' | 'DRAW_ACTIVE' | 'WINNER_ANNOUNCEMENT' | 'POST_DRAW' | 'RETURNING_TO_LOBBY';

  const [drawUiState, setDrawUiState] = useState<DrawUiState>('LOBBY');
  const drawUiStateRef = useRef<DrawUiState>('LOBBY');
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transitionTo = useCallback((nextState: DrawUiState, reason: string) => {
    console.log(`[DRAW] State transition: ${drawUiStateRef.current} -> ${nextState} (reason: ${reason})`);
    drawUiStateRef.current = nextState;
    setDrawUiState(nextState);

    if (nextState === 'RETURNING_TO_LOBBY') {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        setPostDrawCycle(false);
        drawUiStateRef.current = 'LOBBY';
        setDrawUiState('LOBBY');
        console.log('[DRAW] State transition complete: LOBBY');
      }, 1500);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (drawActive && drawUiState !== 'DRAW_ACTIVE') {
      transitionTo('DRAW_ACTIVE', 'drawActive signal from SSE');
      setPostDrawCycle(false);
    }
  }, [drawActive, drawUiState, transitionTo]);

  useEffect(() => {
    const isFinishedEvent = (lastDrawEvent as string) === 'draw_finished' || (lastDrawEvent as string) === 'final_winners' || (lastDrawEvent as string) === 'draw_end';

    if ((isFinishedEvent || (!drawActive && hadDrawInSession)) && drawUiState === 'DRAW_ACTIVE') {
      transitionTo('POST_DRAW', 'Draw finished event');
      setPostDrawCycle(true);

      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        transitionTo('RETURNING_TO_LOBBY', 'Post draw watchdog timeout (30s)');
      }, 30000);
    }
  }, [lastDrawEvent, drawActive, hadDrawInSession, drawUiState, transitionTo]);

  useEffect(() => {
    if (drawUiState === 'POST_DRAW' && countdown > 0 && countdown <= 30) {
      transitionTo('RETURNING_TO_LOBBY', 'Next draw countdown <= 30s');
    }
  }, [drawUiState, countdown, transitionTo]);

  const displayDraw = useMemo<DisplayDraw>(
    () =>
      nextDraw
        ? {
            ...nextDraw,
            prizeLine1: nextDraw.prizeLine1 || 0,
            prizeLine2: nextDraw.prizeLine2 || 0,
            prizeLine3: nextDraw.prizeLine3 || 0,
            ticketPrice: nextDraw.ticketPrice || 0,
            incrementalId: nextDraw.incrementalId || '---',
          }
        : {
            id: '---',
            incrementalId: '---',
            scheduledAt: null,
            prizeLine1: 0,
            prizeLine2: 0,
            prizeLine3: 0,
            ticketPrice: 0,
          },
    [nextDraw],
  );

  // Áudio (services/audioService) não migrado ainda — só o estado visual do
  // toggle é mantido no header (ver nota no topo do arquivo).
  const [soundOn, setSoundOn] = useState(true);
  const [lang, setLang] = useState<'pt' | 'es' | 'en'>('pt');

  const [announcingWinner, setAnnouncingWinner] = useState<WinnerEvent | null>(null);
  const announcedRef = useRef<string | null>(null);
  useEffect(() => {
    if (winners.length > 0) {
      const last = winners[winners.length - 1];
      if (!last) return;
      const winId = `${last.ticketId}-${last.type}`;
      if (winId !== announcedRef.current) {
        announcedRef.current = winId;
        setAnnouncingWinner(last);
        const timeout = setTimeout(() => setAnnouncingWinner(null), 8000);
        return () => clearTimeout(timeout);
      }
    }
  }, [winners]);

  const handleLogout = useCallback(() => {
    clearCredentials();
    onLogout();
  }, [onLogout]);

  const loadingScreen = !drawActive && !postDrawCycle && !connected && nextDraws.length === 0;

  return (
    <ThemeBackground theme={theme} variant={drawActive ? 'main' : 'dark'} style={{ position: 'absolute', inset: 0 }}>
      <TvSafeArea style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <TvHeader
          theme={theme}
          t={themeConfig}
          connected={connected}
          displayDraw={displayDraw}
          jackpotAmount={jackpotAmount}
          triggerBallLimit={triggerBallLimit}
          drawnNumbers={drawnNumbers}
          isInProgress={drawActive}
          onLogout={handleLogout}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
          lang={lang}
          onSelectLang={(l) => setLang(l)}
        />

        {/* Main content — drawActive tem prioridade absoluta */}
        {drawActive ? (
          <InGameView
            theme={theme}
            themeName={themeName}
            drawnNumbers={drawnNumbers}
            currentBall={currentBall}
            topPlayers={enrichedTopPlayers}
            jackpotAmount={jackpotAmount}
            triggerBallLimit={triggerBallLimit}
            displayDraw={displayDraw}
            topStage={topStage}
            winners={winners}
            myTickets={myTickets}
          />
        ) : loadingScreen ? (
          <LoadingView theme={theme} />
        ) : postDrawCycle ? (
          <PostDrawCycle theme={theme} winners={winners} drawnNumbers={drawnNumbers} onDone={() => setPostDrawCycle(false)} />
        ) : (
          <LobbyView theme={theme} nextDraw={nextDraw} countdown={countdown} upcomingDraws={upcomingDraws} jackpotAmount={jackpotAmount} jackpotInfo={jackpotInfo} triggerBallLimit={triggerBallLimit} />
        )}

        {/* Winner modal */}
        <WinnerModal winner={announcingWinner} drawnNumbers={drawnNumbers} theme={theme} />
      </TvSafeArea>
    </ThemeBackground>
  );
}

export default TvScreenInner;

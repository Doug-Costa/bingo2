/**
 * AnimatedActiveBall.tsx — porte de `tvapp1/src/components/AnimatedActiveBall.tsx`.
 *
 * `useWindowDimensions()` (RN, tamanho real da tela do dispositivo) → aqui
 * usamos as constantes fixas do palco (`TV_STAGE_WIDTH`/`TV_STAGE_HEIGHT`,
 * 1920×1080) em vez do tamanho real da janela do browser: todo o conteúdo
 * é desenhado nessa resolução fixa e depois escalado como um todo pelo
 * `TvStage` (convenção da Fase 1) — usar o tamanho real da janela aqui
 * duplicaria a escala. `isLandscape` é portanto sempre `true` (1920 > 1080),
 * igual ao comportamento real do app na TV.
 *
 * `Animated.spring`/`Animated.loop` → keyframes CSS (`bs-active-scale-in`,
 * `bs-pulse-glow`, ver `globals.css`). O scale de entrada é reiniciado via
 * remount (`key`) quando `currentBall` muda, mesma técnica usada em `Ball.tsx`.
 */
'use client';

import { useMemo, useRef } from 'react';
import { TV_STAGE_HEIGHT, TV_STAGE_WIDTH } from '@/components/tv/TvStageContext';
import { alphaColor, type ThemeTokens } from '@/theme/themes';
import Icon from '../Icon';
import { ThemePanel, ThemeText } from '../theme';
import Ball from './Ball';

export interface AnimatedActiveBallProps {
  currentBall: number | null;
  drawnNumbers: number[];
  theme: ThemeTokens;
  themeName?: string;
  triggerBallLimit?: number | null;
}

export function AnimatedActiveBall({
  currentBall,
  drawnNumbers,
  theme,
  triggerBallLimit = null,
}: AnimatedActiveBallProps) {
  const width = TV_STAGE_WIDTH;
  const height = TV_STAGE_HEIGHT;
  const isLandscape = width > height;

  const sequenceCount = drawnNumbers.length;
  const isJackpotActive =
    triggerBallLimit === null || triggerBallLimit === undefined || triggerBallLimit === 0
      ? true
      : sequenceCount <= triggerBallLimit;

  const last4Balls = useMemo(() => {
    if (!drawnNumbers || drawnNumbers.length === 0) return [];
    const arrayNoCurrent =
      currentBall && drawnNumbers[drawnNumbers.length - 1] === currentBall ? drawnNumbers.slice(0, -1) : drawnNumbers;
    return arrayNoCurrent.slice(-4).reverse();
  }, [drawnNumbers, currentBall]);

  // Reinicia a animação de entrada (scale 0.3 → 1) sempre que a bola atual muda.
  const entranceNonce = useRef(0);
  const prevBallRef = useRef<number | null>(null);
  if (currentBall !== null && currentBall !== prevBallRef.current) {
    prevBallRef.current = currentBall;
    entranceNonce.current += 1;
  }

  const mainBallSize = isLandscape
    ? Math.min(width * 0.16, height * 0.38, 220)
    : Math.min(width * 0.42, 170);

  const isBingoShow = theme.meta?.id === 'theme-bingo-show';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, gap: 12 }}>
      {/* ─── PAINEL CENTRAL: BOLA ATUAL EM EVIDÊNCIA ─── */}
      {/* overflow:visible para a bola poder vir de fora dos limites do painel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Icon name="dice" size={16} color={theme.primary} />
          <ThemeText theme={theme} variant="labelSmall" color="primary" textStyle={{ fontWeight: 900, letterSpacing: 2 }}>
            BOLA EM SORTEIO
          </ThemeText>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingBottom: 10, minHeight: 180, position: 'relative' }}>
          {currentBall ? (
            <div
              key={entranceNonce.current}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                /* Efeito: surge gigante e deslocada, girando forte, e vai devagar
                   assentando na posição/tamanho final (com um leve quique no fim). */
                animation: 'bs-active-ball-enter 6500ms cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              {/* Glow pulsante — mais intenso após o pouso */}
              <div
                style={{
                  position: 'absolute',
                  opacity: 0.5,
                  width: mainBallSize + 80,
                  height: mainBallSize + 80,
                  borderRadius: '50%',
                  backgroundColor: theme.primaryGlow || 'rgba(255, 222, 56, 0.35)',
                  animation: 'bs-pulse-glow 1400ms ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />

              {/* Segundo anel de glow — mais largo */}
              <div
                style={{
                  position: 'absolute',
                  width: mainBallSize + 140,
                  height: mainBallSize + 140,
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: `3px solid ${theme.primaryGlow || 'rgba(255,222,56,0.25)'}`,
                  animation: 'bs-pulse-glow 1900ms ease-in-out infinite 200ms',
                  opacity: 0.35,
                  pointerEvents: 'none',
                }}
              />

              {/* Flash de impacto — anel que expande e some ao pousar */}
              <div
                key={`flash-${entranceNonce.current}`}
                style={{
                  position: 'absolute',
                  width: mainBallSize,
                  height: mainBallSize,
                  borderRadius: '50%',
                  backgroundColor: theme.primaryGlow || 'rgba(255, 222, 56, 0.5)',
                  animation: 'bs-ball-impact-flash 420ms ease-out 6700ms both',
                  pointerEvents: 'none',
                }}
              />

              {/* Bola Ativa Grande (XL) */}
              <Ball number={currentBall} size={mainBallSize} state="active" animate={false} theme={theme} />

              {/* Contador de SEQUÊNCIA abaixo da bola principal */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingLeft: 14,
                  paddingRight: 14,
                  paddingTop: 5,
                  paddingBottom: 5,
                  borderRadius: 20,
                  border: `1.5px solid ${theme.borderPrimary}`,
                  backgroundColor: theme.bgColor,
                  marginTop: 12,
                }}
              >
                <Icon name="sparkle" size={14} color={theme.primary} />
                <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ letterSpacing: 1 }}>
                  SEQUÊNCIA:{' '}
                  <ThemeText theme={theme} variant="labelLarge" color="primary" textStyle={{ fontWeight: 900 }} as="span">
                    {String(sequenceCount).padStart(2, '0')}
                  </ThemeText>
                </ThemeText>
                {triggerBallLimit !== null && triggerBallLimit > 0 && (
                  <div
                    style={{
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 2,
                      paddingBottom: 2,
                      borderRadius: 6,
                      border: `1px solid ${isJackpotActive ? theme.success : theme.error}`,
                      backgroundColor: alphaColor(isJackpotActive ? theme.success : theme.error, '22'),
                    }}
                  >
                    <ThemeText
                      theme={theme}
                      variant="labelSmall"
                      color={isJackpotActive ? 'success' : 'error'}
                      textStyle={{ fontWeight: 900, letterSpacing: 0.5 }}
                    >
                      {isJackpotActive ? `LIMITE ${triggerBallLimit}` : `EXCEDEU ${triggerBallLimit}`}
                    </ThemeText>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: mainBallSize,
                height: mainBallSize,
                borderRadius: mainBallSize / 2,
                border: `2px dashed ${theme.borderPrimary}`,
                opacity: 0.4,
              }}
            >
              <ThemeText theme={theme} variant="displayMedium" color="textMuted" textStyle={{ fontWeight: 900 }}>
                ...
              </ThemeText>
              <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontWeight: 900, letterSpacing: 1 }}>
                Aguardando
              </ThemeText>
            </div>
          )}
        </div>
      </div>

      {/* ─── PAINEL DAS ÚLTIMAS 4 BOLAS ─── */}
      <ThemePanel
        theme={theme}
        variant="glass"
        useImageBg={isBingoShow}
        style={{ width: 110, paddingTop: 10, paddingBottom: 10, paddingLeft: 6, paddingRight: 6, borderRadius: 18, borderWidth: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ letterSpacing: 1, textAlign: 'center' }}>
          ÚLTIMAS 4 BOLAS
        </ThemeText>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {last4Balls.length > 0 ? (
            last4Balls.map((num, i) => (
              <div key={`last4-${num}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', opacity: 1 - i * 0.18 }}>
                <Ball number={num} size={44} state={i === 0 ? 'previous' : 'called'} animate={false} theme={theme} />
                <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontWeight: 900, letterSpacing: 0.5, marginTop: 1 }}>
                  {i === 0 ? 'ANTERIOR' : `-${i + 1}`}
                </ThemeText>
              </div>
            ))
          ) : (
            <ThemeText theme={theme} variant="labelSmall" color="textMuted" textStyle={{ fontWeight: 900, marginTop: 20 }}>
              Iniciando...
            </ThemeText>
          )}
        </div>
      </ThemePanel>
    </div>
  );
}

export default AnimatedActiveBall;

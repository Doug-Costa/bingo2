/**
 * DrawStage.tsx — porte de `tvapp1/src/features/bingo-show/components/DrawStage.tsx`
 * (Palco Central Oficial da Tela de Sorteio, Bingo Show V2).
 *
 * Reescrito para bater com o original RN card a card: anel externo giratório (SVG
 * segmentado, `react-native-reanimated` loop 9s linear → CSS `animation: bs-spin 9s
 * linear infinite`), bola central (`HeroBall`: textura "selected" + gradiente radial de
 * volume + reflexo superior + sombra inferior, tudo dentro do MESMO recorte circular) e
 * meia-lua das 3 últimas bolas sorteadas (`CrescentBall`, mesma técnica, tamanhos/
 * offsets/opacidade/glow idênticos ao `CRESCENT_ARC` do original).
 *
 * Ajustes visuais posteriores a pedido do usuário: conjunto deslocado um pouco para
 * cima/esquerda no palco, meia-lua mais afastada do centro, bloco SEQUÊNCIA reposicionado
 * logo abaixo do anel, e o glow pulsante (tanto o anel azul ao redor da bola central quanto
 * o halo do bloco SEQUÊNCIA) removido por completo — ambos considerados "poluição visual"
 * pelo usuário, não fazem mais parte do palco.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BingoShowBall, type BingoShowBallState } from './BingoShowBall';
import { BingoShowColors, BingoShowSpacing } from '../design-system';

// ─── GEOMETRIA DO PALCO — base idêntica ao original RN (Sprint C2.5, "presença do
// conjunto"), com um fator de escala aplicado por cima (Fase Final Pré-Produção: "aumentar
// a bola principal ~20-30%") — escala TODA a geometria acoplada (anel, meia-lua, curva de
// saída da bola) junto, não só o diâmetro isolado, senão a bola cresce desproporcional ao
// resto do palco ou passa a cortar no anel/meia-lua.
const STAGE_SCALE = 1.2;
const BALL_DIAMETER = Math.round(224 * STAGE_SCALE); // 269
const RING_INNER_SIZE = Math.round(248 * STAGE_SCALE); // 298
const SPIN_RING_BOX = Math.round(274 * STAGE_SCALE); // 329
const SPIN_CENTER = SPIN_RING_BOX / 2;
const STAGE_WRAP_SIZE = RING_INNER_SIZE;
const STAGE_CENTER = STAGE_WRAP_SIZE / 2;
// Desloca o conjunto inteiro (anéis + bola + meia-lua) para cima/esquerda dentro do palco
// — pedido explícito do usuário ("bola principal mais para cima... um pouco a esquerda").
const STAGE_SHIFT_X = Math.round(-40 * STAGE_SCALE); // -48

// Meia-lua — offsets do `CRESCENT_ARC` original, afastados ~18% do centro (pedido
// explícito: "afaste um pouco as 3 últimas bolas") mantendo o mesmo ângulo/hierarquia de
// tamanho (recente > intermediária > antiga) do original.
const CRESCENT_ARC = [
  { top: Math.round(-29 * STAGE_SCALE), left: Math.round(272 * STAGE_SCALE), size: Math.round(88 * STAGE_SCALE), fontSize: Math.round(39 * STAGE_SCALE), opacity: 1.0, glow: 1.0 },
  { top: Math.round(83 * STAGE_SCALE), left: Math.round(332 * STAGE_SCALE), size: Math.round(72 * STAGE_SCALE), fontSize: Math.round(32 * STAGE_SCALE), opacity: 0.9, glow: 0.65 },
  { top: Math.round(199 * STAGE_SCALE), left: Math.round(293 * STAGE_SCALE), size: Math.round(60 * STAGE_SCALE), fontSize: Math.round(26 * STAGE_SCALE), opacity: 0.82, glow: 0.32 },
] as const;

// Delta de voo da bola que "sai" do centro e pousa no 1º lugar da meia-lua (posição de
// `CRESCENT_ARC[0]`, o slot mais recente) — usado pela animação de saída da bola central.
// Curva de Bézier QUADRÁTICA calculada quadro a quadro em JS (não mais CSS `offset-path`
// — pouco confiável/sem suporte consistente em runtimes de TV embarcados, causa raiz do
// efeito "quebrado"/feio reportado): a fórmula matemática da curva SEMPRE termina
// exatamente em `EXIT_TARGET_*` (o centro real do slot 0) em t=1, nunca "de qualquer
// forma" — o ponto de controle (`EXIT_PEAK_*`) só arqueia o meio do caminho, a chegada é
// garantida. Ver `FlyingExitBall` abaixo.
const EXIT_DURATION_MS = 780;

export interface DrawStageProps {
  /** Rótulo do cabeçalho do palco. */
  title?: string;
  /** Número sendo exibido no centro do palco agora. */
  currentNumber: number;
  /** Números que ainda vão sair, exibidos na meia-lua lateral (ordem de exibição). */
  nextBalls?: number[];
  /** Nº de sequência da bola atual dentro da rodada (derivado de `drawnBalls.length`). */
  sequenceNumber?: number;
  style?: React.CSSProperties;
}

/** Bola central: textura sólida ("drawn"/`selected`) + 4 camadas de acabamento — gradiente
 * radial de volume, reflexo superior, sombra inferior, borda interna fina — dentro do
 * MESMO recorte circular (`overflow:hidden`), igual ao `HeroBall` original. */
const HeroBall: React.FC<{ number: number }> = ({ number }) => (
  <div
    style={{
      width: BALL_DIAMETER,
      height: BALL_DIAMETER,
      borderRadius: '50%',
      overflow: 'hidden',
      position: 'relative',
      border: '1.25px solid rgba(255, 255, 255, 0.3)',
      boxSizing: 'border-box',
    }}
  >
    <BingoShowBall
      number={number}
      state="drawn"
      size="current"
      fontSizeOverride={104}
      diameterOverride={BALL_DIAMETER}
      style={{ position: 'absolute', inset: 0 }}
    />
    {/* Gradiente radial — volume/curvatura da esfera, sem tingir o número central. */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.38) 100%)`,
        pointerEvents: 'none',
      }}
    />
    {/* Reflexo superior — único, curvo, nunca cobre o número. */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.38), rgba(255,255,255,0))',
        pointerEvents: 'none',
      }}
    />
    {/* Sombra inferior — única, discreta, só para ancoragem/profundidade. */}
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '35%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.3), rgba(0,0,0,0))',
        pointerEvents: 'none',
      }}
    />
  </div>
);

/** Bolas da meia-lua — textura ampliada (recortada pelo próprio recorte circular do
 * container) + reflexo diagonal único (reflexo + luz lateral + brilho localizado fundidos)
 * + sombra inferior + borda do container, igual ao `CrescentBall` original. */
const CrescentBall: React.FC<{
  number: number;
  state: BingoShowBallState;
  size: number;
  fontSize: number;
  glow: number;
}> = ({ number, state, size, fontSize, glow }) => {
  const textureScale = state === 'default' ? 1.22 : 1.27;
  const textureSize = size * textureScale;
  const textureOffset = -(textureSize - size) / 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxSizing: 'border-box',
      }}
    >
      <BingoShowBall
        number={number}
        state={state}
        diameterOverride={textureSize}
        fontSizeOverride={fontSize}
        style={{
          position: 'absolute',
          top: textureOffset,
          left: textureOffset,
          width: textureSize,
          height: textureSize,
        }}
      />
      {/* Reflexo único — diagonal, do canto superior-esquerdo até o centro-inferior. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(122deg, rgba(255,255,255,${0.3 * glow}) 0%, rgba(255,255,255,${0.1 * glow}) 38%, rgba(255,255,255,0) 75%)`,
          pointerEvents: 'none',
        }}
      />
      {/* Sombra inferior — única, para ancoragem/profundidade. */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '32%',
          background: `linear-gradient(to top, rgba(0,0,0,${0.1 + 0.1 * glow}), rgba(0,0,0,0))`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

import { useAppTheme } from '@/contexts/ThemeContext';

/** Bola do efeito de saída — versão mais leve que o `HeroBall` estático */
const ExitBall: React.FC<{ number: number }> = ({ number }) => {
  const { theme } = useAppTheme();
  const cyanColor = theme.secondary || BingoShowColors.cyanNeon;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 0 26px 6px ${cyanColor}88`,
      }}
    >
      <BingoShowBall
        number={number}
        state="drawn"
        size="current"
        fontSizeOverride={104}
        diameterOverride={BALL_DIAMETER}
        style={{ position: 'absolute', inset: 0 }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '48%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.32), rgba(255,255,255,0))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/** Pílula de informação — mesmo visual do bloco SEQUÊNCIA */
const InfoPill: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { theme } = useAppTheme();
  const accentColor = theme.secondary || BingoShowColors.cyanNeon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: BingoShowSpacing.sm,
        backgroundColor: 'rgba(2, 5, 20, 0.88)',
        border: `1.5px solid ${accentColor}66`,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 18,
        paddingRight: 18,
        borderRadius: 14,
        boxSizing: 'border-box',
        boxShadow: `0 0 16px ${accentColor}33`,
      }}
    >
      <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 900, letterSpacing: 1.5 }}>{label}</span>
      <span
        style={{
          color: accentColor,
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 1,
          textShadow: `0 0 10px ${accentColor}`,
        }}
      >
        {value}
      </span>
    </div>
  );
};


const FlyingExitBall: React.FC<{ number: number }> = ({ number }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 80,
        height: 80,
        transform: 'translate(-50%, -50%)',
        animation: 'bs-ball-exit-flight 700ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <ExitBall number={number} />
    </div>
  );
};

interface FlyingBall {
  id: number;
  number: number;
}

/**
 * Animação de saída da bola central + meia-lua com DELAY (pedido explícito do usuário):
 * antes, a meia-lua já mostrava a bola nova no slot 0 no MESMO instante em que ela saía do
 * centro — a bola voando e a bola já "pousada" apareciam ao mesmo tempo, duplicadas. Agora
 * a meia-lua só é atualizada (`displayedNextBalls`) quando a bola voadora efetivamente
 * TERMINA de chegar (`EXIT_DURATION_MS` depois) — primeiro o efeito de saída acontece,
 * DEPOIS ela "entra" de verdade na posição.
 */
function useBallExitEffect(
  currentNumber: number,
  nextBalls: number[],
): { flyingBalls: FlyingBall[]; displayedNextBalls: number[] } {
  const [flyingBalls, setFlyingBalls] = useState<FlyingBall[]>([]);
  const [displayedNextBalls, setDisplayedNextBalls] = useState<number[]>(nextBalls);
  const prevNumberRef = useRef<number | null>(null);
  const nonceRef = useRef(0);
  // Sempre aponta para o `nextBalls` mais recente recebido via props — lido só quando o
  // timer dispara, nunca usado como dependência do efeito (evita re-disparar a cada
  // render só porque o array é uma nova referência).
  const nextBallsRef = useRef(nextBalls);
  nextBallsRef.current = nextBalls;

  useEffect(() => {
    const prev = prevNumberRef.current;
    prevNumberRef.current = currentNumber;

    // 1ª renderização (ainda não há "bola saindo") — a meia-lua já nasce no estado real,
    // sem esperar nenhum delay.
    if (prev === null) {
      setDisplayedNextBalls(nextBallsRef.current);
      return;
    }

    if (prev === currentNumber || prev <= 0) {
      return;
    }

    nonceRef.current += 1;
    const id = nonceRef.current;
    setFlyingBalls((balls) => [...balls, { id, number: prev }]);

    const timer = setTimeout(() => {
      setFlyingBalls((balls) => balls.filter((b) => b.id !== id));
      // Só agora, com a bola já "pousada", a meia-lua realmente atualiza.
      setDisplayedNextBalls(nextBallsRef.current);
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNumber]);

  return { flyingBalls, displayedNextBalls };
}

export const DrawStage: React.FC<DrawStageProps> = ({
  title = 'NÚMERO SORTEADO',
  currentNumber,
  nextBalls = [],
  sequenceNumber,
  style,
}) => {
  const { theme } = useAppTheme();
  const primaryColor = theme.primary || BingoShowColors.primary;
  const secondaryColor = theme.secondary || BingoShowColors.cyanNeon;
  const glowColor = theme.primaryGlow || 'rgba(0, 229, 255, 0.4)';

  const { flyingBalls, displayedNextBalls } = useBallExitEffect(currentNumber, nextBalls);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* HEADER — card com a cor primária do tema */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
        <div
          style={{
            backgroundColor: 'rgba(2, 5, 20, 0.88)',
            border: `1.5px solid ${primaryColor}66`,
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 22,
            paddingRight: 22,
            borderRadius: 14,
            boxSizing: 'border-box',
            boxShadow: `0 0 16px ${primaryColor}44`,
          }}
        >
          <span
            style={{
              color: primaryColor,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 2.5,
              textShadow: `0 0 10px ${glowColor}`,
            }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* STAGE BODY — anel giratório + bola central + meia-lua */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          position: 'relative',
          marginTop: 95,
          marginBottom: BingoShowSpacing.xs,
        }}
      >
        <div
          style={{
            width: STAGE_WRAP_SIZE,
            height: STAGE_WRAP_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transform: `translateX(${STAGE_SHIFT_X}px)`,
          }}
        >
          {/* Anel externo — único traço segmentado, giro lento contínuo. */}
          <div
            style={{
              position: 'absolute',
              width: SPIN_RING_BOX,
              height: SPIN_RING_BOX,
              top: -(SPIN_RING_BOX - STAGE_WRAP_SIZE) / 2,
              left: -(SPIN_RING_BOX - STAGE_WRAP_SIZE) / 2,
              animation: 'bs-spin 9s linear infinite',
              pointerEvents: 'none',
            }}
          >
            <svg width={SPIN_RING_BOX} height={SPIN_RING_BOX} viewBox={`0 0 ${SPIN_RING_BOX} ${SPIN_RING_BOX}`}>
              <circle
                cx={SPIN_CENTER}
                cy={SPIN_CENTER}
                r={130 * STAGE_SCALE}
                stroke={secondaryColor}
                strokeWidth={2 * STAGE_SCALE}
                strokeDasharray="14 10"
                strokeLinecap="round"
                fill="none"
                opacity={0.45}
              />
            </svg>
          </div>

          {/* Anel interno + bola */}
          <div
            style={{
              width: RING_INNER_SIZE,
              height: RING_INNER_SIZE,
              borderRadius: '50%',
              border: `1.5px solid ${secondaryColor}cc`,
              boxShadow: `0 0 20px ${secondaryColor}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >

            {/* Flash de impacto — só acende quando a bola termina de assentar (delay
                sincronizado com a duração da entrada abaixo: entrada 1800ms + ~folga). */}
            <div
              key={`impact-${currentNumber}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: BALL_DIAMETER,
                height: BALL_DIAMETER,
                marginLeft: -BALL_DIAMETER / 2,
                marginTop: -BALL_DIAMETER / 2,
                borderRadius: '50%',
                backgroundColor: `${BingoShowColors.cyanNeon}55`,
                animation: 'bs-ball-impact-flash 380ms ease-out 1560ms both',
                pointerEvents: 'none',
              }}
            />
            {/* `key` reinicia a animação de entrada a cada troca de número — porte do
                `useEffect` que reseta scale/opacity a cada `currentNumber` no original.
                Entrada: nasce gigante e deslocada, girando forte, e diminui/gira menos até
                encaixar na posição/tamanho final, com um leve assentamento no fim. `linear`
                (não `ease-out`) — a curva de desaceleração já vem da forma do keyframe; com
                `ease-out` por cima, o trecho final (já quase parado) esticava no tempo e
                dava sensação de pausa antes de assentar de vez. Duração 1800ms (era 2800ms,
                depois 2300ms — acelerada de novo a pedido do usuário). `zIndex: 10` (era 2,
                menor que o zIndex das bolas da meia-lua mais recentes — CRESCENT_ARC[0] tem
                zIndex 3) — por isso a bola da meia-lua "vazava" por cima da bola central
                durante a entrada, dando a impressão de que ela não era sólida.
                Segunda animação encadeada (`bs-hero-ball-pulse`, delay = duração da
                entrada): assim que a bola assenta, pulsa 3x (não infinito) e para, parada
                até a próxima bola trocar via `key` — pedido explícito do usuário.
                `forwards` (não `both`) no pulso: com `both`, o preenchimento "backwards"
                durante os 1800ms de delay tomaria prioridade sobre a transform da entrada
                (mesma propriedade, animação listada depois = maior prioridade quando "em
                efeito" — e `both`/`backwards` conta como em efeito mesmo durante o delay),
                travando a bola em scale(1) a entrada inteira. `forwards` só assume depois
                que o delay termina, sem interferir antes. */}
            <div
              key={currentNumber}
              style={{
                position: 'relative',
                zIndex: 10,
                animation: 'bs-hero-ball-enter 1800ms linear both, bs-hero-ball-pulse 480ms ease-in-out 1800ms 3 forwards',
              }}
            >
              <HeroBall number={currentNumber} />
            </div>
          </div>

          {/* Meia-lua — 3 últimas bolas, fora do anel. `nextBalls[0]` = mais recente.
              Usa `displayedNextBalls` (com delay), não o `nextBalls` cru — só reflete a
              bola nova quando o efeito de saída já chegou. */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {displayedNextBalls.slice(0, 3).map((num, idx) => {
              const step = (CRESCENT_ARC[idx] ?? CRESCENT_ARC[CRESCENT_ARC.length - 1])!;
              return (
                <div
                  key={`${num}-${idx}`}
                  style={{
                    position: 'absolute',
                    top: step.top,
                    left: step.left,
                    opacity: step.opacity,
                    zIndex: CRESCENT_ARC.length - idx,
                  }}
                >
                  <CrescentBall
                    number={num}
                    state={idx === 2 ? 'default' : 'drawn'}
                    size={step.size}
                    fontSize={step.fontSize}
                    glow={step.glow}
                  />
                </div>
              );
            })}
          </div>

          {/* Bola voando do centro até a meia-lua — efeito de saída da bola sorteada. */}
          {flyingBalls.map((fb) => (
            <FlyingExitBall key={fb.id} number={fb.number} />
          ))}
        </div>
      </div>

      {/* Bloco SEQUÊNCIA — sem glow pulsante (removido a pedido do usuário), sempre
          abaixo do palco/bola central, com um respiro claro entre os dois. */}
      {sequenceNumber !== undefined ? (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30 }}>
          <InfoPill label="SEQUÊNCIA" value={`${sequenceNumber}ª BOLA`} />
        </div>
      ) : null}
    </div>
  );
};

export default DrawStage;

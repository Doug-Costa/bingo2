/**
 * DrawStageBlueHandoff.tsx — passagem da bola do centro para a coluna lateral
 * (SOMENTE tema Blue).
 *
 * Fluxo visual (os dados continuam vindo do SSE — nada aqui decide números):
 *   nova bola entra pela esquerda (DrawStage/.ballFlight) → fica no centro →
 *   quando chega o próximo número, a bola anterior sai pela DIREITA, encolhe e
 *   pousa exatamente no 1º slot lateral; as bolas antigas descem uma posição e a
 *   3ª sai; o 1º slot só revela a bola nova no pouso, com um pulso curto.
 *
 * Posição do slot: medida no DOM (getBoundingClientRect) no início da saída,
 * convertida para o espaço local do palco dividindo pela escala real do TvStage —
 * funciona em qualquer tamanho de janela/tela cheia, sem coordenadas fixas.
 */
'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getBallColorName } from './BingoShowBall';
import blueStyles from './DrawStageBlue.module.css';

/** Bola lateral do tema Blue — esfera CSS com a mesma linguagem da bola central;
 * cor pela regra existente por faixa. */
export const BlueNextBall: React.FC<{ number?: number }> = ({ number }) =>
  number === undefined ? (
    <div className={`${blueStyles.nextBall} ${blueStyles.nextBallEmpty}`} />
  ) : (
    <div className={`${blueStyles.nextBall} ${blueStyles[`color_${getBallColorName(number, 'drawn')}`]}`}>
      <span className={blueStyles.nextBallNumber}>{number}</span>
    </div>
  );

const SIDE_BALL_PX = 76;
const SLOT_PITCH_PX = 76 + 20; // bola + gap da coluna
export const HANDOFF_MS = 760;
const HANDOFF_EASING = 'cubic-bezier(0.32, 0.72, 0.24, 1)';

interface Overlay {
  id: number;
  number: number;
  dx: number;
  dy: number;
  scale: number;
  ballPx: number;
}

/**
 * Controla a passagem centro → 1º slot. Só apresentação: `hidden` esconde, no slot,
 * a bola que ainda está em trânsito (sem cópia antecipada); `landed` marca o pouso
 * para o pulso. Um número novo durante o voo finaliza o voo atual na hora (a bola
 * aparece no slot, e desce normalmente) — nenhum número se perde e nunca há dois
 * voos simultâneos.
 */
export function useBlueBallHandoff(
  enabled: boolean,
  currentNumber: number,
  reducedMotion: boolean,
  stageRef: React.RefObject<HTMLDivElement>,
  columnRef: React.RefObject<HTMLDivElement>,
) {
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [hidden, setHidden] = useState<number | null>(null);
  const [landed, setLanded] = useState<{ n: number; tick: number } | null>(null);
  const prevRef = useRef<number | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = currentNumber;
    if (!enabled || prev === null || prev === currentNumber || prev <= 0) return;

    // Voo anterior ainda no ar: encerra já (a bola dele fica visível no slot).
    setOverlay(null);
    const id = ++idRef.current;

    if (reducedMotion) {
      setHidden(null);
      setLanded({ n: prev, tick: id });
      return;
    }

    setHidden(prev);
    // Mede depois do layout da coluna já atualizada (a bola que sai já ocupa o slot 0).
    const raf = requestAnimationFrame(() => {
      const stage = stageRef.current;
      const slot = columnRef.current?.querySelector<HTMLElement>('[data-slot="0"]');
      if (!stage || !slot) {
        setHidden(null);
        return;
      }
      const s = stage.getBoundingClientRect();
      const d = slot.getBoundingClientRect();
      const k = stage.offsetWidth > 0 ? s.width / stage.offsetWidth : 1; // escala do TvStage
      const ballPx = parseFloat(getComputedStyle(stage).getPropertyValue('--ball')) || 252;
      setOverlay({
        id,
        number: prev,
        dx: (d.left + d.width / 2 - (s.left + s.width / 2)) / k,
        dy: (d.top + d.height / 2 - (s.top + s.height / 2)) / k,
        scale: d.width / k / ballPx,
        ballPx,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [currentNumber, enabled, reducedMotion, stageRef, columnRef]);

  const onLanded = useCallback((ov: Overlay) => {
    setOverlay((o) => (o && o.id === ov.id ? null : o));
    setHidden((h) => (h === ov.number ? null : h));
    setLanded({ n: ov.number, tick: ov.id });
  }, []);

  return { overlay, hidden, landed, onLanded };
}

/** A bola em trânsito: sai com a cara da bola central e, no caminho, vira a bola
 * lateral (crossfade) enquanto encolhe até o tamanho do slot. Só a superfície
 * central gira; a face lateral chega com o número reto. Web Animations API com os
 * valores medidos (sem calc() multiplicando variáveis — mais seguro em WebView). */
export const BlueHandoffOverlay: React.FC<{ overlay: Overlay; onLanded: (_overlay: Overlay) => void }> = ({ overlay, onLanded }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const { dx, dy, scale } = overlay;
    const t = (x: number, y: number, s: number) => `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    // Curva aplicada a CADA trecho entre quadros-chave (como animation-timing-function
    // no CSS); nas opções do WAAPI ela valeria para a animação inteira e a bola chegaria
    // ao slot na metade do tempo.
    const opts: KeyframeAnimationOptions = { duration: HANDOFF_MS, easing: 'linear', fill: 'both' };
    const seg = (frames: Keyframe[]) => frames.map((kf, i) => (i < frames.length - 1 ? { ...kf, easing: HANDOFF_EASING } : kf));
    const anims = [
      rootRef.current?.animate(
        seg([
          { offset: 0, transform: t(0, 0, 1), filter: 'brightness(1)' },
          { offset: 0.18, transform: t(-7, 2, 1.025), filter: 'brightness(1.12)' },
          { offset: 0.55, transform: t(dx * 0.58, dy * 0.58 - 18, 0.58 + scale * 0.42), filter: 'brightness(1.08)' },
          { offset: 0.84, transform: t(dx + 5, dy - 3, scale * 1.08), filter: 'brightness(1.12)' },
          { offset: 1, transform: t(dx, dy, scale), filter: 'brightness(1)' },
        ]),
        opts,
      ),
      centerRef.current?.animate(
        seg([
          // Continua com a cara da bola central enquanto encolhe; só perto do slot
          // (≈40–78%) vira a bola lateral — evita uma bola lateral grande no meio.
          { offset: 0, opacity: 1, transform: 'rotate(0deg)' },
          { offset: 0.18, opacity: 1, transform: 'rotate(-5deg)' },
          { offset: 0.4, opacity: 1, transform: 'rotate(140deg)' },
          { offset: 0.55, opacity: 0.7, transform: 'rotate(190deg)' },
          { offset: 0.78, opacity: 0, transform: 'rotate(300deg)' },
          { offset: 1, opacity: 0, transform: 'rotate(360deg)' },
        ]),
        opts,
      ),
      sideRef.current?.animate(
        seg([
          { offset: 0, opacity: 0 },
          { offset: 0.42, opacity: 0 },
          { offset: 0.76, opacity: 1 },
          { offset: 1, opacity: 1 },
        ]),
        opts,
      ),
      trailRef.current?.animate(
        seg([
          { offset: 0, opacity: 0 },
          { offset: 0.3, opacity: 0.6 },
          { offset: 0.72, opacity: 0 },
          { offset: 1, opacity: 0 },
        ]),
        opts,
      ),
    ];
    const main = anims[0];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onLanded(overlay);
    };
    if (main) main.onfinish = finish;
    else finish();
    return () => anims.forEach((a) => a?.cancel());
  }, [overlay, onLanded]);

  const sideScale = overlay.ballPx / SIDE_BALL_PX;
  return (
    <div ref={rootRef} className={blueStyles.handoff}>
      <span ref={trailRef} className={blueStyles.handoffTrail} />
      <div ref={centerRef} className={blueStyles.handoffLayer}>
        <div className={`${blueStyles.mainBingoBall} ${blueStyles.handoffStatic}`}>
          <span className={blueStyles.ballSpecular} />
          <span className={blueStyles.ballReflection} />
        </div>
        <span className={`${blueStyles.ballNumber} ${blueStyles.handoffStatic}`}>{overlay.number}</span>
      </div>
      <div ref={sideRef} className={blueStyles.handoffLayer} style={{ opacity: 0 }}>
        <div style={{ transform: `scale(${sideScale})` }}>
          <BlueNextBall number={overlay.number} />
        </div>
      </div>
    </div>
  );
};

/** Coluna das 3 últimas bolas (valores/ordem de `balls`, vindos do SSE). Cada bola
 * tem key = número e posição por translateY, então, quando a lista muda, as
 * antigas DESLIZAM uma posição para baixo; a que sai da lista desce e some. A bola
 * em trânsito (`hidden`) fica invisível no slot até pousar; no pouso, só ela pulsa. */
export const BlueRecentColumn = React.forwardRef<
  HTMLDivElement,
  { balls: number[]; hidden: number | null; landed: { n: number; tick: number } | null }
>(({ balls, hidden, landed }, ref) => {
  const visible = balls.slice(0, 3);
  const [leaving, setLeaving] = useState<number[]>([]);
  const prevRef = useRef<number[]>(visible);

  useEffect(() => {
    const gone = prevRef.current.filter((n) => !visible.includes(n));
    prevRef.current = visible;
    if (gone.length === 0) return;
    setLeaving((l) => [...l.filter((n) => !gone.includes(n)), ...gone]);
    const timer = setTimeout(() => setLeaving((l) => l.filter((n) => !gone.includes(n))), HANDOFF_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.join(',')]);

  const slots: { key: string; number?: number; slot: number; leaving?: boolean }[] = [
    ...visible.map((n, i) => ({ key: `n${n}`, number: n, slot: i })),
    ...leaving.filter((n) => !visible.includes(n)).map((n) => ({ key: `n${n}`, number: n, slot: 3, leaving: true })),
    ...[0, 1, 2].filter((i) => i >= visible.length).map((i) => ({ key: `empty${i}`, slot: i })),
  ];

  return (
    <div ref={ref} className={blueStyles.nextColumn}>
      {slots.map((s) => {
        const isHidden = s.number !== undefined && s.number === hidden;
        const isLanded = s.number !== undefined && landed?.n === s.number && s.slot === 0;
        return (
          <div
            key={s.key}
            data-slot={s.leaving ? undefined : s.slot}
            className={`${blueStyles.slot} ${s.leaving ? blueStyles.slotLeaving : ''}`}
            style={{ transform: `translateY(${s.slot * SLOT_PITCH_PX}px)`, opacity: isHidden || s.leaving ? 0 : 1 }}
          >
            <div key={isLanded ? `l${landed!.tick}` : 's'} className={isLanded ? blueStyles.slotLanding : undefined}>
              <BlueNextBall number={s.number} />
            </div>
          </div>
        );
      })}
    </div>
  );
});
BlueRecentColumn.displayName = 'BlueRecentColumn';

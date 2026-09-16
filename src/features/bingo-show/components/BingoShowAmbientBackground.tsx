'use client';

import type { CSSProperties, ReactNode } from 'react';
import { BingoShowAssets } from '../assets';
import { BingoShowColors } from '../design-system';

interface ParticleSpec {
  id: string;
  left: string;
  top: string;
  size: number;
  duration: number;
  drift: number;
  maxOpacity: number;
  source: 'stars' | 'sparkles';
}

const PARTICLES: ParticleSpec[] = [
  { id: 'p1', left: '6%', top: '14%', size: 14, duration: 3600, drift: 8, maxOpacity: 0.75, source: 'stars' },
  { id: 'p2', left: '92%', top: '10%', size: 10, duration: 3000, drift: 6, maxOpacity: 0.7, source: 'sparkles' },
  { id: 'p3', left: '18%', top: '78%', size: 12, duration: 4200, drift: 10, maxOpacity: 0.65, source: 'stars' },
  { id: 'p4', left: '84%', top: '82%', size: 16, duration: 3800, drift: 7, maxOpacity: 0.7, source: 'sparkles' },
  { id: 'p5', left: '48%', top: '6%', size: 9, duration: 3200, drift: 5, maxOpacity: 0.6, source: 'stars' },
  { id: 'p6', left: '62%', top: '90%', size: 11, duration: 4000, drift: 9, maxOpacity: 0.65, source: 'sparkles' },
  { id: 'p7', left: '4%', top: '48%', size: 10, duration: 3400, drift: 6, maxOpacity: 0.6, source: 'sparkles' },
  { id: 'p8', left: '96%', top: '52%', size: 13, duration: 3700, drift: 8, maxOpacity: 0.7, source: 'stars' },
  { id: 'p9', left: '30%', top: '32%', size: 7, duration: 2800, drift: 5, maxOpacity: 0.45, source: 'stars' },
  { id: 'p10', left: '70%', top: '36%', size: 8, duration: 3100, drift: 6, maxOpacity: 0.5, source: 'sparkles' },
  { id: 'p11', left: '38%', top: '64%', size: 6, duration: 2600, drift: 4, maxOpacity: 0.4, source: 'stars' },
  { id: 'p12', left: '58%', top: '20%', size: 8, duration: 3300, drift: 5, maxOpacity: 0.5, source: 'sparkles' },
  { id: 'p13', left: '12%', top: '62%', size: 9, duration: 3900, drift: 7, maxOpacity: 0.55, source: 'stars' },
  { id: 'p14', left: '80%', top: '60%', size: 7, duration: 2900, drift: 5, maxOpacity: 0.45, source: 'sparkles' },
];

function AmbientParticle({ spec }: { spec: ParticleSpec }) {
  const source = spec.source === 'stars' ? BingoShowAssets.particles.stars : BingoShowAssets.particles.sparkles;

  return (
    <img
      src={source}
      alt=""
      style={
        {
          position: 'absolute',
          left: spec.left,
          top: spec.top,
          width: spec.size,
          height: spec.size,
          objectFit: 'contain',
          opacity: 0.1,
          '--duration': `${spec.duration}ms`,
          '--drift': spec.drift,
          '--max-opacity': spec.maxOpacity,
          animation: 'bs-ambient-particle-twinkle var(--duration) ease-in-out infinite alternate',
        } as CSSProperties
      }
    />
  );
}

export interface BingoShowAmbientBackgroundProps {
  children?: ReactNode;
  particles?: boolean;
  confetti?: boolean;
  brightness?: 'default' | 'light';
  backdrop?: 'space' | 'blue';
  /** Multiplica a opacidade da vinheta nas bordas (1 = original, <1 = mais claro). Opt-in, não afeta chamadores existentes. */
  vignetteStrength?: number;
  /** Adiciona dois halos de cor (ciano + dourado, tokens da marca) atrás do conteúdo pra dar vida ao fundo. Opt-in. */
  accentGlow?: boolean;
}

export function BingoShowAmbientBackground({
  children,
  particles = true,
  confetti = false,
  brightness = 'default',
  backdrop = 'space',
  vignetteStrength = 1,
  accentGlow = false,
}: BingoShowAmbientBackgroundProps) {
  const isLight = brightness === 'light';
  const spaceSource = backdrop === 'blue' ? BingoShowAssets.backgrounds.bgBlueGradient : BingoShowAssets.backgrounds.bgSpace;

  const vt = isLight ? 0.22 : 0.45;
  const vb = isLight ? 0.35 : 0.65;
  const vl = isLight ? 0.18 : 0.35;
  const vr = isLight ? 0.18 : 0.35;
  const vignetteTop = `linear-gradient(to bottom, rgba(1,2,10,${vt * vignetteStrength}), rgba(1,2,10,0))`;
  const vignetteBottom = `linear-gradient(to top, rgba(1,2,10,${vb * vignetteStrength}), rgba(1,2,10,0))`;
  const vignetteLeft = `linear-gradient(to right, rgba(1,2,10,${vl * vignetteStrength}), rgba(1,2,10,0))`;
  const vignetteRight = `linear-gradient(to left, rgba(1,2,10,${vr * vignetteStrength}), rgba(1,2,10,0))`;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: BingoShowColors.bgDeep, overflow: 'hidden' }}>
      {/* CAMADA 1: Fundo com deriva Ken Burns */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${spaceSource})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'bs-ambient-kenburns 36s ease-in-out infinite alternate',
        }}
      />

      {/* CAMADA 2: Glow respirando */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${BingoShowAssets.backgrounds.bgGlow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
          animation: isLight ? 'bs-ambient-glow-light 16s ease-in-out infinite alternate' : 'bs-ambient-glow-default 16s ease-in-out infinite alternate',
        }}
      />

      {/* CAMADA 2.5: Halos de cor (ciano + dourado) — opcional, dá riqueza cromática ao fundo */}
      {accentGlow && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              left: '-10%',
              width: '60%',
              height: '60%',
              background: 'radial-gradient(circle, rgba(0,229,255,0.22) 0%, rgba(0,229,255,0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '65%',
              height: '65%',
              background: 'radial-gradient(circle, rgba(255,222,56,0.14) 0%, rgba(255,222,56,0) 70%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* CAMADA 3: Partículas cintilantes e Confete */}
      {particles && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {PARTICLES.map((p) => (
            <AmbientParticle key={p.id} spec={p} />
          ))}
        </div>
      )}

      {confetti && (
        <img
          src={BingoShowAssets.particles.confetti}
          alt="Confetes"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.75,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* CAMADA 4: Vinheta gradiente nas 4 bordas */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90, background: vignetteTop, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, background: vignetteBottom, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, background: vignetteLeft, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 80, background: vignetteRight, pointerEvents: 'none' }} />

      {/* CAMADA 5: Conteúdo */}
      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>{children}</div>
    </div>
  );
}

export default BingoShowAmbientBackground;

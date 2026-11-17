'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { sinceBall, takeTrace } from '@/lib/perfTrace';

/**
 * PerfMonitor — mede a TV durante o sorteio e liga o modo ultra leve sozinho.
 *
 * Sem cabo/ADB não dá para depurar a TV, então a própria página mede:
 * - a cada bola nova (evento `tv-ball`, disparado pelo DrawStage) conta os quadros
 *   da chegada (~1,5s) e o pior intervalo entre eles;
 * - se, das primeiras bolas medidas, a maioria sair travada, grava `tv_perf=ultra`
 *   no localStorage e liga `html.tv-ultra` na hora (vale também para os próximos
 *   boots — o script do layout lê a mesma chave antes do primeiro desenho).
 *
 * Painel de teste pelo controle: aperte 0 cinco vezes seguidas.
 *   Com o painel aberto: 1 = ultra leve · 2 = leve (desliga o ultra) · 3 = automático
 *   · 4 = liga/desliga a animação da bola no ultra.
 *
 * A cada 5 bolas medidas envia os números para /api/perf (log da Vercel), para
 * acompanhar a TV sem cabo nem controle.
 */

const KEY = 'tv_perf';
const MEASURE_MS = 1500;
const SKIP_FIRST = 1; // a 1ª bola após abrir ainda decodifica imagens/fontes
const SAMPLE = 3; // bolas avaliadas no modo automático
const BAD_FPS = 50;
const BAD_FRAME_MS = 70;
/** Sem o painel: bola "ruim" se o processador travou mais que isto na janela. */
const BAD_LONG_MS = 250;
let hudOpen = false;

type Mode = 'auto' | 'ultra' | 'normal';

interface BallStat {
  fps: number;
  worst: number;
  /** Tarefas longas (>50ms) do processador durante a chegada da bola. */
  longMs: number;
  /** ms da chegada do new_ball (SSE) até a bola montada na tela. */
  sse?: number;
  /** ms do 1º quadro depois de montar (estilo + layout + pintura). */
  frame?: number;
  /** ms de render React por parte da tela na janela da bola. */
  react?: Record<string, number>;
  /** Quadros do voo medidos pelo Android (APK 1.0.12+). */
  nat?: unknown;
  /** Tarefas longas da janela: [ms desde a bola, duração] (até 12) — mostra se o
   * peso está na chegada da bola, na tabela de cupons (+350ms) ou depois. */
  lt?: number[][];
}

const SEND_EVERY = 5;

declare global {
  interface Window {
    __tvPerf?: { voiceLagMs?: number; voiceStalls?: number };
  }
}

function readMode(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'ultra' || v === 'normal' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function applyMode(mode: Mode, autoUltra: boolean) {
  try {
    if (mode === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    // sem localStorage: vale só até recarregar
  }
  const root = document.documentElement;
  const ultra = mode === 'ultra' || (mode === 'auto' && autoUltra);
  root.classList.toggle('tv-ultra', ultra);
  if (ultra) root.classList.add('tv-lite');
}

let gpuCache: string | null = null;
function gpuName(): string {
  if (gpuCache !== null) return gpuCache;
  gpuCache = '?';
  try {
    const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null;
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && ext) gpuCache = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch {
    // sem WebGL
  }
  return gpuCache;
}

function deviceInfo(): string {
  const n = navigator as Navigator & { deviceMemory?: number };
  const chrome = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] ?? '?';
  const model = navigator.userAgent.match(/Android [^;)]*;\s*([^;)]+?)(?: Build|\))/)?.[1] ?? '';
  return `Chrome ${chrome} · ${n.hardwareConcurrency ?? '?'} núcleos · ${n.deviceMemory ?? '?'}GB · ${screen.width}×${screen.height}${model ? ` · ${model}` : ''}`;
}

export function PerfMonitor() {
  const [hud, setHud] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, force] = useState(0);
  const statsRef = useRef<BallStat[]>([]);
  const ballsRef = useRef(0);
  const modeRef = useRef<Mode>('auto');

  useEffect(() => {
    modeRef.current = readMode();
    // Tarefas longas do processador (Chrome 58+); somadas na janela de cada bola.
    let longMs = 0;
    let ltStart = -1;
    let ltList: number[][] = [];
    // Lobby: tarefas longas a cada 10s fora do sorteio, enviadas a cada 6 janelas.
    let lobbyLong = 0;
    let lastBallAt = 0;
    let lobbyPending: number[] = [];
    const lobbyTimer = setInterval(() => {
      if (Date.now() - lastBallAt > 15000) {
        lobbyPending.push(Math.round(lobbyLong));
        if (lobbyPending.length >= 6) {
          const payload = JSON.stringify({ lobby: true, device: deviceInfo(), long10s: lobbyPending });
          lobbyPending = [];
          try {
            if (!navigator.sendBeacon?.('/api/perf', payload)) {
              void fetch('/api/perf', { method: 'POST', body: payload, keepalive: true }).catch(() => {});
            }
          } catch {
            // sem rede
          }
        }
      }
      lobbyLong = 0;
    }, 10000);
    let longObs: PerformanceObserver | null = null;
    try {
      longObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          longMs += e.duration;
          lobbyLong += e.duration;
          if (ltStart >= 0 && ltList.length < 12) ltList.push([Math.round(e.startTime - ltStart), Math.round(e.duration)]);
        }
      });
      longObs.observe({ entryTypes: ['longtask'] });
    } catch {
      longObs = null;
    }
    let pending: BallStat[] = [];
    const send = () => {
      const root = document.documentElement;
      const payload = JSON.stringify({
        mode: root.classList.contains('tv-ultra') ? 'ultra' : root.classList.contains('tv-lite') ? 'lite' : 'normal',
        anim: !root.classList.contains('tv-noanim'),
        native: root.classList.contains('tv-native-ball'),
        prize: (window as unknown as { __tvPrize?: unknown }).__tvPrize ?? null,
        engine: (() => {
          try {
            const b = (window as unknown as { TvBridge?: { ballEngine?: () => string } }).TvBridge;
            return typeof b?.ballEngine === 'function' ? b.ballEngine() : null;
          } catch {
            return null;
          }
        })(),
        bridge: typeof (window as unknown as { TvBridge?: { ballSupported?: unknown } }).TvBridge?.ballSupported === 'function',
        // Globo do Loteria'i: quem anima (Android ou página) e o que está na tela.
        globe: (() => {
          const b = (window as unknown as { TvBridge?: { globeShow?: unknown; globeState?: () => string } }).TvBridge;
          const img = document.querySelector('[data-tv-globe] img') as HTMLImageElement | null;
          if (!img) return null;
          let st: string | null = null;
          try {
            st = typeof b?.globeState === 'function' ? b.globeState() : null;
          } catch {
            st = 'erro';
          }
          return {
            apk: typeof b?.globeShow === 'function',
            state: st,
            status: (window as unknown as { __tvGlobe?: string }).__tvGlobe ?? null,
            hidden: root.classList.contains('tv-native-globe'),
            img: img.src.split('/').pop(),
            loaded: img.complete && img.naturalWidth > 0,
          };
        })(),
        // Renderer morto (tela preta + recarga): {crash, killed, at} do APK 1.0.18+.
        gone: (() => {
          try {
            const b = (window as unknown as { TvBridge?: { renderGone?: () => string } }).TvBridge;
            return typeof b?.renderGone === 'function' ? JSON.parse(b.renderGone()) : null;
          } catch {
            return null;
          }
        })(),
        heap: (() => {
          const m = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
          return m ? Math.round(m.usedJSHeapSize / 1048576) : null;
        })(),
        device: deviceInfo(),
        nodes: document.getElementsByTagName('*').length,
        gpu: gpuName(),
        ua: navigator.userAgent,
        balls: pending,
        voice: window.__tvPerf ?? {},
      });
      pending = [];
      try {
        if (!navigator.sendBeacon?.('/api/perf', payload)) {
          void fetch('/api/perf', { method: 'POST', body: payload, keepalive: true }).catch(() => {});
        }
      } catch {
        // sem rede: perde esta medição
      }
    };
    // Aviso rápido do modo ao abrir (só na TV): ajuda a saber o que está valendo no teste.
    const r = document.documentElement;
    if (r.classList.contains('tv-lite')) {
      setToast(`Desempenho: ${r.classList.contains('tv-ultra') ? 'ULTRA LEVE' : 'LEVE'}${modeRef.current === 'auto' ? ' (automático)' : ''}`);
      setTimeout(() => setToast(null), 5000);
    }
    let measuring = false;

    const onBall = () => {
      ballsRef.current += 1;
      lastBallAt = Date.now();
      if (measuring || ballsRef.current <= SKIP_FIRST) return;
      measuring = true;
      const start = performance.now();
      const sse = sinceBall();
      let frame = -1;
      requestAnimationFrame(() => requestAnimationFrame((t) => (frame = Math.round(t - start))));
      let last = start;
      let frames = 0;
      let worst = 0;
      longMs = 0;
      ltStart = start;
      ltList = [];
      // Painel fechado: nada de loop de quadros — só espera a janela e lê as
      // tarefas longas (o loop em si custava quadros nesta TV).
      if (!hudOpen) {
        setTimeout(() => {
          measuring = false;
          let nat: unknown;
          try {
            const b = (window as unknown as { TvBridge?: { ballStats?: () => string } }).TvBridge;
            if (typeof b?.ballStats === 'function') nat = JSON.parse(b.ballStats());
          } catch {
            nat = undefined;
          }
          const stat: BallStat = { fps: -1, worst: -1, longMs: Math.round(longMs), sse, frame, nat, lt: ltList };
          ltStart = -1;
          pending.push(stat);
          if (pending.length >= SEND_EVERY) send();
          statsRef.current.push(stat);
          if (statsRef.current.length > 10) statsRef.current.shift();
          decide();
        }, MEASURE_MS);
        return;
      }
      const tick = (now: number) => {
        frames += 1;
        worst = Math.max(worst, now - last);
        last = now;
        if (now - start < MEASURE_MS) {
          requestAnimationFrame(tick);
          return;
        }
        measuring = false;
        const stat = { fps: Math.round((frames * 1000) / (now - start)), worst: Math.round(worst), longMs: Math.round(longMs), sse, frame, react: takeTrace() };
        pending.push(stat);
        if (pending.length >= SEND_EVERY) send();
        const stats = statsRef.current;
        stats.push(stat);
        if (stats.length > 10) stats.shift();
        force((x) => x + 1);
        decide();
      };
      requestAnimationFrame(tick);
    };

    // Automático: decide uma vez, com as primeiras bolas medidas.
    const decide = () => {
        const stats = statsRef.current;
        const root = document.documentElement;
        if (modeRef.current === 'auto' && !root.classList.contains('tv-ultra') && stats.length === SAMPLE) {
          const bad = stats.filter((s) => (s.fps >= 0 ? s.fps < BAD_FPS || s.worst > BAD_FRAME_MS : s.longMs > BAD_LONG_MS)).length;
          if (bad >= 2) {
            modeRef.current = 'ultra';
            applyMode('ultra', true);
            const avg = Math.round(stats.reduce((a, s) => a + s.fps, 0) / stats.length);
            setToast(`Modo ultra leve ativado (média ${avg} FPS)`);
            setTimeout(() => setToast(null), 5000);
          }
        }
    };

    // Controle: 0 cinco vezes abre/fecha o painel; com ele aberto, 1/2/3 trocam o modo.
    let zeros = 0;
    let zeroTimer: ReturnType<typeof setTimeout> | undefined;
    const digitOf = (e: KeyboardEvent) => {
      if (e.key && e.key.length === 1 && e.key >= '0' && e.key <= '9') return e.key;
      const c = e.keyCode;
      if (c >= 48 && c <= 57) return String(c - 48);
      if (c >= 96 && c <= 105) return String(c - 96);
      return null;
    };
    const onKey = (e: KeyboardEvent) => {
      const d = digitOf(e);
      if (d === '0') {
        zeros += 1;
        clearTimeout(zeroTimer);
        zeroTimer = setTimeout(() => (zeros = 0), 3000);
        if (zeros >= 5) {
          zeros = 0;
          setHud((h) => !h);
        }
        return;
      }
      zeros = 0;
      if (!document.documentElement.dataset.tvHud) return;
      if (d === '4') {
        const off = document.documentElement.classList.toggle('tv-noanim');
        try {
          localStorage.setItem('tv_anim', off ? '0' : '1');
        } catch {
          // vale até recarregar
        }
        setToast(off ? 'Bola: entrada SIMPLES' : 'Bola: animação COMPLETA');
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const next: Mode | null = d === '1' ? 'ultra' : d === '2' ? 'normal' : d === '3' ? 'auto' : null;
      if (!next) return;
      modeRef.current = next;
      statsRef.current = [];
      applyMode(next, false);
      setToast(next === 'ultra' ? 'Modo: ULTRA LEVE' : next === 'normal' ? 'Modo: LEVE (sem ultra)' : 'Modo: AUTOMÁTICO');
      setTimeout(() => setToast(null), 3000);
      force((x) => x + 1);
    };

    window.addEventListener('tv-ball', onBall);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('tv-ball', onBall);
      window.removeEventListener('keydown', onKey);
      clearTimeout(zeroTimer);
      longObs?.disconnect();
      clearInterval(lobbyTimer);
    };
  }, []);

  useEffect(() => {
    hudOpen = hud;
    if (hud) document.documentElement.dataset.tvHud = '1';
    else delete document.documentElement.dataset.tvHud;
  }, [hud]);

  // Painel aberto: atualiza os números da voz a cada 2s.
  useEffect(() => {
    if (!hud) return;
    const t = setInterval(() => force((x) => x + 1), 2000);
    return () => clearInterval(t);
  }, [hud]);

  const box: CSSProperties = {
    position: 'fixed',
    zIndex: 2147483647,
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    font: '600 18px/1.35 Arial, sans-serif',
    padding: '10px 14px',
    borderRadius: 8,
    pointerEvents: 'none',
  };

  if (!hud && !toast) return null;
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const modeLabel = root?.classList.contains('tv-ultra') ? 'ULTRA LEVE' : root?.classList.contains('tv-lite') ? 'LEVE' : 'NORMAL';
  const stats = statsRef.current;
  const voice = typeof window !== 'undefined' ? window.__tvPerf : undefined;

  return (
    <>
      {toast && <div style={{ ...box, top: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 24 }}>{toast}</div>}
      {hud && (
        <div style={{ ...box, top: 20, left: 20, maxWidth: 560 }}>
          <div>
            Modo: <b>{modeLabel}</b> ({modeRef.current === 'auto' ? 'automático' : 'fixo'})
          </div>
          <div style={{ fontSize: 15, opacity: 0.8 }}>{deviceInfo()}</div>
          <div style={{ marginTop: 6 }}>
            Bolas (FPS / pior quadro):{' '}
            {stats.length ? stats.slice(-6).map((s) => (s.fps >= 0 ? `${s.fps}/${s.worst}ms` : '–')).join('  ') : 'aguardando bola…'}
          </div>
          <div>
            Processador travado na bola: {stats.length ? stats.slice(-6).map((s) => `${s.longMs}ms`).join('  ') : '–'}
          </div>
          <div>
            Voz: atraso {voice?.voiceLagMs ?? '–'}ms · engasgos {voice?.voiceStalls ?? 0}
          </div>
          <div style={{ marginTop: 6, fontSize: 15, opacity: 0.8 }}>1 = ultra leve · 2 = leve · 3 = automático · 4 = animação da bola · 0×5 fecha</div>
        </div>
      )}
    </>
  );
}

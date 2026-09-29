/**
 * BingoShowPromoModal.tsx — promoções do backend num modal quase tela cheia sobre
 * a home (próximos sorteios). Regras de negócio: utils/promoRules.ts.
 *
 * Só existe no lobby: o LoopScreen desmonta o lobby (e este modal junto) assim que
 * um sorteio começa — no sorteio a promoção é ignorada.
 *
 * Tempo (timing.ts):
 *   lobby entra → 10s → promo (timer s) → lobby 10s → próxima promo (ou a mesma) → …
 *   - Nos 30s antes do próximo sorteio nenhuma abre; a que estiver no ar fecha antes.
 *   - Promo com `horario` abre no minuto dela, na frente de tudo, uma vez.
 *
 * Dados: `promotions` do SSE (`promotions_list` ao fim de cada sorteio + snapshot).
 * Sem promoções válidas, o modal nunca aparece.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { useGameSocket, type Promotion } from '@/contexts/SSEContext';
import {
  PROMO_BLACKOUT_BEFORE_DRAW_MS,
  PROMO_DEFAULT_SECONDS,
  PROMO_FIRST_DELAY_MS,
  PROMO_GAP_MS,
} from '../timing';
import { buildRotation, dueScheduled, promoType, scheduleOccurrenceKey } from '../utils/promoRules';
import styles from './BingoShowPromoModal.module.css';

type Phase =
  | { kind: 'idle'; openAt: number }
  | { kind: 'promo'; promo: Promotion; startedAt: number; endsAt: number };

/** Promoção mais curta do que isso (cortada pelo sorteio) nem abre. */
const MIN_PROMO_MS = 3000;

function promoDurationMs(p: Promotion): number {
  const s = Number(p.timer);
  return (Number.isFinite(s) && s > 0 ? s : PROMO_DEFAULT_SECONDS) * 1000;
}

/** `text1tamanho`/`text2tamanho`: número → px; "3rem", "48px", "5vw"… → como veio. */
function cssSize(v: number | string | null | undefined): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s) > 0 ? `${s}px` : undefined;
  return /^\d+(\.\d+)?(px|rem|em|vw|vh|%)$/.test(s) ? s : undefined;
}

function nonEmpty(s: string | null | undefined): string {
  return typeof s === 'string' ? s.trim() : '';
}

/** O navegador deixa tocar COM som sem interação? (TV em kiosk costuma deixar.) */
function canAutoplayWithSound(): boolean {
  try {
    if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) return true;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    const ok = ctx.state === 'running';
    void ctx.close();
    return ok;
  } catch {
    return false;
  }
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
  return m ? m[1]! : null;
}

const isVideoFile = (u: string) => /\.(mp4|webm|ogg|ogv|mov|m4v|m3u8)$/i.test(u.split(/[?#]/)[0]!);

/** Textos 1 (topo) e 2 (base) sobre imagem ou fundo — cor/tamanho do backend. */
const PromoTexts: React.FC<{ promo: Promotion }> = ({ promo }) => {
  const t1 = nonEmpty(promo.texto1);
  const t2 = nonEmpty(promo.texto2);
  return (
    <>
      {t1 && (
        <div className={`${styles.textBand} ${styles.textTop}`}>
          <span className={styles.text1} style={{ color: promo.text1color || undefined, fontSize: cssSize(promo.text1tamanho) }}>
            {t1}
          </span>
        </div>
      )}
      {t2 && (
        <div className={`${styles.textBand} ${styles.textBottom}`}>
          <span className={styles.text2} style={{ color: promo.text2color || undefined, fontSize: cssSize(promo.text2tamanho) }}>
            {t2}
          </span>
        </div>
      )}
    </>
  );
};

/** IMAGE: carrossel (`imagesjsonb`) ou imagem única (`urlimg`); sem imagem, só
 * fundo + textos. Nada para mostrar → pula a promoção. */
const ImagePromo: React.FC<{ promo: Promotion; durationMs: number; onGiveUp: () => void }> = ({ promo, durationMs, onGiveUp }) => {
  const initial = useMemo(() => {
    const list = Array.isArray(promo.imagesjsonb)
      ? promo.imagesjsonb.filter((u): u is string => typeof u === 'string' && u.trim() !== '')
      : [];
    return list.length > 0 ? list : nonEmpty(promo.urlimg) ? [promo.urlimg!] : [];
  }, [promo]);
  const [images, setImages] = useState(initial);
  const [idx, setIdx] = useState(0);
  const hasText = !!(nonEmpty(promo.texto1) || nonEmpty(promo.texto2));

  useEffect(() => {
    if (images.length === 0 && !hasText) onGiveUp();
  }, [images.length, hasText, onGiveUp]);

  // Várias imagens dividem o tempo da promoção (mínimo de 2,5s cada).
  useEffect(() => {
    if (images.length <= 1) return;
    const step = Math.max(2500, durationMs / images.length);
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), step);
    return () => clearInterval(t);
  }, [images.length, durationMs]);

  const current = images.length > 0 ? images[idx % images.length] : null;
  return (
    <>
      {current && (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa do backend
        <img
          key={current}
          className={`${styles.media} ${images.length > 1 ? styles.slide : ''}`}
          src={current}
          alt=""
          onError={() => setImages((l) => l.filter((u) => u !== current))}
        />
      )}
      {images.length > 1 && (
        <div className={styles.dots}>
          {images.map((u, i) => (
            <span key={u} className={`${styles.dot} ${i === idx % images.length ? styles.dotOn : ''}`} />
          ))}
        </div>
      )}
      <PromoTexts promo={promo} />
    </>
  );
};

/** VIDEO: arquivo de vídeo no tamanho do modal. Tenta com som; se o navegador
 * bloquear, toca mudo (melhor do que tela parada). */
const VideoPromo: React.FC<{ src: string; onGiveUp: () => void }> = ({ src, onGiveUp }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(onGiveUp);
    });
  }, [src, onGiveUp]);
  return <video ref={ref} className={styles.media} src={src} playsInline loop onError={onGiveUp} />;
};

/** YOUTUBE: player embutido, autoplay, com som quando o navegador permite. */
const YoutubePromo: React.FC<{ id: string; title: string }> = ({ id, title }) => {
  const [mute] = useState(() => (canAutoplayWithSound() ? 0 : 1));
  const src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=${mute}&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1`;
  return (
    <iframe
      className={styles.frameEmbed}
      src={src}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
};

/** QRCODE: QR do `linkurl` no centro, textos acima/abaixo. */
const QrPromo: React.FC<{ promo: Promotion; url: string }> = ({ promo, url }) => {
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const dark: string[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) dark.push(`M${c} ${r}h1v1h-1z`);
    return { n, path: dark.join('') };
  }, [url]);
  const t1 = nonEmpty(promo.texto1);
  const t2 = nonEmpty(promo.texto2);
  return (
    <div className={styles.qrLayout}>
      {t1 && (
        <span className={`${styles.text1} ${styles.qrText1}`} style={{ color: promo.text1color || undefined, fontSize: cssSize(promo.text1tamanho) }}>
          {t1}
        </span>
      )}
      <div className={styles.qrBox}>
        <svg viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} className={styles.qrSvg} shapeRendering="crispEdges" aria-label={url}>
          <rect x={-2} y={-2} width={cells.n + 4} height={cells.n + 4} fill="#fff" />
          <path d={cells.path} fill="#000" />
        </svg>
      </div>
      {t2 && (
        <span className={`${styles.text2} ${styles.qrText2}`} style={{ color: promo.text2color || undefined, fontSize: cssSize(promo.text2tamanho) }}>
          {t2}
        </span>
      )}
    </div>
  );
};

/** API: GET no `linkurl` e mostra o que vier (texto ou JSON genérico) com
 * `text1color`/`text1tamanho`. Falhou (rede/CORS/vazio) → pula a promoção. */
const ApiPromo: React.FC<{ promo: Promotion; url: string; onGiveUp: () => void }> = ({ promo, url, onGiveUp }) => {
  const [lines, setLines] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    fetch(url, { method: 'GET', signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const body = await r.text();
        let data: unknown = body;
        try {
          data = JSON.parse(body);
        } catch {
          // texto puro
        }
        const out = apiLines(data).slice(0, 12);
        if (out.length === 0) throw new Error('vazio');
        if (!cancelled) setLines(out);
      })
      .catch(() => {
        if (!cancelled) onGiveUp(); // rede, CORS, timeout (6s) ou resposta vazia
      })
      .finally(() => clearTimeout(t));
    return () => {
      cancelled = true;
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- busca uma vez por exibição
  }, [url]);
  if (!lines) return null;
  return (
    <div className={styles.apiList} style={{ color: promo.text1color || undefined, fontSize: cssSize(promo.text1tamanho) }}>
      {lines.map((l, i) => (
        <span key={i} className={styles.apiLine} style={{ animationDelay: `${i * 90}ms` }}>
          {l}
        </span>
      ))}
    </div>
  );
};

/** Converte a resposta da API em linhas legíveis. */
function apiLines(data: unknown): string[] {
  const prim = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v).trim());
  if (typeof data === 'string') return data.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(data)) {
    return data
      .map((item) =>
        item && typeof item === 'object'
          ? Object.values(item as Record<string, unknown>).map(prim).filter(Boolean).join(' • ')
          : prim(item),
      )
      .filter(Boolean);
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Envelope comum: { data: [...] } / { items: [...] } → usa a lista.
    const list = Object.values(obj).find((v) => Array.isArray(v));
    if (list) return apiLines(list);
    return Object.entries(obj)
      .map(([k, v]) => (prim(v) ? `${k}: ${prim(v)}` : ''))
      .filter(Boolean);
  }
  return prim(data) ? [prim(data)] : [];
}

const PromoContent: React.FC<{ promo: Promotion; durationMs: number; onGiveUp: () => void }> = ({ promo, durationMs, onGiveUp }) => {
  const type = promoType(promo);
  const urls = [nonEmpty(promo.linkurl), nonEmpty(promo.urlimg)].filter(Boolean);
  let body: React.ReactNode = null;

  if (type === 'IMAGE') body = <ImagePromo promo={promo} durationMs={durationMs} onGiveUp={onGiveUp} />;
  if (type === 'VIDEO') {
    const src = urls.find(isVideoFile) ?? urls[0];
    body = src ? <VideoPromo src={src} onGiveUp={onGiveUp} /> : null;
  }
  if (type === 'YOUTUBE') {
    const id = urls.map(youtubeId).find(Boolean);
    body = id ? <YoutubePromo id={id} title={nonEmpty(promo.title) || 'Promoção'} /> : null;
  }
  if (type === 'QRCODE' && nonEmpty(promo.linkurl)) body = <QrPromo promo={promo} url={nonEmpty(promo.linkurl)} />;
  if (type === 'API' && nonEmpty(promo.linkurl)) body = <ApiPromo promo={promo} url={nonEmpty(promo.linkurl)} onGiveUp={onGiveUp} />;

  // Sem o dado obrigatório do tipo: não mostra moldura vazia.
  useEffect(() => {
    if (body === null) onGiveUp();
  });

  return (
    <div className={styles.content} style={{ background: nonEmpty(promo.backgroundcolor) || '#000' }}>
      {body}
    </div>
  );
};

/** Quando começa o próximo sorteio (ms epoch) — `scheduledAt` do próximo draw;
 * sem ele, o contador de fechamento (`drawClosingSeconds`) a partir de quando chegou. */
function useNextDrawAt(): number | null {
  const { nextDraws, drawClosingSeconds } = useGameSocket();
  const closingRef = useRef<{ value: number | null; at: number }>({ value: null, at: 0 });
  if (closingRef.current.value !== drawClosingSeconds) closingRef.current = { value: drawClosingSeconds, at: Date.now() };
  const sched = nextDraws[0]?.scheduledAt;
  if (sched) {
    const t = new Date(String(sched).replace(' ', 'T')).getTime();
    if (Number.isFinite(t)) return t;
  }
  const c = closingRef.current;
  return typeof c.value === 'number' && c.value > 0 ? c.at + c.value * 1000 : null;
}

export const BingoShowPromoModal: React.FC = () => {
  const { promotions } = useGameSocket();
  const promos = useMemo(() => (Array.isArray(promotions) ? promotions.filter((p) => p && p.id) : []), [promotions]);
  const nextDrawAt = useNextDrawAt();

  const promosRef = useRef(promos);
  promosRef.current = promos;
  const nextDrawAtRef = useRef(nextDrawAt);
  nextDrawAtRef.current = nextDrawAt;
  const lastIdRef = useRef<string | null>(null);
  const scheduledShownRef = useRef(new Set<string>());

  const [phase, setPhase] = useState<Phase>(() => ({ kind: 'idle', openAt: Date.now() + PROMO_FIRST_DELAY_MS }));
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [, setTick] = useState(0);

  // Relógio único (250ms): decide abrir/fechar e atualiza o contador visível.
  useEffect(() => {
    const step = () => {
      const now = Date.now();
      const cur = phaseRef.current;
      const blackoutAt = nextDrawAtRef.current !== null ? nextDrawAtRef.current - PROMO_BLACKOUT_BEFORE_DRAW_MS : Infinity;
      const open = (promo: Promotion) => {
        const endsAt = Math.min(now + promoDurationMs(promo), blackoutAt);
        if (endsAt - now < MIN_PROMO_MS) return false;
        setPhase({ kind: 'promo', promo, startedAt: now, endsAt });
        return true;
      };

      // 1) Promo com horário: abre no minuto dela, na frente de qualquer outra.
      const due = dueScheduled(promosRef.current, new Date(now)).find(
        (p) => !scheduledShownRef.current.has(scheduleOccurrenceKey(p, new Date(now))),
      );
      if (due && open(due)) {
        scheduledShownRef.current.add(scheduleOccurrenceKey(due, new Date(now)));
        return;
      }

      // 2) Promo no ar: fecha no fim do tempo (ou no início da janela do sorteio).
      if (cur.kind === 'promo') {
        if (now >= Math.min(cur.endsAt, blackoutAt)) setPhase({ kind: 'idle', openAt: now + PROMO_GAP_MS });
        else setTick((n) => n + 1);
        return;
      }

      // 3) Lobby livre: na hora, abre a próxima da sequência (ou a mesma, se só há uma).
      if (now < cur.openAt) return;
      const rotation = buildRotation(promosRef.current);
      if (rotation.length === 0) return;
      const lastIdx = rotation.findIndex((p) => p.id === lastIdRef.current);
      const next = rotation[(lastIdx + 1) % rotation.length]!;
      if (open(next)) lastIdRef.current = next.id;
    };
    const t = setInterval(step, 250);
    return () => clearInterval(t);
  }, []);

  // Mídia com erro / dado faltando: fecha já e volta ao lobby. Estável durante a
  // exibição (o vídeo não reinicia a cada tick do relógio).
  const shownAt = phase.kind === 'promo' ? phase.startedAt : 0;
  const skip = useCallback(
    () => setPhase((p) => (p.kind === 'promo' && p.startedAt === shownAt ? { kind: 'idle', openAt: Date.now() + PROMO_GAP_MS } : p)),
    [shownAt],
  );

  if (phase.kind !== 'promo') return null;
  const { promo, startedAt, endsAt } = phase;
  const durationMs = endsAt - startedAt;
  const seconds = Math.ceil(Math.max(0, endsAt - Date.now()) / 1000);

  return (
    <div className={styles.backdrop} role="dialog" aria-label={nonEmpty(promo.title) || 'Promoção'}>
      <div key={`${promo.id}-${startedAt}`} className={styles.frame}>
        <PromoContent promo={promo} durationMs={durationMs} onGiveUp={skip} />

        <div className={styles.counter} aria-label={`Promoção termina em ${seconds} segundos`}>
          <span className={styles.counterValue}>{seconds}s</span>
        </div>

        <div className={styles.progressTrack}>
          <span className={styles.progressBar} style={{ animationDuration: `${durationMs}ms` } as React.CSSProperties} />
        </div>
      </div>
    </div>
  );
};

export default BingoShowPromoModal;

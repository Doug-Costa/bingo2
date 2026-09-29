/**
 * BingoShowPromoModal.tsx — promoções do backend em um modal sobre o lobby.
 *
 * Regras de negócio (horário, prioridade, único): utils/promoRules.ts.
 *
 * Ciclo (só enquanto o lobby está na tela — o LoopScreen desmonta o lobby, e este
 * modal junto, assim que um sorteio começa, então um draw novo corta a promoção):
 *   lobby livre PROMO_LOBBY_GAP_MS (30s) → promoções na ordem recebida, cada uma
 *   pelo seu `timer` (s) → volta ao lobby 30s → repete.
 *
 * Dados: `promotions` do SSE (evento `promotions_list` e `snapshot` do lobby).
 * Nada é inventado: sem promoções, o modal nunca aparece.
 */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSocket, type Promotion } from '@/contexts/SSEContext';
import { PROMO_DEFAULT_SECONDS, PROMO_LOBBY_GAP_MS } from '../timing';
import { buildPromoCycle, markUniqueShown } from '../utils/promoRules';
import styles from './BingoShowPromoModal.module.css';

/** `cycle` é a lista CONGELADA no início do ciclo (regras de horário/prioridade/
 * único já aplicadas) — atualizações do backend valem a partir do próximo ciclo. */
type Phase =
  | { kind: 'lobby' }
  | { kind: 'promo'; cycle: Promotion[]; index: number; startedAt: number; durationMs: number };

function promoDurationMs(p: Promotion): number {
  const s = Number(p.timer);
  return (Number.isFinite(s) && s > 0 ? s : PROMO_DEFAULT_SECONDS) * 1000;
}

function isVideo(p: Promotion): boolean {
  return String(p.typepromote || '').toUpperCase() === 'VIDEO' || p.video === true;
}

type MediaKind =
  | { kind: 'youtube'; embed: string }
  | { kind: 'vimeo'; embed: string }
  | { kind: 'video'; src: string }
  | { kind: 'image'; src: string }
  | { kind: 'page'; src: string };

/** Decide como tocar uma URL externa: player (YouTube/Vimeo) em iframe, arquivo de
 * vídeo no <video>, imagem no <img>, e qualquer outra página num iframe. Sempre
 * mudo e automático (TV sem interação). */
function classifyUrl(url: string, hintVideo: boolean): MediaKind {
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) {
    const id = yt[1];
    return { kind: 'youtube', embed: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1` };
  }
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return { kind: 'vimeo', embed: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1` };
  const path = u.split(/[?#]/)[0]!.toLowerCase();
  if (/\.(mp4|webm|ogg|ogv|mov|m4v|m3u8)$/.test(path)) return { kind: 'video', src: u };
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/.test(path) || /\/images?[/?]|gstatic\.com\/images/.test(u)) return { kind: 'image', src: u };
  return hintVideo ? { kind: 'video', src: u } : { kind: 'image', src: u };
}

/** Uma mídia da promoção. Se a imagem/vídeo falhar, tenta a mesma URL como página
 * (iframe); se não houver como exibir, avisa o modal para pular a promoção. */
const PromoMedia: React.FC<{ url: string; hintVideo: boolean; alt: string; onGiveUp: () => void }> = ({
  url,
  hintVideo,
  alt,
  onGiveUp,
}) => {
  const initial = useMemo(() => classifyUrl(url, hintVideo), [url, hintVideo]);
  const [media, setMedia] = useState<MediaKind>(initial);
  useEffect(() => setMedia(initial), [initial]);
  const fallbackToPage = () => (media.kind === 'page' ? onGiveUp() : setMedia({ kind: 'page', src: url }));

  if (media.kind === 'youtube' || media.kind === 'vimeo' || media.kind === 'page') {
    return (
      <iframe
        className={styles.frameEmbed}
        src={media.kind === 'page' ? media.src : media.embed}
        title={alt}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
  if (media.kind === 'video') {
    return <video className={styles.media} src={media.src} autoPlay muted playsInline loop onError={fallbackToPage} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- URL externa do backend
  return <img className={styles.media} src={media.src} alt={alt} onError={fallbackToPage} />;
};

function sizePx(v: number | string | null | undefined): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Imagens da promoção: `imagesjsonb` (se vier com URLs) ou `urlimg`. */
function promoImages(p: Promotion): string[] {
  const extra = Array.isArray(p.imagesjsonb)
    ? p.imagesjsonb
        .map((x) => (typeof x === 'string' ? x : (x as { url?: string; urlimg?: string })?.url ?? (x as { urlimg?: string })?.urlimg))
        .filter((u): u is string => typeof u === 'string' && u.trim() !== '')
    : [];
  if (extra.length > 0) return extra;
  return p.urlimg ? [p.urlimg] : [];
}

const PromoContent: React.FC<{ promo: Promotion; durationMs: number; onMediaError: () => void }> = ({
  promo,
  durationMs,
  onMediaError,
}) => {
  const images = promoImages(promo);
  const [imgIdx, setImgIdx] = useState(0);

  // Várias imagens: dividem o tempo da promoção igualmente.
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setImgIdx((i) => (i + 1) % images.length), durationMs / images.length);
    return () => clearInterval(t);
  }, [images.length, durationMs]);

  const t1 = promo.texto1 || promo.title || '';
  const t2 = promo.texto2 || '';

  return (
    <div className={styles.content} style={promo.backgroundcolor ? { background: promo.backgroundcolor } : undefined}>
      {images.length > 0 ? (
        <PromoMedia key={images[imgIdx]} url={images[imgIdx]!} hintVideo={isVideo(promo)} alt={t1} onGiveUp={onMediaError} />
      ) : promo.linkurl ? (
        // Só um link externo: tenta a página no modal.
        <PromoMedia url={promo.linkurl} hintVideo={false} alt={t1} onGiveUp={onMediaError} />
      ) : null}

      {(t1 || t2) && (
        <div className={styles.texts}>
          {t1 && (
            <span
              className={styles.text1}
              style={{ color: promo.text1color || undefined, fontSize: sizePx(promo.text1tamanho) }}
            >
              {t1}
            </span>
          )}
          {t2 && (
            <span
              className={styles.text2}
              style={{ color: promo.text2color || undefined, fontSize: sizePx(promo.text2tamanho) }}
            >
              {t2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const BingoShowPromoModal: React.FC = () => {
  const { promotions } = useGameSocket();
  // Ordem em que chegam do backend (sem reordenar).
  const promos = useMemo(() => (Array.isArray(promotions) ? promotions.filter((p) => p && p.id) : []), [promotions]);
  const promosRef = useRef(promos);
  promosRef.current = promos;

  const [phase, setPhase] = useState<Phase>({ kind: 'lobby' });
  // Só força re-render do contador; o tempo em si é lido na hora (Date.now()).
  const [, setTick] = useState(0);

  // Máquina do ciclo: lobby (30s) → promo 1 → … → promo N → lobby (30s) → …
  useEffect(() => {
    if (phase.kind === 'lobby') {
      const t = setTimeout(() => {
        // Regras de negócio: janela de horário, prioridade na frente, único 1x/dia.
        const cycle = buildPromoCycle(promosRef.current);
        if (cycle.length === 0) {
          setPhase({ kind: 'lobby' }); // nada elegível agora: segue no lobby e reavalia
          return;
        }
        setPhase({ kind: 'promo', cycle, index: 0, startedAt: Date.now(), durationMs: promoDurationMs(cycle[0]!) });
      }, PROMO_LOBBY_GAP_MS);
      return () => clearTimeout(t);
    }
    // Promoção única: conta como exibida hoje assim que entra na tela.
    const current = phase.cycle[phase.index];
    if (current?.unique) markUniqueShown(current.id);
    const t = setTimeout(() => {
      const next = phase.index + 1;
      if (next < phase.cycle.length) {
        setPhase({ ...phase, index: next, startedAt: Date.now(), durationMs: promoDurationMs(phase.cycle[next]!) });
      } else {
        setPhase({ kind: 'lobby' });
      }
    }, Math.max(0, phase.startedAt + phase.durationMs - Date.now()));
    return () => clearTimeout(t);
  }, [phase]);

  // Relógio só para o contador visível (não controla o ciclo).
  useEffect(() => {
    if (phase.kind !== 'promo') return;
    const t = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [phase]);

  if (phase.kind !== 'promo') return null;
  const promo = phase.cycle[phase.index];
  if (!promo) return null;
  const total = phase.cycle.length;

  const remainingMs = Math.max(0, phase.startedAt + phase.durationMs - Date.now());
  const seconds = Math.ceil(remainingMs / 1000);
  // Mídia com erro: pula para a próxima promoção em vez de mostrar moldura vazia.
  const skip = () => setPhase({ ...phase, durationMs: 0, startedAt: Date.now() });

  return (
    <div className={styles.backdrop} role="dialog" aria-label={promo.title || 'Promoção'}>
      <div key={`${promo.id}-${phase.startedAt}`} className={styles.frame}>
        <PromoContent promo={promo} durationMs={phase.durationMs} onMediaError={skip} />

        <div className={styles.counter} aria-label={`Promoção termina em ${seconds} segundos`}>
          {total > 1 && (
            <span className={styles.counterIndex}>
              {phase.index + 1}/{total}
            </span>
          )}
          <span className={styles.counterValue}>{seconds}s</span>
        </div>

        <div className={styles.progressTrack}>
          <span
            className={styles.progressBar}
            style={{ animationDuration: `${phase.durationMs}ms` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};

export default BingoShowPromoModal;

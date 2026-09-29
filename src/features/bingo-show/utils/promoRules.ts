/**
 * Regras de negócio das promoções (spec do cliente). Só estes campos contam:
 *  - `typepromote`: IMAGE | VIDEO | YOUTUBE | QRCODE | API. null/outro → não aparece.
 *  - `order`: ordem da sequência (null → vai para o fim, na ordem recebida).
 *  - `horario` ("15:00"): a promoção aparece SÓ naquele minuto, passando na frente
 *    de qualquer outra, uma vez. Fora dele, não entra na sequência.
 *  - `timer`: segundos em tela (null → padrão de 10s).
 * `priority`, `unique` e os demais campos são ignorados.
 */
import type { Promotion } from '@/contexts/SSEContext';

export type PromoType = 'IMAGE' | 'VIDEO' | 'YOUTUBE' | 'QRCODE' | 'API';

const TYPES: PromoType[] = ['IMAGE', 'VIDEO', 'YOUTUBE', 'QRCODE', 'API'];

export function promoType(p: Promotion): PromoType | null {
  const t = String(p.typepromote ?? '').trim().toUpperCase();
  return (TYPES as string[]).includes(t) ? (t as PromoType) : null;
}

/** "15:00" / "15h00" / "9:05" → minutos do dia. Inválido/vazio → null. */
export function scheduleMinute(horario: string | null | undefined): number | null {
  const m = String(horario ?? '').match(/(\d{1,2})\s*[:hH]\s*(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

/** Chave da ocorrência de hoje ("id@2026-09-29 15:00"), para abrir só uma vez. */
export function scheduleOccurrenceKey(p: Promotion, now: Date = new Date()): string {
  const d = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return `${p.id}@${d} ${p.horario}`;
}

/** Promoções com horário que batem com o minuto atual. */
export function dueScheduled(promos: Promotion[], now: Date = new Date()): Promotion[] {
  const cur = now.getHours() * 60 + now.getMinutes();
  return promos.filter((p) => promoType(p) && scheduleMinute(p.horario) === cur);
}

/** Sequência normal: tipo válido, SEM horário (horário preenchido — mesmo num
 * formato não reconhecido — só vale no minuto dele), ordenada por `order`. */
export function buildRotation(promos: Promotion[]): Promotion[] {
  return promos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => promoType(p) && !String(p.horario ?? '').trim())
    .sort((a, b) => {
      const oa = typeof a.p.order === 'number' ? a.p.order : Number.POSITIVE_INFINITY;
      const ob = typeof b.p.order === 'number' ? b.p.order : Number.POSITIVE_INFINITY;
      return oa === ob ? a.i - b.i : oa - ob;
    })
    .map(({ p }) => p);
}

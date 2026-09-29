/**
 * Regras de negócio das promoções (definidas com o cliente):
 *  - `horario`: JANELA de exibição. "18:00-22:00" (ou "18:00 às 22:00") → só dentro
 *    do intervalo (janela que passa da meia-noite também vale). Um horário só
 *    ("18:00") → a partir dele até o fim do dia. null/vazio → sempre.
 *  - `priority: true`: abre o ciclo; as demais seguem na ordem recebida.
 *  - `unique: true`: uma vez por DIA em cada TV (localStorage, zera à meia-noite).
 */
import type { Promotion } from '@/contexts/SSEContext';

const UNIQUE_KEY_PREFIX = 'bingo_promo_unique_shown:';

function minutesOf(h: string, m: string): number {
  return Number(h) * 60 + Number(m);
}

/** `true` se a promoção pode aparecer agora pelo `horario`. Formato que não dá
 * para entender não bloqueia a promoção (melhor exibir do que sumir por engano). */
export function isWithinSchedule(horario: string | null | undefined, now: Date = new Date()): boolean {
  if (!horario || !String(horario).trim()) return true;
  const times = [...String(horario).matchAll(/(\d{1,2})[:h](\d{2})/g)];
  if (times.length === 0) return true;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = minutesOf(times[0]![1]!, times[0]![2]!);
  if (times.length === 1) return cur >= start;
  const end = minutesOf(times[1]![1]!, times[1]![2]!);
  return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
}

function todayKey(now: Date = new Date()): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return UNIQUE_KEY_PREFIX + d;
}

function readUniqueShown(): Set<string> {
  try {
    const raw = localStorage.getItem(todayKey());
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Marca uma promoção `unique` como exibida hoje nesta TV (e limpa dias antigos). */
export function markUniqueShown(id: string): void {
  try {
    const key = todayKey();
    const set = readUniqueShown();
    set.add(id);
    localStorage.setItem(key, JSON.stringify([...set]));
    Object.keys(localStorage)
      .filter((k) => k.startsWith(UNIQUE_KEY_PREFIX) && k !== key)
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // sem localStorage: a promoção única pode repetir — não quebra o ciclo
  }
}

/** Lista do ciclo: filtra por horário e por `unique` já exibida hoje; prioridade
 * na frente, mantendo a ordem recebida dentro de cada grupo. */
export function buildPromoCycle(promos: Promotion[], now: Date = new Date()): Promotion[] {
  const shown = readUniqueShown();
  const eligible = promos.filter((p) => isWithinSchedule(p.horario, now) && !(p.unique && shown.has(p.id)));
  return [...eligible.filter((p) => p.priority), ...eligible.filter((p) => !p.priority)];
}

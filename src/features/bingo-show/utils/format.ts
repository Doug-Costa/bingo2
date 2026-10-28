/**
 * format.ts — Helpers de formatação para dados REAIS (SSE) do Bingo Show V2.
 */

export function formatGs(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  return `GS. ${n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Moeda de exibição: `defaultCoin` do tema recebido no PIN ou, sem ele, a do
 * perfil do tema (Paraguay → guarani). Todas as telas usam formatBrl/formatMoney
 * e mudam juntas. Código ISO (BRL, PYG, USD...). */
export type MoneyCurrency = 'BRL' | 'PYG' | (string & {});
let moneyCurrency: MoneyCurrency = 'BRL';

export function setMoneyCurrency(c: MoneyCurrency): void {
  moneyCurrency = c;
}

export function getMoneyCurrency(): MoneyCurrency {
  return moneyCurrency;
}

/** Valor formatado na moeda atual: "R$ 1.250,00" ou "₲ 1.250" (guarani sem centavos).
 * O número é o mesmo que chega do backend — sem conversão. */
export function formatMoney(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  if (moneyCurrency === 'PYG') {
    return `₲ ${Math.round(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  }
  if (moneyCurrency !== 'BRL') {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moneyCurrency }).format(n);
    } catch {
      // código desconhecido: cai no real
    }
  }
  return `R$ ${n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Mantido pelo nome histórico: formata na moeda atual (ver formatMoney). */
export function formatBrl(value: number | undefined | null): string {
  return formatMoney(value);
}

export function parseBrl(value: string | undefined | null): number {
  if (!value) {
    return 0;
  }
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function formatDrawDate(iso: string | null | undefined): string {
  if (!iso) {
    return '--/--/----';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '--/--/----';
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDrawTime(iso: string | null | undefined): string {
  if (!iso) {
    return '--:--';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '--:--';
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

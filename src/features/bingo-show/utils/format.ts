/**
 * format.ts — Helpers de formatação para dados REAIS (SSE) do Bingo Show V2.
 */

/** Formatadores pt-BR guardados por nº de casas decimais. `toLocaleString` com
 * opções cria um Intl.NumberFormat novo a CADA chamada (caro, mais ainda na
 * WebView antiga da TV) — e os valores são formatados a cada bola e a cada passo
 * da contagem do popup. Aqui cada formatador é criado uma vez. */
const ptNumberFormats = new Map<string, Intl.NumberFormat>();
export function formatNumberPt(n: number, minDecimals: number, maxDecimals = minDecimals): string {
  const key = `${minDecimals}:${maxDecimals}`;
  let f = ptNumberFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals });
    ptNumberFormats.set(key, f);
  }
  return f.format(n);
}

const currencyFormats = new Map<string, Intl.NumberFormat | null>();

export function formatGs(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  return `GS. ${formatNumberPt(n, 2)}`;
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

/** Valor formatado na moeda atual: "R$ 1.250,00" ou "Gs. 1.250" (guarani sem centavos).
 * O número é o mesmo que chega do backend — sem conversão. */
export function formatMoney(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  if (moneyCurrency === 'PYG') {
    return `Gs. ${formatNumberPt(Math.round(n), 0)}`;
  }
  if (moneyCurrency !== 'BRL') {
    let f = currencyFormats.get(moneyCurrency);
    if (f === undefined) {
      try {
        f = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moneyCurrency });
      } catch {
        f = null; // código desconhecido: cai no real
      }
      currencyFormats.set(moneyCurrency, f);
    }
    if (f) return f.format(n);
  }
  return `R$ ${formatNumberPt(n, 2)}`;
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

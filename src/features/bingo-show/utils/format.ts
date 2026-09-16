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

export function formatBrl(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  return `R$ ${n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

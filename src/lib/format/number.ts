/**
 * Postgres `numeric` columns can arrive through PostgREST as either a JSON
 * number or a string (large/precise values, or comma-decimal source data
 * from the ingestion pipeline) - every consumer must go through this rather
 * than assuming `number`.
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** currency is free text from the game save - never assume a fixed ISO code. */
export function formatCurrency(value: unknown, currency: string | null | undefined): string {
  const n = toNumber(value);
  if (n === null) return "-";
  const raw = currency?.trim();

  if (raw) {
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: raw.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      // Not a valid ISO 4217 code - prefix the raw text instead of guessing.
      return `${raw} ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n)}`;
    }
  }

  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(value: unknown, decimals = 1): string {
  const n = toNumber(value);
  if (n === null) return "-";
  return `${n.toFixed(decimals)}%`;
}

export function formatInteger(value: unknown): string {
  const n = toNumber(value);
  if (n === null) return "-";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

export function formatSigned(value: unknown): string {
  const n = toNumber(value);
  if (n === null) return "-";
  const rounded = Math.round(n);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

/**
 * Read-time dedupe rule (documented, never mutates source data): prefer
 * transfer_id; when absent/blank, fall back to a composite key of
 * player_id+origin+destination+direction+type+date+value. Mirrors the SQL
 * view vw_fc26_transfer_summary's dedupe_key exactly.
 */
export interface DedupableTransfer {
  transfer_id: string | null;
  player_id: string | null;
  origin_team_id: string | null;
  destination_team_id: string | null;
  transfer_direction: string | null;
  transfer_type: string | null;
  game_date: string | null;
  transfer_value: unknown;
  updated_at?: string;
}

export function transferDedupeKey(t: DedupableTransfer): string {
  if (t.transfer_id && t.transfer_id.trim() !== "") return t.transfer_id;
  return [
    t.player_id,
    t.origin_team_id,
    t.destination_team_id,
    t.transfer_direction,
    t.transfer_type,
    t.game_date,
    t.transfer_value,
  ]
    .map((v) => v ?? "")
    .join("|");
}

export function dedupeTransfers<T extends DedupableTransfer>(rows: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    const key = transferDedupeKey(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      continue;
    }
    const existingTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
    const rowTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if (rowTime > existingTime) byKey.set(key, row);
  }
  return Array.from(byKey.values());
}

export function isTransferIn(direction: string | null): boolean {
  return /^(in|entrada|compra)$/i.test((direction ?? "").trim());
}

export function isTransferOut(direction: string | null): boolean {
  return /^(out|saida|saída|venda)$/i.test((direction ?? "").trim());
}

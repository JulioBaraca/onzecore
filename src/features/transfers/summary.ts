import { toNumber } from "@/lib/format/number";
import { isTransferIn, isTransferOut, type DedupableTransfer } from "@/lib/dedupe/transfers";

/**
 * Client-safe module: types and pure functions only, no supabase/server
 * import. TransfersView (a Client Component) needs TransferRow and
 * summarizeTransfers - importing them from queries.ts would pull
 * next/headers into the client bundle since that file also exports the
 * server-only getTransfers().
 */
export interface TransferRow extends DedupableTransfer {
  season: string | null;
  player_name: string | null;
  origin_team_name: string | null;
  destination_team_name: string | null;
  loan: string | null;
}

export interface TransfersSummary {
  transfersIn: number;
  transfersOut: number;
  grossSpend: number;
  grossIncome: number;
  netBalance: number;
}

export function summarizeTransfers(rows: TransferRow[]): TransfersSummary {
  let transfersIn = 0;
  let transfersOut = 0;
  let grossSpend = 0;
  let grossIncome = 0;

  for (const row of rows) {
    const value = toNumber(row.transfer_value) ?? 0;
    if (isTransferIn(row.transfer_direction)) {
      transfersIn += 1;
      grossSpend += value;
    } else if (isTransferOut(row.transfer_direction)) {
      transfersOut += 1;
      grossIncome += value;
    }
  }

  return { transfersIn, transfersOut, grossSpend, grossIncome, netBalance: grossIncome - grossSpend };
}

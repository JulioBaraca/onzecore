import { createClient } from "@/lib/supabase/server";
import { dedupeTransfers } from "@/lib/dedupe/transfers";
import type { TransferRow } from "@/features/transfers/summary";

/** Returns every deduped transfer for the career - filtering to just the user's team is a client-side toggle (see TransfersView). */
export async function getTransfers(careerId: string): Promise<TransferRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fc26_transferencias")
    .select(
      "transfer_id, season, game_date, player_id, player_name, origin_team_id, origin_team_name, destination_team_id, destination_team_name, transfer_direction, transfer_type, transfer_value, loan, updated_at",
    )
    .eq("career_id", careerId)
    .order("game_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load transfers: ${error.message}`);
  }

  return dedupeTransfers((data ?? []) as unknown as TransferRow[]);
}

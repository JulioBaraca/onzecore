import { createClient } from "@/lib/supabase/server";
import { positionSortIndex } from "@/lib/domain/position-order";

export interface SquadPlayerRow {
  player_id: string | null;
  player_name: string | null;
  position: string | null;
  age: unknown;
  overall: unknown;
  potential: unknown;
  value: unknown;
  wage: unknown;
  contract_end: string | null;
  loan_status: string | null;
  injury_status: string | null;
  season_appearances: unknown;
  season_goals: unknown;
  season_assists: unknown;
  season_avg_rating: unknown;
  promovido_base: boolean | null;
}

export async function getSquad(careerId: string): Promise<SquadPlayerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_fc26_current_squad")
    .select(
      "player_id, player_name, position, age, overall, potential, value, wage, contract_end, loan_status, injury_status, season_appearances, season_goals, season_assists, season_avg_rating, promovido_base",
    )
    .eq("career_id", careerId);

  if (error) {
    throw new Error(`Failed to load squad: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as SquadPlayerRow[];
  return rows.sort((a, b) => positionSortIndex(a.position) - positionSortIndex(b.position));
}

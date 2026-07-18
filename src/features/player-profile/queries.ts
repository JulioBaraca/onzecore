import { createClient } from "@/lib/supabase/server";

export interface PlayerBio {
  player_id: string | null;
  player_name: string | null;
  position: string | null;
  age: unknown;
  overall: unknown;
  potential: unknown;
  value: unknown;
  wage: unknown;
  contract_end: string | null;
  birthdate: string | null;
  shirt_number: string | null;
  injury_status: string | null;
  injury_days_remaining: unknown;
  injury_severity: string | null;
  overall_inicial_carreira: unknown;
  evolucao_overall_carreira: unknown;
  overall_inicial_temporada: unknown;
  evolucao_overall_temporada: unknown;
}

export interface PlayerSeasonSummaryRow {
  season: string | null;
  team_name: string | null;
  appearances: unknown;
  goals: unknown;
  assists: unknown;
  average_rating: unknown;
  yellow_cards: unknown;
  red_cards: unknown;
}

export async function getPlayerBio(careerId: string, playerId: string): Promise<PlayerBio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_fc26_current_squad")
    .select(
      "player_id, player_name, position, age, overall, potential, value, wage, contract_end, birthdate, shirt_number, injury_status, injury_days_remaining, injury_severity, overall_inicial_carreira, evolucao_overall_carreira, overall_inicial_temporada, evolucao_overall_temporada",
    )
    .eq("career_id", careerId)
    .eq("player_id", playerId)
    .maybeSingle();

  return (data as unknown as PlayerBio | null) ?? null;
}

export async function getPlayerSeasonHistory(
  careerId: string,
  playerId: string,
): Promise<PlayerSeasonSummaryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_fc26_player_season_summary")
    .select("season, team_name, appearances, goals, assists, average_rating, yellow_cards, red_cards")
    .eq("career_id", careerId)
    .eq("player_id", playerId)
    .order("season", { ascending: false });

  return (data ?? []) as unknown as PlayerSeasonSummaryRow[];
}

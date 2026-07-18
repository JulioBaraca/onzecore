import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format/number";

export interface YouthPlayerRow {
  save_id: string;
  player_id: string | null;
  player_name: string | null;
  position: string | null;
  age: unknown;
  overall: unknown;
  potential: unknown;
  academy_status: string | null;
  promoted_to_first_team: boolean | null;
  exit_date: string | null;
  is_user_youth_team: string | null;
  updated_at?: string;
}

export interface YouthSummary {
  totalPlayers: number;
  avgOverall: number | null;
  avgPotential: number | null;
  avgAge: number | null;
  promotedCount: number;
  inObservation: number;
  inDevelopment: number;
  readyForPromotion: number;
  departedCount: number;
}

/**
 * Career-wide (no save_id filter): fc26_categoria_base can lag/lead the
 * save resolved from fc26_elenco (same class of issue fixed in migrations
 * 021/022 for the squad), so this reads every row for the career and keeps
 * only the most recently updated row per player.
 */
export async function getYouthPlayers(careerId: string): Promise<YouthPlayerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fc26_categoria_base")
    .select(
      "save_id, player_id, player_name, position, age, overall, potential, academy_status, promoted_to_first_team, exit_date, is_user_youth_team, updated_at",
    )
    .eq("career_id", careerId);

  if (error) {
    throw new Error(`Failed to load youth academy: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as YouthPlayerRow[];
  const byPlayer = new Map<string, YouthPlayerRow>();
  for (const row of rows) {
    const key = row.player_id ?? `${row.player_name}|${row.position}`;
    const existing = byPlayer.get(key);
    if (!existing || (row.updated_at ?? "") > (existing.updated_at ?? "")) {
      byPlayer.set(key, row);
    }
  }
  // is_user_youth_team distinguishes the user's own academy from other
  // clubs' youth rosters that land in the same table - only "TRUE" (the
  // field is text, not boolean, and can also be null) counts as ours.
  return Array.from(byPlayer.values()).filter((row) => (row.is_user_youth_team ?? "").toUpperCase() === "TRUE");
}

export function summarizeYouth(players: YouthPlayerRow[]): YouthSummary {
  const overalls = players.map((p) => toNumber(p.overall)).filter((v): v is number => v !== null);
  const potentials = players.map((p) => toNumber(p.potential)).filter((v): v is number => v !== null);
  const ages = players.map((p) => toNumber(p.age)).filter((v): v is number => v !== null);
  const avg = (values: number[]) => (values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null);

  return {
    totalPlayers: players.length,
    avgOverall: avg(overalls),
    avgPotential: avg(potentials),
    avgAge: avg(ages),
    promotedCount: players.filter((p) => p.promoted_to_first_team).length,
    inObservation: players.filter((p) => (p.academy_status ?? "").toUpperCase() === "OBSERVACAO").length,
    inDevelopment: players.filter((p) => (p.academy_status ?? "").toUpperCase() === "DESENVOLVIMENTO").length,
    readyForPromotion: players.filter((p) => (p.academy_status ?? "").toUpperCase() === "PRONTO_PROMOCAO").length,
    departedCount: players.filter((p) => p.exit_date).length,
  };
}

export interface YouthPlayerBio extends YouthPlayerRow {
  height: unknown;
  weight: unknown;
  nationality_id: string | null;
  wage: unknown;
  contract_end: string | null;
  preferred_foot: string | null;
  skill_moves: unknown;
  weak_foot: unknown;
  secondary_position1: string | null;
  secondary_position2: string | null;
}

export interface YouthAttributeRow {
  attribute_category: string | null;
  attribute_name: string | null;
  attribute_value: unknown;
}

/** Career + player scoped (no save_id param) - takes the most recently updated row for that player, whichever save it lives in. */
export async function getYouthPlayerBio(careerId: string, playerId: string): Promise<YouthPlayerBio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fc26_categoria_base")
    .select(
      "save_id, player_id, player_name, position, age, overall, potential, academy_status, promoted_to_first_team, exit_date, height, weight, nationality_id, wage, contract_end, preferred_foot, skill_moves, weak_foot, secondary_position1, secondary_position2, updated_at",
    )
    .eq("career_id", careerId)
    .eq("player_id", playerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as unknown as YouthPlayerBio | null) ?? null;
}

/** save_id here should come from the resolved bio row (bio.save_id), not the global current-save. */
export async function getYouthPlayerAttributes(
  careerId: string,
  saveId: string,
  playerId: string,
): Promise<YouthAttributeRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fc26_categoria_base_atributos")
    .select("attribute_category, attribute_name, attribute_value")
    .eq("career_id", careerId)
    .eq("save_id", saveId)
    .eq("player_id", playerId);

  return (data ?? []) as unknown as YouthAttributeRow[];
}

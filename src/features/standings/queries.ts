import { createClient } from "@/lib/supabase/server";

export interface StandingsRow {
  competition_id: string | null;
  competition_name: string | null;
  group_id: string | null;
  position: unknown;
  team_id: string | null;
  team_name: string | null;
  played: unknown;
  wins: unknown;
  draws: unknown;
  losses: unknown;
  goals_for: unknown;
  goals_against: unknown;
  goal_difference: unknown;
  points: unknown;
}

export interface StandingsGroup {
  competitionName: string;
  groupId: string | null;
  rows: StandingsRow[];
}

export async function getStandings(careerId: string, userTeamId: string | null): Promise<StandingsGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_fc26_current_standings")
    .select(
      "competition_id, competition_name, group_id, position, team_id, team_name, played, wins, draws, losses, goals_for, goals_against, goal_difference, points",
    )
    .eq("career_id", careerId);

  if (error) {
    throw new Error(`Failed to load standings: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as StandingsRow[];
  const groups = new Map<string, StandingsGroup>();

  for (const row of rows) {
    const key = `${row.competition_id ?? "?"}|${row.group_id ?? ""}`;
    if (!groups.has(key)) {
      groups.set(key, {
        competitionName: row.competition_name ?? "-",
        groupId: row.group_id,
        rows: [],
      });
    }
    groups.get(key)!.rows.push(row);
  }

  const allGroups = Array.from(groups.values()).map((g) => ({
    ...g,
    rows: [...g.rows].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)),
  }));

  // Only show competitions/groups the user's team actually appears in - a
  // career mode save can carry standings for competitions the user isn't
  // even part of (other divisions/cups), which aren't relevant here.
  const relevantGroups = userTeamId
    ? allGroups.filter((g) => g.rows.some((r) => r.team_id === userTeamId))
    : allGroups;

  return relevantGroups.sort((a, b) => a.competitionName.localeCompare(b.competitionName));
}

import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format/number";
import { computeMatchResult } from "@/lib/domain/match-result";
import type { MatchResult } from "@/components/dashboard/FormGuide";

export interface MatchRow {
  fixture_id: string | null;
  season: string | null;
  competition_name: string | null;
  match_date: string | null;
  match_date_sort: string | null;
  home_team_id: string | null;
  home_team_name: string | null;
  away_team_id: string | null;
  away_team_name: string | null;
  home_score: unknown;
  away_score: unknown;
  user_team_side: string | null;
  result: MatchResult | null;
}

export interface MatchesSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface RawMatchRow {
  fixture_id: string | null;
  season: string | null;
  competition_name: string | null;
  match_date: string | null;
  match_date_sort: string | null;
  home_team_id: string | null;
  home_team_name: string | null;
  away_team_id: string | null;
  away_team_name: string | null;
  home_score: unknown;
  away_score: unknown;
  user_team_side: string | null;
  updated_at: string | null;
}

/**
 * Matches are historical facts (a completed result doesn't change), so this
 * reads across every save for the career rather than only the resolved
 * "current" save - fc26_jogos rows can be split across saves that don't all
 * share the same save_id lineage (see migrations 021/022), and requiring an
 * exact save_id match hid real match history. Deduped by fixture_id
 * (fallback: home+away+date) keeping the most recently updated copy, then
 * optionally filtered to only fixtures involving the user's team.
 */
export async function getMatches(careerId: string, userTeamId: string | null): Promise<MatchRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fc26_jogos")
    .select(
      "fixture_id, season, competition_name, match_date, match_date_sort, home_team_id, home_team_name, away_team_id, away_team_name, home_score, away_score, user_team_side, updated_at",
    )
    .eq("career_id", careerId)
    .not("home_score", "is", null);

  if (error) {
    throw new Error(`Failed to load matches: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawMatchRow[];

  const byKey = new Map<string, RawMatchRow>();
  for (const row of rows) {
    const key = row.fixture_id?.trim() || `${row.home_team_id}|${row.away_team_id}|${row.match_date}`;
    const existing = byKey.get(key);
    if (!existing || (row.updated_at ?? "") > (existing.updated_at ?? "")) {
      byKey.set(key, row);
    }
  }

  let deduped = Array.from(byKey.values());
  if (userTeamId) {
    deduped = deduped.filter((m) => m.home_team_id === userTeamId || m.away_team_id === userTeamId);
  }
  deduped.sort((a, b) => (b.match_date_sort ?? "").localeCompare(a.match_date_sort ?? ""));

  return deduped.map((row) => ({
    fixture_id: row.fixture_id,
    season: row.season,
    competition_name: row.competition_name,
    match_date: row.match_date,
    match_date_sort: row.match_date_sort,
    home_team_id: row.home_team_id,
    home_team_name: row.home_team_name,
    away_team_id: row.away_team_id,
    away_team_name: row.away_team_name,
    home_score: row.home_score,
    away_score: row.away_score,
    user_team_side: row.user_team_side,
    result: computeMatchResult(row.home_score, row.away_score, row.user_team_side),
  }));
}

export function summarizeMatches(matches: MatchRow[]): MatchesSummary {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of matches) {
    if (m.result === null) continue;

    const side = (m.user_team_side ?? "").trim().toUpperCase();
    const isHome = side.startsWith("H") || side === "MANDANTE" || side === "CASA";
    const hs = toNumber(m.home_score) ?? 0;
    const as = toNumber(m.away_score) ?? 0;
    goalsFor += isHome ? hs : as;
    goalsAgainst += isHome ? as : hs;

    if (m.result === "V") wins += 1;
    else if (m.result === "E") draws += 1;
    else if (m.result === "D") losses += 1;
  }

  return { played: matches.length, wins, draws, losses, goalsFor, goalsAgainst };
}

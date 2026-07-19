import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format/number";
import { computeMatchResult, isHomeSide } from "@/lib/domain/match-result";
import { winRate as winRateFormula } from "@/lib/kpi/formulas";
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
 * (fallback: home+away+date) keeping the most recently updated copy.
 *
 * fc26_jogos carries the *entire round's* results, not just the user's game
 * (e.g. a Paulistão matchday syncs all 8 fixtures that day) - user_team_side
 * is only populated on the row that's actually the user's own match, so that
 * (not a team_id comparison, which every row in the round can equally
 * satisfy for one side or the other) is the real signal for "is this mine".
 */
export async function getMatches(careerId: string): Promise<MatchRow[]> {
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

  const deduped = Array.from(byKey.values()).filter((m) => m.user_team_side?.trim());
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

    const isHome = isHomeSide(m.user_team_side);
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

export interface MatchInsights {
  summary: {
    played: number;
    winRate: number | null;
    avgGoalsFor: number | null;
    avgGoalsAgainst: number | null;
    cleanSheets: number;
    biggestWin: { label: string; margin: number } | null;
    currentStreak: { result: MatchResult; count: number } | null;
  };
  resultsBreakdown: { key: MatchResult; value: number }[];
  goalsTimeline: { label: string; goalsFor: number; goalsAgainst: number }[];
  pointsTrend: { label: string; points: number }[];
  homeAway: { key: "home" | "away"; played: number; winRate: number | null }[];
  competitionBreakdown: { label: string; played: number; winRate: number | null }[];
}

function truncateLabel(label: string, max = 12): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * Derives season-level insights from the same MatchRow[] getMatches already
 * produces (chronological reversal happens here, not in getMatches, since
 * every other consumer wants most-recent-first).
 */
export function computeMatchInsights(matches: MatchRow[]): MatchInsights {
  const played = matches.length;
  const decided = matches.filter((m) => m.result !== null);
  const chronological = [...decided].reverse();

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;

  for (const m of decided) {
    const isHome = isHomeSide(m.user_team_side);
    const hs = toNumber(m.home_score) ?? 0;
    const as = toNumber(m.away_score) ?? 0;
    const gf = isHome ? hs : as;
    const ga = isHome ? as : hs;
    goalsFor += gf;
    goalsAgainst += ga;
    if (ga === 0) cleanSheets += 1;
    if (m.result === "V") wins += 1;
    else if (m.result === "E") draws += 1;
    else if (m.result === "D") losses += 1;
  }

  let biggestWin: { label: string; margin: number } | null = null;
  for (const m of decided) {
    if (m.result !== "V") continue;
    const isHome = isHomeSide(m.user_team_side);
    const hs = toNumber(m.home_score) ?? 0;
    const as = toNumber(m.away_score) ?? 0;
    const gf = isHome ? hs : as;
    const ga = isHome ? as : hs;
    const margin = gf - ga;
    if (!biggestWin || margin > biggestWin.margin) {
      const opponent = isHome ? m.away_team_name : m.home_team_name;
      biggestWin = { label: `${gf}-${ga} · ${opponent ?? "-"}`, margin };
    }
  }

  let currentStreak: { result: MatchResult; count: number } | null = null;
  for (const m of decided) {
    if (!currentStreak) {
      currentStreak = { result: m.result!, count: 1 };
    } else if (m.result === currentStreak.result) {
      currentStreak.count += 1;
    } else {
      break;
    }
  }

  const goalsTimeline = chronological.slice(-10).map((m) => {
    const isHome = isHomeSide(m.user_team_side);
    const hs = toNumber(m.home_score) ?? 0;
    const as = toNumber(m.away_score) ?? 0;
    const opponent = isHome ? m.away_team_name : m.home_team_name;
    return {
      label: truncateLabel(opponent ?? "-"),
      goalsFor: isHome ? hs : as,
      goalsAgainst: isHome ? as : hs,
    };
  });

  let cumulativePoints = 0;
  const pointsTrend = chronological.map((m, i) => {
    cumulativePoints += m.result === "V" ? 3 : m.result === "E" ? 1 : 0;
    return { label: `${i + 1}`, points: cumulativePoints };
  });

  const homeMatches = decided.filter((m) => isHomeSide(m.user_team_side));
  const awayMatches = decided.filter((m) => !isHomeSide(m.user_team_side));
  function sideStats(list: MatchRow[]) {
    const w = list.filter((m) => m.result === "V").length;
    const d = list.filter((m) => m.result === "E").length;
    return { played: list.length, winRate: winRateFormula(w, d, list.length) };
  }
  const homeAway: MatchInsights["homeAway"] = [
    { key: "home", ...sideStats(homeMatches) },
    { key: "away", ...sideStats(awayMatches) },
  ];

  const byCompetition = new Map<string, MatchRow[]>();
  for (const m of decided) {
    const comp = m.competition_name?.trim() || "-";
    if (!byCompetition.has(comp)) byCompetition.set(comp, []);
    byCompetition.get(comp)!.push(m);
  }
  const competitionBreakdown = Array.from(byCompetition.entries())
    .map(([label, list]) => {
      const w = list.filter((m) => m.result === "V").length;
      const d = list.filter((m) => m.result === "E").length;
      return { label, played: list.length, winRate: winRateFormula(w, d, list.length) };
    })
    .sort((a, b) => b.played - a.played)
    .slice(0, 6);

  return {
    summary: {
      played,
      winRate: winRateFormula(wins, draws, decided.length),
      avgGoalsFor: decided.length > 0 ? goalsFor / decided.length : null,
      avgGoalsAgainst: decided.length > 0 ? goalsAgainst / decided.length : null,
      cleanSheets,
      biggestWin,
      currentStreak,
    },
    resultsBreakdown: [
      { key: "V", value: wins },
      { key: "E", value: draws },
      { key: "D", value: losses },
    ],
    goalsTimeline,
    pointsTrend,
    homeAway,
    competitionBreakdown,
  };
}

export interface UpcomingFixture {
  fixtureId: string | null;
  matchDate: string | null;
  matchDateSort: string | null;
  daysUntilMatch: number | null;
  competitionName: string | null;
  opponentTeamName: string;
  isHome: boolean;
}

interface RawScheduleRow {
  save_id: string;
  fixture_id: string | null;
  match_date: string | null;
  match_date_sort: string | null;
  days_until_match: unknown;
  competition_name: string | null;
  opponent_team_name: string | null;
  user_team_side: string | null;
  exported_at: string | null;
}

/**
 * fc26_agenda_jogos carries the full league calendar (every team's
 * fixtures), not just the user's - filtered here by user_team_id. Read
 * career-wide rather than through vw_fc26_current_schedule (which requires
 * an exact save_id match against the save resolved from fc26_elenco): a
 * sync can update fc26_elenco without touching fc26_agenda_jogos, and an
 * exact-match join then silently returns zero rows (same class of issue
 * already fixed for fc26_jogos/fc26_categoria_base). Instead, the most
 * recently exported save_id actually present in this table is resolved
 * directly from its own exported_at. A handful of the user's own fixtures
 * also come through with a still-undecided opponent (e.g. a knockout slot
 * whose bracket hasn't resolved yet); those are dropped rather than
 * surfaced as a blank matchup.
 */
export async function getUpcomingFixtures(careerId: string, userTeamId: string | null): Promise<UpcomingFixture[]> {
  const supabase = await createClient();
  let query = supabase
    .from("fc26_agenda_jogos")
    .select(
      "save_id, fixture_id, match_date, match_date_sort, days_until_match, competition_name, opponent_team_name, user_team_side, exported_at",
    )
    .eq("career_id", careerId);
  if (userTeamId) {
    query = query.eq("user_team_id", userTeamId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load upcoming fixtures: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawScheduleRow[];
  if (rows.length === 0) return [];

  const latestSaveId = [...rows].sort((a, b) => (b.exported_at ?? "").localeCompare(a.exported_at ?? ""))[0].save_id;
  const currentRows = rows.filter((row) => row.save_id === latestSaveId);

  const byKey = new Map<string, RawScheduleRow>();
  for (const row of currentRows) {
    if (!row.opponent_team_name?.trim()) continue;
    const key = `${row.match_date}|${row.competition_name}`;
    if (!byKey.has(key)) {
      byKey.set(key, row);
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => (a.match_date_sort ?? "").localeCompare(b.match_date_sort ?? ""))
    .map((row) => ({
      fixtureId: row.fixture_id,
      matchDate: row.match_date,
      matchDateSort: row.match_date_sort,
      daysUntilMatch: toNumber(row.days_until_match),
      competitionName: row.competition_name,
      opponentTeamName: row.opponent_team_name!.trim(),
      isHome: isHomeSide(row.user_team_side),
    }));
}

/**
 * The in-game calendar date as of the last sync - unrelated to the
 * real-world date. Reads fc26_agenda_jogos directly (see getUpcomingFixtures
 * for why) rather than through vw_fc26_current_schedule.
 */
export async function getCurrentGameDate(careerId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fc26_agenda_jogos")
    .select("current_game_date, exported_at")
    .eq("career_id", careerId)
    .order("exported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as { current_game_date: string | null } | null)?.current_game_date ?? null;
}

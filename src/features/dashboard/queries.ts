import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format/number";
import { getMatches, getUpcomingFixtures, type UpcomingFixture } from "@/features/matches/queries";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { MatchResult } from "@/components/dashboard/FormGuide";
import type { StandingsRow } from "@/components/dashboard/StandingsMiniTable";
import type { AlertItem } from "@/components/dashboard/AlertPanel";

interface SquadHighlight {
  playerName: string;
  amount: number;
}

export interface DashboardData {
  standingsWindow: StandingsRow[];
  recentForm: MatchResult[];
  upcomingMatches: UpcomingFixture[];
  finance: {
    currency: string | null;
    clubBalance: unknown;
    transferBudget: unknown;
    wageBudget: unknown;
    currentWeeklyWages: unknown;
    transferNetBalance: unknown;
  } | null;
  squad: {
    total: number;
    topScorer: SquadHighlight | null;
    topAssister: SquadHighlight | null;
    bestRated: SquadHighlight | null;
    mostValuable: SquadHighlight | null;
    totalValue: number;
    weeklyWageBill: number;
    contractsEndingSoon: number;
  };
  injuries: {
    total: number;
    severe: number;
  };
  alerts: AlertItem[];
}

function pickTop<T extends Record<string, unknown>>(
  rows: T[],
  field: keyof T,
  nameField: keyof T,
): SquadHighlight | null {
  let best: { name: string; amount: number } | null = null;
  for (const row of rows) {
    const amount = toNumber(row[field]);
    if (amount === null) continue;
    if (!best || amount > best.amount) {
      best = { name: (row[nameField] as string | null) ?? "-", amount };
    }
  }
  return best ? { playerName: best.name, amount: best.amount } : null;
}

export async function getDashboardData(
  careerId: string,
  saveId: string,
  teamId: string | null,
  dict: Dictionary,
): Promise<DashboardData> {
  const supabase = await createClient();

  const [standingsRes, recentMatches, upcomingFixtures, financeRes, squadRes, injuriesRes] = await Promise.all([
    supabase
      .from("fc26_classificacao")
      .select("position, team_id, team_name, played, points, goal_difference, competition_id, group_id")
      .eq("career_id", careerId)
      .eq("save_id", saveId),
    getMatches(careerId, teamId),
    getUpcomingFixtures(careerId, teamId),
    supabase
      .from("vw_fc26_current_finance")
      .select("currency, club_balance, transfer_budget, wage_budget, current_weekly_wages, transfer_net_balance")
      .eq("career_id", careerId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vw_fc26_current_squad")
      .select("player_name, season_goals, season_assists, season_avg_rating, value, wage, contract_end")
      .eq("career_id", careerId),
    supabase
      .from("vw_fc26_current_injuries")
      .select("injury_severity")
      .eq("career_id", careerId),
  ]);

  // Standings window: 2 above / 2 below the user's team, within its own
  // competition + group (a career can span multiple competitions/groups).
  type StandingsRawRow = {
    position: unknown;
    team_id: string | null;
    team_name: string | null;
    played: unknown;
    points: unknown;
    goal_difference: unknown;
    competition_id: string | null;
    group_id: string | null;
  };
  const standingsRows = (standingsRes.data ?? []) as unknown as StandingsRawRow[];
  const userRow = teamId ? standingsRows.find((r) => r.team_id === teamId) : undefined;
  let standingsWindow: StandingsRow[] = [];
  if (userRow) {
    const sameGroup = standingsRows
      .filter((r) => r.competition_id === userRow.competition_id && r.group_id === userRow.group_id)
      .sort((a, b) => (toNumber(a.position) ?? 0) - (toNumber(b.position) ?? 0));
    const idx = sameGroup.findIndex((r) => r.team_id === teamId);
    const start = Math.max(0, idx - 2);
    const end = Math.min(sameGroup.length, idx + 3);
    standingsWindow = sameGroup.slice(start, end).map((r) => ({
      position: r.position,
      teamName: r.team_name,
      played: r.played,
      points: r.points,
      goalDifference: r.goal_difference,
      isUserTeam: r.team_id === teamId,
    }));
  }

  const recentForm = recentMatches
    .slice(0, 6)
    .map((m) => m.result)
    .filter((r): r is MatchResult => r !== null)
    .reverse();

  const upcomingMatches = upcomingFixtures.slice(0, 5);

  const financeRow = financeRes.data as unknown as {
    currency: string | null;
    club_balance: unknown;
    transfer_budget: unknown;
    wage_budget: unknown;
    current_weekly_wages: unknown;
    transfer_net_balance: unknown;
  } | null;

  type SquadRow = {
    player_name: string | null;
    season_goals: unknown;
    season_assists: unknown;
    season_avg_rating: unknown;
    value: unknown;
    wage: unknown;
    contract_end: string | null;
  };
  const squadRows = (squadRes.data ?? []) as unknown as SquadRow[];

  const now = new Date();
  const sixMonthsOut = new Date(now);
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
  const contractsEndingSoon = squadRows.filter((r) => {
    if (!r.contract_end) return false;
    const d = new Date(r.contract_end);
    return !Number.isNaN(d.getTime()) && d >= now && d <= sixMonthsOut;
  }).length;

  const totalValue = squadRows.reduce((sum, r) => sum + (toNumber(r.value) ?? 0), 0);
  const weeklyWageBill = squadRows.reduce((sum, r) => sum + (toNumber(r.wage) ?? 0), 0);

  const injuriesRows = (injuriesRes.data ?? []) as unknown as { injury_severity: string | null }[];
  const severe = injuriesRows.filter((r) =>
    /grave|severe|alta/i.test(r.injury_severity ?? ""),
  ).length;

  const alerts: AlertItem[] = [];
  if (contractsEndingSoon > 0) {
    alerts.push({
      tone: "warning",
      message: formatTemplate(dict.dashboard.alertContractsEnding, { count: contractsEndingSoon }),
    });
  }
  if (financeRow && toNumber(financeRow.current_weekly_wages) !== null && toNumber(financeRow.wage_budget) !== null) {
    const cur = toNumber(financeRow.current_weekly_wages) ?? 0;
    const budget = toNumber(financeRow.wage_budget) ?? 0;
    if (budget > 0 && cur > budget) {
      alerts.push({ tone: "critical", message: dict.dashboard.alertWageBudgetExceeded });
    }
  }
  if (injuriesRows.length > 0) {
    alerts.push({
      tone: severe > 0 ? "critical" : "warning",
      message:
        severe > 0
          ? formatTemplate(dict.dashboard.alertInjuriesWithSevere, { count: injuriesRows.length, severe })
          : formatTemplate(dict.dashboard.alertInjuriesPlain, { count: injuriesRows.length }),
    });
  }

  return {
    standingsWindow,
    recentForm,
    upcomingMatches,
    finance: financeRow
      ? {
          currency: financeRow.currency,
          clubBalance: financeRow.club_balance,
          transferBudget: financeRow.transfer_budget,
          wageBudget: financeRow.wage_budget,
          currentWeeklyWages: financeRow.current_weekly_wages,
          transferNetBalance: financeRow.transfer_net_balance,
        }
      : null,
    squad: {
      total: squadRows.length,
      topScorer: pickTop(squadRows, "season_goals", "player_name"),
      topAssister: pickTop(squadRows, "season_assists", "player_name"),
      bestRated: pickTop(squadRows, "season_avg_rating", "player_name"),
      mostValuable: pickTop(squadRows, "value", "player_name"),
      totalValue,
      weeklyWageBill,
      contractsEndingSoon,
    },
    injuries: {
      total: injuriesRows.length,
      severe,
    },
    alerts,
  };
}

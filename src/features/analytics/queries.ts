import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format/number";
import { goalParticipation, potentialGap } from "@/lib/kpi/formulas";

export interface SquadAnalyticsPlayer {
  player_name: string | null;
  position: string | null;
  age: unknown;
  overall: unknown;
  potential: unknown;
  wage: unknown;
  season_goals: unknown;
  season_assists: unknown;
  season_avg_rating: unknown;
  season_appearances: unknown;
}

export interface DepthPlayer {
  player_name: string | null;
  overall: unknown;
  potential: unknown;
}

export interface DepthRow {
  position: string;
  starter: DepthPlayer | null;
  backup: DepthPlayer | null;
  thirdOption: DepthPlayer | null;
  avgOverall: number | null;
  highestPotential: number | null;
  groupSize: number;
  risk: "high" | "medium" | "low";
}

export interface SquadOverview {
  totalPlayers: number;
  avgOverall: number | null;
  avgPotential: number | null;
  avgAge: number | null;
  totalWeeklyWages: number;
}

export interface AgeBandRow {
  label: string;
  count: number;
  avgOverall: number | null;
  avgPotential: number | null;
}

export interface PotentialGapRow {
  playerName: string;
  position: string | null;
  overall: number;
  potential: number;
  gap: number;
}

export interface GoalParticipationRow {
  playerName: string;
  position: string | null;
  goals: number;
  assists: number;
  participationPct: number;
}

export interface WageEfficiencyRow {
  playerName: string;
  position: string | null;
  wage: number;
  rating: number;
  ratingPerThousandWage: number;
}

export interface AnalyticsData {
  overview: SquadOverview;
  ageBands: AgeBandRow[];
  topPotentialGap: PotentialGapRow[];
  topGoalParticipation: GoalParticipationRow[];
  bestWageEfficiency: WageEfficiencyRow[];
  depth: DepthRow[];
}

async function getSquadPlayers(careerId: string): Promise<SquadAnalyticsPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_fc26_current_squad")
    .select(
      "player_name, position, age, overall, potential, wage, season_goals, season_assists, season_avg_rating, season_appearances",
    )
    .eq("career_id", careerId);

  if (error) {
    throw new Error(`Failed to load squad analytics: ${error.message}`);
  }
  return (data ?? []) as unknown as SquadAnalyticsPlayer[];
}

const AGE_BANDS: { label: string; min: number; max: number }[] = [
  { label: "< 21", min: 0, max: 20 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26-29", min: 26, max: 29 },
  { label: "30+", min: 30, max: 999 },
];

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export async function getAnalyticsData(careerId: string): Promise<AnalyticsData> {
  const players = await getSquadPlayers(careerId);

  const overalls = players.map((p) => toNumber(p.overall)).filter((v): v is number => v !== null);
  const potentials = players.map((p) => toNumber(p.potential)).filter((v): v is number => v !== null);
  const ages = players.map((p) => toNumber(p.age)).filter((v): v is number => v !== null);
  const totalWeeklyWages = players.reduce((sum, p) => sum + (toNumber(p.wage) ?? 0), 0);

  const overview: SquadOverview = {
    totalPlayers: players.length,
    avgOverall: average(overalls),
    avgPotential: average(potentials),
    avgAge: average(ages),
    totalWeeklyWages,
  };

  const ageBands: AgeBandRow[] = AGE_BANDS.map((band) => {
    const inBand = players.filter((p) => {
      const age = toNumber(p.age);
      return age !== null && age >= band.min && age <= band.max;
    });
    return {
      label: band.label,
      count: inBand.length,
      avgOverall: average(inBand.map((p) => toNumber(p.overall)).filter((v): v is number => v !== null)),
      avgPotential: average(inBand.map((p) => toNumber(p.potential)).filter((v): v is number => v !== null)),
    };
  });

  const topPotentialGap: PotentialGapRow[] = players
    .map((p) => {
      const overall = toNumber(p.overall);
      const potential = toNumber(p.potential);
      const gap = potentialGap(potential, overall);
      if (overall === null || potential === null || gap === null) return null;
      return { playerName: p.player_name ?? "-", position: p.position, overall, potential, gap };
    })
    .filter((row): row is PotentialGapRow => row !== null && row.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  const teamTotalGoals = players.reduce((sum, p) => sum + (toNumber(p.season_goals) ?? 0), 0);
  const topGoalParticipation: GoalParticipationRow[] = players
    .map((p) => {
      const goals = toNumber(p.season_goals) ?? 0;
      const assists = toNumber(p.season_assists) ?? 0;
      const participation = goalParticipation(goals, assists, teamTotalGoals);
      if (participation === null || (goals === 0 && assists === 0)) return null;
      return { playerName: p.player_name ?? "-", position: p.position, goals, assists, participationPct: participation };
    })
    .filter((row): row is GoalParticipationRow => row !== null)
    .sort((a, b) => b.participationPct - a.participationPct)
    .slice(0, 5);

  const bestWageEfficiency: WageEfficiencyRow[] = players
    .map((p) => {
      const wage = toNumber(p.wage);
      const rating = toNumber(p.season_avg_rating);
      const appearances = toNumber(p.season_appearances) ?? 0;
      if (!wage || wage <= 0 || rating === null || appearances < 3) return null;
      return {
        playerName: p.player_name ?? "-",
        position: p.position,
        wage,
        rating,
        ratingPerThousandWage: (rating / wage) * 1000,
      };
    })
    .filter((row): row is WageEfficiencyRow => row !== null)
    .sort((a, b) => b.ratingPerThousandWage - a.ratingPerThousandWage)
    .slice(0, 5);

  const byPosition = new Map<string, DepthPlayer[]>();
  for (const row of players) {
    const position = row.position?.trim() || "-";
    if (!byPosition.has(position)) byPosition.set(position, []);
    byPosition.get(position)!.push({ player_name: row.player_name, overall: row.overall, potential: row.potential });
  }

  const depth: DepthRow[] = [];
  for (const [position, positionPlayers] of byPosition.entries()) {
    const sorted = [...positionPlayers].sort((a, b) => (toNumber(b.overall) ?? 0) - (toNumber(a.overall) ?? 0));
    const posOveralls = sorted.map((p) => toNumber(p.overall)).filter((v): v is number => v !== null);
    const posPotentials = sorted.map((p) => toNumber(p.potential)).filter((v): v is number => v !== null);

    depth.push({
      position,
      starter: sorted[0] ?? null,
      backup: sorted[1] ?? null,
      thirdOption: sorted[2] ?? null,
      avgOverall: average(posOveralls),
      highestPotential: posPotentials.length > 0 ? Math.max(...posPotentials) : null,
      groupSize: sorted.length,
      risk: sorted.length <= 1 ? "high" : sorted.length === 2 ? "medium" : "low",
    });
  }
  depth.sort((a, b) => b.groupSize - a.groupSize);

  return { overview, ageBands, topPotentialGap, topGoalParticipation, bestWageEfficiency, depth };
}

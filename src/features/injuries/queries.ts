import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format/number";

export interface InjuryRow {
  player_name: string | null;
  position: string | null;
  overall: unknown;
  injury_severity: string | null;
  injury_days_remaining: unknown;
}

export interface InjurySummary {
  total: number;
  averageDaysRemaining: number | null;
  mostSevere: InjuryRow | null;
  closestReturn: InjuryRow | null;
}

const SEVERITY_RANK = ["leve", "minor", "moderada", "moderate", "grave", "severe", "alta"];

function severityScore(severity: string | null): number {
  if (!severity) return -1;
  const idx = SEVERITY_RANK.findIndex((s) => severity.toLowerCase().includes(s));
  return idx;
}

export async function getInjuries(careerId: string): Promise<InjuryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_fc26_current_injuries")
    .select("player_name, position, overall, injury_severity, injury_days_remaining")
    .eq("career_id", careerId);

  if (error) {
    throw new Error(`Failed to load injuries: ${error.message}`);
  }
  return (data ?? []) as unknown as InjuryRow[];
}

export function summarizeInjuries(rows: InjuryRow[]): InjurySummary {
  if (rows.length === 0) {
    return { total: 0, averageDaysRemaining: null, mostSevere: null, closestReturn: null };
  }

  const days = rows.map((r) => toNumber(r.injury_days_remaining)).filter((d): d is number => d !== null);
  const averageDaysRemaining = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : null;

  const mostSevere = [...rows].sort((a, b) => severityScore(b.injury_severity) - severityScore(a.injury_severity))[0];
  const closestReturn = [...rows].sort(
    (a, b) => (toNumber(a.injury_days_remaining) ?? Infinity) - (toNumber(b.injury_days_remaining) ?? Infinity),
  )[0];

  return { total: rows.length, averageDaysRemaining, mostSevere, closestReturn };
}

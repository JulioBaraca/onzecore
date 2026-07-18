import { toNumber } from "@/lib/format/number";
import type { MatchResult } from "@/components/dashboard/FormGuide";

/** `user_team_side` vocabulary mixes English/Portuguese abbreviations and full words. */
export function isHomeSide(userTeamSide: string | null | undefined): boolean {
  const side = (userTeamSide ?? "").trim().toUpperCase();
  return side.startsWith("H") || side === "MANDANTE" || side === "CASA";
}

function isAwaySide(userTeamSide: string | null | undefined): boolean {
  const side = (userTeamSide ?? "").trim().toUpperCase();
  return side.startsWith("A") || side === "VISITANTE" || side === "FORA";
}

/**
 * Derives V/E/D directly from scores + side rather than trusting the
 * `user_result`/`completed` text columns, whose vocabulary (Portuguese vs
 * English, single-letter overlap between "Draw" and "Derrota") is
 * unconfirmed against real data. Scores and side are unambiguous.
 */
export function computeMatchResult(
  homeScore: unknown,
  awayScore: unknown,
  userTeamSide: string | null | undefined,
): MatchResult | null {
  const hs = toNumber(homeScore);
  const as = toNumber(awayScore);
  if (hs === null || as === null) return null;
  if (!isHomeSide(userTeamSide) && !isAwaySide(userTeamSide)) return null;

  const isHome = isHomeSide(userTeamSide);
  const userGoals = isHome ? hs : as;
  const opponentGoals = isHome ? as : hs;

  if (userGoals > opponentGoals) return "V";
  if (userGoals < opponentGoals) return "D";
  return "E";
}

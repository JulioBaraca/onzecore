import { toNumber } from "@/lib/format/number";
import { isHomeSide } from "@/lib/domain/match-result";
import type { MatchRow } from "@/features/matches/queries";
import type { UpcomingFixture } from "@/features/matches/queries";
import type { MatchResult } from "@/components/dashboard/FormGuide";

export interface CalendarEntry {
  date: string;
  competitionName: string | null;
  opponentName: string;
  isHome: boolean;
  status: "played" | "scheduled";
  result: MatchResult | null;
  homeScore: number | null;
  awayScore: number | null;
}

export function buildCalendarEntries(played: MatchRow[], upcoming: UpcomingFixture[]): CalendarEntry[] {
  const fromPlayed: CalendarEntry[] = played
    .filter((m) => m.match_date)
    .map((m) => {
      const isHome = isHomeSide(m.user_team_side);
      return {
        date: m.match_date as string,
        competitionName: m.competition_name,
        opponentName: (isHome ? m.away_team_name : m.home_team_name) ?? "-",
        isHome,
        status: "played",
        result: m.result,
        homeScore: toNumber(m.home_score),
        awayScore: toNumber(m.away_score),
      };
    });

  const fromUpcoming: CalendarEntry[] = upcoming
    .filter((f) => f.matchDate)
    .map((f) => ({
      date: f.matchDate as string,
      competitionName: f.competitionName,
      opponentName: f.opponentTeamName,
      isHome: f.isHome,
      status: "scheduled",
      result: null,
      homeScore: null,
      awayScore: null,
    }));

  return [...fromPlayed, ...fromUpcoming];
}

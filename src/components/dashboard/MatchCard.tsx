import { formatDate } from "@/lib/format/number";
import { formatTemplate } from "@/lib/i18n/format-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export interface UpcomingMatch {
  matchDate: string | null;
  daysUntilMatch: number | null;
  competitionName: string | null;
  opponentTeamName: string | null;
  userTeamSide: string | null;
}

export async function MatchCard({ match }: { match: UpcomingMatch }) {
  const dict = await getDictionary();
  const isHome =
    (match.userTeamSide ?? "").toUpperCase().startsWith("H") ||
    (match.userTeamSide ?? "").toUpperCase() === "MANDANTE";

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {isHome ? "vs " : "@ "}
          {match.opponentTeamName ?? dict.common.noData}
        </p>
        <p className="truncate text-xs text-slate-500">{match.competitionName ?? dict.common.competition}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-medium text-slate-700">{formatDate(match.matchDate)}</p>
        {match.daysUntilMatch !== null && (
          <p className="text-xs text-slate-400">
            {match.daysUntilMatch === 0
              ? dict.dashboard.today
              : formatTemplate(dict.dashboard.inDays, { days: match.daysUntilMatch })}
          </p>
        )}
      </div>
    </div>
  );
}

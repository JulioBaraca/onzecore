import { formatDate, formatInteger } from "@/lib/format/number";
import { isHomeSide } from "@/lib/domain/match-result";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Badge } from "@/components/ui/badge";
import type { MatchRow } from "@/features/matches/queries";

export async function RecentMatchCard({ match }: { match: MatchRow }) {
  const dict = await getDictionary();
  const isHome = isHomeSide(match.user_team_side);
  const opponentName = (isHome ? match.away_team_name : match.home_team_name) ?? dict.common.noData;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{opponentName}</p>
        <p className="truncate text-xs text-slate-500">
          {match.competition_name ?? dict.common.competition} | {isHome ? dict.standings.home : dict.standings.away}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-right">
        <div>
          <p className="text-xs font-medium text-slate-700">{formatDate(match.match_date)}</p>
          <p className="text-xs tabular-nums text-slate-400">
            {formatInteger(match.home_score)} - {formatInteger(match.away_score)}
          </p>
        </div>
        {match.result && (
          <Badge variant={match.result === "V" ? "success" : match.result === "D" ? "danger" : "neutral"}>
            {match.result === "V" ? dict.dashboard.win : match.result === "D" ? dict.dashboard.loss : dict.dashboard.draw}
          </Badge>
        )}
      </div>
    </div>
  );
}

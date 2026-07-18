import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/format/number";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export interface StandingsRow {
  position: unknown;
  teamName: string | null;
  played: unknown;
  points: unknown;
  goalDifference: unknown;
  isUserTeam: boolean;
}

export async function StandingsMiniTable({ rows }: { rows: StandingsRow[] }) {
  const dict = await getDictionary();

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">{dict.dashboard.standingsUnavailable}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
          <th className="w-8 pb-2 font-medium">{dict.standings.position}</th>
          <th className="pb-2 font-medium">{dict.standings.team}</th>
          <th className="w-10 pb-2 text-right font-medium">{dict.standings.played}</th>
          <th className="w-10 pb-2 text-right font-medium">{dict.standings.goalDifference}</th>
          <th className="w-10 pb-2 text-right font-medium">{dict.standings.points}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className={cn(
              "border-t border-slate-100",
              row.isUserTeam && "bg-[var(--club-primary-soft)] font-semibold text-[var(--club-primary)]",
            )}
          >
            <td className="py-1.5 tabular-nums text-slate-600">{formatInteger(row.position)}</td>
            <td className="truncate py-1.5 font-medium text-slate-800">{row.teamName ?? dict.common.noData}</td>
            <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.played)}</td>
            <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.goalDifference)}</td>
            <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">
              {formatInteger(row.points)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

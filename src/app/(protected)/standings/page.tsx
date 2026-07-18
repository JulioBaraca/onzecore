import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getStandings } from "@/features/standings/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/format/number";

export default async function StandingsPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const groups = await getStandings(career.career_id, career.current_team_id);

  return (
    <>
      <PageHeader title={dict.nav.standings} description={career.friendly_name} />
      {groups.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group, gi) => (
            <Card key={gi}>
              <CardHeader>
                <CardTitle>
                  {group.competitionName}
                  {group.groupId && group.groupId !== "0" ? ` - ${group.groupId}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="w-10 pb-2 font-medium">{dict.standings.position}</th>
                      <th className="pb-2 font-medium">{dict.standings.team}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.played}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.wins}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.draws}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.losses}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.goalsFor}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.goalsAgainst}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.goalDifference}</th>
                      <th className="w-10 pb-2 text-right font-medium">{dict.standings.points}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className={cn(
                          "border-t border-slate-100",
                          row.team_id === career.current_team_id &&
                            "bg-[var(--club-primary-soft)] font-semibold text-[var(--club-primary)]",
                        )}
                      >
                        <td className="py-1.5 tabular-nums text-slate-600">{formatInteger(row.position)}</td>
                        <td className="truncate py-1.5 font-medium text-slate-800">
                          {row.team_name ?? dict.common.noData}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.played)}</td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.wins)}</td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.draws)}</td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.losses)}</td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">
                          {formatInteger(row.goals_for)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">
                          {formatInteger(row.goals_against)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-slate-700">
                          {formatInteger(row.goal_difference)}
                        </td>
                        <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">
                          {formatInteger(row.points)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

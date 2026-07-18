import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getMatches, getUpcomingFixtures, summarizeMatches } from "@/features/matches/queries";
import { buildCalendarEntries } from "@/features/matches/calendar";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchesCalendar } from "@/components/matches/MatchesCalendar";
import { formatDate, formatInteger } from "@/lib/format/number";
import { pointsPercentage } from "@/lib/kpi/formulas";

export default async function MatchesPage() {
  const [resolution, dict, locale] = await Promise.all([resolveCurrentCareer(), getDictionary(), getLocale()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const [matches, upcomingFixtures] = await Promise.all([
    getMatches(career.career_id, career.current_team_id),
    getUpcomingFixtures(career.career_id, career.current_team_id),
  ]);
  const summary = summarizeMatches(matches);
  const winRate = pointsPercentage(summary.wins * 3 + summary.draws, summary.played);
  const calendarEntries = buildCalendarEntries(matches, upcomingFixtures);

  return (
    <>
      <PageHeader title={dict.nav.matches} description={career.friendly_name} />

      {matches.length === 0 && calendarEntries.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <>
          {matches.length > 0 && (
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <KpiTile label={dict.matches.played} value={formatInteger(summary.played)} />
              <KpiTile label={dict.dashboard.win} value={formatInteger(summary.wins)} />
              <KpiTile label={dict.dashboard.draw} value={formatInteger(summary.draws)} />
              <KpiTile label={dict.dashboard.loss} value={formatInteger(summary.losses)} />
              <KpiTile
                label={dict.matches.goalDifference}
                value={formatInteger(summary.goalsFor - summary.goalsAgainst)}
              />
              <KpiTile label={dict.matches.winRate} value={winRate !== null ? `${winRate.toFixed(0)}%` : dict.common.noData} />
            </section>
          )}

          <div className="mb-6">
            <MatchesCalendar entries={calendarEntries} locale={locale} dict={dict} />
          </div>

          {matches.length > 0 && (
            <Card>
              <CardContent className="overflow-x-auto pt-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 font-medium">{dict.matches.date}</th>
                      <th className="pb-2 font-medium">{dict.matches.competition}</th>
                      <th className="pb-2 font-medium">{dict.matches.home}</th>
                      <th className="pb-2 font-medium">{dict.matches.away}</th>
                      <th className="pb-2 text-center font-medium">{dict.matches.score}</th>
                      <th className="pb-2 text-center font-medium">{dict.matches.result}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5 whitespace-nowrap text-slate-700">{formatDate(m.match_date)}</td>
                        <td className="py-1.5 text-slate-700">{m.competition_name ?? dict.common.noData}</td>
                        <td className="py-1.5 font-medium text-slate-800">
                          {m.home_team_name ?? dict.common.noData}
                        </td>
                        <td className="py-1.5 font-medium text-slate-800">
                          {m.away_team_name ?? dict.common.noData}
                        </td>
                        <td className="py-1.5 text-center font-semibold tabular-nums text-slate-900">
                          {formatInteger(m.home_score)} - {formatInteger(m.away_score)}
                        </td>
                        <td className="py-1.5 text-center">
                          {m.result ? (
                            <Badge
                              variant={m.result === "V" ? "success" : m.result === "D" ? "danger" : "neutral"}
                            >
                              {m.result === "V" ? dict.dashboard.win : m.result === "D" ? dict.dashboard.loss : dict.dashboard.draw}
                            </Badge>
                          ) : (
                            dict.common.noData
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}

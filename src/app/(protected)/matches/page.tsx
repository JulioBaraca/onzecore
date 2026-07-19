import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getCurrentGameDate, getMatches, getUpcomingFixtures, summarizeMatches } from "@/features/matches/queries";
import { buildCalendarEntries } from "@/features/matches/calendar";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { MatchesCalendar } from "@/components/matches/MatchesCalendar";
import { MatchesTable } from "@/app/(protected)/matches/MatchesTable";
import { formatInteger } from "@/lib/format/number";
import { pointsPercentage } from "@/lib/kpi/formulas";

export default async function MatchesPage() {
  const [resolution, dict, locale] = await Promise.all([resolveCurrentCareer(), getDictionary(), getLocale()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const [matches, upcomingFixtures, currentGameDate] = await Promise.all([
    getMatches(career.career_id),
    getUpcomingFixtures(career.career_id, career.current_team_id),
    getCurrentGameDate(career.career_id),
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
            <MatchesCalendar
              entries={calendarEntries}
              locale={locale}
              dict={dict}
              currentGameDate={currentGameDate}
            />
          </div>

          {matches.length > 0 && <MatchesTable matches={matches} />}
        </>
      )}
    </>
  );
}

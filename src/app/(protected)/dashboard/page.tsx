import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { resolveCurrentSave } from "@/lib/career/current-save";
import { getDashboardData } from "@/features/dashboard/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { FormGuide } from "@/components/dashboard/FormGuide";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { RecentMatchCard } from "@/components/dashboard/RecentMatchCard";
import { StandingsMiniTable } from "@/components/dashboard/StandingsMiniTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatInteger } from "@/lib/format/number";
import { pointsPercentage, wageBudgetOccupancy } from "@/lib/kpi/formulas";

export default async function DashboardPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }

  const career = resolution.career;
  const save = await resolveCurrentSave(career.career_id);

  if (!save) {
    return (
      <>
        <PageHeader title={dict.nav.dashboard} description={career.friendly_name} />
        <EmptyState title={dict.dashboard.noSaveTitle} description={dict.dashboard.noSaveDescription} />
      </>
    );
  }

  const data = await getDashboardData(career.career_id, save.saveId, career.current_team_id);
  const userStandingsRow = data.standingsWindow.find((r) => r.isUserTeam);
  const currency = data.finance?.currency ?? null;

  const wageOccupancy = data.finance
    ? wageBudgetOccupancy(data.finance.currentWeeklyWages, data.finance.wageBudget)
    : null;
  const winRate = userStandingsRow
    ? pointsPercentage(userStandingsRow.points, userStandingsRow.played)
    : null;

  return (
    <>
      <PageHeader
        title={career.friendly_name}
        description={career.current_season ? `${dict.common.season} ${career.current_season}` : undefined}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiTile
          label={dict.dashboard.position}
          value={userStandingsRow ? `${formatInteger(userStandingsRow.position)}º` : dict.common.noData}
          hint={userStandingsRow ? `${formatInteger(userStandingsRow.points)} ${dict.dashboard.points}` : undefined}
        />
        <KpiTile
          label={dict.dashboard.winRate}
          value={winRate !== null ? `${winRate.toFixed(0)}%` : dict.common.noData}
        />
        <KpiTile label={dict.dashboard.squadValue} value={formatCurrency(data.squad.totalValue, currency)} />
        <KpiTile
          label={dict.dashboard.weeklyWages}
          value={formatCurrency(data.squad.weeklyWageBill, currency)}
          delta={wageOccupancy !== null ? `${wageOccupancy.toFixed(0)}${dict.dashboard.ofBudget}` : undefined}
          deltaTone={wageOccupancy !== null && wageOccupancy > 100 ? "bad" : "neutral"}
        />
        <KpiTile
          label={dict.dashboard.clubBalance}
          value={data.finance ? formatCurrency(data.finance.clubBalance, currency) : dict.common.noData}
        />
        <KpiTile
          label={dict.dashboard.transferBudget}
          value={data.finance ? formatCurrency(data.finance.transferBudget, currency) : dict.common.noData}
        />
        <KpiTile label={dict.dashboard.injuredPlayers} value={formatInteger(data.injuries.total)} />
        <KpiTile label={dict.dashboard.contractsEnding} value={formatInteger(data.squad.contractsEndingSoon)} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.recentForm}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormGuide results={data.recentForm} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.upcomingMatches}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.upcomingMatches.length === 0 ? (
              <p className="text-sm text-slate-400">{dict.dashboard.noUpcomingMatches}</p>
            ) : (
              data.upcomingMatches.map((m, i) => <MatchCard key={i} match={m} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.standings}</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsMiniTable rows={data.standingsWindow} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.squadHighlights}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{dict.dashboard.topScorer}</p>
              <p className="font-medium text-slate-900">
                {data.squad.topScorer
                  ? `${data.squad.topScorer.playerName} (${data.squad.topScorer.amount})`
                  : dict.common.noData}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.dashboard.topAssister}</p>
              <p className="font-medium text-slate-900">
                {data.squad.topAssister
                  ? `${data.squad.topAssister.playerName} (${data.squad.topAssister.amount})`
                  : dict.common.noData}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.dashboard.bestRated}</p>
              <p className="font-medium text-slate-900">
                {data.squad.bestRated
                  ? `${data.squad.bestRated.playerName} (${data.squad.bestRated.amount.toFixed(2)})`
                  : dict.common.noData}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.dashboard.mostValuable}</p>
              <p className="font-medium text-slate-900">
                {data.squad.mostValuable
                  ? `${data.squad.mostValuable.playerName} (${formatCurrency(data.squad.mostValuable.amount, currency)})`
                  : dict.common.noData}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.squadHealth}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{dict.dashboard.totalInjured}</p>
              <p className="font-medium text-slate-900">{formatInteger(data.injuries.total)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.dashboard.severeInjuries}</p>
              <p className="font-medium text-slate-900">{formatInteger(data.injuries.severe)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.playedMatches}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.recentMatches.length === 0 ? (
              <p className="text-sm text-slate-400">{dict.dashboard.noPlayedMatches}</p>
            ) : (
              data.recentMatches.map((m, i) => <RecentMatchCard key={i} match={m} />)
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

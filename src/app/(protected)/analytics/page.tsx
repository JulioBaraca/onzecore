import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getAnalyticsData } from "@/features/analytics/queries";
import { getMatches, computeMatchInsights } from "@/features/matches/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatInteger } from "@/lib/format/number";

const RESULT_COLOR = { V: "#10b981", E: "#94a3b8", D: "#ef4444" } as const;

export default async function AnalyticsPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;

  const supabase = await createClient();
  const [data, { data: financeRow }, matches] = await Promise.all([
    getAnalyticsData(career.career_id),
    supabase.from("vw_fc26_current_finance").select("currency").eq("career_id", career.career_id).maybeSingle(),
    getMatches(career.career_id),
  ]);
  const currency = (financeRow as unknown as { currency: string | null } | null)?.currency ?? null;
  const matchInsights = computeMatchInsights(matches);

  const riskLabel = { high: dict.analytics.riskHigh, medium: dict.analytics.riskMedium, low: dict.analytics.riskLow };
  const riskVariant = { high: "danger", medium: "warning", low: "success" } as const;

  const resultWord = { V: dict.dashboard.win, E: dict.dashboard.draw, D: dict.dashboard.loss } as const;
  const streakText = matchInsights.summary.currentStreak
    ? `${matchInsights.summary.currentStreak.count}x ${resultWord[matchInsights.summary.currentStreak.result]}`
    : dict.analytics.noStreak;

  const resultsBreakdownData = matchInsights.resultsBreakdown.map((row) => ({
    label: { V: dict.analytics.wins, E: dict.analytics.draws, D: dict.analytics.losses }[row.key],
    value: row.value,
    color: RESULT_COLOR[row.key],
  }));

  const homeAwayData = matchInsights.homeAway.map((row) => ({
    label: row.key === "home" ? dict.analytics.homeLabel : dict.analytics.awayLabel,
    value: row.winRate ?? 0,
    color: row.key === "home" ? "var(--club-chart-1)" : "var(--club-chart-2)",
  }));

  const competitionBreakdownData = matchInsights.competitionBreakdown.map((row) => ({
    label: row.label,
    value: row.winRate ?? 0,
    color: "var(--club-chart-1)",
  }));

  if (data.overview.totalPlayers === 0) {
    return (
      <>
        <PageHeader title={dict.nav.analytics} description={career.friendly_name} />
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={dict.nav.analytics} description={career.friendly_name} />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile label={dict.analytics.totalPlayers} value={formatInteger(data.overview.totalPlayers)} />
        <KpiTile
          label={dict.analytics.avgOverall}
          value={data.overview.avgOverall !== null ? data.overview.avgOverall.toFixed(1) : dict.common.noData}
        />
        <KpiTile
          label={dict.analytics.avgPotential}
          value={data.overview.avgPotential !== null ? data.overview.avgPotential.toFixed(1) : dict.common.noData}
        />
        <KpiTile
          label={dict.analytics.avgAge}
          value={data.overview.avgAge !== null ? data.overview.avgAge.toFixed(1) : dict.common.noData}
        />
      </section>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {dict.analytics.onFieldTitle}
      </h2>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile
          label={dict.matches.winRate}
          value={
            matchInsights.summary.winRate !== null ? `${matchInsights.summary.winRate.toFixed(0)}%` : dict.common.noData
          }
        />
        <KpiTile
          label={dict.analytics.avgGoalsFor}
          value={
            matchInsights.summary.avgGoalsFor !== null
              ? matchInsights.summary.avgGoalsFor.toFixed(1)
              : dict.common.noData
          }
        />
        <KpiTile
          label={dict.analytics.avgGoalsAgainst}
          value={
            matchInsights.summary.avgGoalsAgainst !== null
              ? matchInsights.summary.avgGoalsAgainst.toFixed(1)
              : dict.common.noData
          }
        />
        <KpiTile label={dict.analytics.cleanSheets} value={formatInteger(matchInsights.summary.cleanSheets)} />
        <KpiTile label={dict.analytics.currentStreak} value={streakText} />
        <KpiTile
          label={dict.analytics.biggestWin}
          value={matchInsights.summary.biggestWin?.label ?? dict.analytics.noBiggestWin}
        />
      </section>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title={dict.analytics.pointsTrendTitle}
          description={dict.analytics.pointsTrendDescription}
          data={matchInsights.pointsTrend}
          xKey="label"
          series={[{ key: "points", name: dict.analytics.points, color: "var(--club-chart-1)" }]}
          emptyLabel={dict.analytics.noInsightData}
        />

        <BarChartCard
          title={dict.analytics.goalsTimelineTitle}
          description={dict.analytics.goalsTimelineDescription}
          data={matchInsights.goalsTimeline}
          xKey="label"
          series={[
            { key: "goalsFor", name: dict.matches.goalsFor, color: RESULT_COLOR.V },
            { key: "goalsAgainst", name: dict.matches.goalsAgainst, color: RESULT_COLOR.D },
          ]}
          emptyLabel={dict.analytics.noInsightData}
        />

        <CategoryBarChart
          title={dict.analytics.resultsBreakdownTitle}
          data={resultsBreakdownData}
          emptyLabel={dict.analytics.noInsightData}
        />

        <CategoryBarChart
          title={dict.analytics.homeAwayTitle}
          description={dict.analytics.homeAwayDescription}
          data={homeAwayData}
          emptyLabel={dict.analytics.noInsightData}
          valueSuffix="%"
        />

        {competitionBreakdownData.length > 1 && (
          <div className="lg:col-span-2">
            <CategoryBarChart
              title={dict.analytics.competitionBreakdownTitle}
              description={dict.analytics.competitionBreakdownDescription}
              data={competitionBreakdownData}
              emptyLabel={dict.analytics.noInsightData}
              valueSuffix="%"
              layout="vertical"
            />
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.ageBandsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">{dict.analytics.ageBand}</th>
                  <th className="pb-2 text-right font-medium">{dict.analytics.playerCount}</th>
                  <th className="pb-2 text-right font-medium">{dict.analytics.avgOverall}</th>
                  <th className="pb-2 text-right font-medium">{dict.analytics.avgPotential}</th>
                </tr>
              </thead>
              <tbody>
                {data.ageBands.map((band, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1.5 font-medium text-slate-800">{band.label}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(band.count)}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-700">
                      {band.avgOverall !== null ? band.avgOverall.toFixed(1) : dict.common.noData}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-slate-700">
                      {band.avgPotential !== null ? band.avgPotential.toFixed(1) : dict.common.noData}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.potentialGapTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-slate-500">{dict.analytics.potentialGapDescription}</p>
            {data.topPotentialGap.length === 0 ? (
              <p className="text-sm text-slate-400">{dict.analytics.noInsightData}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">{dict.analytics.player}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.overall}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.potential}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.gap}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPotentialGap.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-800">{row.playerName}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{row.overall}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{row.potential}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-emerald-700">+{row.gap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.goalParticipationTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-slate-500">{dict.analytics.goalParticipationDescription}</p>
            {data.topGoalParticipation.length === 0 ? (
              <p className="text-sm text-slate-400">{dict.analytics.noInsightData}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">{dict.analytics.player}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.goals}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.assists}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.participation}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topGoalParticipation.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-800">{row.playerName}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{row.goals}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{row.assists}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">
                        {row.participationPct.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.wageEfficiencyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-slate-500">{dict.analytics.wageEfficiencyDescription}</p>
            {data.bestWageEfficiency.length === 0 ? (
              <p className="text-sm text-slate-400">{dict.analytics.noInsightData}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">{dict.analytics.player}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.wage}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.rating}</th>
                    <th className="pb-2 text-right font-medium">{dict.analytics.ratingPerWage}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestWageEfficiency.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-800">{row.playerName}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">
                        {formatCurrency(row.wage, currency)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{row.rating.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-emerald-700">
                        {row.ratingPerThousandWage.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.analytics.depthTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">{dict.analytics.position}</th>
                <th className="pb-2 font-medium">{dict.analytics.starter}</th>
                <th className="pb-2 font-medium">{dict.analytics.backup}</th>
                <th className="pb-2 font-medium">{dict.analytics.thirdOption}</th>
                <th className="pb-2 text-right font-medium">{dict.analytics.avgOverall}</th>
                <th className="pb-2 text-right font-medium">{dict.analytics.highestPotential}</th>
                <th className="pb-2 font-medium">{dict.analytics.depthRisk}</th>
              </tr>
            </thead>
            <tbody>
              {data.depth.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1.5 font-medium text-slate-900">{row.position}</td>
                  <td className="py-1.5 text-slate-700">{row.starter?.player_name ?? dict.common.noData}</td>
                  <td className="py-1.5 text-slate-700">{row.backup?.player_name ?? dict.common.noData}</td>
                  <td className="py-1.5 text-slate-700">{row.thirdOption?.player_name ?? dict.common.noData}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                    {row.avgOverall !== null ? row.avgOverall.toFixed(1) : dict.common.noData}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                    {formatInteger(row.highestPotential)}
                  </td>
                  <td className="py-1.5">
                    <Badge variant={riskVariant[row.risk]}>{riskLabel[row.risk]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getInjuries, summarizeInjuries } from "@/features/injuries/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatInteger } from "@/lib/format/number";

export default async function InjuriesPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const rows = await getInjuries(career.career_id);
  const summary = summarizeInjuries(rows);

  return (
    <>
      <PageHeader title={dict.nav.injuries} description={career.friendly_name} />

      {rows.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiTile label={dict.injuries.totalInjured} value={formatInteger(summary.total)} />
            <KpiTile
              label={dict.injuries.averageDays}
              value={summary.averageDaysRemaining !== null ? summary.averageDaysRemaining.toFixed(0) : dict.common.noData}
            />
            <KpiTile label={dict.injuries.mostSevere} value={summary.mostSevere?.player_name ?? dict.common.noData} />
            <KpiTile label={dict.injuries.closestReturn} value={summary.closestReturn?.player_name ?? dict.common.noData} />
          </section>

          <Card>
            <CardContent className="overflow-x-auto pt-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">{dict.injuries.player}</th>
                    <th className="pb-2 font-medium">{dict.injuries.position}</th>
                    <th className="pb-2 text-right font-medium">{dict.injuries.overall}</th>
                    <th className="pb-2 font-medium">{dict.injuries.severity}</th>
                    <th className="pb-2 text-right font-medium">{dict.injuries.daysRemaining}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-900">{r.player_name ?? dict.common.noData}</td>
                      <td className="py-1.5 text-slate-700">{r.position ?? dict.common.noData}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(r.overall)}</td>
                      <td className="py-1.5">
                        <Badge variant={/grave|severe|alta/i.test(r.injury_severity ?? "") ? "danger" : "warning"}>
                          {r.injury_severity ?? dict.common.noData}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">
                        {formatInteger(r.injury_days_remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

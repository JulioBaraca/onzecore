import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getYouthPlayers, summarizeYouth } from "@/features/youth-academy/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { YouthTable } from "@/app/(protected)/youth-academy/YouthTable";
import { formatInteger } from "@/lib/format/number";

export default async function YouthAcademyPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const players = await getYouthPlayers(career.career_id);
  const summary = summarizeYouth(players);

  return (
    <>
      <PageHeader title={dict.nav.youthAcademy} description={career.friendly_name} />

      {players.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiTile label={dict.youth.totalPlayers} value={formatInteger(summary.totalPlayers)} />
            <KpiTile
              label={dict.youth.avgOverall}
              value={summary.avgOverall !== null ? summary.avgOverall.toFixed(1) : dict.common.noData}
            />
            <KpiTile
              label={dict.youth.avgPotential}
              value={summary.avgPotential !== null ? summary.avgPotential.toFixed(1) : dict.common.noData}
            />
            <KpiTile
              label={dict.youth.avgAge}
              value={summary.avgAge !== null ? summary.avgAge.toFixed(1) : dict.common.noData}
            />
            <KpiTile label={dict.youth.readyForPromotion} value={formatInteger(summary.readyForPromotion)} />
            <KpiTile label={dict.youth.promoted} value={formatInteger(summary.promotedCount)} />
          </section>

          <YouthTable players={players} />
        </>
      )}
    </>
  );
}

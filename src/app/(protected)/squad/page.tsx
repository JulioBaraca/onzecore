import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getSquad } from "@/features/squad/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { SquadTable } from "@/app/(protected)/squad/SquadTable";

export default async function SquadPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;

  const supabase = await createClient();
  const [players, { data: financeRow }] = await Promise.all([
    getSquad(career.career_id),
    supabase.from("vw_fc26_current_finance").select("currency").eq("career_id", career.career_id).maybeSingle(),
  ]);
  const currency = (financeRow as unknown as { currency: string | null } | null)?.currency ?? null;

  return (
    <>
      <PageHeader title={dict.nav.squad} description={career.friendly_name} />
      {players.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <SquadTable players={players} currency={currency} />
      )}
    </>
  );
}

import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getTransfers } from "@/features/transfers/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { TransfersView } from "@/app/(protected)/transfers/TransfersView";

export default async function TransfersPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;

  const supabase = await createClient();
  const [rows, { data: financeRow }] = await Promise.all([
    getTransfers(career.career_id),
    supabase.from("vw_fc26_current_finance").select("currency").eq("career_id", career.career_id).maybeSingle(),
  ]);
  const currency = (financeRow as unknown as { currency: string | null } | null)?.currency ?? null;

  return (
    <>
      <PageHeader title={dict.nav.transfers} description={career.friendly_name} />

      {rows.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <TransfersView rows={rows} currency={currency} userTeamId={career.current_team_id} />
      )}
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getPlayerBio, getPlayerSeasonHistory } from "@/features/player-profile/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatInteger, formatSigned, toNumber } from "@/lib/format/number";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;

  const supabase = await createClient();
  const [bio, history, { data: financeRow }] = await Promise.all([
    getPlayerBio(career.career_id, playerId),
    getPlayerSeasonHistory(career.career_id, playerId),
    supabase.from("vw_fc26_current_finance").select("currency").eq("career_id", career.career_id).maybeSingle(),
  ]);
  const currency = (financeRow as unknown as { currency: string | null } | null)?.currency ?? null;

  if (!bio) {
    return (
      <>
        <PageHeader title={dict.nav.squad} />
        <EmptyState title={dict.playerProfile.notFoundTitle} description={dict.playerProfile.notFoundDescription} />
      </>
    );
  }

  const isInjured =
    typeof bio.injury_status === "string" &&
    bio.injury_status.trim() !== "" &&
    !/none|nenhum|saudavel|saudável/i.test(bio.injury_status);

  return (
    <>
      <PageHeader
        title={bio.player_name ?? dict.common.noData}
        description={`${bio.position ?? ""}${career.friendly_name ? ` · ${career.friendly_name}` : ""}`}
        actions={
          <Link href="/squad" className="text-sm text-slate-500 hover:underline">
            {dict.playerProfile.back}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dict.squad.player}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{dict.squad.overall}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.overall)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.potential}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.potential)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.age}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.age)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.playerProfile.birthdate}</p>
              <p className="font-medium text-slate-900">{formatDate(bio.birthdate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.value}</p>
              <p className="font-medium text-slate-900">{formatCurrency(bio.value, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.wage}</p>
              <p className="font-medium text-slate-900">{formatCurrency(bio.wage, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.contractEnd}</p>
              <p className="font-medium text-slate-900">{formatDate(bio.contract_end)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.playerProfile.shirtNumber}</p>
              <p className="font-medium text-slate-900">{bio.shirt_number ?? dict.common.noData}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.playerProfile.seasonNumbers}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{dict.squad.appearances}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.season_appearances)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.goals}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.season_goals)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.assists}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.season_assists)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.rating}</p>
              <p className="font-medium text-slate-900">
                {toNumber(bio.season_avg_rating) !== null ? toNumber(bio.season_avg_rating)!.toFixed(2) : dict.common.noData}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.playerProfile.careerEvolution}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{dict.playerProfile.careerEvolution}</p>
              <p className="font-medium text-slate-900">{formatSigned(bio.evolucao_overall_carreira)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.playerProfile.seasonEvolution}</p>
              <p className="font-medium text-slate-900">{formatSigned(bio.evolucao_overall_temporada)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.squad.injured}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {isInjured ? (
              <div className="flex flex-col gap-2">
                <Badge variant="danger">{bio.injury_severity ?? dict.squad.injured}</Badge>
                <p className="text-slate-600">
                  {dict.playerProfile.injuryReturn}: {formatInteger(bio.injury_days_remaining)}
                </p>
              </div>
            ) : (
              <p className="text-slate-400">{dict.common.noData}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{dict.playerProfile.seasonHistory}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">{dict.common.noRecordsTitle}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">{dict.common.season}</th>
                    <th className="pb-2 font-medium">{dict.playerProfile.team}</th>
                    <th className="pb-2 text-right font-medium">{dict.squad.appearances}</th>
                    <th className="pb-2 text-right font-medium">{dict.squad.goals}</th>
                    <th className="pb-2 text-right font-medium">{dict.squad.assists}</th>
                    <th className="pb-2 text-right font-medium">{dict.squad.rating}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-800">{row.season ?? dict.common.noData}</td>
                      <td className="py-1.5 text-slate-700">{row.team_name ?? dict.common.noData}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">
                        {formatInteger(row.appearances)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.goals)}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">{formatInteger(row.assists)}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">
                        {formatInteger(row.average_rating)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

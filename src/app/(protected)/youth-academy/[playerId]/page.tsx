import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getYouthPlayerBio, getYouthPlayerAttributes } from "@/features/youth-academy/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatInteger } from "@/lib/format/number";
import { potentialGap } from "@/lib/kpi/formulas";

export default async function YouthPlayerProfilePage({
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

  const bio = await getYouthPlayerBio(career.career_id, playerId);

  if (!bio) {
    return (
      <>
        <PageHeader title={dict.nav.youthAcademy} />
        <EmptyState title={dict.playerProfile.notFoundTitle} description={dict.playerProfile.notFoundDescription} />
      </>
    );
  }

  const attributes = await getYouthPlayerAttributes(career.career_id, bio.save_id, playerId);

  const attributesByCategory = new Map<string, typeof attributes>();
  for (const attr of attributes) {
    const category = attr.attribute_category ?? "-";
    if (!attributesByCategory.has(category)) attributesByCategory.set(category, []);
    attributesByCategory.get(category)!.push(attr);
  }

  return (
    <>
      <PageHeader
        title={bio.player_name ?? dict.common.noData}
        description={bio.position ?? undefined}
        actions={
          <Link href="/youth-academy" className="text-sm text-slate-500 hover:underline">
            {dict.playerProfile.back}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dict.youth.player}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{dict.youth.overall}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.overall)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.youth.potential}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.potential)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.youth.gap}</p>
              <p className="font-medium text-slate-900">{formatInteger(potentialGap(bio.potential, bio.overall))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.youth.age}</p>
              <p className="font-medium text-slate-900">{formatInteger(bio.age)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.wage}</p>
              <p className="font-medium text-slate-900">{formatCurrency(bio.wage, null)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{dict.squad.contractEnd}</p>
              <p className="font-medium text-slate-900">{formatDate(bio.contract_end)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.youth.status}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {bio.promoted_to_first_team ? (
              <Badge variant="success">{dict.youth.promoted}</Badge>
            ) : bio.exit_date ? (
              <Badge variant="neutral">{dict.youth.departed}</Badge>
            ) : (
              <Badge variant="club">{bio.academy_status ?? dict.common.noData}</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.squad.position}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {[bio.position, bio.secondary_position1, bio.secondary_position2].filter(Boolean).join(" / ") ||
              dict.common.noData}
          </CardContent>
        </Card>

        {attributesByCategory.size > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{dict.youth.attributes}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from(attributesByCategory.entries()).map(([category, attrs]) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</p>
                  <dl className="flex flex-col gap-1 text-sm">
                    {attrs.map((attr, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <dt className="text-slate-500">{attr.attribute_name}</dt>
                        <dd className="font-medium tabular-nums text-slate-900">
                          {formatInteger(attr.attribute_value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

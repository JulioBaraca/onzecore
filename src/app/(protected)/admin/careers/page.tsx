import { getAdminCareers } from "@/features/admin/queries";
import { isSyncSuccess } from "@/features/sync-status/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatInteger } from "@/lib/format/number";

export default async function AdminCareersPage() {
  const [dict, careers] = await Promise.all([getDictionary(), getAdminCareers()]);

  return (
    <>
      <PageHeader title={dict.admin.careersTitle} />
      {careers.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">{dict.admin.career}</th>
                  <th className="pb-2 font-medium">{dict.common.season}</th>
                  <th className="pb-2 text-right font-medium">{dict.admin.squadSize}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.status}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.finishedAt}</th>
                  <th className="pb-2 font-medium">{dict.admin.gameVersion}</th>
                  <th className="pb-2 font-medium">{dict.admin.firstSeen}</th>
                </tr>
              </thead>
              <tbody>
                {careers.map((career) => {
                  const success = isSyncSuccess(career.last_sync_success);
                  return (
                    <tr key={career.career_id} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-800">{career.friendly_name}</td>
                      <td className="py-1.5 text-slate-700">{career.current_season ?? dict.common.noData}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-700">
                        {formatInteger(career.squad_size)}
                      </td>
                      <td className="py-1.5">
                        {career.last_sync_success ? (
                          <Badge variant={success ? "success" : "danger"}>
                            {success ? dict.syncStatus.success : dict.syncStatus.failure}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">{dict.common.noData}</span>
                        )}
                      </td>
                      <td className="py-1.5 whitespace-nowrap text-slate-700">
                        {formatDateTime(career.last_sync_finished_at)}
                      </td>
                      <td className="py-1.5 text-slate-700">{career.game_version ?? dict.common.noData}</td>
                      <td className="py-1.5 whitespace-nowrap text-slate-700">
                        {formatDateTime(career.first_seen_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

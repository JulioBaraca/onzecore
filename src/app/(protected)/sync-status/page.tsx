import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getSyncRuns, isSyncSuccess } from "@/features/sync-status/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format/number";

export default async function SyncStatusPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const runs = await getSyncRuns(career.career_id);

  return (
    <>
      <PageHeader title={dict.nav.syncStatus} description={career.friendly_name} />

      {runs.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">{dict.syncStatus.finishedAt}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.status}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.trigger}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.mode}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.scriptVersion}</th>
                  <th className="pb-2 font-medium">{dict.syncStatus.details}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, i) => {
                  const success = isSyncSuccess(run.success);
                  return (
                    <tr key={i} className="border-t border-slate-100 align-top">
                      <td className="py-1.5 whitespace-nowrap font-medium text-slate-800">
                        {formatDateTime(run.finished_at)}
                      </td>
                      <td className="py-1.5">
                        <Badge variant={success ? "success" : "danger"}>
                          {run.success ?? dict.syncStatus.unknown}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-slate-700">{run.trigger ?? dict.common.noData}</td>
                      <td className="py-1.5 text-slate-700">{run.supabase_sync_mode ?? dict.common.noData}</td>
                      <td className="py-1.5 text-slate-700">{run.script_version ?? dict.common.noData}</td>
                      <td className="py-1.5">
                        {run.error_message ? (
                          <details>
                            <summary className="cursor-pointer text-red-700">{dict.syncStatus.errorMessage}</summary>
                            <pre className="mt-1 max-w-md whitespace-pre-wrap text-xs text-red-600">
                              {run.error_message}
                            </pre>
                          </details>
                        ) : (
                          dict.common.noData
                        )}
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

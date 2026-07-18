"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantCareerAccessAction, revokeCareerAccessAction } from "@/lib/admin/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format/number";
import type { AdminUserRow, AdminCareerRow, CareerAccessRow } from "@/features/admin/queries";

const initialState: ActionResult = {};

export function AccessManager({
  users,
  careers,
  grants,
}: {
  users: AdminUserRow[];
  careers: AdminCareerRow[];
  grants: CareerAccessRow[];
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(grantCareerAccessAction, initialState);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  function handleRevoke(grantId: string) {
    startTransition(async () => {
      await revokeCareerAccessAction(grantId);
      router.refresh();
    });
  }

  const userLabel = (user: AdminUserRow) => user.full_name || user.email || user.id;
  const careerLabel = (careerId: string) => careers.find((c) => c.career_id === careerId)?.friendly_name ?? careerId;
  const accessLevelLabel: Record<CareerAccessRow["access_level"], string> = {
    owner: dict.admin.accessLevelOwner,
    editor: dict.admin.accessLevelEditor,
    viewer: dict.admin.accessLevelViewer,
  };

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">{dict.admin.user}</label>
          <select name="userId" required className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
            <option value="">{dict.admin.selectUser}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {userLabel(user)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">{dict.admin.career}</label>
          <select name="careerId" required className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
            <option value="">{dict.admin.selectCareer}</option>
            {careers.map((career) => (
              <option key={career.career_id} value={career.career_id}>
                {career.friendly_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">{dict.admin.accessLevel}</label>
          <select
            name="accessLevel"
            defaultValue="viewer"
            className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
          >
            <option value="owner">{dict.admin.accessLevelOwner}</option>
            <option value="editor">{dict.admin.accessLevelEditor}</option>
            <option value="viewer">{dict.admin.accessLevelViewer}</option>
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? dict.admin.granting : dict.admin.grantAccess}
        </Button>
        {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="w-full text-sm text-emerald-700">{dict.admin.accessGranted}</p>}
      </form>

      {grants.length === 0 ? (
        <p className="text-sm text-slate-400">{dict.admin.noGrantsYet}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">{dict.admin.user}</th>
                <th className="px-3 py-2">{dict.admin.career}</th>
                <th className="px-3 py-2">{dict.admin.accessLevel}</th>
                <th className="px-3 py-2">{dict.admin.createdAt}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => {
                const user = users.find((u) => u.id === grant.user_id);
                return (
                  <tr key={grant.id} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {user ? userLabel(user) : grant.user_id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                      {careerLabel(grant.career_id)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{accessLevelLabel[grant.access_level]}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatDateTime(grant.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleRevoke(grant.id)}>
                        {dict.admin.revoke}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { updateUserRoleAction, updateUserActiveAction } from "@/lib/admin/actions";
import { useI18n } from "@/providers/i18n-provider";
import { formatDateTime } from "@/lib/format/number";
import type { AdminUserRow } from "@/features/admin/queries";
import type { Role } from "@/types/auth";

const ROLES: Role[] = ["admin", "manager", "analyst", "viewer"];

export function UsersTable({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const { dict } = useI18n();
  const [rows, setRows] = useState(users);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const roleLabel: Record<Role, string> = {
    admin: dict.admin.roleAdmin,
    manager: dict.admin.roleManager,
    analyst: dict.admin.roleAnalyst,
    viewer: dict.admin.roleViewer,
  };

  function handleRoleChange(userId: string, role: Role) {
    const previous = rows;
    setRows((rs) => rs.map((r) => (r.id === userId ? { ...r, role } : r)));
    setErrors((e) => ({ ...e, [userId]: "" }));
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, role);
      if (result.error) {
        setRows(previous);
        setErrors((e) => ({ ...e, [userId]: result.error! }));
      }
    });
  }

  function handleActiveChange(userId: string, isActive: boolean) {
    const previous = rows;
    setRows((rs) => rs.map((r) => (r.id === userId ? { ...r, is_active: isActive } : r)));
    setErrors((e) => ({ ...e, [userId]: "" }));
    startTransition(async () => {
      const result = await updateUserActiveAction(userId, isActive);
      if (result.error) {
        setRows(previous);
        setErrors((e) => ({ ...e, [userId]: result.error! }));
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">{dict.admin.fullName}</th>
            <th className="px-3 py-2">{dict.admin.email}</th>
            <th className="px-3 py-2">{dict.admin.role}</th>
            <th className="px-3 py-2">{dict.admin.active}</th>
            <th className="px-3 py-2">{dict.admin.createdAt}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr key={user.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                  {user.full_name ?? dict.common.noData}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{user.email ?? dict.common.noData}</td>
                <td className="px-3 py-2">
                  <select
                    value={user.role}
                    disabled={isSelf}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel[role]}
                      </option>
                    ))}
                  </select>
                  {errors[user.id] && <p className="mt-1 text-xs text-red-600">{errors[user.id]}</p>}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={user.is_active}
                    disabled={isSelf}
                    onChange={(e) => handleActiveChange(user.id, e.target.checked)}
                    className="h-4 w-4 accent-[var(--club-primary)] disabled:opacity-50"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatDateTime(user.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

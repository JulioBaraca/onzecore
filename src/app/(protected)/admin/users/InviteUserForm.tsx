"use client";

import { useActionState } from "react";
import { inviteUserAction } from "@/lib/admin/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function InviteUserForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(inviteUserAction, initialState);

  return (
    <form
      action={formAction}
      key={state.success ? "sent" : "idle"}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">{dict.admin.inviteEmailLabel}</Label>
        <Input id="invite-email" name="email" type="email" required className="w-64" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-fullName">{dict.admin.inviteFullNameLabel}</Label>
        <Input id="invite-fullName" name="fullName" className="w-64" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? dict.admin.inviteSubmitLoading : dict.admin.inviteSubmit}
      </Button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-emerald-700">{dict.admin.inviteSuccess}</p>}
    </form>
  );
}

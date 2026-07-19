"use client";

import { useActionState } from "react";
import { createUserAction } from "@/lib/admin/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function CreateUserForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form
      action={formAction}
      key={state.success ? "created" : "idle"}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="create-fullName">{dict.admin.fullName}</Label>
        <Input id="create-fullName" name="fullName" className="w-56" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="create-email">{dict.admin.email}</Label>
        <Input id="create-email" name="email" type="email" required className="w-64" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="create-password">{dict.auth.passwordLabel}</Label>
        <Input id="create-password" name="password" type="password" required minLength={6} className="w-48" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? dict.admin.createSubmitLoading : dict.admin.createSubmit}
      </Button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-emerald-700">{dict.admin.createSuccess}</p>}
    </form>
  );
}

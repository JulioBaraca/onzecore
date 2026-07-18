"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/settings/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function ProfileForm({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string | null;
  role: string;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">{dict.settings.fullNameLabel}</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{dict.settings.emailLabel}</Label>
        <Input value={email ?? ""} disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{dict.settings.roleLabel}</Label>
        <Input value={role} disabled />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{dict.settings.profileSaved}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? dict.settings.savingProfile : dict.settings.saveProfile}
      </Button>
    </form>
  );
}

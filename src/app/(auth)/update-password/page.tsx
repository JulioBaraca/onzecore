"use client";

import { useActionState } from "react";
import { updatePasswordAction, type ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionResult = {};

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const { dict } = useI18n();

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{dict.auth.newPasswordLabel}</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">{dict.auth.confirmPasswordLabel}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? dict.auth.updatePasswordLoading : dict.auth.updatePasswordSubmit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

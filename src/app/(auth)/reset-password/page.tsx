"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionResult = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);
  const { dict } = useI18n();

  if (state.success) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-slate-700">
          {dict.auth.resetSuccessMessage}
          <div className="mt-4">
            <Link href="/login" className="text-sm font-medium text-[var(--club-primary)] hover:underline">
              {dict.auth.backToLogin}
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{dict.auth.emailLabel}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? dict.auth.resetSubmitLoading : dict.auth.resetSubmit}
          </Button>
          <Link href="/login" className="text-center text-sm text-slate-500 hover:underline">
            {dict.auth.backToLogin}
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}

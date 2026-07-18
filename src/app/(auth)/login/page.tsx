"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionResult = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const { dict } = useI18n();

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{dict.auth.emailLabel}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{dict.auth.passwordLabel}</Label>
              <Link href="/reset-password" className="text-xs text-slate-500 hover:underline">
                {dict.auth.forgotPassword}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? dict.auth.loginButtonLoading : dict.auth.loginButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

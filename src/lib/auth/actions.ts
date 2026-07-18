"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  loginSchema,
  requestPasswordResetSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const dict = await getDictionary();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: dict.auth.loginError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: dict.auth.loginError };
  }

  redirect("/select-career");
}

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const dict = await getDictionary();

  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: dict.auth.resetError };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/update-password`,
  });
  if (error) {
    return { error: dict.auth.resetError };
  }

  return { success: true };
}

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const dict = await getDictionary();

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: dict.auth.updatePasswordError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: dict.auth.updatePasswordError };
  }

  redirect("/select-career");
}

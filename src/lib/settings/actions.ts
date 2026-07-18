"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { requireProfile, getCurrentUser } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/auth/actions";

export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const profile = await requireProfile();
  const dict = await getDictionary();
  const fullName = String(formData.get("fullName") ?? "").trim();

  const supabase = await createClient();
  const { error } = await (supabase as unknown as SupabaseClient)
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", profile.id);

  if (error) {
    return { error: dict.settings.profileError };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function setCompactMode(compactMode: boolean) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await (supabase as unknown as SupabaseClient)
    .from("user_preferences")
    .upsert({ user_id: user.id, compact_mode: compactMode });

  revalidatePath("/settings");
}

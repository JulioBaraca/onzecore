"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { isValidHex } from "@/lib/theme/contrast";
import type { ActionResult } from "@/lib/auth/actions";

export async function updateClubColorsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const dict = await getDictionary();
  const user = await getCurrentUser();
  if (!user) return { error: dict.settings.colorsError };

  const resolution = await resolveCurrentCareer();
  if (resolution.status !== "selected") {
    return { error: dict.settings.colorsError };
  }

  const primaryColorHex = String(formData.get("primaryColorHex") ?? "");
  const secondaryColorHex = String(formData.get("secondaryColorHex") ?? "");
  if (!isValidHex(primaryColorHex) || !isValidHex(secondaryColorHex)) {
    return { error: dict.settings.colorsError };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.from("career_theme_overrides").upsert({
    career_id: resolution.career.career_id,
    primary_color_hex: primaryColorHex,
    secondary_color_hex: secondaryColorHex,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: dict.settings.colorsError };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function resetClubColorsAction(): Promise<{ error?: string }> {
  const dict = await getDictionary();
  const resolution = await resolveCurrentCareer();
  if (resolution.status !== "selected") {
    return { error: dict.settings.colorsError };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase
    .from("career_theme_overrides")
    .delete()
    .eq("career_id", resolution.career.career_id);
  if (error) return { error: dict.settings.colorsError };

  revalidatePath("/", "layout");
  return {};
}

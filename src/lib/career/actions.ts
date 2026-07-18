"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { CAREER_COOKIE } from "@/lib/career/current-career";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const CAREER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function selectCareer(careerId: string) {
  const supabase = await createClient();

  // Re-validate access rather than trusting the caller-supplied id - the
  // cookie/URL/form value is never treated as authorization by itself.
  const { data: authorized } = await supabase
    .from("vw_fc26_career_selector")
    .select("career_id")
    .eq("career_id", careerId)
    .maybeSingle();

  if (!authorized) {
    const dict = await getDictionary();
    throw new Error(dict.careerSelector.noAccessError);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cast away the placeholder Database typing for this write - it maps
  // every table to a generic Record<string, unknown>, which upsert()'s
  // stricter generics don't resolve cleanly. Safe to drop once real types
  // are generated (see src/types/database.ts).
  await (supabase as unknown as SupabaseClient)
    .from("user_preferences")
    .upsert({ user_id: user.id, selected_career_id: careerId });

  const cookieStore = await cookies();
  cookieStore.set(CAREER_COOKIE, careerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CAREER_COOKIE_MAX_AGE_SECONDS,
  });

  redirect("/dashboard");
}

export async function clearCareerSelection() {
  const cookieStore = await cookies();
  cookieStore.delete(CAREER_COOKIE);
  redirect("/select-career");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

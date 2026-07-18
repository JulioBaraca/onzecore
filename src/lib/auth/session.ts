import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

/**
 * Memoized per-request: multiple server components/layouts can call this
 * without issuing duplicate auth/profile round-trips.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  return (data as unknown as Profile | null) ?? null;
});

/**
 * proxy.ts already redirects unauthenticated requests away from protected
 * routes; this is defense-in-depth for any Server Component/Action that
 * proxy's matcher might not cover.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireProfile(): Promise<Profile> {
  await requireUser();
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    redirect("/login");
  }
  return profile;
}

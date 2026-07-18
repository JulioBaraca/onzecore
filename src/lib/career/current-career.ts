import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const CAREER_COOKIE = "fc26_last_career_id";

export interface CareerSelectorRow {
  career_id: string;
  current_save_id: string | null;
  current_save_saved_at: string | null;
  current_season: string | null;
  friendly_name: string;
  current_team_id: string | null;
  squad_size: number | null;
  last_sync_success: string | null;
  last_sync_finished_at: string | null;
  game_version: string | null;
  first_seen_at: string;
  last_seen_at: string;
  access_level: "owner" | "editor" | "viewer" | null;
  is_current_selection: boolean | null;
}

export type CareerResolution =
  | { status: "selected"; career: CareerSelectorRow }
  | { status: "none" }
  | { status: "ambiguous"; careers: CareerSelectorRow[] };

/**
 * vw_fc26_career_selector is already RLS-scoped to the caller (it reads
 * through eafc_careers, which has a select policy keyed on
 * fc26_has_career_access). This is the only trusted source of "which
 * careers can this user see" - cookies/preferences are hints re-validated
 * against it, never authorization sources by themselves.
 */
export async function listAccessibleCareers(): Promise<CareerSelectorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_fc26_career_selector")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load accessible careers: ${error.message}`);
  }
  return (data ?? []) as unknown as CareerSelectorRow[];
}

async function validateCareer(careerId: string | null | undefined): Promise<CareerSelectorRow | null> {
  if (!careerId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_fc26_career_selector")
    .select("*")
    .eq("career_id", careerId)
    .maybeSingle();
  return (data as unknown as CareerSelectorRow | null) ?? null;
}

/**
 * Precedence: user_preferences.selected_career_id (durable) -> cookie
 * (UX hint) -> single-accessible-career auto-select -> ambiguous/none.
 *
 * Note: Next.js layouts do not receive searchParams and do not rerender on
 * client-side navigation, so a "?career=" URL override is intentionally not
 * part of this resolution - switching careers goes through the
 * selectCareer() Server Action instead, which persists the choice and
 * redirects (a fresh request, so the layout re-resolves from scratch).
 */
export const resolveCurrentCareer = cache(async (): Promise<CareerResolution> => {
  const supabase = await createClient();

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("selected_career_id")
    .maybeSingle();

  const fromPrefs = await validateCareer(
    (prefs as { selected_career_id?: string } | null)?.selected_career_id,
  );
  if (fromPrefs) return { status: "selected", career: fromPrefs };

  const cookieStore = await cookies();
  const fromCookie = await validateCareer(cookieStore.get(CAREER_COOKIE)?.value);
  if (fromCookie) return { status: "selected", career: fromCookie };

  const careers = await listAccessibleCareers();
  if (careers.length === 0) return { status: "none" };
  if (careers.length === 1) return { status: "selected", career: careers[0] };
  return { status: "ambiguous", careers };
});

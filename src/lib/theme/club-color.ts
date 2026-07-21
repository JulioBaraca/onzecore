import { createClient } from "@/lib/supabase/server";
import { resolveClubTheme, type ClubTheme } from "@/lib/theme/palette";

/**
 * Looks up fc26_club_colors for the career's user team. Deliberately does
 * NOT filter by save_id: colors are effectively static reference data for a
 * career (a club's colors don't change match to match), and different
 * fc26_* datasets can lag/lead each other by a sync or two (the same class
 * of issue fixed for save resolution in migrations 021/022) - the most
 * recently updated row for this career+team is the right answer regardless
 * of which save it happened to be captured under.
 *
 * career_theme_overrides is checked first: fc26_club_colors is sync-managed
 * (overwritten on every ingestion run), so a user's manual color choice
 * from Settings is never written there - it lives in the override table
 * instead and takes precedence when present.
 */
export async function getClubThemeForSave(
  careerId: string,
  _saveId: string,
  teamId: string | null,
): Promise<ClubTheme> {
  const supabase = await createClient();

  const { data: override } = await supabase
    .from("career_theme_overrides")
    .select("primary_color_hex, secondary_color_hex")
    .eq("career_id", careerId)
    .maybeSingle();

  if (override) {
    const row = override as unknown as { primary_color_hex: string; secondary_color_hex: string };
    return resolveClubTheme(row.primary_color_hex, row.secondary_color_hex);
  }

  if (teamId) {
    const { data } = await supabase
      .from("fc26_club_colors")
      .select("primary_color_hex, secondary_color_hex")
      .eq("career_id", careerId)
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const row = data as unknown as {
        primary_color_hex: string | null;
        secondary_color_hex: string | null;
      };
      return resolveClubTheme(row.primary_color_hex, row.secondary_color_hex);
    }
  }

  return resolveClubTheme(null, null);
}

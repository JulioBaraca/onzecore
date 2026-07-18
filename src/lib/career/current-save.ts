import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentSave {
  saveId: string;
  savedAt: string | null;
}

/**
 * Precedence: user_preferences.selected_save_id, re-validated to actually
 * belong to careerId (a power-user override to pin a historical snapshot)
 * -> vw_fc26_latest_save_by_career (the documented tie-break chain).
 */
export const resolveCurrentSave = cache(async (careerId: string): Promise<CurrentSave | null> => {
  const supabase = await createClient();

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("selected_save_id")
    .maybeSingle();

  const pinnedSaveId = (prefs as { selected_save_id?: string } | null)?.selected_save_id;

  if (pinnedSaveId) {
    const { data: pinnedSave } = await supabase
      .from("eafc_saves")
      .select("save_id, saved_at")
      .eq("career_id", careerId)
      .eq("save_id", pinnedSaveId)
      .maybeSingle();

    if (pinnedSave) {
      const row = pinnedSave as unknown as { save_id: string; saved_at: string | null };
      return { saveId: row.save_id, savedAt: row.saved_at };
    }
  }

  const { data: latest } = await supabase
    .from("vw_fc26_latest_save_by_career")
    .select("save_id, saved_at")
    .eq("career_id", careerId)
    .maybeSingle();

  if (!latest) return null;
  const row = latest as unknown as { save_id: string; saved_at: string | null };
  return { saveId: row.save_id, savedAt: row.saved_at };
});

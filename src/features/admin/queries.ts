import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/auth";

export interface AdminUserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

/** fc26_admin_list_users() is admin-gated server-side (raises for non-admins). */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fc26_admin_list_users");

  if (error) {
    throw new Error(`Failed to load users: ${error.message}`);
  }
  return (data ?? []) as unknown as AdminUserRow[];
}

export interface AdminCareerRow {
  career_id: string;
  friendly_name: string;
  current_season: string | null;
  squad_size: number | null;
  last_sync_success: string | null;
  last_sync_finished_at: string | null;
  game_version: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

/** vw_fc26_career_summary already returns every career an admin can see (fc26_has_career_access is true for admins regardless of explicit grants). */
export async function getAdminCareers(): Promise<AdminCareerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_fc26_career_summary")
    .select(
      "career_id, friendly_name, current_season, squad_size, last_sync_success, last_sync_finished_at, game_version, first_seen_at, last_seen_at",
    )
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load careers: ${error.message}`);
  }
  return (data ?? []) as unknown as AdminCareerRow[];
}

export interface CareerAccessRow {
  id: string;
  user_id: string;
  career_id: string;
  access_level: "owner" | "editor" | "viewer";
  created_at: string;
}

export async function getCareerAccessGrants(): Promise<CareerAccessRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_career_access")
    .select("id, user_id, career_id, access_level, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load access grants: ${error.message}`);
  }
  return (data ?? []) as unknown as CareerAccessRow[];
}

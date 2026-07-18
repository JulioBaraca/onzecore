import { createClient } from "@/lib/supabase/server";

export interface SyncRunRow {
  started_at: string | null;
  finished_at: string | null;
  success: string | null;
  trigger: string | null;
  supabase_sync_mode: string | null;
  script_version: string | null;
  error_message: string | null;
}

export function isSyncSuccess(value: string | null): boolean {
  return typeof value === "string" && /true|sucesso|success/i.test(value);
}

export async function getSyncRuns(careerId: string, limit = 20): Promise<SyncRunRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fc26_sync_status")
    .select("started_at, finished_at, success, trigger, supabase_sync_mode, script_version, error_message")
    .eq("career_id", careerId)
    .order("finished_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load sync status: ${error.message}`);
  }
  return (data ?? []) as unknown as SyncRunRow[];
}

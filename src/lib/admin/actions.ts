"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { ActionResult } from "@/lib/auth/actions";
import type { Role } from "@/types/auth";

async function writeAuditLog(
  supabase: SupabaseClient,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.rpc("fc26_write_audit_log", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata,
  });
}

export async function updateUserRoleAction(userId: string, role: Role): Promise<{ error?: string }> {
  const actor = await requireRole("admin");
  const dict = await getDictionary();
  if (userId === actor.id && role !== "admin") {
    return { error: dict.admin.cannotSelfDemote };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  await writeAuditLog(supabase, "update_user_role", "profile", userId, { role });
  revalidatePath("/admin/users");
  return {};
}

export async function updateUserActiveAction(userId: string, isActive: boolean): Promise<{ error?: string }> {
  const actor = await requireRole("admin");
  const dict = await getDictionary();
  if (userId === actor.id && !isActive) {
    return { error: dict.admin.cannotSelfDeactivate };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { error: error.message };

  await writeAuditLog(supabase, "update_user_active", "profile", userId, { is_active: isActive });
  revalidatePath("/admin/users");
  return {};
}

export async function grantCareerAccessAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const dict = await getDictionary();
  const userId = String(formData.get("userId") ?? "");
  const careerId = String(formData.get("careerId") ?? "");
  const accessLevel = String(formData.get("accessLevel") ?? "viewer");

  if (!userId || !careerId) {
    return { error: dict.admin.selectUserAndCareer };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase
    .from("user_career_access")
    .upsert({ user_id: userId, career_id: careerId, access_level: accessLevel }, { onConflict: "user_id,career_id" });
  if (error) return { error: error.message };

  await writeAuditLog(supabase, "grant_career_access", "user_career_access", `${userId}:${careerId}`, {
    access_level: accessLevel,
  });
  revalidatePath("/admin/access");
  return { success: true };
}

export async function revokeCareerAccessAction(grantId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.from("user_career_access").delete().eq("id", grantId);
  if (error) return { error: error.message };

  await writeAuditLog(supabase, "revoke_career_access", "user_career_access", grantId);
  revalidatePath("/admin/access");
  return {};
}

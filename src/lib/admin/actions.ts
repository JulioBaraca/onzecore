"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function createUserAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const dict = await getDictionary();
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: dict.admin.invalidEmail };
  }
  if (password.length < 6) {
    return { error: dict.admin.invalidPassword };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: dict.admin.serviceRoleMissing };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error) return { error: error.message };

  const supabase = (await createClient()) as unknown as SupabaseClient;
  await writeAuditLog(supabase, "create_user", "profile", data.user.id, { email });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<{ error?: string }> {
  const actor = await requireRole("admin");
  const dict = await getDictionary();
  if (userId === actor.id) {
    return { error: dict.admin.cannotSelfDelete };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: dict.admin.serviceRoleMissing };
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  const supabase = (await createClient()) as unknown as SupabaseClient;
  await writeAuditLog(supabase, "delete_user", "profile", userId);
  revalidatePath("/admin/users");
  revalidatePath("/admin/access");
  return {};
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

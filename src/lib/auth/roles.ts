import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { roleAtLeast, type Role } from "@/types/auth";

export async function requireRole(minRole: Role) {
  const profile = await requireProfile();
  if (!roleAtLeast(profile.role, minRole)) {
    redirect("/dashboard");
  }
  return profile;
}

import type { Role } from "@/types/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export interface NavItem {
  href: string;
  labelKey: keyof Dictionary["nav"];
  minRole: Role;
}

/**
 * Per-page visibility, defaulted per the plan's open item: viewer sees every
 * non-admin page; sync-status (raw ingestion errors) requires manager/admin.
 * Adjust minRole here if the actual desired matrix differs - nothing else
 * needs to change.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", minRole: "viewer" },
  { href: "/matches", labelKey: "matches", minRole: "viewer" },
  { href: "/standings", labelKey: "standings", minRole: "viewer" },
  { href: "/squad", labelKey: "squad", minRole: "viewer" },
  { href: "/youth-academy", labelKey: "youthAcademy", minRole: "viewer" },
  { href: "/transfers", labelKey: "transfers", minRole: "viewer" },
  { href: "/injuries", labelKey: "injuries", minRole: "viewer" },
  { href: "/finance", labelKey: "finance", minRole: "viewer" },
  { href: "/analytics", labelKey: "analytics", minRole: "viewer" },
  { href: "/history", labelKey: "history", minRole: "viewer" },
  { href: "/sync-status", labelKey: "syncStatus", minRole: "manager" },
  { href: "/settings", labelKey: "settings", minRole: "viewer" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/users", labelKey: "adminUsers", minRole: "admin" },
  { href: "/admin/careers", labelKey: "adminCareers", minRole: "admin" },
  { href: "/admin/access", labelKey: "adminAccess", minRole: "admin" },
];

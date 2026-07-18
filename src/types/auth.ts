export type Role = "admin" | "manager" | "analyst" | "viewer";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
}

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  analyst: 1,
  manager: 2,
  admin: 3,
};

export function roleAtLeast(role: Role, minRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

import { requireProfile } from "@/lib/auth/session";
import { getAdminUsers } from "@/features/admin/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { UsersTable } from "@/app/(protected)/admin/users/UsersTable";

export default async function AdminUsersPage() {
  const [profile, dict, users] = await Promise.all([requireProfile(), getDictionary(), getAdminUsers()]);

  return (
    <>
      <PageHeader title={dict.admin.usersTitle} />
      {users.length === 0 ? (
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      ) : (
        <UsersTable users={users} currentUserId={profile.id} />
      )}
    </>
  );
}

import { getAdminUsers, getAdminCareers, getCareerAccessGrants } from "@/features/admin/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessManager } from "@/app/(protected)/admin/access/AccessManager";

export default async function AdminAccessPage() {
  const [dict, users, careers, grants] = await Promise.all([
    getDictionary(),
    getAdminUsers(),
    getAdminCareers(),
    getCareerAccessGrants(),
  ]);

  return (
    <>
      <PageHeader title={dict.admin.accessTitle} />
      <AccessManager users={users} careers={careers} grants={grants} />
    </>
  );
}

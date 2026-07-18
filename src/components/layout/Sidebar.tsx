import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/config/nav";
import { NavLinks } from "@/components/layout/NavLinks";
import { roleAtLeast, type Role } from "@/types/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SITE } from "@/config/site";

interface SidebarContentProps {
  role: Role;
  friendlyName: string;
  season: string | null;
}

export async function SidebarContent({ role, friendlyName, season }: SidebarContentProps) {
  const dict = await getDictionary();

  const items = NAV_ITEMS.filter((item) => roleAtLeast(role, item.minRole)).map((item) => ({
    href: item.href,
    label: dict.nav[item.labelKey],
  }));
  const adminItems = ADMIN_NAV_ITEMS.filter((item) => roleAtLeast(role, item.minRole)).map((item) => ({
    href: item.href,
    label: dict.nav[item.labelKey],
  }));

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/onzecore-simbolo.svg" alt={SITE.name} className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{friendlyName}</p>
          <p className="truncate text-xs text-slate-500">
            {season ? `${dict.common.season} ${season}` : SITE.name}
          </p>
        </div>
      </div>
      <NavLinks items={items} />
      {adminItems.length > 0 && (
        <>
          <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {dict.nav.adminSection}
          </p>
          <NavLinks items={adminItems} />
        </>
      )}
    </>
  );
}

export async function Sidebar(props: SidebarContentProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <SidebarContent {...props} />
    </aside>
  );
}

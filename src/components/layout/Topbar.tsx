import Link from "next/link";
import { signOut } from "@/lib/career/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatDateTime } from "@/lib/format/number";
import type { Profile } from "@/types/auth";

export async function Topbar({
  profile,
  lastSyncFinishedAt,
}: {
  profile: Profile;
  lastSyncFinishedAt: string | null;
}) {
  const dict = await getDictionary();

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileMenuButton />
        <p className="hidden truncate text-xs text-slate-500 sm:block">
          {lastSyncFinishedAt
            ? `${dict.common.lastSync}: ${formatDateTime(lastSyncFinishedAt)}`
            : dict.common.noSyncRecorded}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <LocaleSwitcher />
        <Link href="/select-career" className="text-sm text-slate-600 hover:underline">
          {dict.common.switchCareer}
        </Link>
        <span className="hidden text-sm text-slate-700 sm:inline">
          {profile.full_name ?? dict.common.defaultUserName}
        </span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            {dict.common.signOut}
          </Button>
        </form>
      </div>
    </header>
  );
}

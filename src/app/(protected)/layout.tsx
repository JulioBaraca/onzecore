import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { resolveCurrentSave } from "@/lib/career/current-save";
import { getClubThemeForSave } from "@/lib/theme/club-color";
import { ThemeVarsScope } from "@/components/theme/ThemeVarsScope";
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileSidebarDrawer } from "@/components/layout/MobileSidebarDrawer";
import { MobileNavProvider } from "@/providers/mobile-nav-provider";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const resolution = await resolveCurrentCareer();

  if (resolution.status !== "selected") {
    redirect("/select-career");
  }

  const career = resolution.career;
  const currentSave = await resolveCurrentSave(career.career_id);
  const theme = await getClubThemeForSave(
    career.career_id,
    currentSave?.saveId ?? "",
    career.current_team_id,
  );

  return (
    <ThemeVarsScope theme={theme}>
      <MobileNavProvider>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar role={profile.role} friendlyName={career.friendly_name} season={career.current_season} />
          <MobileSidebarDrawer>
            <SidebarContent role={profile.role} friendlyName={career.friendly_name} season={career.current_season} />
          </MobileSidebarDrawer>
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar profile={profile} lastSyncFinishedAt={career.last_sync_finished_at} />
            <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
          </div>
        </div>
      </MobileNavProvider>
    </ThemeVarsScope>
  );
}

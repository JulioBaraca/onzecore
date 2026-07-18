import { requireProfile, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ProfileForm } from "@/app/(protected)/settings/ProfileForm";
import { CompactModeToggle } from "@/app/(protected)/settings/CompactModeToggle";

export default async function SettingsPage() {
  const [profile, user, dict] = await Promise.all([requireProfile(), getCurrentUser(), getDictionary()]);

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("compact_mode")
    .eq("user_id", profile.id)
    .maybeSingle();
  const compactMode = (prefs as unknown as { compact_mode: boolean } | null)?.compact_mode ?? false;

  return (
    <>
      <PageHeader title={dict.settings.title} description={dict.settings.description} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.settings.profileSection}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm fullName={profile.full_name} email={user?.email ?? null} role={profile.role} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.settings.preferencesSection}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompactModeToggle initialValue={compactMode} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.settings.languageSection}</CardTitle>
            </CardHeader>
            <CardContent>
              <LocaleSwitcher />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

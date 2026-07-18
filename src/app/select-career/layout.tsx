import { requireUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SITE } from "@/config/site";

export default async function SelectCareerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const dict = await getDictionary();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/onzecore-simbolo.svg" alt={SITE.name} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="text-lg font-semibold text-slate-900">{dict.careerSelector.title}</h1>
          <p className="text-sm text-slate-500">{SITE.name}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

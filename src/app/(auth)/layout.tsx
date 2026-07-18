import { SITE } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/onzecore-simbolo.svg" alt={SITE.name} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="text-lg font-semibold text-slate-900">{SITE.name}</h1>
          <p className="text-sm text-slate-500">{SITE.description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

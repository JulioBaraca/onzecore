"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";

const LOCALES: { code: Locale; flag: string }[] = [
  { code: "pt", flag: "🇧🇷" },
  { code: "en", flag: "🇺🇸" },
];

export function LocaleSwitcher() {
  const { locale, dict } = useI18n();
  const [isPending, startTransition] = useTransition();

  const label: Record<Locale, string> = { pt: dict.common.portuguese, en: dict.common.english };

  return (
    <div className="flex gap-2" aria-label={dict.common.language}>
      {LOCALES.map(({ code, flag }) => (
        <button
          key={code}
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => setLocale(code))}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
            locale === code
              ? "border-[var(--club-primary)] bg-[var(--club-primary-soft)] text-[var(--club-primary)]"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          <span className="text-lg leading-none">{flag}</span>
          {label[code]}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const { locale, dict } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 text-xs" aria-label={dict.common.language}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => setLocale("pt"))}
        className={cn(
          "rounded px-1.5 py-0.5",
          locale === "pt" ? "font-semibold text-slate-900" : "text-slate-400 hover:text-slate-600",
        )}
      >
        PT
      </button>
      <span className="text-slate-300">/</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => setLocale("en"))}
        className={cn(
          "rounded px-1.5 py-0.5",
          locale === "en" ? "font-semibold text-slate-900" : "text-slate-400 hover:text-slate-600",
        )}
      >
        EN
      </button>
    </div>
  );
}

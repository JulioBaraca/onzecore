"use client";

import { useState, useTransition } from "react";
import { setCompactMode } from "@/lib/settings/actions";
import { useI18n } from "@/providers/i18n-provider";

export function CompactModeToggle({ initialValue }: { initialValue: boolean }) {
  const { dict } = useI18n();
  const [checked, setChecked] = useState(initialValue);
  const [, startTransition] = useTransition();

  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
      <span>
        <span className="block text-sm font-medium text-slate-900">{dict.settings.compactModeLabel}</span>
        <span className="block text-xs text-slate-500">{dict.settings.compactModeDescription}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          setChecked(next);
          startTransition(() => {
            setCompactMode(next);
          });
        }}
        className="h-4 w-4 accent-[var(--club-primary)]"
      />
    </label>
  );
}

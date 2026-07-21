"use client";

import { useActionState, useState, useTransition } from "react";
import { updateClubColorsAction, resetClubColorsAction } from "@/lib/theme/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function ClubColorForm({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(updateClubColorsAction, initialState);
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [isResetting, startResetTransition] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">{dict.settings.colorsDescription}</p>

      <div className="flex items-center gap-3">
        <input
          id="primaryColorHex"
          type="color"
          name="primaryColorHex"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
        />
        <div className="flex flex-col">
          <Label htmlFor="primaryColorHex">{dict.settings.primaryColorLabel}</Label>
          <span className="text-xs uppercase tabular-nums text-slate-500">{primary}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="secondaryColorHex"
          type="color"
          name="secondaryColorHex"
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
        />
        <div className="flex flex-col">
          <Label htmlFor="secondaryColorHex">{dict.settings.secondaryColorLabel}</Label>
          <span className="text-xs uppercase tabular-nums text-slate-500">{secondary}</span>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{dict.settings.colorsSaved}</p>}
      {resetError && <p className="text-sm text-red-600">{resetError}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? dict.settings.savingColors : dict.settings.saveColors}
        </Button>
        <button
          type="button"
          disabled={isResetting}
          onClick={() =>
            startResetTransition(async () => {
              const result = await resetClubColorsAction();
              setResetError(result.error ?? null);
            })
          }
          className="text-sm text-slate-500 hover:underline disabled:opacity-50"
        >
          {isResetting ? dict.settings.resettingColors : dict.settings.resetColors}
        </button>
      </div>
    </form>
  );
}

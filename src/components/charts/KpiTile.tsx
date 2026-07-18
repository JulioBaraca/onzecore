import { cn } from "@/lib/utils";

export interface KpiTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "bad" | "neutral";
  hint?: string;
}

const DELTA_TONE_CLASS: Record<NonNullable<KpiTileProps["deltaTone"]>, string> = {
  good: "text-emerald-700",
  bad: "text-red-700",
  neutral: "text-slate-500",
};

export function KpiTile({ label, value, delta, deltaTone = "neutral", hint }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {(delta || hint) && (
        <p className="mt-1 text-xs text-slate-400">
          {delta && <span className={cn("font-medium", DELTA_TONE_CLASS[deltaTone])}>{delta}</span>}
          {delta && hint && " · "}
          {hint}
        </p>
      )}
    </div>
  );
}

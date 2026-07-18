import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export type MatchResult = "V" | "E" | "D";

const RESULT_CLASS: Record<MatchResult, string> = {
  V: "bg-emerald-100 text-emerald-800",
  E: "bg-slate-100 text-slate-700",
  D: "bg-red-100 text-red-800",
};

export async function FormGuide({ results }: { results: MatchResult[] }) {
  const dict = await getDictionary();
  const resultLabel: Record<MatchResult, string> = {
    V: dict.dashboard.win,
    E: dict.dashboard.draw,
    D: dict.dashboard.loss,
  };

  if (results.length === 0) {
    return <p className="text-sm text-slate-400">{dict.dashboard.noRecentMatches}</p>;
  }

  return (
    <div className="flex gap-1.5">
      {results.map((result, i) => (
        <span
          key={i}
          title={resultLabel[result]}
          aria-label={resultLabel[result]}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
            RESULT_CLASS[result],
          )}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

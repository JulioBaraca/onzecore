import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export interface AlertItem {
  message: string;
  tone: "warning" | "critical" | "neutral";
}

const TONE_CLASS: Record<AlertItem["tone"], string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-red-200 bg-red-50 text-red-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export async function AlertPanel({ alerts }: { alerts: AlertItem[] }) {
  const dict = await getDictionary();

  if (alerts.length === 0) {
    return <p className="text-sm text-slate-400">{dict.dashboard.noAlerts}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((alert, i) => (
        <li
          key={i}
          className={cn("rounded-lg border px-3 py-2 text-sm", TONE_CLASS[alert.tone])}
        >
          {alert.message}
        </li>
      ))}
    </ul>
  );
}

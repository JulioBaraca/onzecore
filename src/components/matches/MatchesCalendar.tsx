"use client";

import { useMemo, useState } from "react";
import type { CalendarEntry } from "@/features/matches/calendar";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/format/number";
import { Badge } from "@/components/ui/badge";

const INTL_LOCALE: Record<Locale, string> = { pt: "pt-BR", en: "en-US" };

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/**
 * `date` columns come back as bare "YYYY-MM-DD" strings with no time
 * component. `new Date("YYYY-MM-DD")` parses that as UTC midnight, so
 * reading it back with `.getFullYear()/.getMonth()/.getDate()` shifts a day
 * in any timezone behind UTC (e.g. Brazil) - split the string instead of
 * going through `Date` at all.
 */
function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateOnly(value).split("-").map(Number);
  return { year, month: month - 1, day };
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function MatchesCalendar({
  entries,
  locale,
  dict,
  currentGameDate,
}: {
  entries: CalendarEntry[];
  locale: Locale;
  dict: Dictionary;
  currentGameDate?: string | null;
}) {
  const intlLocale = INTL_LOCALE[locale];
  const todayKey = currentGameDate ? dateOnly(currentGameDate) : null;
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const key = dateOnly(entry.date);
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return map;
  }, [entries]);

  const defaultMonth = useMemo(() => {
    // The in-game calendar has no relation to the real-world date, so
    // "current month" here means the save's own current_game_date (or, if
    // that isn't available, the earliest still-scheduled fixture) - never
    // anything compared against `new Date()`.
    if (todayKey) {
      const { year, month } = parseDateOnly(todayKey);
      return startOfMonth(year, month);
    }
    const nextScheduled = entries
      .filter((e) => e.status === "scheduled")
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (nextScheduled) {
      const { year, month } = parseDateOnly(nextScheduled.date);
      return startOfMonth(year, month);
    }
    const lastPlayed = entries
      .filter((e) => e.status === "played")
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (lastPlayed) {
      const { year, month } = parseDateOnly(lastPlayed.date);
      return startOfMonth(year, month);
    }
    const today = new Date();
    return startOfMonth(today.getFullYear(), today.getMonth());
  }, [entries, todayKey]);

  const [viewedMonth, setViewedMonth] = useState(defaultMonth);

  const monthLabel = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(viewedMonth);
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "short" }).format(new Date(2024, 0, i + 7)),
  );

  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const firstWeekday = startOfMonth(year, month).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, key });
  }

  const hasEntriesThisMonth = cells.some((cell) => cell && (byDate.get(cell.key)?.length ?? 0) > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{dict.matches.calendar}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={dict.matches.previousMonth}
            onClick={() => setViewedMonth(startOfMonth(year, month - 1))}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setViewedMonth(defaultMonth)}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {dict.matches.goToToday}
          </button>
          <span className="min-w-32 text-center text-sm font-medium capitalize text-slate-700">{monthLabel}</span>
          <button
            type="button"
            aria-label={dict.matches.nextMonth}
            onClick={() => setViewedMonth(startOfMonth(year, month + 1))}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-7 gap-1">
          {weekdayLabels.map((wd) => (
            <div key={wd} className="pb-1 text-center text-xs font-medium uppercase text-slate-400">
              {wd}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={`blank-${i}`} className="min-h-20 rounded-md" />;
            const dayEntries = byDate.get(cell.key) ?? [];
            const isToday = cell.key === todayKey;
            return (
              <div
                key={cell.key}
                className={`min-h-20 rounded-md border p-1 ${
                  isToday
                    ? "border-[var(--club-primary)] bg-[var(--club-primary-soft)]"
                    : "border-slate-100"
                }`}
              >
                <p
                  className={`text-right text-xs ${isToday ? "font-semibold text-[var(--club-primary)]" : "text-slate-400"}`}
                >
                  {cell.day}
                </p>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEntries.map((entry, idx) => {
                    const sideLabel = entry.isHome ? dict.standings.home : dict.standings.away;
                    const tone =
                      entry.status === "scheduled"
                        ? "border-sky-200 bg-sky-50 text-sky-800"
                        : entry.result === "V"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : entry.result === "D"
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-slate-200 bg-slate-50 text-slate-700";
                    return (
                      <button
                        key={idx}
                        type="button"
                        title={`${entry.opponentName} - ${entry.competitionName ?? ""} (${sideLabel})`}
                        onClick={() => setSelectedEntry(entry)}
                        className={`truncate rounded border px-1 py-0.5 text-left text-[11px] font-medium hover:brightness-95 ${tone}`}
                      >
                        {entry.isHome ? "C" : "F"} · {entry.opponentName}
                        {entry.status === "played" ? ` ${entry.homeScore}-${entry.awayScore}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasEntriesThisMonth && <p className="mt-3 text-sm text-slate-400">{dict.matches.noMatchesThisMonth}</p>}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> {dict.dashboard.win}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> {dict.dashboard.draw}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> {dict.dashboard.loss}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> {dict.matches.scheduled}
        </span>
        {todayKey && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-[var(--club-primary)] bg-[var(--club-primary-soft)]" />{" "}
            {dict.matches.goToToday}
          </span>
        )}
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-slate-900">{selectedEntry.opponentName}</p>
                <p className="text-sm text-slate-500">
                  {selectedEntry.competitionName ?? dict.common.competition} ·{" "}
                  {selectedEntry.isHome ? dict.standings.home : dict.standings.away}
                </p>
              </div>
              <button
                type="button"
                aria-label={dict.common.cancel}
                onClick={() => setSelectedEntry(null)}
                className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="mb-3 text-sm text-slate-600">{formatDate(selectedEntry.date)}</p>

            {selectedEntry.status === "played" ? (
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold tabular-nums text-slate-900">
                  {selectedEntry.homeScore} - {selectedEntry.awayScore}
                </p>
                {selectedEntry.result && (
                  <Badge
                    variant={
                      selectedEntry.result === "V" ? "success" : selectedEntry.result === "D" ? "danger" : "neutral"
                    }
                  >
                    {selectedEntry.result === "V"
                      ? dict.dashboard.win
                      : selectedEntry.result === "D"
                        ? dict.dashboard.loss
                        : dict.dashboard.draw}
                  </Badge>
                )}
              </div>
            ) : (
              <Badge variant="club">{dict.matches.scheduled}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

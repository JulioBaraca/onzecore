"use client";

import { useMemo, useState } from "react";
import { selectCareer } from "@/lib/career/actions";
import type { CareerSelectorRow } from "@/lib/career/current-career";
import { useI18n } from "@/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function isSyncSuccess(value: string | null) {
  return typeof value === "string" && /true|sucesso|success/i.test(value);
}

export function CareerSelectorList({ careers }: { careers: CareerSelectorRow[] }) {
  const { dict } = useI18n();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = careers.filter(
      (c) => !q || c.friendly_name.toLowerCase().includes(q) || c.career_id.toLowerCase().includes(q),
    );
    return [...list].sort((a, b) =>
      sortBy === "name"
        ? a.friendly_name.localeCompare(b.friendly_name)
        : new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime(),
    );
  }, [careers, query, sortBy]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder={dict.careerSelector.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setSortBy("recent")}
            className={sortBy === "recent" ? "font-semibold text-slate-900" : "text-slate-500"}
          >
            {dict.careerSelector.sortRecent}
          </button>
          <button
            type="button"
            onClick={() => setSortBy("name")}
            className={sortBy === "name" ? "font-semibold text-slate-900" : "text-slate-500"}
          >
            {dict.careerSelector.sortName}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((career) => (
          <Card key={career.career_id}>
            <CardContent className="flex flex-col gap-3 pt-5">
              <div>
                <p className="font-semibold text-slate-900">{career.friendly_name}</p>
                <p className="text-xs text-slate-400">{career.career_id}</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                <dt className="text-slate-400">{dict.careerSelector.season}</dt>
                <dd>{career.current_season ?? dict.common.noData}</dd>
                <dt className="text-slate-400">{dict.careerSelector.version}</dt>
                <dd>{career.game_version ?? dict.common.noData}</dd>
                <dt className="text-slate-400">{dict.careerSelector.lastSync}</dt>
                <dd>
                  {career.last_sync_finished_at
                    ? new Date(career.last_sync_finished_at).toLocaleDateString()
                    : dict.common.noData}
                </dd>
                <dt className="text-slate-400">{dict.careerSelector.status}</dt>
                <dd>
                  <Badge variant={isSyncSuccess(career.last_sync_success) ? "success" : "neutral"}>
                    {career.last_sync_success ?? dict.careerSelector.noStatusData}
                  </Badge>
                </dd>
              </dl>
              <form action={selectCareer.bind(null, career.career_id)}>
                <Button type="submit" className="w-full">
                  {dict.careerSelector.continueButton}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

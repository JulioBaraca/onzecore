"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatInteger } from "@/lib/format/number";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { MatchRow } from "@/features/matches/queries";

export function buildMatchColumns(dict: Dictionary): ColumnDef<MatchRow>[] {
  return [
    {
      accessorKey: "match_date",
      header: dict.matches.date,
      cell: ({ row }) => formatDate(row.original.match_date),
      sortingFn: (a, b) => (a.original.match_date_sort ?? "").localeCompare(b.original.match_date_sort ?? ""),
    },
    {
      accessorKey: "competition_name",
      header: dict.matches.competition,
      cell: ({ row }) => row.original.competition_name ?? dict.common.noData,
    },
    {
      accessorKey: "home_team_name",
      header: dict.matches.home,
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">{row.original.home_team_name ?? dict.common.noData}</span>
      ),
    },
    {
      accessorKey: "away_team_name",
      header: dict.matches.away,
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">{row.original.away_team_name ?? dict.common.noData}</span>
      ),
    },
    {
      id: "score",
      header: dict.matches.score,
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatInteger(row.original.home_score)} - {formatInteger(row.original.away_score)}
        </span>
      ),
    },
    {
      id: "result",
      header: dict.matches.result,
      cell: ({ row }) => {
        const result = row.original.result;
        if (!result) return dict.common.noData;
        return (
          <Badge variant={result === "V" ? "success" : result === "D" ? "danger" : "neutral"}>
            {result === "V" ? dict.dashboard.win : result === "D" ? dict.dashboard.loss : dict.dashboard.draw}
          </Badge>
        );
      },
    },
  ];
}

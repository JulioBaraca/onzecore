"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatInteger } from "@/lib/format/number";
import { potentialGap } from "@/lib/kpi/formulas";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { YouthPlayerRow } from "@/features/youth-academy/queries";

export function buildYouthColumns(dict: Dictionary): ColumnDef<YouthPlayerRow>[] {
  return [
    {
      accessorKey: "player_name",
      header: dict.youth.player,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{row.original.player_name ?? dict.common.noData}</span>
      ),
    },
    { accessorKey: "position", header: dict.youth.position },
    { accessorKey: "age", header: dict.youth.age, cell: ({ row }) => formatInteger(row.original.age) },
    { accessorKey: "overall", header: dict.youth.overall, cell: ({ row }) => formatInteger(row.original.overall) },
    {
      accessorKey: "potential",
      header: dict.youth.potential,
      cell: ({ row }) => formatInteger(row.original.potential),
    },
    {
      id: "gap",
      header: dict.youth.gap,
      accessorFn: (row) => potentialGap(row.potential, row.overall) ?? 0,
      cell: ({ getValue }) => formatInteger(getValue<number>()),
    },
    {
      id: "status",
      header: dict.youth.status,
      cell: ({ row }) => {
        if (row.original.promoted_to_first_team) {
          return <Badge variant="success">{dict.youth.promoted}</Badge>;
        }
        if (row.original.exit_date) {
          return <Badge variant="neutral">{dict.youth.departed}</Badge>;
        }
        return <Badge variant="club">{row.original.academy_status ?? dict.common.noData}</Badge>;
      },
    },
  ];
}

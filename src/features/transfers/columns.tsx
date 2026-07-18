"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, toNumber } from "@/lib/format/number";
import { isTransferIn, isTransferOut } from "@/lib/dedupe/transfers";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { TransferRow } from "@/features/transfers/summary";

export function buildTransferColumns(dict: Dictionary, currency: string | null): ColumnDef<TransferRow>[] {
  return [
    {
      accessorKey: "game_date",
      header: dict.transfers.date,
      cell: ({ row }) => formatDate(row.original.game_date),
    },
    {
      accessorKey: "player_name",
      header: dict.transfers.player,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{row.original.player_name ?? dict.common.noData}</span>
      ),
    },
    { accessorKey: "origin_team_name", header: dict.transfers.origin },
    { accessorKey: "destination_team_name", header: dict.transfers.destination },
    {
      accessorKey: "transfer_direction",
      header: dict.transfers.direction,
      cell: ({ row }) => {
        const direction = row.original.transfer_direction;
        if (isTransferIn(direction)) {
          return <Badge variant="warning">{dict.transfers.in}</Badge>;
        }
        if (isTransferOut(direction)) {
          return <Badge variant="success">{dict.transfers.out}</Badge>;
        }
        // Neither in nor out for the user's club - e.g. TRANSFERENCIA_EXTERNA,
        // a move between two other clubs surfaced only as league context.
        return <Badge variant="neutral">{dict.transfers.external}</Badge>;
      },
    },
    { accessorKey: "transfer_type", header: dict.transfers.type },
    {
      accessorKey: "transfer_value",
      header: dict.transfers.value,
      cell: ({ row }) => formatCurrency(row.original.transfer_value, currency),
      sortingFn: (a, b) => (toNumber(a.original.transfer_value) ?? 0) - (toNumber(b.original.transfer_value) ?? 0),
    },
  ];
}

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/DataTable";
import { buildSquadColumns } from "@/features/squad/columns";
import { useI18n } from "@/providers/i18n-provider";
import type { SquadPlayerRow } from "@/features/squad/queries";

export function SquadTable({
  players,
  currency,
}: {
  players: SquadPlayerRow[];
  currency: string | null;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const columns = useMemo(() => buildSquadColumns(dict, currency), [dict, currency]);

  return (
    <DataTable
      columns={columns}
      data={players}
      searchPlaceholder={dict.squad.searchPlaceholder}
      onRowClick={(row) => row.player_id && router.push(`/squad/${row.player_id}`)}
    />
  );
}

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/DataTable";
import { buildYouthColumns } from "@/features/youth-academy/columns";
import { useI18n } from "@/providers/i18n-provider";
import type { YouthPlayerRow } from "@/features/youth-academy/queries";

export function YouthTable({ players }: { players: YouthPlayerRow[] }) {
  const { dict } = useI18n();
  const router = useRouter();
  const columns = useMemo(() => buildYouthColumns(dict), [dict]);

  return (
    <DataTable
      columns={columns}
      data={players}
      searchPlaceholder={dict.youth.searchPlaceholder}
      onRowClick={(row) => row.player_id && router.push(`/youth-academy/${row.player_id}`)}
    />
  );
}

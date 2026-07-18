"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { buildMatchColumns } from "@/features/matches/columns";
import { useI18n } from "@/providers/i18n-provider";
import type { MatchRow } from "@/features/matches/queries";

export function MatchesTable({ matches }: { matches: MatchRow[] }) {
  const { dict } = useI18n();
  const columns = useMemo(() => buildMatchColumns(dict), [dict]);

  return <DataTable columns={columns} data={matches} />;
}

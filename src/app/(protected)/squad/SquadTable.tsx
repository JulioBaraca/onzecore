"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/DataTable";
import { buildSquadColumns, isLoanedOutExit } from "@/features/squad/columns";
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
  const [hideLoanedOut, setHideLoanedOut] = useState(false);
  const columns = useMemo(() => buildSquadColumns(dict, currency), [dict, currency]);

  const filteredPlayers = useMemo(
    () => (hideLoanedOut ? players.filter((p) => !isLoanedOutExit(p.loan_status)) : players),
    [players, hideLoanedOut],
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={hideLoanedOut}
          onChange={(e) => setHideLoanedOut(e.target.checked)}
          className="h-4 w-4 accent-[var(--club-primary)]"
        />
        {dict.squad.hideLoanedOut}
      </label>

      <DataTable
        columns={columns}
        data={filteredPlayers}
        searchPlaceholder={dict.squad.searchPlaceholder}
        onRowClick={(row) => row.player_id && router.push(`/squad/${row.player_id}`)}
        rowClassName={(row) => (isLoanedOutExit(row.loan_status) ? "bg-amber-50" : undefined)}
      />
    </div>
  );
}

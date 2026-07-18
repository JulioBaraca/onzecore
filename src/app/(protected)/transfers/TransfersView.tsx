"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { buildTransferColumns } from "@/features/transfers/columns";
import { summarizeTransfers, type TransferRow } from "@/features/transfers/summary";
import { useI18n } from "@/providers/i18n-provider";
import { KpiTile } from "@/components/charts/KpiTile";
import { formatCurrency, formatInteger } from "@/lib/format/number";

export function TransfersView({
  rows,
  currency,
  userTeamId,
}: {
  rows: TransferRow[];
  currency: string | null;
  userTeamId: string | null;
}) {
  const { dict } = useI18n();
  const [onlyMyTeam, setOnlyMyTeam] = useState(false);

  const filteredRows = useMemo(() => {
    if (!onlyMyTeam || !userTeamId) return rows;
    return rows.filter((t) => t.origin_team_id === userTeamId || t.destination_team_id === userTeamId);
  }, [rows, onlyMyTeam, userTeamId]);

  const summary = useMemo(() => summarizeTransfers(filteredRows), [filteredRows]);
  const columns = useMemo(() => buildTransferColumns(dict, currency), [dict, currency]);

  return (
    <div className="flex flex-col gap-4">
      {userTeamId && (
        <label className="flex w-fit items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={onlyMyTeam}
            onChange={(e) => setOnlyMyTeam(e.target.checked)}
            className="h-4 w-4 accent-[var(--club-primary)]"
          />
          {dict.transfers.onlyMyTeam}
        </label>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile label={dict.transfers.transfersIn} value={formatInteger(summary.transfersIn)} />
        <KpiTile label={dict.transfers.transfersOut} value={formatInteger(summary.transfersOut)} />
        <KpiTile label={dict.transfers.grossSpend} value={formatCurrency(summary.grossSpend, currency)} />
        <KpiTile label={dict.transfers.grossIncome} value={formatCurrency(summary.grossIncome, currency)} />
        <KpiTile
          label={dict.transfers.netBalance}
          value={formatCurrency(summary.netBalance, currency)}
          deltaTone={summary.netBalance >= 0 ? "good" : "bad"}
        />
      </section>

      <DataTable columns={columns} data={filteredRows} />
    </div>
  );
}

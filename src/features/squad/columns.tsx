"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatInteger, toNumber } from "@/lib/format/number";
import { positionSortIndex } from "@/lib/domain/position-order";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SquadPlayerRow } from "@/features/squad/queries";

// injury_status/loan_status vocabulary is free text from the ingestion
// pipeline (not a fixed enum) - confirmed real value for a healthy player
// is the English "FIT" (fc26_elenco.injury_status), alongside the
// Portuguese synonyms - a non-empty value other than one of those "healthy"
// markers is treated as currently injured.
function isInjured(status: string | null) {
  return typeof status === "string" && status.trim() !== "" && !/none|nenhum|saudavel|saudável|\bfit\b/i.test(status);
}

function isOnLoan(status: string | null) {
  return typeof status === "string" && /loan|emprestim|emprestad/i.test(status);
}

/** Confirmed exact value for a player out on loan (fc26_elenco.loan_status). */
export function isLoanedOutExit(loanStatus: string | null) {
  return loanStatus === "EMPRESTADO_SAIDA";
}

export function buildSquadColumns(dict: Dictionary, currency: string | null): ColumnDef<SquadPlayerRow>[] {
  return [
    {
      accessorKey: "player_name",
      header: dict.squad.player,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{row.original.player_name ?? dict.common.noData}</span>
      ),
    },
    {
      accessorKey: "shirt_number",
      header: dict.squad.number,
      cell: ({ row }) => formatInteger(row.original.shirt_number),
    },
    {
      accessorKey: "position",
      header: dict.squad.position,
      sortingFn: (a, b) => positionSortIndex(a.original.position) - positionSortIndex(b.original.position),
    },
    {
      accessorKey: "age",
      header: dict.squad.age,
      cell: ({ row }) => formatInteger(row.original.age),
    },
    {
      accessorKey: "overall",
      header: dict.squad.overall,
      cell: ({ row }) => formatInteger(row.original.overall),
    },
    {
      accessorKey: "potential",
      header: dict.squad.potential,
      cell: ({ row }) => formatInteger(row.original.potential),
    },
    {
      accessorKey: "value",
      header: dict.squad.value,
      cell: ({ row }) => formatCurrency(row.original.value, currency),
      sortingFn: (a, b) => (toNumber(a.original.value) ?? 0) - (toNumber(b.original.value) ?? 0),
    },
    {
      accessorKey: "wage",
      header: dict.squad.wage,
      cell: ({ row }) => formatCurrency(row.original.wage, currency),
      sortingFn: (a, b) => (toNumber(a.original.wage) ?? 0) - (toNumber(b.original.wage) ?? 0),
    },
    {
      accessorKey: "contract_end",
      header: dict.squad.contractEnd,
      cell: ({ row }) => formatDate(row.original.contract_end),
    },
    {
      accessorKey: "season_appearances",
      header: dict.squad.appearances,
      cell: ({ row }) => formatInteger(row.original.season_appearances),
    },
    {
      accessorKey: "season_goals",
      header: dict.squad.goals,
      cell: ({ row }) => formatInteger(row.original.season_goals),
    },
    {
      accessorKey: "season_assists",
      header: dict.squad.assists,
      cell: ({ row }) => formatInteger(row.original.season_assists),
    },
    {
      id: "homegrown",
      header: dict.squad.homegrown,
      accessorFn: (row) => (row.promovido_base ? 1 : 0),
      cell: ({ row }) =>
        row.original.promovido_base ? (
          <Badge variant="club-secondary">{dict.common.yes}</Badge>
        ) : (
          <span className="text-slate-400">{dict.common.no}</span>
        ),
    },
    {
      // Combines injury and loan state under one "Status" column - previously
      // labeled just "Lesionado" even though it could also show an
      // "Empréstimo" badge, which was confusing.
      id: "status",
      header: dict.squad.status,
      cell: ({ row }) => {
        const injured = isInjured(row.original.injury_status);
        const onLoan = isOnLoan(row.original.loan_status);
        if (!injured && !onLoan) {
          return <span className="text-slate-400">{dict.common.noData}</span>;
        }
        return (
          <div className="flex gap-1">
            {injured && <Badge variant="danger">{dict.squad.injured}</Badge>}
            {onLoan && <Badge variant="warning">{dict.squad.loan}</Badge>}
          </div>
        );
      },
    },
  ];
}

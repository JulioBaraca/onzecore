import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getCurrentFinance } from "@/features/finance/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { formatCurrency } from "@/lib/format/number";
import { wageBudgetOccupancy } from "@/lib/kpi/formulas";

export default async function FinancePage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;
  const finance = await getCurrentFinance(career.career_id);

  if (!finance) {
    return (
      <>
        <PageHeader title={dict.nav.finance} description={career.friendly_name} />
        <EmptyState title={dict.common.noRecordsTitle} description={dict.common.noRecordsDescription} />
      </>
    );
  }

  const currency = finance.currency;
  const occupancy = wageBudgetOccupancy(finance.current_weekly_wages, finance.wage_budget);

  return (
    <>
      <PageHeader title={dict.nav.finance} description={career.friendly_name} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiTile label={dict.finance.clubBalance} value={formatCurrency(finance.club_balance, currency)} />
        <KpiTile label={dict.finance.transferBudget} value={formatCurrency(finance.transfer_budget, currency)} />
        <KpiTile label={dict.finance.wageBudget} value={formatCurrency(finance.wage_budget, currency)} />
        <KpiTile
          label={dict.finance.currentWeeklyWages}
          value={formatCurrency(finance.current_weekly_wages, currency)}
          delta={occupancy !== null ? `${occupancy.toFixed(0)}${dict.dashboard.ofBudget}` : undefined}
          deltaTone={occupancy !== null && occupancy > 100 ? "bad" : "neutral"}
        />
        <KpiTile label={dict.finance.annualWageCost} value={formatCurrency(finance.annual_wage_cost, currency)} />
        <KpiTile label={dict.finance.transferIncome} value={formatCurrency(finance.transfer_income, currency)} />
        <KpiTile label={dict.finance.transferExpenses} value={formatCurrency(finance.transfer_expenses, currency)} />
        <KpiTile
          label={dict.finance.transferNetBalance}
          value={formatCurrency(finance.transfer_net_balance, currency)}
        />
        <KpiTile label={dict.finance.seasonIncome} value={formatCurrency(finance.season_income, currency)} />
        <KpiTile label={dict.finance.seasonExpenses} value={formatCurrency(finance.season_expenses, currency)} />
        <KpiTile
          label={dict.finance.seasonNetCashFlow}
          value={formatCurrency(finance.season_net_cash_flow, currency)}
        />
      </section>
    </>
  );
}

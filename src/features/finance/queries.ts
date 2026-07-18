import { createClient } from "@/lib/supabase/server";

export interface FinanceRow {
  currency: string | null;
  transfer_budget: unknown;
  club_balance: unknown;
  wage_budget: unknown;
  current_weekly_wages: unknown;
  annual_wage_cost: unknown;
  transfer_income: unknown;
  transfer_expenses: unknown;
  transfer_net_balance: unknown;
  season_income: unknown;
  season_expenses: unknown;
  season_net_cash_flow: unknown;
}

export async function getCurrentFinance(careerId: string): Promise<FinanceRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_fc26_current_finance")
    .select(
      "currency, transfer_budget, club_balance, wage_budget, current_weekly_wages, annual_wage_cost, transfer_income, transfer_expenses, transfer_net_balance, season_income, season_expenses, season_net_cash_flow",
    )
    .eq("career_id", careerId)
    .limit(1)
    .maybeSingle();

  return (data as unknown as FinanceRow | null) ?? null;
}

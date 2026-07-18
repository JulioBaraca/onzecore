import { toNumber } from "@/lib/format/number";

/** Aproveitamento: ((vitórias * 3) + empates) / (jogos * 3) * 100 */
export function winRate(wins: unknown, draws: unknown, played: unknown): number | null {
  const w = toNumber(wins) ?? 0;
  const d = toNumber(draws) ?? 0;
  const p = toNumber(played);
  if (!p || p <= 0) return null;
  return ((w * 3 + d) / (p * 3)) * 100;
}

/**
 * Aproveitamento derivado direto da pontuação (equivalente a winRate quando
 * points = wins*3 + draws): points / (played * 3) * 100. Preferido quando
 * só há points/played disponíveis (ex.: janela de classificação), sem
 * precisar decompor em vitórias/empates.
 */
export function pointsPercentage(points: unknown, played: unknown): number | null {
  const pts = toNumber(points);
  const p = toNumber(played);
  if (pts === null || !p || p <= 0) return null;
  return (pts / (p * 3)) * 100;
}

/** Participação em gols: (gols + assistências) / gols totais da equipe * 100 */
export function goalParticipation(
  goals: unknown,
  assists: unknown,
  teamTotalGoals: unknown,
): number | null {
  const g = toNumber(goals) ?? 0;
  const a = toNumber(assists) ?? 0;
  const total = toNumber(teamTotalGoals);
  if (!total || total <= 0) return null;
  return ((g + a) / total) * 100;
}

/** Gap de potencial: potential - overall */
export function potentialGap(potential: unknown, overall: unknown): number | null {
  const pot = toNumber(potential);
  const ovr = toNumber(overall);
  if (pot === null || ovr === null) return null;
  return pot - ovr;
}

/** Evolução (carreira ou temporada): overall atual - overall inicial */
export function overallEvolution(currentOverall: unknown, baselineOverall: unknown): number | null {
  const cur = toNumber(currentOverall);
  const base = toNumber(baselineOverall);
  if (cur === null || base === null) return null;
  return cur - base;
}

/** Utilização: aparições / jogos elegíveis * 100 */
export function utilizationRate(appearances: unknown, eligibleGames: unknown): number | null {
  const app = toNumber(appearances) ?? 0;
  const eligible = toNumber(eligibleGames);
  if (!eligible || eligible <= 0) return null;
  return (app / eligible) * 100;
}

/** Saldo de transferências: receitas - despesas */
export function transferNetBalance(income: unknown, expenses: unknown): number | null {
  const inc = toNumber(income) ?? 0;
  const exp = toNumber(expenses) ?? 0;
  return inc - exp;
}

/** Ocupação do orçamento salarial: folha atual / orçamento salarial * 100 */
export function wageBudgetOccupancy(currentWeeklyWages: unknown, wageBudget: unknown): number | null {
  const cur = toNumber(currentWeeklyWages) ?? 0;
  const budget = toNumber(wageBudget);
  if (!budget || budget <= 0) return null;
  return (cur / budget) * 100;
}

export function sumBy<T>(items: T[], pick: (item: T) => unknown): number {
  return items.reduce((total, item) => total + (toNumber(pick(item)) ?? 0), 0);
}

export function averageBy<T>(items: T[], pick: (item: T) => unknown): number | null {
  const values = items.map(pick).map(toNumber).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

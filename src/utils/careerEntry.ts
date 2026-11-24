import { getCnavCoeff } from '../constants/cnavCoefficients';
import { FRF_TO_EUR_RATE, getPassForYear } from '../constants/passHistory';
import type { CareerYear } from '../types/retirement';

export const FIRST_CAREER_YEAR = 1948;

export type CareerEntry = Pick<CareerYear,
  'year' | 'currency' | 'grossIncome' | 'regime' | 'validatedQuarters' | 'contributedQuarters'
  | 'agircPoints' | 'eventType' | 'samIncomeKind'
>;

export function toCareerYear(entry: CareerEntry, liquidationYear: number): CareerYear {
  const grossIncomeEur = entry.currency === 'FRF'
    ? Number((entry.grossIncome / FRF_TO_EUR_RATE).toFixed(2))
    : entry.grossIncome;
  const passEur = getPassForYear(entry.year);
  const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
  const cnavCoeff = getCnavCoeff(entry.year, liquidationYear);
  const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));
  return { ...entry, grossIncomeEur, passEur, retainedSalaryEur, cnavCoeff, revaluedSalaryEur };
}

export function validQuarterCount(count: number | undefined): count is number {
  return count !== undefined && Number.isInteger(count) && count >= 0;
}

export function careerQuarters(career: CareerYear[], birthYear: number, departure: string) {
  const [departureYear, departureMonth] = departure.split('-').map(Number);
  const rowsByYear = new Map<number, Map<CareerYear['regime'], CareerYear[]>>();
  for (const row of career) {
    if (!Number.isInteger(row.year) || row.year < birthYear || row.year > departureYear) continue;
    const regimes = rowsByYear.get(row.year) ?? new Map<CareerYear['regime'], CareerYear[]>();
    const rows = regimes.get(row.regime) ?? [];
    rows.push(row);
    regimes.set(row.regime, rows);
    rowsByYear.set(row.year, regimes);
  }

  let contributed = 0;
  const validatedByYear = new Map<number, number>();
  for (const [year, regimes] of rowsByYear) {
    let validated = 0;
    let paid = 0;
    const limit = year === departureYear ? Math.floor((departureMonth - 1) / 3) : 4;
    for (const rows of regimes.values()) {
      // Multiple annual totals for the same regime are treated as overlapping.
      validated += Math.max(0, ...rows.map((row) => validQuarterCount(row.validatedQuarters) ? row.validatedQuarters : 0));
      paid += Math.max(0, ...rows.map((row) => validQuarterCount(row.contributedQuarters) ? row.contributedQuarters : 0));
    }
    validatedByYear.set(year, Math.min(limit, validated));
    contributed += Math.min(limit, paid);
  }
  return { contributed, validatedByYear };
}

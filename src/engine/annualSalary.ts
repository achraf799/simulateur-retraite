import { getCnavCoeff, getCnavRevaluationYear } from '../constants/cnavCoefficients';
import { FRF_TO_EUR_RATE, getPassForYear, LAST_CONFIRMED_PASS_YEAR } from '../constants/passHistory';
import { getSamQuarterThreshold } from '../constants/samQuarterThresholds';
import type { CareerYear, SamAnalysis, SamIncomeKind, SamYear, UserProfile } from '../types/retirement';

export function samIncomeKind(row: CareerYear): SamIncomeKind {
  if (row.samIncomeKind !== undefined) return row.samIncomeKind;
  return row.eventType === 'Activité' || row.eventType === 'AVPF'
    ? 'salary'
    : 'excluded';
}

function euros(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateAnnualSalary(
  profile: UserProfile,
  career: CareerYear[],
  birthYear: number,
  liquidationYear: number,
): SamAnalysis {
  const eligibleChildren = profile.samEligibleChildren ?? 0;
  const parentalRuleApplies = profile.desiredDepartureDate >= '2026-09-01';
  const yearLimit = parentalRuleApplies ? 25 - eligibleChildren : 25;
  const result = {
    yearLimit,
    parentAdjustmentPending: parentalRuleApplies && profile.childrenCount > 0 && profile.samEligibleChildren === undefined,
  };
  if (profile.careerMode === 'express' && profile.expressData) {
    const amount = profile.expressData.estimatedSam;
    return Number.isFinite(amount) && amount > 0
      ? { ...result, source: 'express', amount, years: [], topYears: [] }
      : { ...result, source: 'unavailable', amount: 0, years: [], topYears: [] };
  }

  const revaluationYear = getCnavRevaluationYear(liquidationYear);
  if (revaluationYear === undefined) {
    return { ...result, source: 'unavailable', amount: 0, years: [], topYears: [] };
  }

  const groups = new Map<number, CareerYear[]>();
  for (const row of career) {
    if (!Number.isInteger(row.year)) continue;
    const rows = groups.get(row.year) ?? [];
    rows.push(row);
    groups.set(row.year, rows);
  }

  const activeRegimes = new Set(career
    .filter((row) => row.year < liquidationYear && (row.validatedQuarters > 0
      || (row.grossIncome > 0 && samIncomeKind(row) === 'salary')))
    .map((row) => row.regime));
  const isLura = profile.specialCircumstances?.polycotisantMsa || activeRegimes.size > 1;
  const years: SamYear[] = [];
  for (const [year, rows] of groups) {
    const salaryRows = rows.filter((row) => samIncomeKind(row) === 'salary'
      && Number.isFinite(row.grossIncome) && row.grossIncome > 0);
    const salary = salaryRows.reduce((sum, row) => sum + (row.currency === 'FRF'
      ? row.grossIncome / FRF_TO_EUR_RATE : row.grossIncome), 0);
    const ceilingEur = isLura || year >= 2005 ? getPassForYear(year) : undefined;
    const retainedSalary = ceilingEur === undefined ? salary : Math.min(ceilingEur, salary);
    const threshold = getSamQuarterThreshold(year);
    const coefficient = getCnavCoeff(year, liquidationYear);
    let status: SamYear['status'] = 'outsideTopYears';
    if (year < 1948 || year < birthYear) status = 'beforeCareer';
    else if (!Number.isFinite(liquidationYear) || year >= liquidationYear) status = 'fromLiquidation';
    else if (rows.some((row) => samIncomeKind(row) === 'buyback')) status = 'buyback';
    else if (salary === 0) status = 'noPensionableIncome';
    else if (threshold !== undefined && retainedSalary + Number.EPSILON * threshold < threshold) status = 'belowThreshold';
    else if (threshold === undefined && !salaryRows.some((row) => row.contributedQuarters > 0)) {
      status = 'unconfirmedThreshold';
    }

    years.push({
      year, salaryEur: euros(salary), ceilingEur, retainedSalaryEur: euros(retainedSalary), coefficient,
      revaluedSalaryEur: euros(retainedSalary * coefficient), status,
    });
  }

  const selected = years.filter(({ status }) => status === 'outsideTopYears')
    .sort((a, b) => b.revaluedSalaryEur - a.revaluedSalaryEur || b.year - a.year)
    .slice(0, yearLimit);
  for (const year of selected) year.status = 'selected';
  const sum = selected.reduce((total, year) => total + year.revaluedSalaryEur, 0);

  return {
    ...result,
    source: selected.length ? 'career' : 'unavailable',
    amount: selected.length ? euros(sum / selected.length) : 0,
    years: years.sort((a, b) => a.year - b.year),
    topYears: selected.map(({ year }) => year),
    revaluationYear,
    usesProjectedRevaluation: liquidationYear > revaluationYear,
    projectedPassYears: selected
      .filter(({ year, ceilingEur }) => year > LAST_CONFIRMED_PASS_YEAR && ceilingEur !== undefined)
      .map(({ year }) => year)
      .sort((a, b) => a - b),
  };
}

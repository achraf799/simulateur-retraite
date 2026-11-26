import { describe, expect, it } from 'vitest';
import { calculateRetirement } from './retirementCalculator';
import { SAKURA_CAREER, SAKURA_PROFILE } from '../constants/scenarios';
import type { CareerYear, UserProfile } from '../types/retirement';
import { exportCareerToCsv, importCareerFromCsv } from '../utils/csvHelper';

function careerRow(year: number, grossIncome: number, overrides: Partial<CareerYear> = {}): CareerYear {
  return {
    ...SAKURA_CAREER[0],
    year, grossIncome, currency: 'EUR', validatedQuarters: 4, contributedQuarters: 4,
    ...overrides,
  };
}

function simulate(career: CareerYear[], overrides: Partial<UserProfile> = {}) {
  return calculateRetirement({
    ...SAKURA_PROFILE,
    birthDate: '1960-01-01',
    desiredDepartureDate: '2026-04-01',
    childrenCount: 0,
    specialCircumstances: undefined,
    cerEnabled: false,
    ...overrides,
  }, career);
}

describe('Salaire annuel moyen de la retraite de base', () => {
  it('divise par les deux années admissibles et écarte la liquidation et les années suivantes', () => {
    const result = simulate([
      careerRow(2024, 20000),
      careerRow(2025, 30000),
      careerRow(2026, 46000),
      careerRow(2027, 47000),
    ]);
    expect(result.topYears).toEqual([2025, 2024]);
    expect(result.sam).toBe(25445);
    expect(result.samAnalysis.yearLimit).toBe(25);
  });

  it('vérifie le seuil après agrégation par année et applique un seul PASS', () => {
    const result = simulate([
      careerRow(2024, 900, { validatedQuarters: 0, contributedQuarters: 0 }),
      careerRow(2024, 900, { regime: 'MSA', validatedQuarters: 0, contributedQuarters: 0 }),
      careerRow(2025, 30000),
      careerRow(2025, 30000, { regime: 'MSA' }),
    ]);
    expect(result.topYears).toEqual([2025, 2024]);
    expect(result.samAnalysis.years).toMatchObject([
      { year: 2024, salaryEur: 1800, status: 'selected' },
      { year: 2025, salaryEur: 60000, retainedSalaryEur: 47100, status: 'selected' },
    ]);
    expect(result.sam).toBe(24689.85);
  });

  it('sépare un revenu de remplacement, un salaire AVPF et une année exclue pour rachat', () => {
    const result = simulate([
      careerRow(2022, 20000, { eventType: 'Chômage', contributedQuarters: 4 }),
      careerRow(2023, 15000, { eventType: 'AVPF', contributedQuarters: 0 }),
      careerRow(2024, 30000),
      careerRow(2024, 0, { samIncomeKind: 'buyback' }),
      careerRow(2025, 1700, { eventType: 'Activité', contributedQuarters: 1 }),
    ]);
    expect(result.topYears).toEqual([2023]);
    expect(result.samAnalysis.years.map((year) => year.status)).toEqual([
      'noPensionableIncome', 'selected', 'buyback', 'belowThreshold',
    ]);
  });

  it('retient un salaire déclaré au compte dans une année marquée par une interruption', () => {
    const result = simulate([
      careerRow(2024, 12000, { eventType: 'Maternité', samIncomeKind: 'salary' }),
    ]);
    expect(result.topYears).toEqual([2024]);
  });

  it('compare les salaires historiques en francs au seuil de la même année', () => {
    const result = simulate([
      careerRow(1979, 2261, { currency: 'FRF' }),
      careerRow(1980, 2586, { currency: 'FRF' }),
    ]);
    expect(result.topYears).toEqual([1980]);
  });

  it.each([
    ['2026-08-01', 2, 25],
    ['2026-09-01', undefined, 25],
    ['2026-09-01', 0, 25],
    ['2026-09-01', 1, 24],
    ['2026-09-01', 2, 23],
  ] as const)('applique à la date %s le plafond correspondant à %s enfant(s) admissible(s)', (date, children, limit) => {
    const career = Array.from({ length: 26 }, (_, index) => careerRow(2000 + index, 20000 + 100 * index));
    const result = simulate(career, {
      desiredDepartureDate: date, childrenCount: 3, samEligibleChildren: children, sex: 'M',
    });
    expect(result.samYearsCount).toBe(limit);
    expect(result.topYears).toHaveLength(limit);
    expect(result.samAnalysis.parentAdjustmentPending).toBe(children === undefined);
  });

  it('réutilise les derniers paramètres disponibles en signalant une liquidation future', () => {
    const result = simulate([careerRow(2026, 60000), careerRow(2027, 60000), careerRow(2028, 60000)], {
      desiredDepartureDate: '2029-01-01',
    });
    expect(result.samAnalysis).toMatchObject({
      revaluationYear: 2026, usesProjectedRevaluation: true, projectedPassYears: [2027, 2028],
      years: [
        { year: 2026, ceilingEur: 48060, coefficient: 1 },
        { year: 2027, ceilingEur: 48900, coefficient: 1 },
        { year: 2028, ceilingEur: 48900, coefficient: 1 },
      ],
    });
  });

  it('conserve le SAM saisi en express, même si le relevé est présent', () => {
    const result = simulate([careerRow(2025, 30000)], {
      careerMode: 'express',
      expressData: { totalQuarters: 170, contributedQuarters: 170, estimatedSam: 27654, agircPoints: 5000 },
    });
    expect(result.samAnalysis).toMatchObject({ source: 'express', amount: 27654, topYears: [] });
  });

  it('déclare le résultat indisponible sans année admissible', () => {
    const result = simulate([careerRow(2024, 0), careerRow(2026, 30000)]);
    expect(result.samAnalysis).toMatchObject({ source: 'unavailable', topYears: [] });
    expect(Number.isFinite(result.sam)).toBe(true);
  });

  it('conserve le traitement SAM et les points datés dans un aller-retour CSV compatible avec l’ancien format', () => {
    const rows = [
      careerRow(2023, 21000, { samIncomeKind: 'excluded' }),
      careerRow(2024, 30000, {
        samIncomeKind: 'buyback',
        agircPoints: 400,
        agircPointsAtDeparture: { date: '2024-07-01', points: 0 },
      }),
    ];
    const csv = exportCareerToCsv(rows);
    const imported = importCareerFromCsv(csv);
    expect(imported.map((row) => row.samIncomeKind)).toEqual(['excluded', 'buyback']);
    expect(imported[1].agircPoints).toBe(400);
    expect(imported[1].agircPointsAtDeparture).toEqual({ date: '2024-07-01', points: 0 });
    const previousFormat = csv.split('\n').map((line) => line.split(',').slice(0, 8).join(',')).join('\n');
    expect(simulate(importCareerFromCsv(previousFormat)).topYears).toHaveLength(2);
  });
});

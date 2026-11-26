import { describe, expect, it } from 'vitest';
import { SAKURA_CAREER, SAKURA_PROFILE } from '../constants/scenarios';
import type { UserProfile } from '../types/retirement';
import { calculateRetirement } from './retirementCalculator';

const earlyRetirement2027: Pick<UserProfile, 'birthDate' | 'specialCircumstances'> = {
  birthDate: '1966-12-01',
  specialCircumstances: {
    earlyCareer: true,
    earlyQuartersCount: 0,
    earlyCareerQuarters: { 16: 4 },
    longCareerConfirmedQuarters: 172,
    careerInterruptions: false,
    sicknessQuarters: 0,
    maternityQuarters: 0,
    unemploymentQuarters: 0,
    avpfQuarters: 0,
    automaticFullRate: false,
    fullRateReason: 'none',
    polycotisantMsa: false,
  },
};

function simulateCer(overrides: Partial<UserProfile> = {}) {
  const profile: UserProfile = {
    ...SAKURA_PROFILE,
    birthDate: '1963-01-01',
    desiredDepartureDate: '2027-01-01',
    cerResumptionDate: '2027-01-01',
    cerAllPensionsLiquidated: true,
    ...overrides,
  };
  return calculateRetirement(profile, SAKURA_CAREER).cerAnalysis;
}

describe('Cumul emploi-retraite', () => {
  it.each([
    ['2026-12-01', undefined, 'before2027'],
    ['2027-01-01', undefined, 'from2027'],
    ['2027-01-01', '2026-12-01', 'before2027'],
  ] as const)('choisit le régime du départ %s et de la première pension %s', (departure, first, regime) => {
    const cer = simulateCer({
      desiredDepartureDate: departure,
      cerFirstBasePensionDate: first,
      cerResumptionDate: '2027-02-01',
    });
    expect(cer.regime).toBe(regime);
  });

  it('réduit euro pour euro avant l’âge légal, sans nouveaux droits', () => {
    const cer = simulateCer({
      ...earlyRetirement2027,
      cerIncomeByPeriod: { beforeLegalAge: 5000 },
    });
    expect(cer.annualReduction).toBe(5000);
    expect(cer.generatesNewRights).toBe(false);
  });

  it.each([[7000, 0], [10000, 1500]])('applique le seuil de 7 000 € à %i € de revenus', (income, reduction) => {
    const cer = simulateCer({ cerIncomeByPeriod: { beforeFullRateAge: income } });
    expect(cer.annualReduction).toBe(reduction);
    expect(cer.generatesNewRights).toBe(false);
  });

  it('borne la réduction à la pension correspondant à un seul mois d’activité', () => {
    const profile: UserProfile = {
      ...SAKURA_PROFILE,
      ...earlyRetirement2027,
      desiredDepartureDate: '2027-01-01',
      cerResumptionDate: '2027-02-01',
      cerActivityEndDate: '2027-02-28',
      cerIncomeByPeriod: { beforeLegalAge: 20000 },
    };
    const result = calculateRetirement(profile, SAKURA_CAREER);
    expect(result.totalMonthlyGross).toBeGreaterThan(0);
    expect(result.cerAnalysis.annualReduction).toBe(result.totalMonthlyGross);
  });

  it.each([undefined, false, true])('conditionne le cumul intégral à la liquidation exigible (%s)', (liquidated) => {
    const cer = simulateCer({
      birthDate: '1959-01-01',
      cerResumptionDate: '2027-03-01',
      cerAllPensionsLiquidated: liquidated,
    });
    expect(cer.status).toBe(liquidated ? 'INTEGRAL' : 'PLAFONNE');
    expect(cer.generatesNewRights).toBe(liquidated === true);
    expect(cer.baseSuspensionStartDate).toBe(liquidated === false ? '2027-04-01' : undefined);
    expect(cer.annualReduction).toBe(liquidated ? 0 : undefined);
  });

  it('clôt le palier précédent le mois des 67 ans', () => {
    const cer = simulateCer({
      birthDate: '1960-06-15',
      cerIncomeByPeriod: { beforeFullRateAge: 10000 },
    });
    expect(cer.periods?.[0]?.endDate).toBe('2027-06-30');
    expect(cer.fullCumulStartDate).toBe('2027-07-01');
    expect(cer.generatesNewRights).toBe(true);
  });

  it('ne chiffre pas un seuil annuel encore absent du barème', () => {
    const cer = simulateCer({
      cerResumptionDate: '2028-02-01',
      cerIncomeByPeriod: { beforeFullRateAge: 10000 },
    });
    expect(cer.periods?.[0]?.annualThreshold).toBeUndefined();
    expect(cer.annualReduction).toBeUndefined();
  });

  it('ne calcule pas de cumul pour une reprise antérieure au départ', () => {
    const cer = simulateCer({ cerResumptionDate: '2026-12-01' });
    expect(cer.unavailable).toBe(true);
    expect(cer.annualReduction).toBeUndefined();
  });

  it.each([
    ['2026-06-01', true, true],
    ['2026-07-01', true, false],
    ['2026-06-01', false, false],
  ] as const)('sépare la carence de base et le plafond Agirc-Arrco pour une reprise le %s', (date, former, suspended) => {
    const cer = simulateCer({
      birthDate: '1960-01-01',
      desiredDepartureDate: '2026-01-01',
      cerResumptionDate: date,
      cerFormerEmployer: former,
      careerMode: 'express',
      expressData: { totalQuarters: 150, contributedQuarters: 150, estimatedSam: 40000, agircPoints: 8500 },
      cerPriorThreeMonthsAverage: 7000,
      cerLastRevaluedSalary: 8000,
    });
    if (suspended) expect(cer.paidBaseMonthly).toBe(0);
    else expect(cer.paidBaseMonthly).toBeGreaterThan(0);
    expect(cer.paidComplementaryMonthly).toBeGreaterThan(0);
  });
});

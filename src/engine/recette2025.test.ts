import { describe, it, expect } from 'vitest';
import { calculateRetirement } from './retirementCalculator';
import { UserProfile } from '../types/retirement';

function makeExpressProfile(overrides: Partial<UserProfile> & {
  birthYear: number;
  departureDate: string;
  totalQuarters: number;
  contributedQuarters?: number;
  sam: number;
  points: number;
}): UserProfile {
  const {
    birthYear,
    departureDate,
    totalQuarters,
    contributedQuarters = totalQuarters,
    sam,
    points,
    ...rest
  } = overrides;

  return {
    nir: `1${String(birthYear).slice(-2)}01`,
    birthDate: `${birthYear}-01-01`,
    sex: 'M',
    childrenCount: 0,
    motherBonusQuarters: false,
    desiredDepartureDate: departureDate,
    lastGrossMonthlySalary: 3000,
    cerEnabled: false,
    cerResumptionDate: '',
    cerFormerEmployer: false,
    cerNewGrossMonthlySalary: 0,
    careerMode: 'express',
    expressData: {
      totalQuarters,
      contributedQuarters,
      estimatedSam: sam,
      agircPoints: points,
    },
    specialCircumstances: {
      earlyCareer: false,
      earlyQuartersCount: 0,
      careerInterruptions: false,
      sicknessQuarters: 0,
      maternityQuarters: 0,
      unemploymentQuarters: 0,
      avpfQuarters: 0,
      automaticFullRate: false,
      fullRateReason: 'none',
      polycotisantMsa: false,
    },
    ...rest,
  };
}

describe('Campagne de recette 2025', () => {
  // --- NON-REGRESSIONS ---
  it('T01 : Carrière complète (1962, départ 07/2025, 169/169, SAM 36000, 6000 pts)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 36000,
      points: 6000,
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('eligible_taux_plein');
    expect(res.basePensionMonthlyGross).toBeCloseTo(1500.00, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(719.30, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(2219.30, 2);
    expect(res.totalMonthlyNet).toBeCloseTo(2010.15, 2);
  });

  it('T02 : Taux plein à 67 ans (1958, départ 01/2025, 100/167, SAM 42000, 6000 pts)', () => {
    const profile = makeExpressProfile({
      birthYear: 1958,
      departureDate: '2025-01-01',
      totalQuarters: 100,
      sam: 42000,
      points: 6000,
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('eligible_taux_plein');
    expect(res.basePensionMonthlyGross).toBeCloseTo(1047.90, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(719.30, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(1767.20, 2);
  });

  it('T05 : Surcote de 4 trimestres (1962, départ 07/2025, 173/169, SAM 40000, 7000 pts)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 173,
      sam: 40000,
      points: 7000,
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('eligible_taux_plein');
    expect(res.surcoteQuarters).toBe(4);
    expect(res.basePensionMonthlyGross).toBeCloseTo(1750.00, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(839.18, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(2589.18, 2);
  });

  it('T09 : Plafond majoration enfants Agirc-Arrco (1962, 07/2025, 169/169, SAM 45000, 35000 pts, 3 enfants)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 45000,
      points: 35000,
      childrenCount: 3,
    });
    const res = calculateRetirement(profile, []);
    expect(res.basePensionMonthlyGross).toBeCloseTo(2062.50, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(4393.21, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(6455.71, 2);
  });

  it('T17 : Cumul emploi-retraite intégral (T01 + reprise 09/2025 nouvel employeur 2200 €)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 36000,
      points: 6000,
      cerEnabled: true,
      cerResumptionDate: '2025-09-01',
      cerFormerEmployer: false,
      cerNewGrossMonthlySalary: 2200,
      cerAllPensionsLiquidated: true,
    });
    const res = calculateRetirement(profile, []);
    expect(res.cerAnalysis.status).toBe('INTEGRAL');
    expect(res.totalMonthlyGross).toBeCloseTo(2219.30, 2);
    expect(res.cerAnalysis.totalCerRevenue).toBeCloseTo(4419.30, 2);
  });

  it.each([
    ['T21', '2025-02-01', 0, 1199.42],
    ['T22', '2025-07-01', 1458.33, 2657.75],
  ] as const)('%s : ressources avec reprise chez le dernier employeur', (_, resumptionDate, paidBase, resources) => {
    const profile = makeExpressProfile({
      birthYear: 1963,
      departureDate: '2025-01-01',
      totalQuarters: 170,
      sam: 35000,
      points: 5000,
      cerEnabled: true,
      cerFormerEmployer: true,
      cerResumptionDate: resumptionDate,
      cerNewGrossMonthlySalary: 600,
      cerPriorThreeMonthsAverage: 2500,
      cerLastRevaluedSalary: 3000,
      cerLastTenYearsAverage: 2900,
    });
    if (profile.specialCircumstances) {
      profile.specialCircumstances.earlyCareer = true;
      profile.specialCircumstances.earlyCareerQuarters = { 20: 5 };
    }
    const { cerAnalysis } = calculateRetirement(profile, []);
    expect(cerAnalysis.paidBaseMonthly).toBe(paidBase);
    expect(cerAnalysis.paidComplementaryMonthly).toBe(599.42);
    expect(cerAnalysis.totalCerRevenue).toBe(resources);
  });

  // --- DÉFAUTS À CORRIGER ---
  it('T03 : Décote de 8 trimestres — Agirc-Arrco coefficient 0.92 (1962, 07/2025, 161/169, SAM 36000, 6000 pts)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 161,
      sam: 36000,
      points: 6000,
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('eligible_decote');
    expect(res.decoteQuarters).toBe(8);
    expect(res.basePensionMonthlyGross).toBeCloseTo(1286.09, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(661.76, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(1947.85, 2);
  });

  it('T04 : Décote limitée par 67 ans — Agirc-Arrco coefficient 0.95 (1960, 10/2025, 140/167, SAM 44000, 5800 pts)', () => {
    const profile = makeExpressProfile({
      birthYear: 1960,
      departureDate: '2025-10-01',
      totalQuarters: 140,
      sam: 44000,
      points: 5800,
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('eligible_decote');
    expect(res.decoteQuarters).toBe(5);
    expect(res.basePensionMonthlyGross).toBeCloseTo(1440.87, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(660.56, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(2101.43, 2);
  });

  it('T07 : Arrondi majoration 3 enfants Agirc-Arrco (1962, 07/2025, 169/169, SAM 30000, 4500 pts, 3 enfants)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 30000,
      points: 4500,
      childrenCount: 3,
    });
    const res = calculateRetirement(profile, []);
    expect(res.basePensionMonthlyGross).toBeCloseTo(1375.00, 2);
    expect(res.agircMonthlyGross).toBe(593.42);
    expect(res.totalMonthlyGross).toBe(1968.42);
  });

  it('T13 : Départ refusé — aucune pension liquidable (1963, 01/2025, 170/170, 4 trim précoces)', () => {
    const profile = makeExpressProfile({
      birthYear: 1963,
      departureDate: '2025-01-01',
      totalQuarters: 170,
      sam: 35000,
      points: 5000,
      specialCircumstances: {
        earlyCareer: true,
        earlyQuartersCount: 4,
        careerInterruptions: false,
        sicknessQuarters: 0,
        maternityQuarters: 0,
        unemploymentQuarters: 0,
        avpfQuarters: 0,
        automaticFullRate: false,
        fullRateReason: 'none',
        polycotisantMsa: false,
      },
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('ineligible');
    expect(res.basePensionMonthlyGross).toBe(0);
    expect(res.agircMonthlyGross).toBe(0);
    expect(res.totalMonthlyGross).toBe(0);
  });

  it('T16 : Minimum contributif majoré (1962, 07/2025, 169/169, SAM 12000, 1000 pts)', () => {
    const profile = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 12000,
      points: 1000,
      allPensionsLiquidated: true,
    });
    const res = calculateRetirement(profile, []);
    expect(res.eligibilityStatus).toBe('eligible_taux_plein');
    expect(res.micoApplied).toBe(true);
    expect(res.micoComplementMonthly).toBeCloseTo(393.65, 2);
    expect(res.basePensionMonthlyGross).toBeCloseTo(893.65, 2);
    expect(res.agircMonthlyGross).toBeCloseTo(119.88, 2);
    expect(res.totalMonthlyGross).toBeCloseTo(1013.53, 2);
  });

  it('T16b : MICO non appliqué si toutes les pensions ne sont pas liquidées, et écrêté au plafond 1 394,86 €', () => {
    const profileNotLiquidated = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 12000,
      points: 1000,
      allPensionsLiquidated: false,
    });
    const resNoMico = calculateRetirement(profileNotLiquidated, []);
    expect(resNoMico.micoApplied).toBe(false);
    expect(resNoMico.basePensionMonthlyGross).toBeCloseTo(500.00, 2);

    const profileCapped = makeExpressProfile({
      birthYear: 1962,
      departureDate: '2025-07-01',
      totalQuarters: 169,
      sam: 12000,
      points: 1000,
      allPensionsLiquidated: true,
      otherPensionsMonthly: 500,
    });
    // 500 (base) + 119.88 (Agirc) + 500 (autres) = 1119.88 -> max MICO = 1394.86 - 1119.88 = 274.98
    const resCapped = calculateRetirement(profileCapped, []);
    expect(resCapped.micoApplied).toBe(true);
    expect(resCapped.micoComplementMonthly).toBeCloseTo(274.98, 2);
    expect(resCapped.basePensionMonthlyGross).toBeCloseTo(774.98, 2);
  });
});

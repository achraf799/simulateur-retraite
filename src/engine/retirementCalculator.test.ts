import { describe, it, expect } from 'vitest';
import { calculateRetirement } from './retirementCalculator';
import { BLANK_PROFILE, SAKURA_PROFILE, SAKURA_CAREER, LFSS_2026_PROFILE, LFSS_2026_CAREER } from '../constants/scenarios';
import { UserProfile, CareerYear } from '../types/retirement';
import { REPERES_2026 } from '../constants/parameters2026';

describe('Durée d’assurance des générations antérieures à 1961', () => {
  it.each([
    [1943, 160, 150],
    [1944, 160, 152],
    [1947, 160, 158],
    [1948, 160, 160],
    [1949, 161, 161],
    [1950, 162, 162],
    [1951, 163, 163],
    [1952, 164, 164],
    [1953, 165, 165],
    [1955, 166, 166],
    [1957, 166, 166],
    [1958, 167, 167],
    [1960, 167, 167],
  ])('calcule une pension entière pour la génération %i avec la durée de référence atteinte', (year, required, reference) => {
    const result = calculateRetirement({
      ...BLANK_PROFILE,
      birthDate: `${year}-01-01`,
      desiredDepartureDate: '2025-01-01',
      expressData: { totalQuarters: reference, contributedQuarters: reference, estimatedSam: 48000, agircPoints: 0 },
    }, []);
    expect(result.requiredQuarters).toBe(required);
    expect(result.prorationQuarters).toBe(reference);
    expect(result.basePensionMonthlyGross).toBe(2000);
  });
});

describe('Barèmes à la date de départ', () => {
  const profile: UserProfile = {
    ...BLANK_PROFILE,
    birthDate: '1960-01-01',
    expressData: { totalQuarters: 167, contributedQuarters: 167, estimatedSam: 12000, agircPoints: 1000 },
  };

  it.each([
    ['2024-10-01', 1.4159, 4129.71, 194.18],
    ['2026-10-01', 1.4386, 4195.92, 197.29],
    ['2026-11-01', 1.4587, 4254.54, 200.05],
  ])('valorise les points et plafonne la majoration Agirc-Arrco au %s', (date, point, pension, bonus) => {
    const result = calculateRetirement({
      ...profile,
      childrenCount: 3,
      desiredDepartureDate: date,
      expressData: { ...profile.expressData!, agircPoints: 35000 },
    }, []);
    expect(result.agircPointValue).toBe(point);
    expect(result.agircMonthlyGrossBeforeBonus).toBe(pension);
    expect(result.agircChildBonusCapped).toBe(true);
    expect(result.agircChildBonusMonthly).toBe(bonus);
  });

  it('revalorise le MICO de base et majoré au 1er janvier 2026', () => {
    const departing = { ...profile, desiredDepartureDate: '2026-01-01' };
    expect(calculateRetirement(departing, []).basePensionMonthlyGross).toBe(903.93);
    const withFewerContributedQuarters = { ...profile.expressData!, contributedQuarters: 119 };
    expect(calculateRetirement({ ...departing, expressData: withFewerContributedQuarters }, [])
      .basePensionMonthlyGross).toBe(756.29);
  });

  it.each([
    ['2024-10-01', 1367.51],
    ['2024-11-01', 1394.44],
    ['2026-05-01', 1410.89],
    ['2026-06-01', 1444.89],
  ])('écrête le MICO au plafond de pensions applicable au %s', (date, cap) => {
    const result = calculateRetirement({ ...profile, desiredDepartureDate: date, otherPensionsMonthly: 500 }, []);
    expect(result.micoApplied).toBe(true);
    expect(result.totalMonthlyGross + 500).toBeCloseTo(cap, 2);
  });
});

describe('Moteur de calcul Retraite - Tests Unitaires Droit Social Français', () => {
  describe('1. Validation exacte du Cas Sakura (Cas Référence Jury)', () => {
    const result = calculateRetirement(SAKURA_PROFILE, SAKURA_CAREER);

    it('doit identifier le profil Sakura et son âge exact au départ', () => {
      expect(result.ageAtDeparture.years).toBe(62);
      expect(result.ageAtDeparture.months).toBe(0);
      expect(result.legalAge.years).toBe(62);
      expect(result.legalAge.months).toBe(9);
      expect(result.requiredQuarters).toBe(170);
    });

    it('doit détecter automatiquement l’éligibilité à la Carrière Longue (RACL)', () => {
      expect(result.isCarriereLongue).toBe(true);
      expect(result.eligibilityStatus).toBe('eligible_taux_plein');
      expect(result.liquidationRate).toBe(0.50);
      expect(result.totalValidatedQuarters).toBe(177);
      expect(result.totalContributedQuarters).toBe(167);
      expect(result.longCareer.contributedQuarters).toBe(171);
      expect(result.longCareer.possibleContributedQuarters).toBe(173);
    });

    it('reprend les points Agirc-Arrco de chacune des 46 années du relevé Sakura', () => {
      // Relevé 2026SAKURA, pages 3 et 4 : 1979 à 2024, avec l’annotation manuscrite de 2024.
      const expected = [
        3.87, 4.46, 39.74, 37.36, 130.18, 143.36, 146.46, 148.78, 152.66, 152.68,
        168.16, 168.94, 168.94, 147.24, 146.46, 147.24, 34.10, 0, 1.93, 82.92,
        81.99, 80.77, 90.60, 128.33, 132.25, 136.05, 179.53, 204.32, 220.70, 238.91,
        276.13, 282.01, 284.27, 282.34, 284.28, 330.41, 325.19, 422.89, 405.48, 386.02,
        422.37, 503.38, 396.30, 389.48, 374.98, 389.70,
      ].map((points, index) => [1979 + index, points]);
      expect(SAKURA_CAREER.map(({ year, agircPoints }) => [year, agircPoints])).toEqual(expected);
    });

    it('retient les 25 meilleures années et calcule le SAM avec le barème 2025', () => {
      expect(result.samYearsCount).toBe(25);
      expect(result.sam).toBe(40910.48);
    });

    it('calcule la pension de base brute de 1 875,06 €/mois avec la majoration enfants', () => {
      expect(result.basePensionMonthlyGross).toBe(1875.06);
    });

    it('calcule la complémentaire avec les taux historiques retenus dans l’étude Sakura', () => {
      expect(result.agircTotalPoints).toBe(9274.16);
      expect(result.agircPointValue).toBe(1.4386);
      expect(result.agircMonthlyGross).toBe(1209.00);
      expect(result.agircMonthlyNet).toBe(1087.86);
    });

    it('exclut les points des années à compter d’un départ au premier janvier', () => {
      const lastYear = SAKURA_CAREER[SAKURA_CAREER.length - 1];
      const future = [2025, 2026].map((year) => ({ ...lastYear, year, agircPoints: 1000 }));
      const departure = calculateRetirement(SAKURA_PROFILE, [...SAKURA_CAREER, ...future]);
      expect(departure.agircTotalPoints).toBe(9274.16);
      expect(departure.agircMonthlyGross).toBe(1209);
    });

    it('retient uniquement les points de l’année de départ confirmés pour la date simulée', () => {
      const profile: UserProfile = {
        ...SAKURA_PROFILE,
        desiredDepartureDate: '2025-07-01',
        cerResumptionDate: '2025-08-01',
        specialCircumstances: { ...SAKURA_PROFILE.specialCircumstances!, longCareerConfirmedQuarters: 171 },
      };
      const annual: CareerYear = { ...SAKURA_CAREER[SAKURA_CAREER.length - 1], year: 2025, agircPoints: 1000 };
      const pending = calculateRetirement(profile, [...SAKURA_CAREER, annual]);
      expect(pending.agircPointsPending).toBe(true);
      expect(pending.agircTotalPoints).toBe(9274.16);
      expect(pending.cerAnalysis.unavailable).toBe(true);

      const confirmed: CareerYear = { ...annual, agircPointsAtDeparture: { date: '2025-07-01', points: 100 } };
      const retirement = calculateRetirement(profile, [...SAKURA_CAREER, confirmed]);
      expect(retirement.agircPointsPending).toBe(false);
      expect(retirement.agircTotalPoints).toBe(9374.16);
      expect(retirement.agircMonthlyGross).toBe(1222.18);
      expect(calculateRetirement({ ...profile, desiredDepartureDate: '2025-08-01' }, [...SAKURA_CAREER, confirmed])
        .agircPointsPending).toBe(true);
    });

    it('calcule le total brut, le net et le taux de remplacement de Sakura', () => {
      expect(result.totalMonthlyGross).toBe(3084.06);
      expect(result.totalMonthlyNet).toBe(2792.29);
      expect(result.grossReplacementRate).toBe(68.53);
    });

    it('doit déclencher une ALERTE ROUGE sur le Cumul Emploi-Retraite (carence 6 mois chez l’ancien employeur)', () => {
      const cer = result.cerAnalysis;
      expect(cer.status).toBe('PLAFONNE');
      expect(cer.alertLevel).toBe('RED');
      expect(cer.suspensionApplies).toBe(true);
      expect(cer.waitingMonthsRemaining).toBe(5); // reprise à M+1, reste 5 mois
      expect(cer.paidBaseMonthly).toBe(0);
      expect(cer.paidComplementaryMonthly).toBeUndefined();
      expect(cer.generatesNewRights).toBe(false);
    });
  });

  it.each([false, true])('bloque une durée Express incohérente fournie par confirmation manuelle (%s)', (manual) => {
    const profile: UserProfile = {
      ...SAKURA_PROFILE,
      careerMode: 'express',
      expressData: { totalQuarters: 100, contributedQuarters: manual ? 100 : 170, estimatedSam: 35000, agircPoints: 5000 },
      specialCircumstances: {
        ...SAKURA_PROFILE.specialCircumstances!,
        longCareerConfirmedQuarters: manual ? 170 : undefined,
      },
    };
    const result = calculateRetirement(profile, []);
    expect(result.longCareer.status).toBe('unknown');
    expect(result.longCareer.inputError).toBeTruthy();
    expect(result.totalMonthlyGross).toBe(0);
    expect(result.cerAnalysis.unavailable).toBe(true);
  });

  it('distingue les anciennes caisses connues, y compris pour des points acquis la même année', () => {
    const career: CareerYear[] = [
      { ...SAKURA_CAREER[0], year: 1998, agircPoints: 1000, agircLegacyRegime: 'camarca' },
      { ...SAKURA_CAREER[0], year: 1998, agircPoints: 1000, agircLegacyRegime: 'noBonus' },
      { ...SAKURA_CAREER[0], year: 2000, agircPoints: 1000, agircLegacyRegime: 'agirc' },
      { ...SAKURA_CAREER[0], year: 2012, agircPoints: 1000 },
    ];
    const result = calculateRetirement({ ...SAKURA_PROFILE, birthDate: '1958-01-01' }, career);
    // Taux de la fiche Agirc-Arrco pour trois enfants : 7,5 %, 0 %, 8 % et 10 %.
    expect(result.agircChildBonusMonthly).toBe(30.57);
    expect(result.agircMonthlyGross).toBe(510.10);
  });

  describe('2. Validation du Cas Test 2025 (Barème Réforme 2023 & 25 meilleures années)', () => {
    const result = calculateRetirement(
      { ...LFSS_2026_PROFILE, desiredDepartureDate: '2025-09-01' },
      LFSS_2026_CAREER
    );

    it('doit appliquer le barème Réforme 2023 en vigueur en 2025', () => {
      expect(result.appliedRule).toBe('Réforme 2023');
      // Pour une femme née en mars 1965 (janv-mars) :
      // Réforme 2023 (en vigueur en 2025) : 63 ans 3 mois / 172 trim.
      expect(result.legalAge.years).toBe(63);
      expect(result.legalAge.months).toBe(3);
      expect(result.requiredQuarters).toBe(172);
    });

    it('doit calculer le SAM sur les 25 meilleures années (règle 2025)', () => {
      expect(result.samYearsCount).toBe(25);
      expect(result.topYears.length).toBe(25);
    });
  });

  describe('3. Validation des mécanismes de Décote et Surcote', () => {
    it('doit appliquer une décote de 0,625 point par trimestre manquant', () => {
      const profileDecote: UserProfile = {
        ...SAKURA_PROFILE,
        birthDate: '1961-05-15', // âge légal 62 ans 0 mois
        desiredDepartureDate: '2023-06-01',
      };
      // Carrière avec 160 trimestres validés pour 168 requis (8 trimestres manquants)
      const careerDecote: CareerYear[] = [];
      for (let y = 1983; y <= 2022; y++) {
        careerDecote.push({
          year: y,
          currency: 'EUR',
          grossIncome: 35000,
          grossIncomeEur: 35000,
          passEur: 40000,
          retainedSalaryEur: 35000,
          cnavCoeff: 1.0,
          revaluedSalaryEur: 35000,
          regime: 'CNAV',
          validatedQuarters: 4,
          contributedQuarters: 4,
          agircPoints: 200,
          eventType: 'Activité',
        });
      }

      const res = calculateRetirement(profileDecote, careerDecote);
      expect(res.eligibilityStatus).toBe('eligible_decote');
      expect(res.decoteQuarters).toBe(8);
      // Taux = 50% - (8 * 0.625%) = 50% - 5% = 45% (0.45)
      expect(res.liquidationRate).toBe(0.45);
    });

    it('contrôle la surcote selon les années cotisées, puis utilise les trimestres confirmés', () => {
      const profileSurcote: UserProfile = {
        ...SAKURA_PROFILE,
        birthDate: '1960-01-01', // Âge légal 62 ans (167 trimestres requis)
        desiredDepartureDate: '2023-01-01', // 3 trimestres possibles après le trimestre de l’âge légal.
        childrenCount: 0,
      };
      const careerSurcote: CareerYear[] = [];
      for (let y = 1979; y <= 2022; y++) {
        careerSurcote.push({
          year: y,
          currency: 'EUR',
          grossIncome: 35000,
          grossIncomeEur: 35000,
          passEur: 40000,
          retainedSalaryEur: 35000,
          cnavCoeff: 1.0,
          revaluedSalaryEur: 35000,
          regime: 'CNAV',
          validatedQuarters: 4,
          contributedQuarters: 4,
          agircPoints: 200,
          eventType: 'Activité',
        });
      }

      const inactive = calculateRetirement(profileSurcote, careerSurcote.filter(({ year }) => year < 2022));
      expect(inactive.eligibilityStatus).toBe('eligible_taux_plein');
      expect(inactive.surcoteQuarters).toBe(0);
      expect(inactive.surcote.status).toBe('none');

      const pending = calculateRetirement(profileSurcote, careerSurcote);
      expect(pending.surcote).toMatchObject({ status: 'pending', maxQuarters: 3 });
      expect(pending.surcoteQuarters).toBe(0);
      const confirmed = { ...profileSurcote, surcoteConfirmed: { departureDate: '2023-01-01', quarters: 2 } };
      expect(calculateRetirement(confirmed, careerSurcote).surcoteRate).toBe(0.025);
      expect(calculateRetirement({ ...confirmed, desiredDepartureDate: '2023-02-01' }, careerSurcote).surcote.status).toBe('pending');
    });
  });

  describe('4. Validation du CER Intégral vs Plafonné', () => {
    it('doit accorder le CER INTÉGRAL si âge légal atteint et taux plein', () => {
      const profileIntegral: UserProfile = {
        ...SAKURA_PROFILE,
        birthDate: '1960-01-01', // 65 ans au 01/01/2025 (>= 62 ans légal)
        desiredDepartureDate: '2025-01-01',
        surcoteConfirmed: { departureDate: '2025-01-01', quarters: 0 },
        cerEnabled: true,
        cerResumptionDate: '2025-08-01', // > 6 mois
        cerFormerEmployer: false,
        cerNewGrossMonthlySalary: 5000,
        cerAllPensionsLiquidated: true,
      };

      const res = calculateRetirement(profileIntegral, SAKURA_CAREER);
      expect(res.cerAnalysis.status).toBe('INTEGRAL');
      expect(res.cerAnalysis.alertLevel).toBe('GREEN');
      expect(res.cerAnalysis.generatesNewRights).toBe(true);
      expect(res.cerAnalysis.ecretementAmount).toBe(0);
    });
  });
});

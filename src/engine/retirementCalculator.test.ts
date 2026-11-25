import { describe, it, expect } from 'vitest';
import { calculateRetirement } from './retirementCalculator';
import { SAKURA_PROFILE, SAKURA_CAREER, LFSS_2026_PROFILE, LFSS_2026_CAREER } from '../constants/scenarios';
import { UserProfile, CareerYear } from '../types/retirement';
import { REPERES_2026 } from '../constants/parameters2026';

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
      expect(result.totalContributedQuarters).toBe(173);
    });

    it('retient les 25 meilleures années et calcule le SAM avec le barème 2025', () => {
      expect(result.samYearsCount).toBe(25);
      expect(result.sam).toBe(40910.48);
    });

    it('calcule la pension de base brute de 1 875,06 €/mois avec la majoration enfants', () => {
      expect(result.basePensionMonthlyGross).toBe(1875.06);
    });

    it('doit calculer une pension Agirc-Arrco brute avec +10% de ≈ 1 223,00 €/mois', () => {
      // 9 274.16 pts * 1.4386 € = 13 341.79 €/an -> 1 111.82 €/mois + 10% (111.18 €) = 1 223.00 €/mois
      expect(result.agircTotalPoints).toBe(9274.16);
      expect(result.agircPointValue).toBe(1.4386);
      expect(result.agircMonthlyGross).toBeCloseTo(1223.00, 1);
    });

    it('calcule le total brut, le net et le taux de remplacement de Sakura', () => {
      expect(result.totalMonthlyGross).toBe(3098.06);
      expect(result.totalMonthlyNet).toBe(2803.91);
      expect(result.grossReplacementRate).toBe(68.85);
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

    it('doit appliquer une surcote de +1,25% par trimestre après âge légal et taux plein', () => {
      const profileSurcote: UserProfile = {
        ...SAKURA_PROFILE,
        birthDate: '1960-01-01', // Âge légal 62 ans (167 trimestres requis)
        desiredDepartureDate: '2023-01-01', // 63 ans (4 trimestres après âge légal)
        childrenCount: 0,
      };
      // Carrière avec 171 trimestres cotisés (4 au-delà des 167 requis)
      const careerSurcote: CareerYear[] = [];
      for (let y = 1980; y <= 2022; y++) {
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

      const res = calculateRetirement(profileSurcote, careerSurcote);
      expect(res.eligibilityStatus).toBe('eligible_taux_plein');
      expect(res.surcoteQuarters).toBe(4);
      // Surcote : 4 * 1.25% = +5.0%
      expect(res.surcoteRate).toBe(0.05);
    });
  });

  describe('4. Validation du CER Intégral vs Plafonné', () => {
    it('doit accorder le CER INTÉGRAL si âge légal atteint et taux plein', () => {
      const profileIntegral: UserProfile = {
        ...SAKURA_PROFILE,
        birthDate: '1960-01-01', // 65 ans au 01/01/2025 (>= 62 ans légal)
        desiredDepartureDate: '2025-01-01',
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

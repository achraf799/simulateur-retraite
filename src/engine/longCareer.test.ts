import { describe, expect, it } from 'vitest';
import { calculateRetirement } from './retirementCalculator';
import { SAKURA_CAREER, SAKURA_PROFILE } from '../constants/scenarios';
import type { CareerYear, EarlyCareerAge, UserProfile } from '../types/retirement';

function simulate(
  birthDate: string,
  desiredDepartureDate: string,
  earlyCareerQuarters: Partial<Record<EarlyCareerAge, number>>,
  contributedQuarters = 172,
  extra: Partial<UserProfile['specialCircumstances']> = {},
) {
  const profile: UserProfile = {
    ...SAKURA_PROFILE,
    birthDate,
    desiredDepartureDate,
    cerResumptionDate: desiredDepartureDate,
    careerMode: 'express',
    expressData: { totalQuarters: 172, contributedQuarters, estimatedSam: 40000, agircPoints: 7000 },
    specialCircumstances: {
      ...SAKURA_PROFILE.specialCircumstances!,
      earlyCareer: false,
      earlyCareerQuarters,
      ...extra,
    },
  };
  return calculateRetirement(profile, []);
}

describe('Départ anticipé pour carrière longue', () => {
  it.each([
    [16, 58, '2028-01-01', { 16: 5 }],
    [18, 60, '2030-01-01', { 16: 2, 18: 5 }],
    [20, 61.75, '2031-10-01', { 16: 0, 18: 3, 20: 5 }],
    [21, 63, '2033-01-01', { 16: 0, 18: 2, 20: 4, 21: 5 }],
  ] as const)('applique la borne de %i ans', (startAge, minimumAge, departure, quarters) => {
    const result = simulate('1970-01-01', departure, quarters);
    expect(result.longCareer).toMatchObject({ startAge, minimumAgeMonths: minimumAge * 12, earliestAgeDate: departure });
    expect(result.eligibilityStatus).toBe('eligible_taux_plein');
  });

  it.each([
    ['1970-09-30', 'notEligible'],
    ['1970-10-01', 'eligible'],
  ] as const)('applique la règle du dernier trimestre pour une naissance le %s', (birthDate, status) => {
    const result = simulate(birthDate, '2033-01-01', { 16: 0, 18: 0, 20: 4, 21: 4 });
    expect(result.longCareer.status).toBe(status);
  });

  it('change la durée exigée le 1er septembre 2026', () => {
    const august = simulate('1965-03-15', '2026-08-01', { 20: 5 }, 170);
    const september = simulate('1965-03-15', '2026-09-01', { 20: 5 }, 170);
    expect(august.longCareer).toMatchObject({ status: 'missingQuarters', requiredQuarters: 172 });
    expect(september.longCareer).toMatchObject({ status: 'eligible', requiredQuarters: 170 });
  });

  it('applique la tranche de décembre 1965 dès la date d’effet prévue', () => {
    const result = simulate('1965-12-31', '2026-09-01', { 20: 4 }, 171);
    expect(result.longCareer).toMatchObject({
      status: 'eligible', earliestAgeDate: '2026-09-01', minimumAgeMonths: 728,
    });
  });

  it('attend le premier jour du mois suivant l’âge atteint en cours de mois', () => {
    const before = simulate('1966-02-15', '2026-11-01', { 20: 5 });
    const after = simulate('1966-02-15', '2026-12-01', { 20: 5 });
    expect(before.longCareer).toMatchObject({ status: 'tooEarly', earliestAgeDate: '2026-12-01' });
    expect(before.eligibilityStatus).toBe('ineligible');
    expect(before.cerAnalysis.unavailable).toBe(true);
    expect(after.eligibilityStatus).toBe('eligible_taux_plein');
    expect(after.cerAnalysis.unavailable).toBeUndefined();
  });

  it('décompte chaque année une seule fois et s’arrête au dernier trimestre civil achevé', () => {
    const firstYear: CareerYear = {
      ...SAKURA_CAREER[0], year: 1985, validatedQuarters: 4, contributedQuarters: 4,
    };
    const duplicateRegime = { ...firstYear, regime: 'MSA' as const };
    const partialYear = { ...firstYear, year: 2026 };
    const futureYear = { ...firstYear, year: 2027 };
    const result = calculateRetirement({
      ...SAKURA_PROFILE,
      birthDate: '1965-03-15',
      desiredDepartureDate: '2026-09-01',
      specialCircumstances: undefined,
    }, [firstYear, duplicateRegime, partialYear, futureYear]);
    expect(result.longCareer).toMatchObject({
      contributedQuarters: 6, earlyQuarters: { 20: 4 }, status: 'notEligible',
    });
  });

  it('utilise le total carrière longue confirmé sans ajouter les périodes déjà comprises', () => {
    const result = simulate('1966-01-01', '2027-01-01', { 20: 5 }, 170, {
      longCareerConfirmedQuarters: 172, avpfQuarters: 4,
    });
    expect(result.longCareer).toMatchObject({ status: 'eligible', contributedQuarters: 172 });
  });

  it('conserve la saisie express historique à la borne des 20 ans', () => {
    const { longCareer } = simulate('1966-01-01', '2027-01-01', {}, 172, {
      earlyCareer: true, earlyQuartersCount: 5,
    });
    expect(longCareer.status).toBe('eligible');
    expect(longCareer.startAge).toBe(20);
    expect(longCareer.earlyQuarters[16]).toBeUndefined();
    expect(longCareer.earlyQuarters[18]).toBeUndefined();
  });

  it('signale les décomptes cumulés incompatibles', () => {
    const result = simulate('1966-01-01', '2027-01-01', { 18: 5, 20: 4 });
    expect(result.longCareer.status).toBe('unknown');
    expect(result.isCarriereLongue).toBe(false);
  });

  it('conserve le seuil anticipé à titre informatif lors d’un départ de droit commun', () => {
    const result = simulate('1966-01-01', '2030-01-01', { 20: 5 });
    expect(result.longCareer).toMatchObject({ status: 'regularDeparture', earliestAgeDate: '2026-10-01' });
    expect(result.isCarriereLongue).toBe(false);
  });

  it('signale la clause de sauvegarde à vérifier pour un profil à 168 trimestres', () => {
    const result = simulate('1963-10-13', '2024-02-01', { 20: 7 }, 168);
    expect(result.longCareer).toMatchObject({ status: 'missingQuarters', safeguardToVerify: true });
  });
});

import type { CareerYear, EarlyCareerAge, LongCareerResult, UserProfile } from '../types/retirement';
import { addMonths, validDate } from '../utils/civilDates';
import { careerQuarters, validQuarterCount } from '../utils/careerEntry';

export const EARLY_CAREER_AGES = [16, 18, 20, 21] as const;
const REFORM_2023 = '2023-09-01';
const SUSPENSION_2026 = '2026-09-01';

// D. 351-1-1 and Cnav circulars 2023/14 and 2026/29, age in months for the age-20 route.
const AGE_20_BEFORE_SEPTEMBER_2026: Partial<Record<number, number>> = {
  1961: 720, 1962: 720, 1963: 720, 1964: 726, 1965: 729,
  1966: 732, 1967: 735, 1968: 738, 1969: 741,
};
const AGE_20_FROM_SEPTEMBER_2026: Partial<Record<number, number>> = {
  1966: 729, 1967: 732, 1968: 735, 1969: 738, 1970: 741,
};

function ageAtThreshold(birthDate: string, startAge: EarlyCareerAge, afterSuspension: boolean): number {
  if (startAge === 16) return 58 * 12;
  if (startAge === 18) return 60 * 12;
  if (startAge === 21) return 63 * 12;
  const [year, month] = birthDate.split('-').map(Number);
  if (year === 1963 && month >= 9) return 60 * 12 + 3;
  if (afterSuspension && year === 1965 && month === 12) return 60 * 12 + 8;
  return (afterSuspension ? AGE_20_FROM_SEPTEMBER_2026[year] : undefined)
    ?? AGE_20_BEFORE_SEPTEMBER_2026[year] ?? 62 * 12;
}

export function firstPensionDate(birthDate: string, ageMonths: number): string {
  const birthday = addMonths(birthDate, ageMonths);
  const firstOfMonth = birthday.slice(0, 7) + '-01';
  return birthday === firstOfMonth ? birthday : addMonths(firstOfMonth, 1);
}

function earliestDate(birthDate: string, startAge: EarlyCareerAge): string {
  const oldDate = firstPensionDate(birthDate, ageAtThreshold(birthDate, startAge, false));
  if (oldDate < SUSPENSION_2026) return oldDate < REFORM_2023 ? REFORM_2023 : oldDate;
  const newDate = firstPensionDate(birthDate, ageAtThreshold(birthDate, startAge, true));
  return newDate < SUSPENSION_2026 ? SUSPENSION_2026 : newDate;
}

export function analyzeLongCareer(
  profile: UserProfile,
  career: CareerYear[],
  legalAgeMonths: number,
  requiredQuarters: number,
): LongCareerResult {
  const { birthDate, desiredDepartureDate: departure, specialCircumstances: special } = profile;
  const birthYear = Number(birthDate.slice(0, 4));
  const requiredEarlyQuarters = Number(birthDate.slice(5, 7)) >= 10 ? 4 : 5;
  const earlyQuarters: LongCareerResult['earlyQuarters'] = {};
  const basis = { earlyQuarters, requiredEarlyQuarters, requiredQuarters };
  if (!validDate(birthDate) || !validDate(departure) || departure <= birthDate || !departure.endsWith('-01')) {
    return { ...basis, status: 'unknown', details: 'Renseignez une date de naissance et un départ au premier jour d’un mois.' };
  }
  if (birthDate < '1961-09-01' || departure < REFORM_2023) {
    return { ...basis, status: 'unknown', details: 'Cette génération ou date de départ nécessite de vérifier le barème historique.' };
  }

  const express = profile.careerMode === 'express';
  const recorded = careerQuarters(express ? [] : career, birthYear, departure);
  const confirmed =
    special?.longCareerConfirmedQuarters
    ?? (express ? profile.expressData?.contributedQuarters : undefined);
  const contributedQuarters = validQuarterCount(confirmed) ? confirmed
    : express || recorded.validatedByYear.size === 0 ? undefined : recorded.contributed;
  let previousCount = 0;
  for (const age of EARLY_CAREER_AGES) {
    const declared = special?.earlyCareerQuarters?.[age]
      ?? (age === 20 && special?.earlyCareer && special.earlyQuartersCount > 0 ? special.earlyQuartersCount : undefined);
    const measured = recorded.validatedByYear.size > 0
      ? Array.from(recorded.validatedByYear).reduce((total, [year, quarters]) => year <= birthYear + age ? total + quarters : total, 0)
      : undefined;
    if (validQuarterCount(declared) && declared < previousCount) {
      return { ...basis, status: 'unknown', contributedQuarters, details: 'Les trimestres cumulés doivent rester stables ou augmenter entre deux bornes.' };
    }
    const knownCount = declared ?? (validQuarterCount(measured) ? Math.max(previousCount, measured) : undefined);
    if (!validQuarterCount(knownCount)) continue;
    earlyQuarters[age] = knownCount;
    previousCount = knownCount;
  }

  const afterSuspension = departure >= SUSPENSION_2026;
  const route = EARLY_CAREER_AGES
    .filter((age) => (earlyQuarters[age] ?? 0) >= requiredEarlyQuarters)
    .map((age) => ({ age, minimumAgeMonths: ageAtThreshold(birthDate, age, afterSuspension), date: earliestDate(birthDate, age) }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.minimumAgeMonths - b.minimumAgeMonths)[0];

  if (!route) {
    const incomplete = EARLY_CAREER_AGES.some((age) => earlyQuarters[age] === undefined);
    return {
      ...basis, contributedQuarters,
      status: incomplete ? 'unknown' : 'notEligible',
      details: incomplete ? 'Complétez les trimestres de début de carrière pour vérifier le droit.'
        : 'Aucune borne de début de carrière n’atteint le nombre de trimestres requis.',
    };
  }

  const regularDate = firstPensionDate(birthDate, legalAgeMonths);
  const routeResult = {
    ...basis, contributedQuarters, startAge: route.age,
    minimumAgeMonths: route.minimumAgeMonths, earliestAgeDate: route.date,
  };
  if (route.date >= regularDate) {
    return { ...routeResult, earliestAgeDate: undefined, status: 'regularDeparture', details: 'La borne retenue ne permet pas de partir avant l’âge légal.' };
  }
  if (departure >= regularDate) {
    return { ...routeResult, status: 'regularDeparture', details: 'La date simulée relève du départ à l’âge légal ou après.' };
  }

  const safeguardToVerify = birthDate <= '1963-12-31'
    && (earlyQuarters[20] ?? 0) >= requiredEarlyQuarters
    && (contributedQuarters === undefined || contributedQuarters >= 168);
  if (departure < firstPensionDate(birthDate, route.minimumAgeMonths)) {
    return { ...routeResult, safeguardToVerify, status: 'tooEarly', details: 'La date choisie précède la première date d’effet liée à l’âge.' };
  }
  if (contributedQuarters === undefined) {
    return { ...routeResult, safeguardToVerify, status: 'unknown', details: 'Renseignez la durée cotisée ou réputée cotisée à la date choisie.' };
  }
  if (contributedQuarters < requiredQuarters) {
    return {
      ...routeResult, safeguardToVerify, status: 'missingQuarters',
      details: `Trimestres cotisés ou réputés cotisés manquants à la date choisie : ${requiredQuarters - contributedQuarters}.`,
    };
  }
  return { ...routeResult, status: 'eligible', details: 'Le départ anticipé à taux plein est possible à la date choisie selon les données saisies.' };
}

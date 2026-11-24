import { CareerYear, UserProfile } from '../types/retirement';
import { getPassForYear } from '../constants/passHistory';
import { getCnavCoeff } from '../constants/cnavCoefficients';

export interface ExpressCareerData {
  totalValidatedQuarters: number;
  totalContributedQuarters: number;
  estimatedSam: number;
  totalAgircPoints: number;
  earlyQuartersBefore20?: number;
}

/**
 * Génère un relevé de carrière synthétique parfaitement équilibré à partir des 4 données du Mode Express,
 * permettant au moteur retirementCalculator.ts de tourner avec une exactitude totale.
 */
export function generateExpressCareer(
  data: ExpressCareerData,
  profile: UserProfile
): CareerYear[] {
  const birthYear = profile.birthDate ? new Date(profile.birthDate).getFullYear() : 1963;
  const departureYear = profile.desiredDepartureDate
    ? new Date(profile.desiredDepartureDate).getFullYear()
    : 2025;

  const career: CareerYear[] = [];

  // Nombre d'années de carrière approximatif (ex: 44 ans)
  const startYear = Math.max(1975, birthYear + 16);
  const yearsCount = Math.max(25, departureYear - startYear + 1);

  // Distribution des trimestres validés et cotisés
  let remainingValidated = data.totalValidatedQuarters;
  let remainingContributed = data.totalContributedQuarters;
  const pointsPerYear = Number((data.totalAgircPoints / yearsCount).toFixed(2));

  // Pour Carrière Longue : placer au moins earlyQuartersBefore20 avant la fin des 20 ans
  const year20 = birthYear + 20;

  for (let i = 0; i < yearsCount; i++) {
    const year = startYear + i;
    if (year > departureYear) break;

    const isBefore20 = year <= year20;
    let validated = 0;
    let contributed = 0;

    if (isBefore20 && data.earlyQuartersBefore20 && data.earlyQuartersBefore20 > 0) {
      validated = Math.min(4, remainingValidated);
      contributed = Math.min(4, remainingContributed);
    } else {
      validated = Math.min(4, remainingValidated);
      contributed = Math.min(4, remainingContributed);
    }

    remainingValidated -= validated;
    remainingContributed -= contributed;

    const passEur = getPassForYear(year);
    const coeff = getCnavCoeff(year, departureYear);
    // On ajuste le salaire brut pour que le salaire revalorisé soit égal au SAM estimé
    const salaryEur = Number((data.estimatedSam / (coeff || 1.0)).toFixed(2));

    career.push({
      year,
      currency: 'EUR',
      grossIncome: salaryEur,
      grossIncomeEur: salaryEur,
      passEur: Math.max(passEur, salaryEur), // évite un plafonnement accidentel sur le SAM express
      retainedSalaryEur: salaryEur,
      cnavCoeff: coeff || 1.0,
      revaluedSalaryEur: data.estimatedSam,
      regime: 'CNAV',
      validatedQuarters: validated,
      contributedQuarters: contributed,
      agircPoints: pointsPerYear,
      eventType: 'Activité',
    });
  }

  // Ajustement fin des totaux sur la dernière année
  const diffValidated = data.totalValidatedQuarters - career.reduce((s, r) => s + r.validatedQuarters, 0);
  const diffContributed = data.totalContributedQuarters - career.reduce((s, r) => s + r.contributedQuarters, 0);
  const diffPoints = data.totalAgircPoints - career.reduce((s, r) => s + r.agircPoints, 0);

  if (career.length > 0) {
    const last = career[career.length - 1];
    last.validatedQuarters = Math.max(0, last.validatedQuarters + diffValidated);
    last.contributedQuarters = Math.max(0, last.contributedQuarters + diffContributed);
    last.agircPoints = Number((last.agircPoints + diffPoints).toFixed(2));
  }

  return career;
}

import type { SurcoteAnalysis, UserProfile } from '../types/retirement';
import { addMonths, validDate } from '../utils/civilDates';

function quarterIndex(date: string): number {
  const [year, month] = date.split('-').map(Number);
  return year * 4 + Math.floor((month - 1) / 3);
}

export function analyzeSurcote(
  profile: UserProfile,
  legalAgeMonths: number,
  requiredQuarters: number,
  coverage: { validated: number; contributed: number; contributedByYear?: ReadonlyMap<number, number> },
  hasFullRate: boolean,
): SurcoteAnalysis {
  const none: SurcoteAnalysis = { status: 'none', maxQuarters: 0, quarters: 0 };
  const departure = profile.desiredDepartureDate;
  if (!hasFullRate || !validDate(profile.birthDate) || !validDate(departure)) return none;

  // La période ne peut commencer qu’au trimestre suivant l’âge légal (CNAV 2024/25, § 6.2).
  const firstQuarter = quarterIndex(addMonths(profile.birthDate, legalAgeMonths)) + 1;
  const endQuarter = quarterIndex(departure);
  let maxQuarters = Math.max(0, Math.min(
    endQuarter - firstQuarter,
    coverage.validated - requiredQuarters,
    coverage.contributed,
  ));

  if (coverage.contributedByYear && maxQuarters > 0) {
    let possiblePaidQuarters = 0;
    for (const [year, contributed] of coverage.contributedByYear) {
      const yearStart = year * 4;
      const eligibleQuarters = Math.min(endQuarter, yearStart + 4) - Math.max(firstQuarter, yearStart);
      possiblePaidQuarters += Math.min(contributed, Math.max(0, eligibleQuarters));
    }
    maxQuarters = Math.min(maxQuarters, possiblePaidQuarters);
  }

  const confirmation = profile.surcoteConfirmed;
  if (confirmation?.departureDate !== departure) {
    return maxQuarters === 0 ? none : { status: 'pending', maxQuarters, quarters: 0 };
  }
  const { quarters } = confirmation;
  if (!Number.isInteger(quarters) || quarters < 0 || quarters > maxQuarters) {
    return {
      status: 'pending',
      maxQuarters,
      quarters: 0,
      inputError: `Renseignez un nombre entier de trimestres de surcote compris entre 0 et ${maxQuarters}.`,
    };
  }
  return { status: 'confirmed', maxQuarters, quarters };
}

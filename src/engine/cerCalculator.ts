import { addMonths, validDate } from '../utils/civilDates';
import { REPERES_2026 } from '../constants/parameters2026';
import type {
  CerAnalysisResult,
  CerReductionBand,
  CerReductionPeriod,
  UserProfile,
} from '../types/retirement';

const CER_REFORM_DATE = '2027-01-01';
const CER_ANNUAL_THRESHOLDS: Partial<Record<number, number>> = { 2027: 7000 };
const JANUARY_HOURLY_SMIC: Partial<Record<number, number>> = {
  2023: 11.27,
  2024: 11.65,
  2025: 11.88,
  2026: REPERES_2026.smicHoraire2026,
};

function followingMonth(value: string): string {
  return addMonths(value.slice(0, 7) + '-01', 1);
}

function monthIndex(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month - 1;
}

function euros(value: number): number {
  return Number(value.toFixed(2));
}

export function analyzeCer(
  profile: UserProfile,
  legalAgeMonths: number,
  requiredQuarters: number,
  validatedQuarters: number,
  retirementEligible: boolean,
  baseMonthly: number,
  complementaryMonthly: number,
): CerAnalysisResult {
  const departure = profile.desiredDepartureDate;
  const firstPension = profile.cerFirstBasePensionDate || departure;
  const resumption = profile.cerResumptionDate;
  const totalPension = euros(baseMonthly + complementaryMonthly);
  const result: CerAnalysisResult = {
    regime: firstPension >= CER_REFORM_DATE ? 'from2027' : 'before2027',
    status: 'PLAFONNE',
    alertLevel: 'GREEN',
    alertMessage: 'Aucune reprise d’activité prévue.',
    suspensionApplies: false,
    waitingMonthsRemaining: 0,
    waitingPeriodEndDate: '',
    ceilingAmount: 0,
    totalCerRevenue: 0,
    exceedsCeiling: false,
    ecretementAmount: 0,
    generatesNewRights: false,
    newRightsDetails: '',
    recommendations: [],
  };

  if (!profile.cerEnabled) return { ...result, effectiveMonthlyGrossPension: totalPension };

  const unavailable = (alertMessage: string): CerAnalysisResult => ({
    ...result, unavailable: true, alertLevel: 'YELLOW', alertMessage,
  });

  if (![departure, firstPension, resumption, profile.birthDate].every(validDate)
    || resumption < departure || firstPension > departure) {
    return unavailable('Vérifiez les dates. La première pension doit prendre effet au plus tard au départ simulé, et la reprise au plus tôt à ce départ.');
  }
  if (!retirementEligible && firstPension === departure) {
    return unavailable('Le départ simulé ne permet pas de liquider la pension. Modifiez la date de départ pour évaluer le cumul.');
  }
  if (profile.cerSeparateComplementaryPension) {
    return unavailable('Une liquidation de la complémentaire à une autre date nécessite de vérifier le régime de cumul applicable.');
  }

  const legalBirthday = addMonths(profile.birthDate, legalAgeMonths);
  const fullRateBirthday = addMonths(profile.birthDate, REPERES_2026.ageTauxPleinAutomatiqueAnnees * 12);

  if (result.regime === 'from2027') {
    const year = Number(resumption.slice(0, 4));
    const end = profile.cerActivityEndDate || `${year}-12-31`;
    if (!validDate(end) || end < resumption || !end.startsWith(String(year))) {
      return unavailable('Indiquez une fin de période comprise entre la reprise et la fin de la même année civile.');
    }
    const legalBandStart = followingMonth(legalBirthday);
    const fullRateBandStart = followingMonth(fullRateBirthday);
    const fullCumulStart = departure > fullRateBandStart ? departure : fullRateBandStart;
    const reachesFullCumul = fullCumulStart <= end;
    const reachesLegalAge = legalBirthday <= end;
    const liquidated = profile.cerAllPensionsLiquidated;
    const baseSuspensionStartDate = reachesLegalAge && liquidated === false
      ? followingMonth(resumption < legalBirthday ? legalBirthday : resumption)
      : undefined;

    const bands: { band: CerReductionBand; start: string; end: string }[] = [
      { band: 'beforeLegalAge', start: resumption, end: legalBandStart },
      { band: 'beforeFullRateAge', start: legalBandStart, end: fullCumulStart },
    ];
    const periodEnd = followingMonth(end);
    const periods: CerReductionPeriod[] = [];
    for (const band of bands) {
      const startDate = band.start > resumption ? band.start : resumption;
      const endExclusive = band.end < periodEnd ? band.end : periodEnd;
      if (startDate > end || startDate >= endExclusive) continue;

      const endDate = endExclusive === periodEnd
        ? end
        : new Date(new Date(endExclusive).getTime() - 86_400_000).toISOString().slice(0, 10);
      const income = profile.cerIncomeByPeriod?.[band.band];
      const annualThreshold = band.band === 'beforeFullRateAge' ? CER_ANNUAL_THRESHOLDS[year] : undefined;
      let reduction: number | undefined;
      if (income !== undefined && Number.isFinite(income) && income >= 0) {
        const months = monthIndex(endExclusive) - monthIndex(startDate);
        const maximumReduction = totalPension * months;
        if (band.band === 'beforeLegalAge') {
          reduction = euros(Math.min(income, maximumReduction));
        } else if (annualThreshold !== undefined) {
          reduction = euros(Math.min(Math.max(0, income - annualThreshold) / 2, maximumReduction));
        }
      }
      periods.push({ band: band.band, startDate, endDate, income, annualThreshold, reduction });
    }

    const liquidationUnconfirmed = reachesLegalAge && liquidated !== true;
    const annualReduction = liquidationUnconfirmed || periods.some((period) => period.reduction === undefined)
      ? undefined
      : euros(periods.reduce((sum, period) => sum + (period.reduction ?? 0), 0));
    const generatesNewRights = reachesFullCumul && liquidated === true;
    const alertMessage = baseSuspensionStartDate
      ? 'Pension de base suspendue à compter de la date indiquée tant que les pensions exigibles restent à liquider et que l’activité continue.'
      : liquidationUnconfirmed
        ? 'Confirmez la liquidation de toutes les pensions exigibles pour établir le résultat du cumul à partir de l’âge légal.'
        : periods.length
          ? 'La réduction relève de l’année civile de reprise. Sa récupération intervient en principe l’année suivante.'
          : 'Cumul intégral avec les pensions exigibles liquidées.';
    return {
      ...result,
      status: periods.length === 0 && generatesNewRights ? 'INTEGRAL' : 'PLAFONNE',
      alertLevel: baseSuspensionStartDate ? 'RED' : annualReduction === 0 ? 'GREEN' : 'YELLOW',
      alertMessage,
      suspensionApplies: Boolean(baseSuspensionStartDate && baseSuspensionStartDate <= end),
      baseSuspensionStartDate,
      fullCumulStartDate: fullCumulStart,
      periods,
      annualReduction,
      generatesNewRights,
      newRightsDetails: generatesNewRights
        ? 'Nouveaux droits possibles au titre de l’activité en cumul intégral. Le montant de la seconde complémentaire reste à confirmer auprès d’Agirc-Arrco.'
        : liquidationUnconfirmed && liquidated === undefined && reachesFullCumul
          ? 'L’ouverture de nouveaux droits dépend de la liquidation des pensions exigibles.'
          : 'Aucun nouveau droit au titre de la période simulée.',
    };
  }

  const waitingPeriodEndDate = addMonths(firstPension, 6);
  const earlyFormerEmployer = profile.cerFormerEmployer && resumption < waitingPeriodEndDate;
  const waitingMonthsRemaining = earlyFormerEmployer
    ? Math.max(0, monthIndex(waitingPeriodEndDate) - monthIndex(resumption))
    : 0;
  if (!Number.isFinite(profile.cerNewGrossMonthlySalary) || profile.cerNewGrossMonthlySalary < 0) {
    return unavailable('Indiquez un salaire de reprise positif ou nul.');
  }
  const totalCerRevenue = euros(totalPension + profile.cerNewGrossMonthlySalary);
  const eligibleForIntegral = resumption >= fullRateBirthday
    || (resumption >= legalBirthday && validatedQuarters >= requiredQuarters);
  if (eligibleForIntegral && profile.cerAllPensionsLiquidated === undefined) {
    return unavailable('Confirmez la liquidation de toutes les pensions exigibles pour vérifier le cumul intégral.');
  }
  if (eligibleForIntegral && profile.cerAllPensionsLiquidated) {
    const generatesNewRights = !earlyFormerEmployer || firstPension < '2023-11-01';
    return {
      ...result,
      status: 'INTEGRAL',
      alertLevel: generatesNewRights ? 'GREEN' : 'YELLOW',
      alertMessage: generatesNewRights
        ? 'Cumul intégral sans plafond de revenus.'
        : 'Les pensions restent versées. Une reprise avant six mois chez le dernier employeur exclut les nouveaux droits de base au titre de cette activité.',
      waitingMonthsRemaining, waitingPeriodEndDate, totalCerRevenue,
      ceilingAmount: Infinity, effectiveMonthlyGrossPension: totalPension,
      paidBaseMonthly: baseMonthly, paidComplementaryMonthly: complementaryMonthly,
      generatesNewRights,
      newRightsDetails: generatesNewRights ? 'Nouveaux droits possibles selon les conditions du régime.' : '',
    };
  }

  const smic = JANUARY_HOURLY_SMIC[Number(resumption.slice(0, 4))];
  const smicCeiling = smic === undefined ? undefined : euros(smic * 1820 / 12 * 1.6);
  const priorAverage = profile.cerPriorThreeMonthsAverage;
  const baseCeiling = Math.max(priorAverage ?? 0, smicCeiling ?? 0);
  const complementaryCeiling = Math.max(
    profile.cerLastRevaluedSalary ?? 0,
    profile.cerLastTenYearsAverage ?? 0,
    smicCeiling ?? 0,
  );
  const baseReduction = priorAverage !== undefined && smicCeiling !== undefined
    ? euros(Math.min(baseMonthly, Math.max(0, totalCerRevenue - baseCeiling)))
    : undefined;
  const paidBaseMonthly = earlyFormerEmployer ? 0
    : totalCerRevenue <= baseCeiling ? baseMonthly
    : baseReduction === undefined ? undefined : euros(baseMonthly - baseReduction);
  const paidComplementaryMonthly = totalCerRevenue <= complementaryCeiling ? complementaryMonthly
    : smicCeiling !== undefined && profile.cerLastRevaluedSalary !== undefined
      && profile.cerLastTenYearsAverage !== undefined ? 0 : undefined;
  const effectiveMonthlyGrossPension = paidBaseMonthly === undefined || paidComplementaryMonthly === undefined
    ? undefined : euros(paidBaseMonthly + paidComplementaryMonthly);

  return {
    ...result,
    alertLevel: earlyFormerEmployer ? 'RED' : 'YELLOW',
    alertMessage: earlyFormerEmployer
      ? 'Reprise chez le dernier employeur avant six mois. La pension de base est suspendue au plus tard jusqu’au début du septième mois si l’activité se poursuit. Le plafond Agirc-Arrco est évalué séparément.'
      : 'Cumul plafonné. La pension de base est réduite en cas de dépassement de son plafond. La retraite Agirc-Arrco est suspendue si son propre plafond est dépassé.',
    suspensionApplies: earlyFormerEmployer || paidComplementaryMonthly === 0 && complementaryMonthly > 0,
    waitingMonthsRemaining, waitingPeriodEndDate,
    ceilingAmount: baseCeiling, totalCerRevenue,
    exceedsCeiling: Boolean(baseReduction),
    ecretementAmount: baseReduction ?? 0,
    paidBaseMonthly, paidComplementaryMonthly, effectiveMonthlyGrossPension,
    newRightsDetails: 'Le cumul plafonné ne crée aucun nouveau droit.',
  };
}

import { CareerYear, UserProfile, CalculationResult } from '../types/retirement';
import { calculateAnnualSalary } from './annualSalary';
import { analyzeCer } from './cerCalculator';
import { analyzeLongCareer, firstPensionDate } from './longCareer';
import { careerQuarters } from '../utils/careerEntry';
import { addMonths, retirementDateIssue, validDate } from '../utils/civilDates';
import { REPERES_2026, GENERATION_SCALES } from '../constants/parameters2026';

/**
 * MOTEUR DE CALCUL DE RETRAITE OBLIGATOIRE (CNAV/LURA + AGIRC-ARRCO) & CUMUL EMPLOI-RETRAITE
 * 
 * Implémentation rigoureuse du droit social français :
 * - Code de la Sécurité Sociale (CSS) art. L. 351-1 à L. 351-16 (Retraite de base)
 * - Art. L. 161-22 et L. 161-22-1-1 CSS (Cumul Emploi-Retraite & Réforme 2023)
 * - Accord National Interprofessionnel (ANI) Agirc-Arrco
 * - Mesures de suspension LFSS 2026 applicables pour les départs à compter du 01/09/2026
 */

export function calculateRetirement(
  profile: UserProfile,
  rawCareer: CareerYear[]
): CalculationResult {
  // 1. Analyse des dates et de l'âge
  const datesReady = retirementDateIssue(profile.birthDate, profile.desiredDepartureDate) === undefined;
  const birthDate = new Date(validDate(profile.birthDate) ? profile.birthDate : NaN);
  const departureDate = new Date(validDate(profile.desiredDepartureDate) ? profile.desiredDepartureDate : NaN);

  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth() + 1; // 1-12
  const departureYear = departureDate.getUTCFullYear();
  const departureMonth = departureDate.getUTCMonth() + 1; // 1-12

  // Âge en mois au départ
  const elapsedCalendarMonths = (departureYear - birthYear) * 12 + (departureMonth - birthMonth);
  const birthdayMonthCompleted = validDate(profile.birthDate) && validDate(profile.desiredDepartureDate)
    && profile.desiredDepartureDate >= addMonths(profile.birthDate, elapsedCalendarMonths);
  const ageTotalMonths = datesReady ? elapsedCalendarMonths - (birthdayMonthCompleted ? 0 : 1) : 0;
  const ageYears = Math.floor(ageTotalMonths / 12);
  const ageMonths = ageTotalMonths % 12;

  // 2. Barème de la génération : Réforme 2023 vs Suspension LFSS 2026
  // La suspension LFSS 2026 s'applique pour tout départ à compter du 01/09/2026
  const isSuspension2026 = profile.desiredDepartureDate >= '2026-09-01';
  const appliedRule: 'Réforme 2023' | 'Suspension LFSS 2026' = isSuspension2026
    ? 'Suspension LFSS 2026'
    : 'Réforme 2023';

  // Recherche dans la table de génération
  const genScale = GENERATION_SCALES.find((s) => {
    if (s.birthYear !== birthYear) return false;
    if (s.birthMonthStart && birthMonth < s.birthMonthStart) return false;
    if (s.birthMonthEnd && birthMonth > s.birthMonthEnd) return false;
    return true;
  });

  let legalAgeYears = 64;
  let legalAgeMonths = 0;
  let requiredQuarters = 172;

  if (genScale) {
    if (isSuspension2026) {
      legalAgeYears = genScale.legalAgeYears2026;
      legalAgeMonths = genScale.legalAgeMonths2026;
      requiredQuarters = genScale.quartersRequired2026;
    } else {
      legalAgeYears = genScale.legalAgeYears2023;
      legalAgeMonths = genScale.legalAgeMonths2023;
      requiredQuarters = genScale.quartersRequired2023;
    }
  } else if (birthYear <= 1960) {
    legalAgeYears = 62;
    legalAgeMonths = 0;
    requiredQuarters = 167;
  } else if (birthYear >= 1969) {
    legalAgeYears = 64;
    legalAgeMonths = 0;
    requiredQuarters = 172;
  }

  const legalAgeTotalMonths = legalAgeYears * 12 + legalAgeMonths;

  // 3. Calcul de la carrière, revalorisation et trimestres
  const liquidationYear = departureYear;

  const isExpressMode = profile.careerMode === 'express' && !!profile.expressData;

  let totalValidatedQuartersFromCareer = 0;
  let totalContributedQuarters = 0;
  let agircTotalPoints = 0;

  if (isExpressMode && profile.expressData) {
    totalValidatedQuartersFromCareer = profile.expressData.totalQuarters;
    totalContributedQuarters = profile.expressData.contributedQuarters;
    agircTotalPoints = profile.expressData.agircPoints;
  } else if (datesReady) {
    const retained = careerQuarters(rawCareer, birthYear, profile.desiredDepartureDate);
    totalValidatedQuartersFromCareer = Array.from(retained.validatedByYear.values())
      .reduce((total, quarters) => total + quarters, 0);
    totalContributedQuarters = retained.contributed;
    agircTotalPoints = rawCareer
      .filter((row) => row.year >= birthYear && row.year <= liquidationYear)
      .reduce((total, row) => total + row.agircPoints, 0);
  } else {
    for (const row of rawCareer) {
      totalValidatedQuartersFromCareer += row.validatedQuarters;
      totalContributedQuarters += row.contributedQuarters;
      agircTotalPoints += row.agircPoints;
    }
  }

  const totalValidatedQuarters = totalValidatedQuartersFromCareer;

  const longCareer = analyzeLongCareer(profile, rawCareer, legalAgeTotalMonths, requiredQuarters);
  const isCarriereLongue = longCareer.status === 'eligible';
  const reachesLegalAge = datesReady
    && profile.desiredDepartureDate >= firstPensionDate(profile.birthDate, legalAgeTotalMonths);

  // Taux plein automatique pour situation particulière (Inaptitude, handicap, invalidité - Art. L. 351-8 CSS)
  const isAutomaticFullRateSpecial =
    profile.specialCircumstances?.automaticFullRate && ageYears >= 62;

  // Statut d'éligibilité globale
  let eligibilityStatus: 'eligible_taux_plein' | 'eligible_decote' | 'ineligible';
  if (isCarriereLongue || isAutomaticFullRateSpecial) {
    eligibilityStatus = 'eligible_taux_plein';
  } else if (reachesLegalAge) {
    if (totalValidatedQuarters >= requiredQuarters || ageYears >= REPERES_2026.ageTauxPleinAutomatiqueAnnees) {
      eligibilityStatus = 'eligible_taux_plein';
    } else {
      eligibilityStatus = 'eligible_decote';
    }
  } else {
    eligibilityStatus = 'ineligible';
  }

  const samAnalysis = calculateAnnualSalary(profile, rawCareer, birthYear, datesReady ? liquidationYear : NaN);
  const sam = samAnalysis.amount;

  // 6. Liquidation, décote et surcote
  let liquidationRate = 0.50; // Taux plein
  let decoteQuarters = 0;
  let surcoteQuarters = 0;
  let surcoteRate = 0;

  if (eligibilityStatus === 'eligible_taux_plein') {
    liquidationRate = 0.50;
    // Surcote : trimestres travaillés APRÈS l'âge légal ET au-delà des trimestres requis (Art. L. 351-1-2 CSS)
    if (ageTotalMonths > legalAgeTotalMonths && totalValidatedQuarters > requiredQuarters) {
      const quartersOverAge = Math.floor((ageTotalMonths - legalAgeTotalMonths) / 3);
      const quartersOverRequired = totalValidatedQuarters - requiredQuarters;
      surcoteQuarters = Math.min(quartersOverAge, quartersOverRequired);
      surcoteRate = surcoteQuarters * 0.0125; // +1.25% par trimestre supplémentaire
    }
  } else if (eligibilityStatus === 'eligible_decote') {
    // Décote : min des trimestres manquants pour atteindre le taux plein en durée ou l'âge d'annulation (67 ans)
    const missingQuartersDuration = Math.max(0, requiredQuarters - totalValidatedQuarters);
    const missingQuartersAge = Math.max(
      0,
      Math.ceil((REPERES_2026.ageTauxPleinAutomatiqueAnnees * 12 - ageTotalMonths) / 3)
    );
    decoteQuarters = Math.min(20, Math.min(missingQuartersDuration, missingQuartersAge));
    // Décote de 0.625 point par trimestre manquant
    liquidationRate = Math.max(0.375, 0.50 - decoteQuarters * 0.00625);
  } else {
    // Inéligible : calcul indicatif avec décote maximale ou taux minoré
    liquidationRate = 0.375;
  }

  // Proratisation : MIN(Trimestres, Requis) / Requis
  const proratisation = Math.min(1.0, totalValidatedQuarters / requiredQuarters);

  // 7. Retraite de base (Assurance Retraite / LURA)
  // Formule : SAM x Taux x Proratisation x (1 + Surcote)
  const basePensionAnnualBeforeBonus =
    sam * liquidationRate * proratisation * (1 + surcoteRate);
  const basePensionMonthlyGrossBeforeBonus = Number(
    (basePensionAnnualBeforeBonus / 12).toFixed(2)
  );

  // Majoration enfants (+10% dès 3 enfants nés et élevés, Art. L. 351-12 CSS)
  const baseChildBonusMonthly =
    profile.childrenCount >= 3
      ? Number((basePensionMonthlyGrossBeforeBonus * 0.10).toFixed(2))
      : 0;

  const basePensionMonthlyGross = Number(
    (basePensionMonthlyGrossBeforeBonus + baseChildBonusMonthly).toFixed(2)
  );
  const basePensionAnnualGross = Number((basePensionMonthlyGross * 12).toFixed(2));

  // Estimation nette (prélèvements sociaux -9.1% au taux normal)
  const basePensionMonthlyNet = Number(
    (basePensionMonthlyGross * (1 - REPERES_2026.cotisationsSocialesBaseTaux)).toFixed(2)
  );

  // 8. Retraite complémentaire Agirc-Arrco
  const agircPointValue = REPERES_2026.valeurPointAgircArrco;
  const agircAnnualGrossBeforeBonus = agircTotalPoints * agircPointValue;
  const agircMonthlyGrossBeforeBonus = Number(
    (agircAnnualGrossBeforeBonus / 12).toFixed(2)
  );

  // Majoration enfants Agirc-Arrco (+10% dès 3 enfants, plafonnée à 2 367,48 €/an au 01/11/2024)
  let agircChildBonusMonthly = 0;
  let agircChildBonusCapped = false;
  if (profile.childrenCount >= 3) {
    const rawBonusMonthly = agircMonthlyGrossBeforeBonus * 0.10;
    if (rawBonusMonthly > REPERES_2026.plafondMajorationEnfantsAgircMensuel) {
      agircChildBonusMonthly = REPERES_2026.plafondMajorationEnfantsAgircMensuel;
      agircChildBonusCapped = true;
    } else {
      agircChildBonusMonthly = Number(rawBonusMonthly.toFixed(2));
      agircChildBonusCapped = false;
    }
  }

  const agircMonthlyGross = Number(
    (agircMonthlyGrossBeforeBonus + agircChildBonusMonthly).toFixed(2)
  );

  // Prélèvements sociaux Agirc-Arrco (-10.1% au taux normal)
  const agircMonthlyNet = Number(
    (agircMonthlyGross * (1 - REPERES_2026.cotisationsSocialesAgircTaux)).toFixed(2)
  );

  // 9. Totaux et Taux de remplacement
  const totalMonthlyGross = Number((basePensionMonthlyGross + agircMonthlyGross).toFixed(2));
  const totalMonthlyNet = Number((basePensionMonthlyNet + agircMonthlyNet).toFixed(2));
  const grossReplacementRate =
    profile.lastGrossMonthlySalary > 0
      ? Number(((totalMonthlyGross / profile.lastGrossMonthlySalary) * 100).toFixed(2))
      : 0;

  // 10. Module Cumul Emploi-Retraite (CER)
  const cerAnalysis = analyzeCer(
    profile,
    legalAgeTotalMonths,
    requiredQuarters,
    totalValidatedQuarters,
    eligibilityStatus !== 'ineligible',
    samAnalysis.source !== 'unavailable',
    basePensionMonthlyGross,
    agircMonthlyGross
  );

  return {
    ageAtDeparture: {
      years: ageYears,
      months: ageMonths,
      totalMonths: ageTotalMonths,
      formatted: datesReady ? `${ageYears} ans ${ageMonths > 0 ? `${ageMonths} mois` : ''}`.trim() : 'À renseigner',
    },
    legalAge: {
      years: legalAgeYears,
      months: legalAgeMonths,
      totalMonths: legalAgeTotalMonths,
      formatted: `${legalAgeYears} ans ${legalAgeMonths > 0 ? `${legalAgeMonths} mois` : ''}`.trim(),
    },
    requiredQuarters,
    totalValidatedQuarters,
    totalContributedQuarters,
    longCareer,
    isCarriereLongue,
    carriereLongueDetails: longCareer.details,
    eligibilityStatus,
    appliedRule,
    samYearsCount: samAnalysis.yearLimit,
    sam,
    samAnalysis,
    topYears: samAnalysis.topYears,
    liquidationRate,
    decoteQuarters,
    surcoteQuarters,
    surcoteRate,
    proratisation,
    basePensionMonthlyGrossBeforeBonus,
    baseChildBonusMonthly,
    basePensionMonthlyGross,
    basePensionAnnualGross,
    basePensionMonthlyNet,
    agircTotalPoints: Number(agircTotalPoints.toFixed(2)),
    agircPointValue,
    agircMonthlyGrossBeforeBonus,
    agircChildBonusMonthly,
    agircChildBonusCapped,
    agircMonthlyGross,
    agircMonthlyNet,
    totalMonthlyGross,
    totalMonthlyNet,
    grossReplacementRate,
    cerAnalysis,
  };
}

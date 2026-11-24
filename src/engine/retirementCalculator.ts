import { CareerYear, UserProfile, CalculationResult } from '../types/retirement';
import { getPassForYear, FRF_TO_EUR_RATE } from '../constants/passHistory';
import { getCnavCoeff } from '../constants/cnavCoefficients';
import { analyzeCer } from './cerCalculator';
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
  const birthDate = new Date(profile.birthDate);
  const departureDate = new Date(profile.desiredDepartureDate);

  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth() + 1; // 1-12
  const departureYear = departureDate.getFullYear();
  const departureMonth = departureDate.getMonth() + 1; // 1-12

  // Âge en mois au départ
  const ageTotalMonths = (departureYear - birthYear) * 12 + (departureMonth - birthMonth);
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

  // Recalcul des lignes de carrière avec devises et PASS
  const processedCareer: CareerYear[] = rawCareer.map((row) => {
    const grossIncomeEur =
      row.currency === 'FRF'
        ? Number((row.grossIncome / FRF_TO_EUR_RATE).toFixed(2))
        : row.grossIncome;
    const passEur = getPassForYear(row.year);
    const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
    const cnavCoeff = getCnavCoeff(row.year, liquidationYear);
    const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

    totalValidatedQuartersFromCareer += row.validatedQuarters;
    totalContributedQuarters += row.contributedQuarters;
    agircTotalPoints += row.agircPoints;

    return {
      ...row,
      grossIncomeEur,
      passEur,
      retainedSalaryEur,
      cnavCoeff,
      revaluedSalaryEur,
    };
  });

  // Si Mode Express : remplacement direct par les valeurs saisies
  if (isExpressMode && profile.expressData) {
    totalValidatedQuartersFromCareer = profile.expressData.totalQuarters;
    totalContributedQuarters = profile.expressData.contributedQuarters;
    agircTotalPoints = profile.expressData.agircPoints;
  }

  const totalValidatedQuarters = totalValidatedQuartersFromCareer;

  // 4. Détection Carrière Longue (RACL - Art. L. 351-1-1 CSS)
  // Début précoce : avoir au moins 5 trimestres validés avant la fin de l'année des 16/18/20/21 ans (ou 4 si né au T4)
  let quartersBefore20 = processedCareer
    .filter((r) => r.year <= birthYear + 20)
    .reduce((sum, r) => sum + r.validatedQuarters, 0);

  if (profile.specialCircumstances?.earlyCareer && profile.specialCircumstances.earlyQuartersCount > 0) {
    quartersBefore20 = Math.max(quartersBefore20, profile.specialCircumstances.earlyQuartersCount);
  }

  const minEarlyQuartersRequired = birthMonth >= 10 ? 4 : 5;
  const hasEarlyStart = quartersBefore20 >= minEarlyQuartersRequired;
  const hasEnoughContributedQuarters = totalContributedQuarters >= requiredQuarters;

  // Éligibilité RACL à 60 ou 62 ans selon début d'activité et trimestres cotisés
  const isCarriereLongue = hasEarlyStart && hasEnoughContributedQuarters;
  let carriereLongueDetails = '';
  if (isCarriereLongue) {
    carriereLongueDetails = `Début d'activité avant 20 ans (${quartersBefore20} trimestres validés fin ${birthYear + 20} pour ${minEarlyQuartersRequired} requis) et ${totalContributedQuarters} trimestres cotisés/réputés cotisés pour ${requiredQuarters} requis. Éligible départ anticipé à taux plein.`;
  } else if (!hasEarlyStart) {
    carriereLongueDetails = `Début d'activité précoce insuffisant (${quartersBefore20} trimestres avant 20 ans, minimum requis : ${minEarlyQuartersRequired}).`;
  } else {
    carriereLongueDetails = `Trimestres cotisés insuffisants (${totalContributedQuarters} cotisés pour ${requiredQuarters} requis).`;
  }

  // Taux plein automatique pour situation particulière (Inaptitude, handicap, invalidité - Art. L. 351-8 CSS)
  const isAutomaticFullRateSpecial =
    profile.specialCircumstances?.automaticFullRate && ageYears >= 62;

  // Statut d'éligibilité globale
  let eligibilityStatus: 'eligible_taux_plein' | 'eligible_decote' | 'ineligible';
  if ((isCarriereLongue && ageYears >= 60) || isAutomaticFullRateSpecial) {
    eligibilityStatus = 'eligible_taux_plein';
  } else if (ageTotalMonths >= legalAgeTotalMonths) {
    if (totalValidatedQuarters >= requiredQuarters || ageYears >= REPERES_2026.ageTauxPleinAutomatiqueAnnees) {
      eligibilityStatus = 'eligible_taux_plein';
    } else {
      eligibilityStatus = 'eligible_decote';
    }
  } else {
    eligibilityStatus = 'ineligible';
  }

  // 5. Nombre d'années N pour le SAM
  // Règle générale : 25 meilleures années
  // Règle LFSS 2026 si départ >= 01/09/2026 et enfants élevés : 24 ans (1 enfant) ou 23 ans (>= 2 enfants)
  let samYearsCount = 25;
  if (isSuspension2026 && profile.childrenCount >= 1) {
    samYearsCount = profile.childrenCount === 1 ? 24 : 23;
  }

  let sam = 0;
  let topYearsList: number[] = [];

  if (isExpressMode && profile.expressData) {
    sam = profile.expressData.estimatedSam;
  } else {
    // Tri des salaires revalorisés pour extraire les N meilleures années
    const sortedCareer = [...processedCareer].sort(
      (a, b) => b.revaluedSalaryEur - a.revaluedSalaryEur
    );
    topYearsList = sortedCareer.slice(0, samYearsCount).map((r) => r.year);

    // Marquage isTopYear sur la carrière
    processedCareer.forEach((r) => {
      r.isTopYear = topYearsList.includes(r.year);
    });

    const sumTopSalaries = sortedCareer
      .slice(0, samYearsCount)
      .reduce((sum, r) => sum + r.revaluedSalaryEur, 0);
    sam = samYearsCount > 0 ? Number((sumTopSalaries / samYearsCount).toFixed(2)) : 0;
  }

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
    basePensionMonthlyGross,
    agircMonthlyGross
  );

  return {
    ageAtDeparture: {
      years: ageYears,
      months: ageMonths,
      totalMonths: ageTotalMonths,
      formatted: `${ageYears} ans ${ageMonths > 0 ? `${ageMonths} mois` : ''}`.trim(),
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
    isCarriereLongue,
    carriereLongueDetails,
    eligibilityStatus,
    appliedRule,
    samYearsCount,
    sam,
    topYears: topYearsList,
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

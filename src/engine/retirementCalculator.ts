import { CareerYear, UserProfile, CalculationResult } from '../types/retirement';
import { calculateAnnualSalary } from './annualSalary';
import { analyzeCer } from './cerCalculator';
import { analyzeLongCareer, firstPensionDate } from './longCareer';
import { addMonths, validDate } from '../utils/civilDates';
import { REPERES_2026, getGenerationScaleForProfile } from '../constants/parameters2026';

/**
 * MOTEUR DE CALCUL DE RETRAITE OBLIGATOIRE (CNAV/LURA + AGIRC-ARRCO) & CUMUL EMPLOI-RETRAITE
 * 
 * Implémentation rigoureuse du droit social français :
 * - Code de la Sécurité Sociale (CSS) art. L. 351-1 à L. 351-16 (Retraite de base)
 * - Art. L. 161-22 et L. 161-22-1-1 CSS (Cumul Emploi-Retraite & Réforme 2023)
 * - Accord National Interprofessionnel (ANI) Agirc-Arrco
 * - Mesures de suspension LFSS 2026 applicables pour les départs à compter du 01/09/2026
 */

function computeAgircAbattementCoeff(missingQuarters: number): number {
  if (missingQuarters <= 0) return 1;
  const capped = Math.min(20, missingQuarters);
  const first12 = Math.min(12, capped);
  const next8 = Math.max(0, capped - 12);
  return Number((1 - first12 * 0.01 - next8 * 0.0125).toFixed(4));
}

export function calculateRetirement(
  profile: UserProfile,
  rawCareer: CareerYear[]
): CalculationResult {
  // 1. Analyse des dates et de l'âge
  const birthDate = new Date(profile.birthDate);
  const departureDate = new Date(profile.desiredDepartureDate);

  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth() + 1; // 1-12
  const departureYear = departureDate.getUTCFullYear();
  const departureMonth = departureDate.getUTCMonth() + 1; // 1-12

  // Âge en mois au départ
  const elapsedCalendarMonths = (departureYear - birthYear) * 12 + (departureMonth - birthMonth);
  const birthdayMonthCompleted = validDate(profile.birthDate) && validDate(profile.desiredDepartureDate)
    && profile.desiredDepartureDate >= addMonths(profile.birthDate, elapsedCalendarMonths);
  const ageTotalMonths = elapsedCalendarMonths - (birthdayMonthCompleted ? 0 : 1);
  const ageYears = Math.floor(ageTotalMonths / 12);
  const ageMonths = ageTotalMonths % 12;

  // 2. Barème applicable à la date d'effet (Réforme 2023 en 2025 ; Suspension LFSS 2026 à partir du 01/09/2026)
  const {
    legalAgeYears,
    legalAgeMonths,
    requiredQuarters,
    appliedRule,
  } = getGenerationScaleForProfile(profile.birthDate, profile.desiredDepartureDate);

  const legalAgeTotalMonths = legalAgeYears * 12 + legalAgeMonths;

  // 3. Calcul de la carrière, revalorisation et trimestres
  const liquidationYear = departureYear;

  const isExpressMode = profile.careerMode === 'express' && !!profile.expressData;

  let totalValidatedQuartersFromCareer = 0;
  let totalContributedQuarters = 0;
  let agircTotalPoints = 0;

  for (const row of rawCareer) {
    totalValidatedQuartersFromCareer += row.validatedQuarters;
    totalContributedQuarters += row.contributedQuarters;
    agircTotalPoints += row.agircPoints;
  }

  // Si Mode Express : remplacement direct par les valeurs saisies
  if (isExpressMode && profile.expressData) {
    totalValidatedQuartersFromCareer = profile.expressData.totalQuarters;
    totalContributedQuarters = profile.expressData.contributedQuarters;
    agircTotalPoints = profile.expressData.agircPoints;
  }

  const totalValidatedQuarters = totalValidatedQuartersFromCareer;

  const longCareer = analyzeLongCareer(profile, rawCareer, legalAgeTotalMonths, requiredQuarters);
  const isCarriereLongue = longCareer.status === 'eligible';
  const reachesLegalAge = validDate(profile.birthDate) && validDate(profile.desiredDepartureDate)
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

  const samAnalysis = calculateAnnualSalary(profile, rawCareer, birthYear, liquidationYear);
  const sam = samAnalysis.amount;

  // 6. Liquidation, décote, surcote et coefficient d'abattement Agirc-Arrco
  let liquidationRate = 0.50; // Taux plein
  let decoteQuarters = 0;
  let surcoteQuarters = 0;
  let surcoteRate = 0;
  let agircAbattementCoeff = 1;

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

    // Coefficient de minoration définitif Agirc-Arrco : meilleur coefficient entre durée (<= 20 trim.) et âge (67 ans)
    const coeffAge = computeAgircAbattementCoeff(missingQuartersAge);
    const coeffDuration =
      missingQuartersDuration <= 20
        ? computeAgircAbattementCoeff(missingQuartersDuration)
        : coeffAge;
    agircAbattementCoeff = Math.max(coeffDuration, coeffAge);
  } else {
    // Départ refusé : aucune pension liquidable à la date demandée
    liquidationRate = 0;
    agircAbattementCoeff = 0;
  }

  // Proratisation : MIN(Trimestres, Requis) / Requis
  const proratisation = Math.min(1.0, totalValidatedQuarters / requiredQuarters);

  // 7. Retraite complémentaire Agirc-Arrco (calculée avant le MICO pour vérifier le plafond total)
  const agircPointValue = REPERES_2026.valeurPointAgircArrco;
  let agircMonthlyGrossBeforeBonus = 0;
  let agircChildBonusMonthly = 0;
  let agircChildBonusCapped = false;
  let agircMonthlyGross = 0;
  let agircMonthlyNet = 0;

  if (eligibilityStatus !== 'ineligible') {
    const agircAnnualGrossBeforeBonus =
      agircTotalPoints * agircPointValue * agircAbattementCoeff;
    agircMonthlyGrossBeforeBonus = Number(
      (agircAnnualGrossBeforeBonus / 12).toFixed(2)
    );

    // Majoration enfants Agirc-Arrco (+10% dès 3 enfants, plafonnée à 2 367,48 €/an au 01/11/2024)
    let agircChildBonusAnnual = 0;
    if (profile.childrenCount >= 3) {
      const rawBonusAnnual = agircAnnualGrossBeforeBonus * 0.10;
      if (rawBonusAnnual > REPERES_2026.plafondMajorationEnfantsAgircAnnuel) {
        agircChildBonusAnnual = REPERES_2026.plafondMajorationEnfantsAgircAnnuel;
        agircChildBonusCapped = true;
      } else {
        agircChildBonusAnnual = rawBonusAnnual;
        agircChildBonusCapped = false;
      }
    }
    agircChildBonusMonthly = Number((agircChildBonusAnnual / 12).toFixed(2));

    // Arrondi final unique après annualisation + majoration + mensualisation
    agircMonthlyGross = Number(
      ((agircAnnualGrossBeforeBonus + agircChildBonusAnnual) / 12).toFixed(2)
    );

    // Prélèvements sociaux Agirc-Arrco (-10.1% au taux normal)
    agircMonthlyNet = Number(
      (agircMonthlyGross * (1 - REPERES_2026.cotisationsSocialesAgircTaux)).toFixed(2)
    );
  }

  // 8. Retraite de base (Assurance Retraite / LURA) + Minimum Contributif (MICO)
  let basePensionMonthlyGrossBeforeMico = 0;
  let micoApplied = false;
  let micoComplementMonthly = 0;
  let basePensionMonthlyGrossBeforeBonus = 0;
  let baseChildBonusMonthly = 0;
  let basePensionMonthlyGross = 0;
  let basePensionAnnualGross = 0;
  let basePensionMonthlyNet = 0;

  if (eligibilityStatus !== 'ineligible') {
    // Formule : SAM x Taux x Proratisation x (1 + Surcote)
    const basePensionAnnualBeforeMico =
      sam * liquidationRate * proratisation * (1 + surcoteRate);
    basePensionMonthlyGrossBeforeMico = Number(
      (basePensionAnnualBeforeMico / 12).toFixed(2)
    );

    // Minimum contributif (MICO) : taux plein requis + liquidation de toutes les pensions (Art. L. 351-10 CSS)
    const allPensionsLiquidated = profile.allPensionsLiquidated !== false;
    if (eligibilityStatus === 'eligible_taux_plein' && allPensionsLiquidated) {
      const micoBaseProrated =
        REPERES_2026.micoBaseMensuel2025 * Math.min(1, totalValidatedQuarters / requiredQuarters);
      const hasMicoMajoration = totalContributedQuarters >= REPERES_2026.micoSeuilTrimestresCotises;
      const micoMajorationDiff =
        REPERES_2026.micoMajoreMensuel2025 - REPERES_2026.micoBaseMensuel2025;
      const micoMajorationProrated = hasMicoMajoration
        ? micoMajorationDiff * Math.min(1, totalContributedQuarters / requiredQuarters)
        : 0;
      const micoTargetMonthly = Number((micoBaseProrated + micoMajorationProrated).toFixed(2));

      if (basePensionMonthlyGrossBeforeMico < micoTargetMonthly) {
        const rawComplement = Number((micoTargetMonthly - basePensionMonthlyGrossBeforeMico).toFixed(2));
        const otherPensions = Math.max(0, profile.otherPensionsMonthly || 0);
        const totalWithRawMico = basePensionMonthlyGrossBeforeMico + rawComplement + agircMonthlyGross + otherPensions;
        const ecretement = Math.max(0, totalWithRawMico - REPERES_2026.micoPlafondPensionsMensuel2025);
        micoComplementMonthly = Number(Math.max(0, rawComplement - ecretement).toFixed(2));
        micoApplied = micoComplementMonthly > 0;
      }
    }

    basePensionMonthlyGrossBeforeBonus = Number(
      (basePensionMonthlyGrossBeforeMico + micoComplementMonthly).toFixed(2)
    );

    // Majoration enfants (+10% dès 3 enfants nés et élevés, Art. L. 351-12 CSS)
    baseChildBonusMonthly =
      profile.childrenCount >= 3
        ? Number((basePensionMonthlyGrossBeforeBonus * 0.10).toFixed(2))
        : 0;

    basePensionMonthlyGross = Number(
      (basePensionMonthlyGrossBeforeBonus + baseChildBonusMonthly).toFixed(2)
    );
    basePensionAnnualGross = Number((basePensionMonthlyGross * 12).toFixed(2));

    // Estimation nette (prélèvements sociaux -9.1% au taux normal)
    basePensionMonthlyNet = Number(
      (basePensionMonthlyGross * (1 - REPERES_2026.cotisationsSocialesBaseTaux)).toFixed(2)
    );
  }

  // 9. Totaux et Taux de remplacement
  const totalMonthlyGross =
    eligibilityStatus === 'ineligible'
      ? 0
      : Number((basePensionMonthlyGross + agircMonthlyGross).toFixed(2));
  const totalMonthlyNet =
    eligibilityStatus === 'ineligible'
      ? 0
      : Number((basePensionMonthlyNet + agircMonthlyNet).toFixed(2));
  const grossReplacementRate =
    eligibilityStatus !== 'ineligible' && profile.lastGrossMonthlySalary > 0
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
    basePensionMonthlyGrossBeforeMico,
    micoApplied,
    micoComplementMonthly,
    basePensionMonthlyGrossBeforeBonus,
    baseChildBonusMonthly,
    basePensionMonthlyGross,
    basePensionAnnualGross,
    basePensionMonthlyNet,
    agircTotalPoints: Number(agircTotalPoints.toFixed(2)),
    agircPointValue,
    agircAbattementCoeff,
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

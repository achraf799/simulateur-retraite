import { CareerYear, UserProfile, CalculationResult, CerAnalysisResult } from '../types/retirement';
import { getPassForYear, FRF_TO_EUR_RATE } from '../constants/passHistory';
import { getCnavCoeff } from '../constants/cnavCoefficients';
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
    ageTotalMonths,
    legalAgeTotalMonths,
    eligibilityStatus,
    totalMonthlyGross
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

/**
 * Analyse experte du Cumul Emploi-Retraite (Art. L. 161-22 et L. 161-22-1-1 CSS)
 */
function analyzeCer(
  profile: UserProfile,
  ageTotalMonths: number,
  legalAgeTotalMonths: number,
  eligibilityStatus: 'eligible_taux_plein' | 'eligible_decote' | 'ineligible',
  totalMonthlyGrossPension: number
): CerAnalysisResult {
  if (!profile.cerEnabled) {
    return {
      status: 'PLAFONNE',
      alertLevel: 'GREEN',
      alertMessage: 'Aucune reprise d’activité prévue après le départ en retraite.',
      suspensionApplies: false,
      waitingMonthsRemaining: 0,
      waitingPeriodEndDate: '',
      ceilingAmount: 0,
      totalCerRevenue: 0,
      exceedsCeiling: false,
      ecretementAmount: 0,
      effectiveMonthlyGrossPension: totalMonthlyGrossPension,
      generatesNewRights: false,
      newRightsDetails: 'N/A',
      recommendations: [],
    };
  }

  const departureDate = new Date(profile.desiredDepartureDate);
  const resumptionDate = new Date(profile.cerResumptionDate);

  const monthsBetweenDepartureAndResumption =
    (resumptionDate.getFullYear() - departureDate.getFullYear()) * 12 +
    (resumptionDate.getMonth() - departureDate.getMonth());

  // Date de fin du délai de carence de 6 mois
  const waitingEndDate = new Date(departureDate);
  waitingEndDate.setMonth(waitingEndDate.getMonth() + 6);
  const waitingPeriodEndDate = waitingEndDate.toISOString().split('T')[0];
  const waitingMonthsRemaining = Math.max(0, 6 - monthsBetweenDepartureAndResumption);

  // Cas 1 : Départ avant l'âge légal (ex: Carrière longue) -> CER Plafonné
  const isBeforeLegalAge = ageTotalMonths < legalAgeTotalMonths;
  const isTauxPleinAtLegalAge =
    ageTotalMonths >= legalAgeTotalMonths && eligibilityStatus === 'eligible_taux_plein';

  if (isBeforeLegalAge) {
    // Statut : CER PLAFONNÉ
    const ceilingAmount = Math.max(
      profile.lastGrossMonthlySalary,
      REPERES_2026.plafond1_6SmicMensuel
    );
    const totalCerRevenue = totalMonthlyGrossPension + profile.cerNewGrossMonthlySalary;
    const exceedsCeiling = totalCerRevenue > ceilingAmount;
    const ecretementAmount = exceedsCeiling ? Number((totalCerRevenue - ceilingAmount).toFixed(2)) : 0;

    // Règle critique : Reprise chez l'ancien employeur sous 6 mois
    if (profile.cerFormerEmployer && monthsBetweenDepartureAndResumption < 6) {
      return {
        status: 'PLAFONNE',
        alertLevel: 'RED',
        alertMessage:
          'ALERTE ROUGE : Suspension immédiate et intégrale de toutes les pensions (Assurance retraite + Agirc-Arrco) ! En cas de départ avant l’âge légal (ex: Carrière longue) ou sans taux plein, la reprise d’activité chez le DERNIER EMPLOYEUR impose un délai de carence obligatoire strict de 6 mois (Art. L. 161-22 du CSS). Vos pensions seront totalement suspendues jusqu’au terme des 6 mois.',
        suspensionApplies: true,
        waitingMonthsRemaining,
        waitingPeriodEndDate,
        ceilingAmount,
        totalCerRevenue,
        exceedsCeiling,
        ecretementAmount,
        effectiveMonthlyGrossPension: 0, // Pensions suspendues
        generatesNewRights: false,
        newRightsDetails:
          'Aucun nouveau droit généré : en CER plafonné, les cotisations vieillesse sont versées à fonds perdus sans ouverture de pension supplémentaire.',
        recommendations: [
          {
            title: 'Option 1 : Différer la reprise chez l’ancien employeur',
            description: `Reporter la date de reprise d’activité au ${waitingPeriodEndDate} (après l’écoulement des 6 mois de carence légale).`,
            badge: 'Recommandé',
            impact: `Préserve l'intégralité de la pension mensuelle (${totalMonthlyGrossPension} €/mois) sans aucune suspension.`,
          },
          {
            title: 'Option 2 : Reprendre immédiatement chez un NOUVEL employeur',
            description:
              'Le délai de carence de 6 mois ne concerne QUE le dernier employeur. Vous pouvez reprendre dès le 1er jour chez toute autre entreprise.',
            badge: 'Alternative directe',
            impact:
              'Maintien des pensions sous réserve du respect du plafond de revenus (plafond : ' +
              ceilingAmount +
              ' €/mois).',
          },
          {
            title: 'Option 3 : Décaler la date de départ en retraite',
            description:
              'Reporter votre départ en retraite jusqu’à l’âge légal (62 ans 9 mois) pour basculer en CER INTÉGRAL.',
            badge: 'Optimisation globale',
            impact:
              'Supprime tout plafond de revenus et permet d’acquérir de nouveaux droits à la retraite (jusqu’à 2 403 €/an).',
          },
        ],
      };
    }

    // Reprise chez un tiers ou après 6 mois mais toujours avant l'âge légal
    const effectiveMonthlyGrossPension = Math.max(
      0,
      Number((totalMonthlyGrossPension - ecretementAmount).toFixed(2))
    );

    return {
      status: 'PLAFONNE',
      alertLevel: exceedsCeiling ? 'YELLOW' : 'GREEN',
      alertMessage: exceedsCeiling
        ? `CER Plafonné : Dépassement du plafond de cumul (${totalCerRevenue.toFixed(2)} € vs plafond ${ceilingAmount.toFixed(2)} €). Votre pension sera écrêtée de ${ecretementAmount.toFixed(2)} €/mois.`
        : `CER Plafonné conforme : Vos revenus cumulés (${totalCerRevenue.toFixed(2)} €) sont inférieurs au plafond autorisé (${ceilingAmount.toFixed(2)} €/mois). Pension versée à 100 %.`,
      suspensionApplies: false,
      waitingMonthsRemaining: 0,
      waitingPeriodEndDate,
      ceilingAmount,
      totalCerRevenue,
      exceedsCeiling,
      ecretementAmount,
      effectiveMonthlyGrossPension,
      generatesNewRights: false,
      newRightsDetails:
        'En CER plafonné (départ avant l’âge légal), les cotisations vieillesse ne créent aucun nouveau droit.',
      recommendations: [
        {
          title: 'Surveiller le plafond de cumul de revenus',
          description: `Plafond applicable : dernier salaire (${profile.lastGrossMonthlySalary} €) ou 1,6 SMIC (${REPERES_2026.plafond1_6SmicMensuel} €).`,
          badge: exceedsCeiling ? 'Action requise' : 'Sous contrôle',
          impact: exceedsCeiling
            ? `Ajuster la rémunération ou le temps de travail pour éviter l'écrêtement de ${ecretementAmount} €/mois.`
            : 'Aucun écrêtement.',
        },
      ],
    };
  }

  // Cas 2 : Âge légal atteint ET Taux plein -> CER INTÉGRAL
  if (isTauxPleinAtLegalAge) {
    const isFormerEmployerWithin6Months =
      profile.cerFormerEmployer && monthsBetweenDepartureAndResumption < 6;

    return {
      status: 'INTEGRAL',
      alertLevel: isFormerEmployerWithin6Months ? 'YELLOW' : 'GREEN',
      alertMessage: isFormerEmployerWithin6Months
        ? `CER INTÉGRAL : Cumul sans plafond de ressources. Attention toutefois : pour ouvrir de NOUVEAUX DROITS chez l'ancien employeur (Réforme 2023), un délai de carence de 6 mois s'applique. Vos cotisations actuelles chez cet employeur ne généreront des droits qu'après le ${waitingPeriodEndDate}. Votre pension actuelle reste perçue sans suspension.`
        : 'CER INTÉGRAL : Cumul sans aucun plafond de salaire ! Vous percevez l’intégralité de vos pensions et vos cotisations actuelles vous ouvrent immédiatement une seconde pension de retraite de base.',
      suspensionApplies: false,
      waitingMonthsRemaining: isFormerEmployerWithin6Months ? waitingMonthsRemaining : 0,
      waitingPeriodEndDate,
      ceilingAmount: Infinity,
      totalCerRevenue: totalMonthlyGrossPension + profile.cerNewGrossMonthlySalary,
      exceedsCeiling: false,
      ecretementAmount: 0,
      effectiveMonthlyGrossPension: totalMonthlyGrossPension,
      generatesNewRights: true,
      newRightsDetails: `Nouveaux droits à la retraite ouverts (Loi 2023) : plafonnés à 5 % du PASS, soit jusqu'à ${REPERES_2026.plafondNouveauxDroitsCerAnnuel} €/an (${REPERES_2026.plafondNouveauxDroitsCerMensuel} €/mois) de pension de base supplémentaire.`,
      recommendations: [
        {
          title: 'Seconde pension de retraite (Réforme 2023)',
          description:
            'Chaque année de cotisation en CER intégral vous permet de demander une nouvelle pension de base sans décote ni abattement.',
          badge: 'Nouveauté 2023',
          impact: `Gain potentiel jusqu'à +${REPERES_2026.plafondNouveauxDroitsCerMensuel} € brut par mois.`,
        },
      ],
    };
  }

  // Cas 3 : Âge légal atteint mais départ avec décote -> CER Plafonné
  const ceilingAmount = Math.max(
    profile.lastGrossMonthlySalary,
    REPERES_2026.plafond1_6SmicMensuel
  );
  const totalCerRevenue = totalMonthlyGrossPension + profile.cerNewGrossMonthlySalary;
  const exceedsCeiling = totalCerRevenue > ceilingAmount;
  const ecretementAmount = exceedsCeiling ? Number((totalCerRevenue - ceilingAmount).toFixed(2)) : 0;
  const effectiveMonthlyGrossPension = Math.max(
    0,
    Number((totalMonthlyGrossPension - ecretementAmount).toFixed(2))
  );

  return {
    status: 'PLAFONNE',
    alertLevel: 'YELLOW',
    alertMessage:
      'CER Plafonné : Vous avez atteint l’âge légal mais n’avez pas le taux plein. Le cumul reste soumis au plafond de revenus et ne crée pas de nouveaux droits.',
    suspensionApplies: false,
    waitingMonthsRemaining: 0,
    waitingPeriodEndDate,
    ceilingAmount,
    totalCerRevenue,
    exceedsCeiling,
    ecretementAmount,
    effectiveMonthlyGrossPension,
    generatesNewRights: false,
    newRightsDetails:
      'Pour passer en CER intégral et générer de nouveaux droits, l’obtention du taux plein est indispensable.',
    recommendations: [
      {
        title: 'Travailler des trimestres supplémentaires pour atteindre le taux plein',
        description: 'Chaque trimestre validé réduit la décote et permet à terme de basculer en CER intégral.',
        badge: 'Optimisation',
        impact: 'Permet de lever le plafond de cumul et d’ouvrir de nouveaux droits.',
      },
    ],
  };
}

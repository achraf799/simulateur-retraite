/**
 * Repères économiques, sociaux et barèmes légaux (Réforme 2023 & LFSS 2026).
 */

export const REPERES_2026 = {
  // Sécurité sociale
  pass2026: 48060, // PASS annuel en EUR
  pmss2026: 4005, // Plafond mensuel en EUR

  // Salaires minimaux
  smicHoraire2026: 12.02, // SMIC horaire brut
  smicMensuel2026: 1823.07, // 151.67h * 12.02 €
  plafondCumulSmicMultiple: 1.6, // Plafond alternatif 1.6 SMIC pour le CER plafonné
  plafond1_6SmicMensuel: 2916.92, // 1.6 * 1823.07 €

  // Trimestres
  salaireValidationTrimestre2026: 1803, // 150 x SMIC horaire
  salaireValidation4Trimestres2026: 7212, // 600 x SMIC horaire

  // Nouveaux droits CER Intégral
  plafondNouveauxDroitsCerPassRatio: 0.05, // 5% du PASS
  plafondNouveauxDroitsCerAnnuel: 2403, // 0.05 * 48060 €
  plafondNouveauxDroitsCerMensuel: 200.25,

  // Prélèvements sociaux (taux normal)
  cotisationsSocialesBaseTaux: 0.091, // CSG 8.3% + CRDS 0.5% + CASA 0.3%
  cotisationsSocialesAgircTaux: 0.101, // CSG 8.3% + CRDS 0.5% + CASA 0.3% + Maladie 1.0%
  cotisationsSocialesAgircMajorationEnfantsTaux: 0.091, // Hors cotisation maladie pour enfants nés ou élevés

  // Âge d'annulation de la décote (taux plein automatique)
  ageTauxPleinAutomatiqueAnnees: 67,

  // Minimum contributif majoré
  micoSeuilTrimestresCotises: 120,
};

export interface GenerationScale {
  birthYear: number;
  birthMonthStart?: number; // 1 to 12
  birthMonthEnd?: number; // 1 to 12
  legalAgeYears2023: number;
  legalAgeMonths2023: number;
  quartersRequired2023: number;
  legalAgeYears2026: number; // LFSS 2026 suspension dès 01/09/2026
  legalAgeMonths2026: number;
  quartersRequired2026: number;
}

export const GENERATION_SCALES: GenerationScale[] = [
  {
    birthYear: 1961,
    birthMonthEnd: 8,
    legalAgeYears2023: 62,
    legalAgeMonths2023: 0,
    quartersRequired2023: 168,
    legalAgeYears2026: 62,
    legalAgeMonths2026: 0,
    quartersRequired2026: 168,
  },
  {
    birthYear: 1961,
    birthMonthStart: 9,
    legalAgeYears2023: 62,
    legalAgeMonths2023: 3,
    quartersRequired2023: 169,
    legalAgeYears2026: 62,
    legalAgeMonths2026: 3,
    quartersRequired2026: 169,
  },
  {
    birthYear: 1962,
    legalAgeYears2023: 62,
    legalAgeMonths2023: 6,
    quartersRequired2023: 169,
    legalAgeYears2026: 62,
    legalAgeMonths2026: 6,
    quartersRequired2026: 169,
  },
  {
    birthYear: 1963,
    legalAgeYears2023: 62,
    legalAgeMonths2023: 9,
    quartersRequired2023: 170,
    legalAgeYears2026: 62,
    legalAgeMonths2026: 9,
    quartersRequired2026: 170,
  },
  {
    birthYear: 1964,
    legalAgeYears2023: 63,
    legalAgeMonths2023: 0,
    quartersRequired2023: 171,
    legalAgeYears2026: 62,
    legalAgeMonths2026: 9,
    quartersRequired2026: 170,
  },
  {
    birthYear: 1965,
    birthMonthStart: 1,
    birthMonthEnd: 3,
    legalAgeYears2023: 63,
    legalAgeMonths2023: 3,
    quartersRequired2023: 172,
    legalAgeYears2026: 62,
    legalAgeMonths2026: 9,
    quartersRequired2026: 170,
  },
  {
    birthYear: 1965,
    birthMonthStart: 4,
    birthMonthEnd: 12,
    legalAgeYears2023: 63,
    legalAgeMonths2023: 3,
    quartersRequired2023: 172,
    legalAgeYears2026: 63,
    legalAgeMonths2026: 0,
    quartersRequired2026: 171,
  },
  {
    birthYear: 1966,
    legalAgeYears2023: 63,
    legalAgeMonths2023: 6,
    quartersRequired2023: 172,
    legalAgeYears2026: 63,
    legalAgeMonths2026: 3,
    quartersRequired2026: 172,
  },
  {
    birthYear: 1967,
    legalAgeYears2023: 63,
    legalAgeMonths2023: 9,
    quartersRequired2023: 172,
    legalAgeYears2026: 63,
    legalAgeMonths2026: 6,
    quartersRequired2026: 172,
  },
  {
    birthYear: 1968,
    legalAgeYears2023: 64,
    legalAgeMonths2023: 0,
    quartersRequired2023: 172,
    legalAgeYears2026: 63,
    legalAgeMonths2026: 9,
    quartersRequired2026: 172,
  },
  {
    birthYear: 1969,
    legalAgeYears2023: 64,
    legalAgeMonths2023: 0,
    quartersRequired2023: 172,
    legalAgeYears2026: 64,
    legalAgeMonths2026: 0,
    quartersRequired2026: 172,
  },
];

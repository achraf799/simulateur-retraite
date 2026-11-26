import { CareerYear, UserProfile } from '../types/retirement';
import { getPassForYear, FRF_TO_EUR_RATE } from './passHistory';
import { getCnavCoeff } from './cnavCoefficients';

/**
 * Création d'une ligne de carrière avec calcul automatique du PASS,
 * du salaire retenu, du coefficient CNAV et du salaire revalorisé.
 */
function createCareerYear(
  year: number,
  currency: 'EUR' | 'FRF',
  grossIncome: number,
  regime: 'CNAV' | 'MSA',
  validatedQuarters: number,
  contributedQuarters: number,
  agircPoints: number,
  eventType: 'Activité' | 'Maladie/AT' | 'Maternité' | 'Chômage' | 'AVPF',
  liquidationYear = 2025
): CareerYear {
  const grossIncomeEur =
    currency === 'FRF' ? Number((grossIncome / FRF_TO_EUR_RATE).toFixed(2)) : grossIncome;
  const passEur = getPassForYear(year);
  const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
  const cnavCoeff = getCnavCoeff(year, liquidationYear);
  const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

  return {
    year,
    currency,
    grossIncome,
    grossIncomeEur,
    passEur,
    retainedSalaryEur,
    cnavCoeff,
    revaluedSalaryEur,
    regime,
    validatedQuarters,
    contributedQuarters,
    agircPoints,
    eventType,
  };
}

/**
 * SCÉNARIO 1 : CAS SAKURA (DÉFAUT)
 * Femme née le 01/01/1963, 3 enfants, départ 01/01/2025.
 */
export const SAKURA_PROFILE: UserProfile = {
  nir: '2630175001234',
  birthDate: '1963-01-01',
  sex: 'F',
  childrenCount: 3,
  motherBonusQuarters: true,
  desiredDepartureDate: '2025-01-01',
  lastGrossMonthlySalary: 4500,
  cerEnabled: true,
  cerResumptionDate: '2025-02-01',
  cerFormerEmployer: true,
  cerNewGrossMonthlySalary: 4500,
  careerMode: 'detailed',
  specialCircumstances: {
    earlyCareer: true,
    earlyQuartersCount: 13,
    longCareerEstimate: { departureDate: '2025-01-01', minimumQuarters: 171, maximumQuarters: 173 },
    careerInterruptions: true,
    sicknessQuarters: 0,
    maternityQuarters: 0,
    unemploymentQuarters: 0,
    avpfQuarters: 8,
    automaticFullRate: false,
    fullRateReason: 'none',
    polycotisantMsa: true,
  },
  expressData: {
    totalQuarters: 177,
    contributedQuarters: 171,
    estimatedSam: 40910.48,
    agircPoints: 9274.16,
  },
};

// Points Agirc-Arrco du relevé Sakura, pages 3 et 4, annotation 2024 comprise.
export const SAKURA_CAREER: CareerYear[] = [
  // 1979: 2 100 FRF (0 trim)
  createCareerYear(1979, 'FRF', 2100, 'CNAV', 0, 0, 3.87, 'Activité'),
  // 1980: 2 650 FRF (1 trim cotisé)
  createCareerYear(1980, 'FRF', 2650, 'CNAV', 1, 1, 4.46, 'Activité'),
  // 1981: 1 080 + 12 438 FRF = 13 518 FRF (4 trim MSA+CNAV)
  createCareerYear(1981, 'FRF', 13518, 'CNAV', 4, 4, 39.74, 'Activité'),
  // 1982 : 3 trimestres d’activité et 1 trimestre de chômage à confirmer pour la carrière longue.
  createCareerYear(1982, 'FRF', 14053, 'MSA', 4, 3, 37.36, 'Activité'),
  // 1983-1995: 4 trim/an
  createCareerYear(1983, 'FRF', 56445, 'CNAV', 4, 4, 130.18, 'Activité'),
  createCareerYear(1984, 'FRF', 66457, 'CNAV', 4, 4, 143.36, 'Activité'),
  createCareerYear(1985, 'FRF', 72394, 'CNAV', 4, 4, 146.46, 'Activité'),
  createCareerYear(1986, 'FRF', 76768, 'CNAV', 4, 4, 148.78, 'Activité'),
  createCareerYear(1987, 'FRF', 82355, 'CNAV', 4, 4, 152.66, 'Activité'),
  createCareerYear(1988, 'FRF', 57498, 'CNAV', 4, 4, 152.68, 'Activité'),
  createCareerYear(1989, 'FRF', 98648, 'CNAV', 4, 4, 168.16, 'Activité'),
  createCareerYear(1990, 'FRF', 104024, 'CNAV', 4, 4, 168.94, 'Activité'),
  createCareerYear(1991, 'FRF', 68973, 'CNAV', 4, 4, 168.94, 'Activité'),
  createCareerYear(1992, 'FRF', 98443, 'CNAV', 4, 4, 147.24, 'Activité'),
  createCareerYear(1993, 'FRF', 101136, 'CNAV', 4, 4, 146.46, 'Activité'),
  createCareerYear(1994, 'FRF', 88579, 'CNAV', 4, 4, 147.24, 'Activité'),
  // 1995 : 3 trimestres d’activité et 1 trimestre assimilé à confirmer pour la carrière longue.
  createCareerYear(1995, 'FRF', 24633, 'CNAV', 4, 3, 34.10, 'Activité'),
  // 1996-1997 : 8 trimestres validés au titre de l’AVPF, dont 4 retenus pour la carrière longue.
  createCareerYear(1996, 'FRF', 37498, 'CNAV', 4, 0, 0, 'AVPF'),
  createCareerYear(1997, 'FRF', 76881 + 1729, 'CNAV', 4, 0, 1.93, 'Activité'),
  // 1998-2001
  createCareerYear(1998, 'FRF', 79964 + 70441, 'CNAV', 4, 4, 82.92, 'Activité'),
  createCareerYear(1999, 'FRF', 40783 + 73638, 'CNAV', 4, 4, 81.99, 'Activité'),
  createCareerYear(2000, 'FRF', 76389, 'CNAV', 4, 4, 80.77, 'Activité'),
  createCareerYear(2001, 'FRF', 86975, 'CNAV', 4, 4, 90.60, 'Activité'),
  // 2002-2024 en EUR
  createCareerYear(2002, 'EUR', 19081, 'CNAV', 4, 4, 128.33, 'Activité'),
  createCareerYear(2003, 'EUR', 19978, 'CNAV', 4, 4, 132.25, 'Activité'),
  createCareerYear(2004, 'EUR', 21026, 'CNAV', 4, 4, 136.05, 'Activité'),
  createCareerYear(2005, 'EUR', 22626, 'CNAV', 4, 4, 179.53, 'Activité'),
  createCareerYear(2006, 'EUR', 26885, 'CNAV', 4, 4, 204.32, 'Activité'),
  createCareerYear(2007, 'EUR', 32683, 'CNAV', 4, 4, 220.70, 'Activité'),
  createCareerYear(2008, 'EUR', 37452, 'CNAV', 4, 4, 238.91, 'Activité'),
  createCareerYear(2009, 'EUR', 41594, 'CNAV', 4, 4, 276.13, 'Activité'),
  createCareerYear(2010, 'EUR', 42599, 'CNAV', 4, 4, 282.01, 'Activité'),
  createCareerYear(2011, 'EUR', 43732, 'CNAV', 4, 4, 284.27, 'Activité'),
  createCareerYear(2012, 'EUR', 44644, 'CNAV', 4, 4, 282.34, 'Activité'),
  createCareerYear(2013, 'EUR', 45466, 'CNAV', 4, 4, 284.28, 'Activité'),
  createCareerYear(2014, 'EUR', 45461 + 4397, 'CNAV', 4, 4, 330.41, 'Activité'),
  createCareerYear(2015, 'EUR', 49593, 'CNAV', 4, 4, 325.19, 'Activité'),
  createCareerYear(2016, 'EUR', 59973, 'CNAV', 4, 4, 422.89, 'Activité'),
  createCareerYear(2017, 'EUR', 59961, 'CNAV', 4, 4, 405.48, 'Activité'),
  createCareerYear(2018, 'EUR', 59550, 'CNAV', 4, 4, 386.02, 'Activité'),
  createCareerYear(2019, 'EUR', 63714, 'CNAV', 4, 4, 422.37, 'Activité'),
  createCareerYear(2020, 'EUR', 73174, 'CNAV', 4, 4, 503.38, 'Activité'),
  createCareerYear(2021, 'EUR', 62215, 'CNAV', 4, 4, 396.30, 'Activité'),
  createCareerYear(2022, 'EUR', 61593, 'CNAV', 4, 4, 389.48, 'Activité'),
  createCareerYear(2023, 'EUR', 64555, 'CNAV', 4, 4, 374.98, 'Activité'),
  // 2024: 54 000 € (4 500 €/mois), 389.70 points Agirc-Arrco (total 9 274.16 points)
  createCareerYear(2024, 'EUR', 54000, 'CNAV', 4, 4, 389.70, 'Activité'),
];

/**
 * SCÉNARIO 2 : CAS TEST LFSS 2026
 * Femme née le 15/03/1965, 2 enfants, départ le 01/10/2026.
 */
export const LFSS_2026_PROFILE: UserProfile = {
  nir: '2650375001234',
  samEligibleChildren: 2,
  birthDate: '1965-03-15',
  sex: 'F',
  childrenCount: 2,
  motherBonusQuarters: true,
  desiredDepartureDate: '2026-10-01',
  lastGrossMonthlySalary: 3800,
  cerEnabled: false,
  cerResumptionDate: '2026-11-01',
  cerFormerEmployer: false,
  cerNewGrossMonthlySalary: 0,
  careerMode: 'detailed',
  specialCircumstances: {
    earlyCareer: false,
    earlyQuartersCount: 0,
    careerInterruptions: false,
    sicknessQuarters: 0,
    maternityQuarters: 0,
    unemploymentQuarters: 0,
    avpfQuarters: 0,
    automaticFullRate: false,
    fullRateReason: 'none',
    polycotisantMsa: false,
  },
  expressData: {
    totalQuarters: 168,
    contributedQuarters: 168,
    estimatedSam: 38000,
    agircPoints: 7200,
  },
};

export const LFSS_2026_CAREER: CareerYear[] = [];
for (let y = 1984; y <= 2025; y++) {
  const isEuro = y >= 2002;
  const baseSalary = isEuro ? 24000 + (y - 2002) * 800 : 80000 + (y - 1984) * 3000;
  LFSS_2026_CAREER.push(
    createCareerYear(
      y,
      isEuro ? 'EUR' : 'FRF',
      baseSalary,
      'CNAV',
      4,
      4,
      isEuro ? 180 + (y - 2002) * 4 : 120,
      'Activité',
      2026
    )
  );
}

/**
 * SCÉNARIO 3 : PROFIL VIERGE
 */
export const BLANK_PROFILE: UserProfile = {
  nir: '',
  birthDate: '1965-01-01',
  sex: 'F',
  childrenCount: 0,
  motherBonusQuarters: false,
  desiredDepartureDate: '2027-01-01',
  lastGrossMonthlySalary: 3000,
  cerEnabled: false,
  cerResumptionDate: '2027-02-01',
  cerFormerEmployer: false,
  cerNewGrossMonthlySalary: 0,
  careerMode: 'express',
  specialCircumstances: {
    earlyCareer: false,
    earlyQuartersCount: 0,
    careerInterruptions: false,
    sicknessQuarters: 0,
    maternityQuarters: 0,
    unemploymentQuarters: 0,
    avpfQuarters: 0,
    automaticFullRate: false,
    fullRateReason: 'none',
    polycotisantMsa: false,
  },
  expressData: {
    totalQuarters: 172,
    contributedQuarters: 172,
    estimatedSam: 30000,
    agircPoints: 6000,
  },
};

export const BLANK_CAREER: CareerYear[] = [];

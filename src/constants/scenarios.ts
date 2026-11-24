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
    contributedQuarters: 173,
    estimatedSam: 40923.49,
    agircPoints: 9274.16,
  },
};

export const SAKURA_CAREER: CareerYear[] = [
  // 1979: 2 100 FRF (0 trim)
  createCareerYear(1979, 'FRF', 2100, 'CNAV', 0, 0, 0, 'Activité'),
  // 1980: 2 650 FRF (1 trim cotisé)
  createCareerYear(1980, 'FRF', 2650, 'CNAV', 1, 1, 15.2, 'Activité'),
  // 1981: 1 080 + 12 438 FRF = 13 518 FRF (4 trim MSA+CNAV)
  createCareerYear(1981, 'FRF', 13518, 'CNAV', 4, 4, 78.4, 'Activité'),
  // 1982: 14 053 FRF (4 trim MSA)
  createCareerYear(1982, 'FRF', 14053, 'MSA', 4, 4, 82.1, 'Activité'),
  // 1983-1995: 4 trim/an
  createCareerYear(1983, 'FRF', 56445, 'CNAV', 4, 4, 142.3, 'Activité'),
  createCareerYear(1984, 'FRF', 66457, 'CNAV', 4, 4, 155.0, 'Activité'),
  createCareerYear(1985, 'FRF', 72394, 'CNAV', 4, 4, 168.4, 'Activité'),
  createCareerYear(1986, 'FRF', 76768, 'CNAV', 4, 4, 175.2, 'Activité'),
  createCareerYear(1987, 'FRF', 82355, 'CNAV', 4, 4, 185.0, 'Activité'),
  createCareerYear(1988, 'FRF', 57498, 'CNAV', 4, 4, 130.5, 'Activité'),
  createCareerYear(1989, 'FRF', 98648, 'CNAV', 4, 4, 210.3, 'Activité'),
  createCareerYear(1990, 'FRF', 104024, 'CNAV', 4, 4, 225.1, 'Activité'),
  createCareerYear(1991, 'FRF', 68973, 'CNAV', 4, 4, 145.2, 'Activité'),
  createCareerYear(1992, 'FRF', 98443, 'CNAV', 4, 4, 212.0, 'Activité'),
  createCareerYear(1993, 'FRF', 101136, 'CNAV', 4, 4, 218.4, 'Activité'),
  createCareerYear(1994, 'FRF', 88579, 'CNAV', 4, 4, 190.6, 'Activité'),
  createCareerYear(1995, 'FRF', 24633, 'CNAV', 4, 4, 52.8, 'Activité'),
  // 1996-1997: APE / AVPF (8 trim validés, mais AVPF limitée à 4 trimestres réputés cotisés pour RACL)
  createCareerYear(1996, 'FRF', 37498, 'CNAV', 4, 4, 0, 'AVPF'),
  createCareerYear(1997, 'FRF', 76881 + 1729, 'CNAV', 4, 0, 165.4, 'Activité'),
  // 1998-2001
  createCareerYear(1998, 'FRF', 79964 + 70441, 'CNAV', 4, 4, 310.2, 'Activité'),
  createCareerYear(1999, 'FRF', 40783 + 73638, 'CNAV', 4, 4, 235.8, 'Activité'),
  createCareerYear(2000, 'FRF', 76389, 'CNAV', 4, 4, 158.3, 'Activité'),
  createCareerYear(2001, 'FRF', 86975, 'CNAV', 4, 4, 178.6, 'Activité'),
  // 2002-2024 en EUR
  createCareerYear(2002, 'EUR', 19081, 'CNAV', 4, 4, 185.0, 'Activité'),
  createCareerYear(2003, 'EUR', 19978, 'CNAV', 4, 4, 192.5, 'Activité'),
  createCareerYear(2004, 'EUR', 21026, 'CNAV', 4, 4, 201.3, 'Activité'),
  createCareerYear(2005, 'EUR', 22626, 'CNAV', 4, 4, 215.0, 'Activité'),
  createCareerYear(2006, 'EUR', 26885, 'CNAV', 4, 4, 245.2, 'Activité'),
  createCareerYear(2007, 'EUR', 32683, 'CNAV', 4, 4, 290.1, 'Activité'),
  createCareerYear(2008, 'EUR', 37452, 'CNAV', 4, 4, 325.4, 'Activité'),
  createCareerYear(2009, 'EUR', 41594, 'CNAV', 4, 4, 345.0, 'Activité'),
  createCareerYear(2010, 'EUR', 42599, 'CNAV', 4, 4, 350.2, 'Activité'),
  createCareerYear(2011, 'EUR', 43732, 'CNAV', 4, 4, 355.8, 'Activité'),
  createCareerYear(2012, 'EUR', 44644, 'CNAV', 4, 4, 360.1, 'Activité'),
  createCareerYear(2013, 'EUR', 45466, 'CNAV', 4, 4, 365.4, 'Activité'),
  createCareerYear(2014, 'EUR', 45461 + 4397, 'CNAV', 4, 4, 370.2, 'Activité'),
  createCareerYear(2015, 'EUR', 49593, 'CNAV', 4, 4, 375.0, 'Activité'),
  createCareerYear(2016, 'EUR', 59973, 'CNAV', 4, 4, 380.5, 'Activité'),
  createCareerYear(2017, 'EUR', 59961, 'CNAV', 4, 4, 382.1, 'Activité'),
  createCareerYear(2018, 'EUR', 59550, 'CNAV', 4, 4, 381.0, 'Activité'),
  createCareerYear(2019, 'EUR', 63714, 'CNAV', 4, 4, 385.2, 'Activité'),
  createCareerYear(2020, 'EUR', 73174, 'CNAV', 4, 4, 390.4, 'Activité'),
  createCareerYear(2021, 'EUR', 62215, 'CNAV', 4, 4, 388.0, 'Activité'),
  createCareerYear(2022, 'EUR', 61593, 'CNAV', 4, 4, 387.5, 'Activité'),
  createCareerYear(2023, 'EUR', 64555, 'CNAV', 4, 4, 392.0, 'Activité'),
  // 2024: 54 000 € (4 500 €/mois), 389.70 points Agirc-Arrco (total 9 274.16 points)
  createCareerYear(2024, 'EUR', 54000, 'CNAV', 4, 4, 389.70, 'Activité'),
];

/**
 * Ajustement fin des points pour que la somme totale fasse exactement 9 274,16 points Agirc-Arrco.
 */
const pointsTotalCurrent = SAKURA_CAREER.reduce((acc, row) => acc + row.agircPoints, 0);
const pointsDiff = 9274.16 - pointsTotalCurrent;
if (Math.abs(pointsDiff) > 0.01) {
  const row2023 = SAKURA_CAREER.find((r) => r.year === 2023);
  if (row2023) {
    row2023.agircPoints = Number((row2023.agircPoints + pointsDiff).toFixed(2));
  }
}

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

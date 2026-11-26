export type Currency = 'EUR' | 'FRF';

export type Regime = 'CNAV' | 'MSA';

export type EventType = 'Activité' | 'Maladie/AT' | 'Maternité' | 'Chômage' | 'AVPF';

export type SamIncomeKind = 'salary' | 'excluded' | 'buyback';

export interface CareerYear {
  year: number;
  currency: Currency;
  grossIncome: number; // in entered currency (FRF or EUR)
  grossIncomeEur: number; // converted to EUR
  passEur: number;
  retainedSalaryEur: number; // MIN(grossIncomeEur, passEur)
  cnavCoeff: number;
  revaluedSalaryEur: number; // retainedSalaryEur * cnavCoeff
  regime: Regime;
  validatedQuarters: number; // 0 to 4
  contributedQuarters: number; // 0 to 4 (cotisés ou réputés cotisés pour carrière longue)
  agircPoints: number;
  eventType: EventType;
  samIncomeKind?: SamIncomeKind;
  isTopYear?: boolean; // top N best years for SAM
}

export type EarlyCareerAge = 16 | 18 | 20 | 21;

export interface LongCareerResult {
  status: 'eligible' | 'tooEarly' | 'missingQuarters' | 'unknown' | 'notEligible' | 'regularDeparture';
  earlyQuarters: Partial<Record<EarlyCareerAge, number>>;
  requiredEarlyQuarters: number;
  startAge?: EarlyCareerAge;
  minimumAgeMonths?: number;
  earliestAgeDate?: string;
  contributedQuarters?: number;
  requiredQuarters?: number;
  safeguardToVerify?: boolean;
  details: string;
}

export interface SpecialCircumstances {
  earlyCareer: boolean; // Début précoce avant 20 ans
  earlyQuartersCount: number; // Nombre de trimestres avant 20 ans (ex: 13 pour Sakura)
  earlyCareerQuarters?: Partial<Record<EarlyCareerAge, number>>;
  longCareerConfirmedQuarters?: number;
  careerInterruptions: boolean; // Maladie, maternité, chômage, AVPF
  sicknessQuarters: number;
  maternityQuarters: number;
  unemploymentQuarters: number;
  avpfQuarters: number;
  automaticFullRate: boolean; // Inaptitude, handicap, invalidité (taux plein à 62 ans)
  fullRateReason: 'inaptitude' | 'handicap' | 'invalidite' | 'none';
  polycotisantMsa: boolean; // CNAV Salarié + MSA Salarié (LURA)
}

export interface ExpressCareerData {
  totalQuarters: number;
  contributedQuarters: number;
  estimatedSam: number;
  agircPoints: number;
}

export interface UserProfile {
  nir: string;
  birthDate: string; // YYYY-MM-DD
  sex: 'M' | 'F';
  childrenCount: number;
  samEligibleChildren?: 0 | 1 | 2; // 2 = deux enfants ou plus
  motherBonusQuarters: boolean; // 8 trimestres par enfant pour la mère (Art. L. 351-4 CSS)
  desiredDepartureDate: string; // YYYY-MM-DD
  lastGrossMonthlySalary: number; // EUR
  cerEnabled: boolean;
  cerResumptionDate: string; // YYYY-MM-DD
  cerFormerEmployer: boolean;
  cerNewGrossMonthlySalary: number; // EUR
  cerFirstBasePensionDate?: string;
  cerSeparateComplementaryPension?: boolean;
  cerAllPensionsLiquidated?: boolean;
  cerActivityEndDate?: string;
  cerIncomeByPeriod?: Partial<Record<CerReductionBand, number>>;
  cerPriorThreeMonthsAverage?: number;
  cerLastRevaluedSalary?: number;
  cerLastTenYearsAverage?: number;
  careerMode?: 'detailed' | 'express';
  expressData?: ExpressCareerData;
  specialCircumstances?: SpecialCircumstances;
  allPensionsLiquidated?: boolean; // Toutes les pensions personnelles liquidées (condition MICO)
  otherPensionsMonthly?: number; // Autres pensions personnelles mensuelles brutes (plafond MICO)
}

export type CerReductionBand = 'beforeLegalAge' | 'beforeFullRateAge';

export interface CerReductionPeriod {
  band: CerReductionBand;
  startDate: string;
  endDate: string;
  annualThreshold?: number;
  income?: number;
  reduction?: number;
}

export interface CerAnalysisResult {
  regime: 'before2027' | 'from2027';
  unavailable?: boolean;
  fullCumulStartDate?: string;
  baseSuspensionStartDate?: string;
  paidBaseMonthly?: number;
  paidComplementaryMonthly?: number;
  periods?: CerReductionPeriod[];
  annualReduction?: number;
  status: 'PLAFONNE' | 'INTEGRAL';
  alertLevel: 'RED' | 'YELLOW' | 'GREEN';
  alertMessage: string;
  suspensionApplies: boolean;
  waitingMonthsRemaining: number;
  waitingPeriodEndDate: string;
  ceilingAmount: number;
  totalCerRevenue?: number;
  exceedsCeiling: boolean;
  ecretementAmount: number;
  effectiveMonthlyGrossPension?: number;
  generatesNewRights: boolean;
  newRightsDetails: string;
  recommendations: Array<{
    title: string;
    description: string;
    badge: string;
    impact: string;
  }>;
}

export interface SamYear {
  year: number;
  salaryEur: number;
  ceilingEur?: number;
  retainedSalaryEur: number;
  coefficient: number;
  revaluedSalaryEur: number;
  status: 'selected' | 'outsideTopYears' | 'beforeCareer' | 'fromLiquidation' | 'buyback'
    | 'noPensionableIncome' | 'belowThreshold' | 'unconfirmedThreshold';
}

export interface SamAnalysis {
  source: 'career' | 'express' | 'unavailable';
  amount: number;
  yearLimit: number;
  parentAdjustmentPending: boolean;
  revaluationYear?: number;
  usesProjectedRevaluation?: boolean;
  projectedPassYears?: number[];
  years: SamYear[];
  topYears: number[];
}

export interface CalculationResult {
  ageAtDeparture: {
    years: number;
    months: number;
    totalMonths: number;
    formatted: string;
  };
  legalAge: {
    years: number;
    months: number;
    totalMonths: number;
    formatted: string;
  };
  requiredQuarters: number;
  totalValidatedQuarters: number;
  totalContributedQuarters: number;
  longCareer: LongCareerResult;
  isCarriereLongue: boolean;
  carriereLongueDetails: string;
  eligibilityStatus: 'eligible_taux_plein' | 'eligible_decote' | 'ineligible';
  appliedRule: 'Réforme 2023' | 'Suspension LFSS 2026';
  samYearsCount: number; // 25, 24 ou 23
  sam: number;
  samAnalysis: SamAnalysis;
  topYears: number[];
  liquidationRate: number; // 0.50 (taux plein) ou décoté
  decoteQuarters: number;
  surcoteQuarters: number;
  surcoteRate: number;
  proratisation: number; // MIN(validatedQuarters, requiredQuarters) / requiredQuarters
  // Retraite de base
  basePensionMonthlyGrossBeforeMico: number;
  micoApplied: boolean;
  micoComplementMonthly: number;
  basePensionMonthlyGrossBeforeBonus: number;
  baseChildBonusMonthly: number;
  basePensionMonthlyGross: number;
  basePensionAnnualGross: number;
  basePensionMonthlyNet: number;
  // Agirc-Arrco
  agircTotalPoints: number;
  agircPointValue: number;
  agircAbattementCoeff: number;
  agircMonthlyGrossBeforeBonus: number;
  agircChildBonusMonthly: number;
  agircChildBonusCapped: boolean;
  agircMonthlyGross: number;
  agircMonthlyNet: number;
  // Total
  totalMonthlyGross: number;
  totalMonthlyNet: number;
  grossReplacementRate: number; // totalMonthlyGross / lastGrossMonthlySalary
  // CER
  cerAnalysis: CerAnalysisResult;
}

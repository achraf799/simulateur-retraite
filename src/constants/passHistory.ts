export const FRF_TO_EUR_RATE = 6.55957;
export const LAST_CONFIRMED_PASS_YEAR = 2026;
export const LAST_AVAILABLE_PASS_YEAR = 2027;

export interface PassRecord {
  year: number;
  passEur: number;
  passFrf?: number;
  pmssEur: number; // Moyenne mensuelle pour les anciens plafonds modifiés en cours d’année.
}

// Assurance retraite, revenus plafonds annuels :
// https://www.lassuranceretraite.fr/sarn/jsp/acsarEstPopupSalRG.jsp
const ANNUAL_LIMITS = [
  // 1947–1959 : anciens francs.
  163500, 224000, 258000, 264000, 345000, 444000, 456000, 456000, 474000,
  528000, 528000, 600000, 660000,
  // 1960–1979 : francs.
  6840, 8100, 9600, 10440, 11400, 12240, 12960, 13680, 14400, 16320,
  18000, 19800, 21960, 24480, 27840, 33000, 37920, 43320, 48000, 53640,
  // 1980–2001 : francs.
  60120, 68760, 82020, 91680, 99600, 106740, 112200, 116820, 120360, 125280,
  131040, 137760, 144120, 149820, 153120, 155940, 161220, 164640, 169080, 173640,
  176400, 179400,
  // 2002–2026 : euros.
  28224, 29184, 29712, 30192, 31068, 32184, 33276, 34308, 34620, 35352,
  36372, 37032, 37548, 38040, 38616, 39228, 39732, 40524, 41136, 41136,
  41136, 43992, 46368, 47100, 48060,
  // 2027 : montant annoncé par le BOSS, arrêté à confirmer au 24 novembre 2026.
  48900,
];

const FIRST_PASS_YEAR = 1947;

export const PASS_HISTORY: Record<number, PassRecord> = Object.fromEntries(
  ANNUAL_LIMITS.map((limit, index) => {
    const year = FIRST_PASS_YEAR + index;
    const passFrf = year < 1960 ? limit / 100 : year < 2002 ? limit : undefined;
    const exactEur = passFrf === undefined ? limit : passFrf / FRF_TO_EUR_RATE;
    return [year, {
      year,
      passEur: Number(exactEur.toFixed(2)),
      passFrf,
      pmssEur: Number((exactEur / 12).toFixed(2)),
    }];
  }),
);

export function getPassForYear(year: number): number {
  if (PASS_HISTORY[year]) return PASS_HISTORY[year].passEur;
  return PASS_HISTORY[year < FIRST_PASS_YEAR ? FIRST_PASS_YEAR : LAST_AVAILABLE_PASS_YEAR].passEur;
}

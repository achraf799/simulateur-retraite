/**
 * Table historique du Plafond Annuel de la Sécurité Sociale (PASS) de 1979 à 2026.
 * Les valeurs de 1979 à 2001 sont converties à partir des Francs (1 EUR = 6,55957 FRF).
 * Source : Législation Sécurité Sociale / Arrêtés interministériels annuels.
 */

export interface PassRecord {
  year: number;
  passEur: number;
  passFrf?: number;
  pmssEur: number; // Plafond mensuel
}

export const PASS_HISTORY: Record<number, PassRecord> = {
  1979: { year: 1979, passEur: 8104.19, passFrf: 53160, pmssEur: 675.35 },
  1980: { year: 1980, passEur: 9476.23, passFrf: 62160, pmssEur: 789.69 },
  1981: { year: 1981, passEur: 10958.04, passFrf: 71880, pmssEur: 913.17 },
  1982: { year: 1982, passEur: 12586.19, passFrf: 82560, pmssEur: 1048.85 },
  1983: { year: 1983, passEur: 13976.53, passFrf: 91680, pmssEur: 1164.71 },
  1984: { year: 1984, passEur: 15074.16, passFrf: 98880, pmssEur: 1256.18 },
  1985: { year: 1985, passEur: 16135.20, passFrf: 105840, pmssEur: 1344.60 },
  1986: { year: 1986, passEur: 17013.31, passFrf: 111600, pmssEur: 1417.78 },
  1987: { year: 1987, passEur: 17818.24, passFrf: 116880, pmssEur: 1484.85 },
  1988: { year: 1988, passEur: 18531.70, passFrf: 121560, pmssEur: 1544.31 },
  1989: { year: 1989, passEur: 19226.87, passFrf: 126120, pmssEur: 1602.24 },
  1990: { year: 1990, passEur: 20086.68, passFrf: 131760, pmssEur: 1673.89 },
  1991: { year: 1991, passEur: 21001.38, passFrf: 137760, pmssEur: 1750.12 },
  1992: { year: 1992, passEur: 21970.95, passFrf: 144120, pmssEur: 1830.91 },
  1993: { year: 1993, passEur: 22840.00, passFrf: 149820, pmssEur: 1903.33 },
  1994: { year: 1994, passEur: 23196.64, passFrf: 152160, pmssEur: 1933.05 },
  1995: { year: 1995, passEur: 23653.99, passFrf: 155160, pmssEur: 1971.17 },
  1996: { year: 1996, passEur: 24166.22, passFrf: 158520, pmssEur: 2013.85 },
  1997: { year: 1997, passEur: 25099.11, passFrf: 164640, pmssEur: 2091.59 },
  1998: { year: 1998, passEur: 25776.08, passFrf: 169080, pmssEur: 2148.01 },
  1999: { year: 1999, passEur: 26471.25, passFrf: 173640, pmssEur: 2205.94 },
  2000: { year: 2000, passEur: 26892.01, passFrf: 176400, pmssEur: 2241.00 },
  2001: { year: 2001, passEur: 27349.36, passFrf: 179400, pmssEur: 2279.11 },
  2002: { year: 2002, passEur: 28224, pmssEur: 2352 },
  2003: { year: 2003, passEur: 29184, pmssEur: 2432 },
  2004: { year: 2004, passEur: 29712, pmssEur: 2476 },
  2005: { year: 2005, passEur: 30192, pmssEur: 2516 },
  2006: { year: 2006, passEur: 31068, pmssEur: 2589 },
  2007: { year: 2007, passEur: 32184, pmssEur: 2682 },
  2008: { year: 2008, passEur: 33276, pmssEur: 2773 },
  2009: { year: 2009, passEur: 34308, pmssEur: 2859 },
  2010: { year: 2010, passEur: 34620, pmssEur: 2885 },
  2011: { year: 2011, passEur: 35352, pmssEur: 2946 },
  2012: { year: 2012, passEur: 36372, pmssEur: 3031 },
  2013: { year: 2013, passEur: 37032, pmssEur: 3086 },
  2014: { year: 2014, passEur: 37548, pmssEur: 3129 },
  2015: { year: 2015, passEur: 38040, pmssEur: 3170 },
  2016: { year: 2016, passEur: 38616, pmssEur: 3218 },
  2017: { year: 2017, passEur: 39228, pmssEur: 3269 },
  2018: { year: 2018, passEur: 39732, pmssEur: 3311 },
  2019: { year: 2019, passEur: 40524, pmssEur: 3377 },
  2020: { year: 2020, passEur: 41136, pmssEur: 3428 },
  2021: { year: 2021, passEur: 41136, pmssEur: 3428 },
  2022: { year: 2022, passEur: 41136, pmssEur: 3428 },
  2023: { year: 2023, passEur: 43992, pmssEur: 3666 },
  2024: { year: 2024, passEur: 46368, pmssEur: 3864 },
  2025: { year: 2025, passEur: 47100, pmssEur: 3925 },
  2026: { year: 2026, passEur: 48060, pmssEur: 4005 },
};

export const FRF_TO_EUR_RATE = 6.55957;

export function getPassForYear(year: number): number {
  if (PASS_HISTORY[year]) {
    return PASS_HISTORY[year].passEur;
  }
  if (year < 1979) return PASS_HISTORY[1979].passEur;
  return PASS_HISTORY[2026].passEur;
}

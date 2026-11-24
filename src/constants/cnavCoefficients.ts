/**
 * Coefficients officiels de revalorisation des salaires et cotisations CNAV.
 * Utilisés pour actualiser les salaires portés au compte et calculer le Salaire Annuel Moyen (SAM)
 * des 25 (ou 23/24) meilleures années.
 * Source : Circulaires CNAV de revalorisation de fin d'année.
 */

export const CNAV_COEFFICIENTS_2025: Record<number, number> = {
  1979: 3.267,
  1980: 2.898,
  1981: 2.557,
  1982: 2.284,
  1983: 2.154,
  1984: 2.105,
  1985: 2.017,
  1986: 1.972,
  1987: 1.899,
  1988: 1.856,
  1989: 1.790,
  1990: 1.741,
  1991: 1.689,
  1992: 1.659,
  1993: 1.659,
  1994: 1.630,
  1995: 1.612,
  1996: 1.572,
  1997: 1.555,
  1998: 1.538,
  1999: 1.520,
  2000: 1.468,
  2001: 1.444,
  2002: 1.413,
  2003: 1.390,
  2004: 1.369,
  2005: 1.343,
  2006: 1.319,
  2007: 1.298,
  2008: 1.286,
  2009: 1.268,
  2010: 1.264,
  2011: 1.238,
  2012: 1.212,
  2013: 1.197,
  2014: 1.181,
  2015: 1.180,
  2016: 1.180,
  2017: 1.178,
  2018: 1.164,
  2019: 1.150,
  2020: 1.144,
  2021: 1.139,
  2022: 1.127,
  2023: 1.053,
  2024: 1.000,
  2025: 1.000,
  2026: 1.000,
};

export const CNAV_COEFFICIENTS_2026: Record<number, number> = {
  ...Object.fromEntries(
    Object.entries(CNAV_COEFFICIENTS_2025).map(([year, coeff]) => {
      const y = Number(year);
      if (y >= 2025) return [y, 1.000];
      return [y, Number((coeff * 1.018).toFixed(3))];
    })
  ),
  2024: 1.018,
  2025: 1.000,
  2026: 1.000,
};

export function getCnavCoeff(year: number, liquidationYear = 2025): number {
  const table = liquidationYear >= 2026 ? CNAV_COEFFICIENTS_2026 : CNAV_COEFFICIENTS_2025;
  if (table[year] !== undefined) return table[year];
  if (year < 1979) return table[1979];
  return 1.000;
}

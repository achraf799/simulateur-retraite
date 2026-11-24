import { FRF_TO_EUR_RATE } from './passHistory';

// Assurance retraite, revenu minimum métropolitain pour valider un trimestre.
// https://www.lassuranceretraite.fr/sarn/jsp/acsarEstPopupTrimVal.jsp
const OLD_FRANCS: Partial<Record<number, number>> = {
  1948: 1800, 1949: 8500, 1950: 11250, 1951: 13000, 1952: 14950, 1953: 14950,
  1954: 16450, 1955: 16450, 1956: 18095, 1957: 18095, 1958: 18095, 1959: 18095,
};
const FRANCS: Partial<Record<number, number>> = {
  1960: 180.95, 1961: 180.95, 1962: 180.95, 1963: 200, 1964: 225, 1965: 250,
  1966: 287.5, 1967: 325, 1968: 362.5, 1969: 387.5, 1970: 412.5, 1971: 437.5,
  1972: 788, 1973: 910, 1974: 1086, 1975: 1350, 1976: 1578, 1977: 1788, 1978: 2012,
  1979: 2262, 1980: 2586, 1981: 2958, 1982: 3630, 1983: 4058, 1984: 4556,
  1985: 4872, 1986: 5208, 1987: 5384, 1988: 5568, 1989: 5752, 1990: 5982,
  1991: 6388, 1992: 6532, 1993: 6812, 1994: 6966, 1995: 7112, 1996: 7396,
  1997: 7582, 1998: 7886, 1999: 8044, 2000: 8144, 2001: 8404,
};
const EUROS: Partial<Record<number, number>> = {
  2002: 1334, 2003: 1366, 2004: 1438, 2005: 1522, 2006: 1606, 2007: 1654,
  2008: 1688, 2009: 1742, 2010: 1772, 2011: 1800, 2012: 1844, 2013: 1886,
  2014: 1429.5, 2015: 1441.5, 2016: 1450.5, 2017: 1464, 2018: 1482,
  2019: 1504.5, 2020: 1522.5, 2021: 1537.5, 2022: 1585.5, 2023: 1690.5,
  2024: 1747.5, 2025: 1782, 2026: 1803,
};

export function getSamQuarterThreshold(year: number): number | undefined {
  const thresholdOldFrancs = OLD_FRANCS[year];
  const thresholdFrancs = FRANCS[year];
  if (thresholdOldFrancs !== undefined) return thresholdOldFrancs / 100 / FRF_TO_EUR_RATE;
  if (thresholdFrancs !== undefined) return thresholdFrancs / FRF_TO_EUR_RATE;
  return EUROS[year];
}

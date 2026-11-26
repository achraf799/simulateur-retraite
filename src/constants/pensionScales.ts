import { validDate } from '../utils/civilDates';

// Agirc-Arrco, barèmes de la valeur de service du point et du plafond de majoration pour enfants.
// https://www.agirc-arrco.fr/nous-connaitre/nos-etudes-et-publications/documentation-institutionnelle/parametres-et-donnees-statistiques/
// https://reglementation.agirc-arrco.fr/home/baremes/listes-area/baremes-1/plafond-de-la-majoration-pour-enfants-nes-ou-eleves.html
const AGIRC_ARRCO_SCALES = [
  { effectiveFrom: '2026-11-01', pointValue: 1.4587, annualChildBonusCap: 2400.55 },
  { effectiveFrom: '2025-11-01', pointValue: 1.4386, annualChildBonusCap: 2367.48 },
  { effectiveFrom: '2024-11-01', pointValue: 1.4386, annualChildBonusCap: 2367.48 },
  { effectiveFrom: '2023-11-01', pointValue: 1.4159, annualChildBonusCap: 2330.12 },
  { effectiveFrom: '2022-11-01', pointValue: 1.3498, annualChildBonusCap: 2221.34 },
  { effectiveFrom: '2021-11-01', pointValue: 1.2841, annualChildBonusCap: 2113.22 },
  { effectiveFrom: '2019-11-01', pointValue: 1.2714, annualChildBonusCap: 2092.32 },
  { effectiveFrom: '2019-01-01', pointValue: 1.2588, annualChildBonusCap: 2071.58 },
];

const MICO_SCALES = [
  // CNAV 2026/16 : revalorisation du plafond seul au 1er juin 2026.
  { effectiveFrom: '2026-06-01', baseMonthly: 756.29, increasedMonthly: 903.93, monthlyPensionsCap: 1444.89 },
  // CNAV 2025/33.
  { effectiveFrom: '2026-01-01', baseMonthly: 756.29, increasedMonthly: 903.93, monthlyPensionsCap: 1410.89 },
  // CNAV 2025/08, qui remplace la circulaire 2024/40 et corrige le plafond depuis novembre 2024.
  { effectiveFrom: '2025-01-01', baseMonthly: 747.47, increasedMonthly: 893.39, monthlyPensionsCap: 1394.44 },
  { effectiveFrom: '2024-11-01', baseMonthly: 733.03, increasedMonthly: 876.13, monthlyPensionsCap: 1394.44 },
  // CNAV 2024/03.
  { effectiveFrom: '2024-01-01', baseMonthly: 733.03, increasedMonthly: 876.13, monthlyPensionsCap: 1367.51 },
  // CNAV 2023/16 et 2022/40.
  { effectiveFrom: '2023-09-01', baseMonthly: 709.13, increasedMonthly: 847.57, monthlyPensionsCap: 1352.23 },
  { effectiveFrom: '2023-05-01', baseMonthly: 684.13, increasedMonthly: 747.57, monthlyPensionsCap: 1352.23 },
  { effectiveFrom: '2023-01-01', baseMonthly: 684.13, increasedMonthly: 747.57, monthlyPensionsCap: 1322.87 },
];

function selectScale<T extends { effectiveFrom: string }>(
  scales: readonly T[],
  date: string,
  publishedThrough: string,
) {
  const scale = scales.find(({ effectiveFrom }) => effectiveFrom <= date);
  return {
    ...(scale ?? scales[scales.length - 1]),
    projected: !scale || date > publishedThrough,
  };
}

export function getPensionScales(departureDate: string) {
  const date = validDate(departureDate) ? departureDate : '';
  return {
    agircArrco: selectScale(AGIRC_ARRCO_SCALES, date, '2027-10-31'),
    // Le SMIC change au 1er décembre 2026. Le plafond CNAV actualisé reste à intégrer.
    mico: selectScale(MICO_SCALES, date, '2026-11-30'),
  };
}

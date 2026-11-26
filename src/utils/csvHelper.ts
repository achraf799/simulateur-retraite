import { CareerYear, Currency, EventType, Regime } from '../types/retirement';
import { getPassForYear, FRF_TO_EUR_RATE } from '../constants/passHistory';
import { getCnavCoeff } from '../constants/cnavCoefficients';
import { validDate } from './civilDates';

export function exportCareerToCsv(career: CareerYear[]): string {
  const headers = [
    'Annee',
    'Devise',
    'RevenuBrut',
    'Regime',
    'TrimestresValides',
    'TrimestresCotises',
    'PointsAgirc',
    'TypeEvenement',
    'TraitementSAM',
    'RegimeAgircHistorique',
    'DateArretPoints',
    'PointsAgircAvantDepart',
  ];

  const rows = career.map((r) => [
    r.year,
    r.currency,
    r.grossIncome,
    r.regime,
    r.validatedQuarters,
    r.contributedQuarters,
    r.agircPoints,
    r.eventType,
    r.samIncomeKind ?? '',
    r.agircLegacyRegime ?? '',
    r.agircPointsAtDeparture?.date ?? '',
    r.agircPointsAtDeparture?.points ?? '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function importCareerFromCsv(csvText: string, liquidationYear = 2025): CareerYear[] {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const yearIdx = headers.findIndex((h) => h.includes('annee') || h.includes('year'));
  const devIdx = headers.findIndex((h) => h.includes('devise') || h.includes('currency'));
  const revIdx = headers.findIndex((h) => h.includes('revenu') || h.includes('gross'));
  const regIdx = headers.findIndex((h) => h.includes('regime'));
  const trimValIdx = headers.findIndex((h) => h.includes('valide') || h.includes('trimestresvalides'));
  const trimCotIdx = headers.findIndex((h) => h.includes('cotise') || h.includes('trimestrescotises'));
  const agircLegacyIdx = headers.indexOf('regimeagirchistorique');
  const pointsDateIdx = headers.indexOf('datearretpoints');
  const partialPointsIdx = headers.indexOf('pointsagircavantdepart');
  const pointsIdx = headers.findIndex((h, index) =>
    index !== agircLegacyIdx && index !== pointsDateIdx && index !== partialPointsIdx && (h.includes('points') || h.includes('agirc')));
  const eventIdx = headers.findIndex((h) => h.includes('event') || h.includes('evenement'));

  const samIdx = headers.indexOf('traitementsam');
  const parsedRows: CareerYear[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 3) continue;

    const year = parseInt(cols[yearIdx >= 0 ? yearIdx : 0], 10);
    if (isNaN(year)) continue;

    const currency: Currency = (devIdx >= 0 && cols[devIdx]?.toUpperCase() === 'FRF') ? 'FRF' : 'EUR';
    const grossIncome = parseFloat(cols[revIdx >= 0 ? revIdx : 2]) || 0;
    const grossIncomeEur =
      currency === 'FRF' ? Number((grossIncome / FRF_TO_EUR_RATE).toFixed(2)) : grossIncome;
    const regime: Regime = (regIdx >= 0 && cols[regIdx]?.toUpperCase() === 'MSA') ? 'MSA' : 'CNAV';
    const validatedQuarters = Math.min(4, Math.max(0, parseInt(cols[trimValIdx >= 0 ? trimValIdx : 4], 10) || 0));
    const contributedQuarters = Math.min(4, Math.max(0, parseInt(cols[trimCotIdx >= 0 ? trimCotIdx : 5], 10) || 0));
    const agircPoints = parseFloat(cols[pointsIdx >= 0 ? pointsIdx : 6]) || 0;
    const eventType: EventType = (eventIdx >= 0 ? cols[eventIdx] : 'Activité') as EventType;

    const passEur = getPassForYear(year);
    const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
    const cnavCoeff = getCnavCoeff(year, liquidationYear);
    const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

    const samIncomeKind = cols[samIdx];
    const agircLegacyRegime = cols[agircLegacyIdx];
    const pointsDate = cols[pointsDateIdx];
    const partialPoints = cols[partialPointsIdx] ? Number(cols[partialPointsIdx]) : NaN;
    parsedRows.push({
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
      ...(pointsDate && validDate(pointsDate) && Number.isFinite(partialPoints) && partialPoints >= 0
        ? { agircPointsAtDeparture: { date: pointsDate, points: partialPoints } } : {}),
      eventType,
      ...(agircLegacyRegime === 'arrco' || agircLegacyRegime === 'agirc'
        || agircLegacyRegime === 'camarca' || agircLegacyRegime === 'noBonus' ? { agircLegacyRegime } : {}),
      ...(samIncomeKind === 'salary' || samIncomeKind === 'excluded' || samIncomeKind === 'buyback'
        ? { samIncomeKind }
        : {}),
    });
  }

  return parsedRows.sort((a, b) => a.year - b.year);
}

import type { AgircLegacyRegime, CareerYear, EventType, SamIncomeKind } from '../types/retirement';
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

const COLUMN_NAMES = {
  year: ['annee', 'year'],
  currency: ['devise', 'currency'],
  grossIncome: ['revenubrut', 'revenu', 'grossincome', 'grosssalary', 'gross'],
  regime: ['regime', 'regimedebase', 'baseregime'],
  validatedQuarters: ['trimestresvalides', 'valides', 'validatedquarters'],
  contributedQuarters: ['trimestrescotises', 'cotises', 'contributedquarters'],
  agircPoints: ['pointsagirc', 'pointsagircarrco', 'agircpoints', 'points', 'agirc'],
  eventType: ['typeevenement', 'evenement', 'eventtype', 'event'],
  samIncomeKind: ['traitementsam', 'samincomekind'],
  agircLegacyRegime: ['regimeagirchistorique', 'agirclegacyregime'],
  pointsDate: ['datearretpoints'],
  partialPoints: ['pointsagircavantdepart'],
};

const EVENT_TYPES: readonly EventType[] = ['Activité', 'Maladie/AT', 'Maternité', 'Chômage', 'AVPF'];
const SAM_KINDS: readonly SamIncomeKind[] = ['salary', 'excluded', 'buyback'];
const AGIRC_REGIMES: readonly AgircLegacyRegime[] = ['arrco', 'agirc', 'camarca', 'noBonus'];

export class CareerCsvError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join('\n'));
  }
}

// Un relevé contient un enregistrement par ligne, avec des champs éventuellement entre guillemets.
function readCells(line: string): string[] | undefined {
  const field = /[ \t]*(?:"((?:[^"]|"")*)"[ \t]*|([^",]*))(,|$)/y;
  const cells: string[] = [];
  let match: RegExpExecArray | null;
  do {
    match = field.exec(line);
    if (!match) return undefined;
    cells.push((match[1]?.replace(/""/g, '"') ?? match[2]).trim());
  } while (match[3] === ',');
  return cells;
}

function normalizeHeader(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s_-]/g, '');
}

function readNumber(value: string): number {
  return value === '' || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)
    ? Number(value)
    : NaN;
}

export function importCareerFromCsv(csvText: string, liquidationYear = 2025): CareerYear[] {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  const headerIndex = lines.findIndex((line) => line.trim() !== '');
  if (headerIndex < 0) throw new CareerCsvError(['Le fichier CSV est vide.']);

  const headers = readCells(lines[headerIndex])?.map(normalizeHeader);
  if (!headers) throw new CareerCsvError([`Ligne ${headerIndex + 1} · l’en-tête CSV est illisible.`]);

  const issues: string[] = [];
  const columns = new Map<keyof typeof COLUMN_NAMES, number>();
  for (const field of Object.keys(COLUMN_NAMES) as (keyof typeof COLUMN_NAMES)[]) {
    const matches = headers.flatMap((header, index) => COLUMN_NAMES[field].includes(header) ? [index] : []);
    if (matches.length > 1) issues.push(`Ligne ${headerIndex + 1} · colonnes en double pour ${headers[matches[0]]}.`);
    if (matches.length === 1) columns.set(field, matches[0]);
  }
  if (issues.length) throw new CareerCsvError(issues);
  const incomeColumn = columns.get('grossIncome');
  if (!columns.has('year') || incomeColumn === undefined) {
    throw new CareerCsvError([`Ligne ${headerIndex + 1} · les colonnes Année et RevenuBrut sont requises dans le CSV séparé par des virgules.`]);
  }

  const parsedRows: CareerYear[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = readCells(lines[i]);
    if (!cols || cols.length > headers.length || cols.length <= incomeColumn) {
      issues.push(`Ligne ${i + 1} · vérifiez les virgules, les guillemets et le nombre de colonnes.`);
      continue;
    }

    const cell = (field: keyof typeof COLUMN_NAMES) => cols[columns.get(field) ?? -1] ?? '';
    const yearText = cell('year');
    const year = Number(yearText);
    const currency = cell('currency').toUpperCase() || 'EUR';
    const validCurrency = currency === 'EUR' || currency === 'FRF';
    const grossIncome = readNumber(cell('grossIncome'));
    const regime = cell('regime').toUpperCase() || 'CNAV';
    const validRegime = regime === 'CNAV' || regime === 'MSA';
    const validatedQuarters = readNumber(cell('validatedQuarters'));
    const contributedQuarters = readNumber(cell('contributedQuarters'));
    const agircPoints = readNumber(cell('agircPoints'));
    const eventText = cell('eventType') || 'Activité';
    const eventType = EVENT_TYPES.find((event) => event.toLowerCase() === eventText.toLowerCase());
    const samKindText = cell('samIncomeKind').toLowerCase();
    const samIncomeKind = SAM_KINDS.find((kind) => kind === samKindText);
    const legacyText = cell('agircLegacyRegime').toLowerCase();
    const agircLegacyRegime = AGIRC_REGIMES.find((kind) => kind.toLowerCase() === legacyText);
    const pointsDate = cell('pointsDate');
    const partialPointsText = cell('partialPoints');
    const partialPoints = readNumber(partialPointsText);

    const errors: string[] = [];
    if (!/^[1-9]\d{3}$/.test(yearText)) errors.push('année sur quatre chiffres attendue');
    if (!validCurrency) errors.push('devise EUR ou FRF attendue');
    if (!Number.isFinite(grossIncome) || grossIncome < 0) errors.push('revenu brut positif ou nul attendu');
    if (!validRegime) errors.push('régime de base CNAV ou MSA attendu');
    if (!Number.isInteger(validatedQuarters) || validatedQuarters < 0 || validatedQuarters > 4) {
      errors.push('trimestres validés entre 0 et 4 attendus');
    }
    if (!Number.isInteger(contributedQuarters) || contributedQuarters < 0 || contributedQuarters > validatedQuarters) {
      errors.push('trimestres cotisés entiers entre 0 et le nombre de trimestres validés attendus');
    }
    if (!Number.isFinite(agircPoints)) errors.push('points Agirc-Arrco en nombre fini attendus');
    if (!eventType) errors.push('type d’événement inconnu');
    if (samKindText && !samIncomeKind) errors.push('traitement SAM inconnu');
    if (legacyText && !agircLegacyRegime) errors.push('caisse historique Agirc-Arrco inconnue');
    if ((pointsDate || partialPointsText) && (!validDate(pointsDate) || !pointsDate.startsWith(yearText + '-')
      || !partialPointsText || !Number.isFinite(partialPoints) || partialPoints < 0)) {
      errors.push('renseignez la date de départ et les points acquis à cette date pour l’année de la ligne');
    }
    if (errors.length || !eventType || !validCurrency || !validRegime) {
      issues.push(`Ligne ${i + 1} · ${errors.join(', ')}.`);
      continue;
    }

    const grossIncomeEur =
      currency === 'FRF' ? Number((grossIncome / FRF_TO_EUR_RATE).toFixed(2)) : grossIncome;
    const passEur = getPassForYear(year);
    const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
    const cnavCoeff = getCnavCoeff(year, liquidationYear);
    const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

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
      ...(pointsDate ? { agircPointsAtDeparture: { date: pointsDate, points: partialPoints } } : {}),
      eventType,
      ...(agircLegacyRegime ? { agircLegacyRegime } : {}),
      ...(samIncomeKind ? { samIncomeKind } : {}),
    });
  }

  if (issues.length) throw new CareerCsvError(issues);
  if (!parsedRows.length) throw new CareerCsvError(['Le fichier CSV contient uniquement l’en-tête.']);
  return parsedRows.sort((a, b) => a.year - b.year);
}

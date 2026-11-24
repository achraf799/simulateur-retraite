import type { CareerYear, Currency, EventType, Regime, SamIncomeKind } from '../types/retirement';
import { FIRST_CAREER_YEAR, toCareerYear } from './careerEntry';

const columns = {
  Annee: ['annee', 'year'],
  Devise: ['devise', 'currency'],
  RevenuBrut: ['revenubrut', 'revenu', 'grossincome', 'gross', 'salairebrut'],
  Regime: ['regime'],
  TrimestresValides: ['trimestresvalides', 'validatedquarters', 'valides'],
  TrimestresCotises: ['trimestrescotises', 'contributedquarters', 'cotises'],
  PointsAgirc: ['pointsagirc', 'agircpoints', 'points'],
  TypeEvenement: ['typeevenement', 'eventtype', 'evenement', 'event'],
  TraitementSAM: ['traitementsam', 'samincomekind'],
} as const;

const currencies = ['EUR', 'FRF'] as const satisfies readonly Currency[];
const regimes = ['CNAV', 'MSA'] as const satisfies readonly Regime[];
const eventTypes = ['Activité', 'Maladie/AT', 'Maternité', 'Chômage', 'AVPF'] as const satisfies readonly EventType[];
const samKinds = ['salary', 'excluded', 'buyback'] as const satisfies readonly SamIncomeKind[];

export interface CsvIssue {
  line: number;
  messages: string[];
}

export type CareerImportStatus =
  | { kind: 'idle' | 'loading' }
  | { kind: 'success'; count: number }
  | { kind: 'error'; message: string; issues?: CsvIssue[] };

export class CareerCsvError extends Error {
  constructor(readonly issues: CsvIssue[]) {
    super('Le relevé CSV contient des erreurs.');
    this.name = 'CareerCsvError';
  }
}

export function exportCareerToCsv(career: CareerYear[]): string {
  const rows = career.map((row) => [
    row.year, row.currency, row.grossIncome, row.regime, row.validatedQuarters,
    row.contributedQuarters, row.agircPoints, row.eventType, row.samIncomeKind ?? '',
  ]);

  return [Object.keys(columns), ...rows].map((row) => row.join(',')).join('\n');
}

function normalizeHeader(header: string): string {
  return header.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function splitLine(line: string, separator: ',' | ';'): string[] | undefined {
  const pattern = separator === ';'
    ? /^\s*(?:"((?:[^"]|"")*)"|([^";]*))\s*(;|$)/
    : /^\s*(?:"((?:[^"]|"")*)"|([^",]*))\s*(,|$)/;
  const values: string[] = [];
  let rest = line;
  do {
    const match = rest.match(pattern);
    if (!match) return undefined;
    values.push((match[1] ?? match[2]).replace(/""/g, '"').trim());
    if (!match[3]) return values;
    rest = rest.slice(match[0].length);
  } while (true);
}

function nonNegativeNumber(text: string): number {
  if (!/^(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?$/.test(text)) return NaN;
  const value = Number(text.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : NaN;
}

function enumValue<T extends string>(
  value: string,
  choices: readonly T[],
  label: string,
  messages: string[],
): T | undefined {
  if (value === '') return undefined;
  const option = choices.find((choice) => choice.toLocaleLowerCase('fr-FR') === value.toLocaleLowerCase('fr-FR'));
  if (option === undefined) messages.push(`${label} doit être parmi ${choices.join(', ')}.`);
  return option;
}

function quarters(value: string, label: string, messages: string[]): number | undefined {
  if (value === '') return undefined;
  if (!/^[0-4]$/.test(value)) {
    messages.push(`${label} doit être un entier de 0 à 4.`);
    return undefined;
  }
  return Number(value);
}

export function importCareerFromCsv(csvText: string, liquidationYear = 2025): CareerYear[] {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  const headerIndex = lines.findIndex((line) => line.trim() !== '');
  if (headerIndex < 0) throw new CareerCsvError([{ line: 1, messages: ['Le fichier est vide.'] }]);

  const header = lines[headerIndex];
  const semicolonFields = splitLine(header, ';');
  const separator = semicolonFields && semicolonFields.length > 1 ? ';' : ',';
  const fields = (separator === ';' ? semicolonFields : splitLine(header, ','))?.map(normalizeHeader);
  if (!fields) throw new CareerCsvError([{ line: headerIndex + 1, messages: ['En-tête CSV mal formé.'] }]);

  const positions = new Map<keyof typeof columns, number>();
  const headerErrors: string[] = [];
  for (const [name, aliases] of Object.entries(columns)) {
    const indices = fields.flatMap((field, index) => aliases.some((alias) => alias === field) ? [index] : []);
    if (indices.length > 1) headerErrors.push(`La colonne ${name} apparaît plusieurs fois.`);
    if (indices.length > 0) positions.set(name as keyof typeof columns, indices[0]);
  }
  for (const required of ['Annee', 'RevenuBrut'] as const) {
    if (!positions.has(required)) headerErrors.push(`La colonne ${required} est obligatoire.`);
  }
  if (headerErrors.length) throw new CareerCsvError([{ line: headerIndex + 1, messages: headerErrors }]);

  const rows: CareerYear[] = [];
  const issues: CsvIssue[] = [];
  for (let index = headerIndex + 1; index < lines.length; index++) {
    if (lines[index].trim() === '') continue;
    const parsed = splitLine(lines[index], separator);
    if (!parsed || parsed.length !== fields.length) {
      issues.push({ line: index + 1, messages: ['Nombre de colonnes incorrect ou guillemets mal fermés.'] });
      continue;
    }

    const field = (name: keyof typeof columns) => parsed[positions.get(name) ?? -1] ?? '';
    const messages: string[] = [];
    const year = Number(field('Annee'));
    if (!/^\d{4}$/.test(field('Annee')) || year < FIRST_CAREER_YEAR) {
      messages.push(`L’année doit comporter quatre chiffres et être supérieure ou égale à ${FIRST_CAREER_YEAR}.`);
    }
    const grossIncome = nonNegativeNumber(field('RevenuBrut'));
    if (!Number.isFinite(grossIncome)) messages.push('Le revenu brut doit être un nombre positif ou nul.');

    const currency = enumValue(field('Devise'), currencies, 'La devise', messages) ?? 'EUR';
    const regime = enumValue(field('Regime'), regimes, 'Le régime', messages) ?? 'CNAV';
    const eventType = enumValue(field('TypeEvenement'), eventTypes, 'Le type d’événement', messages) ?? 'Activité';
    const samIncomeKind = enumValue(field('TraitementSAM'), samKinds, 'Le traitement SAM', messages);
    const contributedQuarters = quarters(field('TrimestresCotises'), 'Le nombre de trimestres cotisés', messages) ?? 0;
    const validatedQuarters = quarters(field('TrimestresValides'), 'Le nombre de trimestres validés', messages)
      ?? contributedQuarters;
    if (contributedQuarters > validatedQuarters) messages.push('Les trimestres cotisés ne peuvent pas dépasser les trimestres validés.');
    const agircPoints = nonNegativeNumber(field('PointsAgirc') || '0');
    if (!Number.isFinite(agircPoints)) messages.push('Les points Agirc-Arrco doivent être un nombre positif ou nul.');

    if (messages.length > 0) {
      issues.push({ line: index + 1, messages });
      continue;
    }
    rows.push(toCareerYear({
      year, currency, grossIncome, regime, eventType, samIncomeKind, contributedQuarters, validatedQuarters, agircPoints,
    }, liquidationYear));
  }

  if (issues.length) throw new CareerCsvError(issues);
  if (!rows.length) throw new CareerCsvError([{ line: headerIndex + 1, messages: ['Le fichier ne contient aucune ligne de carrière.'] }]);
  return rows.sort((a, b) => a.year - b.year);
}

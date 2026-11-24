export function validDate(value: string): boolean {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

export function addMonths(value: string, months: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month + months, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + months, Math.min(day, lastDay)))
    .toISOString().slice(0, 10);
}

export function retirementDateIssue(birthDate: string, departure: string): string | undefined {
  if (!validDate(birthDate) && !validDate(departure)) return 'Renseignez votre date de naissance et votre date de départ.';
  if (!validDate(birthDate)) return 'Renseignez votre date de naissance.';
  if (!validDate(departure) || !departure.endsWith('-01')) return 'Renseignez un mois et une année de départ.';
  if (departure <= birthDate) return 'La date de départ doit être postérieure à la date de naissance.';
  return undefined;
}

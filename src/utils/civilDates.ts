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

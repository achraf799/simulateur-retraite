import { describe, expect, it } from 'vitest';
import { getCnavCoeff } from './cnavCoefficients';
import { getPassForYear } from './passHistory';

describe('Barèmes historiques de la retraite de base', () => {
  it.each([
    [1948, 2023, 109.781],
    [1979, 2024, 3.226],
    [1979, 2025, 3.296],
    [1979, 2026, 3.325],
    [2024, 2025, 1.022],
    [2024, 2026, 1.031],
    [2025, 2026, 1.009],
  ])('applique le coefficient du salaire %i pour une liquidation en %i', (salaryYear, departure, coefficient) => {
    expect(getCnavCoeff(salaryYear, departure)).toBe(coefficient);
  });

  it.each([
    [1959, 1006.16],
    [1979, 8177.37],
    [1980, 9165.23],
    [1996, 24577.83],
    [2026, 48060],
  ])('convertit le plafond publié pour %i en euros', (year, ceiling) => {
    expect(getPassForYear(year)).toBe(ceiling);
  });
});

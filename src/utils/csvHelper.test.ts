import { describe, expect, it } from 'vitest';
import { SAKURA_CAREER } from '../constants/scenarios';
import { CareerCsvError, exportCareerToCsv, importCareerFromCsv } from './csvHelper';

describe('Import de relevé de carrière', () => {
  it('relit le CSV exporté et préserve le traitement SAM', () => {
    const original = [
      { ...SAKURA_CAREER[2], samIncomeKind: 'salary' as const },
      { ...SAKURA_CAREER[6], samIncomeKind: 'buyback' as const },
    ];
    const imported = importCareerFromCsv(exportCareerToCsv(original));
    expect(imported).toEqual(original);
  });

  it('importe un CSV français avec BOM, accents, guillemets et virgules décimales', () => {
    const csv = [
      '\uFEFF"Année";"Revenu brut";"Régime";"Trimestres validés";"Trimestres cotisés";"Points Agirc"',
      '2024;"12\u202f500,75";MSA;3;2;"155,25"',
      '2023;"25000,10";CNAV;4;4;120',
    ].join('\r\n');
    expect(importCareerFromCsv(csv)).toMatchObject([
      { year: 2023, grossIncome: 25000.10, regime: 'CNAV' },
      { year: 2024, grossIncome: 12500.75, regime: 'MSA', validatedQuarters: 3, contributedQuarters: 2, agircPoints: 155.25 },
    ]);
  });

  it('signale les lignes invalides, même si le fichier contient une ligne correcte', () => {
    const csv = [
      'Annee,RevenuBrut,Devise,Regime,TrimestresValides,TrimestresCotises',
      '2024,28000,EUR,CNAV,4,4',
      '',
      '2025aux,-1200,USD,Autre,2,3',
      '2025,"mal fermé,EUR,CNAV,4,4',
    ].join('\n');
    expect(() => importCareerFromCsv(csv)).toThrow(CareerCsvError);
    try {
      importCareerFromCsv(csv);
    } catch (error) {
      expect(error).toMatchObject({
        issues: [
          { line: 4, messages: expect.arrayContaining([
            expect.stringContaining('quatre chiffres'), expect.stringContaining('revenu brut'),
            expect.stringContaining('devise'), expect.stringContaining('régime'),
            expect.stringContaining('trimestres cotisés'),
          ]) },
          { line: 5, messages: [expect.stringContaining('guillemets')] },
        ],
      });
    }
  });

  it.each([
    ['', 1, 'vide'],
    ['\nAnnée;SalaireNet\n2024;27000', 2, 'RevenuBrut'],
    ['Année,RevenuBrut\n', 1, 'aucune ligne'],
    ['Année;Year;RevenuBrut\n2024;2024;2500', 1, 'plusieurs fois'],
  ])('signale un fichier inutilisable sur sa ligne de référence', (input, line, fragment) => {
    try {
      importCareerFromCsv(input);
      throw new Error('L’import devait échouer.');
    } catch (error) {
      expect(error).toMatchObject({
        issues: [{ line, messages: [expect.stringContaining(fragment)] }],
      });
    }
  });
});

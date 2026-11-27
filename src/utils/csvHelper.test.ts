import { describe, expect, it } from 'vitest';
import { importCareerFromCsv } from './csvHelper';

describe('Import du relevé de carrière CSV', () => {
  it('distingue le régime de base et la caisse historique quel que soit l’ordre des colonnes', () => {
    const csv = [
      'RegimeAgircHistorique,Regime,Annee,RevenuBrut,PointsAgirc',
      'camarca,MSA,1998,10000,72.5',
    ].join('\n');
    expect(importCareerFromCsv(csv)).toMatchObject([
      { year: 1998, regime: 'MSA', agircLegacyRegime: 'camarca', grossIncome: 10000, agircPoints: 72.5 },
    ]);
  });

  it('signale les lignes invalides même lorsque le fichier contient aussi des lignes valides', () => {
    const csv = [
      'Annee,RevenuBrut,Regime,PointsAgirc,TrimestresValides,TrimestresCotises',
      '2000,10000,CNAV,120,4,4',
      '',
      '2001,10000,MSA,Infinity,4,4',
      '2002,10000,MSAA,120,3,4',
    ].join('\r\n');
    expect(() => importCareerFromCsv(csv)).toThrow(/Ligne 4[^\n]*points Agirc-Arrco[\s\S]*Ligne 5[^\n]*régime de base[^\n]*trimestres cotisés/i);
  });

  it('signale une paire incomplète de date et points à la date du départ', () => {
    const csv = 'Annee,RevenuBrut,DateArretPoints,PointsAgircAvantDepart\n2025,10000,2025-07-01,';
    expect(() => importCareerFromCsv(csv)).toThrow(/Ligne 2[^\n]*date de départ et les points/i);
  });
});

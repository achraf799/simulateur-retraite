import React, { useState } from 'react';
import { CareerYear, UserProfile, Currency, Regime, EventType, SamAnalysis, SamIncomeKind, SamYear } from '../../types/retirement';
import { samIncomeKind } from '../../engine/annualSalary';
import { FIRST_CAREER_YEAR, toCareerYear } from '../../utils/careerEntry';
import type { CareerImportStatus } from '../../utils/csvHelper';
import { SamParametersNote } from '../common/SamParametersNote';
import { FormulaTooltip } from '../common/FormulaTooltip';
import {
  Zap,
  FileSpreadsheet,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  Award,
  Info,
  CheckCircle2,
  Plus,
} from 'lucide-react';

const samYearLabels: Record<SamYear['status'], string> = {
  selected: 'Retenue',
  outsideTopYears: 'Hors meilleures années',
  beforeCareer: 'Hors période',
  fromLiquidation: 'Liquidation ou année suivante',
  buyback: 'Rachat excluant l’année',
  noPensionableIncome: 'Aucun revenu admissible',
  belowThreshold: 'Sous le seuil d’un trimestre',
  unconfirmedThreshold: 'Trimestre à confirmer',
};

interface Step2CareerProps {
  profile: UserProfile;
  career: CareerYear[];
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  onChangeCareer: (updated: CareerYear[]) => void;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  importStatus: CareerImportStatus;
  samAnalysis: SamAnalysis;
}

export const Step2Career: React.FC<Step2CareerProps> = ({
  profile,
  career,
  onChangeProfile,
  onChangeCareer,
  onExportCsv,
  onImportCsv,
  importStatus,
  samAnalysis,
}) => {
  const isExpress = profile.careerMode === 'express';
  const sam = samAnalysis.amount;
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const [showDetailedTable, setShowDetailedTable] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [newYear, setNewYear] = useState('');
  const [newRegime, setNewRegime] = useState<Regime>('CNAV');
  const liquidationYear = Number(profile.desiredDepartureDate.slice(0, 4)) || 2025;
  const totals = career.reduce((sum, row) => ({
    totalQuarters: sum.totalQuarters + row.validatedQuarters,
    contributedQuarters: sum.contributedQuarters + row.contributedQuarters,
    agircPoints: sum.agircPoints + row.agircPoints,
  }), { totalQuarters: 0, contributedQuarters: 0, agircPoints: 0 });
  const expressData = profile.expressData ?? { ...totals, estimatedSam: sam };

  const handleModeSwitch = (mode: 'detailed' | 'express') => {
    if (mode === profile.careerMode) return;
    onChangeProfile(mode === 'express' ? { careerMode: mode, expressData } : { careerMode: mode });
  };

  const handleUpdateExpress = (field: keyof typeof expressData, value: number) => {
    const nextData = { ...expressData, [field]: value };
    if (field === 'totalQuarters') {
      nextData.contributedQuarters = expressData.contributedQuarters === expressData.totalQuarters
        ? value : Math.min(value, nextData.contributedQuarters);
    }
    onChangeProfile({ expressData: nextData });
  };

  const updateCareerRow = (index: number, changes: Partial<CareerYear>) => {
    onChangeCareer(career.map((row, rowIndex) => rowIndex === index
      ? toCareerYear({ ...row, ...changes }, liquidationYear)
      : row));
  };

  const addCareerYear = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const year = Number(newYear);
    if (!/^\d{4}$/.test(newYear) || year < FIRST_CAREER_YEAR) return;
    const entry = toCareerYear({
      year, regime: newRegime, currency: 'EUR', grossIncome: 0,
      validatedQuarters: 0, contributedQuarters: 0, agircPoints: 0, eventType: 'Activité',
    }, liquidationYear);
    onChangeCareer([...career, entry].sort((a, b) => a.year - b.year));
    setNewYear('');
    setShowDetailedTable(true);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onImportCsv(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Titre et intention */}
      <div className="text-center space-y-1 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-institution-50 text-institution-700 text-xs font-semibold border border-institution-200 mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Étape 2 sur 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Votre carrière & vos droits
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Choisissez la méthode de saisie : ultra-rapide (4 chiffres) ou relevé complet année par année.
        </p>
      </div>

      {/* Sélecteur de mode en 2 gros boutons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bouton 1 : Mode Relevé Complet */}
        <button
          type="button"
          onClick={() => handleModeSwitch('detailed')}
          className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
            !isExpress
              ? 'bg-institution-50/50 border-institution-600 ring-2 ring-institution-100 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-institution-100 text-institution-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            {!isExpress && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-institution-600 text-white">
                Actif
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Relevé complet détaillé</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Ajoutez les lignes de votre relevé ou importez un fichier CSV.
          </p>
        </button>

        {/* Bouton 2 : Mode Express */}
        <button
          type="button"
          onClick={() => handleModeSwitch('express')}
          className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
            isExpress
              ? 'bg-tealbrand-50/50 border-tealbrand-600 ring-2 ring-tealbrand-100 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-tealbrand-100 text-tealbrand-700">
              <Zap className="w-5 h-5" />
            </div>
            {isExpress && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-tealbrand-600 text-white">
                Actif (Mode rapide)
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Mode Express (15 secondes)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Remplissez uniquement 4 champs clés (trimestres, SAM estimé, points Agirc) pour tester un profil en direct.
          </p>
        </button>
      </div>

      {/* CONTENU MODE EXPRESS */}
      {isExpress && (
        <div className="bg-white rounded-2xl border border-tealbrand-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Zap className="w-4 h-4 text-tealbrand-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Saisie rapide des 4 paramètres clés
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Trimestres validés */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Total des trimestres validés
                </label>
                <FormulaTooltip
                  title="Trimestres validés"
                  formula="4 trimestres max par an"
                  explanation="Totalité des trimestres cotisés, assimilés (maladie, chômage) ou accordés au titre des enfants."
                  articleCss="Art. L. 351-1 CSS"
                />
              </div>
              <input
                type="number"
                min="0"
                max="200"
                value={expressData.totalQuarters || ''}
                onChange={(e) =>
                  handleUpdateExpress('totalQuarters', Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-4 focus:ring-tealbrand-50 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400">
                170 trimestres requis pour la génération 1963
              </p>
            </div>

            {/* 2. Trimestres cotisés */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Trimestres cotisés ou réputés cotisés (carrière longue)
                </label>
                <FormulaTooltip
                  title="Trimestres cotisés & réputés cotisés"
                  formula="Total carrière longue à la date de départ simulée"
                  explanation="Indiquez le total cotisé et les périodes réputées cotisées déjà retenues par votre caisse."
                  articleCss="Art. D. 351-1-2 CSS"
                />
              </div>
              <input
                type="number"
                min="0"
                max="200"
                value={expressData.contributedQuarters || ''}
                onChange={(e) =>
                  handleUpdateExpress(
                    'contributedQuarters',
                    Math.min(expressData.totalQuarters, Math.max(0, parseInt(e.target.value, 10) || 0))
                  )
                }
                className="w-full px-3.5 py-2.5 text-base font-bold text-tealbrand-800 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-4 focus:ring-tealbrand-50 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Généralement égal ou inférieur aux trimestres validés
              </p>
            </div>

            {/* 3. SAM estimé */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Salaire Annuel Moyen (SAM) estimé
                </label>
                <FormulaTooltip
                  title="SAM (Salaire Annuel Moyen)"
                  formula="Moyenne des 25 (ou 23/24) meilleures années plafonnées et revalorisées"
                  explanation="Base de calcul de la retraite du régime général. Ne peut pas dépasser le plafond PASS de l'année."
                  articleCss="Art. R. 351-29 CSS"
                />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={expressData.estimatedSam || ''}
                  onChange={(e) =>
                    handleUpdateExpress('estimatedSam', Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-full pl-3.5 pr-8 py-2.5 text-base font-bold text-institution-800 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-4 focus:ring-tealbrand-50 focus:outline-none font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">€</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Plafonné au PASS (46 368 € en 2024, 48 060 € en 2026)
              </p>
            </div>

            {/* 4. Points Agirc-Arrco */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Total des points Agirc-Arrco
                </label>
                <FormulaTooltip
                  title="Points Agirc-Arrco"
                  formula="Total points × Valeur du point (1,4386 €)"
                  explanation="Nombre de points inscrits sur votre relevé de situation individuelle (RIS)."
                  articleCss="Accord ANI Agirc-Arrco"
                />
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={expressData.agircPoints || ''}
                onChange={(e) =>
                  handleUpdateExpress('agircPoints', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full px-3.5 py-2.5 text-base font-bold text-indigo-800 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-4 focus:ring-tealbrand-50 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Ex: Sakura = 9 274,16 points
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU MODE RELEVÉ COMPLET */}
      {!isExpress && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          {/* Résumé visuel épuré */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Synthèse du relevé de carrière
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {new Set(career.map((row) => row.year)).size} année(s) dans le relevé · {totals.totalQuarters} trimestres saisis
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {totals.contributedQuarters} trimestres cotisés (RACL) •{' '}
                {totals.agircPoints.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts Agirc-Arrco •{' '}
                SAM · <strong>{samAnalysis.source === 'unavailable' ? 'indisponible' : euro.format(sam)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={onExportCsv}
                disabled={career.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                title="Exporter le relevé"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importStatus.kind === 'loading'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                title="Importer un fichier CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{career.length ? 'Importer et remplacer' : 'Importer un CSV'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".csv,text/csv"
                className="hidden"
              />
            </div>
          </div>

          {importStatus.kind === 'error' && (
            <div role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p>{importStatus.message}</p>
              {importStatus.issues && (
                <ul className="max-h-44 list-disc overflow-auto pl-5">
                  {importStatus.issues.map((issue) => (
                    <li key={issue.line}><strong>Ligne {issue.line}</strong> · {issue.messages.join(' ')}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {importStatus.kind === 'loading' && <p role="status" className="text-sm">Lecture du relevé en cours.</p>}
          {importStatus.kind === 'success' && (
            <p role="status" className="text-sm text-emerald-800">
              Import réussi. {importStatus.count} ligne(s) chargée(s).
            </p>
          )}

          <form onSubmit={addCareerYear} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-3">
            <label className="block text-xs font-semibold text-slate-700">
              Année à ajouter
              <input
                type="number" min={FIRST_CAREER_YEAR} max={9999} step={1} required
                value={newYear} onChange={(event) => setNewYear(event.target.value)}
                className="mt-1 block w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Régime de l’année à ajouter
              <select
                value={newRegime} onChange={(event) => setNewRegime(event.target.value as Regime)}
                className="mt-1 block rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
              >
                <option value="CNAV">Régime général</option>
                <option value="MSA">MSA salariée</option>
              </select>
            </label>
            <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-institution-700 px-3 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une année
            </button>
          </form>
          {career.length === 0 && (
            <p className="text-sm text-slate-600">Le relevé est vide. Ajoutez une année, importez un CSV ou choisissez le mode express.</p>
          )}

          <SamParametersNote analysis={samAnalysis} />

          {samAnalysis.parentAdjustmentPending && (
            <p className="text-xs text-amber-900">
              Le plafond de 25 années est utilisé en attendant la confirmation des majorations pour enfant à l’étape Identité.
            </p>
          )}
          {samAnalysis.years.length > 0 && (
            <details className="rounded-xl border border-slate-200">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
                Années utilisées pour le salaire annuel moyen
              </summary>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-700">
                    <tr>
                      <th scope="col" className="p-2">Année</th>
                      <th scope="col" className="p-2 text-right">Revenus au compte</th>
                      <th scope="col" className="p-2 text-right">Après plafonnement</th>
                      <th scope="col" className="p-2 text-right">Revalorisé</th>
                      <th scope="col" className="p-2">Décision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {samAnalysis.years.map((year) => (
                      <tr key={year.year} className={year.status === 'selected' ? 'bg-emerald-50' : undefined}>
                        <th scope="row" className="p-2">{year.year}</th>
                        <td className="p-2 text-right">{euro.format(year.salaryEur)}</td>
                        <td className="p-2 text-right">{euro.format(year.retainedSalaryEur)}</td>
                        <td className="p-2 text-right">{euro.format(year.revaluedSalaryEur)}</td>
                        <td className="p-2">{samYearLabels[year.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {career.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetailedTable(!showDetailedTable)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-100/70 hover:bg-slate-100 transition-colors text-left font-bold text-xs text-slate-700"
            >
              <span className="flex items-center gap-2">
                <span>{showDetailedTable ? 'Masquer' : 'Voir / modifier'} les lignes du relevé</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {samAnalysis.topYears.length} / {samAnalysis.yearLimit} années retenues
                </span>
              </span>
              {showDetailedTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetailedTable && (
              <div className="overflow-x-auto max-h-96 p-2 border-t border-slate-200">
                <p className="mb-2 text-xs text-slate-600">
                  Pour une année avec interruption, sélectionnez « Revenu inscrit au compte » si le montant
                  correspond à un salaire ou à une indemnité admissible portée au relevé.
                </p>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Année</th>
                      <th className="py-2 px-2">Devise</th>
                      <th className="py-2 px-2.5 text-right">Revenu brut</th>
                      <th className="py-2 px-2.5 text-right">PASS</th>
                      <th className="py-2 px-2.5 text-right">Retenu (€)</th>
                      <th className="py-2 px-2 text-right">Coeff</th>
                      <th className="py-2 px-2.5 text-right font-bold">Revalorisé (€)</th>
                      <th className="py-2 px-2 text-center">Trim. V</th>
                      <th className="py-2 px-2 text-center">Trim. C</th>
                      <th className="py-2 px-2 text-right">Points</th>
                      <th className="py-2 px-2"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {career.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.year}</td>
                        <td className="py-1.5 px-2">
                          <select
                            value={row.currency}
                            aria-label={`Devise ${row.year}`}
                            onChange={(e) =>
                              updateCareerRow(idx, { currency: e.target.value as Currency })
                            }
                            className="text-[11px] bg-white border border-slate-200 rounded px-1 py-0.5"
                          >
                            <option value="EUR">EUR</option>
                            <option value="FRF">FRF</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          <input
                            type="number"
                            value={row.grossIncome}
                            aria-label={`Revenu brut ${row.year}`}
                            min={0}
                            onChange={(e) =>
                              updateCareerRow(idx, { grossIncome: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className="w-24 text-right text-[11px] bg-white border border-slate-200 rounded px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2">
                          <select
                            aria-label={`Régime ${row.year}`}
                            value={row.regime}
                            onChange={(event) => updateCareerRow(idx, { regime: event.target.value as Regime })}
                            className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px]"
                          >
                            <option value="CNAV">CNAV</option>
                            <option value="MSA">MSA</option>
                          </select>
                        </td>
                        <td className="px-2">
                          <select
                            aria-label={`Événement ${row.year}`}
                            value={row.eventType}
                            onChange={(event) => updateCareerRow(idx, {
                              eventType: event.target.value as EventType,
                            })}
                            className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px]"
                          >
                            <option>Activité</option>
                            <option>Maladie/AT</option>
                            <option>Maternité</option>
                            <option>Chômage</option>
                            <option>AVPF</option>
                          </select>
                        </td>
                        <td className="px-2">
                          <select
                            aria-label={`Traitement SAM ${row.year}`}
                            value={samIncomeKind(row)}
                            onChange={(event) => updateCareerRow(idx, { samIncomeKind: event.target.value as SamIncomeKind })}
                            className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px]"
                          >
                            <option value="salary">Revenu inscrit au compte</option>
                            <option value="excluded">Revenu hors SAM</option>
                            <option value="buyback">Année exclue pour rachat</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={row.validatedQuarters}
                            aria-label={`Trimestres validés ${row.year}`}
                            onChange={(e) => {
                              const validatedQuarters = Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0));
                              updateCareerRow(idx, {
                                validatedQuarters,
                                contributedQuarters: Math.min(validatedQuarters, row.contributedQuarters),
                              });
                            }}
                            className="w-9 text-center text-[11px] bg-white border border-slate-200 rounded py-0.5 font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={row.validatedQuarters}
                            aria-label={`Trimestres cotisés ${row.year}`}
                            value={row.contributedQuarters}
                            onChange={(e) =>
                              updateCareerRow(idx, {
                                contributedQuarters: Math.min(row.validatedQuarters, Math.max(0, parseInt(e.target.value, 10) || 0)),
                              })
                            }
                            className="w-9 text-center text-[11px] bg-white border border-slate-200 rounded py-0.5 text-tealbrand-700 font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            aria-label={`Points Agirc-Arrco ${row.year}`}
                            value={row.agircPoints}
                            onChange={(event) => updateCareerRow(idx, { agircPoints: Math.max(0, Number(event.target.value) || 0) })}
                            className="w-20 rounded border border-slate-200 px-1 py-0.5 text-right"
                          />
                        </td>
                        <td className="px-2">
                          <button
                            type="button"
                            aria-label={`Supprimer la ligne ${row.year} ${row.regime}`}
                            onClick={() => onChangeCareer(career.filter((_, index) => index !== idx))}
                            className="rounded px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
};

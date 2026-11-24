import React, { useState } from 'react';
import { CareerYear, UserProfile, Currency, EventType, Regime } from '../../types/retirement';
import { getPassForYear, FRF_TO_EUR_RATE } from '../../constants/passHistory';
import { getCnavCoeff } from '../../constants/cnavCoefficients';
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
} from 'lucide-react';

interface Step2CareerProps {
  profile: UserProfile;
  career: CareerYear[];
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  onChangeCareer: (updated: CareerYear[]) => void;
  onExportCsv: () => void;
  onImportCsv: (csvText: string) => void;
  samYearsCount: number;
  sam: number;
  liquidationYear: number;
}

export const Step2Career: React.FC<Step2CareerProps> = ({
  profile,
  career,
  onChangeProfile,
  onChangeCareer,
  onExportCsv,
  onImportCsv,
  samYearsCount,
  sam,
  liquidationYear,
}) => {
  const isExpress = profile.careerMode === 'express';
  const [showDetailedTable, setShowDetailedTable] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Valeurs par défaut du mode express si non définies
  const expressData = profile.expressData || {
    totalQuarters: career.reduce((s, r) => s + r.validatedQuarters, 0) || 170,
    contributedQuarters: career.reduce((s, r) => s + r.contributedQuarters, 0) || 170,
    estimatedSam: sam || 40000,
    agircPoints: career.reduce((s, r) => s + r.agircPoints, 0) || 9000,
  };

  const handleModeSwitch = (mode: 'detailed' | 'express') => {
    onChangeProfile({
      careerMode: mode,
      expressData: {
        totalQuarters: career.reduce((s, r) => s + r.validatedQuarters, 0) || expressData.totalQuarters,
        contributedQuarters: career.reduce((s, r) => s + r.contributedQuarters, 0) || expressData.contributedQuarters,
        estimatedSam: sam || expressData.estimatedSam,
        agircPoints: career.reduce((s, r) => s + r.agircPoints, 0) || expressData.agircPoints,
      },
    });
  };

  const handleUpdateExpress = (field: keyof typeof expressData, value: number) => {
    const nextData = { ...expressData, [field]: value };
    // Synchroniser si contributedQuarters doit suivre
    if (field === 'totalQuarters' && expressData.contributedQuarters === expressData.totalQuarters) {
      nextData.contributedQuarters = value;
    }
    onChangeProfile({ expressData: nextData });
  };

  // Recalcul d'une ligne du tableau détaillé
  const updateCareerRow = (index: number, changes: Partial<CareerYear>) => {
    const nextCareer = [...career];
    const currentRow = { ...nextCareer[index], ...changes };

    const grossIncomeEur =
      currentRow.currency === 'FRF'
        ? Number((currentRow.grossIncome / FRF_TO_EUR_RATE).toFixed(2))
        : currentRow.grossIncome;

    const passEur = getPassForYear(currentRow.year);
    const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
    const cnavCoeff = getCnavCoeff(currentRow.year, liquidationYear);
    const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

    nextCareer[index] = {
      ...currentRow,
      grossIncomeEur,
      passEur,
      retainedSalaryEur,
      cnavCoeff,
      revaluedSalaryEur,
    };

    onChangeCareer(nextCareer);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onImportCsv(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalValidated = career.reduce((s, r) => s + r.validatedQuarters, 0);
  const totalContributed = career.reduce((s, r) => s + r.contributedQuarters, 0);
  const totalPoints = career.reduce((s, r) => s + r.agircPoints, 0);

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
                Actif (Cas Sakura)
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Relevé complet détaillé</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Historique annuel complet (1979-2024), conversions FRF/EUR, plafonnement PASS et sélection des meilleures années.
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
                value={expressData.totalQuarters}
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
                value={expressData.contributedQuarters}
                onChange={(e) =>
                  handleUpdateExpress(
                    'contributedQuarters',
                    Math.max(0, parseInt(e.target.value, 10) || 0)
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
                  value={expressData.estimatedSam}
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
                value={expressData.agircPoints}
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
                {career.length} années enregistrées • {totalValidated} trimestres validés
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {totalContributed} trimestres cotisés (RACL) •{' '}
                {totalPoints.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts Agirc-Arrco •{' '}
                SAM calculé ≈ <strong>{sam.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                title="Exporter le relevé"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                title="Importer un fichier CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer</span>
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

          {/* Bouton Accordéon dépliable pour le tableau (FERMÉ PAR DÉFAUT) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetailedTable(!showDetailedTable)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-100/70 hover:bg-slate-100 transition-colors text-left font-bold text-xs text-slate-700"
            >
              <span className="flex items-center gap-2">
                <span>{showDetailedTable ? 'Masquer' : 'Voir / modifier'} le tableau détaillé année par année (1979-2024)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Top {samYearsCount} SAM identifié
                </span>
              </span>
              {showDetailedTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetailedTable && (
              <div className="overflow-x-auto max-h-96 p-2 border-t border-slate-200">
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
                      <th className="py-2 px-2 text-center">Top {samYearsCount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {career.map((row, idx) => (
                      <tr
                        key={row.year}
                        className={`hover:bg-slate-50 ${
                          row.isTopYear ? 'bg-amber-50/50 font-medium' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.year}</td>
                        <td className="py-1.5 px-2">
                          <select
                            value={row.currency}
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
                            onChange={(e) =>
                              updateCareerRow(idx, { grossIncome: parseFloat(e.target.value) || 0 })
                            }
                            className="w-24 text-right text-[11px] bg-white border border-slate-200 rounded px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">
                          {row.passEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-700">
                          {row.retainedSalaryEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-500">
                          {row.cnavCoeff.toFixed(3)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-institution-800">
                          {row.revaluedSalaryEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={row.validatedQuarters}
                            onChange={(e) =>
                              updateCareerRow(idx, {
                                validatedQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)),
                              })
                            }
                            className="w-9 text-center text-[11px] bg-white border border-slate-200 rounded py-0.5 font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={row.contributedQuarters}
                            onChange={(e) =>
                              updateCareerRow(idx, {
                                contributedQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)),
                              })
                            }
                            className="w-9 text-center text-[11px] bg-white border border-slate-200 rounded py-0.5 text-tealbrand-700 font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">
                          {row.agircPoints.toFixed(1)}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {row.isTopYear && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                              Top {samYearsCount}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { AgircLegacyRegime, CalculationResult, CareerYear, UserProfile, Currency, LongCareerResult, SamAnalysis, SamIncomeKind, SamYear } from '../../types/retirement';
import { samIncomeKind } from '../../engine/annualSalary';
import { selectAgircRights } from '../../engine/agircArrco';
import { SamParametersNote } from '../common/SamParametersNote';
import { getPassForYear, FRF_TO_EUR_RATE } from '../../constants/passHistory';
import { getCnavCoeff } from '../../constants/cnavCoefficients';
import { FormulaTooltip } from '../common/FormulaTooltip';
import { validDate } from '../../utils/civilDates';
import {
  Zap,
  FileSpreadsheet,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  RotateCcw,
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
  onImportCsv: (csvText: string) => void;
  samAnalysis: SamAnalysis;
  longCareer: LongCareerResult;
  requiredQuarters: number;
  appliedRule: CalculationResult['appliedRule'];
  totalValidated: number;
  totalContributed: number;
}

export const Step2Career: React.FC<Step2CareerProps> = ({
  profile,
  career,
  onChangeProfile,
  onChangeCareer,
  onExportCsv,
  onImportCsv,
  samAnalysis,
  longCareer,
  requiredQuarters,
  appliedRule,
  totalValidated,
  totalContributed,
}) => {
  const isExpress = profile.careerMode === 'express';
  const sam = samAnalysis.amount;
  const samYearsCount = samAnalysis.yearLimit;
  const liquidationYear = new Date(profile.desiredDepartureDate).getUTCFullYear() || 2025;
  const hasScaleDates = validDate(profile.birthDate) && validDate(profile.desiredDepartureDate);
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const [showDetailedTable, setShowDetailedTable] = useState<boolean>(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recordedYears = new Set(career.map(({ year }) => year)).size;
  const agircCareer = selectAgircRights(career, profile.desiredDepartureDate);
  const totalPoints = agircCareer.rights.reduce((sum, row) => sum + row.agircPoints, 0);

  // Valeurs par défaut du mode express si non définies
  const expressData = profile.expressData || {
    totalQuarters: totalValidated || 170,
    contributedQuarters: totalContributed || 170,
    estimatedSam: sam || 40000,
    agircPoints: career.length ? totalPoints : 9000,
  };

  const handleModeSwitch = (mode: 'detailed' | 'express') => {
    if (mode === profile.careerMode) return;
    if (mode === 'detailed' || career.length === 0) {
      onChangeProfile({ careerMode: mode, expressData });
      return;
    }
    onChangeProfile({
      careerMode: mode,
      expressData: {
        totalQuarters: totalValidated,
        contributedQuarters: longCareer.contributedQuarters ?? totalContributed,
        estimatedSam: sam || expressData.estimatedSam,
        agircPoints: totalPoints,
        agircPointsBefore1999: agircCareer.rights.reduce((sum, row) => row.year < 1999 ? sum + row.agircPoints : sum, 0) || undefined,
        agircPoints1999To2011: agircCareer.rights.reduce((sum, row) => row.year >= 1999 && row.year < 2012 ? sum + row.agircPoints : sum, 0) || undefined,
      },
    });
  };

  const handleUpdateExpress = (field: keyof typeof expressData, value: number) => {
    const nextData = { ...expressData, [field]: value };
    if (field === 'totalQuarters' && expressData.contributedQuarters === expressData.totalQuarters) {
      nextData.contributedQuarters = value;
    }
    if (field === 'agircPoints' && (expressData.agircPointsBefore1999 ?? 0) + (expressData.agircPoints1999To2011 ?? 0) > value) {
      nextData.agircPointsBefore1999 = undefined;
      nextData.agircPoints1999To2011 = undefined;
    }
    onChangeProfile({ expressData: nextData });
  };

  const updateCareerRow = (index: number, changes: Partial<CareerYear>) => {
    const nextCareer = [...career];
    const currentRow = { ...nextCareer[index], ...changes };
    if (currentRow.year !== nextCareer[index].year) currentRow.agircPointsAtDeparture = undefined;

    const effectiveYear = currentRow.year || 2000;
    const grossIncomeEur =
      currentRow.currency === 'FRF'
        ? Number((currentRow.grossIncome / FRF_TO_EUR_RATE).toFixed(2))
        : currentRow.grossIncome;

    const passEur = getPassForYear(effectiveYear);
    const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
    const cnavCoeff = getCnavCoeff(effectiveYear, liquidationYear);
    const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

    nextCareer[index] = {
      ...currentRow,
      year: effectiveYear,
      grossIncomeEur,
      passEur,
      retainedSalaryEur,
      cnavCoeff,
      revaluedSalaryEur,
    };

    // Conserver le tri chronologique si l'année a changé
    if (changes.year !== undefined) {
      nextCareer.sort((a, b) => a.year - b.year);
    }

    onChangeCareer(nextCareer);
  };

  // Ajout manuel d'une nouvelle année
  const handleAddYear = () => {
    const maxYear = career.length > 0 ? Math.max(...career.map((c) => c.year)) : liquidationYear - 1;
    const newYear = maxYear + 1;
    const passEur = getPassForYear(newYear);
    const cnavCoeff = getCnavCoeff(newYear, liquidationYear);

    const newRow: CareerYear = {
      year: newYear,
      currency: newYear < 2002 ? 'FRF' : 'EUR',
      grossIncome: 30000,
      grossIncomeEur: 30000,
      passEur,
      retainedSalaryEur: Math.min(30000, passEur),
      cnavCoeff,
      revaluedSalaryEur: Number((Math.min(30000, passEur) * cnavCoeff).toFixed(2)),
      regime: 'CNAV',
      validatedQuarters: 4,
      contributedQuarters: 4,
      agircPoints: 120,
      eventType: 'Activité',
    };

    const nextCareer = [...career, newRow].sort((a, b) => a.year - b.year);
    onChangeCareer(nextCareer);
    setShowDetailedTable(true);
  };

  // Suppression d'une ligne
  const handleDeleteYear = (index: number) => {
    const nextCareer = career.filter((_, i) => i !== index);
    onChangeCareer(nextCareer);
  };

  // Vider tout le tableau
  const handleClearCareer = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider l'ensemble du relevé de carrière ?")) {
      onChangeCareer([]);
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Titre et intention */}
      <div className="text-center space-y-1 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-institution-50 text-institution-700 text-xs font-semibold border border-institution-200 mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Étape 2 sur 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Votre carrière & vos salaires
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Choisissez la méthode de saisie : relevé détaillé année par année (avec saisie manuelle) ou mode express.
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
                Actif (Relevé complet)
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Relevé détaillé annuel</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Saisie ou modification des salaires ligne par ligne, devises EUR/FRF, trimestres et points Agirc-Arrco.
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
          <h3 className="font-extrabold text-slate-900 text-base">Mode Express</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Remplissez directement les 4 totaux clés (trimestres, SAM estimé, points) pour une estimation instantanée.
          </p>
        </button>
      </div>

      {/* ── CONTENU MODE EXPRESS ── */}
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
                <label htmlFor="express-validated-quarters" className="text-xs font-bold text-slate-700">
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
                id="express-validated-quarters"
                aria-describedby="express-required-quarters"
                aria-invalid={Boolean(longCareer.inputError)}
                type="number"
                min="0"
                max="200"
                value={expressData.totalQuarters}
                onChange={(e) =>
                  handleUpdateExpress('totalQuarters', Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-4 focus:ring-tealbrand-50 focus:outline-none font-mono"
              />
              <p id="express-required-quarters" className="text-[11px] text-slate-600">
                {hasScaleDates
                  ? `${requiredQuarters} trimestres requis pour la génération ${profile.birthDate.slice(0, 4)} (${appliedRule})`
                  : 'Renseignez les dates de naissance et de départ pour connaître la durée requise.'}
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
                max={expressData.totalQuarters}
                aria-invalid={Boolean(longCareer.inputError)}
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
                Le total cotisé ou réputé cotisé doit être compris dans le total validé.
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
                  formula={`Moyenne des ${samYearsCount} meilleures années plafonnées au PASS et revalorisées`}
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
                <label htmlFor="express-agirc-points" className="text-xs font-bold text-slate-700">
                  Total des points Agirc-Arrco
                </label>
                <FormulaTooltip
                  title="Points Agirc-Arrco"
                  formula="Total des points × Valeur du point à la date de départ"
                  explanation="Nombre de points inscrits sur votre relevé de situation individuelle (RIS)."
                  articleCss="Accord ANI Agirc-Arrco"
                />
              </div>
              <input
                id="express-agirc-points"
                type="number"
                min="0"
                step="0.01"
                value={expressData.agircPoints}
                onChange={(e) =>
                  handleUpdateExpress('agircPoints', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full px-3.5 py-2.5 text-base font-bold text-indigo-800 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-4 focus:ring-tealbrand-50 focus:outline-none font-mono"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ['agircPointsBefore1999', 'agircPoints1999To2011', 'Points avant 1999'],
                  ['agircPoints1999To2011', 'agircPointsBefore1999', 'Points de 1999 à 2011'],
                ] as const).map(([field, otherField, label]) => {
                  const remaining = Math.max(0, expressData.agircPoints - (expressData[otherField] ?? 0));
                  return (
                    <label key={field} className="text-xs font-semibold text-slate-700">
                      {label}
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        step="0.01"
                        value={expressData[field] ?? ''}
                        onChange={(event) => onChangeProfile({
                          expressData: {
                            ...expressData,
                            [field]: event.target.value === '' ? undefined : Math.min(remaining, Math.max(0, event.target.valueAsNumber)),
                          },
                        })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-600">
                Saisissez le total des points acquis avant la date de départ. La ventilation est facultative.
                Les points antérieurs à 2012 sont supposés Arrco.
                Le solde est traité comme acquis depuis 2012, à 10 % dès trois enfants nés ou élevés.
              </p>
              {agircCareer.pending && expressData.agircPoints === totalPoints && (
                <p className="text-xs font-semibold text-amber-800">
                  Le total repris du relevé omet les points de l’année de départ à confirmer. Complétez-le si vous disposez du total à la date simulée.
                </p>
              )}
            </div>
          </div>
          {longCareer.inputError && <p role="alert" className="text-sm text-rose-800">{longCareer.inputError}</p>}
        </div>
      )}

      {/* ── CONTENU MODE RELEVÉ DÉTAILLÉ & MANUEL ── */}
      {!isExpress && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          {/* Synthèse du relevé */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Synthèse du relevé de carrière
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {recordedYears} années enregistrées • {totalValidated} trimestres validés
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {totalContributed} trimestres cotisés par l’activité •{' '}
                {totalPoints.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts Agirc-Arrco retenus •{' '}
                SAM · <strong>{samAnalysis.source === 'unavailable' ? 'indisponible' : euro.format(sam)}</strong>
              </div>
              {agircCareer.pending && (
                <p role="status" className="mt-1 text-xs font-semibold text-amber-800">
                  Confirmez les points acquis avant votre départ pour l’année {liquidationYear}.
                </p>
              )}
              {longCareer.possibleContributedQuarters !== undefined && (
                <p className="mt-1 text-xs text-slate-600">
                  Carrière longue · {longCareer.contributedQuarters} trimestres retenus sur {longCareer.requiredQuarters} requis,
                  jusqu’à {longCareer.possibleContributedQuarters} si la caisse confirme les périodes assimilées.
                </p>
              )}
            </div>

            {/* Actions : Ajout manuel, Export, Import, Reset */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleAddYear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-institution-700 hover:bg-institution-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                title="Ajouter une année de salaire"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une année</span>
              </button>
              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                title="Exporter le relevé en CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                title="Importer un fichier CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer</span>
              </button>
              {career.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCareer}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                  title="Vider tout le relevé"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Vider</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".csv,text/csv"
                className="hidden"
              />
            </div>
          </div>

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

          {/* Tableau détaillé modifiable année par année */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetailedTable(!showDetailedTable)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-100/70 hover:bg-slate-100 transition-colors text-left font-bold text-xs text-slate-700"
            >
              <span className="flex items-center gap-2">
                <span>{showDetailedTable ? 'Masquer' : 'Afficher'} le tableau détaillé (saisie et modification manuelle)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {samAnalysis.topYears.length} / {samAnalysis.yearLimit} années retenues
                </span>
              </span>
              {showDetailedTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetailedTable && (
              <div>
                {career.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-3">
                    <p className="text-sm">
                      Aucune année de carrière enregistrée.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddYear}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-institution-700 hover:bg-institution-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une première année de salaire</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[28rem] p-2 border-t border-slate-200">
                    <p className="mb-2 text-xs text-slate-600">
                      Pour une année avec interruption, sélectionnez « Revenu inscrit au compte » si le montant
                      correspond à un salaire ou à une indemnité admissible portée au relevé.
                    </p>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 sticky top-0 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2 px-2">Année</th>
                          <th className="py-2 px-1.5">Devise</th>
                          <th className="py-2 px-2 text-right">Revenu brut</th>
                          <th className="py-2 px-1.5">Régime</th>
                          <th className="py-2 px-1.5">Traitement SAM</th>
                          <th className="py-2 px-2 text-right">PASS</th>
                          <th className="py-2 px-2 text-right">Retenu (€)</th>
                          <th className="py-2 px-1.5 text-right">Coeff</th>
                          <th className="py-2 px-2 text-right font-bold">Revalorisé (€)</th>
                          <th className="py-2 px-1.5 text-center">Trim. V</th>
                          <th className="py-2 px-1.5 text-center">Trim. cotisés</th>
                          <th className="py-2 px-2 text-right">Points</th>
                          <th className="py-2 px-1.5 text-center">Top {samYearsCount}</th>
                          <th className="py-2 px-1 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {career.map((row, idx) => (
                          <tr
                            key={`${row.year}-${idx}`}
                            className={`hover:bg-slate-50 ${
                              samAnalysis.topYears.includes(row.year) ? 'bg-amber-50/50 font-medium' : ''
                            }`}
                          >
                            {/* Année modifiable */}
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="1950"
                                max="2035"
                                value={row.year}
                                onChange={(e) =>
                                  updateCareerRow(idx, {
                                    year: parseInt(e.target.value, 10) || row.year,
                                  })
                                }
                                className="w-16 font-bold text-slate-800 text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5"
                              />
                            </td>

                            {/* Devise avec conversion automatique */}
                            <td className="py-1.5 px-1.5">
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

                            {/* Revenu brut modifiable */}
                            <td className="py-1.5 px-2 text-right font-mono">
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={row.grossIncome}
                                aria-label={`Revenu brut ${row.year}`}
                                onChange={(e) =>
                                  updateCareerRow(idx, { grossIncome: Math.max(0, parseFloat(e.target.value) || 0) })
                                }
                                className="w-24 text-right text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold"
                              />
                            </td>

                            <td className="px-1.5 text-slate-700">{row.regime}</td>

                            <td className="px-1.5">
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

                            {/* PASS calculé */}
                            <td className="py-1.5 px-2 text-right font-mono text-slate-400">
                              {row.passEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                            </td>

                            {/* Salaire retenu (€) */}
                            <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                              {row.retainedSalaryEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                            </td>

                            {/* Coefficient CNAV 2025 */}
                            <td className="py-1.5 px-1.5 text-right font-mono text-slate-500">
                              {row.cnavCoeff.toFixed(3)}
                            </td>

                            {/* Salaire revalorisé (€) */}
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-institution-800">
                              {row.revaluedSalaryEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                            </td>

                            {/* Trimestres validés modifiables */}
                            <td className="py-1.5 px-1.5 text-center">
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

                            {/* Trimestres cotisés modifiables */}
                            <td className="py-1.5 px-1.5 text-center">
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

                            {/* Points Agirc-Arrco modifiables */}
                            <td className="py-1.5 px-2 text-right font-mono">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                aria-label={`Points annuels Agirc-Arrco en ${row.year}`}
                                value={row.agircPoints}
                                onChange={(e) =>
                                  updateCareerRow(idx, {
                                    agircPoints: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-16 text-right text-[11px] bg-white border border-slate-200 rounded px-1 py-0.5"
                              />
                              {row.year === liquidationYear && !profile.desiredDepartureDate.endsWith('-01-01') && (
                                <label className="mt-1 block text-left font-sans text-[11px] text-slate-600">
                                  Points acquis avant le départ
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.agircPointsAtDeparture?.date === profile.desiredDepartureDate ? row.agircPointsAtDeparture.points : ''}
                                    onChange={(event) => updateCareerRow(idx, {
                                      agircPointsAtDeparture: event.target.value === '' ? undefined : {
                                        date: profile.desiredDepartureDate,
                                        points: Math.max(0, event.target.valueAsNumber),
                                      },
                                    })}
                                    className="mt-0.5 w-full rounded border border-slate-200 px-1 py-0.5"
                                  />
                                </label>
                              )}
                              {row.year < 2012 && (
                                <select
                                  aria-label={`Ancien régime Agirc-Arrco en ${row.year}`}
                                  value={row.agircLegacyRegime ?? ''}
                                  onChange={(event) => updateCareerRow(idx, {
                                    agircLegacyRegime: (event.target.value || undefined) as AgircLegacyRegime | undefined,
                                  })}
                                  className="mt-1 block w-full rounded border border-slate-200 bg-white px-1 py-0.5 font-sans text-[11px]"
                                >
                                  <option value="">Caisse inconnue</option>
                                  <option value="arrco">{row.year < 1999 ? 'Arrco avec majoration' : 'Arrco'}</option>
                                  <option value="agirc">Agirc</option>
                                  {row.year < 1999 && <option value="camarca">Camarca</option>}
                                  {row.year < 1999 && <option value="noBonus">Caisse sans majoration</option>}
                                </select>
                              )}
                            </td>

                            {/* Badge Top N */}
                            <td className="py-1.5 px-1.5 text-center">
                              {samAnalysis.topYears.includes(row.year) && (
                                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">
                                  Top {samYearsCount}
                                </span>
                              )}
                            </td>

                            {/* Bouton Supprimer */}
                            <td className="py-1.5 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteYear(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Supprimer cette année"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Bouton d'ajout en bas du tableau */}
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <button
                        type="button"
                        onClick={handleAddYear}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-institution-700" />
                        <span>Ajouter une année supplémentaire</span>
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Total : {recordedYears} années enregistrées
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { CalculationResult, UserProfile } from '../../types/retirement';
import { SimpleTooltip } from '../common/SimpleTooltip';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface Step4BilanProps {
  result: CalculationResult;
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  onModifySimulation: () => void;
}

export const Step4Bilan: React.FC<Step4BilanProps> = ({
  result,
  profile,
  onChangeProfile,
  onModifySimulation,
}) => {
  const [showFormulasAccordion, setShowFormulasAccordion] = useState(false);
  const cer = result.cerAnalysis;

  // Données Graphique Unique Épuré : Dernier salaire vs Pension
  const chartData = [
    {
      name: 'Rémunération vs Retraite',
      'Dernier salaire brut': profile.lastGrossMonthlySalary,
      'Retraite de base (LURA)': result.basePensionMonthlyGross,
      'Agirc-Arrco': result.agircMonthlyGross,
    },
  ];

  // Actions alternatives 1 clic pour le CER
  const handleShiftToLegalAge = () => {
    const [bYear, bMonth, bDay] = profile.birthDate.split('-').map(Number);
    const targetDate = new Date(
      bYear + result.legalAge.years,
      bMonth - 1 + result.legalAge.months,
      bDay || 1
    );
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    onChangeProfile({ desiredDepartureDate: `${y}-${m}-${d}` });
  };

  const handleSwitchToNewEmployer = () => {
    onChangeProfile({ cerFormerEmployer: false });
  };

  const replacementRate = profile.lastGrossMonthlySalary > 0
    ? ((result.totalMonthlyGross / profile.lastGrossMonthlySalary) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* 1. EN-HAUT : Statut + 2 Gros Chiffres + Taux de remplacement */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Ligne Statut Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {result.eligibilityStatus === 'eligible_taux_plein' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {result.isCarriereLongue ? 'Carrière Longue — Taux Plein (50 %)' : 'Taux Plein (50 %)'}
              </span>
            ) : result.eligibilityStatus === 'eligible_decote' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Départ avec décote ({result.decoteQuarters} trimestres)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <XCircle className="w-4 h-4 text-rose-600" />
                Âge d'ouverture non atteint
              </span>
            )}

            <span className="text-xs text-slate-500">
              Départ à {result.ageAtDeparture.formatted}
            </span>
          </div>

          <button
            type="button"
            onClick={onModifySimulation}
            className="text-xs font-semibold text-tealbrand-700 hover:text-tealbrand-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Modifier la saisie</span>
          </button>
        </div>

        {/* 2 Gros Chiffres : Total Brut & Net estimé */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Total Brut */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Retraite Brut
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {result.totalMonthlyGross.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} <span className="text-lg font-semibold text-slate-500">€/m</span>
            </div>
          </div>

          {/* Net Estimé */}
          <div className="p-4 rounded-xl bg-tealbrand-50/60 border border-tealbrand-200 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-tealbrand-800 block mb-1">
              Net Estimé
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-tealbrand-900 tracking-tight">
              {result.totalMonthlyNet.toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} <span className="text-lg font-semibold text-tealbrand-700">€/m</span>
            </div>
          </div>

          {/* Taux de remplacement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Taux de remplacement
            </span>
            <div className="text-2xl font-extrabold text-slate-800">
              {replacementRate} %
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">du dernier salaire</span>
          </div>
        </div>
      </div>

      {/* 2. AU MILIEU : 2 Petites cartes chiffrées + 1 Graphique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Les 2 Petites cartes (Base & Agirc) */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Carte Retraite de base */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tealbrand-500"></span>
                Retraite de Base (Assurance Retraite)
                <SimpleTooltip
                  term="Pension de base"
                  explanation="SAM × Taux (50 %) × Proratisation × Majoration enfants."
                />
              </span>
              <span className="text-xs font-bold text-slate-900">
                {result.basePensionMonthlyGross.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} €/m
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>SAM : {Math.round(result.sam).toLocaleString('fr-FR')} €</span>
              {result.baseChildBonusMonthly > 0 && (
                <span className="text-tealbrand-700 font-semibold">
                  dont +{result.baseChildBonusMonthly.toFixed(2)} € (+10 %)
                </span>
              )}
            </div>
          </div>

          {/* Carte Agirc-Arrco */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-institution-500"></span>
                Retraite Complémentaire (Agirc-Arrco)
                <SimpleTooltip
                  term="Agirc-Arrco"
                  explanation="Points × Valeur du point (1,4386 €) × Majoration enfants."
                />
              </span>
              <span className="text-xs font-bold text-slate-900">
                {result.agircMonthlyGross.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} €/m
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>{result.agircTotalPoints.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} points</span>
              {result.agircChildBonusMonthly > 0 && (
                <span className="text-institution-700 font-semibold">
                  dont +{result.agircChildBonusMonthly.toFixed(2)} € (+10 %)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1 Seul Graphique : Dernier salaire vs Retraite */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Comparatif Revenu vs Retraite
          </span>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} hide />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val} €`} />
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} €`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Dernier salaire brut" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Retraite de base (LURA)" stackId="pension" fill="#0d9488" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Agirc-Arrco" stackId="pension" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. SI REPRISE ACTIVÉE : 1 Bandeau d'alerte court (max 12 mots) + 2 Boutons rapides */}
      {profile.cerEnabled && cer.alertLevel === 'RED' && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 shadow-xs space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-rose-900">
              Carence de 6 mois non respectée : pensions suspendues.
            </span>
            <SimpleTooltip
              term="Art. L. 161-22 CSS"
              explanation="La reprise chez l'ancien employeur avant 6 mois suspend le versement des pensions jusqu'au 6e mois."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSwitchToNewEmployer}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-900 border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
            >
              Tester un autre employeur
            </button>
            <button
              type="button"
              onClick={handleShiftToLegalAge}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs"
            >
              Tester à l'âge légal ({result.legalAge.formatted})
            </button>
          </div>
        </div>
      )}

      {profile.cerEnabled && cer.alertLevel === 'GREEN' && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Cumul Emploi-Retraite validé : pensions et salaire intégralement cumulés.</span>
        </div>
      )}

      {/* 4. EN BAS : 1 Accordéon fermé par défaut pour le jury */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFormulasAccordion(!showFormulasAccordion)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-bold text-slate-800">
            Voir le détail des calculs (SAM, taux, barèmes)
          </span>
          {showFormulasAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showFormulasAccordion && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <strong className="block text-slate-900 mb-1">Formule Retraite de Base :</strong>
                <code className="text-[11px] bg-white p-2 rounded border border-slate-200 block font-mono text-slate-800">
                  SAM × 50% × ({result.totalValidatedQuarters}/{result.requiredQuarters}) × 1,10 = {result.basePensionMonthlyGross.toFixed(2)} €/m
                </code>
              </div>
              <div>
                <strong className="block text-slate-900 mb-1">Formule Agirc-Arrco :</strong>
                <code className="text-[11px] bg-white p-2 rounded border border-slate-200 block font-mono text-slate-800">
                  {result.agircTotalPoints.toFixed(2)} pts × 1,4386 € × 1,10 / 12 = {result.agircMonthlyGross.toFixed(2)} €/m
                </code>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Réglementation : Art. L. 351-1 CSS (Base) • ANI 2019-2023 (Agirc-Arrco) • Art. L. 161-22 CSS (CER).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

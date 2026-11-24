import React from 'react';
import { UserProfile, CalculationResult } from '../../types/retirement';
import { FormulaTooltip } from '../common/FormulaTooltip';
import {
  Calendar,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Euro,
  Info,
  Clock,
  Building,
  UserCheck,
  Ban,
  ArrowRight,
} from 'lucide-react';

interface Step4DepartureAndCerProps {
  profile: UserProfile;
  calculationResult: CalculationResult;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
}

export const Step4DepartureAndCer: React.FC<Step4DepartureAndCerProps> = ({
  profile,
  calculationResult,
  onChangeProfile,
}) => {
  // Parsing date départ (YYYY-MM-DD)
  const departureDate = profile.desiredDepartureDate || '2025-01-01';
  const [depYear, depMonth] = departureDate.split('-');

  const handleDateChange = (year: string, month: string) => {
    const formattedDate = `${year}-${month.padStart(2, '0')}-01`;
    onChangeProfile({ desiredDepartureDate: formattedDate });
  };

  const months = [
    { value: '01', label: '01 - Janvier' },
    { value: '02', label: '02 - Février' },
    { value: '03', label: '03 - Mars' },
    { value: '04', label: '04 - Avril' },
    { value: '05', label: '05 - Mai' },
    { value: '06', label: '06 - Juin' },
    { value: '07', label: '07 - Juillet' },
    { value: '08', label: '08 - Août' },
    { value: '09', label: '09 - Septembre' },
    { value: '10', label: '10 - Octobre' },
    { value: '11', label: '11 - Novembre' },
    { value: '12', label: '12 - Décembre' },
  ];

  // Années proposées : de 2024 à 2035
  const years = Array.from({ length: 12 }, (_, i) => String(2024 + i));

  // Parsing CER reprise date
  const cerDate = profile.cerResumptionDate || '2025-02-01';
  const [cerYear, cerMonth] = cerDate.split('-');

  const handleCerDateChange = (year: string, month: string) => {
    const formattedDate = `${year}-${month.padStart(2, '0')}-01`;
    onChangeProfile({ cerResumptionDate: formattedDate });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-1 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-institution-50 text-institution-700 text-xs font-semibold border border-institution-200 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          Étape 4 sur 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Date de départ & Cumul Emploi-Retraite
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Choisissez quand liquider votre retraite et définissez si vous souhaitez continuer à travailler.
        </p>
      </div>

      {/* BLOC 1 : DATE DE DÉPART SOUHAITÉE & DERNIER SALAIRE */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-institution-600" />
              Date de départ en retraite souhaitée
            </label>
            <FormulaTooltip
              title="Date d'effet de la retraite"
              formula="La retraite prend effet le 1er jour du mois suivant la demande (ou la date choisie par l'assuré si postérieure)."
              articleCss="Art. R. 351-37 du Code de la Sécurité Sociale"
            
              explanation=""
            />
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Mois</label>
              <select
                value={depMonth}
                onChange={(e) => handleDateChange(depYear, e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-institution-500 bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Année</label>
              <select
                value={depYear}
                onChange={(e) => handleDateChange(e.target.value, depMonth)}
                className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-institution-500 bg-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicateur Âge légal vs Âge au départ */}
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Âge au départ :</span>
              <strong className="text-slate-900">{calculationResult.ageAtDeparture.formatted}</strong>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span>Âge légal de départ :</span>
              <strong className="text-institution-700">{calculationResult.legalAge.formatted}</strong>
              <span className="text-[11px] text-slate-400">({calculationResult.appliedRule})</span>
            </div>
          </div>
        </div>

        {/* Dernier salaire mensuel brut */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Euro className="w-4 h-4 text-institution-600" />
              Dernier salaire mensuel brut d'activité
            </label>
            <FormulaTooltip
              title="Dernier salaire brut"
              formula="Sert de référence pour calculer le taux de remplacement et le plafond du Cumul Emploi-Retraite plafonné (Art. L. 161-22 CSS)."
            
              explanation=""
            />
          </div>
          <div className="relative max-w-xs">
            <input
              type="number"
              min={0}
              step={50}
              value={profile.lastGrossMonthlySalary}
              onChange={(e) =>
                onChangeProfile({
                  lastGrossMonthlySalary: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-institution-500 pr-10"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              € / mois
            </span>
          </div>
        </div>
      </div>

      {/* BLOC 2 : PROJET CUMUL EMPLOI-RETRAITE (CER) */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
            <Briefcase className="w-5 h-5 text-institution-600" />
            Souhaitez-vous retravailler après la liquidation de votre retraite ?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dispositif de Cumul Emploi-Retraite (CER) régi par les articles L. 161-22 et L. 161-22-1-1 du CSS.
          </p>
        </div>

        {/* 2 Grandes Cartes Oui / Non */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* NON */}
          <button
            type="button"
            onClick={() => onChangeProfile({ cerEnabled: false })}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              !profile.cerEnabled
                ? 'border-institution-600 bg-institution-50/40 ring-2 ring-institution-500 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  !profile.cerEnabled ? 'bg-institution-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Ban className="w-5 h-5" />
              </div>
              {!profile.cerEnabled && (
                <span className="text-xs font-bold text-institution-700 bg-institution-100 px-2 py-0.5 rounded-full">
                  Sélectionné
                </span>
              )}
            </div>
            <div className="font-bold text-slate-900 text-base">
              Non, je cesse toute activité
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Je perçois uniquement mes pensions de retraite (Base + Agirc-Arrco) sans revenus professionnels complémentaires.
            </p>
          </button>

          {/* OUI */}
          <button
            type="button"
            onClick={() => onChangeProfile({ cerEnabled: true })}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              profile.cerEnabled
                ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  profile.cerEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              {profile.cerEnabled && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Sélectionné
                </span>
              )}
            </div>
            <div className="font-bold text-slate-900 text-base">
              Oui, je souhaite reprendre une activité (CER)
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Je cumule mes pensions avec un salaire d'activité pour compléter mes revenus ou créer de nouveaux droits.
            </p>
          </button>
        </div>

        {/* Formulaire CER si OUI */}
        {profile.cerEnabled && (
          <div className="bg-white rounded-2xl border-2 border-emerald-300 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm pb-3 border-b border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Paramètres de votre reprise d'activité (Cumul Emploi-Retraite)
            </div>

            {/* Q1: Date de reprise */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-900 block mb-2">
                1. Date prévisionnelle de reprise d'activité
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <select
                  value={cerMonth}
                  onChange={(e) => handleCerDateChange(cerYear, e.target.value)}
                  className="px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={cerYear}
                  onChange={(e) => handleCerDateChange(e.target.value, cerMonth)}
                  className="px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Q2: Reprise chez le dernier employeur ? */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-600" />
                  2. Reprenez-vous chez votre dernier employeur ?
                </label>
                <FormulaTooltip
                  title="Délai de carence de 6 mois (Art. L. 161-22 CSS)"
                  formula="En CER plafonné (taux plein non atteint à l'âge légal), la reprise chez le même employeur impose un délai d'attente de 6 mois. À défaut, le versement de toutes les pensions est suspendu."
                  articleCss="Art. L. 161-22 alinéa 2 du Code de la Sécurité Sociale"
                
              explanation=""
            />
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => onChangeProfile({ cerFormerEmployer: true })}
                  className={`py-2.5 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${
                    profile.cerFormerEmployer
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Oui (Même employeur)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeProfile({ cerFormerEmployer: false })}
                  className={`py-2.5 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${
                    !profile.cerFormerEmployer
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Non (Nouvel employeur)
                </button>
              </div>
            </div>

            {/* Q3: Nouveau salaire mensuel brut envisagé */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-900 block mb-2">
                3. Salaire mensuel brut d'activité envisagé
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={profile.cerNewGrossMonthlySalary}
                  onChange={(e) =>
                    onChangeProfile({
                      cerNewGrossMonthlySalary: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  € / mois
                </span>
              </div>
            </div>

            {/* Message de vigilance immédiat si même employeur */}
            {profile.cerFormerEmployer && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Point de vigilance juridique (Délai de 6 mois) :</span>
                  Si vous n'avez pas atteint l'âge légal et le taux plein, reprendre chez le même employeur
                  moins de 6 mois après votre départ suspend le versement de vos pensions (Art. L. 161-22 CSS).
                  Le Bilan à l'étape suivante vous proposera des alternatives immédiates en 1 clic.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

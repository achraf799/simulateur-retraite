import React from 'react';
import { UserProfile, CalculationResult } from '../../types/retirement';
import { retirementDateIssue } from '../../utils/civilDates';
import { FormulaTooltip } from '../common/FormulaTooltip';
import {
  Calendar,
  Briefcase,
  CheckCircle2,
  Euro,
  Info,
  Clock,
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
  const departureDate = profile.desiredDepartureDate;
  const [draft, setDraft] = React.useState({ year: '', month: '' });
  const [depYear, depMonth] = departureDate ? departureDate.split('-') : [draft.year, draft.month];
  const dateIssue = retirementDateIssue(profile.birthDate, departureDate);

  const handleDateChange = (year: string, month: string) => {
    setDraft({ year, month });
    onChangeProfile({ desiredDepartureDate: year && month ? `${year}-${month}-01` : '' });
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

  const cerYear = (profile.cerResumptionDate || departureDate).slice(0, 4);

  const cer = calculationResult.cerAnalysis;
  const isNewCer = cer.regime === 'from2027';
  const inputClass = 'mt-1 block w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm';
  const periodDate = (date: string) => date.split('-').reverse().join('/');

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
              <label htmlFor="retirement-month" className="text-[11px] font-semibold text-slate-500 mb-1 block">Mois</label>
              <select
                id="retirement-month"
                value={depMonth}
                onChange={(e) => handleDateChange(depYear, e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-institution-500 bg-white"
              >
                <option value="">Choisir le mois</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="retirement-year" className="text-[11px] font-semibold text-slate-500 mb-1 block">Année</label>
              <select
                id="retirement-year"
                value={depYear}
                onChange={(e) => handleDateChange(e.target.value, depMonth)}
                className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-institution-500 bg-white"
              >
                <option value="">Choisir l’année</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dateIssue ? (
            <p className="mt-4 text-sm text-slate-600">{dateIssue}</p>
          ) : (
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
          )}
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
              value={profile.lastGrossMonthlySalary || ''}
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

            <label className="block text-sm font-semibold sm:max-w-xs">
              Date prévisionnelle de reprise d’activité
              <input
                type="date"
                min={profile.desiredDepartureDate}
                value={profile.cerResumptionDate}
                onChange={(e) => onChangeProfile({
                  cerResumptionDate: e.target.value,
                  cerActivityEndDate: undefined,
                  cerIncomeByPeriod: undefined,
                })}
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Date d’effet de votre première retraite de base
                <input
                  type="date"
                  max={profile.desiredDepartureDate}
                  value={profile.cerFirstBasePensionDate ?? ''}
                  onChange={(e) => onChangeProfile({ cerFirstBasePensionDate: e.target.value || undefined })}
                  className={inputClass}
                />
                <span className="mt-1 block text-xs font-normal text-slate-600">
                  Laissez vide si elle débute à la date de départ simulée.
                </span>
              </label>
              <label className="text-sm font-semibold">
                Toutes les pensions exigibles sont-elles liquidées à la reprise ?
                <select
                  value={profile.cerAllPensionsLiquidated === undefined ? '' : String(profile.cerAllPensionsLiquidated)}
                  onChange={(e) => onChangeProfile({
                    cerAllPensionsLiquidated: e.target.value === '' ? undefined : e.target.value === 'true',
                  })}
                  className={inputClass}
                >
                  <option value="">À confirmer</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </label>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={profile.cerSeparateComplementaryPension ?? false}
                onChange={(e) => onChangeProfile({ cerSeparateComplementaryPension: e.target.checked })}
                className="mt-1"
              />
              La date d’effet de ma retraite complémentaire diffère de celle de ma retraite de base.
            </label>

            {isNewCer ? (
              <div className="space-y-4">
                <label className="block text-sm font-semibold sm:max-w-xs">
                  Dernier mois d’activité simulé dans l’année de reprise
                  <input
                    type="month"
                    min={profile.cerResumptionDate.slice(0, 7)}
                    max={cerYear ? cerYear + '-12' : undefined}
                    value={profile.cerActivityEndDate?.slice(0, 7) ?? (cerYear ? cerYear + '-12' : '')}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-').map(Number);
                      const end = e.target.value
                        ? new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
                        : undefined;
                      onChangeProfile({ cerActivityEndDate: end, cerIncomeByPeriod: undefined });
                    }}
                    className={inputClass}
                  />
                </label>
                {cer.periods?.map((period) => (
                  <label key={period.band} className="block text-sm font-semibold">
                    Revenus bruts du {periodDate(period.startDate)} au {periodDate(period.endDate)} (€)
                    <span className="mt-1 block text-xs font-normal text-slate-600">
                      Total des revenus d’activité et des revenus de remplacement retenus pour cette période.
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={period.income ?? ''}
                      onChange={(e) => onChangeProfile({
                        cerIncomeByPeriod: {
                          ...profile.cerIncomeByPeriod,
                          [period.band]: e.target.value === '' ? undefined : Math.max(0, e.target.valueAsNumber),
                        },
                      })}
                      className={inputClass + ' sm:max-w-xs'}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={profile.cerFormerEmployer}
                    onChange={(e) => onChangeProfile({ cerFormerEmployer: e.target.checked })}
                  />
                  Je reprends chez mon dernier employeur.
                </label>
                {([
                  ['cerNewGrossMonthlySalary', 'Salaire mensuel brut après reprise (€)'],
                  ['cerPriorThreeMonthsAverage', 'Moyenne mensuelle brute des trois derniers mois d’activité (€)'],
                  ['cerLastRevaluedSalary', 'Dernier salaire mensuel revalorisé Agirc-Arrco (€)'],
                  ['cerLastTenYearsAverage', 'Moyenne mensuelle revalorisée sur dix ans Agirc-Arrco (€)'],
                ] as const).map(([field, label]) => (
                  <label key={field} className="text-sm font-semibold">
                    {label}
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={profile[field] ?? ''}
                      onChange={(e) => onChangeProfile({
                        [field]: e.target.value === ''
                          ? field === 'cerNewGrossMonthlySalary' ? 0 : undefined
                          : Math.max(0, e.target.valueAsNumber),
                      })}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            )}
            {cer.unavailable && <p role="status" className="text-sm text-amber-900">{cer.alertMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

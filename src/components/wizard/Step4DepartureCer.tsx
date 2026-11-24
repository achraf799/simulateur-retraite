import React from 'react';
import { CalculationResult, UserProfile } from '../../types/retirement';
import { SimpleTooltip } from '../common/SimpleTooltip';
import { Calendar, Briefcase, Building2, Euro, Check, Ban } from 'lucide-react';

interface Step4DepartureCerProps {
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  result: CalculationResult;
}

export const Step4DepartureCer: React.FC<Step4DepartureCerProps> = ({
  profile,
  onChangeProfile,
  result,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      {/* Titre & introduction épurée */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-tealbrand-50 text-tealbrand-700 mb-1">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Date de Départ & Projet « Et au-delà... »
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Fixez votre calendrier de liquidation et définissez votre projet éventuel de reprise d'activité.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Date de départ souhaitée */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
              Date de départ en retraite souhaitée
              <SimpleTooltip
                term="Date d'effet de la pension"
                explanation="La retraite prend effet le 1er jour du mois choisi. Elle fixe l'âge exact retenu pour vérifier les conditions de taux plein et de cumul."
              />
            </label>
            <span className="text-[11px] text-slate-400">1er jour du mois</span>
          </div>

          <input
            type="date"
            value={profile.desiredDepartureDate}
            onChange={(e) => onChangeProfile({ desiredDepartureDate: e.target.value })}
            className="w-full px-4 py-3 text-base font-bold text-slate-800 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-2 focus:ring-tealbrand-100 focus:outline-none transition-all"
          />

          {/* Indicateur immédiat sous la date */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span>Âge à la date choisie :</span>
              <strong className="text-slate-900 text-sm font-black">
                {result.ageAtDeparture.formatted}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200">
              <span>Âge légal de votre génération :</span>
              <span className="font-bold text-institution-700">
                {result.legalAge.formatted} ({result.requiredQuarters} trimestres)
              </span>
            </div>
            <div className="text-[11px] text-tealbrand-700 font-semibold pt-0.5">
              Règle appliquée : {result.appliedRule}
            </div>
          </div>
        </div>

        {/* Dernier salaire brut mensuel */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
              Dernier salaire brut mensuel
              <SimpleTooltip
                term="Dernier salaire brut"
                explanation="Sert de référence pour calculer le taux de remplacement et le plafond autorisé en cumul emploi-retraite plafonné."
              />
            </label>
            <span className="text-[11px] text-slate-400">Pour le taux de remplacement</span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="100"
              value={profile.lastGrossMonthlySalary}
              onChange={(e) =>
                onChangeProfile({
                  lastGrossMonthlySalary: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full pl-4 pr-10 py-3 text-base font-bold text-slate-800 rounded-xl border border-slate-300 focus:border-tealbrand-500 focus:ring-2 focus:ring-tealbrand-100 focus:outline-none"
            />
            <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">€/m</span>
          </div>
        </div>

        {/* 2. Question centrale : Souhaitez-vous reprendre un travail ? */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-tealbrand-600" />
              Souhaitez-vous reprendre un travail après votre départ ?
              <SimpleTooltip
                term="Cumul Emploi-Retraite (CER)"
                explanation="Permet de cumuler une pension de retraite avec les revenus d'une activité professionnelle, sous conditions d'âge et de délai de carence."
              />
            </label>
          </div>

          {/* 2 Grandes Cartes Cliquables (Non / Oui) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Carte Non */}
            <button
              type="button"
              onClick={() => onChangeProfile({ cerEnabled: false })}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                !profile.cerEnabled
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  !profile.cerEnabled ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">Non, retraite exclusive</span>
                <span className={`text-[11px] block mt-0.5 leading-snug ${!profile.cerEnabled ? 'text-slate-300' : 'text-slate-400'}`}>
                  Cessation définitive de toute activité rémunérée.
                </span>
              </div>
            </button>

            {/* Carte Oui */}
            <button
              type="button"
              onClick={() => onChangeProfile({ cerEnabled: true })}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                profile.cerEnabled
                  ? 'bg-tealbrand-50/50 border-tealbrand-600 text-slate-900 ring-2 ring-tealbrand-200 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  profile.cerEnabled ? 'bg-tealbrand-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">Oui, Cumul Emploi-Retraite</span>
                <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                  Reprise d'une activité salariée ou indépendante.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Si Oui : 3 champs clairs */}
        {profile.cerEnabled && (
          <div className="p-5 rounded-2xl bg-tealbrand-50/30 border border-tealbrand-200 space-y-5 animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-wider text-tealbrand-800 block">
              Paramètres de votre reprise d'activité (CER)
            </span>

            {/* Champ 1 : Date de reprise */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                1. Date de reprise d'activité souhaitée
              </label>
              <input
                type="date"
                value={profile.cerResumptionDate}
                onChange={(e) => onChangeProfile({ cerResumptionDate: e.target.value })}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:border-tealbrand-500 focus:ring-2 focus:ring-tealbrand-100 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 block">
                Départ en retraite prévu le {profile.desiredDepartureDate}
              </span>
            </div>

            {/* Champ 2 : Chez l'ancien employeur ? */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  2. Reprise chez votre ancien employeur ?
                </label>
                <SimpleTooltip
                  term="Délai de carence de 6 mois"
                  explanation="En cas de départ avant l'âge légal (ex: Carrière longue), reprendre chez l'ancien employeur avant 6 mois suspend les pensions de base et complémentaire."
                />
              </div>

              <div className="grid grid-cols-2 gap-2 h-11">
                <button
                  type="button"
                  onClick={() => onChangeProfile({ cerFormerEmployer: true })}
                  className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    profile.cerFormerEmployer
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Oui (Même employeur)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeProfile({ cerFormerEmployer: false })}
                  className={`rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    !profile.cerFormerEmployer
                      ? 'bg-tealbrand-600 text-white border-tealbrand-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Non (Nouvel employeur)</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                {profile.cerFormerEmployer
                  ? '⚠️ Soumis au délai de carence légal obligatoire de 6 mois (Art. L. 161-22 CSS).'
                  : '✓ Aucun délai de carence applicable chez un autre employeur.'}
              </p>
            </div>

            {/* Champ 3 : Nouveau salaire brut mensuel estimé */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                3. Nouveau salaire brut mensuel estimé
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  value={profile.cerNewGrossMonthlySalary}
                  onChange={(e) =>
                    onChangeProfile({
                      cerNewGrossMonthlySalary: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 rounded-xl border border-slate-300 bg-white focus:border-tealbrand-500 focus:ring-2 focus:ring-tealbrand-100 focus:outline-none"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">€/mois</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Sert à vérifier le respect du plafond de cumul en CER plafonné.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

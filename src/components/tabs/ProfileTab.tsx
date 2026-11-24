import React, { useState } from 'react';
import { UserProfile, CalculationResult } from '../../types/retirement';
import { decodeNir, formatNir } from '../../utils/nirHelper';
import { FormulaTooltip } from '../common/FormulaTooltip';
import { User, Calendar, Briefcase, Baby, Euro, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProfileTabProps {
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  result: CalculationResult;
  onNavigateToTab: (tabId: any) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onChangeProfile,
  result,
  onNavigateToTab,
}) => {
  const [nirError, setNirError] = useState<string | null>(null);

  const handleNirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    onChangeProfile({ nir: rawValue });

    const decoded = decodeNir(rawValue);
    if (decoded.valid && decoded.sex && decoded.birthYear && decoded.birthMonth) {
      setNirError(null);
      // Auto-update sex & birthDate (on preserve day from existing or default to 01)
      const currentDay = profile.birthDate ? profile.birthDate.split('-')[2] || '01' : '01';
      const formattedMonth = String(decoded.birthMonth).padStart(2, '0');
      const newBirthDate = `${decoded.birthYear}-${formattedMonth}-${currentDay}`;

      onChangeProfile({
        sex: decoded.sex,
        birthDate: newBirthDate,
      });
    } else if (rawValue.replace(/\s+/g, '').length >= 5) {
      setNirError(decoded.errorMessage || 'Format NIR non reconnu');
    } else {
      setNirError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-institution-50 text-institution-700 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Paramètres du Profil & Dates Clés
            </h2>
            <p className="text-xs text-slate-500">
              Saisissez les informations de l'assuré ou utilisez le décodage automatique du NIR.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* NIR Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                NIR (Numéro de Sécurité Sociale)
              </label>
              <FormulaTooltip
                title="Décodage automatique du NIR"
                formula="1er ch. = Sexe (1:H, 2:F) • Ch. 2-3 = Année • Ch. 4-5 = Mois"
                explanation="Les 5 premiers chiffres du NIR renseignent automatiquement le sexe et la date de naissance de l'assuré(e)."
                articleCss="Art. R. 115-1 CSS"
              />
            </div>
            <input
              type="text"
              value={profile.nir}
              onChange={handleNirChange}
              placeholder="ex: 2 63 01 75 001 234"
              className={`w-full px-3.5 py-2 text-sm rounded-lg border font-mono tracking-wider focus:ring-2 focus:outline-none ${
                nirError
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:border-institution-500 focus:ring-institution-200'
              }`}
            />
            {nirError ? (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {nirError}
              </p>
            ) : profile.nir ? (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                NIR décodé : {profile.sex === 'F' ? 'Femme' : 'Homme'}, né(e) en {profile.birthDate}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Saisie libre ou décodage automatique
              </p>
            )}
          </div>

          {/* Date de naissance */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-institution-600" />
              Date de naissance
            </label>
            <input
              type="date"
              value={profile.birthDate}
              onChange={(e) => onChangeProfile({ birthDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-institution-500 focus:ring-2 focus:ring-institution-200 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Génération {profile.birthDate ? profile.birthDate.split('-')[0] : '—'}
            </p>
          </div>

          {/* Sexe */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Sexe de l'assuré(e)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeProfile({ sex: 'F' })}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  profile.sex === 'F'
                    ? 'bg-institution-600 text-white border-institution-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Femme (2)
              </button>
              <button
                type="button"
                onClick={() => onChangeProfile({ sex: 'M' })}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  profile.sex === 'M'
                    ? 'bg-institution-600 text-white border-institution-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Homme (1)
              </button>
            </div>
          </div>

          {/* Nombre d'enfants */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-institution-600" />
                Enfants nés et élevés
              </label>
              <FormulaTooltip
                title="Majoration Enfants"
                formula="+10 % sur la Base et l'Agirc-Arrco dès 3 enfants"
                explanation="À partir de 3 enfants élevés pendant au moins 9 ans avant leurs 16 ans, les pensions de base et complémentaire sont majorées de 10 % (plafonnée à 2 367,48 €/an sur l'Agirc-Arrco)."
                articleCss="Art. L. 351-12 CSS & Accord ANI"
              />
            </div>
            <input
              type="number"
              min="0"
              max="15"
              value={profile.childrenCount}
              onChange={(e) =>
                onChangeProfile({ childrenCount: Math.max(0, parseInt(e.target.value, 10) || 0) })
              }
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-institution-500 focus:ring-2 focus:ring-institution-200 focus:outline-none"
            />
            {profile.childrenCount >= 3 ? (
              <span className="text-[11px] text-emerald-600 font-medium">
                ✓ Majoration +10 % applicable sur Base & Agirc-Arrco
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Majoration +10 % dès 3 enfants
              </span>
            )}
          </div>

          {/* Case à cocher : Majoration mère */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={profile.motherBonusQuarters}
                onChange={(e) => onChangeProfile({ motherBonusQuarters: e.target.checked })}
                disabled={profile.sex !== 'F'}
                className="mt-0.5 rounded text-institution-600 focus:ring-institution-500"
              />
              <div className="text-xs text-slate-700">
                <span className="font-semibold block">
                  Majoration maternité/éducation mère
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  8 trimestres par enfant (4 maternité + 4 éducation, Art. L. 351-4 CSS)
                </span>
              </div>
            </label>
          </div>

          {/* Date de départ souhaitée */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-institution-600" />
                Date de départ souhaitée
              </label>
              <FormulaTooltip
                title="Âge exact au départ"
                formula="Âge = Année_départ - Année_naissance"
                explanation="La pension prend effet le 1er jour du mois civil choisi."
                articleCss="Art. R. 351-37 CSS"
              />
            </div>
            <input
              type="date"
              value={profile.desiredDepartureDate}
              onChange={(e) => onChangeProfile({ desiredDepartureDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-institution-500 focus:ring-2 focus:ring-institution-200 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Âge au départ : <strong className="text-institution-700">{result.ageAtDeparture.formatted}</strong>{' '}
              (Âge légal : {result.legalAge.formatted})
            </p>
          </div>

          {/* Dernier salaire brut mensuel */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5 text-institution-600" />
                Dernier salaire brut mensuel
              </label>
              <FormulaTooltip
                title="Taux de remplacement & Plafond CER"
                formula="Taux = Pension_brute / Dernier_salaire"
                explanation="Permet de calculer le taux de remplacement brut et le plafond de revenus autorisé en cumul emploi-retraite plafonné."
                articleCss="Art. L. 161-22 CSS"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={profile.lastGrossMonthlySalary}
                onChange={(e) =>
                  onChangeProfile({
                    lastGrossMonthlySalary: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full pl-3.5 pr-8 py-2 text-sm rounded-lg border border-slate-300 focus:border-institution-500 focus:ring-2 focus:ring-institution-200 focus:outline-none"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400">€</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sert au calcul du taux de remplacement
            </p>
          </div>
        </div>
      </div>

      {/* Module Toggle : Projet de Cumul Emploi-Retraite (CER) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tealbrand-50 text-tealbrand-700 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Projet après la retraite : Cumul Emploi-Retraite (CER)
              </h3>
              <p className="text-xs text-slate-500">
                Prévoyez-vous de reprendre une activité professionnelle après la liquidation de votre pension ?
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={profile.cerEnabled}
              onChange={(e) => onChangeProfile({ cerEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tealbrand-600"></div>
            <span className="ml-3 text-xs font-semibold text-slate-700">
              {profile.cerEnabled ? 'Activité envisagée (Oui)' : 'Aucune reprise (Non)'}
            </span>
          </label>
        </div>

        {profile.cerEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            {/* Date de reprise */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Date de reprise d'activité
              </label>
              <input
                type="date"
                value={profile.cerResumptionDate}
                onChange={(e) => onChangeProfile({ cerResumptionDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-institution-500 focus:ring-2 focus:ring-institution-200 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Départ le {profile.desiredDepartureDate}
              </p>
            </div>

            {/* Reprise chez l'ancien employeur */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Reprise chez l'ancien employeur ?
                </label>
                <FormulaTooltip
                  title="Délai de carence de 6 mois"
                  formula="Délai < 6 mois = Suspension de la pension en CER plafonné"
                  explanation="En cas de départ avant l'âge légal ou avec décote, reprendre chez le dernier employeur avant 6 mois entraîne la suspension intégrale des pensions jusqu'au terme des 6 mois."
                  articleCss="Art. L. 161-22 CSS"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeProfile({ cerFormerEmployer: true })}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    profile.cerFormerEmployer
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Oui (Même employeur)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeProfile({ cerFormerEmployer: false })}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    !profile.cerFormerEmployer
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Non (Nouvel employeur)
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {profile.cerFormerEmployer
                  ? 'Soumis au délai de carence légal de 6 mois'
                  : 'Pas de délai de carence chez un nouvel employeur'}
              </p>
            </div>

            {/* Nouveau salaire brut mensuel */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Nouveau salaire brut mensuel envisagé
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={profile.cerNewGrossMonthlySalary}
                  onChange={(e) =>
                    onChangeProfile({
                      cerNewGrossMonthlySalary: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full pl-3.5 pr-8 py-2 text-sm rounded-lg border border-slate-300 focus:border-institution-500 focus:ring-2 focus:ring-institution-200 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">€</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Revenu d'activité en cumul
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Résumé interactif en bas d'onglet */}
      <div className="bg-gradient-to-r from-institution-50 to-tealbrand-50 rounded-xl border border-institution-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-institution-900 text-sm">
            Statut actuel calculé :{' '}
            <span
              className={
                result.eligibilityStatus === 'eligible_taux_plein'
                  ? 'text-emerald-700'
                  : result.eligibilityStatus === 'eligible_decote'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }
            >
              {result.eligibilityStatus === 'eligible_taux_plein'
                ? 'Taux plein 50 %'
                : result.eligibilityStatus === 'eligible_decote'
                ? 'Départ avec décote'
                : 'Inéligible au départ'}
            </span>
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            {result.totalValidatedQuarters} trimestres validés • {result.samYearsCount} meilleures années retenues •{' '}
            Total estimé :{' '}
            <strong>
              {result.totalMonthlyGross.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              €/mois
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTab('career')}
            className="px-4 py-2 text-xs font-semibold text-institution-700 bg-white border border-institution-300 rounded-lg hover:bg-institution-50 transition-colors shadow-xs"
          >
            Vérifier la carrière →
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-institution-600 rounded-lg hover:bg-institution-700 transition-colors shadow-xs"
          >
            Voir les estimations →
          </button>
        </div>
      </div>
    </div>
  );
};

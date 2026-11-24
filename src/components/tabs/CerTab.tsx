import React from 'react';
import { CalculationResult, UserProfile } from '../../types/retirement';
import { StatusBadge } from '../common/StatusBadge';
import { FormulaTooltip } from '../common/FormulaTooltip';
import { REPERES_2026 } from '../../constants/parameters2026';
import {
  Briefcase,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  
  ArrowRight,
  ShieldAlert,
  Building2,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

interface CerTabProps {
  result: CalculationResult;
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  onNavigateToTab: (tabId: any) => void;
}

export const CerTab: React.FC<CerTabProps> = ({
  result,
  profile,
  onChangeProfile,
  onNavigateToTab,
}) => {
  const cer = result.cerAnalysis;

  if (!profile.cerEnabled) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-2xl mx-auto shadow-sm my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Le Cumul Emploi-Retraite n'est pas activé
        </h3>
        <p className="text-xs text-slate-500 mb-5 max-w-md mx-auto">
          Activez l'option dans l'onglet Profil pour analyser les règles juridiques (délai de carence de 6 mois, plafond de revenus, ouverture de nouveaux droits).
        </p>
        <button
          type="button"
          onClick={() => onChangeProfile({ cerEnabled: true })}
          className="px-4 py-2 text-xs font-semibold text-white bg-tealbrand-600 hover:bg-tealbrand-700 rounded-lg shadow-sm transition-colors"
        >
          Activer le module Cumul Emploi-Retraite
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Alerte Principale & Statut Légal */}
      <div
        className={`rounded-xl border p-6 shadow-sm transition-all ${
          cer.alertLevel === 'RED'
            ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300'
            : cer.alertLevel === 'YELLOW'
            ? 'bg-amber-50 border-amber-300'
            : 'bg-emerald-50 border-emerald-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl text-white shadow-md ${
                cer.alertLevel === 'RED'
                  ? 'bg-rose-600'
                  : cer.alertLevel === 'YELLOW'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
            >
              {cer.alertLevel === 'RED' ? (
                <AlertOctagon className="w-7 h-7" />
              ) : cer.alertLevel === 'YELLOW' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    cer.status === 'PLAFONNE'
                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  Régime juridique : {cer.status === 'PLAFONNE' ? 'CER PLAFONNÉ' : 'CER INTÉGRAL'}
                </span>
                <StatusBadge
                  status={cer.alertLevel}
                  text={
                    cer.alertLevel === 'RED'
                      ? 'ALERTE ROUGE : SUSPENSION DE PENSION'
                      : cer.alertLevel === 'YELLOW'
                      ? 'Vigilance requise'
                      : 'Conforme sans suspension'
                  }
                  size="sm"
                />
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 mt-2">
                {cer.alertLevel === 'RED'
                  ? 'Attention : Suspension des pensions pendant les 6 mois de carence !'
                  : cer.status === 'PLAFONNE'
                  ? 'Cumul Emploi-Retraite Plafonné (Départ anticipé ou sans taux plein)'
                  : 'Cumul Emploi-Retraite Intégral (Taux plein et âge légal atteint)'}
              </h2>

              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed max-w-3xl">
                {cer.alertMessage}
              </p>

              {/* Encadré d'alerte spécifique pour le Cas Sakura */}
              {cer.suspensionApplies && (
                <div className="mt-4 p-3.5 bg-rose-100/90 border border-rose-300 rounded-lg text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold block">
                      Délai de carence obligatoire non respecté (Art. L. 161-22 CSS) :
                    </span>
                    <span>
                      Reprise chez l'ancien employeur dès le {profile.cerResumptionDate} (1 mois après le départ en retraite).{' '}
                      <strong>{cer.waitingMonthsRemaining} mois de carence restants</strong> jusqu'au {cer.waitingPeriodEndDate}.
                    </span>
                  </div>
                  <div className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap self-start sm:self-auto shadow-xs">
                    Pension versée = 0 €/mois
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 text-right shrink-0">
            <div className="text-xs text-slate-500 font-medium">Pension nette reçue en cumul</div>
            <div
              className={`text-2xl font-black ${
                cer.suspensionApplies ? 'text-rose-600' : 'text-institution-800'
              }`}
            >
              {cer.effectiveMonthlyGrossPension?.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? 'À confirmer'}{' '}
              <span className="text-xs font-normal text-slate-500">€ brut/mois</span>
            </div>
            {cer.ecretementAmount > 0 && !cer.suspensionApplies && (
              <div className="text-xs font-semibold text-rose-600 mt-0.5">
                Écrêtement : -{cer.ecretementAmount} €/mois
              </div>
            )}
            <div className="text-xs text-slate-400 mt-1">
              Nouveau salaire : +{profile.cerNewGrossMonthlySalary.toLocaleString('fr-FR')} €/mois
            </div>
          </div>
        </div>
      </div>

      {/* 2. Analyse des 3 Piliers du CER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pilier 1 : Carence Ancien Employeur */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-institution-600" />
              <h3 className="font-semibold text-slate-800 text-sm">
                1. Règle du Dernier Employeur
              </h3>
            </div>
            <FormulaTooltip
              title="Délai de carence de 6 mois"
              formula="Départ < Âge légal + Même employeur = Carence 6 mois"
              explanation="L'article L. 161-22 du CSS interdit à un assuré parti avant l'âge légal (ex: carrière longue) de reprendre une activité chez son ancien employeur avant l'expiration d'un délai de 6 mois, sous peine de suspension de sa pension."
              articleCss="Art. L. 161-22 CSS"
            />
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Employeur de reprise :</span>
              <strong className={profile.cerFormerEmployer ? 'text-rose-700' : 'text-emerald-700'}>
                {profile.cerFormerEmployer ? 'Même employeur' : 'Nouvel employeur'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date de départ :</span>
              <span className="font-medium text-slate-800">{profile.desiredDepartureDate}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date de reprise :</span>
              <span className="font-medium text-slate-800">{profile.cerResumptionDate}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Fin du délai de 6 mois :</span>
              <span className="font-bold text-institution-700">{cer.waitingPeriodEndDate}</span>
            </div>

            <div className="pt-2 text-[11px] leading-relaxed">
              {profile.cerFormerEmployer ? (
                cer.waitingMonthsRemaining > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    ✗ Carence non purgée ({cer.waitingMonthsRemaining} mois restants). Reprise autorisée sans suspension dès le {cer.waitingPeriodEndDate}.
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">
                    ✓ Délai de 6 mois respecté.
                  </span>
                )
              ) : (
                <span className="text-emerald-600 font-semibold">
                  ✓ Aucun délai de carence chez un nouvel employeur.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pilier 2 : Plafond de Revenus */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-institution-600" />
              <h3 className="font-semibold text-slate-800 text-sm">
                2. Plafond de Ressources
              </h3>
            </div>
            <FormulaTooltip
              title="Plafond de Cumul en CER Plafonné"
              formula="Plafond = MAX(Dernier_salaire, 1,6 × SMIC_mensuel)"
              explanation="En CER plafonné, la somme de la pension brute et du nouveau salaire ne peut pas dépasser le plus élevé entre le dernier salaire brut et 1,6 SMIC. Tout dépassement entraîne un écrêtement équivalent de la pension."
              articleCss="Art. L. 161-22 & D. 161-2-6 CSS"
            />
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Régime de plafond :</span>
              <strong className={cer.status === 'INTEGRAL' ? 'text-emerald-700' : 'text-amber-700'}>
                {cer.status === 'INTEGRAL' ? 'Aucun plafond (Libre)' : 'Plafonné'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Dernier salaire :</span>
              <span className="font-medium text-slate-800">
                {profile.lastGrossMonthlySalary.toLocaleString('fr-FR')} €/mois
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">1,6 SMIC 2026 :</span>
              <span className="font-medium text-slate-800">
                {REPERES_2026.plafond1_6SmicMensuel.toLocaleString('fr-FR')} €/mois
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Plafond retenu :</span>
              <strong className="text-institution-700">
                {cer.status === 'INTEGRAL'
                  ? 'Illimité'
                  : `${cer.ceilingAmount.toLocaleString('fr-FR')} €/mois`}
              </strong>
            </div>

            <div className="pt-2 text-[11px] leading-relaxed">
              {cer.status === 'INTEGRAL' ? (
                <span className="text-emerald-600 font-semibold">
                  ✓ En CER intégral, vous pouvez cumuler votre salaire complet sans aucune réduction.
                </span>
              ) : cer.exceedsCeiling ? (
                <span className="text-amber-700 font-semibold">
                  ⚠ Dépassement de {cer.ecretementAmount} €/mois (Pension réduite de ce montant).
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">
                  ✓ Revenus totaux sous le plafond (pas d'écrêtement).
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pilier 3 : Nouveaux Droits à la Retraite */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              
              <h3 className="font-semibold text-slate-800 text-sm">
                3. Création de Nouveaux Droits
              </h3>
            </div>
            <FormulaTooltip
              title="Nouvelle pension (Réforme 2023)"
              formula="Plafond = 5 % du PASS = 2 403 €/an en 2026"
              explanation="Depuis la loi du 14 avril 2023, les cotisations versées en CER intégral permettent de liquider une seconde pension de retraite de base, plafonnée à 5 % du PASS."
              articleCss="Art. L. 161-22-1-1 CSS"
            />
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Nouveaux droits ouverts :</span>
              <strong className={cer.generatesNewRights ? 'text-emerald-700' : 'text-slate-500'}>
                {cer.generatesNewRights ? 'OUI (Loi 2023)' : 'NON (Cotisations perdues)'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Plafond annuel (5 % PASS) :</span>
              <span className="font-bold text-institution-700">
                {REPERES_2026.plafondNouveauxDroitsCerAnnuel} €/an
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Plafond mensuel :</span>
              <span className="font-medium text-slate-800">
                +{REPERES_2026.plafondNouveauxDroitsCerMensuel} €/mois
              </span>
            </div>

            <div className="pt-2 text-[11px] leading-relaxed">
              {cer.generatesNewRights ? (
                <span className="text-emerald-600 font-semibold">
                  ✓ Vos cotisations en cours créent une seconde pension qui pourra être demandée à la fin de votre contrat.
                </span>
              ) : (
                <span className="text-slate-500 leading-tight block">
                  En CER plafonné, les cotisations vieillesse sont dites « de solidarité » et ne génèrent aucun droit.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bloc Recommandations Conseiller Retraite */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-institution-600" />
          <h3 className="text-base font-bold text-slate-800">
            Recommandations & Options d'Optimisation Conseiller
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cer.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-institution-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-institution-100 text-institution-800 border border-institution-200">
                    {rec.badge}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1.5">{rec.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {rec.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs font-semibold text-emerald-700 bg-emerald-50/50 -mx-4 -mb-4 p-3 rounded-b-xl border-t">
                Impact : {rec.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

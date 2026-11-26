import React, { useState } from 'react';
import { CalculationResult, UserProfile } from '../../types/retirement';
import { SamParametersNote } from '../common/SamParametersNote';
import { LongCareerSummary } from '../common/LongCareerSummary';
import { SimpleTooltip } from '../common/SimpleTooltip';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  FileCheck2,
  ListChecks,
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

interface Step5BilanProps {
  result: CalculationResult;
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  onModifySimulation: () => void;
}

export const Step5Bilan: React.FC<Step5BilanProps> = ({
  result,
  profile,
  onChangeProfile,
  onModifySimulation,
}) => {
  const [showFormulasAccordion, setShowFormulasAccordion] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const isIneligible = result.eligibilityStatus === 'ineligible';
  const cer = result.cerAnalysis;
  const sam = result.samAnalysis;
  const samAvailable = sam.source !== 'unavailable';

  const showCerResources = profile.cerEnabled && cer.regime === 'before2027' && !cer.unavailable;
  const chartData = showCerResources ? [
    { name: 'Dernier salaire brut', 'Dernier salaire brut': profile.lastGrossMonthlySalary },
    {
      name: 'Ressources après reprise',
      'Salaire de reprise': profile.cerNewGrossMonthlySalary,
      'Retraite de base (LURA)': cer.paidBaseMonthly,
      'Agirc-Arrco': cer.paidComplementaryMonthly,
    },
  ] : [
    {
      name: 'Rémunération vs Retraite',
      'Dernier salaire brut': profile.lastGrossMonthlySalary,
      'Retraite de base (LURA)': result.basePensionMonthlyGross,
      'Agirc-Arrco': result.agircMonthlyGross,
    },
  ];

  const formatDate = (date: string) => date.split('-').reverse().join('/');
  const formatEuros = (amount: number) =>
    amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const formatPercent = (rate: number) =>
    rate.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 });
  const replacementRate = formatPercent(result.grossReplacementRate / 100);
  const pensionStatus = result.eligibilityStatus === 'eligible_taux_plein'
    ? `${result.isCarriereLongue ? 'Carrière longue à taux plein' : 'Taux plein'} (${formatPercent(result.liquidationRate)})`
    : result.eligibilityStatus === 'eligible_decote' ? `Départ avec décote (${result.decoteQuarters} trim.)` : 'Inéligible au départ';
  const cerResources = cer.totalCerRevenue === undefined
    ? 'Total à confirmer après vérification des plafonds'
    : formatEuros(cer.totalCerRevenue) + ' / mois';

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-fadeIn">
      {/* 1. CARTE VERDICT EN HAUT (Bandeau Vert / Orange / Rouge) */}
      <div
        className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${
          result.eligibilityStatus === 'eligible_taux_plein'
            ? 'bg-gradient-to-r from-emerald-50 via-tealbrand-50 to-white border-emerald-400'
            : result.eligibilityStatus === 'eligible_decote'
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-amber-400'
            : 'bg-gradient-to-r from-rose-50 via-red-50 to-white border-rose-400'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl text-white shadow-md shrink-0 ${
                result.eligibilityStatus === 'eligible_taux_plein'
                  ? 'bg-emerald-600'
                  : result.eligibilityStatus === 'eligible_decote'
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              {result.eligibilityStatus === 'eligible_taux_plein' ? (
                <ShieldCheck className="w-7 h-7" />
              ) : result.eligibilityStatus === 'eligible_decote' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                    result.eligibilityStatus === 'eligible_taux_plein'
                      ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                      : result.eligibilityStatus === 'eligible_decote'
                      ? 'bg-amber-200 text-amber-950 border border-amber-300'
                      : 'bg-rose-200 text-rose-950 border border-rose-300'
                  }`}
                >
                  {pensionStatus}
                </span>

                <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 text-slate-700 font-semibold border border-slate-200">
                  {result.appliedRule}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {result.eligibilityStatus === 'eligible_taux_plein'
                  ? result.isCarriereLongue
                    ? 'Départ anticipé à taux plein selon la simulation'
                    : 'Départ à l’âge légal avec pension au Taux Plein'
                  : result.eligibilityStatus === 'eligible_decote'
                  ? 'Départ possible mais pension soumise à minoration'
                  : 'Départ non confirmé à la date choisie'}
              </h2>

              <p className="text-xs text-slate-700">
                Âge au départ · {result.ageAtDeparture.formatted}. Âge légal · {result.legalAge.formatted}.
              </p>
              <LongCareerSummary result={result.longCareer} />
            </div>
          </div>

          <button
            type="button"
            onClick={onModifySimulation}
            className="self-end sm:self-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white/90 hover:bg-white border border-slate-300 shadow-2xs transition-colors shrink-0"
          >
            Modifier les paramètres
          </button>
        </div>
      </div>

      {/* 2. CHIFFRES CLÉS EN GRAND & 2 PETITES CARTES EN DESSOUS */}
      <div className="space-y-4">
        {isIneligible ? (
          <div className="bg-rose-50 rounded-2xl border-2 border-rose-300 p-6 sm:p-7 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
              Situation à la date demandée ({formatDate(profile.desiredDepartureDate)})
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
              Aucune pension liquidable à la date demandée
            </div>
            <p className="text-xs text-rose-800">
              Les conditions d’âge légal ou de départ anticipé pour carrière longue ne sont pas remplies au{' '}
              {formatDate(profile.desiredDepartureDate)}. Aucune pension brute, nette ou taux de remplacement n’est liquidable à cette date.
            </p>
          </div>
        ) : (
          samAvailable && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Pension Totale Estimée (Base + Complémentaire)
                  </span>
                  <div className="text-4xl font-black text-institution-800 tracking-tight mt-1">
                    {result.totalMonthlyGross.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xl font-normal text-slate-500">€ brut / mois</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-700 mt-1">
                    ≈{' '}
                    {result.totalMonthlyNet.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    € net estimé avant impôt sur le revenu
                  </div>
                </div>

                {profile.lastGrossMonthlySalary > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-right shrink-0">
                    <span className="text-xs text-slate-500 block">Taux de remplacement brut</span>
                    <div className="text-3xl font-black text-tealbrand-700 mt-0.5">
                      {replacementRate}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      sur dernier salaire ({formatEuros(profile.lastGrossMonthlySalary)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* 2 Petites cartes : Base & Agirc-Arrco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Carte Retraite de Base */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-institution-700">
                  Retraite de Base (CNAV / LURA)
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!isIneligible && result.micoApplied && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                      MICO +{formatEuros(result.micoComplementMonthly)}
                    </span>
                  )}
                  {result.agircChildBonusMonthly > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      +10 % enfants
                    </span>
                  )}
                </div>
              </div>

              {isIneligible ? (
                <p className="text-sm font-semibold text-rose-700">
                  Aucune pension liquidable à la date demandée.
                </p>
              ) : samAvailable ? (
                <>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatEuros(result.basePensionMonthlyGross)} <span className="text-sm font-normal text-slate-500">brut / mois</span>
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-emerald-700">
                    ≈ {formatEuros(result.basePensionMonthlyNet)} net
                  </div>
                  {result.micoApplied && (
                    <div className="mt-1.5 text-[11px] text-indigo-800">
                      Base avant MICO : {formatEuros(result.basePensionMonthlyGrossBeforeMico)} • Complément MICO : +{formatEuros(result.micoComplementMonthly)}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-700">
                  Pension de base indéterminée. Complétez le relevé ou saisissez un salaire annuel moyen en mode express.
                </p>
              )}
            </div>

            {!isIneligible && samAvailable && (
              <div className="mt-4 flex justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>{sam.source === 'express' ? 'SAM saisi' : `SAM · ${sam.topYears.length} année(s) retenue(s) sur ${sam.yearLimit}`}</span>
                <strong className="text-slate-800">{formatEuros(sam.amount)}</strong>
              </div>
            )}
            <SamParametersNote analysis={sam} />
            {sam.source !== 'express' && sam.parentAdjustmentPending && (
              <p className="mt-2 text-xs text-amber-800">La réduction du plafond pour enfant reste à confirmer.</p>
            )}
          </div>

          {/* Carte Agirc-Arrco */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-tealbrand-700">
                  Retraite Agirc-Arrco
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!isIneligible && result.agircAbattementCoeff < 1 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Coeff. {result.agircAbattementCoeff.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  {!isIneligible && profile.childrenCount >= 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Majoration enfants{result.agircChildBonusCapped ? ' plafonnée' : ''}
                    </span>
                  )}
                </div>
              </div>

              {isIneligible ? (
                <p className="text-sm font-semibold text-rose-700">
                  Aucune pension liquidable à la date demandée.
                </p>
              ) : (
                <>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {result.agircMonthlyGross.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-sm font-normal text-slate-500">€/mois brut</span>
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                    ≈ {formatEuros(result.agircMonthlyNet)} net estimé
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Taux pleins hors Alsace-Moselle · 10,1 % sur la pension
                    {result.agircChildBonusBands.length > 0 && ' et 9,1 % sur la majoration pour enfants nés ou élevés'}.
                  </p>
                  {result.agircChildBonusBands.length > 0 && (
                    <div className="mt-3 text-xs text-slate-600">
                      <p className="font-semibold">Majoration pour enfants nés ou élevés · {formatEuros(result.agircChildBonusMonthly)} brut / mois</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {result.agircChildBonusBands.map((band) => (
                          <li key={`${band.label}:${band.assumed}`}>
                            {band.label} · {band.points.toLocaleString('fr-FR')} pts à{' '}
                            {band.rate.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 })}
                            {band.assumed && ' (hypothèse)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>Points acquis :</span>
              <strong className="text-slate-800">
                {result.agircTotalPoints.toLocaleString('fr-FR')} pts (valeur {result.agircPointValue.toLocaleString('fr-FR')} €)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {profile.cerEnabled && (
        <section
          aria-labelledby="cer-result-title"
          className={`rounded-2xl border-2 p-6 shadow-xs space-y-4 ${
            cer.alertLevel === 'RED' ? 'bg-rose-50 border-rose-300'
              : cer.alertLevel === 'YELLOW' ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'
          }`}
        >
          <h3 id="cer-result-title" className="font-bold text-sm">
            Cumul emploi-retraite · {cer.regime === 'from2027' ? 'Règles 2027' : 'Règles antérieures à 2027'}
          </h3>
          <p className="text-sm">{cer.alertMessage}</p>
          {cer.regime === 'from2027' && !cer.unavailable && (
            <div className="space-y-3 text-sm">
              {cer.baseSuspensionStartDate && (
                <p>Pension de base suspendue à partir du {formatDate(cer.baseSuspensionStartDate)}.</p>
              )}
              {cer.periods?.map((period) => (
                <div key={period.band} className="border-t border-slate-200 pt-2">
                  <p className="font-semibold">{formatDate(period.startDate)} au {formatDate(period.endDate)}</p>
                  <p>{period.band === 'beforeLegalAge'
                    ? 'Réduction à hauteur des revenus retenus.'
                    : period.annualThreshold === undefined
                      ? 'Seuil annuel non disponible pour cette année.'
                      : `Réduction de 50 % au-delà du seuil annuel de ${formatEuros(period.annualThreshold)}.`}</p>
                  {period.income === undefined && <p>Renseignez les revenus de la période pour obtenir une estimation.</p>}
                </div>
              ))}
              {cer.annualReduction !== undefined && (
                <p className="font-semibold">
                  Réduction estimée au titre de {profile.cerResumptionDate.slice(0, 4)} · {formatEuros(cer.annualReduction)}
                </p>
              )}
              {cer.fullCumulStartDate && (
                <p>Cumul intégral possible à compter du {formatDate(cer.fullCumulStartDate)}, sous réserve de liquidation des pensions exigibles.</p>
              )}
            </div>
          )}
          {showCerResources && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Salaire brut de reprise</dt>
                <dd>{formatEuros(profile.cerNewGrossMonthlySalary)} / mois</dd>
              </div>
              {cer.baseSalarySubjectToCsg !== undefined && (
                <div>
                  <dt className="font-semibold">Salaire soumis à la CSG pour le plafond de base</dt>
                  <dd>
                    {formatEuros(cer.baseSalarySubjectToCsg)} / mois
                    {profile.cerNewMonthlyIncomeSubjectToCsg === undefined && ' (estimé)'}
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-semibold">Retraite de base au début de la reprise</dt>
                <dd>{cer.paidBaseMonthly === undefined ? 'Plafond à confirmer' : formatEuros(cer.paidBaseMonthly) + ' / mois'}</dd>
              </div>
              <div>
                <dt className="font-semibold">Agirc-Arrco au début de la reprise</dt>
                <dd>{cer.paidComplementaryMonthly === undefined ? 'Plafond à confirmer' : formatEuros(cer.paidComplementaryMonthly) + ' / mois'}</dd>
              </div>
              <div>
                <dt className="font-semibold">Ressources mensuelles totales (pensions + reprise)</dt>
                <dd>{cerResources}</dd>
              </div>
            </dl>
          )}
          {cer.newRightsDetails && <p className="text-sm font-medium">{cer.newRightsDetails}</p>}
          {cer.regime === 'before2027' && !cer.unavailable && cer.status === 'PLAFONNE'
            && profile.cerFormerEmployer && cer.waitingMonthsRemaining > 0 && (
              <button
                type="button"
                onClick={() => onChangeProfile({ cerFormerEmployer: false })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:border-tealbrand-500"
              >
                Simuler une reprise chez un nouvel employeur
              </button>
            )}
        </section>
      )}

      {!isIneligible && samAvailable && (!showCerResources || cer.totalCerRevenue !== undefined) && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {showCerResources
                ? 'Dernier salaire brut et ressources après reprise'
                : 'Dernier salaire brut et retraite totale'}
            </h3>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" unit=" €" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" hide={!showCerResources} width={155} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Dernier salaire brut" fill="#64748b" radius={[0, 6, 6, 0]} />
                {showCerResources && <Bar dataKey="Salaire de reprise" stackId="pension" fill="#8b5e34" />}
                <Bar dataKey="Retraite de base (LURA)" stackId="pension" fill="#1d5e9b" />
                <Bar dataKey="Agirc-Arrco" stackId="pension" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          aria-expanded={showAuditReport}
          aria-controls="retirement-control-report"
          onClick={() => setShowAuditReport((open) => !open)}
          className="flex w-full items-center justify-between gap-3 bg-slate-900 p-4 text-left text-sm font-bold text-white hover:bg-slate-800 sm:p-5"
        >
          <span className="flex items-center gap-2">
            <FileCheck2 aria-hidden="true" className="h-4 w-4 text-tealbrand-400" />
            Rapport de contrôle
          </span>
          {showAuditReport ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}
        </button>

        {showAuditReport && (
          <section id="retirement-control-report" aria-label="Résultats du rapport de contrôle" className="space-y-5 divide-y divide-slate-200 p-4 text-sm text-slate-700 sm:p-6">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">Départ et durée d’assurance</h3>
              <p>{pensionStatus} au {formatDate(profile.desiredDepartureDate)} sous le barème {result.appliedRule}.</p>
              <p>Âge au départ · {result.ageAtDeparture.formatted}. Âge légal · {result.legalAge.formatted}.</p>
              <p>
                {result.totalValidatedQuarters} trimestres validés pour {result.requiredQuarters} requis.
                {profile.careerMode !== 'express' && ` Le relevé compte ${result.totalContributedQuarters} trimestres cotisés par l’activité.`}
              </p>
              <LongCareerSummary result={result.longCareer} />
            </div>

            <div className="space-y-2 pt-4">
              <h3 className="font-bold text-slate-900">Salaire annuel moyen</h3>
              {sam.source === 'career' ? (
                <>
                  <p>
                    <strong>{formatEuros(sam.amount)}</strong> après plafonnement et revalorisation des salaires admissibles.
                  </p>
                  <p>Années retenues · {sam.topYears.length} sur un maximum de {sam.yearLimit}.</p>
                  <SamParametersNote analysis={sam} />
                </>
              ) : (
                <p>{sam.source === 'express' ? `SAM saisi en mode Express · ${formatEuros(sam.amount)}.` : 'SAM indisponible. Complétez le relevé ou saisissez une estimation en mode Express.'}</p>
              )}
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-slate-900">Pensions mensuelles</h3>
              {isIneligible ? (
                <p>Aucune pension liquidable à la date demandée.</p>
              ) : (
                <>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                      <dt className="font-semibold text-slate-900">Retraite de base</dt>
                      {samAvailable ? (
                        <dd>
                          <strong>{formatEuros(result.basePensionMonthlyGross)} brut</strong> · {formatEuros(result.basePensionMonthlyNet)} net estimé.
                          <p className="mt-1 text-xs">Taux de liquidation · {formatPercent(result.liquidationRate)}. Proratisation · {formatPercent(result.proratisation)}.</p>
                          {result.micoApplied && <p className="text-xs">Complément du minimum contributif · {formatEuros(result.micoComplementMonthly)}.</p>}
                          {result.baseChildBonusMonthly > 0 && <p className="text-xs">Majoration enfants · {formatEuros(result.baseChildBonusMonthly)}.</p>}
                        </dd>
                      ) : <dd>Montant indéterminé en l’absence de SAM.</dd>}
                    </div>
                    <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                      <dt className="font-semibold text-slate-900">Retraite Agirc-Arrco</dt>
                      <dd>
                        <strong>{formatEuros(result.agircMonthlyGross)} brut</strong> · {formatEuros(result.agircMonthlyNet)} net estimé.
                        <p className="mt-1 text-xs">
                          {result.agircTotalPoints.toLocaleString('fr-FR')} points à {result.agircPointValue.toLocaleString('fr-FR')} €.
                          {result.agircAbattementCoeff < 1 && ` Coefficient de minoration · ${result.agircAbattementCoeff.toLocaleString('fr-FR')}.`}
                        </p>
                        {result.agircChildBonusBands.length > 0 && (
                          <p className="text-xs">
                            Majoration enfants · {formatEuros(result.agircChildBonusMonthly)}{result.agircChildBonusCapped ? ' (plafonnée)' : ''}.
                            {result.agircChildBonusBands.some((band) => band.assumed) && ' Le détail des hypothèses par période figure dans la carte Agirc-Arrco.'}
                          </p>
                        )}
                      </dd>
                    </div>
                  </dl>
                  {samAvailable && (
                    <div className="space-y-1">
                      <p><strong>Total mensuel · {formatEuros(result.totalMonthlyGross)} brut</strong> · {formatEuros(result.totalMonthlyNet)} net estimé avant impôt.</p>
                      <p className="text-xs">Le total brut est arrondi au centime après addition des deux pensions.</p>
                      {profile.lastGrossMonthlySalary > 0 && (
                        <p>Taux de remplacement brut · {replacementRate} du dernier salaire de {formatEuros(profile.lastGrossMonthlySalary)}.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2 pt-4">
              <h3 className="font-bold text-slate-900">Cumul emploi-retraite</h3>
              <p>{cer.alertMessage}</p>
              {showCerResources && <p><strong>Ressources mensuelles après reprise</strong> · {cerResources}.</p>}
              {profile.cerEnabled && cer.annualReduction !== undefined && (
                <p>Réduction annuelle estimée · {formatEuros(cer.annualReduction)}.</p>
              )}
            </div>

            <details className="pt-4 text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold">Exemple documentaire · relevé Sakura 2025</summary>
              <p className="mt-2">
                Page 4 du relevé, l’annotation pour 2024 indique 4 trimestres et 389,70 points Agirc-Arrco.
                Page 7, une annotation indique un salaire brut de 4 500 € par mois pour 2024.
              </p>
            </details>
          </section>
        )}
      </div>

      {/* 6. ACCORDÉON FERMÉ PAR DÉFAUT : DÉTAIL DES FORMULES (POUR LE JURY) */}
      <div className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
        <button
          type="button"
          aria-expanded={showFormulasAccordion}
          onClick={() => setShowFormulasAccordion((open) => !open)}
          className="w-full p-4 sm:p-5 text-left bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-tealbrand-600" />
            Détail des formules de calcul
          </span>
          {showFormulasAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showFormulasAccordion && (
          <div className="p-6 space-y-6 text-xs text-slate-700 border-t border-slate-200">
            {/* Formule 1 : SAM */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>1. Formule du Salaire Annuel Moyen (SAM) :</span>
                <span className="text-[11px] font-mono text-tealbrand-700">Art. R. 351-29 CSS</span>
              </h4>
              {sam.source === 'career' ? (
                <div className="rounded-xl bg-slate-900 p-3 font-mono text-amber-300">
                  SAM = somme des salaires revalorisés des années retenues ÷ {sam.topYears.length} = {formatEuros(sam.amount)}
                </div>
              ) : (
                <p>{sam.source === 'express' ? `SAM saisi en mode express · ${formatEuros(sam.amount)}` : 'Aucune année admissible pour établir la moyenne.'}</p>
              )}
            </div>

            {!isIneligible && samAvailable && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">2. Formule de la retraite de base</h4>
                <div className="rounded-xl bg-slate-900 p-3 font-mono text-tealbrand-300">
                  Base mensuelle = SAM × taux × proratisation × (1 + surcote) ÷ 12 + complément MICO + majoration enfants
                </div>
                <p>Montant estimé · <strong>{formatEuros(result.basePensionMonthlyGross)} / mois</strong>.</p>
              </div>
            )}

            {/* Formule 3 : Retraite Complémentaire Agirc-Arrco */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>3. Formule Agirc-Arrco :</span>
                <span className="text-[11px] font-mono text-tealbrand-700">Accord ANI</span>
              </h4>
              <div className="p-3 bg-slate-900 text-cyan-300 font-mono rounded-xl text-xs">
                Retraite mensuelle brute = (points × valeur du point × coefficient de minoration + majoration annuelle) ÷ 12
              </div>
              <p className="text-slate-600 text-[11px]">
                {isIneligible ? 'Aucune pension complémentaire liquidable à la date demandée.' : (
                  <>
                    La majoration annuelle est calculée en appliquant le taux de chaque période aux points correspondants.
                    Le résultat de cette simulation est de <strong>{formatEuros(result.agircMonthlyGross)} brut par mois</strong>,
                    dont {formatEuros(result.agircChildBonusMonthly)} de majoration pour enfants nés ou élevés.
                  </>
                )}
              </p>
            </div>

            {/* Formule 4 : Droit du Cumul Emploi-Retraite */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>4. Règles du Cumul Emploi-Retraite (CER) :</span>
                <span className="text-[11px] font-mono text-tealbrand-700">Art. L. 161-22 & L. 161-22-1-1 CSS</span>
              </h4>
              <p className="text-[11px] text-slate-600">
                La date d’effet de la première retraite de base détermine les règles de cumul applicables.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

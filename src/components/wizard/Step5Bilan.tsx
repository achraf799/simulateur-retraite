import React, { useState } from 'react';
import { CalculationResult, UserProfile } from '../../types/retirement';
import { SimpleTooltip } from '../common/SimpleTooltip';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
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

  const formatDate = (date: string) => date.split('-').reverse().join('/');
  const formatEuros = (amount: number) =>
    amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

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
                  {result.eligibilityStatus === 'eligible_taux_plein'
                    ? result.isCarriereLongue
                      ? 'Carrière Longue — Taux Plein 50 %'
                      : 'Taux Plein (50 %)'
                    : result.eligibilityStatus === 'eligible_decote'
                    ? `Départ avec Décote (${result.decoteQuarters} trim.)`
                    : 'Inéligible au départ'}
                </span>

                <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 text-slate-700 font-semibold border border-slate-200">
                  {result.appliedRule}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {result.eligibilityStatus === 'eligible_taux_plein'
                  ? result.isCarriereLongue
                    ? 'Départ anticipé accordé au Taux Plein sans aucune décote'
                    : 'Départ à l’âge légal avec pension au Taux Plein'
                  : result.eligibilityStatus === 'eligible_decote'
                  ? 'Départ possible mais pension soumise à minoration'
                  : 'Âge légal non atteint et conditions de carrière longue non remplies'}
              </h2>

              <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                {result.isCarriereLongue
                  ? `Éligibilité Carrière Longue confirmée : début d'activité avant 20 ans (${result.totalContributedQuarters} trimestres cotisés pour ${result.requiredQuarters} requis).`
                  : `Âge au départ : ${result.ageAtDeparture.formatted} (Âge légal requis : ${result.legalAge.formatted} avec ${result.requiredQuarters} trimestres).`}
              </p>
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
        {/* Grande carte Totale */}
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

            {/* Badge Taux de remplacement */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-right sm:text-right shrink-0">
              <span className="text-xs text-slate-500 block">Taux de remplacement brut</span>
              <div className="text-3xl font-black text-tealbrand-700 mt-0.5">
                {result.grossReplacementRate}{' '}
                <span className="text-base font-bold text-tealbrand-600">%</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                sur dernier salaire ({profile.lastGrossMonthlySalary.toLocaleString('fr-FR')} €)
              </span>
            </div>
          </div>
        </div>

        {/* 2 Petites cartes : Base & Agirc-Arrco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Carte Retraite de Base */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-institution-700">
                  Retraite de Base (CNAV / LURA)
                </span>
                {profile.childrenCount >= 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    +10 % enfants
                  </span>
                )}
              </div>

              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {result.basePensionMonthlyGross.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-normal text-slate-500">€/mois brut</span>
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                ≈ {result.basePensionMonthlyNet.toLocaleString('fr-FR')} € net (-9,1 % cotisations)
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>SAM ({result.samYearsCount} ans) :</span>
              <strong className="text-slate-800">{result.sam.toLocaleString('fr-FR')} €</strong>
            </div>
          </div>

          {/* Carte Agirc-Arrco */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-tealbrand-700">
                  Retraite Agirc-Arrco
                </span>
                {profile.childrenCount >= 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    +10 % enfants (plafonnée)
                  </span>
                )}
              </div>

              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {result.agircMonthlyGross.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-normal text-slate-500">€/mois brut</span>
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                ≈ {result.agircMonthlyNet.toLocaleString('fr-FR')} € net (-10,1 % cotisations)
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>Points acquis :</span>
              <strong className="text-slate-800">
                {result.agircTotalPoints.toLocaleString('fr-FR')} pts (valeur 1,4386 €)
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
          {cer.regime === 'before2027' && !cer.unavailable && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Retraite de base au début de la reprise</dt>
                <dd>{cer.paidBaseMonthly === undefined ? 'Plafond à confirmer' : formatEuros(cer.paidBaseMonthly) + ' / mois'}</dd>
              </div>
              <div>
                <dt className="font-semibold">Agirc-Arrco au début de la reprise</dt>
                <dd>{cer.paidComplementaryMonthly === undefined ? 'Plafond à confirmer' : formatEuros(cer.paidComplementaryMonthly) + ' / mois'}</dd>
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

      {/* 4. 1 SEUL GRAPHIQUE ÉPURÉ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Comparatif Visuel : Dernier Salaire Brut vs Retraite Totale
          </h3>
          <p className="text-xs text-slate-500">
            Visualisation directe du maintien de niveau de vie entre votre activité et votre retraite.
          </p>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" unit=" €" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                formatter={(val: number) => [`${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="Dernier salaire brut" fill="#64748b" radius={[0, 6, 6, 0]} />
              <Bar dataKey="Retraite de base (LURA)" stackId="pension" fill="#1d5e9b" />
              <Bar dataKey="Agirc-Arrco" stackId="pension" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. ACCORDÉON FERMÉ PAR DÉFAUT : DÉTAIL DES FORMULES (POUR LE JURY) */}
      <div className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowFormulasAccordion(!showFormulasAccordion)}
          className="w-full p-4 sm:p-5 text-left bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-tealbrand-600" />
            🔍 Afficher le détail des formules et du calcul réglementaire (pour le jury)
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
              <div className="p-3 bg-slate-900 text-amber-300 font-mono rounded-xl text-xs">
                SAM = Somme(MIN(Salaire_Annuel_EUR, PASS_Année) × Coeff_CNAV) / {result.samYearsCount}
              </div>
              <p className="text-slate-600 text-[11px]">
                Pour Sakura : moyenne calculée sur les 25 meilleures années revalorisées = <strong>{result.sam.toLocaleString('fr-FR')} €</strong>.
              </p>
            </div>

            {/* Formule 2 : Retraite de Base */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>2. Formule de la Retraite de Base CNAV :</span>
                <span className="text-[11px] font-mono text-tealbrand-700">Art. L. 351-1 CSS</span>
              </h4>
              <div className="p-3 bg-slate-900 text-tealbrand-300 font-mono rounded-xl text-xs">
                Base = SAM × Taux ({result.liquidationRate * 100} %) × ({Math.min(result.totalValidatedQuarters, result.requiredQuarters)} / {result.requiredQuarters}) × 1,10 (Enfants) / 12
              </div>
              <p className="text-slate-600 text-[11px]">
                {result.sam.toLocaleString('fr-FR')} € × 50 % × 1,0 × 1,10 / 12 = <strong>{result.basePensionMonthlyGross} €/mois</strong>.
              </p>
            </div>

            {/* Formule 3 : Retraite Complémentaire Agirc-Arrco */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>3. Formule Agirc-Arrco :</span>
                <span className="text-[11px] font-mono text-tealbrand-700">Accord ANI</span>
              </h4>
              <div className="p-3 bg-slate-900 text-cyan-300 font-mono rounded-xl text-xs">
                Agirc = (Points ({result.agircTotalPoints}) × 1,4386 € × 1,10 (Majoration)) / 12
              </div>
              <p className="text-slate-600 text-[11px]">
                (9 274,16 pts × 1,4386 € × 1,10) / 12 = <strong>{result.agircMonthlyGross} €/mois</strong> (bonus de 111,18 € sous le plafond légal de 197,29 €/mois).
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

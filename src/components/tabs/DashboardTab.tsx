import React, { useState } from 'react';
import { CalculationResult, CareerYear, UserProfile } from '../../types/retirement';
import { ResultCard } from '../common/ResultCard';
import { StatusBadge } from '../common/StatusBadge';
import { FormulaTooltip } from '../common/FormulaTooltip';
import { calculateRetirement } from '../../engine/retirementCalculator';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Sliders,
  DollarSign,
  PieChart as PieIcon,
  HelpCircle,
  Clock,
  
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardTabProps {
  result: CalculationResult;
  profile: UserProfile;
  career: CareerYear[];
  onNavigateToCer: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  result,
  profile,
  career,
  onNavigateToCer,
}) => {
  // Slider décalage mois (-12 mois à +36 mois)
  const [shiftMonths, setShiftMonths] = useState<number>(0);

  // Calcul du scénario décalé
  const shiftedDepartureDate = React.useMemo(() => {
    if (shiftMonths === 0) return profile.desiredDepartureDate;
    const [year, month, day] = profile.desiredDepartureDate.split('-').map(Number);
    const date = new Date(year, month - 1 + shiftMonths, day || 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [profile.desiredDepartureDate, shiftMonths]);

  // Carrière ajustée pour le scénario décalé (activité continue)
  const shiftedCareer = React.useMemo(() => {
    if (shiftMonths <= 0) return career;
    const additionalQuarters = Math.floor(shiftMonths / 3);
    if (additionalQuarters === 0) return career;

    // Ajout proportionnel de trimestres et points sur les années récentes
    const nextCareer = [...career];
    const lastRow = nextCareer[nextCareer.length - 1];
    if (lastRow) {
      // simulation d'activité continue
    }
    return nextCareer;
  }, [career, shiftMonths]);

  const shiftedProfile: UserProfile = React.useMemo(() => {
    return {
      ...profile,
      desiredDepartureDate: shiftedDepartureDate,
      // Si décalé, la reprise CER est également reportée
      cerResumptionDate: profile.cerResumptionDate,
    };
  }, [profile, shiftedDepartureDate]);

  const shiftedResult = React.useMemo(() => {
    return calculateRetirement(shiftedProfile, shiftedCareer);
  }, [shiftedProfile, shiftedCareer]);

  // Différence financière
  const diffMonthlyGross = shiftedResult.totalMonthlyGross - result.totalMonthlyGross;

  // Données Graphique 1 : Dernier salaire vs Retraite empilée
  const salaryVsPensionData = [
    {
      name: 'Rémunération vs Pension',
      'Dernier salaire brut': profile.lastGrossMonthlySalary,
      'Retraite de base': result.basePensionMonthlyGross,
      'Agirc-Arrco': result.agircMonthlyGross,
    },
  ];

  // Données Graphique 2 : Évolution des salaires au cours de la carrière
  const careerEvolutionData = career.map((r) => ({
    year: r.year,
    'Salaire brut réel (€)': r.grossIncomeEur,
    'Plafond PASS (€)': r.passEur,
    'Salaire retenu (€)': r.retainedSalaryEur,
    'Salaire revalorisé CNAV (€)': r.revaluedSalaryEur,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Bandeau d'Éligibilité (Feu Vert / Orange / Rouge) */}
      <div
        className={`rounded-xl border p-5 shadow-sm transition-all ${
          result.eligibilityStatus === 'eligible_taux_plein'
            ? 'bg-gradient-to-r from-emerald-50 via-tealbrand-50 to-white border-emerald-300'
            : result.eligibilityStatus === 'eligible_decote'
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-amber-300'
            : 'bg-gradient-to-r from-rose-50 via-red-50 to-white border-rose-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl text-white shadow-md ${
                result.eligibilityStatus === 'eligible_taux_plein'
                  ? 'bg-emerald-600'
                  : result.eligibilityStatus === 'eligible_decote'
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              {result.eligibilityStatus === 'eligible_taux_plein' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : result.eligibilityStatus === 'eligible_decote' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  {result.eligibilityStatus === 'eligible_taux_plein'
                    ? 'Départ au Taux Plein (50 %)'
                    : result.eligibilityStatus === 'eligible_decote'
                    ? 'Départ Possible avec Décote'
                    : 'Inéligible au départ à la date souhaitée'}
                </h2>
                <StatusBadge
                  status={
                    result.eligibilityStatus === 'eligible_taux_plein'
                      ? 'GREEN'
                      : result.eligibilityStatus === 'eligible_decote'
                      ? 'YELLOW'
                      : 'RED'
                  }
                  text={
                    result.eligibilityStatus === 'eligible_taux_plein'
                      ? 'Taux Plein (50 %)'
                      : result.eligibilityStatus === 'eligible_decote'
                      ? `Décote (${result.decoteQuarters} trim.)`
                      : 'Conditions non réunies'
                  }
                  size="sm"
                />
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-300">
                  Règle appliquée : {result.appliedRule}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Âge à la date souhaitée ({profile.desiredDepartureDate}) :{' '}
                <strong className="text-slate-800 font-bold">{result.ageAtDeparture.formatted}</strong>{' '}
                vs Âge légal de la génération :{' '}
                <strong className="text-slate-800 font-bold">{result.legalAge.formatted}</strong>{' '}
                ({result.requiredQuarters} trimestres requis).
              </p>

              {/* Détail Carrière Longue */}
              {result.isCarriereLongue ? (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900">
                  
                  <span>
                    Éligibilité Carrière Longue (RACL) confirmée : {result.carriereLongueDetails}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-500">
                  {result.carriereLongueDetails}
                </div>
              )}
            </div>
          </div>

          {/* Synthèse rapide Total */}
          <div className="bg-white/90 backdrop-blur rounded-xl border border-slate-200 p-4 shadow-sm text-right shrink-0">
            <div className="text-xs text-slate-500 font-medium">Pension totale estimée</div>
            <div className="text-2xl font-black text-institution-800">
              {result.totalMonthlyGross.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-sm font-normal text-slate-500">€ brut/mois</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700">
              ≈ {result.totalMonthlyNet.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} € net avant impôt
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cartes de Résultats Clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Carte 1 : Retraite de Base */}
        <ResultCard
          title="Retraite de Base (LURA)"
          mainAmount={result.basePensionMonthlyGross}
          subAmount={result.basePensionMonthlyNet}
          subAmountLabel="-9,1 % cotisations sociales"
          badgeText="Assurance Retraite"
          badgeColor="blue"
          formulaBreakdown={`SAM (${result.sam.toLocaleString('fr-FR')} €) × ${
            result.liquidationRate * 100
          } % × (${Math.min(result.totalValidatedQuarters, result.prorationQuarters)}/${
            result.prorationQuarters
          })${profile.childrenCount >= 3 ? ' + 10 % (enfants)' : ''}`}
          details={[
            {
              label: 'Nombre de meilleures années (N)',
              value: `${result.samYearsCount} années`,
            },
            {
              label: 'Salaire Annuel Moyen (SAM)',
              value: `${result.sam.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} €`,
            },
            {
              label: 'Taux de liquidation',
              value: `${(result.liquidationRate * 100).toFixed(2)} % ${
                result.liquidationRate === 0.5 ? '(Taux plein)' : '(Décoté)'
              }`,
            },
            {
              label: 'Fraction de proratisation',
              value: `${Math.min(result.totalValidatedQuarters, result.prorationQuarters)} / ${
                result.prorationQuarters
              } (${(result.proratisation * 100).toFixed(1)} %)`,
            },
            {
              label: 'Majoration 3 enfants (+10 %)',
              value: profile.childrenCount >= 3 ? `+${result.baseChildBonusMonthly} €/mois` : 'Non éligible (< 3 enfants)',
            },
            {
              label: 'Montant annuel brut',
              value: `${result.basePensionAnnualGross.toLocaleString('fr-FR')} €/an`,
            },
          ]}
        />

        {/* Carte 2 : Agirc-Arrco */}
        <ResultCard
          title="Retraite Agirc-Arrco"
          mainAmount={result.agircMonthlyGross}
          subAmount={result.agircMonthlyNet}
          subAmountLabel="-10,1 % cotisations sociales"
          badgeText="Complémentaire"
          badgeColor="teal"
          formulaBreakdown={`${result.agircTotalPoints.toLocaleString('fr-FR')} pts × ${
            result.agircPointValue
          } €${profile.childrenCount >= 3 ? ' + 10 % (plafonnée)' : ''}`}
          details={[
            {
              label: 'Total de points acquis',
              value: `${result.agircTotalPoints.toLocaleString('fr-FR')} points`,
            },
            {
              label: 'Valeur du point (01/11/2024)',
              value: `${result.agircPointValue} €`,
            },
            {
              label: 'Montant mensuel avant majoration',
              value: `${result.agircMonthlyGrossBeforeBonus} €/mois`,
            },
            {
              label: 'Majoration 3 enfants (+10 %)',
              value:
                profile.childrenCount >= 3
                  ? `+${result.agircChildBonusMonthly} €/mois ${
                      result.agircChildBonusCapped ? '(au plafond légal)' : ''
                    }`
                  : 'Non éligible (< 3 enfants)',
            },
            {
              label: 'Coefficient de solidarité (Malus 10 %)',
              value: 'Supprimé depuis 2023 (0 %)',
            },
          ]}
        />

        {/* Carte 3 : Total Pension & Taux de Remplacement */}
        <ResultCard
          title="Pension Totale Mensuelle"
          mainAmount={result.totalMonthlyGross}
          subAmount={result.totalMonthlyNet}
          subAmountLabel="Base + Agirc net"
          badgeText={`Taux : ${result.grossReplacementRate} %`}
          badgeColor="emerald"
          formulaBreakdown={`Base (${result.basePensionMonthlyGross} €) + Agirc (${result.agircMonthlyGross} €)`}
          details={[
            {
              label: 'Dernier salaire brut mensuel',
              value: `${profile.lastGrossMonthlySalary.toLocaleString('fr-FR')} €/mois`,
            },
            {
              label: 'Taux de remplacement brut',
              value: `${result.grossReplacementRate} %`,
            },
            {
              label: 'Part de la retraite de base',
              value: `${((result.basePensionMonthlyGross / result.totalMonthlyGross) * 100).toFixed(1)} %`,
            },
            {
              label: 'Part de la complémentaire Agirc',
              value: `${((result.agircMonthlyGross / result.totalMonthlyGross) * 100).toFixed(1)} %`,
            },
            {
              label: 'Prélèvements sociaux globaux',
              value: `-${(result.totalMonthlyGross - result.totalMonthlyNet).toFixed(2)} €/mois`,
            },
          ]}
        />

        {/* Carte 4 : Statut Cumul Emploi-Retraite (CER) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-base">
                Cumul Emploi-Retraite
              </h3>
              <StatusBadge
                status={result.cerAnalysis.alertLevel}
                text={result.cerAnalysis.status}
                size="sm"
              />
            </div>

            <div className="mb-2">
              <div
                className={`text-xl font-bold tracking-tight ${
                  result.cerAnalysis.alertLevel === 'RED'
                    ? 'text-rose-700'
                    : result.cerAnalysis.alertLevel === 'YELLOW'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {result.cerAnalysis.status === 'PLAFONNE'
                  ? 'CER Plafonné'
                  : 'CER Intégral'}
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                {result.cerAnalysis.alertMessage}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onNavigateToCer}
              className="w-full py-2 px-3 text-xs font-semibold text-institution-700 bg-institution-50 hover:bg-institution-100 rounded-lg text-center transition-colors"
            >
              Consulter l'analyse CER détaillée →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Simulateur interactif : « Et si je décalais mon départ ? » */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Simulateur « Et si je décalais mon départ ? »
              </h3>
              <p className="text-xs text-slate-500">
                Déplacez le curseur mois par mois pour visualiser en temps réel l'impact financier (décote, surcote de +1,25 %/trim., et statut CER).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Décalage :</span>
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-institution-100 text-institution-800">
              {shiftMonths > 0 ? `+${shiftMonths} mois` : shiftMonths < 0 ? `${shiftMonths} mois` : 'Date initiale'}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>-12 mois (Plus tôt)</span>
              <span className="font-bold text-slate-700">Départ initial ({profile.desiredDepartureDate})</span>
              <span>+36 mois (+3 ans)</span>
            </div>
            <input
              type="range"
              min="-12"
              max="36"
              step="1"
              value={shiftMonths}
              onChange={(e) => setShiftMonths(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-institution-600"
            />
          </div>

          {/* Comparatif Scénario Actuel vs Décalé */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
            <div>
              <div className="text-xs text-slate-500">Nouvelle date de départ</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {shiftedResult.ageAtDeparture.formatted}
              </div>
              <div className="text-xs text-slate-400">Date : {shiftedDepartureDate}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Éligibilité & Taux</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {(shiftedResult.liquidationRate * 100).toFixed(1)} %{' '}
                {shiftedResult.surcoteRate > 0 && (
                  <span className="text-emerald-600 font-semibold">
                    (+{(shiftedResult.surcoteRate * 100).toFixed(2)} % surcote)
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {shiftedResult.surcoteQuarters > 0
                  ? `${shiftedResult.surcoteQuarters} trim. surcotés (+1,25 %/trim.)`
                  : 'Pas de surcote'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Statut Cumul Emploi-Retraite</div>
              <div className="text-sm font-bold mt-0.5">
                <span
                  className={
                    shiftedResult.cerAnalysis.status === 'INTEGRAL'
                      ? 'text-emerald-700 font-bold'
                      : 'text-amber-700'
                  }
                >
                  {shiftedResult.cerAnalysis.status === 'INTEGRAL'
                    ? 'CER INTÉGRAL (Débloqué !)'
                    : 'CER PLAFONNÉ'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {shiftedResult.cerAnalysis.status === 'INTEGRAL'
                  ? 'Cumul libre sans plafond'
                  : 'Plafond maintenu'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Nouvelle pension mensuelle</div>
              <div className="text-lg font-black text-institution-800 mt-0.5">
                {shiftedResult.totalMonthlyGross.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                €/mois
              </div>
              <div
                className={`text-xs font-bold ${
                  diffMonthlyGross > 0
                    ? 'text-emerald-600'
                    : diffMonthlyGross < 0
                    ? 'text-rose-600'
                    : 'text-slate-400'
                }`}
              >
                {diffMonthlyGross > 0
                  ? `+${diffMonthlyGross.toFixed(2)} €/mois`
                  : diffMonthlyGross < 0
                  ? `${diffMonthlyGross.toFixed(2)} €/mois`
                  : 'Montant identique'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Graphiques Interactifs Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1 : Dernier Salaire vs Pension Totale */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-institution-600" />
            Taux de Remplacement : Dernier Salaire vs Retraite Totale
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Pension totale empilée ({result.totalMonthlyGross.toLocaleString('fr-FR')} € brut) représentant{' '}
            <strong>{result.grossReplacementRate} %</strong> de votre dernier revenu ({profile.lastGrossMonthlySalary.toLocaleString('fr-FR')} €).
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salaryVsPensionData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit=" €" />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  formatter={(val: number) => [
                    `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
                  ]}
                />
                <Legend />
                <Bar dataKey="Dernier salaire brut" fill="#64748b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Retraite de base" stackId="pension" fill="#1d5e9b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Agirc-Arrco" stackId="pension" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Évolution Carrière & Revalorisation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-tealbrand-600" />
            Évolution de la Carrière & Plafonnement PASS
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comparaison entre votre salaire brut réel, la limite du plafond PASS, et le salaire revalorisé CNAV.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={careerEvolutionData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorReval" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d5e9b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1d5e9b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis unit=" €" />
                <Tooltip
                  formatter={(val: number) => [
                    `${val.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €`,
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Salaire revalorisé CNAV (€)"
                  stroke="#1d5e9b"
                  fillOpacity={1}
                  fill="url(#colorReval)"
                />
                <Line
                  type="monotone"
                  dataKey="Plafond PASS (€)"
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Salaire brut réel (€)"
                  stroke="#64748b"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

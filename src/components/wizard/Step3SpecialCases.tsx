import React from 'react';
import { UserProfile, SpecialCircumstances, LongCareerResult } from '../../types/retirement';
import { LongCareerSummary } from '../common/LongCareerSummary';
import { EARLY_CAREER_AGES } from '../../engine/longCareer';
import { FormulaTooltip } from '../common/FormulaTooltip';
import {
  Clock,
  HeartPulse,
  ShieldCheck,
  Sliders,
  Layers,
  CheckCircle2,
  Info,
  Sliders,
} from 'lucide-react';

interface Step3SpecialCasesProps {
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
  longCareer: LongCareerResult;
}

export const Step3SpecialCases: React.FC<Step3SpecialCasesProps> = ({
  profile,
  onChangeProfile,
  longCareer,
}) => {
  const sc: SpecialCircumstances = profile.specialCircumstances || {
    earlyCareer: false,
    earlyQuartersCount: 0,
    careerInterruptions: false,
    sicknessQuarters: 0,
    maternityQuarters: 0,
    unemploymentQuarters: 0,
    avpfQuarters: 0,
    automaticFullRate: false,
    fullRateReason: 'none',
    polycotisantMsa: false,
  };

  const updateSc = (partial: Partial<SpecialCircumstances>) => {
    const updatedSc = { ...sc, ...partial };
    onChangeProfile({ specialCircumstances: updatedSc });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête de l'étape */}
      <div className="text-center space-y-1 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-institution-50 text-institution-700 text-xs font-semibold border border-institution-200 mb-2">
          <Sliders className="w-3.5 h-3.5" />
          Étape 3 sur 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cas particuliers & Spécificités
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Ces critères permettent de bonifier vos droits, d'avancer l'âge de départ (carrière longue)
          ou d'activer le taux plein automatique.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-slate-900">Départ anticipé pour carrière longue</h3>
              <p className="mt-1 text-sm text-slate-600">
                Comparez les trimestres validés à la fin de chacune des années repères.
                Il en faut {longCareer.requiredEarlyQuarters} à une borne.
              </p>
            </div>
          </div>

          <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EARLY_CAREER_AGES.map((age) => {
              const legacy = age === 20 && sc.earlyCareer && sc.earlyQuartersCount > 0 ? sc.earlyQuartersCount : undefined;
              const declared = sc.earlyCareerQuarters?.[age] ?? legacy;
              return (
                <label key={age} className="text-sm font-semibold text-slate-700">
                  Fin de l’année des {age} ans
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={declared ?? ''}
                    placeholder={longCareer.earlyQuarters[age]?.toString() ?? 'Inconnu'}
                    onChange={(event) => updateSc({
                      earlyQuartersCount: age === 20 ? 0 : sc.earlyQuartersCount,
                      earlyCareerQuarters: {
                        ...sc.earlyCareerQuarters,
                        [age]: event.target.value === '' ? undefined : Math.max(0, Math.floor(event.target.valueAsNumber)),
                      },
                    })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              );
            })}
          </div>
          <p className="mb-4 text-xs text-slate-600">
            Les valeurs en grisé viennent du relevé détaillé. Saisissez un total pour remplacer une valeur ou compléter le mode express.
          </p>
          <label className="block max-w-xl text-sm font-semibold text-slate-700">
            Total carrière longue confirmé à la date de départ
            <input
              type="number"
              min={0}
              step={1}
              value={sc.longCareerConfirmedQuarters ?? ''}
              placeholder={longCareer.contributedQuarters?.toString() ?? 'Inconnu'}
              onChange={(event) => updateSc({
                longCareerConfirmedQuarters: event.target.value === '' ? undefined : Math.max(0, Math.floor(event.target.valueAsNumber)),
              })}
              className="mt-1 block w-full max-w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <p className="mb-4 mt-1 text-xs text-slate-600">
            Utilisez le total confirmé par votre caisse, y compris les trimestres réputés cotisés
            qu’elle a déjà retenus. En laissant ce champ vide, le simulateur utilise les trimestres
            cotisés du relevé ou le total du mode express.
          </p>
          <div className="rounded-lg bg-slate-50 p-3" aria-live="polite">
            <LongCareerSummary result={longCareer} />
          </div>
        </section>

        {/* CARTE 2 : Interruptions de carrière & Périodes assimilées */}
        <div
          className={`rounded-2xl border-2 p-5 sm:p-6 transition-all duration-200 shadow-sm ${
            sc.careerInterruptions
              ? 'border-institution-300 bg-institution-50/20 ring-1 ring-institution-200'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  sc.careerInterruptions
                    ? 'bg-institution-100 text-institution-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    2. Interruptions de carrière (Périodes assimilées)
                  </h3>
                  <FormulaTooltip
                    title="Périodes réputées cotisées (RACL - Règle des 4 trimestres)"
                    formula="Maladie / AT : max 4 trimestres. Chômage indemnisé : max 4 trimestres. AVPF : max 4 trimestres. Maternité : tous les trimestres validés."
                    articleCss="Art. D. 351-1-2 du Code de la Sécurité Sociale"
                  
              explanation=""
            />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Arrêts maladie, maternité, chômage indemnisé ou congé parental (AVPF).
                </p>
              </div>
            </div>

            {/* Boutons Oui / Non */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => updateSc({ careerInterruptions: false })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !sc.careerInterruptions
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => updateSc({ careerInterruptions: true })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sc.careerInterruptions
                    ? 'bg-institution-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Oui
              </button>
            </div>
          </div>

          {/* Déplié si Oui */}
          {sc.careerInterruptions && (
            <div className="mt-5 pt-4 border-t border-institution-100 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Maladie / AT */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Maladie / AT (max 4)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={sc.sicknessQuarters}
                    onChange={(e) =>
                      updateSc({ sicknessQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)) })
                    }
                    className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                {/* Maternité */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Maternité (sans plafond)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    value={sc.maternityQuarters}
                    onChange={(e) =>
                      updateSc({ maternityQuarters: Math.max(0, parseInt(e.target.value, 10) || 0) })
                    }
                    className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                {/* Chômage */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Chômage (max 4)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={sc.unemploymentQuarters}
                    onChange={(e) =>
                      updateSc({ unemploymentQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)) })
                    }
                    className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                {/* AVPF */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    AVPF / Parental (max 4)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={sc.avpfQuarters}
                    onChange={(e) =>
                      updateSc({ avpfQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)) })
                    }
                    className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Info className="w-4 h-4 text-institution-600 shrink-0" />
                <span>
                  Ces compteurs globaux servent à documenter votre situation. Pour la carrière longue,
                  utilisez le total confirmé par votre caisse dans la première section.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CARTE 3 : Taux plein automatique (Inaptitude, handicap, invalidité) */}
        <div
          className={`rounded-2xl border-2 p-5 sm:p-6 transition-all duration-200 shadow-sm ${
            sc.automaticFullRate
              ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  sc.automaticFullRate ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    3. Taux plein automatique (Inaptitude / Handicap / Invalidité)
                  </h3>
                  <FormulaTooltip
                    title="Taux plein garanti à 62 ans (Art. L. 351-8 CSS)"
                    formula="Taux = 50 % d'office à compter de 62 ans, quelle que soit la durée d'assurance validée."
                    articleCss="Art. L. 351-8 CSS, 1° et 3°"
                  
              explanation=""
            />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Bénéficiez-vous d'une reconnaissance d'inaptitude, d'une pension d'invalidité ou d'un handicap ?
                </p>
              </div>
            </div>

            {/* Boutons Oui / Non */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => updateSc({ automaticFullRate: false, fullRateReason: 'none' })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !sc.automaticFullRate
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Non
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSc({
                    automaticFullRate: true,
                    fullRateReason: sc.fullRateReason === 'none' ? 'inaptitude' : sc.fullRateReason,
                  })
                }
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sc.automaticFullRate
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Oui
              </button>
            </div>
          </div>

          {/* Déplié si Oui */}
          {sc.automaticFullRate && (
            <div className="mt-5 pt-4 border-t border-amber-100 space-y-3">
              <div className="text-xs font-semibold text-slate-600 mb-1.5">
                Sélectionnez le motif ouvrant droit au taux plein à 62 ans :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'inaptitude', label: 'Inaptitude au travail', desc: 'Avis du médecin conseil' },
                  { id: 'handicap', label: 'Handicap (≥ 50 %)', desc: 'Reconnaissance MDPH' },
                  { id: 'invalidite', label: 'Invalidité (cat. 2 ou 3)', desc: 'Pension Sécurité Sociale' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSc({ fullRateReason: item.id as any })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      sc.fullRateReason === item.id
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="bg-amber-100/70 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Taux plein garanti de 50 % accordé à 62 ans sans aucune décote.</span>
              </div>
            </div>
          )}
        </div>

        {/* CARTE 4 : Poly-cotisant (CNAV + MSA salarié - LURA) */}
        <div
          className={`rounded-2xl border-2 p-5 sm:p-6 transition-all duration-200 shadow-sm ${
            sc.polycotisantMsa
              ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  sc.polycotisantMsa ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    4. Poly-cotisant (Salarié du privé CNAV + Salarié agricole MSA)
                  </h3>
                  <FormulaTooltip
                    title="Liquidation Unique des Régimes Alignés (LURA)"
                    formula="Les salaires CNAV et MSA sont fusionnés chaque année (plafonnés à 1 PASS global). Un seul interlocuteur verse l'ensemble de la retraite de base."
                    articleCss="Art. L. 173-1-2 du Code de la Sécurité Sociale (Loi 2014-40)"
                  
              explanation=""
            />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Avez-vous cotisé au régime général (CNAV) et au régime agricole (MSA Salarié) ?
                </p>
              </div>
            </div>

            {/* Boutons Oui / Non */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => updateSc({ polycotisantMsa: false })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !sc.polycotisantMsa
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => updateSc({ polycotisantMsa: true })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sc.polycotisantMsa
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Oui
              </button>
            </div>
          </div>

          {/* Message si Oui */}
          {sc.polycotisantMsa && (
            <div className="mt-5 pt-4 border-t border-indigo-100">
              <div className="bg-indigo-100/80 text-indigo-900 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-indigo-950">
                    Dispositif LURA activé automatiquement (Art. L. 173-1-2 CSS)
                  </div>
                  <div className="text-indigo-800 text-xs mt-0.5">
                    Vos salaires CNAV et MSA sont sommés par année dans la limite de 1 PASS. Vous bénéficiez
                    d'une <strong>pension unique</strong> liquidée par votre dernier régime d'affiliation, sans
                    double pénalité de proratisation.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

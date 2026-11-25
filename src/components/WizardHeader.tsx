import React from 'react';
import {
  RotateCcw,
  Tv,
  Check,
  User,
  Briefcase,
  Sliders,
  Sparkles,
  Calendar,
  Award,
  ArrowRight,
} from 'lucide-react';

export type WizardStepId = 1 | 2 | 3 | 4 | 5;

interface WizardHeaderProps {
  currentStep: WizardStepId;
  onSelectStep: (step: WizardStepId) => void;
  onLoadScenario: (scenario: 'sakura' | 'lfss2026' | 'blank') => void;
  activeScenarioName: 'sakura' | 'lfss2026' | 'blank' | 'custom';
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  currentStep,
  onSelectStep,
  onLoadScenario,
  activeScenarioName,
  presentationMode,
  onTogglePresentationMode,
}) => {
  const steps = [
    { id: 1 as WizardStepId, label: 'Identité & Famille', icon: <User className="w-3.5 h-3.5" /> },
    { id: 2 as WizardStepId, label: 'Votre Carrière', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 3 as WizardStepId, label: 'Cas Particuliers', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 4 as WizardStepId, label: 'Départ & CER', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 5 as WizardStepId, label: 'Bilan Conseiller', icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      {/* 1. Barre d'accès rapide discrète tout en haut */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 lg:px-8 py-2 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Logo / Nom de l'outil */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tealbrand-400"></span>
              Simulateur Retraite & CER
            </span>
            </div>

          {/* 3 Raccourcis Scénarios + Bilan direct + Mode Présentation */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Raccourci 1 : Cas Sakura */}
            <button
              type="button"
              onClick={() => onLoadScenario('sakura')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                activeScenarioName === 'sakura'
                  ? 'bg-tealbrand-500 text-white ring-1 ring-tealbrand-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <span>Cas Sakura</span>
            </button>

            {/* Raccourci 2 : Cas Test 2025 */}
            <button
              type="button"
              onClick={() => onLoadScenario('lfss2026')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                activeScenarioName === 'lfss2026'
                  ? 'bg-tealbrand-500 text-white ring-1 ring-tealbrand-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <span>Cas Test 2025</span>
            </button>

            {/* Raccourci 3 : Nouvelle simulation */}
            <button
              type="button"
              onClick={() => onLoadScenario('blank')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Nouveau profil</span>
            </button>

            {/* Raccourci direct Bilan (Étape 5) */}
            <button
              type="button"
              onClick={() => onSelectStep(5)}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span>Aller au Bilan</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            {/* Mode Présentation Vidéoprojecteur */}
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                presentationMode
                  ? 'bg-tealbrand-400 text-slate-900 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
              title="Agrandir l'affichage pour vidéoprojecteur"
            >
              <Tv className="w-3 h-3" />
              <span>{presentationMode ? 'Mode Présentation ON' : 'Vidéoproj.'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barre de progression visuelle (Stepper interactif) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <nav aria-label="Progression du formulaire">
          <ol className="flex items-center justify-between w-full">
            {steps.map((step, idx) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <li key={step.id} className="relative flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelectStep(step.id)}
                    className="group flex flex-col sm:flex-row items-center gap-2 focus:outline-none w-full"
                  >
                    {/* Cercle indicateur */}
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 shrink-0 ${
                        isCurrent
                          ? 'bg-tealbrand-600 border-tealbrand-600 text-white shadow-sm ring-4 ring-tealbrand-100'
                          : isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                    </span>

                    {/* Titre de l'étape */}
                    <span className="hidden md:block text-left">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider block ${
                          isCurrent
                            ? 'text-tealbrand-700'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        Étape {step.id}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-slate-900 font-bold'
                            : isCompleted
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </span>
                  </button>

                  {/* Ligne connectrice entre les étapes */}
                  {idx < steps.length - 1 && (
                    <div
                      className={`hidden sm:block absolute top-4 left-1/2 w-full h-0.5 -z-10 transition-colors ${
                        currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
};

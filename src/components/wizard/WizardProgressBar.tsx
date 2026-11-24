import React from 'react';
import { User, FileText, Sliders, Calendar, Award, Check } from 'lucide-react';

interface WizardProgressBarProps {
  currentStep: number; // 1 to 5
  onSelectStep: (step: number) => void;
  maxStepUnlocked?: number;
}

export const WIZARD_STEPS = [
  { id: 1, label: 'Identité', sublabel: 'Qui êtes-vous ?', icon: User },
  { id: 2, label: 'Carrière', sublabel: 'Parcours & Salaires', icon: FileText },
  { id: 3, label: 'Cas particuliers', sublabel: 'Assimilés & RACL', icon: Sliders },
  { id: 4, label: 'Départ & Cumul', sublabel: 'Date & Projet CER', icon: Calendar },
  { id: 5, label: 'Bilan Conseiller', sublabel: 'Synthèse & Verdict', icon: Award },
];

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  onSelectStep,
  maxStepUnlocked = 5,
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-xs py-4 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-center justify-between">
          {/* Ligne d'arrière-plan */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
          
          {/* Ligne de progression dynamique */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-tealbrand-600 transition-all duration-300 z-0"
            style={{
              width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%`,
            }}
          />

          {WIZARD_STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = step.id <= maxStepUnlocked;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && onSelectStep(step.id)}
                disabled={!isClickable}
                className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {/* Cercle d'étape */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-tealbrand-600 text-white border-tealbrand-600 shadow-sm'
                      : isCurrent
                      ? 'bg-institution-800 text-white border-tealbrand-500 ring-4 ring-tealbrand-100 shadow-md scale-105'
                      : 'bg-white text-slate-500 border-slate-300 group-hover:border-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Libellé d'étape */}
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-institution-900'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="hidden sm:block text-[10px] text-slate-400 font-normal">
                    {step.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

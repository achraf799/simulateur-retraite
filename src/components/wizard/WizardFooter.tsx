import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WizardStepId } from '../WizardHeader';

interface WizardFooterProps {
  currentStep: WizardStepId;
  onPrevStep: () => void;
  onNextStep: () => void;
  onGoToBilan: () => void;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  currentStep,
  onPrevStep,
  onNextStep,
  onGoToBilan,
}) => {
  const nextLabels: Record<number, string> = {
    1: 'Étape 2 : Votre carrière →',
    2: 'Étape 3 : Situations particulières →',
    3: 'Étape 4 : Départ & Projet CER →',
    4: 'Étape 5 : Calculer & Voir mon Bilan ✨',
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 sticky bottom-0 z-30 py-4 px-4 sm:px-8 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Bouton Précédent */}
        <div>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={onPrevStep}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">Étape 1 sur 5</span>
          )}
        </div>

        {/* Indicateur d'étape */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Étape {currentStep} sur 5</span>
        </div>

        {/* Bouton Suivant ou Bilan */}
        <div>
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={currentStep === 4 ? onGoToBilan : onNextStep}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                currentStep === 4
                  ? 'bg-gradient-to-r from-tealbrand-600 to-institution-600 hover:from-tealbrand-700 hover:to-institution-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-tealbrand-600 hover:bg-tealbrand-700 text-white'
              }`}
            >
              <span>{nextLabels[currentStep]}</span>
              {currentStep === 4 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <span>Imprimer / Exporter le Bilan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

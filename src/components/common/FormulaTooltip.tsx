import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FormulaTooltipProps {
  title: string;
  formula: string;
  explanation: string;
  articleCss?: string;
}

export const FormulaTooltip: React.FC<FormulaTooltipProps> = ({
  title,
  formula,
  explanation,
  articleCss,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-institution-600 transition-colors p-0.5 focus:outline-none"
        title="Détail de la règle de calcul"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
          <div className="font-semibold text-tealbrand-400 mb-1">{title}</div>
          <div className="font-mono bg-slate-800 p-1.5 rounded text-amber-300 mb-1.5 break-all">
            {formula}
          </div>
          <p className="text-slate-300 leading-relaxed mb-1">{explanation}</p>
          {articleCss && (
            <div className="text-[10px] text-slate-400 border-t border-slate-700 pt-1 mt-1 font-mono">
              Réf : {articleCss}
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

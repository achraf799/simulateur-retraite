import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface SimpleTooltipProps {
  term: string;
  explanation: string;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ term, explanation }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-tealbrand-600 transition-colors p-0.5 focus:outline-none"
        aria-label={`Explication de ${term}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl leading-relaxed pointer-events-none text-left font-normal normal-case">
          <strong className="text-tealbrand-300 block mb-0.5">{term}</strong>
          {explanation}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
};

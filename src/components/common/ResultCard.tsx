import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ResultCardProps {
  title: string;
  mainAmount: number;
  subAmount?: number;
  subAmountLabel?: string;
  badgeText?: string;
  badgeColor?: 'blue' | 'teal' | 'emerald' | 'amber';
  details?: Array<{ label: string; value: string | number }>;
  formulaBreakdown?: string;
  icon?: React.ReactNode;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  mainAmount,
  subAmount,
  subAmountLabel = 'Estimation nette avant impôt',
  badgeText,
  badgeColor = 'blue',
  details,
  formulaBreakdown,
  icon,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const badgeBg = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[badgeColor];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-institution-600">{icon}</div>}
            <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
          </div>
          {badgeText && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${badgeBg}`}>
              {badgeText}
            </span>
          )}
        </div>

        <div className="mb-2">
          <div className="text-3xl font-extrabold text-institution-700 tracking-tight">
            {mainAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-lg font-normal text-slate-500">€/mois</span>
          </div>
          {subAmount !== undefined && (
            <div className="text-sm font-medium text-emerald-600 mt-0.5">
              ≈ {subAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € net{' '}
              <span className="text-xs text-slate-400">({subAmountLabel})</span>
            </div>
          )}
        </div>

        {formulaBreakdown && (
          <div className="mt-3 py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-600">
            {formulaBreakdown}
          </div>
        )}
      </div>

      {details && details.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-medium text-institution-600 hover:text-institution-800"
          >
            <span>{showDetails ? 'Masquer le détail du calcul' : 'Voir le détail du calcul'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <dl className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {details.map((d, idx) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-200 last:border-b-0">
                  <dt className="text-slate-500">{d.label}</dt>
                  <dd className="font-semibold text-slate-800">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
};

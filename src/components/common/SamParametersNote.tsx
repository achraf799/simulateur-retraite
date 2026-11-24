import { LAST_AVAILABLE_PASS_YEAR, LAST_CONFIRMED_PASS_YEAR } from '../../constants/passHistory';
import type { SamAnalysis } from '../../types/retirement';

export function SamParametersNote({ analysis }: { analysis: SamAnalysis }) {
  if (analysis.source !== 'career') return null;

  const projectedPassYears = analysis.projectedPassYears ?? [];
  const usesAnnouncedPass = LAST_AVAILABLE_PASS_YEAR > LAST_CONFIRMED_PASS_YEAR
    && projectedPassYears.includes(LAST_AVAILABLE_PASS_YEAR);
  const usesFuturePass = projectedPassYears.some((year) => year > LAST_AVAILABLE_PASS_YEAR);

  return (
    <div className="space-y-1 text-xs text-slate-600">
      {analysis.usesProjectedRevaluation ? (
        <p>
          Projection avec le barème CNAV {analysis.revaluationYear}. Les revenus à partir de
          {' '}{analysis.revaluationYear} sont conservés sans revalorisation supplémentaire.
        </p>
      ) : (
        <p>Barème CNAV de liquidation {analysis.revaluationYear}.</p>
      )}
      {usesAnnouncedPass && (
        <p>Le calcul utilise le plafond de Sécurité sociale {LAST_AVAILABLE_PASS_YEAR} annoncé, en attente de l’arrêté.</p>
      )}
      {usesFuturePass && <p>Pour les années suivantes, le dernier plafond disponible sert d’hypothèse.</p>}
    </div>
  );
}

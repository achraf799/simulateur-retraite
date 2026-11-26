import type { LongCareerResult } from '../../types/retirement';

interface LongCareerSummaryProps {
  result: LongCareerResult;
}

export function LongCareerSummary({ result }: LongCareerSummaryProps) {
  const months = result.minimumAgeMonths;
  const age = months === undefined ? undefined : Math.floor(months / 12);
  const remainingMonths = (months ?? 0) % 12;

  return (
    <div className="space-y-1 text-xs text-slate-700">
      <p>{result.details}</p>
      {result.startAge !== undefined && age !== undefined && (
        <p>
          Borne {result.startAge} ans · Seuil d’âge de {age} ans
          {remainingMonths > 0 ? ` et ${remainingMonths} mois` : ''}.
        </p>
      )}
      {result.earliestAgeDate && (
        <p>
          Première date au regard de l’âge · {result.earliestAgeDate.split('-').reverse().join('/')}
          {' '}sous réserve de la durée acquise à cette date.
        </p>
      )}
      {result.contributedQuarters !== undefined && (
        <p>Durée cotisée ou réputée cotisée · {result.contributedQuarters} / {result.requiredQuarters} trimestres.</p>
      )}
      {result.possibleContributedQuarters !== undefined && (
        <p>Jusqu’à {result.possibleContributedQuarters} trimestres si la caisse confirme les périodes assimilées en attente.</p>
      )}
      {result.safeguardToVerify && (
        <p>Si la durée requise était acquise avant septembre 2023, vérifiez la clause de sauvegarde auprès de votre caisse.</p>
      )}
    </div>
  );
}

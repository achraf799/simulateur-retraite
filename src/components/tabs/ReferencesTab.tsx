import React, { useState } from 'react';
import { REPERES_2026, GENERATION_SCALES } from '../../constants/parameters2026';
import { PASS_HISTORY } from '../../constants/passHistory';
import { getCnavCoeff } from '../../constants/cnavCoefficients';
import { BookOpen, Scale, Landmark, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export const ReferencesTab: React.FC = () => {
  const [showPassHistory, setShowPassHistory] = useState(false);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-institution-50 text-institution-700 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Barèmes Officiels, Repères 2026 & Fiches Mémo Oral
            </h2>
            <p className="text-xs text-slate-500">
              Guide juridique et technique pour justifier chaque formule et chaque montant devant le jury d'examen.
            </p>
          </div>
        </div>

        {/* 1. Les Repères 2026 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">PASS 2026 (Annuel)</div>
            <div className="text-sm font-extrabold text-slate-800">
              {REPERES_2026.pass2026.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[10px] text-slate-400">PMSS : {REPERES_2026.pmss2026} €/mois</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">SMIC horaire 2026</div>
            <div className="text-sm font-extrabold text-slate-800">
              {REPERES_2026.smicHoraire2026.toFixed(2)} €
            </div>
            <div className="text-[10px] text-slate-400">
              Mensuel 35h : {REPERES_2026.smicMensuel2026.toLocaleString('fr-FR')} €
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Plafond 1,6 SMIC (CER)</div>
            <div className="text-sm font-extrabold text-tealbrand-800">
              {REPERES_2026.plafond1_6SmicMensuel.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[10px] text-slate-400">Plafond cumul plafonné</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Validation 1 trimestre</div>
            <div className="text-sm font-extrabold text-slate-800">
              {REPERES_2026.salaireValidationTrimestre2026.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[10px] text-slate-400">4 trim. = 7 212 € brut</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Point Agirc-Arrco</div>
            <div className="text-sm font-extrabold text-indigo-700">
              {REPERES_2026.valeurPointAgircArrco} €
            </div>
            <div className="text-[10px] text-slate-400">Valeur au 01/11/2024</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Nouveaux droits CER</div>
            <div className="text-sm font-extrabold text-emerald-700">
              {REPERES_2026.plafondNouveauxDroitsCerAnnuel} €/an
            </div>
            <div className="text-[10px] text-slate-400">5 % du PASS annuel</div>
          </div>
        </div>
      </div>

      {/* 2. Tableau Comparatif Réforme 2023 vs Suspension LFSS 2026 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-5 h-5 text-institution-600" />
          <h3 className="text-base font-bold text-slate-800">
            Barème de Génération : Réforme 2023 vs Suspension LFSS 2026 (dès 01/09/2026)
          </h3>
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          La loi de financement de la Sécurité sociale pour 2026 introduit une clause de suspension pour les départs intervenant à compter du 1er septembre 2026, gelant temporairement l'âge légal et le nombre de trimestres requis pour les générations 1964 à 1968.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="py-2.5 px-3">Génération</th>
                <th className="py-2.5 px-3 bg-slate-200/60">Âge légal 2023</th>
                <th className="py-2.5 px-3 bg-slate-200/60">Trimestres 2023</th>
                <th className="py-2.5 px-3 bg-tealbrand-50 text-tealbrand-900">Âge légal LFSS 2026 (dès 01/09/2026)</th>
                <th className="py-2.5 px-3 bg-tealbrand-50 text-tealbrand-900">Trimestres LFSS 2026</th>
                <th className="py-2.5 px-3">Impact / Différence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GENERATION_SCALES.map((scale, idx) => {
                const label = scale.birthMonthStart
                  ? `${scale.birthYear} (Mois ${scale.birthMonthStart} à ${scale.birthMonthEnd})`
                  : `${scale.birthYear}`;

                const age2023 = `${scale.legalAgeYears2023} ans ${
                  scale.legalAgeMonths2023 > 0 ? `${scale.legalAgeMonths2023} m` : ''
                }`;
                const age2026 = `${scale.legalAgeYears2026} ans ${
                  scale.legalAgeMonths2026 > 0 ? `${scale.legalAgeMonths2026} m` : ''
                }`;

                const hasDiff =
                  scale.legalAgeYears2023 !== scale.legalAgeYears2026 ||
                  scale.legalAgeMonths2023 !== scale.legalAgeMonths2026 ||
                  scale.quartersRequired2023 !== scale.quartersRequired2026;

                return (
                  <tr key={idx} className={hasDiff ? 'bg-tealbrand-50/20 font-medium' : ''}>
                    <td className="py-2 px-3 font-semibold text-slate-800">{label}</td>
                    <td className="py-2 px-3 bg-slate-50">{age2023}</td>
                    <td className="py-2 px-3 bg-slate-50">{scale.quartersRequired2023} trim.</td>
                    <td className="py-2 px-3 bg-tealbrand-50/50 font-bold text-tealbrand-900">
                      {age2026}
                    </td>
                    <td className="py-2 px-3 bg-tealbrand-50/50 font-bold text-tealbrand-900">
                      {scale.quartersRequired2026} trim.
                    </td>
                    <td className="py-2 px-3">
                      {hasDiff ? (
                        <span className="text-tealbrand-700 font-bold">
                          Gain : -{scale.quartersRequired2023 - scale.quartersRequired2026} trim. / départ anticipé
                        </span>
                      ) : (
                        <span className="text-slate-400">Identique</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Fiches Formules & Droit Social pour l'oral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Fiche 1 : Retraite de Base */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-institution-700">
            <FileText className="w-4 h-4" />
            <h4 className="font-bold text-sm">Formule Retraite de Base (Assurance Retraite / LURA)</h4>
          </div>

          <div className="p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-lg">
            Pension = SAM × Taux × (Trimestres retenus / Requis) × (1 + Surcote) + Majoration
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li>
              <strong>SAM :</strong> Moyenne arithmétique des salaires revalorisés des <strong>25 meilleures années</strong> (ou 23/24 si LFSS 2026 + enfants). Chaque salaire annuel est plafonné au PASS de l'année.
            </li>
            <li>
              <strong>Taux de liquidation :</strong> 50 % au taux plein ; sinon décote de -0,625 point par trimestre manquant (plafonné à 20 trimestres, minimum 37,5 %).
            </li>
            <li>
              <strong>Proratisation :</strong> Trimestres validés / Trimestres requis (plafonné à 100 %).
            </li>
            <li>
              <strong>Surcote :</strong> +1,25 % par trimestre civil travaillé après l'âge légal ET au-delà du taux plein.
            </li>
            <li>
              <strong>Majoration 3 enfants :</strong> +10 % sur la pension de base (Art. L. 351-12 CSS).
            </li>
            <li>
              <strong>Prélèvements sociaux (taux normal) :</strong> -9,1 % (CSG 8,3 % + CRDS 0,5 % + CASA 0,3 %).
            </li>
          </ul>
        </div>

        {/* Fiche 2 : Retraite Complémentaire & Cumul */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-tealbrand-700">
            <FileText className="w-4 h-4" />
            <h4 className="font-bold text-sm">Formule Agirc-Arrco & Règles du Cumul (CER)</h4>
          </div>

          <div className="p-3 bg-slate-900 text-tealbrand-300 font-mono text-xs rounded-lg">
            Agirc-Arrco = Total points × Valeur point (1,4386 €) + Majoration (plafonnée)
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Majoration enfants Agirc-Arrco :</strong> +10 % dès 3 enfants élevés, plafonnée à <strong>2 367,48 €/an</strong> (au 01/11/2024), soit 197,29 €/mois.
            </li>
            <li>
              <strong>Prélèvements sociaux Agirc-Arrco :</strong> -10,1 % (CSG 8,3 % + CRDS 0,5 % + CASA 0,3 % + Cotisation Maladie 1,0 %).
            </li>
            <li>
              <strong>CER Plafonné (&lt; âge légal ou décote) :</strong> Délai de carence obligatoire de 6 mois chez l'ancien employeur (Art. L. 161-22 CSS). En cas de reprise avant 6 mois : <strong>suspension intégrale des pensions</strong>. Plafond de cumul : MAX(Dernier salaire, 1,6 SMIC).
            </li>
            <li>
              <strong>CER Intégral (≥ âge légal et taux plein) :</strong> Cumul sans plafond de ressources. Les cotisations créent une <strong>seconde pension</strong> de base plafonnée à 5 % du PASS (2 403 €/an en 2026).
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Historique PASS 1979-2026 (Dépliable) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-institution-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Historique des Plafonds Annuels de la Sécurité Sociale (PASS 1979-2026)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPassHistory(!showPassHistory)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-institution-600 hover:text-institution-800"
          >
            <span>{showPassHistory ? 'Masquer' : 'Afficher la table complète'}</span>
            {showPassHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showPassHistory && (
          <div className="mt-4 overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Année</th>
                  <th className="py-2 px-3">PASS (€)</th>
                  <th className="py-2 px-3">PMSS (€)</th>
                  <th className="py-2 px-3">PASS historique (FRF)</th>
                  <th className="py-2 px-3">Coeff Revalo 2025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(PASS_HISTORY)
                  .sort((a, b) => b.year - a.year)
                  .map((p) => (
                    <tr key={p.year} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold">{p.year}</td>
                      <td className="py-1.5 px-3 font-mono">{p.passEur.toLocaleString('fr-FR')} €</td>
                      <td className="py-1.5 px-3 font-mono">{p.pmssEur.toLocaleString('fr-FR')} €</td>
                      <td className="py-1.5 px-3 font-mono text-slate-400">
                        {p.passFrf ? `${p.passFrf.toLocaleString('fr-FR')} FRF` : '—'}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-institution-700 font-semibold">
                        {p.year >= 1948 && p.year < 2025 ? getCnavCoeff(p.year, 2025).toFixed(3) : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { CareerYear, Currency, EventType, Regime } from '../../types/retirement';
import { getPassForYear, FRF_TO_EUR_RATE } from '../../constants/passHistory';
import { getCnavCoeff } from '../../constants/cnavCoefficients';
import { FormulaTooltip } from '../common/FormulaTooltip';
import {
  Plus,
  Trash2,
  ArrowUpDown,
  Filter,
  Award,
  
} from 'lucide-react';

interface CareerTabProps {
  career: CareerYear[];
  onChangeCareer: (updated: CareerYear[]) => void;
  samYearsCount: number;
  sam: number;
  liquidationYear: number;
}

export const CareerTab: React.FC<CareerTabProps> = ({
  career,
  onChangeCareer,
  samYearsCount,
  sam,
  liquidationYear,
}) => {
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Recalcul d'une ligne
  const updateRow = (index: number, changes: Partial<CareerYear>) => {
    const nextCareer = [...career];
    const currentRow = { ...nextCareer[index], ...changes };

    // Si changement de devise ou de revenu, recalculer grossIncomeEur
    const grossIncomeEur =
      currentRow.currency === 'FRF'
        ? Number((currentRow.grossIncome / FRF_TO_EUR_RATE).toFixed(2))
        : currentRow.grossIncome;

    const passEur = getPassForYear(currentRow.year);
    const retainedSalaryEur = Math.min(grossIncomeEur, passEur);
    const cnavCoeff = getCnavCoeff(currentRow.year, liquidationYear);
    const revaluedSalaryEur = Number((retainedSalaryEur * cnavCoeff).toFixed(2));

    nextCareer[index] = {
      ...currentRow,
      grossIncomeEur,
      passEur,
      retainedSalaryEur,
      cnavCoeff,
      revaluedSalaryEur,
    };

    onChangeCareer(nextCareer);
  };

  const deleteRow = (index: number) => {
    const nextCareer = career.filter((_, i) => i !== index);
    onChangeCareer(nextCareer);
  };

  const addRow = () => {
    const lastYear = career.length > 0 ? Math.max(...career.map((r) => r.year)) : 2024;
    const newYear = lastYear + 1;
    const passEur = getPassForYear(newYear);
    const cnavCoeff = getCnavCoeff(newYear, liquidationYear);

    const newRow: CareerYear = {
      year: newYear,
      currency: 'EUR',
      grossIncome: 45000,
      grossIncomeEur: 45000,
      passEur,
      retainedSalaryEur: Math.min(45000, passEur),
      cnavCoeff,
      revaluedSalaryEur: Math.min(45000, passEur) * cnavCoeff,
      regime: 'CNAV',
      validatedQuarters: 4,
      contributedQuarters: 4,
      agircPoints: 350,
      eventType: 'Activité',
    };

    onChangeCareer([...career, newRow]);
  };

  // Tri et filtrage
  const sortedCareer = [...career].sort((a, b) => (sortAsc ? a.year - b.year : b.year - a.year));
  const filteredCareer = sortedCareer.filter((r) => {
    if (filterEvent === 'all') return true;
    return r.eventType === filterEvent;
  });

  const totalValidated = career.reduce((s, r) => s + r.validatedQuarters, 0);
  const totalContributed = career.reduce((s, r) => s + r.contributedQuarters, 0);
  const totalAgirc = career.reduce((s, r) => s + r.agircPoints, 0);
  const topYearsCount = career.filter((r) => r.isTopYear).length;

  return (
    <div className="space-y-6">
      {/* Synthèse et métriques globales du relevé */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Relevé de Carrière Annuel (Régimes Alignés CNAV & MSA)
            </h2>
            <p className="text-xs text-slate-500">
              Modifiez les lignes en temps réel pour tester des scénarios d'activité, de devises (FRF / EUR) ou d'événements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-tealbrand-600 hover:bg-tealbrand-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une année</span>
            </button>
          </div>
        </div>

        {/* 4 Indicateurs Clés de la carrière */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Trimestres validés</div>
            <div className="text-xl font-extrabold text-institution-700">
              {totalValidated}{' '}
              <span className="text-xs font-normal text-slate-500">trim.</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Trimestres cotisés (RACL)</div>
            <div className="text-xl font-extrabold text-tealbrand-700">
              {totalContributed}{' '}
              <span className="text-xs font-normal text-slate-500">cotisés</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Points Agirc-Arrco</div>
            <div className="text-xl font-extrabold text-indigo-700">
              {totalAgirc.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-slate-500">pts</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              SAM ({samYearsCount} meilleures années)
            </div>
            <div className="text-xl font-extrabold text-amber-900">
              {sam.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-amber-700">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils du tableau : Tri & Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Trier par année : {sortAsc ? 'Croissant (1979 →)' : 'Décroissant (2024 →)'}</span>
          </button>

          <div className="flex items-center gap-1 text-xs text-slate-600 ml-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Événement :</span>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-institution-500 focus:outline-none"
            >
              <option value="all">Tous ({career.length})</option>
              <option value="Activité">Activité</option>
              <option value="Maladie/AT">Maladie/AT</option>
              <option value="Maternité">Maternité</option>
              <option value="Chômage">Chômage</option>
              <option value="AVPF">AVPF</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Affichage de <strong>{filteredCareer.length}</strong> années •{' '}
          <span className="text-amber-700 font-semibold">{topYearsCount} retenues pour le SAM</span>
        </div>
      </div>

      {/* Tableau dynamique éditable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3 w-16">Année</th>
                <th className="py-2.5 px-3 w-20">Devise</th>
                <th className="py-2.5 px-3 w-28">Revenu brut</th>
                <th className="py-2.5 px-3 w-24">Revenu (€)</th>
                <th className="py-2.5 px-3 w-24">PASS (€)</th>
                <th className="py-2.5 px-3 w-24">Retenu (€)</th>
                <th className="py-2.5 px-3 w-20">Coeff CNAV</th>
                <th className="py-2.5 px-3 w-28">Revalorisé (€)</th>
                <th className="py-2.5 px-3 w-20">Régime</th>
                <th className="py-2.5 px-3 w-16 text-center">Trim. V.</th>
                <th className="py-2.5 px-3 w-16 text-center">Trim. C.</th>
                <th className="py-2.5 px-3 w-20">Pts Agirc</th>
                <th className="py-2.5 px-3 w-24">Événement</th>
                <th className="py-2.5 px-3 w-28 text-center">Top {samYearsCount} SAM</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCareer.map((row) => {
                const originalIndex = career.findIndex((r) => r.year === row.year);
                const isTop = row.isTopYear;

                return (
                  <tr
                    key={row.year}
                    className={`hover:bg-slate-50 transition-colors ${
                      isTop ? 'bg-amber-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Année */}
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {row.year}
                    </td>

                    {/* Devise */}
                    <td className="py-2 px-3">
                      <select
                        value={row.currency}
                        onChange={(e) =>
                          updateRow(originalIndex, { currency: e.target.value as Currency })
                        }
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      >
                        <option value="EUR">EUR</option>
                        <option value="FRF">FRF</option>
                      </select>
                    </td>

                    {/* Revenu brut saisi */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="100"
                        value={row.grossIncome}
                        onChange={(e) =>
                          updateRow(originalIndex, {
                            grossIncome: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs text-right font-mono focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      />
                    </td>

                    {/* Revenu converti en EUR */}
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {row.grossIncomeEur.toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* PASS de l'année */}
                    <td className="py-2 px-3 text-right font-mono text-slate-500">
                      {row.passEur.toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>

                    {/* Salaire retenu = MIN(Revenu_EUR, PASS) */}
                    <td className="py-2 px-3 text-right font-mono text-slate-800">
                      {row.retainedSalaryEur.toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Coeff CNAV */}
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {row.cnavCoeff.toFixed(3)}
                    </td>

                    {/* Salaire revalorisé */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-institution-800">
                      {row.revaluedSalaryEur.toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Régime */}
                    <td className="py-2 px-3">
                      <select
                        value={row.regime}
                        onChange={(e) =>
                          updateRow(originalIndex, { regime: e.target.value as Regime })
                        }
                        className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-[11px] focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      >
                        <option value="CNAV">CNAV</option>
                        <option value="MSA">MSA</option>
                      </select>
                    </td>

                    {/* Trimestres validés */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={row.validatedQuarters}
                        onChange={(e) =>
                          updateRow(originalIndex, {
                            validatedQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })
                        }
                        className="w-12 bg-white border border-slate-200 rounded px-1 py-1 text-xs text-center font-bold focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      />
                    </td>

                    {/* Trimestres cotisés (pour carrière longue) */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={row.contributedQuarters}
                        onChange={(e) =>
                          updateRow(originalIndex, {
                            contributedQuarters: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })
                        }
                        className="w-12 bg-white border border-slate-200 rounded px-1 py-1 text-xs text-center font-bold text-tealbrand-700 focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      />
                    </td>

                    {/* Points Agirc-Arrco */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="1"
                        value={row.agircPoints}
                        onChange={(e) =>
                          updateRow(originalIndex, {
                            agircPoints: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-20 bg-white border border-slate-200 rounded px-1.5 py-1 text-xs text-right font-mono focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      />
                    </td>

                    {/* Événement */}
                    <td className="py-2 px-3">
                      <select
                        value={row.eventType}
                        onChange={(e) =>
                          updateRow(originalIndex, { eventType: e.target.value as EventType })
                        }
                        className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-[11px] focus:ring-1 focus:ring-institution-500 focus:outline-none"
                      >
                        <option value="Activité">Activité</option>
                        <option value="Maladie/AT">Maladie/AT</option>
                        <option value="Maternité">Maternité</option>
                        <option value="Chômage">Chômage</option>
                        <option value="AVPF">AVPF</option>
                      </select>
                    </td>

                    {/* Badge Top N retenu */}
                    <td className="py-2 px-3 text-center">
                      {isTop ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs">
                          
                          Top {samYearsCount}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </td>

                    {/* Supprimer */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(originalIndex)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Supprimer cette année"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Tv,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  currentScenario: 'sakura' | 'lfss2026' | 'blank' | 'custom';
  onLoadScenario: (scenario: 'sakura' | 'lfss2026' | 'blank') => void;
  onExportCsv: () => void;
  onImportCsv: (csvText: string) => void;
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
  onOpenReferences: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  onLoadScenario,
  onExportCsv,
  onImportCsv,
  presentationMode,
  onTogglePresentationMode,
  onOpenReferences,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onImportCsv(text);
      }
    };
    reader.readAsText(file);
    // Reset value so user can re-upload same file if desired
    e.target.value = '';
  };

  return (
    <header className="bg-gradient-to-r from-institution-800 via-institution-700 to-institution-900 text-white shadow-lg border-b border-institution-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Titre */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tealbrand-600 rounded-xl shadow-md text-white">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Simulateur de Retraite Obligatoire
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-tealbrand-500/20 text-tealbrand-300 border border-tealbrand-400/30 rounded-full">
                  CNAV & Agirc-Arrco • LURA
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Projet MIAGE • Éligibilité, Réformes 2023 & LFSS 2026, Cumul Emploi-Retraite
              </p>
            </div>
          </div>

          {/* Outils & Mode Présentation */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Bouton Barèmes & Formules */}
            <button
              type="button"
              onClick={onOpenReferences}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-institution-900/60 hover:bg-institution-900 border border-institution-600 text-slate-200 transition-colors shadow-sm"
              title="Barèmes officiels, PASS et formules orales"
            >
              <HelpCircle className="w-3.5 h-3.5 text-tealbrand-400" />
              <span>Barèmes & Formules</span>
            </button>

            {/* Import / Export CSV */}
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-institution-900/60 hover:bg-institution-900 border border-institution-600 text-slate-200 transition-colors shadow-sm"
              title="Exporter le relevé de carrière au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-institution-900/60 hover:bg-institution-900 border border-institution-600 text-slate-200 transition-colors shadow-sm"
              title="Importer un relevé de carrière depuis un CSV"
            >
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>Import CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />

            {/* Mode Présentation Vidéoprojecteur */}
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                presentationMode
                  ? 'bg-amber-400 text-slate-900 border-amber-300 ring-2 ring-amber-300/50'
                  : 'bg-institution-900/60 hover:bg-institution-900 text-slate-200 border-institution-600'
              }`}
              title="Activer la haute lisibilité pour vidéoprojecteur"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Mode Présentation</span>
            </button>
          </div>
        </div>

        {/* Barre de sélection rapide de scénarios en 1 clic */}
        <div className="mt-3 pt-3 border-t border-institution-700/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-tealbrand-400" />
            Scénarios de test :
          </span>

          {/* 1. Cas Sakura */}
          <button
            type="button"
            onClick={() => onLoadScenario('sakura')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentScenario === 'sakura'
                ? 'bg-tealbrand-500 text-white shadow font-semibold ring-2 ring-tealbrand-300/40'
                : 'bg-institution-800/80 hover:bg-institution-700 text-slate-200 border border-institution-600'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-tealbrand-300 animate-pulse" />
            <span className="font-bold">Cas Sakura (Défaut)</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded text-tealbrand-100">
              Réf. 1963
            </span>
          </button>

          {/* 2. Cas LFSS 2026 */}
          <button
            type="button"
            onClick={() => onLoadScenario('lfss2026')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentScenario === 'lfss2026'
                ? 'bg-tealbrand-500 text-white shadow font-semibold ring-2 ring-tealbrand-300/40'
                : 'bg-institution-800/80 hover:bg-institution-700 text-slate-200 border border-institution-600'
            }`}
          >
            <span>Cas Test LFSS 2026</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded text-tealbrand-100">
              23 ans / Suspens.
            </span>
          </button>

          {/* 3. Nouveau profil vierge */}
          <button
            type="button"
            onClick={() => onLoadScenario('blank')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentScenario === 'blank'
                ? 'bg-slate-700 text-white shadow font-semibold'
                : 'bg-institution-800/80 hover:bg-institution-700 text-slate-300 border border-institution-600'
            }`}
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Nouveau profil vierge</span>
          </button>
        </div>
      </div>
    </header>
  );
};

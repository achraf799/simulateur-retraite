import React from 'react';
import { User, CalendarDays, LayoutDashboard, Briefcase, BookOpen } from 'lucide-react';

export type TabId = 'profile' | 'career' | 'dashboard' | 'cer' | 'references';

interface TabNavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  cerAlertLevel?: 'RED' | 'YELLOW' | 'GREEN';
  eligibilityStatus?: 'eligible_taux_plein' | 'eligible_decote' | 'ineligible';
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onSelectTab,
  cerAlertLevel,
  eligibilityStatus,
}) => {
  const tabs = [
    {
      id: 'profile' as TabId,
      label: '1. Profil & Paramètres',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'career' as TabId,
      label: '2. Relevé de carrière',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'dashboard' as TabId,
      label: '3. Tableau de bord & Estimation',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge:
        eligibilityStatus === 'eligible_taux_plein' ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Taux plein éligible" />
        ) : eligibilityStatus === 'eligible_decote' ? (
          <span className="w-2 h-2 rounded-full bg-amber-500" title="Départ avec décote" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-rose-500" title="Inéligible" />
        ),
    },
    {
      id: 'cer' as TabId,
      label: '4. « Et au-delà... » (CER)',
      icon: <Briefcase className="w-4 h-4" />,
      badge:
        cerAlertLevel === 'RED' ? (
          <span className="px-1.5 py-0.2 text-[10px] bg-rose-500 text-white font-bold rounded-full animate-pulse">
            ALERTE
          </span>
        ) : cerAlertLevel === 'YELLOW' ? (
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        ),
    },
    {
      id: 'references' as TabId,
      label: 'Barèmes & Formules (Oral)',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-institution-50 text-institution-700 font-bold border border-institution-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className={isActive ? 'text-institution-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

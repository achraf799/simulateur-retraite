import React, { useState, useMemo } from 'react';
import { UserProfile, CareerYear } from './types/retirement';
import {
  SAKURA_PROFILE,
  SAKURA_CAREER,
  LFSS_2026_PROFILE,
  LFSS_2026_CAREER,
  BLANK_PROFILE,
  BLANK_CAREER,
} from './constants/scenarios';
import { calculateRetirement } from './engine/retirementCalculator';
import { WizardHeader, WizardStepId } from './components/WizardHeader';
import { WizardFooter } from './components/wizard/WizardFooter';
import { Step1Identity } from './components/wizard/Step1Identity';
import { Step2Career } from './components/wizard/Step2Career';
import { Step3SpecialCases } from './components/wizard/Step3SpecialCases';
import { Step4DepartureAndCer } from './components/wizard/Step4DepartureAndCer';
import { Step5Bilan } from './components/wizard/Step5Bilan';
import { exportCareerToCsv, importCareerFromCsv } from './utils/csvHelper';

export const App: React.FC = () => {
  // ─── State ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile>(SAKURA_PROFILE);
  const [career, setCareer] = useState<CareerYear[]>(SAKURA_CAREER);
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [currentScenario, setCurrentScenario] = useState<'sakura' | 'lfss2026' | 'blank' | 'custom'>('sakura');
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  // ─── Reactive calculation engine ───────────────────────────────────────
  const calculationResult = useMemo(() => {
    return calculateRetirement(profile, career);
  }, [profile, career]);

  // ─── Scenario loading ──────────────────────────────────────────────────
  const handleLoadScenario = (scenario: 'sakura' | 'lfss2026' | 'blank') => {
    if (scenario === 'sakura') {
      setProfile({ ...SAKURA_PROFILE });
      setCareer([...SAKURA_CAREER]);
      setCurrentScenario('sakura');
    } else if (scenario === 'lfss2026') {
      setProfile({ ...LFSS_2026_PROFILE });
      setCareer([...LFSS_2026_CAREER]);
      setCurrentScenario('lfss2026');
    } else {
      setProfile({ ...BLANK_PROFILE });
      setCareer([...BLANK_CAREER]);
      setCurrentScenario('blank');
    }
  };

  // ─── Profile / career updates ──────────────────────────────────────────
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const birthChanged = updated.birthDate !== undefined && updated.birthDate !== prev.birthDate;
      const departureChanged = updated.desiredDepartureDate !== undefined
        && updated.desiredDepartureDate !== prev.desiredDepartureDate;
      const firstPensionChanged = 'cerFirstBasePensionDate' in updated
        && updated.cerFirstBasePensionDate !== prev.cerFirstBasePensionDate;
      const next = { ...prev, ...updated };

      if (birthChanged || departureChanged || firstPensionChanged) next.cerIncomeByPeriod = undefined;
      if ((birthChanged || departureChanged) && next.specialCircumstances) {
        next.specialCircumstances = { ...next.specialCircumstances, longCareerConfirmedQuarters: undefined };
        if (birthChanged) {
          next.specialCircumstances.earlyCareerQuarters = undefined;
          next.specialCircumstances.earlyQuartersCount = 0;
          next.specialCircumstances.longCareerEstimate = undefined;
        }
      }
      return next;
    });
    setCurrentScenario('custom');
  };

  const handleUpdateCareer = (updated: CareerYear[]) => {
    const quartersChanged = career.length !== updated.length || career.some((row, index) => {
      const next = updated[index];
      return row.year !== next.year || row.regime !== next.regime
        || row.validatedQuarters !== next.validatedQuarters
        || row.contributedQuarters !== next.contributedQuarters || row.eventType !== next.eventType;
    });
    if (quartersChanged && profile.specialCircumstances?.longCareerEstimate) {
      handleUpdateProfile({ specialCircumstances: { ...profile.specialCircumstances, longCareerEstimate: undefined } });
    }
    setCareer(updated);
    setCurrentScenario('custom');
  };

  // ─── CSV helpers ───────────────────────────────────────────────────────
  const handleExportCsv = () => {
    const csvContent = exportCareerToCsv(career);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `releve_carriere_${profile.birthDate || 'profil'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (csvText: string) => {
    try {
      const departureYear = profile.desiredDepartureDate
        ? new Date(profile.desiredDepartureDate).getFullYear()
        : 2025;
      const imported = importCareerFromCsv(csvText, departureYear);
      if (imported.length > 0) {
        handleUpdateCareer(imported);
      } else {
        alert("Erreur lors de l'import : aucun enregistrement valide trouvé.");
      }
    } catch {
      alert("Erreur lors de l'analyse du fichier CSV : format invalide.");
    }
  };

  // ─── Wizard navigation ─────────────────────────────────────────────────
  const goToStep = (step: WizardStepId) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep = () => {
    if (currentStep < 5) goToStep((currentStep + 1) as WizardStepId);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) goToStep((currentStep - 1) as WizardStepId);
  };

  const handleGoToBilan = () => goToStep(5);

  return (
    <div
      className={`min-h-screen bg-slate-50 flex flex-col ${
        presentationMode ? 'presentation-mode text-lg' : ''
      }`}
    >
      {/* ── Sticky header with scenario bar + step stepper ── */}
      <WizardHeader
        currentStep={currentStep}
        onSelectStep={goToStep}
        onLoadScenario={handleLoadScenario}
        activeScenarioName={currentScenario}
        presentationMode={presentationMode}
        onTogglePresentationMode={() => setPresentationMode((v) => !v)}
      />

      {/* ── Main content area ── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <Step1Identity
            profile={profile}
            onChangeProfile={handleUpdateProfile}
          />
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <Step2Career
            profile={profile}
            career={career}
            onChangeProfile={handleUpdateProfile}
            onChangeCareer={handleUpdateCareer}
            onExportCsv={handleExportCsv}
            onImportCsv={handleImportCsv}
            samAnalysis={calculationResult.samAnalysis}
            longCareer={calculationResult.longCareer}
          />
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <Step3SpecialCases
            profile={profile}
            onChangeProfile={handleUpdateProfile}
            longCareer={calculationResult.longCareer}
          />
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <Step4DepartureAndCer
            profile={profile}
            calculationResult={calculationResult}
            onChangeProfile={handleUpdateProfile}
          />
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <Step5Bilan
            result={calculationResult}
            profile={profile}
            onChangeProfile={handleUpdateProfile}
            onModifySimulation={() => goToStep(1)}
          />
        )}
      </main>

      {/* ── Sticky bottom navigation ── */}
      <WizardFooter
        currentStep={currentStep}
        onPrevStep={handlePrevStep}
        onNextStep={handleNextStep}
        onGoToBilan={handleGoToBilan}
      />


    </div>
  );
};

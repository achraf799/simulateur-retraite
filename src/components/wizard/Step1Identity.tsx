import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types/retirement';
import { decodeNir } from '../../utils/nirHelper';
import { FormulaTooltip } from '../common/FormulaTooltip';
import { User, Calendar, Baby, CheckCircle2, AlertCircle, Plus, Minus, Info } from 'lucide-react';

interface Step1IdentityProps {
  profile: UserProfile;
  onChangeProfile: (updated: Partial<UserProfile>) => void;
}

export const Step1Identity: React.FC<Step1IdentityProps> = ({ profile, onChangeProfile }) => {
  const [nirError, setNirError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    message: string;
    onConfirm: () => void;
  }>({ visible: false, message: '', onConfirm: () => {} });
  const nirInputRef = useRef<HTMLInputElement>(null);

  /* ── Helpers ─────────────────────────────────────────────────── */

  const hasNirSex = (): 'F' | 'M' | null => {
    const digits = profile.nir.replace(/\s+/g, '');
    if (digits.length >= 1) {
      if (digits[0] === '1') return 'M';
      if (digits[0] === '2') return 'F';
    }
    return null;
  };

  const hasNirYearMonth = (): { year: string; month: string } | null => {
    const digits = profile.nir.replace(/\s+/g, '');
    if (digits.length >= 5) {
      return { year: digits.substring(1, 3), month: digits.substring(3, 5) };
    }
    return null;
  };

  const confirmIfNirConflict = (
    fieldLabel: string,
    checkConflict: boolean,
    conflictMsg: string,
    applyChange: () => void
  ) => {
    if (checkConflict) {
      setConfirmDialog({
        visible: true,
        message: conflictMsg,
        onConfirm: applyChange,
      });
    } else {
      applyChange();
    }
  };

  /* ── NIR change ──────────────────────────────────────────────── */

  const handleNirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    onChangeProfile({ nir: rawValue });

    const decoded = decodeNir(rawValue);
    if (decoded.valid && decoded.sex && decoded.birthYear && decoded.birthMonth) {
      setNirError(null);
      const currentDay = profile.birthDate ? profile.birthDate.split('-')[2] || '01' : '01';
      const formattedMonth = String(decoded.birthMonth).padStart(2, '0');
      const newBirthDate = `${decoded.birthYear}-${formattedMonth}-${currentDay}`;
      onChangeProfile({ sex: decoded.sex, birthDate: newBirthDate });
    } else if (rawValue.replace(/\s+/g, '').length >= 5) {
      setNirError(decoded.errorMessage || 'Format NIR non reconnu');
    } else {
      setNirError(null);
    }
  };

  /* ── Sex change ───────────────────────────────────────────────── */

  const handleSexChange = (newSex: 'M' | 'F') => {
    if (newSex === profile.sex) return;

    const nirSex = hasNirSex();
    const nirConflicts = nirSex !== null && nirSex !== newSex;

    confirmIfNirConflict(
      'sexe',
      nirConflicts,
      `Le numéro de Sécurité sociale actuel commence par "${nirSex === 'F' ? '2' : '1'}" (${nirSex === 'F' ? 'Femme' : 'Homme'}). Voulez-vous modifier le NIR pour le faire correspondre à "${newSex === 'F' ? '2' : '1'}" (${newSex === 'F' ? 'Femme' : 'Homme'}) ?`,
      () => {
        const digits = profile.nir.replace(/\s+/g, '');
        const newFirstDigit = newSex === 'F' ? '2' : '1';
        const updatedNirDigits = newFirstDigit + digits.substring(1);
        onChangeProfile({ sex: newSex, nir: updatedNirDigits });
        setTimeout(() => nirInputRef.current?.focus(), 100);
      }
    );

    if (!nirConflicts) {
      onChangeProfile({ sex: newSex });
    }
  };

  /* ── Birth date change ────────────────────────────────────────── */

  const handleBirthDateChange = (newDate: string) => {
    const nirYM = hasNirYearMonth();
    if (!nirYM || !newDate) {
      onChangeProfile({ birthDate: newDate });
      return;
    }

    const [fullYear, month] = newDate.split('-');
    const shortYear = fullYear.slice(-2);
    const nirConflicts = shortYear !== nirYM.year || month !== nirYM.month;

    confirmIfNirConflict(
      'date de naissance',
      nirConflicts,
      `Le NIR indique une naissance en ${nirYM.month}/${nirYM.year} mais vous saisissez ${month}/${shortYear}. Voulez-vous mettre à jour les chiffres du NIR en conséquence ?`,
      () => {
        const digits = profile.nir.replace(/\s+/g, '');
        const updatedNir = digits[0] + shortYear + month + digits.substring(5);
        onChangeProfile({ birthDate: newDate, nir: updatedNir });
        setTimeout(() => nirInputRef.current?.focus(), 100);
      }
    );

    if (!nirConflicts) {
      onChangeProfile({ birthDate: newDate });
    }
  };

  /* ── Children ─────────────────────────────────────────────────── */

  const handleChildrenChange = (delta: number) => {
    const nextVal = Math.max(0, Math.min(15, profile.childrenCount + delta));
    onChangeProfile({
      childrenCount: nextVal,
      samEligibleChildren: (profile.samEligibleChildren ?? 0) > nextVal ? undefined : profile.samEligibleChildren,
    });
  };

  const birthYear = profile.birthDate ? parseInt(profile.birthDate.split('-')[0], 10) : 1963;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Confirmation dialog ─────────────────────────────── */}
      {confirmDialog.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Vérification requise</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((d) => ({ ...d, visible: false }));
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-institution-700 text-white text-xs font-bold hover:bg-institution-800 transition-colors"
              >
                Confirmer et modifier le NIR
              </button>
              <button
                type="button"
                onClick={() => setConfirmDialog((d) => ({ ...d, visible: false }))}
                className="flex-1 py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Titre ────────────────────────────────────────────── */}
      <div className="text-center space-y-1 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-institution-50 text-institution-700 text-xs font-semibold border border-institution-200 mb-2">
          <User className="w-3.5 h-3.5" />
          Étape 1 sur 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Qui êtes-vous ?
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Renseignez votre identité pour déterminer l'âge légal et les droits familiaux applicables.
        </p>
      </div>

      {/* ── Carte 1 : NIR ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Numéro de Sécurité Sociale (NIR)</span>
            <FormulaTooltip
              title="Décodage automatique du NIR"
              formula="1er ch. = Sexe (1:H, 2:F) • Ch. 2-3 = Année • Ch. 4-5 = Mois"
              explanation="Les 5 premiers chiffres permettent de déduire automatiquement le sexe et la date de naissance."
              articleCss="Art. R. 115-1 CSS"
            />
          </label>
          <span className="text-xs text-slate-400">5 premiers chiffres suffisent</span>
        </div>

        <input
          ref={nirInputRef}
          type="text"
          value={profile.nir}
          onChange={handleNirChange}
          placeholder="Ex : 2 63 01..."
          className={`w-full px-4 py-3 text-base rounded-xl border font-mono tracking-wider transition-all focus:ring-4 focus:outline-none ${
            nirError
              ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20 text-rose-900'
              : 'border-slate-300 focus:border-institution-600 focus:ring-institution-50'
          }`}
        />

        {nirError ? (
          <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {nirError}
          </p>
        ) : profile.nir && profile.nir.replace(/\s+/g, '').length >= 5 && !nirError ? (
          <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              NIR décodé : {profile.sex === 'F' ? 'Femme' : 'Homme'}, né(e) en {profile.birthDate}
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-2">
            Laissez vide pour saisir manuellement le sexe et la date de naissance.
            Pour Sakura, tapez <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">2 63 01</code>.
          </p>
        )}
      </div>

      {/* ── Carte 2 : Sexe & Date ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-bold text-slate-800 block mb-2">
            Sexe de l'assuré(e)
            {hasNirSex() && (
              <span className="ml-2 text-[11px] font-normal text-slate-400">
                (depuis NIR — modifier implique une vérification)
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSexChange('F')}
              className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                profile.sex === 'F'
                  ? 'bg-institution-800 text-white border-institution-800 shadow-md ring-2 ring-institution-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>Femme (2)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSexChange('M')}
              className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                profile.sex === 'M'
                  ? 'bg-institution-800 text-white border-institution-800 shadow-md ring-2 ring-institution-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>Homme (1)</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-institution-600" />
            <span>Date de naissance</span>
            {hasNirYearMonth() && (
              <span className="text-[11px] font-normal text-slate-400">
                (depuis NIR — modifier implique une vérification)
              </span>
            )}
          </label>
          <input
            type="date"
            value={profile.birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-institution-600 focus:ring-4 focus:ring-institution-50 focus:outline-none"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Génération <strong className="text-slate-800">{birthYear}</strong> • Âge légal selon barème Réforme 2023.
          </p>
        </div>
      </div>

      {/* ── Carte 3 : Enfants & Majoration mère ─────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Baby className="w-4 h-4 text-institution-600" />
              <span>Enfants nés et élevés</span>
              <FormulaTooltip
                title="Majoration Enfants"
                formula="+10 % sur la Base et l'Agirc-Arrco dès 3 enfants"
                explanation="À partir de 3 enfants élevés pendant au moins 9 ans avant leurs 16 ans, les pensions sont majorées de 10 %."
                articleCss="Art. L. 351-12 CSS & Accord ANI"
              />
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Ouvre droit à des trimestres supplémentaires et à la majoration de 10 %.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleChildrenChange(-1)}
              disabled={profile.childrenCount <= 0}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-extrabold text-base text-slate-900">
              {profile.childrenCount}
            </span>
            <button
              type="button"
              onClick={() => handleChildrenChange(1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Case à cocher mère */}
        <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={profile.motherBonusQuarters}
            onChange={(e) => onChangeProfile({ motherBonusQuarters: e.target.checked })}
            disabled={profile.sex !== 'F'}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-tealbrand-600 focus:ring-tealbrand-500"
          />
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-800 block">
              Bénéficie des trimestres et bonifications enfants (mère)
            </span>
            <span className="text-xs text-slate-500 leading-relaxed block">
              Attribue les trimestres maternité (4 trim./enfant) et éducation (4 trim./enfant) — Art. L. 351-4 CSS.
            </span>
          </div>
        </label>

        {profile.childrenCount > 0 && (
          <label className="block text-sm font-semibold text-slate-800">
            Enfants avec une majoration admissible pour le salaire annuel moyen
            <select
              value={profile.samEligibleChildren ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                onChangeProfile({
                  samEligibleChildren: value === '1' ? 1 : value === '2' ? 2 : value === '0' ? 0 : undefined,
                });
              }}
              className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white p-2"
            >
              <option value="">À confirmer</option>
              <option value="0">Aucun</option>
              <option value="1">Un enfant</option>
              {profile.childrenCount >= 2 && <option value="2">Deux enfants ou plus</option>}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-600">
              Pour une retraite à partir du 1er septembre 2026, indiquez le nombre d’enfants
              pour lesquels la caisse vous a attribué une majoration ou une bonification admissible.
            </span>
          </label>
        )}

        {/* Badge impact (sans Sparkles) */}
        {profile.childrenCount > 0 && (
          <div className="p-3 bg-tealbrand-50 border border-tealbrand-200 rounded-xl space-y-1 text-xs text-tealbrand-900">
            <div className="font-bold flex items-center gap-1.5 text-tealbrand-800">
              <Info className="w-3.5 h-3.5 text-tealbrand-600" />
              Droits calculés pour {profile.childrenCount} enfant{profile.childrenCount > 1 ? 's' : ''} :
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-tealbrand-800">
              {profile.childrenCount >= 3 ? (
                <li className="font-semibold text-emerald-700">
                  Majoration +10 % sur la retraite de base et l'Agirc-Arrco (plafonnée à 2 367,48 €/an).
                </li>
              ) : (
                <li>Majoration de +10 % applicable à partir de 3 enfants.</li>
              )}
              {profile.motherBonusQuarters && profile.sex === 'F' && (
                <li>
                  Attribution de +{profile.childrenCount * 8} trimestres (maternité + éducation).
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

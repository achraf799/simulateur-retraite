export interface NirDecoded {
  valid: boolean;
  sex?: 'M' | 'F';
  birthYear?: number;
  birthMonth?: number;
  department?: string;
  errorMessage?: string;
}

/**
 * Décode les composantes du NIR (Numéro d'Inscription au Répertoire / Sécurité Sociale).
 * 1er chiffre : 1 = Homme, 2 = Femme
 * 2e et 3e chiffres : Année de naissance (ex : 63 -> 1963)
 * 4e et 5e chiffres : Mois de naissance (01 à 12)
 * 6e et 7e chiffres : Département
 */
export function decodeNir(nirRaw: string): NirDecoded {
  const clean = nirRaw.replace(/\s+/g, '');
  if (!clean || clean.length < 5) {
    return { valid: false, errorMessage: 'NIR incomplet (au moins 5 chiffres requis)' };
  }

  const sexDigit = clean.charAt(0);
  if (sexDigit !== '1' && sexDigit !== '2') {
    return { valid: false, errorMessage: 'Le 1er chiffre doit être 1 (Homme) ou 2 (Femme)' };
  }
  const sex: 'M' | 'F' = sexDigit === '1' ? 'M' : 'F';

  const yearDigits = parseInt(clean.substring(1, 3), 10);
  if (isNaN(yearDigits)) {
    return { valid: false, errorMessage: "Année invalide dans l'identifiant NIR" };
  }
  // Déduction du siècle : si > 25, 1900s ; sinon 2000s
  const birthYear = yearDigits > 25 ? 1900 + yearDigits : 2000 + yearDigits;

  const monthDigits = parseInt(clean.substring(3, 5), 10);
  if (isNaN(monthDigits) || monthDigits < 1 || monthDigits > 12) {
    return { valid: false, errorMessage: 'Mois invalide (doit être compris entre 01 et 12)' };
  }

  const department = clean.length >= 7 ? clean.substring(5, 7) : undefined;

  return {
    valid: true,
    sex,
    birthYear,
    birthMonth: monthDigits,
    department,
  };
}

export function formatNir(nirRaw: string): string {
  const clean = nirRaw.replace(/\s+/g, '');
  if (clean.length <= 1) return clean;
  // Format: X YY MM DD ...
  const parts: string[] = [];
  if (clean.length >= 1) parts.push(clean.substring(0, 1));
  if (clean.length >= 3) parts.push(clean.substring(1, 3));
  if (clean.length >= 5) parts.push(clean.substring(3, 5));
  if (clean.length >= 7) parts.push(clean.substring(5, 7));
  if (clean.length >= 10) parts.push(clean.substring(7, 10));
  if (clean.length >= 13) parts.push(clean.substring(10, 13));
  if (clean.length > 13) parts.push(clean.substring(13, 15));
  return parts.join(' ');
}

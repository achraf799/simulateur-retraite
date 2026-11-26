import type { AgircChildBonusBand, CareerYear, ExpressCareerData } from '../types/retirement';
import { validDate } from '../utils/civilDates';

type AgircRights = Pick<CareerYear, 'year' | 'agircPoints' | 'agircLegacyRegime'>;

export function selectAgircRights(career: CareerYear[], departure: string) {
  const rights: AgircRights[] = [];
  let pending = false;
  if (!validDate(departure)) return { rights, pending };

  const yearOfDeparture = Number(departure.slice(0, 4));
  for (const row of career) {
    if (row.year < yearOfDeparture) {
      rights.push(row);
    } else if (row.year === yearOfDeparture && !departure.endsWith('-01-01')) {
      const confirmed = row.agircPointsAtDeparture;
      if (confirmed?.date === departure && Number.isFinite(confirmed.points) && confirmed.points >= 0) {
        rights.push({ year: row.year, agircLegacyRegime: row.agircLegacyRegime, agircPoints: confirmed.points });
      } else if (row.agircPoints !== 0) {
        pending = true;
      }
    }
  }
  return { rights, pending };
}

export function calculateAgircChildBonusBands(
  children: number,
  career: AgircRights[],
  express?: ExpressCareerData,
): AgircChildBonusBand[] {
  if (children < 3) return [];

  const bands = new Map<string, AgircChildBonusBand>();
  function add(points: number, label: string, rate: number, assumed = false) {
    if (points === 0) return;
    const key = `${label}:${rate}:${assumed}`;
    const band = bands.get(key);
    if (band) band.points += points;
    else bands.set(key, { label, points, rate, assumed });
  }

  // Barèmes historiques pour enfants nés ou élevés, Agirc-Arrco, fiche de mars 2025.
  const bracket = Math.min(children, 7) - 2;
  const oldArrcoRate = bracket * 0.05 + 0.05;
  const oldAgircRate = (bracket + 1) * 0.04;

  if (express) {
    const before1999 = Math.min(express.agircPoints, Math.max(0, express.agircPointsBefore1999 ?? 0));
    const available = express.agircPoints - before1999;
    const from1999 = Math.min(available, Math.max(0, express.agircPoints1999To2011 ?? 0));
    add(before1999, 'Avant 1999 · ancien Arrco avec majoration', oldArrcoRate, true);
    add(from1999, '1999–2011 · Arrco', 0.05, true);
    add(available - from1999, 'Solde traité comme acquis depuis 2012', 0.10, true);
  } else {
    for (const { year, agircPoints, agircLegacyRegime } of career) {
      if (year >= 2012) {
        add(agircPoints, 'Depuis 2012', 0.10);
      } else if (agircLegacyRegime === 'agirc') {
        add(agircPoints, year < 1999 ? 'Avant 1999 · Agirc' : '1999–2011 · Agirc', oldAgircRate);
      } else if (year >= 1999) {
        add(agircPoints, '1999–2011 · Arrco', 0.05, agircLegacyRegime !== 'arrco');
      } else if (agircLegacyRegime === 'camarca') {
        add(agircPoints, 'Avant 1999 · Camarca', children * 0.025);
      } else if (agircLegacyRegime === 'noBonus') {
        add(agircPoints, 'Avant 1999 · caisse sans majoration', 0);
      } else {
        add(agircPoints, 'Avant 1999 · ancien Arrco avec majoration', oldArrcoRate, agircLegacyRegime !== 'arrco');
      }
    }
  }
  return [...bands.values()];
}

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const fixtures = new URL('./fixtures/', import.meta.url);
const cases = JSON.parse(readFileSync(new URL('cases.json', fixtures), 'utf8'));

const stage = (page, number) => page.getByRole('button', { name: new RegExp('Étape ' + number + ' :') }).click();
const sectionField = (page, label) => page.getByText(label, { exact: true }).locator('xpath=../..').getByRole('spinbutton');
const caps = [
  ['baseCap', /Moyenne mensuelle brute des trois derniers mois/],
  ['agircLast', /Dernier salaire mensuel revalorisé Agirc-Arrco/],
  ['agircTen', /Moyenne mensuelle revalorisée sur dix ans/],
];
function money(text) {
  const match = text?.match(/(-?\d[\d \u202f\u00a0]*,\d{2})\s*€/);
  return match ? Number(match[1].replace(/\s/g, '').replace(',', '.')) : null;
}
async function runScenario(browser, baseUrl, c) {
  const page = await browser.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.getByRole('button', { name: /Nouveau profil/ }).click();
    await page.locator('input[type=date]').fill(c.birth);
    if (c.children) {
      const more = page.getByText('Enfants nés et élevés', { exact: true }).locator('xpath=../../..').getByRole('button').last();
      for (let i = 0; i < c.children; i++) await more.click();
    }
    await stage(page, 2);
    if (c.careerFile) {
      await page.getByRole('button', { name: /Relevé détaillé annuel/ }).click();
      await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL(c.careerFile, fixtures)));
      await page.getByText(new RegExp('^' + c.careerYears + ' années enregistrées •')).waitFor();
    } else {
      await page.getByLabel('Total des trimestres validés').fill(String(c.validated));
      await sectionField(page, 'Trimestres cotisés ou réputés cotisés (carrière longue)').fill(String(c.contributed + Math.min(4, c.avpf)));
      await sectionField(page, 'Salaire Annuel Moyen (SAM) estimé').fill(String(c.sam));
      await page.getByLabel('Total des points Agirc-Arrco').fill(String(c.points));
      if (c.historical) await page.getByLabel('Points de 1999 à 2011').fill(String(c.historical));
    }
    await stage(page, 3);
    if (c.age18 !== null) await page.getByLabel('Fin de l’année des 18 ans').fill(String(c.age18));
    if (c.id === 'T13') {
      for (const [age, value] of [[16,0],[20,4],[21,4]]) {
        await page.getByLabel('Fin de l’année des ' + age + ' ans').fill(String(value));
      }
    }
    if (c.avpf) {
      const interrupted = page.getByRole('heading', { name: /Interruptions de carrière/ }).locator('xpath=../../../..');
      await interrupted.getByRole('button', { name: 'Oui', exact: true }).click();
      const avpf = page.getByText('AVPF / Parental (max 4)', { exact: true }).locator('xpath=..').getByRole('spinbutton');
      await avpf.fill(String(c.avpf));
    }
    if (c.lura) {
      const lura = page.getByRole('heading', { name: /Poly-cotisant/ }).locator('xpath=../../../..');
      await lura.getByRole('button', { name: 'Oui', exact: true }).click();
    }
    await stage(page, 4);
    const [year, month] = c.departure.split('-');
    await page.locator('select').filter({ has: page.locator('option[value="07"]') }).selectOption(month);
    await page.locator('select').filter({ has: page.locator('option[value="2025"]') }).selectOption(year);
    const surcote = page.getByLabel('Trimestres de surcote confirmés');
    if (c.surcote || await surcote.count()) await surcote.fill(String(c.surcote));
    if (c.employer) {
      await page.getByRole('button', { name: /Oui, je souhaite reprendre une activité/ }).click();
      await page.getByLabel(/Date prévisionnelle de reprise/).fill(c.resumption);
      await page.getByLabel(/Toutes les pensions exigibles/).selectOption('true');
      await page.getByLabel(/Je reprends chez mon dernier employeur/).setChecked(c.employer === 'ancien');
      await page.getByLabel(/Salaire mensuel brut après reprise/).fill(String(c.salary));
      for (const [key, label] of caps) await page.getByLabel(label).fill(String(c[key]));
    }
    await stage(page, 5);
    const total = page.getByText('Pension Totale Estimée (Base + Complémentaire)', { exact: true }).locator('xpath=following-sibling::div[1]');
    const globalPension = await total.count() ? money(await total.innerText()) : null;
    const resources = page.getByText('Ressources mensuelles totales (pensions + reprise)', { exact: true }).locator('xpath=following-sibling::dd');
    const globalResources = await resources.count() ? money(await resources.innerText()) : null;
    await page.getByRole('button', { name: 'Rapport de contrôle' }).click();
    const report = page.getByRole('region', { name: 'Résultats du rapport de contrôle' });
    const text = await report.innerText();
    const pension = async label => {
      const dd = report.getByText(label, { exact: true }).locator('xpath=following-sibling::dd/strong');
      return await dd.count() ? money(await dd.innerText()) : null;
    };
    const paid = async label => {
      const dd = page.getByText(label, { exact: true }).locator('xpath=following-sibling::dd');
      return await dd.count() ? money(await dd.innerText()) : null;
    };
    const duration = text.match(/(\d+) trimestres validés pour (\d+) requis/);
    const samLine = text.split('\n').find(line => line.includes('plafonnement et revalorisation') || line.includes('SAM saisi en mode Express'));
    const cerText = c.employer ? await page.locator('section[aria-labelledby="cer-result-title"]').innerText() : '';
    return {
      validated: Number(duration?.[1]), required: Number(duration?.[2]), sam: money(samLine),
      authorized: !text.includes('Aucune pension liquidable à la date demandée.'),
      cerText, errors,
      base: await pension('Retraite de base'), agirc: await pension('Retraite Agirc-Arrco'),
      pension: globalPension, basePaid: await paid('Retraite de base au début de la reprise'),
      agircPaid: await paid('Agirc-Arrco au début de la reprise'),
      total: c.employer ? globalResources : globalPension,
      sectionText: text,
    };
  } catch (error) {
    return { error: error.message };
  } finally {
    await page.close();
  }
}
function compare(c, actual) {
  if (actual.error) return [actual.error];

  const cents = (amount) => amount == null ? amount : Math.round(amount * 100) / 100;
  const checks = [
    ...Object.entries(c.expected).map(([field, expected]) => [field, cents(expected), actual[field]]),
    ['Trimestres validés', c.validated, actual.validated],
    ['Trimestres requis', c.required, actual.required],
    ['SAM', cents(c.sam), actual.sam],
    ['Départ autorisé', c.decision !== 'Départ refusé', actual.authorized],
  ];
  if (c.employer) {
    const labels = { Intégral: 'Cumul intégral', Carence: 'avant six mois', Plafonné: 'Cumul plafonné' };
    checks.push(['Règle de cumul affichée', true, actual.cerText.includes(labels[c.cer])]);
  }
  if (c.id === 'T13') {
    checks.push(['Aucune borne de carrière longue remplie', true, actual.sectionText.includes('Aucune borne de début de carrière')]);
  }
  if (c.avpf) {
    const retained = c.contributed + Math.min(4, c.avpf);
    checks.push(['Trimestres retenus pour la carrière longue', true, actual.sectionText.includes(`${retained} / ${c.required} trimestres`)]);
  }

  return [
    ...actual.errors.map((error) => `Erreur dans la page · ${error}`),
    ...checks.filter(([, expected, got]) => expected !== got)
      .map(([label, expected, got]) => `${label} · attendu ${expected}, obtenu ${got}`),
  ];
}

const wanted = process.argv.slice(2).map((id) => id.toUpperCase());
const unknown = wanted.filter((id) => !cases.some((c) => c.id === id));
if (unknown.length) throw new Error(`Cas inconnus · ${unknown.join(', ')}`);
const selected = wanted.length ? cases.filter((c) => wanted.includes(c.id)) : cases;
const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const showTotal = (total) => total == null ? '—' : euros.format(total);
let server;
let browser;

try {
  let baseUrl = process.env.RECETTE_URL;
  if (!baseUrl) {
    server = await createServer({
      root: fileURLToPath(new URL('../../', import.meta.url)),
      server: { host: '127.0.0.1', open: false },
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}/`;
  }
  if (!baseUrl) throw new Error('Impossible de déterminer l’adresse du simulateur.');
  const response = await fetch(baseUrl, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Le simulateur répond avec le code HTTP ${response.status}.`);
  await response.body?.cancel();
  browser = await chromium.launch({ channel: 'chrome' });
  console.log(`Simulateur testé · ${baseUrl}`);

  const rows = [];
  let passed = 0;
  for (let offset = 0; offset < selected.length; offset += 5) {
    const batch = selected.slice(offset, offset + 5);
    const outcomes = await Promise.all(batch.map((c) => runScenario(browser, baseUrl, c)));
    for (const [index, actual] of outcomes.entries()) {
      const c = batch[index];
      const differences = compare(c, actual);
      if (differences.length) console.error(`${c.id} · ${differences.join('\n  ')}`);
      else passed++;
      rows.push({
        Cas: c.id,
        Attendu: showTotal(c.expected.total),
        Obtenu: showTotal(actual.total),
        Statut: differences.length ? 'KO' : 'OK',
      });
    }
  }
  console.table(rows);
  console.log(`${passed}/${selected.length} scénarios conformes.`);
  if (passed !== selected.length) process.exitCode = 1;
} finally {
  await Promise.all([browser?.close(), server?.close()]);
}

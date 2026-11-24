const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 35, bottom: 35, left: 40, right: 40 },
  bufferPages: true,
  autoFirstPage: true
});

const outputPath = path.join(__dirname, '..', 'Guide_Utilisation_Simulateur_Retraite.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Palette de couleurs institutionnelle
const C_NAVY = '#0d2642';
const C_BLUE = '#1d5e9b';
const C_TEAL = '#0d9488';
const C_DARK = '#1e293b';
const C_GRAY = '#64748b';
const C_BORDER = '#cbd5e1';
const C_RED = '#be123c';
const C_GREEN = '#047857';

function drawHeader(title) {
  doc.save();
  doc.rect(40, 20, 515, 1).fill(C_BORDER);
  doc.fontSize(7).font('Helvetica').fillColor(C_GRAY).text('GUIDE D’UTILISATION — SIMULATEUR DE RETRAITE & CER • MIAGE', 40, 10, { lineBreak: false });
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C_TEAL).text(title, 40, 10, { align: 'right', width: 515, lineBreak: false });
  doc.restore();
}

function drawSectionTitle(number, title) {
  doc.moveDown(0.6);
  const y = doc.y;
  doc.rect(40, y, 5, 18).fill(C_TEAL);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C_NAVY)
     .text(`${number}. ${title}`, 50, y + 3);
  doc.moveDown(0.4);
}

function drawSubSectionTitle(title) {
  doc.moveDown(0.3);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C_BLUE).text(title);
  doc.moveDown(0.2);
}

function drawParagraph(text) {
  doc.fontSize(8.5).font('Helvetica').fillColor(C_DARK).text(text, { lineGap: 2.0, align: 'justify' });
  doc.moveDown(0.25);
}

function drawAlertBox(type, title, text) {
  const y = doc.y;
  const bgColor = type === 'RED' ? '#fff1f2' : '#f0fdf4';
  const borderColor = type === 'RED' ? '#f43f5e' : '#10b981';
  const titleColor = type === 'RED' ? C_RED : C_GREEN;

  doc.rect(40, y, 515, 46).fill(bgColor);
  doc.rect(40, y, 4, 46).fill(borderColor);

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(titleColor).text(title, 50, y + 5);
  doc.fontSize(7.5).font('Helvetica').fillColor(C_DARK).text(text, 50, y + 17, { width: 495, lineGap: 1.6 });
  doc.y = y + 50;
  doc.moveDown(0.2);
}

function drawTable(headers, rows, colWidths, aligns = []) {
  const startX = 40;
  let currentY = doc.y;

  // Header
  doc.rect(startX, currentY, 515, 17).fill(C_NAVY);
  let curX = startX;
  headers.forEach((h, i) => {
    const align = aligns[i] || 'left';
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff')
       .text(h, curX + 4, currentY + 5, { width: colWidths[i] - 8, align: align });
    curX += colWidths[i];
  });

  currentY += 17;

  // Rows
  rows.forEach((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    doc.rect(startX, currentY, 515, 15).fill(isEven ? '#ffffff' : '#f8fafc');
    doc.rect(startX, currentY, 515, 1).fill(C_BORDER);

    let cellX = startX;
    row.forEach((cell, cIdx) => {
      const align = aligns[cIdx] || 'left';
      const isBold = cIdx === 0 || cIdx === row.length - 1;
      doc.fontSize(7).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(C_DARK)
         .text(String(cell), cellX + 4, currentY + 4, { width: colWidths[cIdx] - 8, align: align });
      cellX += colWidths[cIdx];
    });

    currentY += 15;
  });

  doc.rect(startX, currentY, 515, 1).fill(C_BORDER);
  doc.y = currentY + 5;
  doc.moveDown(0.25);
}

// ==========================================
// PAGE 1 : COUVERTURE & PRÉSENTATION
// ==========================================
doc.rect(40, 35, 515, 120).fill(C_NAVY);
doc.rect(40, 155, 515, 4).fill(C_TEAL);

doc.fontSize(18).font('Helvetica-Bold').fillColor('#ffffff')
   .text('GUIDE COMPLET D’UTILISATION', 58, 55);
doc.fontSize(12).font('Helvetica-Bold').fillColor('#38bdf8')
   .text('Simulateur de Retraite Obligatoire & Cumul Emploi-Retraite', 58, 78);
doc.fontSize(8.5).font('Helvetica').fillColor('#94a3b8')
   .text('Assurance Retraite (CNAV / LURA) • Agirc-Arrco • Réforme 2023 • Suspension LFSS 2026', 58, 96);
doc.fontSize(8).font('Helvetica-Bold').fillColor('#f8fafc')
   .text('PROJET UNIVERSITAIRE MASTER MIAGE — SYSTÈMES D’INFORMATION & DROIT SOCIAL', 58, 122);

doc.y = 175;

drawSectionTitle('1', 'Présentation Générale & Objectifs');
drawParagraph(
  'Ce simulateur web est un outil d’aide à la décision conçu pour les conseillers retraite et les auditeurs sociaux. Il permet d’évaluer avec une rigueur mathématique et juridique absolue les droits à pension d’un assuré relevant du secteur privé ou agricole (régimes alignés LURA). Il intègre les règles les plus récentes du droit social français, notamment la Réforme des retraites de 2023 et les mesures de suspension issues de la LFSS 2026.'
);

drawSubSectionTitle('Périmètre fonctionnel couvert :');
const bulletsP1 = [
  '• Relevé de carrière complet : multi-devises (conversion automatique FRF/EUR au taux légal de 6,55957), plafonnement annuel au PASS (1979-2026) et coefficients officiels de revalorisation CNAV.',
  '• Calcul de la pension de base (CNAV) : détection automatique de la Carrière Longue (RACL), calcul du SAM sur 25, 24 ou 23 meilleures années, décote, surcote (+1,25 %/trim.) et majoration +10 % dès 3 enfants.',
  '• Calcul de la complémentaire Agirc-Arrco : liquidation des points acquis, application de la valeur du point (1,4386 €) et de la majoration familiale plafonnée (2 367,48 €/an).',
  '• Analyse experte du Cumul Emploi-Retraite (CER) : distinction stricte entre CER Plafonné et CER Intégral, alerte rouge sur le délai de carence obligatoire de 6 mois chez le dernier employeur, vérification du plafond (1,6 SMIC) et ouverture de nouveaux droits.'
];
bulletsP1.forEach(b => drawParagraph(b));

drawSectionTitle('2', 'Architecture Technique & Stack');
drawTable(
  ['Composant / Outil', 'Technologie choisie', 'Rôle dans l’application'],
  [
    ['Interface Web', 'React 18 + TypeScript', 'Composants typés, architecture déclarative et réactive'],
    ['Design & Responsive', 'Tailwind CSS', 'Palette institutionnelle (Bleu / Sarcelle) & Mode Présentation'],
    ['Visualisation graphique', 'Recharts', 'Histogrammes de taux de remplacement & courbes de carrière'],
    ['Iconographie', 'Lucide React', 'Repères visuels clairs et feux d’alerte tricolores'],
    ['Moteur de calcul pur', 'src/engine/retirementCalculator.ts', 'Calculs découplés sans effet de bord, commentés CSS'],
    ['Tests unitaires', 'Vitest (12 tests / 100 % passants)', 'Validation automatique des cas de référence']
  ],
  [125, 140, 250]
);

// ==========================================
// PAGE 2 : GUIDE DES ÉCRANS
// ==========================================
doc.addPage();
drawHeader('GUIDE DE NAVIGATION PAR ÉCRAN');

drawSectionTitle('3', 'Guide Pas-à-Pas des Écrans (4 Onglets)');

drawSubSectionTitle('Barre supérieure : Scénarios en 1 clic & Outils de démonstration');
drawParagraph(
  'La barre supérieure permet de charger immédiatement des cas concrets pour le jury sans aucune saisie fastidieuse :'
);
drawParagraph(
  '1. « Cas Sakura (Défaut) » : pré-remplit instantanément l’ensemble de la carrière de Sakura (1979-2024, 177 trimestres, 9 274,16 pts Agirc-Arrco).\n' +
  '2. « Cas Test LFSS 2026 » : charge une femme née en mars 1965 avec 2 enfants partant au 01/10/2026 pour démontrer le gel de l’âge légal et le calcul sur 23 meilleures années.\n' +
  '3. « Nouveau profil vierge » : réinitialise l’interface pour saisir un dossier personnalisé.\n' +
  '4. Boutons « Import / Export CSV » : exporte le relevé sous format tableur ou réimporte un CSV existant.\n' +
  '5. Bouton « Mode Présentation » : active une typographie agrandie et des contrastes renforcés pour vidéoprojecteur.'
);

drawSubSectionTitle('Onglet 1 : Profil & Paramètres de départ');
drawParagraph(
  'Cet onglet recueille les éléments déterminant les droits de l’assuré :'
);
drawParagraph(
  '• Décodage automatique du NIR : saisissez les 5 premiers chiffres (ex: 2 63 01). Le système extrait automatiquement le sexe (1: Homme, 2: Femme), l’année et le mois de naissance.\n' +
  '• Majoration trimestres mère : case à cocher attribuant 8 trimestres par enfant (4 maternité + 4 éducation, Art. L. 351-4 CSS).\n' +
  '• Dernier salaire brut mensuel : sert de base au calcul du taux de remplacement et au plafond de cumul emploi-retraite.\n' +
  '• Toggle « Projet après la retraite (CER) » : active les champs de reprise (date, reprise chez l’ancien employeur Oui/Non, nouveau salaire).'
);

drawSubSectionTitle('Onglet 2 : Relevé de carrière dynamique');
drawParagraph(
  'Ce tableau liste l’ensemble des années de cotisation de l’assuré avec recalcul dynamique automatique ligne par ligne :'
);
drawParagraph(
  '• Gestion des devises : sélecteur FRF / EUR. La saisie en Francs est automatiquement convertie en Euros (1 EUR = 6,55957 FRF).\n' +
  '• Plafonnement PASS automatique : le salaire retenu ne peut excéder le PASS officiel de l’année civile concernée.\n' +
  '• Revalorisation CNAV : application des coefficients officiels de mise à jour des salaires et cotisations.\n' +
  '• Badge visuel « Top N retenu » : distingue les meilleures années sélectionnées pour le calcul du SAM (doré pour les 25 ou 23 meilleures années).'
);

drawSubSectionTitle('Onglet 3 : Tableau de bord & Estimation détaillée');
drawParagraph(
  'Il rassemble les résultats synthétiques et comparatifs indispensables à la prise de décision :'
);
drawParagraph(
  '• Bandeau Feu Vert / Orange / Rouge : indique la conformité de l’âge au départ vs âge légal, et détaille l’éligibilité à la Carrière Longue.\n' +
  '• Cartes de résultats : affichent le montant brut et l’estimation nette (-9,1 % sur la base et -10,1 % sur l’Agirc-Arrco au taux normal).\n' +
  '• Graphiques Recharts : histogramme du taux de remplacement et courbe d’évolution des salaires réels vs plafonnés vs revalorisés.\n' +
  '• Simulateur « Et si je décalais mon départ ? » : curseur déplaçant la date de -12 à +36 mois pour visualiser l’impact de la surcote (+1,25 %/trimestre supplémentaire) et le déblocage du CER intégral !'
);

drawSubSectionTitle('Onglet 4 : « Et au-delà... » Module Cumul Emploi-Retraite (CER)');
drawParagraph(
  'Analyse juridique complète de la situation de reprise : alerte sur la carence de 6 mois, calcul de l’écrêtement de la pension en cas de dépassement du plafond, et options de conseil alternatif.'
);

// ==========================================
// PAGE 3 : CAS SAKURA & CAS LFSS 2026
// ==========================================
doc.addPage();
drawHeader('CAS DE RÉFÉRENCE & VALIDATION');

drawSectionTitle('4', 'Le Cas Référence « Sakura » Déchiffré');

drawParagraph(
  'Profil : Femme née le 01/01/1963, 3 enfants élevés, départ souhaité au 01/01/2025, dernier salaire = 4 500 €/mois. Reprise d’activité au 01/02/2025 chez le même employeur à 4 500 €/mois.'
);

drawTable(
  ['Élément de calcul', 'Règle juridique appliquée', 'Valeur obtenue'],
  [
    ['Âge au départ', '01/01/2025 - 01/01/1963', '62 ans 0 mois'],
    ['Âge légal génération 1963', 'Réforme 2023 (Art. L. 161-17-2 CSS)', '62 ans 9 mois / 170 trimestres requis'],
    ['Éligibilité Carrière Longue', 'Début avant 20 ans (13 trim. fin 1983) + 173 cotisés', 'ÉLIGIBLE Taux Plein 50 % (Art. L. 351-1-1 CSS)'],
    ['Nombre d’années SAM (N)', 'Départ avant sept. 2026', '25 meilleures années'],
    ['Salaire Annuel Moyen (SAM)', 'Moyenne des 25 années revalorisées', '40 923,49 € (≈ 40 923 €)'],
    ['Retraite de Base brute (+10 %)', '40 923,49 € × 50 % × (170/170) × 1,10 / 12', '1 875,66 € / mois (≈ 1 705 € net)'],
    ['Points Agirc-Arrco acquis', '8 884,46 (fin 2023) + 389,70 (2024)', '9 274,16 points'],
    ['Retraite Agirc-Arrco brute (+10 %)', '(9 274,16 × 1,4386 € × 1,10) / 12 (bonus non plafonné)', '1 223,00 € / mois (≈ 1 099 € net)'],
    ['Total Mensuel Brut', 'Base (1 875,66 €) + Agirc (1 223,00 €)', '3 098,66 € / mois (≈ 2 804 € net)'],
    ['Taux de remplacement brut', '3 098,66 € / 4 500 €', '68,86 %'],
    ['Statut Cumul Emploi-Retraite', 'Départ < 62 ans 9 mois (âge légal)', 'CER PLAFONNÉ'],
    ['Conséquence reprise ancien emp.', 'Délai = 1 mois (< 6 mois de carence obligatoire)', 'ALERTE ROUGE : SUSPENSION TOTALE']
  ],
  [135, 220, 160]
);

drawAlertBox(
  'RED',
  'ALERTE ROUGE CRITIQUE SUR LE CUMUL EMPLOI-RETRAITE DE SAKURA',
  'En partant à 62 ans via la Carrière Longue, Sakura liquide sa retraite avant l’âge légal (62 ans 9 mois). Elle relève obligatoirement du CER PLAFONNÉ. L’article L. 161-22 du CSS impose un délai de carence strict de 6 mois pour reprendre chez son ancien employeur. Comme Sakura reprend dès le 01/02/2025 (1 mois après son départ), ses pensions sont SUSPENDUES pendant les 5 mois restants (jusqu’au 01/07/2025) !'
);

drawSectionTitle('5', 'Le Cas Test « LFSS 2026 » (Suspension & 23 ans)');
drawParagraph(
  'Profil : Femme née le 15/03/1965, 2 enfants, départ au 01/10/2026. Ce scénario valide l’actualité législative 2026 :'
);
drawParagraph(
  '1. Application de la Suspension LFSS 2026 : pour tout départ dès le 1er septembre 2026, l’âge légal de la génération 1965 (janv-mars) est gelé à 62 ans 9 mois / 170 trimestres (au lieu de 63 ans 3 mois / 172 trimestres sous la réforme 2023).\n' +
  '2. Bonification du SAM sur 23 meilleures années : la LFSS 2026 dispose que les mères d’au moins 2 enfants bénéficient d’une réduction de la durée de calcul du SAM à 23 meilleures années (au lieu de 25), ce qui élimine les 2 années les plus faibles de la carrière et augmente le montant de la pension de base !'
);

// ==========================================
// PAGE 4 : MÉMO ORAL POUR LE JURY
// ==========================================
doc.addPage();
drawHeader('FICHES MÉMO & DROIT SOCIAL POUR L’EXAMEN');

drawSectionTitle('6', 'Fiche Mémo pour la Soutenance Orale (Jury MIAGE)');

drawSubSectionTitle('1. Formule de la Retraite de Base (CNAV / LURA)');
doc.rect(40, doc.y, 515, 18).fill('#0f172a');
doc.fontSize(8).font('Helvetica-Bold').fillColor('#fde047')
   .text('Pension = SAM × Taux de liquidation × (Trimestres retenus / Trimestres requis) × (1 + Surcote) + Majoration', 46, doc.y + 4);
doc.y += 24;

drawParagraph(
  '• SAM (Salaire Annuel Moyen) : Moyenne arithmétique des salaires revalorisés des 25 meilleures années (Art. R. 351-29 CSS). Chaque salaire annuel est strictement plafonné au PASS de l’année de perception (Art. L. 351-1 CSS).\n' +
  '• Taux de liquidation : 50 % au taux plein. En cas de trimestres manquants, décote de 0,625 point par trimestre manquant (taux minimum 37,5 %, Art. R. 351-27 CSS).\n' +
  '• Proratisation : Rapport Trimestres validés / Trimestres requis, plafonné à 1 (100 %).\n' +
  '• Surcote : +1,25 % par trimestre civil supplémentaire cotisé après l’âge légal ET au-delà du taux plein (Art. L. 351-1-2 CSS).\n' +
  '• Majoration familiale : +10 % sur la pension de base dès 3 enfants nés et élevés (Art. L. 351-12 CSS).\n' +
  '• Prélèvements sociaux de base (taux normal) : -9,1 % (CSG 8,3 % + CRDS 0,5 % + CASA 0,3 %).'
);

drawSubSectionTitle('2. Formule de la Retraite Complémentaire Agirc-Arrco');
doc.rect(40, doc.y, 515, 18).fill('#0f172a');
doc.fontSize(8).font('Helvetica-Bold').fillColor('#5eead4')
   .text('Pension Agirc-Arrco = Total points acquis × Valeur du point (1,4386 €) + Majoration enfants (plafonnée)', 46, doc.y + 4);
doc.y += 24;

drawParagraph(
  '• Valeur de service du point : 1,4386 € au 01/11/2024 (Accord ANI).\n' +
  '• Majoration enfants : +10 % dès 3 enfants élevés pendant au moins 9 ans avant 16 ans, plafonnée à 2 367,48 €/an (197,29 €/mois au 01/11/2024).\n' +
  '• Coefficient de solidarité (Malus 10 %) : supprimé définitivement par les partenaires sociaux depuis le 01/12/2023.\n' +
  '• Prélèvements sociaux Agirc-Arrco (taux normal) : -10,1 % (CSG 8,3 % + CRDS 0,5 % + CASA 0,3 % + Cotisation Maladie 1,0 %).'
);

drawSubSectionTitle('3. Les 3 Règles d’Or du Cumul Emploi-Retraite (CER)');
drawParagraph(
  '• Distinction Âge légal : Si départ avant l’âge légal (ex: Carrière longue) -> CER Plafonné d’office, même si l’assuré bénéficie du taux plein !\n' +
  '• Délai de carence de 6 mois (Art. L. 161-22 CSS) : En CER plafonné, reprendre chez son ancien employeur avant 6 mois suspend les pensions de base et complémentaire. Reprendre chez un nouvel employeur est possible immédiatement !\n' +
  '• Nouveaux droits (Loi du 14 avril 2023) : Seul le CER INTÉGRAL ouvre droit à une seconde pension (plafonnée à 5 % du PASS, soit 2 403 €/an en 2026). En CER plafonné, les cotisations sont à fonds perdus.'
);

drawSubSectionTitle('4. Repères Chiffrés 2026 à connaître par cœur');
drawParagraph(
  '• PASS 2026 = 48 060 € (PMSS = 4 005 €) • SMIC horaire 2026 = 12,02 € (SMIC mensuel 35h = 1 823,07 €) • Plafond CER (1,6 SMIC) = 2 916,92 € • Validation 1 trimestre 2026 = 150 × SMIC = 1 803 € brut (4 trimestres = 7 212 €).'
);

// Numérotation des pages dynamique sans débordement
const totalPages = 4;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.fontSize(7.5).font('Helvetica').fillColor(C_GRAY)
     .text(`Page ${i + 1} sur ${totalPages}`, 40, 785, { align: 'center', width: 515, lineBreak: false });
}

doc.end();

stream.on('finish', () => {
  console.log('PDF generated cleanly. Total pages:', totalPages);
});

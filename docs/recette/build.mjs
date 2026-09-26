import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  AlignmentType, Document, Footer, HeadingLevel, PageBreak, PageNumber, PageOrientation,
  Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType
} from 'docx';
import { loadData, loadSourceText } from './lib/load.mjs';
import { validateAll } from './validate.mjs';

const CASE_COLS = [850, 850, 1150, 1900, 3300, 1700, 2300, 700, 800, 800, 1000]; // = 15350 (A4 paysage, marges 700)
const FILL = { head: 'D9E2F3', Critique: 'F8CBAD', Majeur: 'FFE699', Mineur: 'E2EFDA' };
const TYPE_LABEL = { nominal: 'Nominal', negatif: 'Négatif', securite: 'Sécurité' };

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 40 },
  alignment: opts.align,
  children: [new TextRun({ text: String(text), bold: opts.bold, size: opts.size ?? 16, color: opts.color })]
});
const lines = (items, numbered = false) =>
  asList(items).length ? asList(items).map((t, i) => p(numbered ? `${i + 1}. ${t}` : `• ${t}`)) : [p('—')];

const cell = (children, width, fill) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  margins: { top: 50, bottom: 50, left: 80, right: 80 },
  shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
  children
});
const row = (cells, header = false) => new TableRow({ tableHeader: header, cantSplit: true, children: cells });
const table = (cols, rows) => new Table({
  width: { size: cols.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: cols,
  rows
});
const headRow = (cols, labels) =>
  row(labels.map((l, i) => cell([p(l, { bold: true })], cols[i], FILL.head)), true);

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 }, children: [new TextRun({ text, size: 30, bold: true })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 }, children: [new TextRun({ text, size: 24, bold: true })] });
const body = (text) => p(text, { size: 20 });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function caseRow(c) {
  const cellsText = [
    [p(c.id, { bold: true }), p(TYPE_LABEL[c.type])],
    [p(c.priority, { bold: true })],
    [p(c.role)],
    [...lines(c.preconditions)],
    [p(c.title, { bold: true }), ...lines(c.steps, true)],
    [...lines(c.data)],
    [...lines(c.expected), ...(c.aConfirmer ? [p('À confirmer : ' + c.aConfirmer, { bold: true, color: 'C00000' })] : [])],
    [p('☐ OK'), p('☐ KO'), p('☐ Bloqué'), p('☐ Non testé')],
    [p('')], [p('')], [p('')]
  ];
  return row(cellsText.map((kids, i) => cell(kids, CASE_COLS[i], i === 1 ? FILL[c.priority] : undefined)));
}

function processSection(proc) {
  const labels = ['ID / Type', 'Priorité', 'Rôle', 'Préconditions', 'Étapes', 'Données saisies',
    'Résultat attendu', 'Statut', 'Date', 'Testeur', 'Observation'];
  return [
    h1(`${proc.id} — ${proc.title}`),
    body(`Accès : ${proc.access}`),
    body(proc.intro),
    table(CASE_COLS, [headRow(CASE_COLS, labels), ...proc.cases.map(caseRow)]),
    pageBreak()
  ];
}

function coverSection(meta) {
  const e = meta.environment;
  const cols = [3000, 12000];
  const kv = (k, v) => row([cell([p(k, { bold: true, size: 20 })], cols[0], FILL.head), cell([p(v, { size: 20 })], cols[1])]);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 300 }, children: [new TextRun({ text: meta.title, bold: true, size: 44 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Recette utilisateur avant mise en production', size: 26 })] }),
    table(cols, [kv('URL testée', e.url), kv('Front', e.front), kv('Back', e.back), kv('Version (commit)', e.commit), kv('Date de la recette', e.date), kv('Testeur', e.testeur)]),
    pageBreak()
  ];
}

function modeEmploi() {
  return [
    h1('Mode d’emploi'),
    body('Pour chaque cas, suivre les étapes dans l’ordre avec le rôle indiqué, comparer au résultat attendu, puis cocher un statut.'),
    h2('Statuts d’un cas'),
    ...['OK : le résultat observé correspond au résultat attendu.',
      'KO : le résultat observé diffère. Consigner l’anomalie dans le registre.',
      'Bloqué : le cas ne peut pas être exécuté (compte, donnée ou dépendance manquante). Préciser la raison.',
      'Non testé : cas pas encore déroulé.'].map((t) => body('• ' + t)),
    h2('Gravité d’une anomalie'),
    ...['Critique : bloque un processus ou expose des données. Mise en production refusée.',
      'Majeur : fonctionnalité dégradée avec contournement.',
      'Mineur : défaut d’affichage ou de confort.'].map((t) => body('• ' + t)),
    h2('Types de cas'),
    body('Nominal : le parcours qui doit fonctionner. Négatif : saisie invalide ou action interdite. Sécurité : accès non autorisé, refus attendu.'),
    body('Un résultat marqué « À confirmer » dépend d’une règle métier non visible côté écran : à valider avec le responsable métier.'),
    pageBreak()
  ];
}

function comptesSection(meta) {
  const cols = [3000, 3500, 8850];
  return [
    h1('Comptes et données de test'),
    h2('Comptes Keycloak à créer sur la VM'),
    table(cols, [headRow(cols, ['Rôle', 'Identifiant', 'Usage']),
      ...meta.accounts.map((a) => row([cell([p(a.role, { size: 18 })], cols[0]), cell([p(a.login, { size: 18 })], cols[1]), cell([p(a.usage, { size: 18 })], cols[2])]))]),
    h2('Jeux de pièces jointes'),
    table([5000, 10350], [headRow([5000, 10350], ['Fichier', 'Usage']),
      ...meta.datasets.map((d) => row([cell([p(d.name, { size: 18 })], 5000), cell([p(d.usage, { size: 18 })], 10350)]))]),
    h2('Dossiers de départ'),
    table([2000, 3500, 9850], [headRow([2000, 3500, 9850], ['Référence', 'Statut', 'Usage']),
      ...meta.startDossiers.map((d) => row([cell([p(d.ref, { size: 18 })], 2000), cell([p(d.statut, { size: 18 })], 3500), cell([p(d.usage, { size: 18 })], 9850)]))]),
    pageBreak()
  ];
}

function annexeAConfirmer(processes) {
  const items = processes.flatMap((pr) => pr.cases.filter((c) => c.aConfirmer).map((c) => ({ id: c.id, text: c.aConfirmer })));
  if (!items.length) return [h1('Points à confirmer'), body('Aucun point à confirmer.'), pageBreak()];
  const cols = [1500, 13850];
  return [
    h1('Points à confirmer'),
    body('Règles métier non lisibles côté écran, à valider avec le responsable métier avant de conclure sur les cas concernés.'),
    table(cols, [headRow(cols, ['Cas', 'Règle à confirmer']),
      ...items.map((i) => row([cell([p(i.id, { size: 18, bold: true })], cols[0]), cell([p(i.text, { size: 18 })], cols[1])]))]),
    pageBreak()
  ];
}

function anomalies() {
  const labels = ['N°', 'Cas', 'Description de l’anomalie', 'Gravité', 'Date', 'Responsable', 'Correction'];
  const cols = [700, 1300, 6500, 1300, 1300, 2200, 2138];
  const empty = Array.from({ length: 12 }, () => row(cols.map((w) => cell([p('')], w))));
  return [h1('Registre des anomalies'), table(cols, [headRow(cols, labels), ...empty]), pageBreak()];
}

function pv() {
  const cols = [5000, 10350];
  return [
    h1('PV de recette'),
    body('Décision (cocher une case) :'),
    body('☐ Validé     ☐ Validé avec réserves     ☐ Refusé'),
    body('Réserves ou motifs :'),
    table(cols, [
      row([cell([p('', { size: 40 })], cols[0]), cell([p('')], cols[1])]),
      row([cell([p('Testeur (nom, date, signature)', { size: 18 })], cols[0], FILL.head), cell([p('')], cols[1])]),
      row([cell([p('Responsable métier (nom, date, signature)', { size: 18 })], cols[0], FILL.head), cell([p('')], cols[1])]),
      row([cell([p('Responsable technique (nom, date, signature)', { size: 18 })], cols[0], FILL.head), cell([p('')], cols[1])])
    ])
  ];
}

export function buildDocument({ meta, processes }) {
  return new Document({
    creator: 'ASCE-LC',
    title: meta.title,
    styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 700, right: 700, bottom: 700, left: 700 }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ size: 16, children: ['Cahier de recette ASCE-LC — page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES] })]
          })]
        })
      },
      children: [
        ...coverSection(meta), ...modeEmploi(), ...comptesSection(meta),
        ...processes.flatMap(processSection),
        ...annexeAConfirmer(processes), ...anomalies(), ...pv()
      ]
    }]
  });
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const { meta, processes } = await loadData(resolve(here, 'data'));
  const errs = validateAll({ processes, meta, srcText: loadSourceText(resolve(here, '../../src')), expectAll: true });
  if (errs.length) {
    console.error(errs.join('\n'));
    console.error(`\n${errs.length} erreur(s) : génération refusée`);
    process.exit(1);
  }
  const outDir = resolve(here, 'out');
  mkdirSync(outDir, { recursive: true });
  const file = resolve(outDir, 'Cahier-de-recette-ASCE-LC.docx');
  writeFileSync(file, await Packer.toBuffer(buildDocument({ meta, processes })));
  console.log(`Généré : ${file} (${processes.reduce((n, x) => n + x.cases.length, 0)} cas)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

// Assemble le manuel de formation INTÉGRITÉ+ en un fichier Word.
// Usage : node manuel/construire.mjs   (depuis docs/formation/environnement)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, LevelFormat, Header, Footer, PageNumber, TableOfContents,
    BorderStyle, HeadingLevel
} from 'docx';
import { VERT, GRIS, compteurListes, compteurFigures, h1, p } from './lib-docx.mjs';
import { chapitres1 } from './chapitres-1.mjs';
import { chapitres2 } from './chapitres-2.mjs';
import { chapitres3 } from './chapitres-3.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '..', '..', '..', '..');
const sortie = path.resolve(ici, '..', '..', 'Manuel-de-formation-INTEGRITE-plus.docx');

const corps = [...(await chapitres1()), ...(await chapitres2()), ...(await chapitres3())];

// ---------- page de garde
const logo = path.join(racine, 'public', 'assets', 'logo-asce.png');
const garde = [
    new Paragraph({ spacing: { before: 1400 }, children: [] }),
    ...(fs.existsSync(logo) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(logo), transformation: { width: 260, height: 125 }, altText: { title: 'Logo ASCE-LC', description: 'Logo ASCE-LC', name: 'logo' } })] })] : []),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'INTÉGRITÉ+', bold: true, size: 72, color: VERT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: VERT, space: 12 } }, children: [new TextRun({ text: 'Manuel de formation', size: 44, color: '1F2D27' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360, after: 120 }, children: [new TextRun({ text: "Plateforme de réception et de traitement des dénonciations et des plaintes", size: 28, color: GRIS })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Portail citoyen · Agents · Direction · Administration', size: 24, color: GRIS })] }),
    new Paragraph({ spacing: { before: 2600 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Autorité Supérieure de Contrôle d'État et de Lutte contre la Corruption (ASCE-LC)", bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Version 1.0 — octobre 2026', size: 22, color: GRIS })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Les captures proviennent d'un environnement de test : tous les dossiers qui y figurent sont fictifs.", italics: true, size: 20, color: GRIS })] })
];

const sommaire = [
    new Paragraph({ pageBreakBefore: true, spacing: { before: 240, after: 200 }, children: [new TextRun({ text: 'Table des matières', bold: true, size: 36, color: VERT })] }),
    new TableOfContents('Table des matières', { hyperlink: true, headingStyleRange: '1-2' }),
    p("_Dans Word, si la table est vide ou à jour de façon incomplète, faites un clic droit dessus puis « Mettre à jour les champs » (touche F9)._")
];

// numérotation : une configuration par liste numérotée
const numerotations = [];
for (let i = 1; i <= compteurListes.n; i++) {
    numerotations.push({ reference: `etapes-${i}`, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] });
}

const doc = new Document({
    creator: 'ASCE-LC', title: 'INTÉGRITÉ+ — Manuel de formation', description: 'Manuel de formation de la plateforme INTÉGRITÉ+ et du portail citoyen',
    styles: {
        default: { document: { run: { font: 'Calibri', size: 22 } } },
        paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, color: VERT, font: 'Calibri' }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '1F2D27', font: 'Calibri' }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
            { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: VERT, font: 'Calibri' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
        ]
    },
    numbering: {
        config: [
            { reference: 'puces', levels: [
                { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
                { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } }
            ] },
            ...numerotations
        ]
    },
    sections: [
        { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } }, children: garde },
        {
            properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
            headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D4CE', space: 4 } }, children: [new TextRun({ text: 'INTÉGRITÉ+ — Manuel de formation', size: 18, color: GRIS })] })] }) },
            footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ASCE-LC · page ', size: 18, color: GRIS }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRIS })] })] }) },
            children: [...sommaire, ...corps]
        }
    ]
});

const octets = await Packer.toBuffer(doc);
fs.writeFileSync(sortie, octets);
console.log(`Manuel écrit : ${sortie}`);
console.log(`${(octets.length / 1024 / 1024).toFixed(1)} Mo, ${compteurFigures()} figures, ${compteurListes.n} listes numérotées`);

// Outils de mise en forme du manuel de formation (docx-js) : titres, encadrés, figures, tableaux, listes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
    Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
    BorderStyle, PageBreak, VerticalAlign, LineRuleType
} from 'docx';

const ici = path.dirname(fileURLToPath(import.meta.url));
export const CAPTURES = path.resolve(ici, '..', '..', 'captures');
const ROGNE = path.join(CAPTURES, 'rogne');
fs.mkdirSync(ROGNE, { recursive: true });

export const VERT = '0B6B3A', VERT_CLAIR = 'E8F3EC', GRIS = '5B6770', ROUGE = 'B3261E', AMBRE = 'B26A00';
export const LARGEUR_TEXTE = 9638; // A4, marges 2 cm, en DXA (1/20 de point)
const PX_LARGEUR_MAX = 610;       // largeur maximale d'une image à 96 ppp (≈ 16,1 cm)
const PX_HAUTEUR_MAX = 720;       // ≈ 19 cm

let numeroFigure = 0;
export const compteurFigures = () => numeroFigure;

// ---------- texte
/** Découpe un texte en segments : **gras** et _italique_. */
function segments(texte, base = {}) {
    const runs = [];
    for (const morceau of String(texte).split(/(\*\*[^*]+\*\*|_[^_]+_)/g)) {
        if (!morceau) continue;
        if (morceau.startsWith('**')) runs.push(new TextRun({ text: morceau.slice(2, -2), bold: true, ...base }));
        else if (morceau.startsWith('_') && morceau.endsWith('_') && morceau.length > 2) runs.push(new TextRun({ text: morceau.slice(1, -1), italics: true, ...base }));
        else runs.push(new TextRun({ text: morceau, ...base }));
    }
    return runs;
}
export const p = (texte, opt = {}) => new Paragraph({ children: segments(texte, opt.run), spacing: { after: opt.apres ?? 120, line: 288 }, alignment: opt.align, keepNext: opt.garder, indent: opt.indent });
export const h1 = texte => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: texte })] });
export const h2 = texte => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun({ text: texte })] });
export const h3 = texte => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: [new TextRun({ text: texte })] });
export const saut = () => new Paragraph({ children: [new PageBreak()] });

export const puces = (items, niveau = 0) => items.map(t => new Paragraph({ numbering: { reference: 'puces', level: niveau }, children: segments(t), spacing: { after: 60, line: 276 } }));
export const etapes = (items) => items.map((t, i) => new Paragraph({
    numbering: { reference: `etapes-${compteurListes.n}`, level: 0 }, children: segments(t), spacing: { after: 80, line: 276 }
}));
export const compteurListes = { n: 0 };
/** Liste numérotée repartant de 1 (une configuration de numérotation par liste, déclarée dans construire.mjs). */
export function listeNumerotee(items) { compteurListes.n += 1; return etapes(items); }

// ---------- encadrés
const bordure = (couleur, taille = 6) => ({ style: BorderStyle.SINGLE, size: taille, color: couleur });
const aucune = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
function encadre(titre, lignes, couleur, fond) {
    const contenu = [];
    if (titre) contenu.push(new Paragraph({ children: [new TextRun({ text: titre, bold: true, color: couleur })], spacing: { after: 60 } }));
    for (const l of lignes) contenu.push(typeof l === 'string' ? new Paragraph({ children: segments(l), spacing: { after: 60, line: 276 } }) : l);
    return new Table({
        width: { size: LARGEUR_TEXTE, type: WidthType.DXA }, columnWidths: [LARGEUR_TEXTE],
        rows: [new TableRow({ cantSplit: true, children: [new TableCell({
            width: { size: LARGEUR_TEXTE, type: WidthType.DXA },
            shading: { fill: fond, type: ShadingType.CLEAR, color: 'auto' },
            margins: { top: 100, bottom: 100, left: 180, right: 160 },
            borders: { top: aucune, bottom: aucune, right: aucune, left: bordure(couleur, 24) },
            children: contenu
        })] })]
    });
}
// séparateur très fin : un grand séparateur en fin de chapitre peut tomber seul sur une page blanche
const espace = () => new Paragraph({ children: [new TextRun({ text: '', size: 2 })], spacing: { before: 0, after: 0, line: 100, lineRule: LineRuleType.EXACT } });
export const astuce = (...l) => [encadre('À retenir', l, VERT, VERT_CLAIR), espace()];
export const attention = (...l) => [encadre('Attention', l, AMBRE, 'FFF4E0'), espace()];
export const exercice = (titre, ...l) => [encadre(titre, l, '1F5FA8', 'E8F0FB'), espace()];
export const aConfirmer = (...l) => [encadre('À confirmer avant diffusion', l, ROUGE, 'FDECEA'), espace()];

// ---------- figures
function dimensionsPng(fichier) {
    const b = fs.readFileSync(fichier);
    return { l: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
/** Figure centrée avec légende numérotée. options : { recadrer: { haut, hauteur }, largeur } */
export async function fig(nom, legende, options = {}) {
    let fichier = path.join(CAPTURES, nom + '.png');
    if (!fs.existsSync(fichier)) throw new Error('capture absente : ' + nom);
    // captures de l'application (1440 px) : on retire le menu de gauche pour agrandir la zone utile, sauf demande contraire
    const meta0 = await sharp(fichier).metadata();
    const gauche = (!options.menu && /^(adm|brpd|cj|cgea|cge|ce|ctadp|dcp)-/.test(nom) && meta0.width >= 1400) ? 330 : 0;
    if (options.recadrer || gauche) {
        const { haut = 0, hauteur = meta0.height } = options.recadrer ?? {};
        const sortie = path.join(ROGNE, `${nom}-${gauche}-${haut}-${hauteur}.png`);
        await sharp(fichier).extract({ left: gauche, top: haut, width: meta0.width - gauche, height: Math.min(hauteur, meta0.height - haut) }).toFile(sortie);
        fichier = sortie;
    }
    const { l, h } = dimensionsPng(fichier);
    const largeurMax = options.largeur ?? PX_LARGEUR_MAX;
    let w = Math.min(l, largeurMax), hh = Math.round(h * w / l);
    if (hh > PX_HAUTEUR_MAX) { hh = PX_HAUTEUR_MAX; w = Math.round(l * hh / h); }
    numeroFigure += 1;
    return [
        new Paragraph({
            alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 60, after: 40 },
            children: [new ImageRun({ type: 'png', data: fs.readFileSync(fichier), transformation: { width: w, height: hh }, altText: { title: legende, description: legende, name: nom } })]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `Figure ${numeroFigure} : ${legende}`, italics: true, size: 18, color: GRIS })] })
    ];
}

// ---------- tableaux
export function tableau(entetes, lignes, largeurs) {
    const total = largeurs.reduce((a, b) => a + b, 0);
    const cellule = (t, i, entete) => new TableCell({
        width: { size: largeurs[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
        shading: entete ? { fill: VERT, type: ShadingType.CLEAR, color: 'auto' } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        borders: { top: bordure('D5DDD8', 4), bottom: bordure('D5DDD8', 4), left: bordure('D5DDD8', 4), right: bordure('D5DDD8', 4) },
        children: String(t).split('\n').map(par => new Paragraph({ children: segments(par, entete ? { bold: true, color: 'FFFFFF', size: 20 } : { size: 20 }), spacing: { after: 20 } }))
    });
    return new Table({
        width: { size: total, type: WidthType.DXA }, columnWidths: largeurs,
        rows: [
            new TableRow({ tableHeader: true, cantSplit: true, children: entetes.map((t, i) => cellule(t, i, true)) }),
            ...lignes.map(l => new TableRow({ cantSplit: true, children: l.map((t, i) => cellule(t, i, false)) }))
        ]
    });
}
export const apresTableau = () => new Paragraph({ children: [new TextRun({ text: '', size: 2 })], spacing: { before: 0, after: 0, line: 160, lineRule: LineRuleType.EXACT } });

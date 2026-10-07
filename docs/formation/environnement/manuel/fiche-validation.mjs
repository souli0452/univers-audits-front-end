// Fiche d'une page à remettre à l'ASCE-LC : décisions et informations attendues, avec une colonne « Décision ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, PageOrientation } from 'docx';

const ici = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.resolve(ici, '..', '..', 'Points-a-valider-ASCE-LC.docx');
const VERT = '0B6B3A';
const police = 'Calibri';

const lignes = [
    ['1', 'Article de loi protégeant le lanceur d\'alerte',
        'Aucun numéro d\'article n\'est cité sur le portail en attendant. Merci de transmettre le texte et l\'article à afficher.'],
    ['2', 'Seuil d\'affichage du taux de traitement',
        'Le taux de traitement public est masqué sous 20 dossiers reçus, pour éviter un pourcentage peu significatif. Valeur proposée par nous : à confirmer ou à modifier.'],
    ['3', 'Plaintes anonymes',
        'Une victime qui souhaite rester anonyme n\'est plus refusée : son signalement est enregistré comme dénonciation (le manuel de 2021 et le site de l\'ASCE-LC admettent l\'anonymat). Confirmation écrite souhaitée.'],
    ['4', 'Réserves sur les textes du portail',
        'Les textes ont été validés « avec réserves ». Merci de lister ces réserves pour que nous les traitions par amendement.'],
    ['5', 'Délai d\'approbation du rapport par le CGEA',
        'La plateforme applique 10 jours ouvrables ; le manuel des procédures et le workflow donnent 20 jours ouvrables pour le CGE et le CGEA. Proposition : passer à 20 jours.'],
    ['6', 'Délai de réponse à une demande de complément',
        'La plateforme applique 14 jours ouvrables. Ni le manuel ni le workflow ne fixent ce délai. Valeur à valider ou à modifier.'],
    ['7', 'Coordonnées du portail',
        'À renseigner dans les paramètres du portail : adresse électronique de contact (info@asce-lc.bf proposée) et adresse postale.'],
    ['8', 'Intitulé du sigle DEI et du CTADP',
        'Repris du manuel des procédures : DEI = Département d\'Enquête et d\'Investigation ; CTADP = Comité de Traitement et d\'Analyse des Dénonciations et des Plaintes. Pour information, aucune action attendue.'],
    ['9', 'Comptes de formation',
        'Huit comptes à créer dans un environnement distinct de la production, un par profil, avec des mots de passe propres à la formation.'],
    ['10', 'Essai en production',
        'Après le déploiement : un agent du BRPD doit retrouver dans « Dossiers » les dépôts faits sur le portail (dont les trois dossiers nouveaux déjà reçus). Désigner l\'agent qui fera cet essai.']
];

const bord = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const bords = { top: bord, bottom: bord, left: bord, right: bord };
const largeurs = [500, 2600, 4638, 1900]; // total 9638 (A4, marges 2 cm)
const cellule = (texte, i, { entete = false } = {}) => new TableCell({
    borders: bords, width: { size: largeurs[i], type: WidthType.DXA },
    shading: entete ? { type: ShadingType.CLEAR, fill: VERT, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text: texte, font: police, size: 19, bold: entete || i === 1, color: entete ? 'FFFFFF' : '000000' })] })]
});

const tableau = new Table({
    width: { size: 9638, type: WidthType.DXA }, columnWidths: largeurs,
    rows: [
        new TableRow({ tableHeader: true, children: ['#', 'Point', 'Ce que nous proposons ou demandons', 'Décision de l\'ASCE-LC'].map((t, i) => cellule(t, i, { entete: true })) }),
        ...lignes.map(l => new TableRow({ cantSplit: true, children: [cellule(l[0], 0), cellule(l[1], 1), cellule(l[2], 2), cellule('', 3)] }))
    ]
});

const doc = new Document({
    styles: { default: { document: { run: { font: police, size: 20 } } } },
    sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children: [
            new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'INTÉGRITÉ+ : points à valider par l\'ASCE-LC', bold: true, size: 32, color: VERT, font: police })] }),
            new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Fiche à compléter et à nous retourner. Octobre 2026.', italics: true, size: 19, color: '595959', font: police })] }),
            tableau
        ]
    }]
});

fs.writeFileSync(sortie, await Packer.toBuffer(doc));
console.log('Fiche écrite :', sortie);

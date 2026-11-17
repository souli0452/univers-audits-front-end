import { LignePublication, PublicationTrimestrielle } from '../models/statistique.model';
import { xlsxSafe } from './xlsx-safe';

/** Périodes publiables : codes attendus par le serveur. */
export const PERIODES: { label: string; value: string }[] = [
    { label: 'T1 (janv. – mars)',   value: 'T1' },
    { label: 'T2 (avr. – juin)',    value: 'T2' },
    { label: 'T3 (juil. – sept.)',  value: 'T3' },
    { label: 'T4 (oct. – déc.)',    value: 'T4' },
    { label: 'S1 (1er semestre)',   value: 'S1' },
    { label: 'S2 (2e semestre)',    value: 'S2' },
    { label: "Année entière",       value: 'ANNEE' }
];

/** Dernier trimestre terminé : celui qu'on publie normalement (en mai, le T1 ; en janvier, le T4 de l'an dernier). */
export function periodeARapporter(maintenant: Date): { annee: number; periode: string } {
    const courant = Math.floor(maintenant.getMonth() / 3) + 1;
    return courant === 1
        ? { annee: maintenant.getFullYear() - 1, periode: 'T4' }
        : { annee: maintenant.getFullYear(), periode: 'T' + (courant - 1) };
}

export function nomDuFichier(s: PublicationTrimestrielle): string {
    return `situation-plaintes-denonciations-${s.annee}-${s.codePeriode}.csv`;
}

const virgule = (n: number): string => String(n).replace('.', ',');

/**
 * Cellule de texte CSV : neutralise une formule en tête, puis met entre guillemets (RFC 4180) si la valeur contient
 * un séparateur, un guillemet ou un saut de ligne, pour qu'elle ne déborde jamais sur la cellule voisine.
 */
function cellule(valeur: string): string {
    const sure = xlsxSafe(valeur);
    return /[;"\r\n]/.test(sure) ? `"${sure.replace(/"/g, '""')}"` : sure;
}

function tableau(titre: string, lignes: LignePublication[]): string[] {
    return [
        titre + ';Nombre;Part',
        ...lignes.map(l => `${cellule(l.libelle)};${l.nombre};${virgule(l.taux)} %`),
        ''
    ];
}

/**
 * Export CSV de la situation trimestrielle, prêt à ouvrir dans Excel en français (séparateur « ; », décimales
 * en virgule). Les libellés qui commenceraient comme une formule sont neutralisés.
 */
export function versCsv(s: PublicationTrimestrielle): string {
    const lignes: string[] = [
        `Situation des plaintes et dénonciations;${cellule(s.periode)}`,
        `Total des dossiers enregistrés;${s.total}`,
        '',
        ...tableau('Catégories', s.categories),
        ...tableau('Modes de saisine', s.modesDeSaisine),
        ...tableau('Typologie institutionnelle', s.typologiesInstitutionnelles),
        ...tableau('Allégations', s.allegations),
        ...tableau('Situation de traitement', s.traitement),
        `Enjeux financiers (FCFA);${s.enjeuxFinanciers}`,
        '',
        ...tableau('Recevabilité', s.recevabilite),
        ...tableau("Origine géographique", s.originesGeographiques),
        'Vélocité du traitement;Dossiers;Délai moyen',
        ...s.velocite.map(p => `${cellule(p.libelle)};${p.nombre};` +
            (p.delaiMoyenJours == null ? 'non mesuré' : `${virgule(p.delaiMoyenJours)} jours`)),
        '',
        ...s.notes.map(cellule)
    ];
    return lignes.join('\r\n');
}

// ───────────────────────── exports Excel et PDF ─────────────────────────

export interface SectionExport {
    titre: string;
    entetes: string[];
    lignes: (string | number)[][];
}

export interface FichierExporte {
    nom: string;
    octets: Uint8Array;
}

const TITRE_DU_DOCUMENT = 'Situation des plaintes et dénonciations';

/** Espaces insécables d'`Intl` remplacés par des espaces simples : les polices standard du PDF ne les affichent pas. */
const espaces = (t: string): string => t.replace(/[  ]/g, ' ');

const nombreFr = (n: number): string =>
    espaces(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n));

export const montantFcfa = (n: number): string => espaces(new Intl.NumberFormat('fr-FR').format(n)) + ' FCFA';

function sectionDeLignes(titre: string, premiereColonne: string, lignes: LignePublication[]): SectionExport {
    return {
        titre,
        entetes: [premiereColonne, 'Nombre', 'Part (%)'],
        lignes: lignes.map(l => [l.libelle, l.nombre, l.taux])
    };
}

/**
 * Les huit tableaux du document, sous une forme neutre (titres, en-têtes, lignes) partagée par l'export Excel et
 * le PDF. Les nombres restent des nombres ; le « non mesuré » de la vélocité reste lisible.
 */
export function sectionsDExport(s: PublicationTrimestrielle): SectionExport[] {
    const traitement = sectionDeLignes('Situation de traitement', 'Situation des dossiers', s.traitement);
    traitement.lignes.push(['Enjeux financiers perceptibles (FCFA)', s.enjeuxFinanciers, '']);
    return [
        sectionDeLignes('Catégories', 'Catégorie', s.categories),
        sectionDeLignes('Modes de saisine', 'Mode de saisine', s.modesDeSaisine),
        sectionDeLignes('Typologie institutionnelle', "Sphère / typologie d'entités", s.typologiesInstitutionnelles),
        sectionDeLignes('Allégations', 'Infraction', s.allegations),
        traitement,
        sectionDeLignes('Recevabilité', 'Statut de recevabilité', s.recevabilite),
        sectionDeLignes('Origine géographique', 'Zone géographique', s.originesGeographiques),
        {
            titre: 'Vélocité du traitement',
            entetes: ['Phase du circuit de traitement', 'Dossiers', 'Délai moyen estimé'],
            lignes: s.velocite.map(p => [p.libelle, p.nombre,
                p.delaiMoyenJours == null ? 'non mesuré' : `${virgule(p.delaiMoyenJours)} jours`])
        }
    ];
}

const texteSur = (v: string | number): string | number => typeof v === 'string' ? xlsxSafe(v) : v;

/** Classeur Excel : une feuille « Situation » (les tableaux à la suite, comme le document) et une feuille « Notes ». */
export async function creerClasseurExcel(s: PublicationTrimestrielle): Promise<FichierExporte> {
    const XLSX = await import('xlsx');
    const lignes: (string | number)[][] = [
        [TITRE_DU_DOCUMENT, s.periode],
        ['Total des dossiers enregistrés', s.total],
        []
    ];
    for (const section of sectionsDExport(s)) {
        lignes.push([section.titre], section.entetes, ...section.lignes.map(l => l.map(texteSur)), []);
    }
    const situation = XLSX.utils.aoa_to_sheet(lignes);
    situation['!cols'] = [{ wch: 64 }, { wch: 14 }, { wch: 20 }];
    const notes = XLSX.utils.aoa_to_sheet([
        ['Notes de lecture'],
        ...s.notes.map(n => [xlsxSafe(n)]),
        [],
        ['Généré le', new Date(s.genereLe).toLocaleString('fr-FR')]
    ]);
    notes['!cols'] = [{ wch: 120 }];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, situation, 'Situation');
    XLSX.utils.book_append_sheet(classeur, notes, 'Notes');
    const octets = new Uint8Array(XLSX.write(classeur, { type: 'array', bookType: 'xlsx' }));
    return { nom: nomDuFichier(s).replace(/\.csv$/, '.xlsx'), octets };
}

/** PDF A4 à l'identité de l'application : bandeau vert, un tableau par rubrique, notes de lecture en fin de document. */
export async function creerPdf(s: PublicationTrimestrielle): Promise<FichierExporte & { pages: number }> {
    const { default: JsPdf } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const VERT: [number, number, number] = [22, 163, 74];
    const doc = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const largeur = doc.internal.pageSize.getWidth();
    const basDePage = doc.internal.pageSize.getHeight() - 16;

    doc.setFillColor(...VERT);
    doc.rect(0, 0, largeur, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('ASCE-LC', 14, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${TITRE_DU_DOCUMENT} — ${s.periode}`, 14, 18);
    doc.setFontSize(8);
    doc.text(`${s.total} dossiers enregistrés`, 14, 24);
    doc.setTextColor(0, 0, 0);

    let y = 36;
    for (const section of sectionsDExport(s)) {
        if (y > basDePage - 30) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(section.titre, 14, y);
        autoTable(doc, {
            startY: y + 2,
            head: [section.entetes],
            body: section.lignes.map(l => l.map(c => typeof c !== 'number' ? c
                : String(l[0]).startsWith('Enjeux') ? montantFcfa(c) : nombreFr(c))),
            theme: 'striped',
            headStyles: { fillColor: VERT, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
            margin: { left: 14, right: 14 }
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
    }

    if (y > basDePage - 30) {
        doc.addPage();
        y = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes de lecture', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    y += 5;
    for (const note of s.notes) {
        const morceaux = doc.splitTextToSize('• ' + note, largeur - 28) as string[];
        if (y + morceaux.length * 4 > basDePage) {
            doc.addPage();
            y = 16;
        }
        doc.text(morceaux, 14, y);
        y += morceaux.length * 4 + 1;
    }

    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text(`Généré le ${new Date(s.genereLe).toLocaleDateString('fr-FR')} — page ${p}/${pages}`,
            largeur - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }
    return {
        nom: nomDuFichier(s).replace(/\.csv$/, '.pdf'),
        octets: new Uint8Array(doc.output('arraybuffer')),
        pages
    };
}

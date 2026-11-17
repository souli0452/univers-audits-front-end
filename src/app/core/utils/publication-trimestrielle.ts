import { LignePublication, PublicationTrimestrielle } from '../models/statistique.model';
import { xlsxSafe } from './xlsx-safe';

/** Dernier trimestre terminé : celui qu'on publie normalement (en mai, le T1 ; en janvier, le T4 de l'an dernier). */
export function trimestreARapporter(maintenant: Date): { annee: number; trimestre: number } {
    const courant = Math.floor(maintenant.getMonth() / 3) + 1;
    return courant === 1
        ? { annee: maintenant.getFullYear() - 1, trimestre: 4 }
        : { annee: maintenant.getFullYear(), trimestre: courant - 1 };
}

export function nomDuFichier(s: PublicationTrimestrielle): string {
    return `situation-plaintes-denonciations-${s.annee}-T${s.trimestre}.csv`;
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

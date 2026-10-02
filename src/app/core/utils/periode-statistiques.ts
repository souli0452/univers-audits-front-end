export type TypePeriode = 'year' | 'lastYear' | 'twoYears' | 'quarter' | 'month' | '30days' | 'custom';

export interface PeriodeStatistiques {
    debut: Date;
    fin: Date;
}

/** Début de journée, heure locale. */
function debutDeJour(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** Fin de journée, heure locale. */
function finDeJour(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Calcule l'intervalle de dates d'une période des statistiques.
 * Par défaut (« year ») : de janvier à aujourd'hui, année en cours.
 * « custom » : intervalle libre choisi par l'utilisateur, éventuellement à cheval sur plusieurs
 * années ; sans date de fin, c'est la seule journée de début. La fin ne dépasse jamais « maintenant »,
 * et les dates inversées sont remises dans l'ordre.
 * Renvoie null pour « custom » tant qu'aucune date de début n'est choisie.
 */
export function calculerPeriode(
    type: TypePeriode,
    maintenant: Date,
    plage?: (Date | null)[] | null
): PeriodeStatistiques | null {
    const annee = maintenant.getFullYear();

    switch (type) {
        case 'lastYear':
            return { debut: new Date(annee - 1, 0, 1), fin: finDeJour(new Date(annee - 1, 11, 31)) };
        case 'twoYears':
            return { debut: new Date(annee - 1, 0, 1), fin: maintenant };
        case 'quarter':
            return { debut: new Date(annee, Math.floor(maintenant.getMonth() / 3) * 3, 1), fin: maintenant };
        case 'month':
            return { debut: new Date(annee, maintenant.getMonth(), 1), fin: maintenant };
        case '30days':
            return { debut: new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000), fin: maintenant };
        case 'custom': {
            const [a, b] = plage ?? [];
            if (!a) return null;
            const [premier, second] = b && b < a ? [b, a] : [a, b ?? a];
            const fin = finDeJour(second);
            return { debut: debutDeJour(premier), fin: fin > maintenant ? maintenant : fin };
        }
        default:
            return { debut: new Date(annee, 0, 1), fin: maintenant };
    }
}

/** Libellé court d'un intervalle, par exemple « 01/01/2025 – 28/09/2026 ». */
export function libellePeriode(p: PeriodeStatistiques): string {
    const f = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${f(p.debut)} – ${f(p.fin)}`;
}

/**
 * Étiquette « CJ/initiales » d'un conseiller juridique (ex. « CJ/OR »), calculée à partir de son nom : aucune
 * liste n'est figée, qu'il y ait un, deux, trois conseillers ou davantage.
 */
export interface ConseillerJuridique {
    id: string;
    firstName?: string;
    lastName?: string;
    matricule?: string;
}

function premiereLettre(texte?: string): string {
    const sansAccent = (texte ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return sansAccent ? sansAccent.charAt(0).toUpperCase() : '';
}

export function initiales(prenom?: string, nom?: string): string {
    return premiereLettre(prenom) + premiereLettre(nom);
}

/**
 * Étiquette de chaque conseiller, par identifiant. Deux conseillers aux mêmes initiales se distinguent par un
 * numéro (CJ/AK, CJ/AK2...) : le premier inscrit (matricule, puis identifiant) garde l'étiquette simple, donc
 * l'arrivée d'un nouveau conseiller ne change jamais l'étiquette des autres.
 */
export function etiquettesCj(conseillers: ConseillerJuridique[]): Map<string, string> {
    const ordonnes = [...conseillers].sort((a, b) =>
        (a.matricule ?? '').localeCompare(b.matricule ?? '') || a.id.localeCompare(b.id));
    const dejaVues = new Map<string, number>();
    const etiquettes = new Map<string, string>();
    for (const c of ordonnes) {
        const sigle = initiales(c.firstName, c.lastName);
        const rang = (dejaVues.get(sigle) ?? 0) + 1;
        dejaVues.set(sigle, rang);
        etiquettes.set(c.id, 'CJ' + (sigle ? '/' + sigle : '') + (rang > 1 ? String(rang) : ''));
    }
    return etiquettes;
}

export function etiquetteDe(etiquettes: Map<string, string>, id?: string): string {
    return (id && etiquettes.get(id)) || '';
}

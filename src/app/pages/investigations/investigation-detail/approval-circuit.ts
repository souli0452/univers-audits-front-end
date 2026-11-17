/**
 * Circuit d'approbation du rapport d'enquête, dans l'ordre imposé par le serveur et par le workflow PGPD_GU V3 :
 * conseiller juridique (étape 21), chef du DEI (« C.DEI », étape 22), CGEA puis CGE (étape 23).
 */
export type EtapeCircuit = 'JURIDIQUE' | 'DEI' | 'CGEA' | 'CGE';

export interface EtatCircuit {
    status?: string;
    legalAdvisorApprovedAt?: string;
    deiApprovedAt?: string;
    cgeaApprovedAt?: string;
    cgeApprovedAt?: string;
}

/** Qui peut agir à chaque étape (l'administrateur garde tout). */
export const ROLES_PAR_ETAPE: Record<EtapeCircuit, string[]> = {
    JURIDIQUE: ['CONSEILLER_JURIDIQUE', 'ADMIN_DDIC'],
    DEI:       ['CHEF_DEI', 'ADMIN_DDIC'],
    CGEA:      ['CGEA', 'ADMIN_DDIC'],
    CGE:       ['CGE', 'ADMIN_DDIC']
};

/** Étape qui attend une décision, ou null si le rapport n'est pas soumis ou si le circuit est terminé. */
export function etapeEnAttente(inv: EtatCircuit): EtapeCircuit | null {
    if (inv.status !== 'COMPLETED' || inv.cgeApprovedAt) return null;
    if (!inv.legalAdvisorApprovedAt) return 'JURIDIQUE';
    if (!inv.deiApprovedAt) return 'DEI';
    if (!inv.cgeaApprovedAt) return 'CGEA';
    return 'CGE';
}

/** Le serveur offre un rejet motivé au DEI (renvoi au juridique) et au CGEA (renvoi au DEI) seulement. */
export function peutRejeter(etape: EtapeCircuit): boolean {
    return etape === 'DEI' || etape === 'CGEA';
}

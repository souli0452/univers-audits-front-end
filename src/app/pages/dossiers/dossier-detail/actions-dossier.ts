/**
 * L'action du moment dans le circuit d'un dossier : ce que l'agent connecté peut faire MAINTENANT, selon l'étape du
 * dossier et son rôle. Les droits sont ceux que l'écran appliquait déjà bouton par bouton ; ils sont réunis ici pour
 * n'afficher en évidence que l'action utile, le reste (documents, gestion) allant dans le menu « ⋯ ».
 */
export type ActionId = 'enregistrer' | 'demarrer-etude' | 'soumettre-ctadp' | 'demander-complement'
    | 'complement-recu' | 'declarer-recevable' | 'declarer-irrecevable' | 'cloturer';

export interface ActionPrincipale {
    id: ActionId;
    label: string;
    icon: string;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
}

const ACTIONS: Record<ActionId, ActionPrincipale> = {
    'enregistrer':          { id: 'enregistrer', label: 'Enregistrer le dossier', icon: 'pi pi-check', severity: 'success' },
    'demarrer-etude':       { id: 'demarrer-etude', label: "Démarrer l'étude d'opportunité", icon: 'pi pi-play', severity: 'success' },
    'soumettre-ctadp':      { id: 'soumettre-ctadp', label: 'Transmettre au CTADP', icon: 'pi pi-send', severity: 'success' },
    'demander-complement':  { id: 'demander-complement', label: 'Demander un complément', icon: 'pi pi-question-circle', severity: 'warn' },
    'complement-recu':      { id: 'complement-recu', label: 'Complément reçu : reprendre l\'étude', icon: 'pi pi-check-circle', severity: 'success' },
    'declarer-recevable':   { id: 'declarer-recevable', label: 'Déclarer recevable', icon: 'pi pi-check-circle', severity: 'success' },
    'declarer-irrecevable': { id: 'declarer-irrecevable', label: 'Déclarer irrecevable', icon: 'pi pi-times-circle', severity: 'danger' },
    'cloturer':             { id: 'cloturer', label: 'Clôturer le dossier', icon: 'pi pi-lock', severity: 'secondary' }
};

/** Actions du circuit proposées à cet agent, la voie principale d'abord. Vide si ce n'est pas à lui d'agir. */
export function actionsPrincipales(
    statut: string | undefined,
    peutEnregistrer: boolean,
    aRole: (roles: string[]) => boolean
): ActionPrincipale[] {
    const ids: ActionId[] = [];
    switch (statut) {
        case 'SOUMIS':
            if (peutEnregistrer) { ids.push('enregistrer'); }
            break;
        case 'RECU':
            if (aRole(['CONSEILLER_JURIDIQUE'])) { ids.push('demarrer-etude'); }
            break;
        case 'EN_ETUDE_OPPORTUNITE':
            if (aRole(['CONSEILLER_JURIDIQUE', 'CGEA'])) { ids.push('soumettre-ctadp'); }
            if (aRole(['CONSEILLER_JURIDIQUE'])) { ids.push('demander-complement'); }
            break;
        case 'EN_ATTENTE_COMPLEMENT':
            if (aRole(['CONSEILLER_JURIDIQUE', 'AGENT_BRPD'])) { ids.push('complement-recu'); }
            break;
        case 'EN_REVUE_CTADP':
            if (aRole(['CGE'])) { ids.push('declarer-recevable', 'declarer-irrecevable'); }
            break;
        case 'IRRECEVABLE':
            if (aRole(['CGE', 'CGEA'])) { ids.push('cloturer'); }
            break;
        case 'DECISION_RENDUE':
            if (aRole(['CGE', 'CGEA', 'ADMIN_DDIC'])) { ids.push('cloturer'); }
            break;
    }
    return ids.map(id => ACTIONS[id]);
}

/** Qui doit agir à cette étape, pour que l'agent qui n'a rien à faire sache qui s'en charge. Null hors circuit. */
export function attenteDe(statut: string | undefined): string | null {
    switch (statut) {
        case 'SOUMIS': return "L'agent BRPD enregistre le dossier et lui attribue un numéro.";
        case 'RECU': return "Le conseiller juridique démarre l'étude d'opportunité.";
        case 'EN_ETUDE_OPPORTUNITE': return "Le conseiller juridique étudie le dossier : il le transmet au CTADP ou demande un complément au déclarant.";
        case 'EN_ATTENTE_COMPLEMENT': return "En attente de la réponse du déclarant à la demande de complément.";
        case 'EN_REVUE_CTADP': return "Le CGE déclare le dossier recevable ou irrecevable, sur l'avis du CTADP.";
        case 'IRRECEVABLE': return "Le CGE ou le CGEA clôture le dossier après l'envoi de la réponse motivée.";
        case 'DECISION_RENDUE': return "Le CGE, le CGEA ou l'administrateur prononce la clôture du dossier après transmission de la décision aux autorités.";
        default: return null;
    }
}

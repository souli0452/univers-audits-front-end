import { Observable } from 'rxjs';
import { DossierResponse } from '../../../core/models/dossier.model';
import { DossierService } from '../../../core/services/dossier.service';
import { ActionId, libelleAction } from './actions-dossier';

/**
 * Transitions simples du circuit : une confirmation avec un motif facultatif, puis un appel au serveur avec la
 * version du dossier. Partagées par la page de détail et par la liste, pour qu'il n'y ait qu'une version des
 * textes et des appels. « Demander un complément » et « Transférer » demandent plus (message, institution) et
 * gardent leur propre fenêtre dans le détail.
 */
export type TypeTransition = 'register' | 'start-study' | 'complement-received' | 'submit-ctadp'
    | 'declare-admissible' | 'declare-inadmissible' | 'close';

export interface DemandeTransition { version: number; reason: string; }

export interface DefinitionTransition {
    titre: string;
    /** Statut dans lequel le dossier passe. */
    statutVise: string;
    /**
     * Vrai si l'application sait revenir en arrière. Le serveur ne va que vers l'avant (validateTransition) : aucune
     * transition du circuit ne peut être annulée, l'agent doit donc vérifier avant de confirmer.
     */
    annulable: boolean;
    /** Ce qui va se passer, affiché dans la fenêtre ; le statut du dossier précise le cas de la clôture. */
    message: (statut: string | undefined) => string;
    appel: (service: DossierService, id: string, demande: DemandeTransition) => Observable<DossierResponse>;
}

export const TRANSITIONS: Record<TypeTransition, DefinitionTransition> = {
    'register': {
        titre: libelleAction('enregistrer'),
        statutVise: 'RECU', annulable: false,
        message: () => 'Le dossier sera enregistré et un code de suivi attribué au déclarant.',
        appel: (s, id, d) => s.registerReception(id, d)
    },
    'start-study': {
        titre: libelleAction('demarrer-etude'),
        statutVise: 'EN_ETUDE_OPPORTUNITE', annulable: false,
        message: () => "L'étude d'opportunité sera lancée par le conseiller juridique.",
        appel: (s, id, d) => s.startOpportunityStudy(id, d)
    },
    'submit-ctadp': {
        titre: libelleAction('soumettre-ctadp'),
        statutVise: 'EN_REVUE_CTADP', annulable: false,
        message: () => "Le dossier sera transmis au Comité de Traitement et d'Analyse.",
        appel: (s, id, d) => s.submitToCtadp(id, d)
    },
    'complement-received': {
        titre: libelleAction('complement-recu'),
        statutVise: 'EN_ETUDE_OPPORTUNITE', annulable: false,
        message: () => "Le complément a été reçu. Le dossier reprendra son étude d'opportunité.",
        appel: (s, id, d) => s.complementReceived(id, d)
    },
    'declare-admissible': {
        titre: libelleAction('declarer-recevable'),
        statutVise: 'RECEVABLE', annulable: false,
        message: () => 'Le dossier sera déclaré recevable et une enquête pourra être ouverte.',
        appel: (s, id, d) => s.declareAdmissible(id, d)
    },
    'declare-inadmissible': {
        titre: libelleAction('declarer-irrecevable'),
        statutVise: 'IRRECEVABLE', annulable: false,
        message: () => 'Le CGEA adressera une réponse motivée au déclarant dans 3 jours ouvrables.',
        appel: (s, id, d) => s.declareInadmissible(id, d)
    },
    'close': {
        titre: libelleAction('cloturer'),
        statutVise: 'CLOS', annulable: false,
        message: statut => statut === 'DECISION_RENDUE'
            ? 'Clôture définitive après transmission aux autorités. Indiquez le motif.'
            : 'Le dossier sera clôturé et classé sans suite. Indiquez le motif.',
        appel: (s, id, d) => s.close(id, d)
    }
};

const LIBELLES_STATUT: Record<string, string> = {
    SOUMIS: 'Soumis', RECU: 'Reçu', EN_ETUDE_OPPORTUNITE: "En étude d'opportunité",
    EN_ATTENTE_COMPLEMENT: 'En attente de complément', EN_REVUE_CTADP: 'En revue CTADP',
    RECEVABLE: 'Recevable', IRRECEVABLE: 'Irrecevable', TRANSFERE: 'Transféré',
    EN_INVESTIGATION: 'En investigation', RAPPORT_PRODUIT: 'Rapport produit',
    DECISION_RENDUE: 'Décision rendue', CLOS: 'Clôturé', CLASSE: 'Classé'
};

/** Libellé complet d'un statut, tel qu'on le lit dans une phrase ; un statut inconnu est rendu tel quel. */
export function libelleStatut(statut: string | undefined | null): string {
    if (!statut) { return '—'; }
    return LIBELLES_STATUT[statut] ?? statut;
}

const TRANSITION_DE_L_ACTION: Partial<Record<ActionId, TypeTransition>> = {
    'enregistrer': 'register',
    'demarrer-etude': 'start-study',
    'soumettre-ctadp': 'submit-ctadp',
    'complement-recu': 'complement-received',
    'declarer-recevable': 'declare-admissible',
    'declarer-irrecevable': 'declare-inadmissible',
    'cloturer': 'close'
};

/** La transition simple d'une action, ou rien quand l'action demande son propre formulaire. */
export function transitionDeLAction(action: ActionId): TypeTransition | undefined {
    return TRANSITION_DE_L_ACTION[action];
}

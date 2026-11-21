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
    /** Ce qui va se passer, affiché dans la fenêtre ; le statut du dossier précise le cas de la clôture. */
    message: (statut: string | undefined) => string;
    appel: (service: DossierService, id: string, demande: DemandeTransition) => Observable<DossierResponse>;
}

export const TRANSITIONS: Record<TypeTransition, DefinitionTransition> = {
    'register': {
        titre: libelleAction('enregistrer'),
        message: () => 'Le dossier sera enregistré et un code de suivi attribué au déclarant.',
        appel: (s, id, d) => s.registerReception(id, d)
    },
    'start-study': {
        titre: libelleAction('demarrer-etude'),
        message: () => "L'étude d'opportunité sera lancée par le conseiller juridique.",
        appel: (s, id, d) => s.startOpportunityStudy(id, d)
    },
    'submit-ctadp': {
        titre: libelleAction('soumettre-ctadp'),
        message: () => "Le dossier sera transmis au Comité de Traitement et d'Analyse.",
        appel: (s, id, d) => s.submitToCtadp(id, d)
    },
    'complement-received': {
        titre: libelleAction('complement-recu'),
        message: () => "Le complément a été reçu. Le dossier reprendra son étude d'opportunité.",
        appel: (s, id, d) => s.complementReceived(id, d)
    },
    'declare-admissible': {
        titre: libelleAction('declarer-recevable'),
        message: () => 'Le dossier sera déclaré recevable et une enquête pourra être ouverte.',
        appel: (s, id, d) => s.declareAdmissible(id, d)
    },
    'declare-inadmissible': {
        titre: libelleAction('declarer-irrecevable'),
        message: () => 'Le CGEA adressera une réponse motivée au déclarant dans 3 jours ouvrables.',
        appel: (s, id, d) => s.declareInadmissible(id, d)
    },
    'close': {
        titre: libelleAction('cloturer'),
        message: statut => statut === 'DECISION_RENDUE'
            ? 'Clôture définitive après transmission aux autorités. Indiquez le motif.'
            : 'Le dossier sera clôturé et classé sans suite. Indiquez le motif.',
        appel: (s, id, d) => s.close(id, d)
    }
};

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

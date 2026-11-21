import { of } from 'rxjs';
import { ActionId, libelleAction } from './actions-dossier';
import { TRANSITIONS, TypeTransition, libelleStatut, transitionDeLAction } from './transitions-dossier';

describe("transitions du circuit : quelle action appelle quoi sur le serveur", () => {
    const SIMPLES: [ActionId, TypeTransition, string][] = [
        ['enregistrer', 'register', 'registerReception'],
        ['demarrer-etude', 'start-study', 'startOpportunityStudy'],
        ['soumettre-ctadp', 'submit-ctadp', 'submitToCtadp'],
        ['complement-recu', 'complement-received', 'complementReceived'],
        ['declarer-recevable', 'declare-admissible', 'declareAdmissible'],
        ['declarer-irrecevable', 'declare-inadmissible', 'declareInadmissible'],
        ['cloturer', 'close', 'close']
    ];

    for (const [action, type, methode] of SIMPLES) {
        it(`« ${action} » est une transition simple (${type}) qui appelle ${methode} avec la version et le motif`, () => {
            const service: any = { [methode]: jasmine.createSpy(methode).and.returnValue(of({ id: 'd1' })) };

            expect(transitionDeLAction(action)).toBe(type);
            TRANSITIONS[type].appel(service, 'd1', { version: 7, reason: 'parce que' });

            expect(service[methode]).toHaveBeenCalledOnceWith('d1', { version: 7, reason: 'parce que' });
        });
    }

    it('« Demander un complément » n\'est pas une transition simple : il demande un message au déclarant', () => {
        expect(transitionDeLAction('demander-complement')).toBeUndefined();
    });

    it('le titre de chaque fenêtre est le libellé du bouton qui l\'ouvre', () => {
        for (const [action, type] of SIMPLES) {
            expect(TRANSITIONS[type].titre).withContext(action).toBe(libelleAction(action));
        }
    });

    it('chaque fenêtre explique ce qui va se passer', () => {
        for (const [, type] of SIMPLES) {
            expect(TRANSITIONS[type].message(undefined).length).withContext(type).toBeGreaterThan(20);
        }
    });

    it('la clôture n\'a pas le même message après une décision rendue et après une irrecevabilité', () => {
        const apresDecision = TRANSITIONS['close'].message('DECISION_RENDUE');
        const apresIrrecevable = TRANSITIONS['close'].message('IRRECEVABLE');

        expect(apresDecision).toContain('autorités');
        expect(apresIrrecevable).toContain('sans suite');
    });

    it('chaque transition dit vers quel statut le dossier passe', () => {
        const attendu: Record<TypeTransition, string> = {
            'register': 'RECU', 'start-study': 'EN_ETUDE_OPPORTUNITE', 'submit-ctadp': 'EN_REVUE_CTADP',
            'complement-received': 'EN_ETUDE_OPPORTUNITE', 'declare-admissible': 'RECEVABLE',
            'declare-inadmissible': 'IRRECEVABLE', 'close': 'CLOS'
        };
        for (const [type, statut] of Object.entries(attendu)) {
            expect(TRANSITIONS[type as TypeTransition].statutVise).withContext(type).toBe(statut);
        }
    });

    it('aucune transition du circuit ne peut être annulée dans l\'application (le serveur ne va que vers l\'avant)', () => {
        for (const type of Object.keys(TRANSITIONS) as TypeTransition[]) {
            expect(TRANSITIONS[type].annulable).withContext(type).toBeFalse();
        }
    });

    it('chaque statut a un libellé complet, et un statut inconnu est rendu tel quel', () => {
        expect(libelleStatut('EN_REVUE_CTADP')).toBe('En revue CTADP');
        expect(libelleStatut('EN_ETUDE_OPPORTUNITE')).toBe("En étude d'opportunité");
        expect(libelleStatut('RECEVABLE')).toBe('Recevable');
        expect(libelleStatut('INCONNU')).toBe('INCONNU');
        expect(libelleStatut(undefined)).toBe('—');
    });
});

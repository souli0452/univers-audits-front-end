import { actionsPrincipales, attenteDe } from './actions-dossier';

/** Rôle de l'agent connecté, pour le test : vrai s'il a l'un des rôles demandés. */
const roles = (...mesRoles: string[]) => (demandes: string[]) => demandes.some(r => mesRoles.includes(r));
const ids = (statut: string, peutEnregistrer: boolean, ...mesRoles: string[]) =>
    actionsPrincipales(statut, peutEnregistrer, roles(...mesRoles)).map(a => a.id);

describe("actions du circuit : l'action du moment, selon l'étape et le rôle", () => {
    it('Soumis : enregistrer, pour qui en a le droit seulement', () => {
        expect(ids('SOUMIS', true, 'AGENT_BRPD')).toEqual(['enregistrer']);
        expect(ids('SOUMIS', false, 'CGE', 'CGEA')).toEqual([]);
    });

    it('Reçu : démarrer l\'étude, pour le conseiller juridique seul', () => {
        expect(ids('RECU', false, 'CONSEILLER_JURIDIQUE')).toEqual(['demarrer-etude']);
        expect(ids('RECU', false, 'AGENT_BRPD', 'CGE')).toEqual([]);
    });

    it('En étude : le conseiller juridique transmet ou demande un complément ; le CGEA peut seulement transmettre', () => {
        expect(ids('EN_ETUDE_OPPORTUNITE', false, 'CONSEILLER_JURIDIQUE')).toEqual(['soumettre-ctadp', 'demander-complement']);
        expect(ids('EN_ETUDE_OPPORTUNITE', false, 'CGEA')).toEqual(['soumettre-ctadp']);
        expect(ids('EN_ETUDE_OPPORTUNITE', false, 'CGE')).toEqual([]);
    });

    it('En attente de complément : le conseiller juridique ou l\'agent BRPD enregistre sa réception', () => {
        expect(ids('EN_ATTENTE_COMPLEMENT', false, 'CONSEILLER_JURIDIQUE')).toEqual(['complement-recu']);
        expect(ids('EN_ATTENTE_COMPLEMENT', false, 'AGENT_BRPD')).toEqual(['complement-recu']);
        expect(ids('EN_ATTENTE_COMPLEMENT', false, 'CGE')).toEqual([]);
    });

    it('En revue CTADP : seul le CGE déclare recevable ou irrecevable', () => {
        expect(ids('EN_REVUE_CTADP', false, 'CGE')).toEqual(['declarer-recevable', 'declarer-irrecevable']);
        expect(ids('EN_REVUE_CTADP', false, 'CGEA', 'CONSEILLER_JURIDIQUE')).toEqual([]);
    });

    it('Irrecevable : le CGE ou le CGEA clôture', () => {
        expect(ids('IRRECEVABLE', false, 'CGEA')).toEqual(['cloturer']);
        expect(ids('IRRECEVABLE', false, 'ADMIN_DDIC')).toEqual([]);
    });

    it('Décision rendue : le CGE, le CGEA ou l\'administrateur clôture', () => {
        for (const role of ['CGE', 'CGEA', 'ADMIN_DDIC']) {
            expect(ids('DECISION_RENDUE', false, role)).withContext(role).toEqual(['cloturer']);
        }
        expect(ids('DECISION_RENDUE', false, 'AGENT_BRPD')).toEqual([]);
    });

    it('aucune action du circuit pour les autres étapes ni sans dossier', () => {
        for (const statut of ['EN_INVESTIGATION', 'RAPPORT_PRODUIT', 'CLOS', 'TRANSFERE', 'RECEVABLE']) {
            expect(ids(statut, true, 'CGE', 'CGEA', 'CONSEILLER_JURIDIQUE', 'AGENT_BRPD', 'ADMIN_DDIC')).withContext(statut).toEqual([]);
        }
        expect(actionsPrincipales(undefined, true, roles('CGE'))).toEqual([]);
    });

    it('chaque action a un libellé clair, une icône et une couleur', () => {
        const toutes = ['SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE', 'EN_ATTENTE_COMPLEMENT', 'EN_REVUE_CTADP', 'IRRECEVABLE']
            .flatMap(s => actionsPrincipales(s, true, () => true));

        expect(toutes.length).toBe(8);
        expect(toutes.every(a => !!a.label && a.icon.startsWith('pi ') && !!a.severity)).toBeTrue();
        expect(new Set(toutes.map(a => a.id)).size).toBe(toutes.length);
    });

    it('les décisions qui engagent (irrecevable) sont en rouge, la voie normale en vert', () => {
        const parId = (id: string) => actionsPrincipales('EN_REVUE_CTADP', false, () => true).find(a => a.id === id)!;

        expect(parId('declarer-irrecevable').severity).toBe('danger');
        expect(parId('declarer-recevable').severity).toBe('success');
    });
});

describe("« en attente de… » : qui doit agir à chaque étape", () => {
    it('nomme l\'acteur du circuit pour chaque étape active', () => {
        expect(attenteDe('SOUMIS')).toContain('agent BRPD');
        expect(attenteDe('RECU')).toContain('conseiller juridique');
        expect(attenteDe('EN_ETUDE_OPPORTUNITE')).toContain('conseiller juridique');
        expect(attenteDe('EN_ATTENTE_COMPLEMENT')).toContain('déclarant');
        expect(attenteDe('EN_REVUE_CTADP')).toContain('CGE');
        expect(attenteDe('IRRECEVABLE')).toContain('CGE');
        expect(attenteDe('DECISION_RENDUE')).toContain('clôture');
    });

    it('ne dit rien des étapes que cet écran ne pilote pas', () => {
        for (const statut of ['EN_INVESTIGATION', 'RAPPORT_PRODUIT', 'CLOS', 'TRANSFERE', undefined]) {
            expect(attenteDe(statut as string | undefined)).toBeNull();
        }
    });
});

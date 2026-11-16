import { EtatCircuit, ROLES_PAR_ETAPE, etapeEnAttente, peutRejeter } from './approval-circuit';

describe('circuit d\'approbation du rapport (workflow PGPD_GU V3, étapes 21 à 23)', () => {
    const date = '2026-11-16T10:00:00Z';
    const rapportSoumis: EtatCircuit = { status: 'COMPLETED' };

    it('rien n\'est à approuver tant que le rapport n\'est pas soumis', () => {
        expect(etapeEnAttente({ status: 'IN_PROGRESS' })).toBeNull();
        expect(etapeEnAttente({})).toBeNull();
    });

    it('le conseiller juridique passe en premier', () => {
        expect(etapeEnAttente(rapportSoumis)).toBe('JURIDIQUE');
    });

    it('puis le chef du DEI', () => {
        expect(etapeEnAttente({ ...rapportSoumis, legalAdvisorApprovedAt: date })).toBe('DEI');
    });

    it('puis le CGEA', () => {
        expect(etapeEnAttente({ ...rapportSoumis, legalAdvisorApprovedAt: date, deiApprovedAt: date })).toBe('CGEA');
    });

    it('puis le CGE', () => {
        expect(etapeEnAttente({
            ...rapportSoumis, legalAdvisorApprovedAt: date, deiApprovedAt: date, cgeaApprovedAt: date
        })).toBe('CGE');
    });

    it('plus rien une fois la décision du CGE rendue', () => {
        expect(etapeEnAttente({
            status: 'ARCHIVED', legalAdvisorApprovedAt: date, deiApprovedAt: date, cgeaApprovedAt: date,
            cgeApprovedAt: date
        })).toBeNull();
    });

    it('un rejet du CGEA renvoie le rapport au chef du DEI', () => {
        // le serveur efface l'approbation DEI : l'étape en attente redevient « DEI »
        expect(etapeEnAttente({ ...rapportSoumis, legalAdvisorApprovedAt: date })).toBe('DEI');
    });

    it('chaque étape est réservée à son rôle, plus l\'administrateur', () => {
        expect(ROLES_PAR_ETAPE.JURIDIQUE).toEqual(['CONSEILLER_JURIDIQUE', 'ADMIN_DDIC']);
        expect(ROLES_PAR_ETAPE.DEI).toEqual(['CHEF_DEI', 'ADMIN_DDIC']);
        expect(ROLES_PAR_ETAPE.CGEA).toEqual(['CGEA', 'ADMIN_DDIC']);
        expect(ROLES_PAR_ETAPE.CGE).toEqual(['CGE', 'ADMIN_DDIC']);
    });

    it('seuls le DEI et le CGEA peuvent rejeter (le serveur n\'offre pas d\'autre rejet)', () => {
        expect(peutRejeter('DEI')).toBeTrue();
        expect(peutRejeter('CGEA')).toBeTrue();
        expect(peutRejeter('JURIDIQUE')).toBeFalse();
        expect(peutRejeter('CGE')).toBeFalse();
    });
});

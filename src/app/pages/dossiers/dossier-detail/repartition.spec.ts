import { agentsDuDepartement } from './repartition';

describe('répartition d\'un dossier par le chef de département', () => {
    const agents = [
        { id: '1', departementId: 'dei' },
        { id: '2', departementId: 'dac' },
        { id: '3', departementId: 'dei' },
        { id: '4' }
    ];

    it('ne propose que les agents du département désigné', () => {
        expect(agentsDuDepartement(agents, 'dei').map(a => a.id)).toEqual(['1', '3']);
    });

    it('ne propose personne si le département est inconnu', () => {
        expect(agentsDuDepartement(agents, undefined)).toEqual([]);
        expect(agentsDuDepartement(agents, 'drh')).toEqual([]);
    });

    it('ignore les agents sans département', () => {
        expect(agentsDuDepartement(agents, 'dei').some(a => a.id === '4')).toBeFalse();
    });
});

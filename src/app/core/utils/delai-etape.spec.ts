import { DelaiEtapeResponse } from '../models/dossier.model';
import { classeEtatDelai, formaterDuree, libelleEtatDelai } from './delai-etape';

const etape = (statut: DelaiEtapeResponse['statut'], heuresRestantes?: number): DelaiEtapeResponse => ({
    code: 'ETAPE_TEST', libelle: 'Étape', acteur: 'CGEA',
    debut: '2026-10-05T14:00:00Z', echeance: '2026-10-08T14:00:00Z',
    delaiJours: 3, joursOuvrables: true, statut, heuresRestantes
});

describe('formaterDuree', () => {
    it('affiche des heures sous 24 h', () => expect(formaterDuree(6)).toBe('6 h'));
    it('affiche jours et heures', () => expect(formaterDuree(52)).toBe('2 j 4 h'));
    it('affiche des jours entiers', () => expect(formaterDuree(48)).toBe('2 j'));
    it('ignore le signe', () => expect(formaterDuree(-30)).toBe('1 j 6 h'));
    it('gère moins d\'une heure', () => expect(formaterDuree(0)).toBe("moins d'1 h"));
});

describe('libelleEtatDelai', () => {
    it('étape en cours : temps restant', () => expect(libelleEtatDelai(etape('EN_COURS', 52))).toBe('Reste 2 j 4 h'));
    it('étape proche : temps restant', () => expect(libelleEtatDelai(etape('PROCHE', 6))).toBe('Reste 6 h'));
    it('étape dépassée : retard', () => expect(libelleEtatDelai(etape('DEPASSE', -24))).toBe('En retard de 1 j'));
    it('étape terminée dans le délai', () => expect(libelleEtatDelai(etape('RESPECTE'))).toBe('Dans le délai'));
    it('étape terminée en retard', () => expect(libelleEtatDelai(etape('TERMINE_EN_RETARD'))).toBe('Terminé en retard'));
});

describe('classeEtatDelai', () => {
    it('rouge pour un dépassement', () => expect(classeEtatDelai('DEPASSE')).toContain('red'));
    it('vert pour une étape respectée', () => expect(classeEtatDelai('RESPECTE')).toContain('green'));
});

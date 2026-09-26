import { environment } from './environment.prod';

/**
 * La CSP de la page (`connect-src 'self'`) n'autorise que l'origine du site. En production le back
 * (/api) et Keycloak (/auth) sont derrière le même nginx, sous le même nom de domaine que la page :
 * on les adresse donc par rapport à l'origine courante, quel que soit le nom de domaine servi
 * (ged.asce-lc.bf, denoncer.asce-lc.bf...). Une adresse écrite en dur vers un autre domaine est
 * bloquée par la CSP : la page s'affiche mais ne peut plus rien charger ni envoyer.
 */
describe('environment.prod', () => {
    it('adresse l’API sur l’origine de la page', () => {
        expect(environment.apiUrl).toBe(window.location.origin + '/api/v1');
    });

    it('adresse Keycloak sur l’origine de la page', () => {
        expect(environment.keycloak.url).toBe(window.location.origin + '/auth');
    });

    it('reste une configuration de production, avec le bon royaume et le bon client', () => {
        expect(environment.production).toBeTrue();
        expect(environment.keycloak.realm).toBe('asce-lc');
        expect(environment.keycloak.clientId).toBe('asce-lc-frontend');
    });

    it('n’écrit en dur aucun nom de domaine', () => {
        expect(JSON.stringify(environment)).not.toMatch(/asce-lc\.bf/);
    });
});

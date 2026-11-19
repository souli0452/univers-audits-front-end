import { TestBed } from '@angular/core/testing';
import { KeycloakService } from './keycloak.service';

describe('KeycloakService — déconnexion', () => {
    let service: KeycloakService;
    let keycloak: { logout: jasmine.Spy; login: jasmine.Spy };

    beforeEach(() => {
        service = TestBed.inject(KeycloakService);
        keycloak = { logout: jasmine.createSpy('logout'), login: jasmine.createSpy('login') };
        (service as unknown as { keycloak: unknown }).keycloak = keycloak;
    });

    it('renvoie vers l\'application après la déconnexion : la garde d\'accès affiche alors la page de connexion', () => {
        service.logout();

        expect(keycloak.logout).toHaveBeenCalledOnceWith({ redirectUri: window.location.origin + '/#/app' });
    });

    it('ne renvoie pas vers l\'accueil public du portail', () => {
        service.logout();

        expect(JSON.stringify(keycloak.logout.calls.mostRecent().args)).not.toContain('/#/portail');
    });
});

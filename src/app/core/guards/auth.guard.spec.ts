import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { dcpSeulGuard, urlAutoriseePourDcpSeul } from './auth.guard';
import { KeycloakService } from '../auth/keycloak.service';

describe('urlAutoriseePourDcpSeul', () => {
    it('autorise les statistiques, le profil et les notifications', () => {
        expect(urlAutoriseePourDcpSeul('/app/statistiques')).toBeTrue();
        expect(urlAutoriseePourDcpSeul('/app/statistiques?annee=2026')).toBeTrue();
        expect(urlAutoriseePourDcpSeul('/app/profil')).toBeTrue();
        expect(urlAutoriseePourDcpSeul('/app/notifications')).toBeTrue();
    });

    it('refuse les dossiers, le tableau de bord et les dépassements par acteur', () => {
        expect(urlAutoriseePourDcpSeul('/app')).toBeFalse();
        expect(urlAutoriseePourDcpSeul('/app/dossiers')).toBeFalse();
        expect(urlAutoriseePourDcpSeul('/app/investigations/abc')).toBeFalse();
        expect(urlAutoriseePourDcpSeul('/app/statistiques/depassements-par-acteur')).toBeFalse();
    });
});

describe('dcpSeulGuard', () => {
    let dcpSeul: boolean;

    const run = (url: string) =>
        TestBed.runInInjectionContext(() => dcpSeulGuard({} as any, { url } as any));

    beforeEach(() => {
        dcpSeul = false;
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: KeycloakService, useValue: { estDcpSeul: () => dcpSeul } }
            ]
        });
    });

    it('laisse passer un agent qui n\'est pas DCP seul', () => {
        expect(run('/app/dossiers')).toBeTrue();
    });

    it('renvoie un agent DCP seul vers les statistiques', () => {
        dcpSeul = true;
        const resultat = run('/app/dossiers') as UrlTree;
        expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/app/statistiques');
    });

    it('laisse un agent DCP seul ouvrir les statistiques', () => {
        dcpSeul = true;
        expect(run('/app/statistiques')).toBeTrue();
    });
});

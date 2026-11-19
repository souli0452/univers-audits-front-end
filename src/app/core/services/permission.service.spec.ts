import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
    let service: PermissionService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(PermissionService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('refuse tout tant que les droits ne sont pas chargés', () => {
        expect(service.a('DOSSIER_ENREGISTRER')).toBeFalse();
    });

    it('lit les droits de l\'utilisateur connecté sur la route du serveur', () => {
        service.charger().subscribe();

        const requete = http.expectOne(r => r.url.endsWith('/auth/permissions'));
        expect(requete.request.method).toBe('GET');
        requete.flush({ permissions: ['DOSSIER_ENREGISTRER', 'PIECE_JOINTE_VOIR'] });

        expect(service.a('DOSSIER_ENREGISTRER')).toBeTrue();
        expect(service.a('PIECE_JOINTE_VOIR')).toBeTrue();
        expect(service.a('PIECE_JOINTE_TELECHARGER')).toBeFalse();
    });

    it('ne recharge pas les droits à chaque écran', () => {
        service.charger().subscribe();
        http.expectOne(r => r.url.endsWith('/auth/permissions')).flush({ permissions: ['X'] });

        service.charger().subscribe();

        http.expectNone(r => r.url.endsWith('/auth/permissions'));
    });

    it('en cas de panne, n\'accorde rien plutôt que tout, et réessaiera au prochain écran', () => {
        service.charger().subscribe();
        http.expectOne(r => r.url.endsWith('/auth/permissions')).flush('panne', { status: 500, statusText: 'KO' });

        expect(service.a('DOSSIER_ENREGISTRER')).toBeFalse();

        service.charger().subscribe();
        http.expectOne(r => r.url.endsWith('/auth/permissions')).flush({ permissions: ['DOSSIER_ENREGISTRER'] });
        expect(service.a('DOSSIER_ENREGISTRER')).toBeTrue();
    });

    it('oublie les droits à la déconnexion', () => {
        service.charger().subscribe();
        http.expectOne(r => r.url.endsWith('/auth/permissions')).flush({ permissions: ['X'] });

        service.oublier();

        expect(service.a('X')).toBeFalse();
    });
});

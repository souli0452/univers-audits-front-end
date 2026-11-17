import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GeographieService } from './geographie.service';
import { SKIP_AUTH } from '../interceptors/skip-auth.context';
import { Geographie } from '../models/geographie.model';

const arbre: Geographie = { code: 'BF', libelle: 'Burkina Faso', regions: [] };

describe('GeographieService', () => {
    let service: GeographieService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(GeographieService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('charge le référentiel sur la route publique, sans jeton', () => {
        let recu: Geographie | undefined;
        service.getArbre().subscribe(a => recu = a);

        const requete = http.expectOne(r => r.url.endsWith('/public/geographie'));
        expect(requete.request.method).toBe('GET');
        expect(requete.request.context.get(SKIP_AUTH)).toBeTrue();
        requete.flush(arbre);

        expect(recu).toEqual(arbre);
    });

    it('ne le charge qu\'une fois, même demandé plusieurs fois (liste de 350 communes)', () => {
        service.getArbre().subscribe();
        service.getArbre().subscribe();
        http.expectOne(r => r.url.endsWith('/public/geographie')).flush(arbre);

        let relu: Geographie | undefined;
        service.getArbre().subscribe(a => relu = a);

        http.expectNone(r => r.url.endsWith('/public/geographie'));
        expect(relu).toEqual(arbre);
    });

    it('réessaie à la demande suivante après une panne au lieu de garder l\'erreur', () => {
        service.getArbre().subscribe({ error: () => undefined });
        http.expectOne(r => r.url.endsWith('/public/geographie')).flush('panne', { status: 500, statusText: 'KO' });

        service.getArbre().subscribe();

        http.expectOne(r => r.url.endsWith('/public/geographie')).flush(arbre);
    });
});

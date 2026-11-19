import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierService } from './dossier.service';

describe('DossierService.update', () => {
    let service: DossierService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(DossierService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('modifie le dossier avec sa version, pour que deux agents ne s\'écrasent pas', () => {
        service.update('d1', { version: 4, object: 'Objet complété', natureSaisineChoisie: 'PLAINTE' }).subscribe();

        const requete = http.expectOne(r => r.url.endsWith('/dossiers/d1'));
        expect(requete.request.method).toBe('PUT');
        expect(requete.request.body).toEqual({ version: 4, object: 'Objet complété', natureSaisineChoisie: 'PLAINTE' });
        requete.flush({ id: 'd1', version: 5 });
    });
});

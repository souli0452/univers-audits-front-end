import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PdfService } from './pdf.service';

describe('PdfService — convocation CTADP', () => {
    let service: PdfService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(PdfService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('demande la convocation de la séance en fichier', () => {
        service.downloadConvocationCtadp('s-1').subscribe();

        const req = http.expectOne(r => r.url.endsWith('/pdf/convocation-ctadp/s-1'));
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('blob');
        req.flush(new Blob(['%PDF-']));
    });

    it('lit le message du back dans un corps d\'erreur de type fichier', async () => {
        const corps = new Blob([JSON.stringify({ message: 'Ajoutez au moins un dossier' })], { type: 'application/json' });

        expect(await service.messageErreur({ error: corps }, 'défaut')).toBe('Ajoutez au moins un dossier');
    });

    it('retombe sur le message par défaut si le corps est illisible', async () => {
        expect(await service.messageErreur({ error: new Blob(['pas du json']) }, 'défaut')).toBe('défaut');
        expect(await service.messageErreur(null, 'défaut')).toBe('défaut');
    });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierService } from './dossier.service';
import { SKIP_AUTH } from '../interceptors/skip-auth.context';

describe('DossierService — complément public', () => {
    let service: DossierService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(DossierService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('getComplementRequest lit la demande sans jeton', () => {
        let reponse: any;
        service.getComplementRequest('ABCD1234').subscribe(r => (reponse = r));

        const req = http.expectOne(r => r.url.endsWith('/dossiers/public/complement/ABCD1234'));
        expect(req.request.method).toBe('GET');
        expect(req.request.context.get(SKIP_AUTH)).toBeTrue();
        req.flush({ status: 'EN_ATTENTE_COMPLEMENT', motif: 'Justificatifs', requestedAt: '2026-09-20T09:00:00Z', deadline: null, overdue: false });

        expect(reponse.motif).toBe('Justificatifs');
    });

    it('getComplementRequest encode le code de suivi dans l’adresse', () => {
        service.getComplementRequest('A B/1').subscribe();

        const req = http.expectOne(r => r.url.includes('/dossiers/public/complement/'));
        expect(req.request.url).toContain('/dossiers/public/complement/A%20B%2F1');
        req.flush({});
    });

    it('submitComplement envoie le message et les fichiers en multipart, sans jeton', () => {
        const preuve = new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' });
        const photo = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
        let reponse: any;

        service.submitComplement('ABCD1234', 'Voici mes justificatifs', [preuve, photo]).subscribe(r => (reponse = r));

        const req = http.expectOne(r => r.url.endsWith('/dossiers/public/complement/ABCD1234'));
        expect(req.request.method).toBe('POST');
        expect(req.request.context.get(SKIP_AUTH)).toBeTrue();
        const body = req.request.body as FormData;
        expect(body.get('message')).toBe('Voici mes justificatifs');
        expect(body.getAll('files').length).toBe(2);
        req.flush({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 2 });

        expect(reponse.filesUploaded).toBe(2);
    });

    it('submitComplement sans fichier n’envoie que le message', () => {
        service.submitComplement('ABCD1234', 'Message seul', []).subscribe();

        const req = http.expectOne(r => r.url.endsWith('/dossiers/public/complement/ABCD1234'));
        const body = req.request.body as FormData;
        expect(body.get('message')).toBe('Message seul');
        expect(body.getAll('files').length).toBe(0);
        req.flush({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 0 });
    });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AttachmentService } from './attachment.service';

describe('AttachmentService.upload', () => {
    let service: AttachmentService;
    let http: HttpTestingController;
    const fichier = new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' });

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(AttachmentService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('joint le code de suivi (accessCode) aux fichiers : le back l’exige sur un dossier SOUMIS ou EN_ATTENTE_COMPLEMENT', () => {
        service.upload('d1', [fichier], true, 'ABCD1234').subscribe();

        const req = http.expectOne(r => r.url.endsWith('/attachments/dossier/d1'));
        const body = req.request.body as FormData;
        expect(body.get('accessCode')).toBe('ABCD1234');
        expect(body.getAll('files').length).toBe(1);
        req.flush({ uploaded: 1, files: [] });
    });

    it('n’ajoute aucun champ accessCode quand il n’est pas fourni (agent connecté sur un dossier avancé)', () => {
        service.upload('d1', [fichier]).subscribe();

        const req = http.expectOne(r => r.url.endsWith('/attachments/dossier/d1'));
        expect((req.request.body as FormData).has('accessCode')).toBeFalse();
        req.flush({ uploaded: 1, files: [] });
    });
});

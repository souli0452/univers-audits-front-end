import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DossierAudio } from './dossier-audio';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

describe('DossierAudio', () => {
    let fixture: ComponentFixture<DossierAudio>;
    let component: DossierAudio;
    let dossierService: { create: jasmine.Spy };
    let attachmentService: { upload: jasmine.Spy; uploadAudio: jasmine.Spy };

    beforeEach(() => {
        dossierService = { create: jasmine.createSpy('create').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' })) };
        attachmentService = { upload: jasmine.createSpy('upload').and.returnValue(of({})), uploadAudio: jasmine.createSpy('uploadAudio').and.returnValue(of({})) };

        TestBed.configureTestingModule({
            imports: [DossierAudio],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: DossierService, useValue: dossierService },
                { provide: AttachmentService, useValue: attachmentService }
            ]
        });
        fixture = TestBed.createComponent(DossierAudio);
        component = fixture.componentInstance;
        component.audioBlob = new Blob(['audio'], { type: 'audio/webm' });
        component.dossierForm.patchValue({
            object: 'Témoignage guichet de test',
            description: 'Faits fictifs de recette'
        });
        component.fd['commune'].setValue('Ouagadougou');
        component.fd['firstName'].setValue('Awa');
        component.fd['lastName'].setValue('Traoré');
        component.fd['phoneNumber'].setValue('+226 70 00 00 00');
        component.fd['dataProcessingConsent'].setValue(true);
    });

    it('n’envoie aucune donnée d’identité (commune comprise) pour le type « Anonyme »', () => {
        component.f['type'].setValue('ANONYMOUS');

        component.createDossier();

        const request = dossierService.create.calls.mostRecent().args[0];
        expect(request.anonymous).toBeTrue();
        expect(request.type).toBe('DENUNCIATION');
        expect(request.declarantData.typeDeclarant).toBe('ANONYMOUS');
        for (const champ of ['firstName', 'lastName', 'phoneNumber', 'commune']) {
            expect(request.declarantData[champ]).withContext(champ).toBeUndefined();
        }
    });

    it('joint l’audio avec le code de suivi du dossier créé (le dossier est encore SOUMIS, le back exige le code)', () => {
        component.f['type'].setValue('DENUNCIATION');

        component.createDossier();

        const [dossierId, files, anonymous, accessCode] = attachmentService.upload.calls.mostRecent().args;
        expect(dossierId).toBe('d1');
        expect(files.length).toBe(1);
        expect(anonymous).toBeFalsy();
        expect(accessCode).toBe('ABCD1234');
    });

    it('envoie les coordonnées saisies pour un dépôt identifié', () => {
        component.f['type'].setValue('DENUNCIATION');

        component.createDossier();

        const request = dossierService.create.calls.mostRecent().args[0];
        expect(request.anonymous).toBeFalse();
        expect(request.declarantData.firstName).toBe('Awa');
        expect(request.declarantData.commune).toBe('Ouagadougou');
    });
});

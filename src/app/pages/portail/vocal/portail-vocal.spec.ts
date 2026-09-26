import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PortailVocal } from './portail-vocal';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

describe('PortailVocal — dépôt vocal', () => {
    let fixture: ComponentFixture<PortailVocal>;
    let component: PortailVocal;
    let dossierService: { submit: jasmine.Spy };
    let attachmentService: { upload: jasmine.Spy };

    beforeEach(() => {
        dossierService = { submit: jasmine.createSpy('submit').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' })) };
        attachmentService = { upload: jasmine.createSpy('upload').and.returnValue(of({})) };
        TestBed.configureTestingModule({
            imports: [PortailVocal],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: DossierService, useValue: dossierService },
                { provide: AttachmentService, useValue: attachmentService }
            ]
        });
        fixture = TestBed.createComponent(PortailVocal);
        component = fixture.componentInstance;
        component.audioBlob = new Blob(['audio'], { type: 'audio/webm' });
    });

    it('envoie l’audio avec le code de suivi du dossier créé (sans quoi le back refuse la pièce)', () => {
        component.submit();

        expect(attachmentService.upload).toHaveBeenCalledTimes(1);
        const [dossierId, files, anonymous, accessCode] = attachmentService.upload.calls.mostRecent().args;
        expect(dossierId).toBe('d1');
        expect(files.length).toBe(1);
        expect(files[0].name).toContain('temoignage_vocal_');
        expect(anonymous).toBeTrue();
        expect(accessCode).toBe('ABCD1234');
        expect(component.showSuccess).toBeTrue();
    });
});

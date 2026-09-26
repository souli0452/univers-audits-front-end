import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { DepotPlainte } from './depot-plainte';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

describe('DepotPlainte', () => {
    let fixture: ComponentFixture<DepotPlainte>;
    let component: DepotPlainte;
    let messages: MessageService;
    let dossierService: { submit: jasmine.Spy };
    let attachmentService: { upload: jasmine.Spy };

    beforeEach(() => {
        dossierService = { submit: jasmine.createSpy('submit').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' })) };
        attachmentService = { upload: jasmine.createSpy('upload').and.returnValue(of({})) };

        TestBed.configureTestingModule({
            imports: [DepotPlainte],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: DossierService, useValue: dossierService },
                { provide: AttachmentService, useValue: attachmentService }
            ]
        });
        fixture = TestBed.createComponent(DepotPlainte);
        component = fixture.componentInstance;
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
    });

    describe('étape « Coordonnées »', () => {
        beforeEach(() => {
            component.currentStep = 2;
            component.fd['dataProcessingConsent'].setValue(true);
        });

        it('refuse de passer à la confirmation avec un e-mail invalide', () => {
            component.fd['email'].setValue('pas-un-email');

            component.goToStep3();

            expect(component.currentStep).toBe(2);
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn', summary: 'E-mail invalide' }));
        });

        it('accepte un e-mail valide', () => {
            component.fd['email'].setValue('recette@example.com');

            component.goToStep3();

            expect(component.currentStep).toBe(3);
        });

        it('accepte un e-mail vide (champ optionnel)', () => {
            component.fd['email'].setValue('');

            component.goToStep3();

            expect(component.currentStep).toBe(3);
        });
    });

    describe('soumission', () => {
        it('avertit quand l’envoi des pièces jointes échoue, sans masquer que le dossier est créé', () => {
            attachmentService.upload.and.returnValue(throwError(() => new Error('upload KO')));
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            expect(component.showSuccess).toBeTrue();
            expect(component.createdAccessCode).toBe('ABCD1234');
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
                severity: 'warn', summary: 'Dossier créé'
            }));
        });

        it('n’envoie aucune donnée d’identité quand l’utilisateur choisit l’anonymat après les avoir saisies', () => {
            component.fd['organizationName'].setValue('Société Test');
            component.fd['firstName'].setValue('Awa');
            component.fd['lastName'].setValue('Traoré');
            component.fd['email'].setValue('awa@example.com');
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.fd['commune'].setValue('Ouagadougou');
            component.fd['province'].setValue('Kadiogo');

            component.setAnonymous();
            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.anonymous).toBeTrue();
            expect(request.declarantData.typeDeclarant).toBe('ANONYMOUS');
            for (const champ of ['organizationName', 'firstName', 'lastName', 'email', 'phoneNumber', 'commune', 'province']) {
                expect(request.declarantData[champ]).withContext(champ).toBeUndefined();
            }
        });

        it('envoie les coordonnées saisies quand le dépôt n’est pas anonyme', () => {
            component.fd['firstName'].setValue('Awa');
            component.fd['email'].setValue('awa@example.com');

            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.anonymous).toBeFalse();
            expect(request.declarantData.firstName).toBe('Awa');
            expect(request.declarantData.email).toBe('awa@example.com');
        });

        it('envoie les pièces jointes avec le code de suivi du dossier créé (sans quoi le back refuse la pièce)', () => {
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            const [dossierId, files, anonymous, accessCode] = attachmentService.upload.calls.mostRecent().args;
            expect(dossierId).toBe('d1');
            expect(files.length).toBe(1);
            expect(anonymous).toBeTrue();
            expect(accessCode).toBe('ABCD1234');
        });

        it('n’affiche aucun avertissement quand les pièces jointes sont bien envoyées', () => {
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            expect(component.showSuccess).toBeTrue();
            expect(messages.add).not.toHaveBeenCalled();
        });
    });
});

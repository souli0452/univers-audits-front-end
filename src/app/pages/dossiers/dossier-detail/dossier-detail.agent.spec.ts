import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { DossierDetail } from './dossier-detail';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { PermissionService } from '../../../core/services/permission.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('DossierDetail — ce que l\'agent peut faire, selon ses droits', () => {
    let component: DossierDetail;
    let messages: MessageService;
    let droits: string[];
    let attachmentService: { telecharger: jasmine.Spy };

    const dossier = (status: string, surcharge: any = {}) =>
        ({ id: 'd1', version: 4, status, object: 'Objet', type: 'DENONCIATION', ...surcharge }) as any;

    beforeEach(() => {
        droits = [];
        attachmentService = { telecharger: jasmine.createSpy('telecharger').and.returnValue(of(new Blob(['x']))) };
        TestBed.configureTestingModule({
            imports: [DossierDetail],
            providers: [
                provideRouter([]), provideHttpClient(), provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
                { provide: DossierService, useValue: {} },
                { provide: AttachmentService, useValue: attachmentService },
                { provide: PermissionService, useValue: { a: (p: string) => droits.includes(p), charger: () => of(undefined) } },
                { provide: KeycloakService, useValue: { hasAnyRole: () => false } }
            ]
        });
        const fixture: ComponentFixture<DossierDetail> = TestBed.createComponent(DossierDetail);
        component = fixture.componentInstance;
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
    });

    describe('enregistrer le dossier', () => {
        it('est proposé à qui a le droit d\'enregistrer, quel que soit son rôle (BRPD, mais aussi CGEA ou CGE en suppléance)', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            component.dossier = dossier('SOUMIS');

            expect(component.peutEnregistrer()).toBeTrue();
        });

        it('n\'est pas proposé sans le droit', () => {
            component.dossier = dossier('SOUMIS');

            expect(component.peutEnregistrer()).toBeFalse();
        });

        it('n\'est proposé que pour un dossier « Soumis »', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            for (const statut of ['RECU', 'EN_ETUDE_OPPORTUNITE', 'CLOS']) {
                component.dossier = dossier(statut);
                expect(component.peutEnregistrer()).withContext(statut).toBeFalse();
            }
        });
    });

    describe('compléter la fiche', () => {
        it('est ouvert, avec le droit de modifier, avant le début de l\'étude (Soumis ou Reçu)', () => {
            droits = ['DOSSIER_MODIFIER'];
            for (const statut of ['SOUMIS', 'RECU']) {
                component.dossier = dossier(statut);
                expect(component.peutCompleter()).withContext(statut).toBeTrue();
            }
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE');
            expect(component.peutCompleter()).toBeFalse();
        });

        it('est fermé sans le droit de modifier', () => {
            component.dossier = dossier('SOUMIS');

            expect(component.peutCompleter()).toBeFalse();
        });

        it('fournit au panneau les enregistrements audio du dossier, déjà chargés', () => {
            component.attachments = [
                { id: 'a1', originalName: 'temoignage_vocal.webm', mimeType: 'audio/webm' } as any,
                { id: 'a2', originalName: 'preuve.pdf', mimeType: 'application/pdf' } as any
            ];
            (component as any).attachmentBlobs = { a1: 'blob:audio', a2: 'blob:pdf' };

            expect(component.audiosDuDossier()).toEqual([{ id: 'a1', nom: 'temoignage_vocal.webm', url: 'blob:audio' }]);
        });
    });

    describe('télécharger une pièce jointe', () => {
        it('n\'est proposé qu\'avec le droit de télécharger', () => {
            expect(component.peutTelecharger()).toBeFalse();
            droits = ['PIECE_JOINTE_TELECHARGER'];
            expect(component.peutTelecharger()).toBeTrue();
        });

        it('passe par le serveur, qui trace le téléchargement, puis enregistre le fichier', () => {
            const enregistrer = spyOn(component as any, 'enregistrerFichier');

            component.telecharger({ id: 'a1', originalName: 'preuve.pdf' } as any);

            expect(attachmentService.telecharger).toHaveBeenCalledWith('a1');
            expect(enregistrer).toHaveBeenCalledWith(jasmine.any(Blob), 'preuve.pdf');
        });

        it('explique un refus du serveur sans rien enregistrer', () => {
            attachmentService.telecharger.and.returnValue(throwError(() => ({ status: 403 })));
            const enregistrer = spyOn(component as any, 'enregistrerFichier');

            component.telecharger({ id: 'a1', originalName: 'preuve.pdf' } as any);

            expect(enregistrer).not.toHaveBeenCalled();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
        });
    });

    describe('prochaine étape', () => {
        it('dit à qui peut enregistrer ce qu\'il doit faire', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            component.dossier = dossier('SOUMIS');

            expect(component.etapeSuivante()).toContain('Enregistrer');
        });

        it('dit à qui ne le peut pas qui s\'en charge, au lieu de laisser un écran muet', () => {
            component.dossier = dossier('SOUMIS');

            const t = component.etapeSuivante()!;
            expect(t).toContain('agent BRPD');
            expect(t).toContain('numéro');
        });

        it('annonce l\'étude d\'opportunité pour un dossier reçu', () => {
            component.dossier = dossier('RECU');

            expect(component.etapeSuivante()).toContain('conseiller juridique');
        });

        it('ne dit rien pour les étapes plus avancées', () => {
            component.dossier = dossier('EN_INVESTIGATION');

            expect(component.etapeSuivante()).toBeNull();
        });
    });
});

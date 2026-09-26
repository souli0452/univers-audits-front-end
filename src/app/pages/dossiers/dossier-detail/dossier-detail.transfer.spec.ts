import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { DossierDetail } from './dossier-detail';
import { DossierService } from '../../../core/services/dossier.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('DossierDetail — transfert vers une institution', () => {
    let fixture: ComponentFixture<DossierDetail>;
    let component: DossierDetail;
    let messages: MessageService;
    let dossierService: { transfer: jasmine.Spy };
    let roles: string[];

    const dossier = (status: string) => ({ id: 'd1', version: 4, status, object: 'Objet de test', type: 'COMPLAINT' }) as any;

    beforeEach(() => {
        roles = ['CGE'];
        dossierService = {
            transfer: jasmine.createSpy('transfer').and.callFake((_id: string, request: any) =>
                of({ id: 'd1', version: 5, status: 'TRANSFERE', object: 'Objet de test', type: 'COMPLAINT', transferInstitution: request.transferInstitution }))
        };
        TestBed.configureTestingModule({
            imports: [DossierDetail],
            providers: [
                provideRouter([]),
                provideHttpClient(),
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
                { provide: DossierService, useValue: dossierService },
                { provide: KeycloakService, useValue: { hasAnyRole: (r: string[]) => r.some(x => roles.includes(x)) } }
            ]
        });
        fixture = TestBed.createComponent(DossierDetail);
        component = fixture.componentInstance;
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
    });

    describe('canTransfer', () => {
        it('autorise CGE, CGEA et ADMIN_DDIC sur un dossier « En revue CTADP » (seule étape acceptée par le back)', () => {
            component.dossier = dossier('EN_REVUE_CTADP');
            for (const role of ['CGE', 'CGEA', 'ADMIN_DDIC']) {
                roles = [role];
                expect(component.canTransfer()).withContext(role).toBeTrue();
            }
        });

        it('refuse tout autre statut', () => {
            for (const status of ['SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE', 'RECEVABLE', 'IRRECEVABLE', 'EN_INVESTIGATION', 'CLOS', 'TRANSFERE']) {
                component.dossier = dossier(status);
                expect(component.canTransfer()).withContext(status).toBeFalse();
            }
        });

        it('refuse les rôles sans droit de transfert', () => {
            component.dossier = dossier('EN_REVUE_CTADP');
            for (const role of ['AGENT_BRPD', 'CONSEILLER_JURIDIQUE', 'CONTROLEUR_ETAT', 'AGENT_CJ']) {
                roles = [role];
                expect(component.canTransfer()).withContext(role).toBeFalse();
            }
        });
    });

    describe('executeTransfer', () => {
        beforeEach(() => {
            component.dossier = dossier('EN_REVUE_CTADP');
            component.openTransfer();
        });

        it('ouvre le dialogue avec des champs vides', () => {
            expect(component.showTransferDialog).toBeTrue();
            expect(component.transferInstitution).toBe('');
            expect(component.transferReason).toBe('');
        });

        it('refuse un transfert sans institution destinataire (obligatoire côté back)', () => {
            component.transferInstitution = '   ';

            component.executeTransfer();

            expect(dossierService.transfer).not.toHaveBeenCalled();
            expect(component.showTransferDialog).toBeTrue();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn', summary: 'Institution requise' }));
        });

        it('envoie la version, l’institution et le motif, puis met à jour le dossier', () => {
            component.transferInstitution = '  Institution partenaire de test  ';
            component.transferReason = 'Hors du champ de compétence';

            component.executeTransfer();

            expect(dossierService.transfer).toHaveBeenCalledOnceWith('d1', {
                version: 4,
                reason: 'Hors du champ de compétence',
                transferInstitution: 'Institution partenaire de test'
            });
            expect(component.dossier?.status).toBe('TRANSFERE');
            expect(component.showTransferDialog).toBeFalse();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success', summary: 'Statut mis à jour' }));
        });
    });
});

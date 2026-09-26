import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { InformationPreoccupanteDetail } from './information-preoccupante-detail';
import { InformationPreoccupanteService } from '../../../core/services/information-preoccupante.service';
import { DossierService } from '../../../core/services/dossier.service';

const INFO = {
    id: 'ip1', objet: 'Article de presse de test', description: 'Faits fictifs',
    source: 'WRITTEN_PRESS', dateReception: '2026-09-25T00:00:00Z', statut: 'NOUVELLE',
    createdAt: '2026-09-25T00:00:00Z', dossiersRattaches: []
};

describe('InformationPreoccupanteDetail — classement sans suite', () => {
    let fixture: ComponentFixture<InformationPreoccupanteDetail>;
    let component: InformationPreoccupanteDetail;
    let service: { findById: jasmine.Spy; classerSansSuite: jasmine.Spy };

    beforeEach(() => {
        service = {
            findById: jasmine.createSpy('findById').and.returnValue(of(INFO)),
            classerSansSuite: jasmine.createSpy('classerSansSuite').and.returnValue(of({ ...INFO, statut: 'CLASSEE_SANS_SUITE' }))
        };
        TestBed.configureTestingModule({
            imports: [InformationPreoccupanteDetail],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'ip1' } } } },
                { provide: InformationPreoccupanteService, useValue: service },
                { provide: DossierService, useValue: {} }
            ]
        });
        fixture = TestBed.createComponent(InformationPreoccupanteDetail);
        component = fixture.componentInstance;
        component.info = INFO as any;
    });

    it('demande une confirmation avant de classer sans suite, sans appeler le service', () => {
        component.confirmClasserSansSuite();

        expect(component.showClasserDialog).toBeTrue();
        expect(service.classerSansSuite).not.toHaveBeenCalled();
    });

    it('classe l’information une fois la confirmation donnée et referme le dialogue', () => {
        component.showClasserDialog = true;

        component.executeClasserSansSuite();

        expect(service.classerSansSuite).toHaveBeenCalledOnceWith('ip1');
        expect(component.info?.statut).toBe('CLASSEE_SANS_SUITE');
        expect(component.showClasserDialog).toBeFalse();
    });
});

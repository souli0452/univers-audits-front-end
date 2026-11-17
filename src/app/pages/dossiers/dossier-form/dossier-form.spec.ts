import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DossierForm } from './dossier-form';
import { GeographieService } from '../../../core/services/geographie.service';
import { DossierService } from '../../../core/services/dossier.service';

describe('DossierForm (enregistrement par un agent)', () => {
    let component: DossierForm;
    let dossierService: { create: jasmine.Spy; submit: jasmine.Spy };

    beforeEach(() => {
        dossierService = {
            create: jasmine.createSpy('create').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' })),
            submit: jasmine.createSpy('submit').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' }))
        };
        TestBed.configureTestingModule({
            imports: [DossierForm],
            providers: [provideRouter([]), provideNoopAnimations(), { provide: DossierService, useValue: dossierService },
                { provide: GeographieService, useValue: { getArbre: () => of({ code: 'BF', libelle: 'Burkina Faso', regions: [] }) } }]
        });
        const fixture: ComponentFixture<DossierForm> = TestBed.createComponent(DossierForm);
        component = fixture.componentInstance;
        component.dossierForm.patchValue({
            object: 'Demande reçue par Messenger',
            description: 'Faits fictifs de recette',
            submissionMode: 'SOCIAL_MEDIA',
            socialPlatform: 'MESSENGER',
            natureSaisineChoisie: 'DEMANDE_INTERVENTION',
            typologieInstitutionnelle: 'SOCIETES_D_ETAT'
        });
        component.fd['quality'].setValue('TEMOIN');
        component.onOrigine({ origineRegionId: 'r-gui', origineProvinceId: 'p-houet', origineCommuneId: 'c-bama' });
    });

    it("passe par la route des agents, pas par le dépôt public qui ignorerait la nature et la typologie", () => {
        component.submit();

        expect(dossierService.create).toHaveBeenCalledTimes(1);
        expect(dossierService.submit).not.toHaveBeenCalled();
    });

    it('envoie la nature choisie, la plateforme, la zone et le type d\'institution', () => {
        component.submit();
        const demande = dossierService.create.calls.mostRecent().args[0];

        expect(demande.natureSaisineChoisie).toBe('DEMANDE_INTERVENTION');
        expect(demande.socialPlatform).toBe('MESSENGER');
        expect(demande.origineRegionId).toBe('r-gui');
        expect(demande.origineProvinceId).toBe('p-houet');
        expect(demande.origineCommuneId).toBe('c-bama');
        expect(demande.typologieInstitutionnelle).toBe('SOCIETES_D_ETAT');
        expect(demande.submissionMode).toBe('SOCIAL_MEDIA');
    });

    it("n'envoie la plateforme que pour le canal « Réseaux sociaux »", () => {
        component.f['submissionMode'].setValue('EMAIL');

        component.submit();

        expect(dossierService.create.calls.mostRecent().args[0].socialPlatform).toBeUndefined();
    });

    it("n'envoie aucune nature quand l'agent n'en choisit pas : le serveur la déduit de la qualité", () => {
        component.f['natureSaisineChoisie'].setValue(null);

        component.submit();

        expect(dossierService.create.calls.mostRecent().args[0].natureSaisineChoisie).toBeUndefined();
    });

    it("envoie le pays quand le déclarant vit à l'étranger, sans géographie du Burkina", () => {
        component.onOrigine({ paysOrigine: "Côte d'Ivoire" });

        component.submit();
        const demande = dossierService.create.calls.mostRecent().args[0];

        expect(demande.paysOrigine).toBe("Côte d'Ivoire");
        expect(demande.origineRegionId).toBeUndefined();
    });

    it('ne garde que la région pour un déclarant anonyme', () => {
        component.fd['anonymous'].setValue(true);

        component.submit();
        const demande = dossierService.create.calls.mostRecent().args[0];

        expect(demande.origineRegionId).toBe('r-gui');
        expect(demande.origineProvinceId).toBeUndefined();
        expect(demande.origineCommuneId).toBeUndefined();
    });
});

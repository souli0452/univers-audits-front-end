import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DossierForm } from './dossier-form';
import { GeographieService } from '../../../core/services/geographie.service';
import { DossierService } from '../../../core/services/dossier.service';

describe('DossierForm (enregistrement par un agent)', () => {
    let fixture: ComponentFixture<DossierForm>;
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
        fixture = TestBed.createComponent(DossierForm);
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

    it("n'affiche pas l'encart « Confidentialité garantie » sur la page", () => {
        fixture.detectChanges();

        const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(texte).not.toContain('Confidentialité garantie');
        expect(texte).not.toContain('Toutes les informations sont protégées');
    });

    it("affiche les messages d'erreur en texte lisible (12 px au moins)", () => {
        component.f['description'].setValue('');
        component.f['description'].markAsTouched();
        fixture.detectChanges();

        const erreur = (fixture.nativeElement as HTMLElement).querySelector('.error-msg') as HTMLElement;
        expect(erreur).not.toBeNull();
        expect(parseFloat(getComputedStyle(erreur).fontSize)).toBeGreaterThanOrEqual(12);
    });

    describe("suggestion d'après la description", () => {
        const RECIT = "On m'a réclamé 10 000 F à la mairie de Boromo pour un acte de mariage.";
        const bouton = (nom: string): HTMLButtonElement | undefined =>
            Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
                .find(b => (b.textContent ?? '').includes(nom)) as HTMLButtonElement | undefined;

        beforeEach(() => {
            component.dossierForm.patchValue({ description: RECIT, natureSaisineChoisie: null, typologieInstitutionnelle: null });
            fixture.detectChanges();
        });

        it("propose nature et type d'institution sans rien remplir", () => {
            expect((fixture.nativeElement as HTMLElement).textContent).toContain('Suggestion');
            expect(component.f['natureSaisineChoisie'].value).toBeNull();
            expect(component.f['typologieInstitutionnelle'].value).toBeNull();
        });

        it('« Appliquer » remplit les deux listes', () => {
            bouton('Appliquer')!.click();

            expect(component.f['natureSaisineChoisie'].value).toBe('PLAINTE');
            expect(component.f['typologieInstitutionnelle'].value).toBe('COLLECTIVITES_TERRITORIALES');
            expect(dossierService.create).not.toHaveBeenCalled();
        });
    });
});

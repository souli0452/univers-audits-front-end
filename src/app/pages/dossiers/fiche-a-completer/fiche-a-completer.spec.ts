import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { FicheACompleter } from './fiche-a-completer';
import { DossierService } from '../../../core/services/dossier.service';

describe('FicheACompleter', () => {
    let fixture: ComponentFixture<FicheACompleter>;
    let composant: FicheACompleter;
    let dossierService: { update: jasmine.Spy };
    let messages: MessageService;

    const dossier = (surcharge: any = {}) => ({
        id: 'd1', version: 4, status: 'SOUMIS', type: 'DENONCIATION', submissionMode: 'WEB_FORM',
        object: 'Témoignage vocal en attente de traitement',
        description: 'Témoignage audio soumis via le portail citoyen.',
        incidentLocation: undefined, incidentPeriod: undefined, estimatedLoss: undefined,
        ...surcharge
    }) as any;

    function creer(d = dossier(), audios: { id: string; nom: string; url: string }[] = []): void {
        fixture = TestBed.createComponent(FicheACompleter);
        composant = fixture.componentInstance;
        fixture.componentRef.setInput('dossier', d);
        fixture.componentRef.setInput('audios', audios);
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
        fixture.detectChanges();
    }

    const texte = (): string => ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

    beforeEach(() => {
        dossierService = { update: jasmine.createSpy('update').and.callFake((_id: string, r: any) => of({ ...r, id: 'd1', version: 5 })) };
        TestBed.configureTestingModule({
            imports: [FicheACompleter],
            providers: [provideNoopAnimations(), { provide: DossierService, useValue: dossierService }]
        });
    });

    it('part des informations déjà connues du dossier', () => {
        creer(dossier({ object: 'Marché sans appel d\'offres', incidentLocation: 'Ministère X', estimatedLoss: 5000000 }));

        expect(composant.form.value.object).toBe('Marché sans appel d\'offres');
        expect(composant.form.value.incidentLocation).toBe('Ministère X');
        expect(composant.form.value.estimatedLoss).toBe(5000000);
    });

    it('propose les quatre natures que l\'agent peut choisir', () => {
        creer();

        expect(composant.natures.map(n => n.value)).toEqual(
            ['PLAINTE', 'DENONCIATION', 'PLAINTE_DENONCIATION', 'DEMANDE_INTERVENTION']);
        expect(composant.form.value.natureSaisineChoisie).toBe('DENONCIATION');
    });

    it('pour un témoignage vocal : le lecteur est toujours visible, avant les champs à remplir', () => {
        creer(dossier(), [{ id: 'a1', nom: 'temoignage_vocal.webm', url: 'blob:test' }]);

        expect(texte()).toContain('Témoignage vocal');
        expect(texte()).toContain('Écoutez-le');
        const audio = (fixture.nativeElement as HTMLElement).querySelector('audio') as HTMLAudioElement;
        expect(audio).not.toBeNull();
        expect(audio.getAttribute('preload')).toBe('auto');
        const html = (fixture.nativeElement as HTMLElement).innerHTML;
        expect(html.indexOf('<audio')).toBeLessThan(html.indexOf('Décrivez les faits'));
    });

    it('sans enregistrement, ne parle pas de témoignage vocal', () => {
        creer(dossier({ object: 'Un objet déjà renseigné correctement' }), []);

        expect(texte()).not.toContain('Écoutez-le');
    });

    it('enregistre les compléments avec la version du dossier et prévient le parent', () => {
        creer();
        let recu: any;
        composant.enregistre.subscribe(d => recu = d);
        composant.form.patchValue({
            object: 'Détournement de carburant au parc automobile',
            description: 'Un chauffeur revend des bons de carburant.',
            incidentLocation: 'Parc automobile du projet',
            incidentPeriod: 'Mars 2026',
            estimatedLoss: 12000000,
            natureSaisineChoisie: 'PLAINTE_DENONCIATION',
            typologieInstitutionnelle: 'PROJETS_PROGRAMMES'
        });

        composant.enregistrer();

        expect(dossierService.update).toHaveBeenCalledWith('d1', {
            version: 4,
            object: 'Détournement de carburant au parc automobile',
            description: 'Un chauffeur revend des bons de carburant.',
            incidentLocation: 'Parc automobile du projet',
            incidentPeriod: 'Mars 2026',
            estimatedLoss: 12000000,
            natureSaisineChoisie: 'PLAINTE_DENONCIATION',
            typologieInstitutionnelle: 'PROJETS_PROGRAMMES'
        });
        expect(recu.version).toBe(5);
        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    });

    it('exige un objet d\'au moins 10 caractères et une description avant d\'enregistrer', () => {
        creer();
        composant.form.patchValue({ object: 'Court', description: '' });

        composant.enregistrer();

        expect(dossierService.update).not.toHaveBeenCalled();
        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
    });

    it('un signalement d\'autorité ou une auto-saisine garde sa nature : elle n\'est ni modifiable ni envoyée', () => {
        creer(dossier({ type: 'SIGNALEMENT', object: 'Signalement transmis par une autorité' }));

        expect(composant.form.controls.natureSaisineChoisie.disabled).toBeTrue();
        composant.enregistrer();

        expect(dossierService.update.calls.mostRecent().args[1].natureSaisineChoisie).toBeUndefined();
    });

    it('en cas d\'erreur du serveur (par exemple une modification concurrente), le dit sans rien perdre', () => {
        dossierService.update.and.returnValue(throwError(() => ({ error: { message: 'Le dossier a été modifié par un autre agent' } })));
        creer();
        composant.form.patchValue({ object: 'Un objet complet et assez long', description: 'Une description' });
        let emis = false;
        composant.enregistre.subscribe(() => emis = true);

        composant.enregistrer();

        expect(emis).toBeFalse();
        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'error', detail: 'Le dossier a été modifié par un autre agent' }));
        expect(composant.form.value.description).toBe('Une description');
        expect(composant.enCours).toBeFalse();
    });

    describe("suggestion d'après le récit", () => {
        const RECIT = "On m'a réclamé 10 000 F à la mairie de Boromo pour un acte de mariage.";
        const bouton = (nom: string): HTMLButtonElement | undefined =>
            Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
                .find(b => (b.textContent ?? '').includes(nom)) as HTMLButtonElement | undefined;

        it("propose la nature et le type d'institution sans rien modifier au formulaire", () => {
            creer(dossier({ description: RECIT, typologieInstitutionnelle: null }));

            expect(texte()).toContain('Suggestion');
            expect(composant.form.value.natureSaisineChoisie).toBe('DENONCIATION');
            expect(composant.form.value.typologieInstitutionnelle).toBeNull();
        });

        it('« Appliquer » renseigne les deux listes, sans enregistrer au dossier', () => {
            creer(dossier({ description: RECIT, typologieInstitutionnelle: null }));

            bouton('Appliquer')!.click();

            expect(composant.form.value.natureSaisineChoisie).toBe('PLAINTE');
            expect(composant.form.value.typologieInstitutionnelle).toBe('COLLECTIVITES_TERRITORIALES');
            expect(dossierService.update).not.toHaveBeenCalled();
        });

        it("suit le texte que l'agent corrige à l'écran", () => {
            creer(dossier({ description: 'Texte neutre sans indice particulier pour le moment.' }));
            expect(texte()).not.toContain('Suggestion');

            composant.form.patchValue({ description: RECIT });
            fixture.detectChanges();

            expect(texte()).toContain('Suggestion');
        });

        it("ne propose pas de nature pour un signalement d'autorité, mais le type oui", () => {
            creer(dossier({ type: 'SIGNALEMENT', description: RECIT, typologieInstitutionnelle: null }));

            bouton('Appliquer')!.click();

            expect(composant.form.controls.natureSaisineChoisie.value).toBe('SIGNALEMENT');
            expect(composant.form.value.typologieInstitutionnelle).toBe('COLLECTIVITES_TERRITORIALES');
        });
    });
});

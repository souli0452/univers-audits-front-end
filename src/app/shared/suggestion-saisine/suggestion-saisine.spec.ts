import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SuggestionSaisineAide } from './suggestion-saisine';

describe('SuggestionSaisineAide', () => {
    let fixture: ComponentFixture<SuggestionSaisineAide>;
    let composant: SuggestionSaisineAide;
    let appliquee: jasmine.Spy;

    const RECIT_PLAINTE_MAIRIE = "On m'a réclamé 10 000 F à la mairie de Boromo pour un acte de mariage.";

    function creer(entrees: Record<string, unknown>): void {
        fixture = TestBed.createComponent(SuggestionSaisineAide);
        composant = fixture.componentInstance;
        for (const [cle, valeur] of Object.entries(entrees)) { fixture.componentRef.setInput(cle, valeur); }
        appliquee = jasmine.createSpy('appliquer');
        composant.appliquer.subscribe(appliquee);
        fixture.detectChanges();
    }
    const maj = (entrees: Record<string, unknown>): void => {
        for (const [cle, valeur] of Object.entries(entrees)) { fixture.componentRef.setInput(cle, valeur); }
        fixture.detectChanges();
    };
    const texte = (): string => ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
    const bouton = (nom: string): HTMLButtonElement | undefined =>
        Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
            .find(b => (b.textContent ?? '').includes(nom)) as HTMLButtonElement | undefined;

    beforeEach(() => TestBed.configureTestingModule({ imports: [SuggestionSaisineAide], providers: [provideNoopAnimations()] }));

    it('affiche la nature et le type d’institution déduits du récit, avec leurs libellés', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });

        expect(texte()).toContain('Plainte');
        expect(texte()).toContain('Collectivités territoriales et services déconcentrés');
    });

    it('n’applique rien tant que l’agent n’a pas cliqué', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });

        expect(appliquee).not.toHaveBeenCalled();
    });

    it('« Appliquer » envoie la nature et le type proposés', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });

        bouton('Appliquer')!.click();

        expect(appliquee).toHaveBeenCalledOnceWith({ nature: 'PLAINTE', typologie: 'COLLECTIVITES_TERRITORIALES' });
    });

    it('ne propose pas ce que le dossier a déjà', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'PLAINTE', typologieActuelle: 'COLLECTIVITES_TERRITORIALES' });

        expect(texte()).not.toContain('Suggestion');
        expect(bouton('Appliquer')).toBeUndefined();
    });

    it('ne propose que ce qui diffère : le type seul quand la nature est déjà la bonne', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'PLAINTE', typologieActuelle: null });

        bouton('Appliquer')!.click();

        expect(appliquee).toHaveBeenCalledOnceWith({ typologie: 'COLLECTIVITES_TERRITORIALES' });
    });

    it('ne propose pas de nature quand elle n’est pas modifiable (signalement, auto-saisine)', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'SIGNALEMENT', natureModifiable: false, typologieActuelle: null });

        bouton('Appliquer')!.click();

        expect(appliquee).toHaveBeenCalledOnceWith({ typologie: 'COLLECTIVITES_TERRITORIALES' });
    });

    it('n’affiche rien quand le récit est trop flou', () => {
        creer({ texte: 'Des choses étranges se passent dans cette direction depuis longtemps.' });

        expect(texte()).not.toContain('Suggestion');
    });

    it('« Ignorer » masque la suggestion sans rien appliquer', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });

        bouton('Ignorer')!.click();
        fixture.detectChanges();

        expect(appliquee).not.toHaveBeenCalled();
        expect(texte()).not.toContain('Suggestion');
    });

    it('une suggestion ignorée revient si le récit change et en produit une autre', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });
        bouton('Ignorer')!.click();
        fixture.detectChanges();

        maj({ texte: 'J’ai vu le directeur du CHU détourner des médicaments toute la semaine.' });

        expect(texte()).toContain('Suggestion');
        expect(texte()).toContain('Établissements publics');
    });

    it('une suggestion ignorée reste masquée quand le récit change sans changer la suggestion', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });
        bouton('Ignorer')!.click();
        fixture.detectChanges();

        maj({ texte: RECIT_PLAINTE_MAIRIE + ' Cela dure depuis mars.' });

        expect(texte()).not.toContain('Suggestion');
    });

    it('dit clairement que c’est une aide et que l’agent décide', () => {
        creer({ texte: RECIT_PLAINTE_MAIRIE, natureActuelle: 'DENONCIATION', typologieActuelle: null });

        expect(texte()).toContain('d’après le récit');
        expect(texte()).toContain('à vous de décider');
    });
});

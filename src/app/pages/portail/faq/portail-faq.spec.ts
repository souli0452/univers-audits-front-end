import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PortailFaq, QUESTIONS_FAQ } from './portail-faq';

describe('PortailFaq', () => {
    let fixture: ComponentFixture<PortailFaq>;
    let el: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [PortailFaq], providers: [provideRouter([])] });
        fixture = TestBed.createComponent(PortailFaq);
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    afterEach(() => {
        document.documentElement.style.fontSize = '';
        try { localStorage.removeItem('portail_taille_texte'); } catch { /* sans effet */ }
    });

    it('affiche toutes les questions, fermées au départ', () => {
        const blocs = Array.from(el.querySelectorAll('details'));

        expect(blocs.length).toBe(QUESTIONS_FAQ.length);
        expect(blocs.every(b => !b.open)).toBeTrue();
    });

    it('« Tout ouvrir » puis « Tout fermer »', () => {
        const [ouvrir, fermer] = Array.from(el.querySelectorAll('.actions button')) as HTMLButtonElement[];

        ouvrir.click();
        fixture.detectChanges();
        expect(Array.from(el.querySelectorAll('details')).every(b => b.open)).toBeTrue();

        fermer.click();
        fixture.detectChanges();
        expect(Array.from(el.querySelectorAll('details')).every(b => !b.open)).toBeTrue();
    });

    it('répond aux craintes essentielles du dénonciateur', () => {
        const questions = QUESTIONS_FAQ.map(q => q.question).join(' | ');

        expect(questions).toContain('preuves');
        expect(questions).toContain('anonyme');
        expect(questions).toContain('identité');
        expect(questions).toContain('code de suivi');
    });

    it('affiche le numéro vert 80 00 11 02 avec un lien téléphonique', () => {
        const lien = el.querySelector('a[href^="tel:"]') as HTMLAnchorElement;

        expect(lien.getAttribute('href')).toBe('tel:80001102');
    });

    it('permet d’agrandir puis de réduire le texte', () => {
        const [moins, plus] = Array.from(el.querySelectorAll('app-taille-texte button')) as HTMLButtonElement[];

        expect(moins.disabled).toBeTrue();
        plus.click();
        fixture.detectChanges();
        expect(document.documentElement.style.fontSize).toBe('112%');

        moins.click();
        fixture.detectChanges();
        expect(document.documentElement.style.fontSize).toBe('');
    });
});

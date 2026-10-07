import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PortailInfo, PAGES_INFO } from './portail-info';
import { PortalConfigService } from '../../../core/services/portal-config.service';

describe('PortailInfo', () => {
    function creer(page: string, cfg: Record<string, string> = {}) {
        TestBed.configureTestingModule({
            imports: [PortailInfo],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ page })) } },
                { provide: PortalConfigService, useValue: { config$: of(cfg), loadPublicConfig: () => Promise.resolve() } }
            ]
        });
        const fixture = TestBed.createComponent(PortailInfo);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('couvre toutes les pages du pied de page', () => {
        expect(Object.keys(PAGES_INFO).sort()).toEqual(
            ['conditions', 'confidentialite', 'mentions-legales', 'missions', 'textes-juridiques']);
    });

    it('affiche la page demandée', () => {
        const el = creer('confidentialite');

        expect(el.querySelector('h1')?.textContent).toContain('Confidentialité');
        expect(el.textContent).toContain('Vous pouvez rester anonyme');
    });

    it('cite la loi en vigueur sur les données personnelles (2021) et non celle de 2004', () => {
        const tout = Object.values(PAGES_INFO)
            .flatMap(p => [p.intro, ...p.sections.flatMap(s => [s.titre, ...s.paragraphes])]).join(' ');

        expect(tout).toContain('001-2021/AN');
        expect(tout).not.toContain('010-2004');
    });

    it('les mentions légales donnent par défaut les coordonnées officielles du site de l’ASCE-LC', () => {
        const el = creer('mentions-legales');

        expect(el.querySelector('a[href="mailto:info@asce-lc.bf"]')).not.toBeNull();
        expect(el.textContent).toContain('Avenue Pascal Zagré');
        expect(el.textContent).toContain('01 BP 617');
        expect(el.textContent).toContain('Dénoncer un fait de corruption : (+226) 25 37 40 60');
        expect(el.textContent).toContain('Standard : (+226) 25 37 40 56');
    });

    it('les mentions légales donnent le numéro vert et le courriel configurés', () => {
        const el = creer('mentions-legales', { email_contact: 'aide@exemple.bf', hotline_number: '80 00 00 00' });

        expect(el.querySelector('a[href="tel:80000000"]')).not.toBeNull();
        expect(el.querySelector('a[href="mailto:aide@exemple.bf"]')).not.toBeNull();
    });

    it('une page inconnue affiche « Page introuvable » (y compris un nom hérité de Object)', () => {
        for (const nom of ['nimporte-quoi', 'constructor', 'toString']) {
            TestBed.resetTestingModule();
            expect(creer(nom).querySelector('h1')?.textContent).toContain('Page introuvable');
        }
    });
});

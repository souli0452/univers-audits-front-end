import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { PortailAccueil } from './portail-accueil';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PortalConfigService } from '../../../core/services/portal-config.service';

const STATS = { totalDossiers: 12, dossiersNouveaux: 3, dossiersEnCours: 4, dossiersTraites: 5, confidentiel: '100%', delaiJours: 7 };

describe('PortailAccueil', () => {
    let fixture: ComponentFixture<PortailAccueil>;
    let component: PortailAccueil;
    let el: HTMLElement;
    let router: Router;

    function creer(config: Record<string, string> = {}) {
        TestBed.configureTestingModule({
            imports: [PortailAccueil],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: StatistiqueService, useValue: { getPublicStats: () => of(STATS) } },
                { provide: PortalConfigService, useValue: { config$: new BehaviorSubject(config), loadPublicConfig: () => {} } }
            ]
        });
        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
        fixture = TestBed.createComponent(PortailAccueil);
        component = fixture.componentInstance;
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    }

    beforeEach(() => creer());

    const q = (sel: string) => el.querySelector(sel) as HTMLElement | null;
    const qa = (sel: string) => Array.from(el.querySelectorAll(sel)) as HTMLElement[];
    const texte = (sel: string) => (q(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim();

    describe('décor du hero', () => {
        it('n’a plus ni anneau (cercle) ni radar animé', () => {
            expect(q('.ring')).toBeNull();
            expect(q('.radar')).toBeNull();
            expect(q('.hero-rings')).toBeNull();
        });
    });

    describe('reste de l’accueil inchangé', () => {
        it('garde le titre et la carte de suivi dans le hero', () => {
            expect(texte('.hero-title')).toContain('ACTES DE CORRUPTI');
            expect(q('.track-card .track-input')).not.toBeNull();
        });

        it('ouvre le suivi avec le code saisi, ou sans code si le champ est vide', () => {
            component.trackingCode = 'A1B2C3D4';
            component.goToTracking();
            expect(router.navigate).toHaveBeenCalledWith(['/portail/suivi'], { queryParams: { code: 'A1B2C3D4' } });

            component.trackingCode = '   ';
            component.goToTracking();
            expect(router.navigate).toHaveBeenCalledWith(['/portail/suivi']);
        });

        it('« Faire un signalement » ouvre le choix formulaire / vocal', () => {
            (q('.hero-actions .btn-hero-primary') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(q('.overlay')).not.toBeNull();
            (q('.c-audio') as HTMLElement).click();
            expect(router.navigate).toHaveBeenCalledWith(['/portail/vocal']);
        });
    });

    describe('une seule action par intention (plus de doublons de boutons)', () => {
        it('le hero ne propose que « Faire un signalement » ; le suivi passe par la carte', () => {
            const boutons = qa('.hero-actions button');

            expect(boutons.length).toBe(1);
            expect(boutons[0].textContent).toContain('Faire un signalement');
            expect(texte('.hero-actions')).not.toContain('Suivre ma dénonciation');
        });

        it('le haut de page ne garde que le logo ASCE-LC et le numéro vert, sans bouton', () => {
            expect(q('.hero-topbar img[alt="ASCE-LC"]')).not.toBeNull();
            expect(qa('.hero-topbar button').length).toBe(0);
            expect(texte('.hero-topbar')).toContain('Numéro vert');
            expect(texte('.hero-topbar')).toContain('80 00 11 11');
        });

        it('le numéro vert du haut de page suit le paramètre hotline_number de l’administration', () => {
            TestBed.resetTestingModule();
            creer({ hotline_number: '80 00 22 22' });

            expect(texte('.hero-topbar')).toContain('80 00 22 22');
            expect(texte('.hero-topbar')).not.toContain('80 00 11 11');
        });

        it('« Accès rapide » ne propose plus qu’un bouton : « Faire un signalement »', () => {
            const boutons = qa('.quick-item');

            expect(boutons.length).toBe(1);
            expect(boutons[0].textContent).toContain('Faire un signalement');
            expect(q('.quick-circle.is-green')).toBeNull();
        });

        it('le bouton d’« Accès rapide » ouvre le choix de dépôt', () => {
            (q('.quick-item') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(q('.overlay')).not.toBeNull();
        });
    });

    describe('armoiries du Burkina Faso', () => {
        const ARMOIRIES = 'img[src="/assets/armoiries.png"][alt="Armoiries du Burkina Faso"]';

        it('n’apparaissent pas en haut de page : seul le logo ASCE-LC y figure', () => {
            expect(q('.hero-topbar ' + ARMOIRIES)).toBeNull();
            expect(q('.hero-topbar img[alt="ASCE-LC"]')).not.toBeNull();
        });

        it('figurent dans le pied de page, dans le coin de droite', () => {
            const coin = q('footer .footer-arms') as HTMLElement;

            expect(coin.querySelector(ARMOIRIES)).not.toBeNull();
            expect(getComputedStyle(coin).position).toBe('absolute');
            const pied = q('footer')!.getBoundingClientRect();
            const boite = coin.getBoundingClientRect();
            expect(boite.left).toBeGreaterThan(pied.left + pied.width / 2);   // moitié droite
            expect(pied.right - boite.right).toBeLessThan(64);                // près du bord droit
            expect(boite.top - pied.top).toBeLessThan(120);                   // en haut : le coin, pas le milieu
        });

        it('le logo ASCE-LC reste dans le pied de page, à sa place', () => {
            expect(q('footer .footer-brand .footer-logo img[alt="ASCE-LC"]')).not.toBeNull();
        });
    });

    describe('garanties sous le bouton du hero', () => {
        it('rappelle les trois garanties (les mêmes que la section « Vos garanties »), sous le bouton', () => {
            const lignes = qa('.hero-trust li').map(li => (li.textContent ?? '').trim());

            expect(lignes).toEqual(['Anonymat garanti', 'Plateforme sécurisée', 'Institution officielle']);
            expect(lignes).toEqual(component.trustItems.map(t => t.title));
        });

        it('vient après le bouton « Faire un signalement » dans le hero', () => {
            const bouton = q('.hero-actions')!;
            const garanties = q('.hero-trust')!;

            expect(bouton.compareDocumentPosition(garanties) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            expect(garanties.closest('.hero')).not.toBeNull();
        });

        it('ne crée ni nouveau bouton ni nouveau lien dans le hero', () => {
            expect(qa('.hero-trust button, .hero-trust a').length).toBe(0);
            expect(qa('.hero-actions button').length).toBe(1);
        });
    });

    describe('petit écran', () => {
        it('les cartes « Vos garanties » passent sur une seule colonne (sinon la page déborde à droite)', () => {
            const petitEcran = window.matchMedia('(max-width: 860px)').matches;   // la fenêtre de Karma est étroite
            const colonnes = getComputedStyle(q('.garanties-grid')!).gridTemplateColumns.trim().split(/\s+/);

            expect(colonnes.length).toBe(petitEcran ? 1 : 3);
        });
    });
});

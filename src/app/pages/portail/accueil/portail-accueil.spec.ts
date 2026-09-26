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

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PortailAccueil],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: StatistiqueService, useValue: { getPublicStats: () => of(STATS) } },
                { provide: PortalConfigService, useValue: { config$: new BehaviorSubject({}), loadPublicConfig: () => {} } }
            ]
        });
        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
        fixture = TestBed.createComponent(PortailAccueil);
        component = fixture.componentInstance;
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    const q = (sel: string) => el.querySelector(sel) as HTMLElement | null;
    const texte = (sel: string) => (q(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim();

    describe('décor du hero', () => {
        it('n’a plus ni anneau (cercle) ni radar animé', () => {
            expect(q('.ring')).toBeNull();
            expect(q('.radar')).toBeNull();
            expect(q('.hero-rings')).toBeNull();
        });
    });

    describe('reste de l’accueil inchangé', () => {
        it('garde le titre, les deux actions et la carte de suivi dans le hero', () => {
            expect(texte('.hero-title')).toContain('ACTES DE CORRUPTI');
            expect(texte('.hero-actions')).toContain('Faire un signalement');
            expect(texte('.hero-actions')).toContain('Suivre ma dénonciation');
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
});

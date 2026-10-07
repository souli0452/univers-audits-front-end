import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PortailChiffres, versBarres } from './portail-chiffres';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PublicStats } from '../../../core/models/statistique.model';
import { ApercuChiffres, SEUIL_TAUX_TRAITEMENT, tauxTraitement } from '../shared/apercu-chiffres';

const STATS: PublicStats = {
    totalDossiers: 120, dossiersNouveaux: 10, dossiersEnCours: 30, dossiersTraites: 80, confidentiel: '100%',
    anneeCourante: 2026,
    parAnnee: [{ annee: 2024, total: 20 }, { annee: 2025, total: 40 }, { annee: 2026, total: 60 }],
    parType: { PLAINTE: 15, DENONCIATION: 45 },
    parCanal: { WEB_FORM: 50, GREEN_NUMBER: 10 }
};

describe('versBarres', () => {
    it('donne 100 % à la plus grande valeur et proportionne les autres', () => {
        const r = versBarres([{ libelle: 'a', valeur: 20 }, { libelle: 'b', valeur: 10 }]);

        expect(r.map(l => l.pourcent)).toEqual([100, 50]);
    });

    it('ne divise pas par zéro quand tout est à zéro', () => {
        expect(versBarres([{ libelle: 'a', valeur: 0 }])[0].pourcent).toBe(0);
    });
});

describe('PortailChiffres', () => {
    function creer(reponse: unknown) {
        TestBed.configureTestingModule({
            imports: [PortailChiffres],
            providers: [provideRouter([]), { provide: StatistiqueService, useValue: { getPublicStats: () => reponse } }]
        });
        const fixture: ComponentFixture<PortailChiffres> = TestBed.createComponent(PortailChiffres);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('affiche la tendance par année et la répartition par nature', () => {
        const el = creer(of(STATS));
        const texte = el.textContent ?? '';

        expect(texte).toContain('2024');
        expect(texte).toContain('2026');
        expect(texte).toContain('Dénonciations');
        expect(texte).toContain('Plaintes');
        expect(texte).toContain('Par nature');
        expect(texte).toContain('Reçus en 2026');
    });

    it('masque le taux de traitement sous le seuil et montre les nouveaux dossiers à la place', () => {
        const el = creer(of({ ...STATS, totalDossiers: 3, dossiersNouveaux: 3, dossiersEnCours: 0, dossiersTraites: 0 }));
        const texte = el.textContent ?? '';

        expect(texte).not.toContain('Taux de traitement');
        expect(texte).not.toContain('0 %');
        expect(texte).toContain('Nouveaux dossiers');
    });

    it('calcule le taux de traitement et affiche les canaux de dépôt', () => {
        const el = creer(of(STATS));
        const texte = el.textContent ?? '';

        expect(texte).toContain('67 %');
        expect(texte).toContain('Taux de traitement');
        expect(texte).toContain('Formulaire en ligne');
        expect(texte).toContain('Numéro vert');
        expect(texte).toContain('Avancement des dossiers');
    });

    it('la version compacte (accueil) n’affiche pas la barre d’avancement', () => {
        TestBed.configureTestingModule({ imports: [ApercuChiffres] });
        const fixture = TestBed.createComponent(ApercuChiffres);
        fixture.componentRef.setInput('stats', STATS);
        fixture.componentRef.setInput('compact', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Avancement des dossiers');
        expect(fixture.nativeElement.textContent).toContain('Évolution sur 3 ans');
    });

    it('n’affiche pas de taux tant qu’aucun dossier n’est reçu', () => {
        expect(tauxTraitement({ totalDossiers: 0, dossiersTraites: 0 })).toBeNull();
        expect(tauxTraitement({ totalDossiers: SEUIL_TAUX_TRAITEMENT - 1, dossiersTraites: 5 })).toBeNull();
        expect(tauxTraitement({ totalDossiers: SEUIL_TAUX_TRAITEMENT, dossiersTraites: 5 })).toBe(25);
    });

    it('reste lisible avec un back plus ancien (sans tendance ni répartition)', () => {
        const el = creer(of({ totalDossiers: 5, dossiersNouveaux: 1, dossiersEnCours: 2, dossiersTraites: 2, confidentiel: '100%' }));

        expect(el.textContent).toContain('Reçus au total');
        expect(el.textContent).not.toContain('Évolution sur');
        expect(el.textContent).toContain('Aucun signalement reçu cette année');
    });

    it('signale une erreur sans casser la page', () => {
        const el = creer(throwError(() => new Error('réseau')));

        expect(el.querySelector('[role="alert"]')).not.toBeNull();
    });
});

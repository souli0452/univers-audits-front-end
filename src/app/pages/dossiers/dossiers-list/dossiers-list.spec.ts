import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DossiersList } from './dossiers-list';
import { DossierService } from '../../../core/services/dossier.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PermissionService } from '../../../core/services/permission.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('DossiersList : colonne « Actions » (œil et menu « ⋯ »)', () => {
    let fixture: ComponentFixture<DossiersList>;
    let component: DossiersList;
    let droits: string[];
    let rolesAgent: string[];

    const dossier = (id: string, status: string, surcharge: any = {}) =>
        ({ id, number: 'N-' + id, version: 1, status, object: 'Objet ' + id, type: 'DENONCIATION',
           submissionMode: 'WEB_FORM', priority: 'NORMAL', createdAt: '2026-11-20T10:00:00Z', ...surcharge }) as any;

    function creer(dossiers: any[]): void {
        TestBed.configureTestingModule({
            imports: [DossiersList],
            providers: [
                provideRouter([]), provideNoopAnimations(),
                { provide: DossierService, useValue: { findAll: () => of({ content: dossiers, totalElements: dossiers.length }) } },
                { provide: StatistiqueService, useValue: { getPublicStats: () => of({}) } },
                { provide: PermissionService, useValue: { a: (p: string) => droits.includes(p), charger: () => of(undefined) } },
                { provide: KeycloakService, useValue: { hasAnyRole: (r: string[]) => r.some(x => rolesAgent.includes(x)) } }
            ]
        });
        fixture = TestBed.createComponent(DossiersList);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }
    const racine = () => fixture.nativeElement as HTMLElement;
    const libelles = (d: any): string[] => component.actionsLigne(d).map(i => i.label as string);

    beforeEach(() => { droits = []; rolesAgent = []; });

    describe('la colonne', () => {
        beforeEach(() => creer([dossier('a', 'SOUMIS'), dossier('b', 'EN_REVUE_CTADP')]));

        it('s\'appelle « Actions »', () => {
            const entetes = Array.from(racine().querySelectorAll('thead th')).map(th => (th.textContent ?? '').trim());

            expect(entetes[entetes.length - 1]).toBe('Actions');
        });

        it('met sur chaque ligne l\'œil pour voir le dossier, puis le menu « ⋯ »', () => {
            const lignes = Array.from(racine().querySelectorAll('tbody tr'));

            expect(lignes.length).toBe(2);
            for (const ligne of lignes) {
                expect(ligne.querySelector('button .pi-eye')).withContext('œil').not.toBeNull();
                expect(ligne.querySelector('button .pi-ellipsis-v')).withContext('⋯').not.toBeNull();
            }
        });

        it('annonce le menu aux lecteurs d\'écran, avec le numéro du dossier', () => {
            const menu = racine().querySelector('button[aria-label*="Actions"]') as HTMLButtonElement;

            expect(menu).not.toBeNull();
            expect(menu.getAttribute('aria-label')).toContain('N-');
            expect(menu.getAttribute('aria-haspopup')).toBe('menu');
        });
    });

    describe('ce que contient le menu de chaque ligne', () => {
        beforeEach(() => creer([]));

        it('commence toujours par « Voir le dossier »', () => {
            expect(libelles(dossier('a', 'CLOS'))[0]).toBe('Voir le dossier');
        });

        it('ajoute l\'action du moment pour le rôle de l\'agent : le CGE déclare recevable ou irrecevable', () => {
            rolesAgent = ['CGE'];

            expect(libelles(dossier('a', 'EN_REVUE_CTADP'))).toEqual(['Voir le dossier', 'Déclarer recevable', 'Déclarer irrecevable']);
        });

        it('ne propose rien de plus à qui n\'a pas à agir à cette étape', () => {
            rolesAgent = ['AGENT_BRPD'];

            expect(libelles(dossier('a', 'EN_REVUE_CTADP'))).toEqual(['Voir le dossier']);
        });

        it('« Enregistrer » suit le droit d\'enregistrer, pour un dossier soumis seulement', () => {
            droits = ['DOSSIER_ENREGISTRER'];

            expect(libelles(dossier('a', 'SOUMIS'))).toContain('Enregistrer le dossier');
            expect(libelles(dossier('a', 'RECU'))).not.toContain('Enregistrer le dossier');
        });

        it('chaque action ouvre le dossier avec la fenêtre correspondante (?action=…)', () => {
            rolesAgent = ['CGE'];
            const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
            const item = component.actionsLigne(dossier('d9', 'EN_REVUE_CTADP')).find(i => i.label === 'Déclarer irrecevable')!;

            item.command!({} as any);

            expect(navigation).toHaveBeenCalledWith(['/app/dossiers', 'd9'], { queryParams: { action: 'declarer-irrecevable' } });
        });

        it('« Voir le dossier » ouvre le dossier sans action', () => {
            const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

            component.actionsLigne(dossier('d9', 'CLOS'))[0].command!({} as any);

            expect(navigation).toHaveBeenCalledWith(['/app/dossiers', 'd9']);
        });

        it('l\'action de décision engageante est signalée en rouge dans le menu', () => {
            rolesAgent = ['CGE'];

            const irrecevable = component.actionsLigne(dossier('a', 'EN_REVUE_CTADP')).find(i => i.label === 'Déclarer irrecevable')!;

            expect(irrecevable.styleClass).toContain('menu-danger');
        });
    });
});

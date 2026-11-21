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
    let dossierService: { findAll: () => any; declareInadmissible: jasmine.Spy; declareAdmissible: jasmine.Spy };

    const dossier = (id: string, status: string, surcharge: any = {}) =>
        ({ id, number: 'N-' + id, version: 1, status, object: 'Objet ' + id, type: 'DENONCIATION',
           submissionMode: 'WEB_FORM', priority: 'NORMAL', createdAt: '2026-11-20T10:00:00Z', ...surcharge }) as any;

    function creer(dossiers: any[]): void {
        dossierService = {
            findAll: () => of({ content: dossiers, totalElements: dossiers.length }),
            declareInadmissible: jasmine.createSpy('declareInadmissible').and.callFake((id: string) =>
                of(dossier(id, 'IRRECEVABLE', { version: 2 }))),
            declareAdmissible: jasmine.createSpy('declareAdmissible').and.callFake((id: string) =>
                of(dossier(id, 'RECEVABLE', { version: 2 })))
        };
        TestBed.configureTestingModule({
            imports: [DossiersList],
            providers: [
                provideRouter([]), provideNoopAnimations(),
                { provide: DossierService, useValue: dossierService },
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

    describe('ligne dépliable : l\'essentiel du dossier sur place', () => {
        const riche = dossier('a', 'EN_REVUE_CTADP', {
            description: 'Le maire a vendu des parcelles sans autorisation du conseil.',
            incidentLocation: 'Mairie de Boromo', incidentPeriod: 'mars 2026', estimatedLoss: 5000000,
            motifDeclare: 'FONCIER', regionOrigine: 'KADIOGO', declarant: { anonymous: true }
        });
        const lignes = () => Array.from(racine().querySelectorAll('tbody tr.ligne-dossier')) as HTMLElement[];
        const texte = () => (racine().textContent ?? '').replace(/\s+/g, ' ');
        const bascule = (i = 0) => { lignes()[i].click(); fixture.detectChanges(); };

        beforeEach(() => { rolesAgent = ['CGE']; creer([riche, dossier('b', 'CLOS')]); });

        it('est repliée au départ : aucun détail n\'encombre la liste', () => {
            expect(texte()).not.toContain('Le maire a vendu des parcelles');
            expect(lignes()[0].querySelector('button[aria-expanded="false"]')).not.toBeNull();
        });

        it('un clic sur la ligne la déplie, un second la replie', () => {
            bascule();
            expect(texte()).toContain('Le maire a vendu des parcelles');
            expect(lignes()[0].querySelector('button[aria-expanded="true"]')).not.toBeNull();

            bascule();
            expect(texte()).not.toContain('Le maire a vendu des parcelles');
        });

        it('le chevron déplie aussi, sans déclencher deux fois', () => {
            (lignes()[0].querySelector('button[aria-expanded]') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(texte()).toContain('Le maire a vendu des parcelles');
        });

        it('montre les faits, le déclarant, la zone, le lieu, la période, le montant et le motif choisi', () => {
            bascule();
            const t = texte();

            expect(t).toContain('Anonyme');
            expect(t).toContain('Kadiogo');
            expect(t).toContain('Mairie de Boromo');
            expect(t).toContain('mars 2026');
            expect(t).toMatch(/5\D000\D000\s*FCFA/);
            expect(t).toContain('Un terrain vendu deux fois');
            expect(t).toContain('Conflit foncier');
        });

        it('n\'affiche pas les rubriques vides', () => {
            bascule(1);

            expect(texte()).not.toContain('Montant estimé');
            expect(texte()).not.toContain('Motif indiqué');
        });

        it('dit à l\'agent dont c\'est le tour ce qu\'il fait, et propose ses boutons', () => {
            bascule();
            const t = texte();

            expect(t).toContain('Votre action');
            expect(Array.from(racine().querySelectorAll('.detail-ligne button')).map(b => (b.textContent ?? '').trim()))
                .toContain('Déclarer irrecevable');
        });

        it('dit aux autres qui doit agir', () => {
            rolesAgent = ['AGENT_BRPD'];
            bascule();

            expect(texte()).toContain('En attente');
        });

        it('propose « Voir le dossier complet », qui mène à la page de détail', () => {
            bascule();
            const lien = racine().querySelector('.detail-ligne a[href*="/app/dossiers/a"]');

            expect(lien).not.toBeNull();
            expect((lien!.textContent ?? '')).toContain('Voir le dossier complet');
        });

        it('un clic sur l\'œil ou le menu « ⋯ » ne déplie pas la ligne', () => {
            (lignes()[0].querySelector('button .pi-eye') as HTMLElement).closest('button')!.click();
            (lignes()[0].querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement).click();
            fixture.detectChanges();

            expect(texte()).not.toContain('Le maire a vendu des parcelles');
        });
    });

    describe('action en fenêtre sur la liste', () => {
        const corps = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');
        const lignes = () => Array.from(racine().querySelectorAll('tbody tr.ligne-dossier')) as HTMLElement[];

        beforeEach(() => { rolesAgent = ['CGE']; creer([dossier('a', 'EN_REVUE_CTADP'), dossier('b', 'CLOS')]); });

        it('ouvre la fenêtre de confirmation de l\'action choisie', () => {
            component.lancer(component.allDossiers[0], 'declarer-irrecevable');
            fixture.detectChanges();

            expect(corps()).toContain('Déclarer irrecevable');
            expect(corps()).toContain('réponse motivée');
        });

        it('après confirmation, la ligne prend le nouveau statut sans recharger la liste ni changer de page', () => {
            const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
            component.lancer(component.allDossiers[0], 'declarer-irrecevable');
            fixture.detectChanges();

            const confirmer = Array.from(document.body.querySelectorAll('p-dialog button'))
                .reverse().find(b => (b.textContent ?? '').includes('Déclarer irrecevable')) as HTMLButtonElement;
            confirmer.click();
            fixture.detectChanges();

            expect(dossierService.declareInadmissible).toHaveBeenCalledWith('a', { version: 1, reason: '' });
            expect(component.allDossiers.find(d => d.id === 'a')!.status).toBe('IRRECEVABLE');
            expect(component.actionEnCours).toBeNull();
            expect(navigation).not.toHaveBeenCalled();
            expect(lignes().length).toBe(2);
        });

        it('« Annuler » referme la fenêtre sans rien changer', () => {
            component.lancer(component.allDossiers[0], 'declarer-irrecevable');
            fixture.detectChanges();

            const annuler = Array.from(document.body.querySelectorAll('p-dialog button'))
                .reverse().find(b => (b.textContent ?? '').includes('Annuler')) as HTMLButtonElement;
            annuler.click();
            fixture.detectChanges();

            expect(component.actionEnCours).toBeNull();
            expect(dossierService.declareInadmissible).not.toHaveBeenCalled();
            expect(component.allDossiers.find(d => d.id === 'a')!.status).toBe('EN_REVUE_CTADP');
        });

        it('le dossier mis à jour garde sa ligne dépliée', () => {
            lignes()[0].click();
            fixture.detectChanges();

            component.apresAction(dossier('a', 'IRRECEVABLE', { version: 2 }));
            fixture.detectChanges();

            expect(component.estDeplie(component.allDossiers[0])).toBeTrue();
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

        it('une action simple s\'ouvre en fenêtre sur la liste, sans quitter la page', () => {
            rolesAgent = ['CGE'];
            const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
            const item = component.actionsLigne(dossier('d9', 'EN_REVUE_CTADP')).find(i => i.label === 'Déclarer irrecevable')!;

            item.command!({} as any);

            expect(component.actionEnCours?.action).toBe('declarer-irrecevable');
            expect(component.actionEnCours?.dossier.id).toBe('d9');
            expect(navigation).not.toHaveBeenCalled();
        });

        it('« Demander un complément » demande un message : il ouvre le dossier avec sa fenêtre (?action=…)', () => {
            rolesAgent = ['CONSEILLER_JURIDIQUE'];
            const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
            const item = component.actionsLigne(dossier('d9', 'EN_ETUDE_OPPORTUNITE')).find(i => i.label === 'Demander un complément')!;

            item.command!({} as any);

            expect(navigation).toHaveBeenCalledWith(['/app/dossiers', 'd9'], { queryParams: { action: 'demander-complement' } });
            expect(component.actionEnCours).toBeNull();
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DossierDetail } from './dossier-detail';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { TargetedPartyService } from '../../../core/services/targeted-party.service';
import { WitnessService } from '../../../core/services/witness.service';
import { ObservationService } from '../../../core/services/observation.service';
import { InvestigationService } from '../../../core/services/investigation.service';
import { PdfService } from '../../../core/services/pdf.service';
import { EtudeOpportuniteService } from '../../../core/services/etude-opportunite.service';
import { FicheAffectationService } from '../../../core/services/fiche-affectation.service';
import { SectionDossierTravailService } from '../../../core/services/section-dossier-travail.service';
import { DossierHabilitationService } from '../../../core/services/dossier-habilitation.service';
import { AgentService } from '../../../core/services/agent.service';
import { PermissionService } from '../../../core/services/permission.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

/**
 * Page de détail d'un signalement : une barre d'avancement, des onglets au niveau de la page (Résumé d'abord),
 * et un résumé qui met les faits en avant. Ces tests rendent la vraie page avec des services simulés.
 */
describe('DossierDetail : barre d\'avancement et onglets', () => {
    let fixture: ComponentFixture<DossierDetail>;
    let roles: string[];

    const dossier = (surcharge: any = {}) => ({
        id: 'd1', version: 3, number: 'N-0043', object: 'Parcelles vendues sans autorisation',
        description: 'Le maire a vendu des parcelles du secteur 4 sans passer par le conseil municipal.',
        status: 'EN_REVUE_CTADP', type: 'DENONCIATION', submissionMode: 'WEB_FORM', priority: 'NORMAL',
        isConfidential: false, accessCode: 'A7QAXALC', createdAt: '2026-11-20T10:00:00Z',
        receptionDate: '2026-11-20T11:00:00Z', declarant: { displayName: 'Anonyme', anonymous: true },
        incidentLocation: 'Mairie de Boromo', ...surcharge
    }) as any;

    const racine = () => fixture.nativeElement as HTMLElement;
    const texte = () => (racine().textContent ?? '').replace(/\s+/g, ' ');
    const onglets = () => Array.from(racine().querySelectorAll('[role="tablist"] [role="tab"]')) as HTMLButtonElement[];
    const onglet = (nom: string) => onglets().find(o => (o.textContent ?? '').includes(nom))!;
    const clic = (nom: string) => { onglet(nom).click(); fixture.detectChanges(); };

    function creer(d: any = dossier(), mesRoles: string[] = ['CGE']): void {
        roles = mesRoles;
        TestBed.configureTestingModule({
            imports: [DossierDetail],
            providers: [
                provideRouter([]), provideHttpClient(), provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' }, queryParamMap: { get: () => null } } } },
                { provide: DossierService, useValue: { findById: () => of(d), getDelaisEtapes: () => of([]), refreshById: () => of(d) } },
                { provide: AttachmentService, useValue: { listByDossier: () => of([]), getDownloadUrl: () => '', telecharger: () => of(new Blob()), formatSize: () => '' } },
                { provide: TargetedPartyService, useValue: { findAll: () => of([]) } },
                { provide: WitnessService, useValue: { findAll: () => of([]) } },
                { provide: ObservationService, useValue: { findAll: () => of([]) } },
                { provide: FicheAffectationService, useValue: { get: () => of(null), getConseillersJuridiques: () => of([]) } },
                { provide: EtudeOpportuniteService, useValue: { get: () => of(null), getTypesInfraction: () => of([]) } },
                { provide: SectionDossierTravailService, useValue: { listerSections: () => of([]) } },
                { provide: DossierHabilitationService, useValue: { findActive: () => of([]) } },
                { provide: InvestigationService, useValue: {} },
                { provide: PdfService, useValue: {} },
                { provide: AgentService, useValue: { findActive: () => of([]) } },
                { provide: PermissionService, useValue: { a: () => false, charger: () => of(undefined) } },
                { provide: KeycloakService, useValue: { hasAnyRole: (r: string[]) => r.some(x => roles.includes(x)) } }
            ]
        });
        fixture = TestBed.createComponent(DossierDetail);
        fixture.detectChanges();
    }

    describe('barre d\'avancement', () => {
        beforeEach(() => creer());

        it('montre le chemin du dossier en une ligne, avec l\'étape en cours repérée', () => {
            const barre = racine().querySelector('ol[aria-label="Avancement du dossier"]')!;

            expect(barre).not.toBeNull();
            expect((barre.textContent ?? '')).toContain('Soumis');
            expect((barre.textContent ?? '')).toContain('Revue CTADP');
            expect(barre.querySelectorAll('[aria-current="step"]').length).toBe(1);
            expect(barre.querySelector('[aria-current="step"]')!.textContent).toContain('Revue CTADP');
        });

        it('masque l\'étape « complément » et « classé » tant que le dossier n\'y est pas', () => {
            const barre = (racine().querySelector('ol[aria-label="Avancement du dossier"]')!.textContent ?? '');

            expect(barre).not.toContain('Attente complément');
            expect(barre).not.toContain('Classé sans suite');
        });

        it('montre l\'étape « complément » quand le dossier y est', () => {
            TestBed.resetTestingModule();
            creer(dossier({ status: 'EN_ATTENTE_COMPLEMENT' }));

            expect(racine().querySelector('ol[aria-label="Avancement du dossier"]')!.textContent).toContain('Attente complément');
        });

        it('remplace la carte « Workflow » de la colonne de droite', () => {
            expect(texte()).not.toContain(' Workflow ');
            expect(racine().querySelectorAll('ol[aria-label="Avancement du dossier"]').length).toBe(1);
        });
    });

    describe('onglets au niveau de la page', () => {
        beforeEach(() => creer());

        it('commencent par « Résumé », ouvert par défaut', () => {
            expect(onglets()[0].textContent).toContain('Résumé');
            expect(onglets()[0].getAttribute('aria-selected')).toBe('true');
            expect(onglets().filter(o => o.getAttribute('aria-selected') === 'true').length).toBe(1);
        });

        it('reprennent les sections existantes, dans l\'ordre', () => {
            expect(onglets().map(o => (o.textContent ?? '').trim().replace(/\s+\d+$/, ''))).toEqual([
                'Résumé', 'Parties visées', 'Témoins', 'Observations', 'Pièces jointes', 'Affectation',
                'Analyse première', 'Dossier de travail']);
        });

        it('le résumé montre les faits en grand, les informations clés et le code de suivi', () => {
            expect(racine().querySelector('[role="tabpanel"]')).not.toBeNull();
            expect(texte()).toContain('Les faits');
            expect(texte()).toContain('Le maire a vendu des parcelles du secteur 4');
            expect(texte()).toContain('Informations générales');
            expect(texte()).toContain('A7QAXALC');
        });

        it('un clic sur un onglet affiche sa section et masque le résumé', () => {
            clic('Pièces jointes');

            expect(onglet('Pièces jointes').getAttribute('aria-selected')).toBe('true');
            expect(onglet('Résumé').getAttribute('aria-selected')).toBe('false');
            expect(texte()).not.toContain('Le maire a vendu des parcelles du secteur 4');
            expect(texte()).not.toContain('A7QAXALC');
        });

        it('un retour sur « Résumé » ramène les faits', () => {
            clic('Témoins');
            clic('Résumé');

            expect(texte()).toContain('Le maire a vendu des parcelles du secteur 4');
        });

        it('affiche le nombre d\'éléments à côté des onglets qui en ont', () => {
            TestBed.resetTestingModule();
            creer(dossier());
            (fixture.componentInstance as any).parties = [{ id: 'p1' }, { id: 'p2' }];
            fixture.detectChanges();

            expect(onglet('Parties visées').textContent).toContain('2');
        });

        it('chaque onglet est un vrai bouton de la barre d\'onglets, navigable au clavier', () => {
            for (const o of onglets()) {
                expect(o.tagName).toBe('BUTTON');
                expect(o.getAttribute('type')).toBe('button');
            }
        });
    });

    describe('dossier confidentiel sans accès', () => {
        it('n\'affiche ni onglets ni avancement : seul l\'avis de confidentialité', () => {
            creer(dossier({ isConfidential: true }), ['AGENT_BRPD']);

            expect(texte()).toContain('Contenu confidentiel');
            expect(onglets().length).toBe(0);
            expect(racine().querySelector('ol[aria-label="Avancement du dossier"]')).toBeNull();
        });

        it('un agent habilité (CGE) voit les onglets', () => {
            creer(dossier({ isConfidential: true }), ['CGE']);

            expect(onglets().length).toBeGreaterThan(0);
        });
    });
});

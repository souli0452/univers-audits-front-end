import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { DossierDetail } from './dossier-detail';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { PermissionService } from '../../../core/services/permission.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('DossierDetail — ce que l\'agent peut faire, selon ses droits', () => {
    let component: DossierDetail;
    let messages: MessageService;
    let droits: string[];
    /** Valeur de « ?action=… » dans l'adresse, posée par le menu « ⋯ » de la liste des dossiers. */
    let actionDemandee: string | null;
    let attachmentService: { telecharger: jasmine.Spy };

    const dossier = (status: string, surcharge: any = {}) =>
        ({ id: 'd1', version: 4, status, object: 'Objet', type: 'DENONCIATION', ...surcharge }) as any;

    beforeEach(() => {
        droits = [];
        actionDemandee = null;
        attachmentService = { telecharger: jasmine.createSpy('telecharger').and.returnValue(of(new Blob(['x']))) };
        TestBed.configureTestingModule({
            imports: [DossierDetail],
            providers: [
                provideRouter([]), provideHttpClient(), provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: {
                    paramMap: { get: () => 'd1' },
                    queryParamMap: { get: (cle: string) => cle === 'action' ? actionDemandee : null }
                } } },
                { provide: DossierService, useValue: {} },
                { provide: AttachmentService, useValue: attachmentService },
                { provide: PermissionService, useValue: { a: (p: string) => droits.includes(p), charger: () => of(undefined) } },
                { provide: KeycloakService, useValue: { hasAnyRole: () => false } }
            ]
        });
        const fixture: ComponentFixture<DossierDetail> = TestBed.createComponent(DossierDetail);
        component = fixture.componentInstance;
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
    });

    describe('enregistrer le dossier', () => {
        it('est proposé à qui a le droit d\'enregistrer, quel que soit son rôle (BRPD, mais aussi CGEA ou CGE en suppléance)', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            component.dossier = dossier('SOUMIS');

            expect(component.peutEnregistrer()).toBeTrue();
        });

        it('n\'est pas proposé sans le droit', () => {
            component.dossier = dossier('SOUMIS');

            expect(component.peutEnregistrer()).toBeFalse();
        });

        it('n\'est proposé que pour un dossier « Soumis »', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            for (const statut of ['RECU', 'EN_ETUDE_OPPORTUNITE', 'CLOS']) {
                component.dossier = dossier(statut);
                expect(component.peutEnregistrer()).withContext(statut).toBeFalse();
            }
        });
    });

    describe("motif indiqué par le déclarant, à l'étude d'opportunité", () => {
        const types = [
            { id: 't-cor', code: 'CORRUPTION', libelle: 'Corruption' },
            { id: 't-fav', code: 'FAVORITISME', libelle: 'Favoritisme' }
        ];

        it('retrouve le motif en mots simples choisi par le citoyen', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'CORRUPTION' });

            expect(component.motifDeclare()?.libelle).toBe("On m'a demandé de l'argent ou un cadeau");
        });

        it('ne dit rien quand le citoyen n\'a pas choisi de motif', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE');

            expect(component.motifDeclare()).toBeUndefined();
            expect(component.allegationProposee()).toBeUndefined();
        });

        it('propose l\'allégation officielle qui correspond au motif', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'FAVORITISME' });
            component.typesInfraction = types;

            expect(component.allegationProposee()?.id).toBe('t-fav');
        });

        it('ne propose aucune allégation pour « Autre » : l\'agent qualifie lui-même', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'AUTRE' });
            component.typesInfraction = types;

            expect(component.allegationProposee()).toBeUndefined();
        });

        it('ne propose rien tant que la liste des infractions n\'est pas chargée', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'CORRUPTION' });
            component.typesInfraction = [];

            expect(component.allegationProposee()).toBeUndefined();
        });

        it('« Retenir » renseigne l\'allégation et, si rien n\'est choisi, la nature pénale', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'CORRUPTION' });
            component.typesInfraction = types;
            component.etudeForm = { natureQualification: null, typeInfractionId: null };

            component.retenirAllegationDuMotif();

            expect(component.etudeForm.typeInfractionId).toBe('t-cor');
            expect(component.etudeForm.natureQualification).toBe('PENALE');
        });

        it('« Retenir » ne change pas une nature déjà choisie par l\'agent', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'CORRUPTION' });
            component.typesInfraction = types;
            component.etudeForm = { natureQualification: 'ADMINISTRATIVE', typeInfractionId: null };

            component.retenirAllegationDuMotif();

            expect(component.etudeForm.natureQualification).toBe('ADMINISTRATIVE');
            expect(component.etudeForm.typeInfractionId).toBe('t-cor');
        });

        it('n\'écrase rien à l\'ouverture : seul l\'agent, en cliquant, retient l\'allégation', () => {
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE', { motifDeclare: 'CORRUPTION' });
            component.typesInfraction = types;

            component.openEtudeDialog();

            expect(component.etudeForm.typeInfractionId).toBeNull();
        });
    });

    describe('compléter la fiche', () => {
        it('est ouvert, avec le droit de modifier, avant le début de l\'étude (Soumis ou Reçu)', () => {
            droits = ['DOSSIER_MODIFIER'];
            for (const statut of ['SOUMIS', 'RECU']) {
                component.dossier = dossier(statut);
                expect(component.peutCompleter()).withContext(statut).toBeTrue();
            }
            component.dossier = dossier('EN_ETUDE_OPPORTUNITE');
            expect(component.peutCompleter()).toBeFalse();
        });

        it('est fermé sans le droit de modifier', () => {
            component.dossier = dossier('SOUMIS');

            expect(component.peutCompleter()).toBeFalse();
        });

        it('fournit au panneau les enregistrements audio du dossier, déjà chargés', () => {
            component.attachments = [
                { id: 'a1', originalName: 'temoignage_vocal.webm', mimeType: 'audio/webm' } as any,
                { id: 'a2', originalName: 'preuve.pdf', mimeType: 'application/pdf' } as any
            ];
            (component as any).attachmentBlobs = { a1: 'blob:audio', a2: 'blob:pdf' };

            expect(component.audiosDuDossier()).toEqual([{ id: 'a1', nom: 'temoignage_vocal.webm', url: 'blob:audio' }]);
        });
    });

    describe('télécharger une pièce jointe', () => {
        it('n\'est proposé qu\'avec le droit de télécharger', () => {
            expect(component.peutTelecharger()).toBeFalse();
            droits = ['PIECE_JOINTE_TELECHARGER'];
            expect(component.peutTelecharger()).toBeTrue();
        });

        it('passe par le serveur, qui trace le téléchargement, puis enregistre le fichier', () => {
            const enregistrer = spyOn(component as any, 'enregistrerFichier');

            component.telecharger({ id: 'a1', originalName: 'preuve.pdf' } as any);

            expect(attachmentService.telecharger).toHaveBeenCalledWith('a1');
            expect(enregistrer).toHaveBeenCalledWith(jasmine.any(Blob), 'preuve.pdf');
        });

        it('explique un refus du serveur sans rien enregistrer', () => {
            attachmentService.telecharger.and.returnValue(throwError(() => ({ status: 403 })));
            const enregistrer = spyOn(component as any, 'enregistrerFichier');

            component.telecharger({ id: 'a1', originalName: 'preuve.pdf' } as any);

            expect(enregistrer).not.toHaveBeenCalled();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
        });
    });

    describe('barre d\'actions : l\'action du moment, et le menu « ⋯ » pour le reste', () => {
        function moi(...mesRoles: string[]): void {
            spyOn(TestBed.inject(KeycloakService), 'hasAnyRole').and.callFake((r: string[]) => r.some(x => mesRoles.includes(x)));
        }
        const libelles = (): string[] =>
            component.menuActions().flatMap(g => (g.items ?? []).map(i => i.label as string));
        const item = (label: string) =>
            component.menuActions().flatMap(g => g.items ?? []).find(i => i.label === label)!;

        it('montre en évidence les actions du circuit de cet agent, pas celles des autres', () => {
            moi('CGE');
            component.dossier = dossier('EN_REVUE_CTADP');

            expect(component.actionsPrincipales().map(a => a.id)).toEqual(['declarer-recevable', 'declarer-irrecevable']);
        });

        it('« Enregistrer » dépend du droit d\'enregistrer, pas du rôle', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            component.dossier = dossier('SOUMIS');

            expect(component.actionsPrincipales().map(a => a.id)).toEqual(['enregistrer']);
        });

        it('lance la bonne fenêtre pour chaque action', () => {
            const appels: Record<string, string> = {
                'enregistrer': 'openRegister', 'demarrer-etude': 'openStartStudy', 'soumettre-ctadp': 'openSubmitCtadp',
                'demander-complement': 'openComplementDialog', 'complement-recu': 'openComplementReceived',
                'declarer-recevable': 'openDeclareAdmissible', 'declarer-irrecevable': 'openDeclareInadmissible',
                'cloturer': 'openClose'
            };
            for (const [id, methode] of Object.entries(appels)) {
                const espion = spyOn(component as any, methode);

                component.lancerAction(id as any);

                expect(espion).withContext(id).toHaveBeenCalledTimes(1);
            }
        });

        it('le menu range les documents, puis la gestion du dossier, par groupes nommés', () => {
            moi('CGE');
            component.dossier = dossier('EN_REVUE_CTADP');

            expect(component.menuActions().map(g => g.label)).toEqual(['Documents', 'Gérer le dossier']);
        });

        it('un agent sans droit de gestion ne voit que les documents', () => {
            moi('AGENT_BRPD');
            component.dossier = dossier('SOUMIS');

            expect(component.menuActions().map(g => g.label)).toEqual(['Documents']);
            expect(libelles()).toContain('Récépissé');
        });

        it('« Transférer » n\'est proposé qu\'au CGE en revue CTADP', () => {
            moi('CGE');
            component.dossier = dossier('EN_REVUE_CTADP');
            expect(libelles()).toContain('Transférer à une institution');

            component.dossier = dossier('EN_ETUDE_OPPORTUNITE');
            expect(libelles()).not.toContain('Transférer à une institution');
        });

        it('la confidentialité et la priorité sont proposées aux seuls CGE, CGEA et administrateur, tant que le dossier est ouvert', () => {
            moi('CGEA');
            component.dossier = dossier('RECU', { isConfidential: false });
            expect(libelles()).toContain('Marquer confidentiel');
            expect(libelles().some(l => l.startsWith('Priorité'))).toBeTrue();

            component.dossier = dossier('RECU', { isConfidential: true });
            expect(libelles()).toContain('Retirer la confidentialité');

            component.dossier = dossier('CLOS');
            expect(libelles()).not.toContain('Marquer confidentiel');
        });

        it('les pièces du quitus, de la réponse motivée ou de la lettre suivent l\'étape et le rôle', () => {
            moi('CGE');
            component.dossier = dossier('DECISION_RENDUE', { decisionCGE: { decision: 'SUITE' } });
            expect(libelles()).toContain('Quitus du CGE');
            expect(libelles()).toContain('Accusé de réception');
            expect(libelles()).toContain('Lettre au plaignant');
            expect(libelles()).not.toContain('Réponse motivée');

            component.dossier = dossier('CLOS', { decisionCGE: { decision: 'CLASSEMENT' } });
            expect(libelles()).toContain('Réponse motivée');
            expect(libelles()).toContain('Résumé de clôture');
        });

        it('un clic sur un élément du menu lance l\'action correspondante', () => {
            moi('CGE');
            component.dossier = dossier('EN_REVUE_CTADP');
            const espion = spyOn(component, 'openTransfer');

            item('Transférer à une institution').command!({} as any);

            expect(espion).toHaveBeenCalledTimes(1);
        });

        it('un document en cours de préparation ne peut pas être relancé', () => {
            moi('AGENT_BRPD');
            component.dossier = dossier('SOUMIS');
            component.downloadingRecepisse = true;

            expect(item('Récépissé').disabled).toBeTrue();
        });
    });

    describe('fenêtre de confirmation partagée avec la liste', () => {
        it('chaque action simple ouvre la fenêtre partagée, avec la vérification avant d\'agir', () => {
            const attendu: [string, string][] = [
                ['openRegister', 'enregistrer'], ['openStartStudy', 'demarrer-etude'], ['openSubmitCtadp', 'soumettre-ctadp'],
                ['openComplementReceived', 'complement-recu'], ['openDeclareAdmissible', 'declarer-recevable'],
                ['openDeclareInadmissible', 'declarer-irrecevable'], ['openClose', 'cloturer']
            ];
            for (const [methode, action] of attendu) {
                component.actionEnCours = null;

                (component as any)[methode]();

                expect(component.actionEnCours).withContext(methode).toBe(action as any);
            }
        });

        it('une fois l\'action faite, le dossier affiché est celui que rend le serveur et la fenêtre se ferme', () => {
            component.dossier = dossier('EN_REVUE_CTADP');
            component.actionEnCours = 'declarer-recevable';

            component.apresTransition(dossier('RECEVABLE', { version: 5 }));

            expect(component.dossier?.status).toBe('RECEVABLE');
            expect(component.actionEnCours).toBeNull();
        });
    });

    describe('action demandée depuis le menu « ⋯ » de la liste (?action=…)', () => {
        function moi(...mesRoles: string[]): void {
            spyOn(TestBed.inject(KeycloakService), 'hasAnyRole').and.callFake((r: string[]) => r.some(x => mesRoles.includes(x)));
        }

        it('ouvre la fenêtre de l\'action demandée, si elle est bien à la portée de cet agent', () => {
            moi('CGE');
            actionDemandee = 'declarer-recevable';
            component.dossier = dossier('EN_REVUE_CTADP');
            const espion = spyOn(component, 'openDeclareAdmissible');
            spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

            component.ouvrirActionDemandee();

            expect(espion).toHaveBeenCalledTimes(1);
        });

        it('n\'ouvre rien si l\'action n\'est pas permise à cet agent : l\'adresse ne remplace pas ses droits', () => {
            moi('AGENT_BRPD');
            actionDemandee = 'declarer-recevable';
            component.dossier = dossier('EN_REVUE_CTADP');
            const espion = spyOn(component, 'openDeclareAdmissible');
            spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

            component.ouvrirActionDemandee();

            expect(espion).not.toHaveBeenCalled();
        });

        it('n\'ouvre rien si l\'étape du dossier a changé entre-temps', () => {
            moi('CGE');
            actionDemandee = 'declarer-recevable';
            component.dossier = dossier('EN_INVESTIGATION');
            const espion = spyOn(component, 'openDeclareAdmissible');
            spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

            component.ouvrirActionDemandee();

            expect(espion).not.toHaveBeenCalled();
        });

        it('ignore une valeur inconnue ou absente', () => {
            moi('CGE');
            component.dossier = dossier('EN_REVUE_CTADP');
            const espion = spyOn(component, 'lancerAction');

            actionDemandee = null;
            component.ouvrirActionDemandee();
            actionDemandee = 'supprimer-tout';
            component.ouvrirActionDemandee();

            expect(espion).not.toHaveBeenCalled();
        });

        it('retire « ?action » de l\'adresse après usage, pour ne pas rouvrir la fenêtre au rafraîchissement', () => {
            moi('CGE');
            actionDemandee = 'declarer-recevable';
            component.dossier = dossier('EN_REVUE_CTADP');
            spyOn(component, 'openDeclareAdmissible');
            const navigation = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

            component.ouvrirActionDemandee();

            expect(navigation).toHaveBeenCalledWith([], jasmine.objectContaining({
                queryParams: { action: null }, queryParamsHandling: 'merge', replaceUrl: true }));
        });
    });

    describe('prochaine étape (suite) : qui doit agir', () => {
        function moi(...mesRoles: string[]): void {
            spyOn(TestBed.inject(KeycloakService), 'hasAnyRole').and.callFake((r: string[]) => r.some(x => mesRoles.includes(x)));
        }

        it('dit à l\'agent dont c\'est le tour ce qu\'il fait', () => {
            moi('CGE');
            component.dossier = dossier('EN_REVUE_CTADP');

            expect(component.etapeSuivante()).toContain('Votre action');
            expect(component.etapeSuivante()).toContain('Déclarer recevable');
        });

        it('dit aux autres qui doit agir', () => {
            moi('AGENT_BRPD');
            component.dossier = dossier('EN_REVUE_CTADP');

            expect(component.etapeSuivante()).toContain('En attente');
            expect(component.etapeSuivante()).toContain('CGE');
        });

        it('ne dit rien d\'un dossier clos', () => {
            component.dossier = dossier('CLOS');

            expect(component.etapeSuivante()).toBeNull();
        });
    });

    describe('prochaine étape', () => {
        it('dit à qui peut enregistrer ce qu\'il doit faire', () => {
            droits = ['DOSSIER_ENREGISTRER'];
            component.dossier = dossier('SOUMIS');

            expect(component.etapeSuivante()).toContain('Enregistrer');
        });

        it('dit à qui ne le peut pas qui s\'en charge, au lieu de laisser un écran muet', () => {
            component.dossier = dossier('SOUMIS');

            const t = component.etapeSuivante()!;
            expect(t).toContain('agent BRPD');
            expect(t).toContain('numéro');
        });

        it('annonce l\'étude d\'opportunité pour un dossier reçu', () => {
            component.dossier = dossier('RECU');

            expect(component.etapeSuivante()).toContain('conseiller juridique');
        });

        it('ne dit rien pour les étapes plus avancées', () => {
            component.dossier = dossier('EN_INVESTIGATION');

            expect(component.etapeSuivante()).toBeNull();
        });
    });
});

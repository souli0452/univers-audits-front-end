import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { DepotPlainte } from './depot-plainte';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { GeographieService } from '../../../core/services/geographie.service';

describe('DepotPlainte', () => {
    let fixture: ComponentFixture<DepotPlainte>;
    let component: DepotPlainte;
    let messages: MessageService;
    let dossierService: { submit: jasmine.Spy };
    let attachmentService: { upload: jasmine.Spy };

    beforeEach(() => {
        dossierService = { submit: jasmine.createSpy('submit').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' })) };
        attachmentService = { upload: jasmine.createSpy('upload').and.returnValue(of({})) };

        TestBed.configureTestingModule({
            imports: [DepotPlainte],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: DossierService, useValue: dossierService },
                { provide: AttachmentService, useValue: attachmentService },
                { provide: GeographieService, useValue: { getArbre: () => of({ code: 'BF', libelle: 'Burkina Faso', regions: [] }) } }
            ]
        });
        fixture = TestBed.createComponent(DepotPlainte);
        component = fixture.componentInstance;
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
    });

    describe('étape « Coordonnées »', () => {
        beforeEach(() => {
            component.currentStep = 4;
            component.fd['dataProcessingConsent'].setValue(true);
        });

        it('refuse de passer à la confirmation avec un e-mail invalide', () => {
            component.fd['email'].setValue('pas-un-email');

            component.goToConfirmation();

            expect(component.currentStep).toBe(4);
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn', summary: 'E-mail invalide' }));
        });

        it('accepte un e-mail valide', () => {
            component.fd['email'].setValue('recette@example.com');

            component.goToConfirmation();

            expect(component.currentStep).toBe(5);
        });

        it('accepte un e-mail vide (champ optionnel)', () => {
            component.fd['email'].setValue('');

            component.goToConfirmation();

            expect(component.currentStep).toBe(5);
        });
    });

    describe('soumission', () => {
        it('avertit quand l’envoi des pièces jointes échoue, sans masquer que le dossier est créé', () => {
            attachmentService.upload.and.returnValue(throwError(() => new Error('upload KO')));
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            expect(component.showSuccess).toBeTrue();
            expect(component.createdAccessCode).toBe('ABCD1234');
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
                severity: 'warn', summary: 'Dossier créé'
            }));
        });

        it('n’envoie aucune donnée d’identité quand l’utilisateur choisit l’anonymat après les avoir saisies', () => {
            component.fd['organizationName'].setValue('Société Test');
            component.fd['firstName'].setValue('Awa');
            component.fd['lastName'].setValue('Traoré');
            component.fd['email'].setValue('awa@example.com');
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.fd['commune'].setValue('Ouagadougou');
            component.fd['province'].setValue('Kadiogo');

            component.setAnonymous();
            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.anonymous).toBeTrue();
            expect(request.declarantData.typeDeclarant).toBe('ANONYMOUS');
            for (const champ of ['organizationName', 'firstName', 'lastName', 'email', 'phoneNumber', 'commune', 'province']) {
                expect(request.declarantData[champ]).withContext(champ).toBeUndefined();
            }
        });

        it('envoie les coordonnées saisies quand le dépôt n’est pas anonyme', () => {
            component.fd['firstName'].setValue('Awa');
            component.fd['email'].setValue('awa@example.com');

            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.anonymous).toBeFalse();
            expect(request.declarantData.firstName).toBe('Awa');
            expect(request.declarantData.email).toBe('awa@example.com');
        });

        it('envoie les pièces jointes avec le code de suivi du dossier créé (sans quoi le back refuse la pièce)', () => {
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            const [dossierId, files, anonymous, accessCode] = attachmentService.upload.calls.mostRecent().args;
            expect(dossierId).toBe('d1');
            expect(files.length).toBe(1);
            expect(anonymous).toBeTrue();
            expect(accessCode).toBe('ABCD1234');
        });

        it('n’affiche aucun avertissement quand les pièces jointes sont bien envoyées', () => {
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            expect(component.showSuccess).toBeTrue();
            expect(messages.add).not.toHaveBeenCalled();
        });
    });

    describe('étape « Décrivez les faits »', () => {
        it('la description de « Plainte » n’annonce plus, mot pour mot, la question « Vous êtes » qui la suit', () => {
            const plainte = component.typeOptions.find(t => t.value === 'COMPLAINT')!;

            expect(plainte.description).not.toBe('Je suis la victime ou son représentant');
            for (const q of component.qualityOptions) {
                expect(plainte.description).not.toBe(q.label);
            }
        });

        it('« Dénonciation » et les deux choix de « Vous êtes » sont inchangés', () => {
            const denonciation = component.typeOptions.find(t => t.value === 'DENUNCIATION')!;

            expect(denonciation.description).toBe('Je signale des faits en tant que témoin');
            expect(component.qualityOptions.map(q => q.label)).toEqual(['Je suis la victime', 'Je représente la victime']);
        });
    });

    describe('pièces jointes', () => {
        const fichier = (nom: string) => new File(['x'], nom);
        const ajouter = (...noms: string[]) =>
            component.onFileSelect({ target: { files: noms.map(fichier) } });

        beforeEach(() => { component.currentStep = 3; fixture.detectChanges(); });

        it('affiche les formats acceptés dans la zone de dépôt', () => {
            expect((fixture.nativeElement as HTMLElement).textContent)
                .toContain('Formats acceptés : PDF, DOC, DOCX, JPG, JPEG, PNG, MP3, MP4, AVI, MOV');
        });

        it('refuse un format non accepté, même glissé dans la zone, et le dit', () => {
            ajouter('virus.exe', 'preuve.pdf');

            expect(component.attachments.map(f => f.name)).toEqual(['preuve.pdf']);
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Format non accepté' }));
        });

        it('limite à 5 fichiers et prévient quand il y en a trop', () => {
            ajouter('1.pdf', '2.pdf', '3.pdf', '4.pdf', '5.pdf', '6.pdf');

            expect(component.attachments.length).toBe(5);
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Nombre de fichiers limité' }));
        });
    });

    describe('origine géographique', () => {
        it('envoie la région, la province et la commune choisies quand le dépôt n\'est pas anonyme', () => {
            component.onOrigine({ origineRegionId: 'r1', origineProvinceId: 'p1', origineCommuneId: 'c1' });
            component.fd['firstName'].setValue('Awa');

            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.origineRegionId).toBe('r1');
            expect(request.origineProvinceId).toBe('p1');
            expect(request.origineCommuneId).toBe('c1');
        });

        it('ne garde que la région pour un dépôt anonyme : une commune pourrait identifier le lanceur d\'alerte', () => {
            component.onOrigine({ origineRegionId: 'r1', origineProvinceId: 'p1', origineCommuneId: 'c1' });

            component.setAnonymous();
            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.origineRegionId).toBe('r1');
            expect(request.origineProvinceId).toBeUndefined();
            expect(request.origineCommuneId).toBeUndefined();
        });

        it('envoie le pays pour un déclarant à l\'étranger', () => {
            component.onOrigine({ paysOrigine: 'France' });

            component.submit();

            expect(dossierService.submit.calls.mostRecent().args[0].paysOrigine).toBe('France');
        });

        it('n\'envoie aucune origine quand rien n\'est choisi', () => {
            component.submit();

            const request = dossierService.submit.calls.mostRecent().args[0];
            expect(request.origineRegionId).toBeUndefined();
            expect(request.paysOrigine).toBeUndefined();
        });
    });

    it("n'affiche aucun texte d'aide sous le choix de l'origine géographique", () => {
        component.currentStep = 4;
        fixture.detectChanges();

        const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(texte).toContain("D'où nous écrivez-vous");
        expect(texte).not.toContain('Sert uniquement aux statistiques');
        expect(texte).not.toContain('seule la région est conservée');
        expect(texte).not.toContain("n'a pas pu être chargée");
    });

    it("le pied de page de la page de dépôt n'a pas d'icône devant « ASCE-LC »", () => {
        fixture.detectChanges();

        const pied = (fixture.nativeElement as HTMLElement).querySelector('.page-foot')!;
        expect(pied.textContent).toContain("ASCE-LC — Autorité Supérieure de Contrôle d'État — Burkina Faso");
        expect(pied.querySelector('i, img, svg')).toBeNull();
    });

    describe("aucune promesse de SMS tant que l'envoi est désactivé", () => {
        function texte(): string {
            fixture.detectChanges();
            return (fixture.nativeElement as HTMLElement).textContent ?? '';
        }

        it("n'écrit jamais « SMS » aux étapes du formulaire", () => {
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.fd['email'].setValue('awa@example.com');
            component.fd['dataProcessingConsent'].setValue(true);

            for (const etape of [1, 2, 3, 4, 5]) {
                component.currentStep = etape;
                expect(texte()).withContext('étape ' + etape).not.toMatch(/sms/i);
            }
        });

        it("annonce une notification par e-mail quand une adresse est donnée", () => {
            component.fd['email'].setValue('awa@example.com');
            component.fd['dataProcessingConsent'].setValue(true);
            component.currentStep = 5;

            const t = texte();
            expect(t).toContain('Notifications prévues');
            expect(t).toContain('awa@example.com');
        });

        it("dit clairement qu'aucune notification ne sera envoyée sans e-mail, et de garder le code", () => {
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.fd['email'].setValue('');
            component.fd['dataProcessingConsent'].setValue(true);
            component.currentStep = 5;

            const t = texte();
            expect(t).toContain('Aucune notification');
            expect(t).toContain('code de suivi');
        });

        it("l'écran de succès ne parle pas de SMS", () => {
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.createdAccessCode = 'ABCD1234';
            component.showSuccess = true;

            expect(texte()).not.toMatch(/sms/i);
        });
    });

    describe('période approximative', () => {
        it('se choisit par un sélecteur de mois (calendrier ou saisie)', () => {
            component.currentStep = 2;
            fixture.detectChanges();

            const champ = (fixture.nativeElement as HTMLElement).querySelector('input[type="month"]') as HTMLInputElement;
            expect(champ).not.toBeNull();
            expect(champ.max).toMatch(/^\d{4}-\d{2}$/);          // jamais dans le futur
        });

        it("garde un texte lisible pour l'agent : « Janvier 2025 »", () => {
            component.onPeriode('2025-01');
            expect(component.f['incidentPeriod'].value).toBe('Janvier 2025');

            component.onPeriode('2024-12');
            expect(component.f['incidentPeriod'].value).toBe('Décembre 2024');
        });

        it("vide la période quand on efface le mois", () => {
            component.onPeriode('2025-03');
            component.onPeriode('');

            expect(component.f['incidentPeriod'].value).toBe('');
        });

        it('envoie la période au serveur', () => {
            component.onPeriode('2025-06');

            component.submit();

            expect(dossierService.submit.calls.mostRecent().args[0].incidentPeriod).toBe('Juin 2025');
        });
    });

    describe('parcours en cinq écrans', () => {
        const texte = (): string => {
            fixture.detectChanges();
            return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
        };
        const present = (sel: string): boolean => !!(fixture.nativeElement as HTMLElement).querySelector(sel);

        it('annonce cinq étapes, la sécurité en premier', () => {
            expect(component.steps.map(e => e.label)).toEqual(
                ['Votre sécurité', 'Les faits', 'Preuves', 'Coordonnées', 'Confirmation']);
        });

        it('commence par la sécurité : rien à remplir, un seul bouton pour poursuivre', () => {
            expect(component.currentStep).toBe(1);
            const t = texte();

            expect(t).toContain('Votre sécurité');
            expect(t).toContain("J'ai compris, commencer");
            expect(t).not.toContain('Décrivez les faits');
        });

        it("dit la vérité sur l'anonymat : adresse non conservée dans le dossier, mais journaux techniques du serveur", () => {
            const t = texte();

            expect(t).toContain('Rester anonyme est possible');
            expect(t).toContain("adresse de connexion (adresse IP) n'est pas conservée dans le dossier");
            expect(t).toContain('journaux techniques du serveur');
            expect(t).toContain('code de suivi');
            expect(t).toContain('voix');
        });

        it('explique que la protection de lanceur d\'alerte n\'est pas l\'anonymat, avant de la demander', () => {
            const t = texte();

            expect(t).toContain("La protection de lanceur d'alerte est différente de l'anonymat");
        });

        it('« J\'ai compris, commencer » ouvre les faits sans rien valider', () => {
            component.commencer();

            expect(component.currentStep).toBe(2);
        });

        it('les faits ne contiennent ni l\'audio ni les pièces jointes', () => {
            component.currentStep = 2;
            const t = texte();

            expect(t).toContain('Décrivez les faits');
            expect(t).not.toContain('Témoignage audio');
            expect(t).not.toContain('Pièces jointes');
        });

        it('les faits exigent l\'objet et la description avant de continuer', () => {
            component.currentStep = 2;

            component.goToPreuves();
            expect(component.currentStep).toBe(2);

            component.f['object'].setValue('Détournement de fonds dans un service');
            component.f['description'].setValue('Des faits précis, avec des dates et des noms.');
            component.goToPreuves();
            expect(component.currentStep).toBe(3);
        });

        it('les preuves regroupent l\'audio et les pièces jointes, et rien n\'y est obligatoire', () => {
            component.currentStep = 3;
            const t = texte();

            expect(t).toContain('Témoignage audio');
            expect(t).toContain('Pièces jointes');
            component.goToCoordonnees();
            expect(component.currentStep).toBe(4);
        });

        it('l\'origine géographique se renseigne avec les coordonnées, pas avec les faits', () => {
            component.currentStep = 2; texte();
            expect(present('app-origine-geographique')).toBeFalse();

            component.currentStep = 4; texte();
            expect(present('app-origine-geographique')).toBeTrue();
        });

        it('la confirmation permet de revenir aux coordonnées', () => {
            component.currentStep = 5;
            const t = texte();

            expect(t).toContain('Soumettre mon signalement');
            expect(t).toContain('Précédent');
        });
    });

    describe("protection de lanceur d'alerte : lue avant d'être demandée", () => {
        let confirmation: { confirm: jasmine.Spy };

        beforeEach(() => {
            component.currentStep = 4;
            component.fd['anonymous'].setValue(false);
            confirmation = { confirm: spyOn((component as any).confirmationService, 'confirm') } as any;
            confirmation.confirm.and.callFake((c: any) => c.accept && c.accept());
        });

        const texte = (): string => {
            fixture.detectChanges();
            return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
        };

        it("n'est plus une simple case à cocher : un bouton ouvre les conditions", () => {
            const t = texte();

            expect(t).toContain("Protection de lanceur d'alerte");
            expect(t).toContain('Lire les conditions');
            expect(t).toContain("Vous n'êtes pas obligé de la demander");
            expect((fixture.nativeElement as HTMLElement).querySelector('.protection-trigger')).toBeNull();
        });

        it("n'est pas proposée à un déclarant anonyme", () => {
            component.fd['anonymous'].setValue(true);

            expect(texte()).not.toContain('Lire les conditions');
        });

        it('à l\'ouverture, rien n\'est coché et la lecture n\'est pas faite', () => {
            component.cond1 = component.cond2 = component.cond3 = true;

            component.ouvrirProtection();

            expect(component.showProtectionDialog).toBeTrue();
            expect(component.protectionLue).toBeFalse();
            expect([component.cond1, component.cond2, component.cond3]).toEqual([false, false, false]);
        });

        it('la lecture n\'est acquise qu\'une fois le texte parcouru jusqu\'en bas', () => {
            component.ouvrirProtection();

            component.onScrollProtection({ scrollTop: 0, clientHeight: 300, scrollHeight: 900 });
            expect(component.protectionLue).toBeFalse();

            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            expect(component.protectionLue).toBeTrue();
        });

        it('explique ce que la protection change et ce qu\'elle ne change pas', () => {
            component.ouvrirProtection();
            const t = texte();

            expect(t).toContain('Ce que cette protection change');
            expect(t).toContain("Ce qu'elle ne change pas");
            expect(t).toContain('sanctions pénales');
        });

        it('ne se confirme pas sans avoir tout lu et coché les trois conditions', () => {
            component.ouvrirProtection();
            component.cond1 = component.cond2 = component.cond3 = true;

            component.confirmProtection();                       // pas encore lu jusqu'en bas
            expect(confirmation.confirm).not.toHaveBeenCalled();

            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond3 = false;
            component.confirmProtection();                       // une condition manque
            expect(confirmation.confirm).not.toHaveBeenCalled();
            expect(component.fd['protectionRequested'].value).toBeFalse();
        });

        it('une fois lue, cochée et confirmée sur l\'honneur : demandée, et la fenêtre se ferme', () => {
            component.ouvrirProtection();
            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond1 = component.cond2 = component.cond3 = true;

            component.confirmProtection();

            expect(confirmation.confirm).toHaveBeenCalledTimes(1);
            expect(component.fd['protectionRequested'].value).toBeTrue();
            expect(component.protectionAcknowledged).toBeTrue();
            expect(component.showProtectionDialog).toBeFalse();
        });

        it('fermer la fenêtre sans confirmer ne demande aucune protection', () => {
            component.ouvrirProtection();
            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond1 = true;

            component.fermerProtection();

            expect(component.showProtectionDialog).toBeFalse();
            expect(component.fd['protectionRequested'].value).toBeFalse();
            expect(component.protectionAcknowledged).toBeFalse();
        });

        it('la demande confirmée part avec le signalement', () => {
            component.ouvrirProtection();
            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond1 = component.cond2 = component.cond3 = true;
            component.confirmProtection();
            component.fd['firstName'].setValue('Awa');

            component.submit();

            const demande = dossierService.submit.calls.mostRecent().args[0];
            expect(demande.declarantData.protectionRequested).toBeTrue();
            expect(demande.declarantData.protectionAcknowledged).toBeTrue();
        });

        it('retirer la demande remet tout à zéro', () => {
            component.ouvrirProtection();
            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond1 = component.cond2 = component.cond3 = true;
            component.confirmProtection();

            component.cancelProtection();

            expect(component.fd['protectionRequested'].value).toBeFalse();
            expect(component.protectionAcknowledged).toBeFalse();
        });
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { DepotPlainte } from './depot-plainte';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { GeographieService } from '../../../core/services/geographie.service';

const RECIT = 'Un agent de la mairie m\'a demandé de l\'argent pour un acte de naissance.';

describe('DepotPlainte (page unique)', () => {
    let fixture: ComponentFixture<DepotPlainte>;
    let component: DepotPlainte;
    let messages: MessageService;
    let dossierService: { submit: jasmine.Spy };
    let attachmentService: { upload: jasmine.Spy };

    const racine = () => fixture.nativeElement as HTMLElement;
    const texte = (): string => {
        fixture.detectChanges();
        return (racine().textContent ?? '').replace(/\s+/g, ' ');
    };
    const ecrire = (recit: string = RECIT) => component.f['description'].setValue(recit);
    const envoyee = () => dossierService.submit.calls.mostRecent().args[0];

    /** Crée la page ; `mode` simule « ?mode=vocal » dans l'adresse (liens de l'accueil). */
    function creer(mode?: string): void {
        TestBed.resetTestingModule();
        dossierService = { submit: jasmine.createSpy('submit').and.returnValue(of({ id: 'd1', accessCode: 'ABCD1234' })) };
        attachmentService = { upload: jasmine.createSpy('upload').and.returnValue(of({})) };

        TestBed.configureTestingModule({
            imports: [DepotPlainte],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: DossierService, useValue: dossierService },
                { provide: AttachmentService, useValue: attachmentService },
                { provide: GeographieService, useValue: { getArbre: () => of({ code: 'BF', libelle: 'Burkina Faso', regions: [] }) } },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(mode ? { mode } : {}) } } }
            ]
        });
        fixture = TestBed.createComponent(DepotPlainte);
        component = fixture.componentInstance;
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
        fixture.detectChanges();
    }

    beforeEach(() => creer());

    describe('une seule page, courte à lire', () => {
        it('n\'a plus d\'étapes : ni barre de progression, ni « Étape », ni écran de sécurité obligatoire', () => {
            const t = texte();

            expect(racine().querySelector('.steps-bar')).toBeNull();
            expect(t).not.toMatch(/étape \d/i);
            expect(t).not.toContain("J'ai compris, commencer");
        });

        it('ouvre sur le récit : un titre, une phrase d\'introduction, puis le champ à remplir', () => {
            const t = texte();

            expect(racine().querySelector('h1')!.textContent).toContain('Racontez-nous ce qui s\'est passé');
            expect(t).toContain('Vous restez anonyme');
            expect(racine().querySelector('textarea#recit')).not.toBeNull();
        });

        it('demande peu de lecture avant le premier champ : moins de 60 mots', () => {
            const zone = racine().querySelector('.content')!;
            const champ = racine().querySelector('textarea#recit')!;
            const avant: string[] = [];
            const parcours = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
            while (parcours.nextNode()) {
                const n = parcours.currentNode;
                if (champ.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) { break; }
                avant.push(n.textContent ?? '');
            }
            const mots = avant.join(' ').split(/\s+/).filter(Boolean).length;

            expect(mots).toBeLessThan(60);
        });

        it('garde le détail de la protection à la demande, dans une fenêtre', () => {
            expect(component.showSecurite).toBeFalse();
            expect(texte()).toContain('Comment vos données sont protégées');
            expect(texte()).not.toContain('Votre code de suivi est la seule clé');

            component.showSecurite = true;
            const t = texte();

            expect(t).toContain('Rester anonyme est possible');
            expect(t).toContain("adresse de connexion (adresse IP) n'est pas conservée dans le dossier");
            expect(t).toContain('journaux techniques du serveur');
            expect(t).toContain("La protection de lanceur d'alerte est différente de l'anonymat");
            expect(t).toContain('voix');
            expect(t).toContain('code de suivi');
        });

        it('les précisions, les preuves et les coordonnées sont repliées et facultatives', () => {
            const t = texte();

            expect(component.ouvert).toEqual({ precisions: false, preuves: false, coordonnees: false });
            expect(t).toContain('Ajouter des précisions');
            expect(t).toContain('Ajouter des preuves');
            expect(t).toContain('Laisser mes coordonnées');
            expect(racine().querySelector('input[type="month"]')).toBeNull();
            expect(racine().querySelector('app-origine-geographique')).toBeNull();
        });

        it('le pied de page est inchangé et sans icône', () => {
            const pied = racine().querySelector('.page-foot')!;

            expect(pied.textContent).toContain("ASCE-LC — Autorité Supérieure de Contrôle d'État — Burkina Faso");
            expect(pied.querySelector('i, img, svg')).toBeNull();
        });
    });

    describe('lisibilité', () => {
        const taille = (sel: string): number =>
            parseFloat(getComputedStyle(racine().querySelector(sel)!).fontSize);

        it('le récit et les libellés sont grands', () => {
            expect(taille('textarea#recit')).toBeGreaterThanOrEqual(18);
            expect(taille('label[for="recit"]')).toBeGreaterThanOrEqual(17);
        });

        it('aucune aide ni indication n\'est plus petite que 15 px', () => {
            const petits = Array.from(racine().querySelectorAll<HTMLElement>('.hint, .error-msg, .opt'))
                .filter(e => parseFloat(getComputedStyle(e).fontSize) < 15)
                .map(e => e.textContent);

            expect(petits).toEqual([]);
        });

        it('les champs des précisions (montant, pays, région) sont aussi lisibles que le reste', () => {
            component.ouvert.precisions = true;
            fixture.detectChanges();
            const mesure = (sel: string) => {
                const e = racine().querySelector<HTMLElement>(sel)!;
                expect(e).withContext(sel).not.toBeNull();
                return { taille: parseFloat(getComputedStyle(e).fontSize), hauteur: e.getBoundingClientRect().height };
            };

            expect(mesure('p-inputnumber input').taille).toBeGreaterThanOrEqual(17);
            expect(mesure('p-inputnumber input').hauteur).toBeGreaterThanOrEqual(48);
            expect(mesure('app-origine-geographique label').taille).toBeGreaterThanOrEqual(16);
            expect(mesure('app-origine-geographique select').taille).toBeGreaterThanOrEqual(17);
            expect(mesure('app-origine-geographique select').hauteur).toBeGreaterThanOrEqual(48);
        });

        it('les boutons d\'action font au moins 52 px de haut', () => {
            const envoyer = racine().querySelector<HTMLElement>('.btn-envoyer')!;
            const effacer = racine().querySelector<HTMLElement>('.btn-effacer')!;

            expect(envoyer.getBoundingClientRect().height).toBeGreaterThanOrEqual(52);
            expect(effacer.getBoundingClientRect().height).toBeGreaterThanOrEqual(52);
        });
    });

    describe('un seul champ obligatoire : le récit', () => {
        it('refuse un récit vide ou trop court, et le dit', () => {
            component.ouvrirRecapitulatif();
            expect(component.showRecap).toBeFalse();

            ecrire('Trop court');
            component.ouvrirRecapitulatif();
            expect(component.showRecap).toBeFalse();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn', summary: 'Votre récit' }));
        });

        it('accepte un récit suffisant sans rien d\'autre', () => {
            ecrire();

            component.ouvrirRecapitulatif();

            expect(component.showRecap).toBeTrue();
        });

        it('accepte aussi un message vocal seul', () => {
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });

            component.ouvrirRecapitulatif();

            expect(component.showRecap).toBeTrue();
        });

        it('un message vocal seul reçoit un objet lisible pour l\'agent', () => {
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });

            component.submit();

            expect(envoyee().object).toBe('Signalement déposé par message vocal');
            expect(envoyee().description).toBeUndefined();
        });

        it('l\'objet est tiré du récit : le citoyen n\'écrit plus de résumé', () => {
            ecrire('Le maire a pris de l\'argent pour un marché. La suite est longue et détaillée.');

            component.submit();

            expect(envoyee().object).toBe('Le maire a pris de l\'argent pour un marché.');
            expect(envoyee().description).toBe('Le maire a pris de l\'argent pour un marché. La suite est longue et détaillée.');
        });
    });

    describe('anonyme par défaut', () => {
        it('un dépôt sans rien d\'autre est une dénonciation anonyme, sans aucune donnée d\'identité', () => {
            ecrire();

            component.submit();

            const r = envoyee();
            expect(r.anonymous).toBeTrue();
            expect(r.type).toBe('DENUNCIATION');
            expect(r.quality).toBe('TEMOIN');
            expect(r.declarantData.typeDeclarant).toBe('ANONYMOUS');
            for (const champ of ['organizationName', 'firstName', 'lastName', 'email', 'phoneNumber']) {
                expect(r.declarantData[champ]).withContext(champ).toBeUndefined();
            }
        });

        it('les champs d\'identité n\'apparaissent pas tant que le citoyen n\'ouvre pas « Laisser mes coordonnées »', () => {
            expect(racine().querySelector('#prenom')).toBeNull();
            expect(texte()).toContain('Vous restez anonyme');
        });

        it('aucune case de consentement n\'est exigée à un dépôt anonyme : une phrase d\'information suffit', () => {
            const t = texte();

            expect(racine().querySelector('#consent')).toBeNull();
            expect(t).toContain('En envoyant, vous acceptez');
        });

        it('« Laisser mes coordonnées » ouvre les champs et prévient qu\'on pourra répondre', () => {
            component.laisserCoordonnees();
            const t = texte();

            expect(component.fd['anonymous'].value).toBeFalse();
            expect(racine().querySelector('#prenom')).not.toBeNull();
            expect(racine().querySelector('#email')).not.toBeNull();
            expect(t).toContain('Vous êtes');
        });

        it('reprendre l\'anonymat efface toute identité saisie avant l\'envoi', () => {
            component.laisserCoordonnees();
            component.fd['organizationName'].setValue('Société Test');
            component.fd['firstName'].setValue('Awa');
            component.fd['lastName'].setValue('Traoré');
            component.fd['email'].setValue('awa@example.com');
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            ecrire();

            component.setAnonymous();
            component.submit();

            const r = envoyee();
            expect(r.anonymous).toBeTrue();
            expect(r.declarantData.typeDeclarant).toBe('ANONYMOUS');
            for (const champ of ['organizationName', 'firstName', 'lastName', 'email', 'phoneNumber']) {
                expect(r.declarantData[champ]).withContext(champ).toBeUndefined();
            }
        });

        it('envoie les coordonnées saisies quand le citoyen les laisse', () => {
            component.laisserCoordonnees();
            component.fd['firstName'].setValue('Awa');
            component.fd['email'].setValue('awa@example.com');
            ecrire();

            component.submit();

            const r = envoyee();
            expect(r.anonymous).toBeFalse();
            expect(r.declarantData.firstName).toBe('Awa');
            expect(r.declarantData.email).toBe('awa@example.com');
            expect(r.declarantData.typeDeclarant).toBe('CITIZEN');
        });

        it('une victime identifiée dépose une plainte, un témoin une dénonciation', () => {
            component.laisserCoordonnees();

            component.selectType('COMPLAINT');
            ecrire(); component.submit();
            expect(envoyee().type).toBe('COMPLAINT');
            expect(envoyee().quality).toBe('VICTIME');

            component.selectType('DENUNCIATION');
            component.submit();
            expect(envoyee().type).toBe('DENUNCIATION');
            expect(envoyee().quality).toBe('TEMOIN');
        });

        it('redevenir anonyme bascule une plainte en dénonciation et le dit', () => {
            component.laisserCoordonnees();
            component.selectType('COMPLAINT');

            component.setAnonymous();

            expect(component.f['type'].value).toBe('DENUNCIATION');
            expect(component.f['quality'].value).toBe('TEMOIN');
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Signalement basculé en dénonciation' }));
        });
    });

    describe('récapitulatif avant l\'envoi', () => {
        it('« Envoyer » ouvre un récapitulatif sans rien envoyer', () => {
            ecrire();

            component.ouvrirRecapitulatif();

            expect(component.showRecap).toBeTrue();
            expect(dossierService.submit).not.toHaveBeenCalled();
        });

        it('le récapitulatif montre le récit, l\'anonymat et les pièces, et laisse modifier', () => {
            ecrire();
            component.attachments = [new File(['x'], 'preuve.pdf')];
            component.showRecap = true;
            const t = texte();

            expect(t).toContain('Un agent de la mairie');
            expect(t).toContain('Anonyme');
            expect(t).toContain('1 pièce');
            expect(t).toContain('Modifier');
            expect(t).toContain('Envoyer mon signalement');
        });

        it('le récapitulatif écrit le montant lisiblement : « 250 000 FCFA », pas « 250000 »', () => {
            ecrire('À la mairie de Koudougou, un agent m\'a demandé 250000 FCFA en mars 2025.');
            component.analyserRecit();
            component.showRecap = true;
            fixture.detectChanges();

            const ligne = Array.from(racine().querySelectorAll('.recap-row'))
                .find(l => l.textContent?.includes('Montant'))!;
            expect(ligne.textContent!.replace(/[  \s]+/g, ' ')).toContain('250 000 FCFA');
        });

        it('confirmer envoie une seule fois et ferme le récapitulatif', () => {
            ecrire();
            component.showRecap = true;

            component.confirmerEnvoi();

            expect(dossierService.submit).toHaveBeenCalledTimes(1);
            expect(component.showRecap).toBeFalse();
            expect(component.showSuccess).toBeTrue();
        });

        it('un dépôt identifié exige l\'e-mail valide et le consentement avant le récapitulatif', () => {
            ecrire();
            component.laisserCoordonnees();

            component.fd['email'].setValue('pas-un-email');
            component.ouvrirRecapitulatif();
            expect(component.showRecap).toBeFalse();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'E-mail invalide' }));

            component.fd['email'].setValue('awa@example.com');
            component.ouvrirRecapitulatif();
            expect(component.showRecap).toBeFalse();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Consentement requis' }));

            component.fd['dataProcessingConsent'].setValue(true);
            component.ouvrirRecapitulatif();
            expect(component.showRecap).toBeTrue();
        });

        it('accepte un e-mail vide (facultatif)', () => {
            ecrire();
            component.laisserCoordonnees();
            component.fd['dataProcessingConsent'].setValue(true);

            component.ouvrirRecapitulatif();

            expect(component.showRecap).toBeTrue();
        });

        it('annonce une notification par e-mail quand une adresse est donnée', () => {
            ecrire();
            component.laisserCoordonnees();
            component.fd['email'].setValue('awa@example.com');
            component.showRecap = true;
            const t = texte();

            expect(t).toContain('Notifications prévues');
            expect(t).toContain('awa@example.com');
        });

        it('dit qu\'aucune notification ne sera envoyée sans e-mail, et de garder le code', () => {
            ecrire();
            component.laisserCoordonnees();
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.showRecap = true;
            const t = texte();

            expect(t).toContain('Aucune notification');
            expect(t).toContain('code de suivi');
        });

        it('« Effacer » demande confirmation, puis remet la page à zéro', () => {
            spyOn((component as any).confirmationService, 'confirm').and.callFake((c: any) => c.accept && c.accept());
            ecrire();
            component.attachments = [new File(['x'], 'preuve.pdf')];
            component.laisserCoordonnees();

            component.effacer();

            expect((component as any).confirmationService.confirm).toHaveBeenCalled();
            expect(component.f['description'].value).toBe('');
            expect(component.attachments.length).toBe(0);
            expect(component.fd['anonymous'].value).toBeTrue();
            expect(component.ouvert.coordonnees).toBeFalse();
        });
    });

    describe('indices tirés du récit', () => {
        const RECIT_RICHE = 'À la mairie de Koudougou, un agent m\'a demandé 250 000 FCFA en mars 2025 pour un acte.';

        it('préremplit lieu, période et montant quand le citoyen ne les a pas donnés, et les signale à l\'ouverture du volet', () => {
            ecrire(RECIT_RICHE);

            component.analyserRecit();
            component.ouvert.precisions = true;
            const t = texte();

            expect(component.f['incidentLocation'].value).toBe('Mairie de Koudougou');
            expect(component.f['incidentPeriod'].value).toBe('Mars 2025');
            expect(component.f['estimatedLoss'].value).toBe(250000);
            expect(t).toContain('Repéré dans votre récit');
        });

        it('n\'ouvre jamais le volet tout seul : la page ne bouge pas quand le citoyen touche « Envoyer »', () => {
            ecrire(RECIT_RICHE);

            component.analyserRecit();

            expect(component.ouvert.precisions).toBeFalse();
        });

        it('le récapitulatif dit ce qui a été repéré dans le récit', () => {
            ecrire(RECIT_RICHE);

            component.ouvrirRecapitulatif();

            expect(texte()).toContain('Repéré dans votre récit');
        });

        it('n\'écrase jamais ce que le citoyen a saisi lui-même', () => {
            component.f['incidentLocation'].setValue('Service des impôts');
            component.f['incidentLocation'].markAsDirty();
            ecrire(RECIT_RICHE);

            component.analyserRecit();

            expect(component.f['incidentLocation'].value).toBe('Service des impôts');
            expect(component.suggere.lieu).toBeFalse();
            expect(component.f['estimatedLoss'].value).toBe(250000);
        });

        it('met à jour une valeur repérée quand le récit change, tant que le citoyen n\'y a pas touché', () => {
            ecrire(RECIT_RICHE);
            component.analyserRecit();

            ecrire('À la mairie de Ziniaré, un agent m\'a demandé 90 000 FCFA.');
            component.analyserRecit();

            expect(component.f['incidentLocation'].value).toBe('Mairie de Ziniaré');
            expect(component.f['estimatedLoss'].value).toBe(90000);
        });

        it('ne remplit rien et n\'ouvre rien quand le récit ne contient aucun indice', () => {
            ecrire('Je veux signaler un problème grave dans mon service.');

            component.analyserRecit();

            expect(component.f['incidentLocation'].value).toBe('');
            expect(component.f['estimatedLoss'].value).toBeNull();
            expect(component.suggere).toEqual({ lieu: false, periode: false, montant: false });
        });

        it('les valeurs repérées partent avec le dépôt', () => {
            ecrire(RECIT_RICHE);
            component.analyserRecit();

            component.submit();

            expect(envoyee().incidentLocation).toBe('Mairie de Koudougou');
            expect(envoyee().incidentPeriod).toBe('Mars 2025');
            expect(envoyee().estimatedLoss).toBe(250000);
        });

        it('le récit complet est analysé avant l\'envoi même si le champ n\'a jamais perdu le focus', () => {
            ecrire(RECIT_RICHE);

            component.ouvrirRecapitulatif();

            expect(component.f['estimatedLoss'].value).toBe(250000);
        });
    });

    describe('soumission', () => {
        it('avertit quand l\'envoi des pièces jointes échoue, sans masquer que le dossier est créé', () => {
            attachmentService.upload.and.returnValue(throwError(() => new Error('upload KO')));
            ecrire();
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            expect(component.showSuccess).toBeTrue();
            expect(component.createdAccessCode).toBe('ABCD1234');
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn', summary: 'Dossier créé' }));
        });

        it('envoie les pièces jointes avec le code de suivi du dossier créé', () => {
            ecrire();
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            const [dossierId, files, anonymous, accessCode] = attachmentService.upload.calls.mostRecent().args;
            expect(dossierId).toBe('d1');
            expect(files.length).toBe(1);
            expect(anonymous).toBeTrue();
            expect(accessCode).toBe('ABCD1234');
        });

        it('n\'affiche aucun avertissement quand les pièces jointes sont bien envoyées', () => {
            ecrire();
            component.attachments = [new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' })];

            component.submit();

            expect(component.showSuccess).toBeTrue();
            expect(messages.add).not.toHaveBeenCalled();
        });

        it('l\'écran de succès ne parle pas de SMS', () => {
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.createdAccessCode = 'ABCD1234';
            component.showSuccess = true;

            expect(texte()).not.toMatch(/sms/i);
        });

        it('la page ne promet jamais de SMS, même avec un téléphone et un e-mail saisis', () => {
            component.laisserCoordonnees();
            component.ouvert.precisions = component.ouvert.preuves = true;
            component.fd['phoneNumber'].setValue('+226 70 00 00 00');
            component.fd['email'].setValue('awa@example.com');
            component.showRecap = true;

            expect(texte()).not.toMatch(/sms/i);
        });
    });

    describe('pièces jointes', () => {
        const fichier = (nom: string) => new File(['x'], nom);
        const ajouter = (...noms: string[]) => component.onFileSelect({ target: { files: noms.map(fichier) } });

        beforeEach(() => { component.ouvert.preuves = true; });

        it('affiche les formats acceptés dans la zone de dépôt', () => {
            expect(texte()).toContain('Formats acceptés : PDF, DOC, DOCX, JPG, JPEG, PNG, MP3, MP4, AVI, MOV');
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

    describe('deux façons de raconter, une seule page : écrire ou parler', () => {
        const choix = (libelle: string) =>
            Array.from(racine().querySelectorAll<HTMLButtonElement>('.mode-choix button'))
                .find(b => b.textContent?.includes(libelle))!;

        it('propose « Écrire » et « Parler » en tête, écrire étant le choix de départ', () => {
            texte();

            expect(component.mode).toBe('ecrit');
            expect(choix('Écrire')).toBeDefined();
            expect(choix('Parler')).toBeDefined();
            expect(choix('Écrire').getAttribute('aria-pressed')).toBe('true');
            expect(choix('Parler').getAttribute('aria-pressed')).toBe('false');
            expect(racine().querySelector('textarea#recit')).not.toBeNull();
        });

        it('« ?mode=vocal » (lien « Parler » de l\'accueil) ouvre directement la page en mode vocal', () => {
            creer('vocal');

            expect(component.mode).toBe('vocal');
            expect(racine().querySelector('textarea#recit')).toBeNull();
            expect(racine().querySelector('.btn-parler')).not.toBeNull();
        });

        it('ignore une valeur inconnue dans l\'adresse', () => {
            creer('nimporte-quoi');

            expect(component.mode).toBe('ecrit');
        });

        it('en mode vocal : un grand bouton pour parler, les langues en toutes lettres, et l\'avertissement sur la voix', () => {
            component.choisirMode('vocal');
            const t = texte();

            expect(racine().querySelector('textarea#recit')).toBeNull();
            expect(racine().querySelector('.btn-parler')).not.toBeNull();
            expect(t).toContain('Parlez dans votre langue');
            expect(t).toContain('Mooré');
            expect(t).toContain('Dioula');
            expect(t).toContain('Fulfuldé');
            expect(t).toContain('Votre voix peut vous identifier');
        });

        it('en mode écrit : pas de second bouton d\'enregistrement, le choix « Parler » suffit', () => {
            texte();

            expect(racine().querySelector('.btn-parler')).toBeNull();
        });

        it('changer de mode ne perd ni le texte ni le message vocal', () => {
            ecrire();
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });
            component.audioUrl = 'blob:test';

            component.choisirMode('vocal');
            component.choisirMode('ecrit');

            expect(component.f['description'].value).toBe(RECIT);
            expect(component.audioBlob).not.toBeNull();
        });

        it('en mode écrit, un message vocal déjà enregistré reste visible et supprimable', () => {
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });
            component.audioUrl = 'blob:test';
            component.recordingDuration = 42;

            const t = texte();

            expect(t).toContain('Message vocal joint');
            expect(t).toContain('0:42');
            expect(racine().querySelector('.btn-supprimer-audio')).not.toBeNull();
        });

        it('« Je préfère écrire » ramène au mode écrit', () => {
            component.choisirMode('vocal');
            texte();

            (racine().querySelector('.lien-ecrire') as HTMLButtonElement).click();

            expect(component.mode).toBe('ecrit');
        });

        it('la langue parlée, si elle est choisie, est notée pour l\'agent qui écoutera le message', () => {
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });
            component.choisirLangue('Mooré');

            component.submit();

            expect(envoyee().object).toBe('Signalement déposé par message vocal');
            expect(envoyee().description).toBe('Message vocal en Mooré.');
        });

        it('sans langue choisie, un message vocal seul n\'a pas de description inventée', () => {
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });

            component.submit();

            expect(envoyee().description).toBeUndefined();
        });

        it('avec un récit écrit ET un message vocal, la langue est ajoutée à la suite du récit', () => {
            ecrire();
            component.audioBlob = new Blob(['x'], { type: 'audio/webm' });
            component.choisirLangue('Dioula');

            component.submit();

            expect(envoyee().description).toBe(`${RECIT}\n\nMessage vocal en Dioula.`);
        });

        it('la langue ne part pas sans message vocal', () => {
            ecrire();
            component.choisirLangue('Dioula');

            component.submit();

            expect(envoyee().description).toBe(RECIT);
        });

        it('choisir deux fois la même langue la retire (choix facultatif)', () => {
            component.choisirLangue('Mooré');
            component.choisirLangue('Mooré');

            expect(component.langueParlee).toBe('');
        });

        it('tout effacer remet le mode écrit et retire la langue', () => {
            spyOn((component as any).confirmationService, 'confirm').and.callFake((c: any) => c.accept && c.accept());
            component.choisirMode('vocal');
            component.choisirLangue('Mooré');

            component.effacer();

            expect(component.mode).toBe('ecrit');
            expect(component.langueParlee).toBe('');
        });
    });

    describe('preuves : photo, vidéo ou galerie', () => {
        const entree = (sel: string) => racine().querySelector<HTMLInputElement>(sel);

        beforeEach(() => { component.ouvert.preuves = true; texte(); });

        it('« Prendre une photo » ouvre directement l\'appareil photo du téléphone', () => {
            const photo = entree('input[type="file"][accept="image/*"][capture]');

            expect(photo).not.toBeNull();
            expect(photo!.getAttribute('capture')).toBe('environment');
            expect(texte()).toContain('Prendre une photo');
        });

        it('« Filmer une vidéo » ouvre directement la caméra', () => {
            const video = entree('input[type="file"][accept="video/*"][capture]');

            expect(video).not.toBeNull();
            expect(texte()).toContain('Filmer une vidéo');
        });

        it('« Choisir dans la galerie » ouvre la galerie et les fichiers, plusieurs à la fois, sans appareil photo', () => {
            const galerie = entree('input[type="file"][multiple]:not([capture])');

            expect(galerie).not.toBeNull();
            expect(texte()).toContain('Choisir dans la galerie');
            expect(galerie!.accept).toContain('.pdf');
            expect(galerie!.accept).toContain('.jpg');
        });

        it('les trois façons alimentent la même liste, limitée à 5 fichiers', () => {
            component.onFileSelect({ target: { files: [new File(['x'], 'photo.jpg', { type: 'image/jpeg' })] } });
            component.onFileSelect({ target: { files: [new File(['x'], 'film.mp4', { type: 'video/mp4' })] } });
            component.onFileSelect({ target: { files: [new File(['x'], 'acte.pdf', { type: 'application/pdf' })] } });

            expect(component.attachments.map(f => f.name)).toEqual(['photo.jpg', 'film.mp4', 'acte.pdf']);
        });

        it('montre une miniature pour une photo, une icône pour les autres fichiers', () => {
            component.attachments = [
                new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
                new File(['x'], 'acte.pdf', { type: 'application/pdf' })
            ];
            fixture.detectChanges();

            const lignes = racine().querySelectorAll('.file-item');
            expect(lignes[0].querySelector('img.miniature')).not.toBeNull();
            expect(lignes[1].querySelector('img.miniature')).toBeNull();
        });

        it('permet de reprendre le même fichier après l\'avoir retiré (la sélection du navigateur est vidée)', () => {
            const champ = { files: [new File(['x'], 'photo.jpg', { type: 'image/jpeg' })], value: 'C:\\fakepath\\photo.jpg' };

            component.onFileSelect({ target: champ });

            expect(champ.value).toBe('');
        });

        it('les boutons de preuves font au moins 52 px de haut', () => {
            const boutons = Array.from(racine().querySelectorAll<HTMLElement>('.btn-preuve'));

            expect(boutons.length).toBe(3);
            for (const b of boutons) {
                expect(b.getBoundingClientRect().height).toBeGreaterThanOrEqual(52);
            }
        });
    });

    describe('origine géographique', () => {
        it('envoie la région, la province et la commune choisies quand le dépôt n\'est pas anonyme', () => {
            component.laisserCoordonnees();
            component.onOrigine({ origineRegionId: 'r1', origineProvinceId: 'p1', origineCommuneId: 'c1' });
            ecrire();

            component.submit();

            expect(envoyee().origineRegionId).toBe('r1');
            expect(envoyee().origineProvinceId).toBe('p1');
            expect(envoyee().origineCommuneId).toBe('c1');
        });

        it('ne garde que la région pour un dépôt anonyme : une commune pourrait identifier le lanceur d\'alerte', () => {
            component.onOrigine({ origineRegionId: 'r1', origineProvinceId: 'p1', origineCommuneId: 'c1' });
            ecrire();

            component.submit();

            expect(envoyee().origineRegionId).toBe('r1');
            expect(envoyee().origineProvinceId).toBeUndefined();
            expect(envoyee().origineCommuneId).toBeUndefined();
        });

        it('envoie le pays pour un déclarant à l\'étranger', () => {
            ecrire();
            component.onOrigine({ paysOrigine: 'France' });

            component.submit();

            expect(envoyee().paysOrigine).toBe('France');
        });

        it('n\'envoie aucune origine quand rien n\'est choisi', () => {
            ecrire();

            component.submit();

            expect(envoyee().origineRegionId).toBeUndefined();
            expect(envoyee().paysOrigine).toBeUndefined();
        });

        it('se choisit dans les précisions, sans aucun texte d\'aide', () => {
            component.ouvert.precisions = true;
            const t = texte();

            expect(t).toContain("D'où nous écrivez-vous");
            expect(t).not.toContain('Sert uniquement aux statistiques');
            expect(t).not.toContain('seule la région est conservée');
            expect(t).not.toContain("n'a pas pu être chargée");
        });
    });

    describe('période : texte libre, jour précis, heure facultative', () => {
        beforeEach(() => { component.ouvert.precisions = true; fixture.detectChanges(); });

        it('propose un calendrier au jour près (jj/mm/aaaa), jamais dans le futur, et une heure', () => {
            const jour = racine().querySelector('input[type="date"]') as HTMLInputElement;
            const heure = racine().querySelector('input[type="time"]') as HTMLInputElement;

            expect(jour).not.toBeNull();
            expect(jour.max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(heure).not.toBeNull();
            expect(racine().querySelector('input[type="month"]')).toBeNull();
        });

        it("l'heure ne se choisit qu'une fois le jour connu", () => {
            const heure = () => racine().querySelector('input[type="time"]') as HTMLInputElement;
            expect(heure().disabled).toBeTrue();

            component.onJour('2025-03-15');
            fixture.detectChanges();

            expect(heure().disabled).toBeFalse();
        });

        it("écrit le jour choisi sous une forme lisible pour l'agent : « 15 mars 2025 »", () => {
            component.onJour('2025-03-15');
            expect(component.f['incidentPeriod'].value).toBe('15 mars 2025');

            component.onJour('2024-12-01');
            expect(component.f['incidentPeriod'].value).toBe('1 décembre 2024');
        });

        it("ajoute l'heure choisie : « 15 mars 2025 à 14h30 »", () => {
            component.onJour('2025-03-15');
            component.onHeure('14:30');
            expect(component.f['incidentPeriod'].value).toBe('15 mars 2025 à 14h30');

            component.onHeure('09:05');
            expect(component.f['incidentPeriod'].value).toBe('15 mars 2025 à 9h05');
        });

        it("garde l'heure quand on change de jour, et la retire quand on la vide", () => {
            component.onJour('2025-03-15');
            component.onHeure('14:30');

            component.onJour('2025-03-16');
            expect(component.f['incidentPeriod'].value).toBe('16 mars 2025 à 14h30');

            component.onHeure('');
            expect(component.f['incidentPeriod'].value).toBe('16 mars 2025');
        });

        it("effacer le jour vide la période et l'heure", () => {
            component.onJour('2025-03-15');
            component.onHeure('14:30');

            component.onJour('');

            expect(component.f['incidentPeriod'].value).toBe('');
            component.onJour('2025-03-17');
            expect(component.f['incidentPeriod'].value).toBe('17 mars 2025');
        });

        it('une heure donnée sans jour ne crée pas de période', () => {
            component.onHeure('14:30');

            expect(component.f['incidentPeriod'].value).toBe('');
        });

        it('le texte libre reste possible (« Mars 2025 », « depuis 6 mois »)', () => {
            component.f['incidentPeriod'].setValue('Depuis 6 mois');
            ecrire();

            component.submit();

            expect(envoyee().incidentPeriod).toBe('Depuis 6 mois');
        });

        it("envoie le jour et l'heure au serveur", () => {
            ecrire();
            component.onJour('2025-06-02');
            component.onHeure('08:15');

            component.submit();

            expect(envoyee().incidentPeriod).toBe('2 juin 2025 à 8h15');
        });

        it('une date et une heure repérées dans le récit remplissent la période', () => {
            ecrire('Le 15 mars 2025 à 14h30, à la mairie de Koudougou, un agent m\'a demandé 250 000 FCFA.');

            component.analyserRecit();

            expect(component.f['incidentPeriod'].value).toBe('15 mars 2025 à 14h30');
        });
    });

    describe("protection de lanceur d'alerte : lue avant d'être demandée", () => {
        let confirmation: jasmine.Spy;

        beforeEach(() => {
            component.laisserCoordonnees();
            confirmation = spyOn((component as any).confirmationService, 'confirm');
            confirmation.and.callFake((c: any) => c.accept && c.accept());
        });

        it("n'est plus une simple case à cocher : un bouton ouvre les conditions", () => {
            const t = texte();

            expect(t).toContain("Protection de lanceur d'alerte");
            expect(t).toContain('Lire les conditions');
            expect(t).toContain("Vous n'êtes pas obligé de la demander");
        });

        it("n'est pas proposée tant que le citoyen reste anonyme", () => {
            component.setAnonymous();

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

            component.confirmProtection();
            expect(confirmation).not.toHaveBeenCalled();

            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond3 = false;
            component.confirmProtection();
            expect(confirmation).not.toHaveBeenCalled();
            expect(component.fd['protectionRequested'].value).toBeFalse();
        });

        it('une fois lue, cochée et confirmée sur l\'honneur : demandée, et la fenêtre se ferme', () => {
            component.ouvrirProtection();
            component.onScrollProtection({ scrollTop: 600, clientHeight: 300, scrollHeight: 900 });
            component.cond1 = component.cond2 = component.cond3 = true;

            component.confirmProtection();

            expect(confirmation).toHaveBeenCalledTimes(1);
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
            ecrire();

            component.submit();

            expect(envoyee().declarantData.protectionRequested).toBeTrue();
            expect(envoyee().declarantData.protectionAcknowledged).toBeTrue();
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

        it('une protection demandée mais non confirmée bloque le récapitulatif', () => {
            ecrire();
            component.fd['dataProcessingConsent'].setValue(true);
            component.fd['protectionRequested'].setValue(true);

            component.ouvrirRecapitulatif();

            expect(component.showRecap).toBeFalse();
            expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: "Protection lanceur d'alerte" }));
        });
    });
});

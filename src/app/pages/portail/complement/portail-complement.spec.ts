import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { PortailComplement } from './portail-complement';
import { DossierService } from '../../../core/services/dossier.service';

const DEMANDE = {
    status: 'EN_ATTENTE_COMPLEMENT',
    motif: 'Veuillez fournir les justificatifs de paiement',
    requestedAt: '2026-09-20T09:00:00Z',
    deadline: '2026-09-30T23:59:59Z',
    overdue: false
};

describe('PortailComplement', () => {
    let fixture: ComponentFixture<PortailComplement>;
    let component: PortailComplement;
    let service: { getComplementRequest: jasmine.Spy; submitComplement: jasmine.Spy };

    function creer(code: string | null) {
        TestBed.configureTestingModule({
            imports: [PortailComplement],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => (k === 'code' ? code : null) } } } },
                { provide: DossierService, useValue: service }
            ]
        });
        fixture = TestBed.createComponent(PortailComplement);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    const texte = () => {
        fixture.detectChanges();
        return (fixture.nativeElement as HTMLElement).textContent ?? '';
    };
    const erreur = (status: number) => throwError(() => new HttpErrorResponse({ status }));

    beforeEach(() => {
        service = {
            getComplementRequest: jasmine.createSpy('getComplementRequest').and.returnValue(of(DEMANDE)),
            submitComplement: jasmine.createSpy('submitComplement').and.returnValue(of({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 0 }))
        };
    });

    describe('chargement', () => {
        it('lit le code dans l’adresse et affiche le motif et l’échéance', () => {
            creer('ABCD1234');

            expect(service.getComplementRequest).toHaveBeenCalledOnceWith('ABCD1234');
            expect(component.etat).toBe('formulaire');
            expect(texte()).toContain('Veuillez fournir les justificatifs de paiement');
            expect(texte()).toContain('Échéance');
        });

        it('affiche un bandeau quand l’échéance est dépassée', () => {
            service.getComplementRequest.and.returnValue(of({ ...DEMANDE, overdue: true }));
            creer('ABCD1234');

            expect(texte()).toContain('L’échéance est dépassée');
            expect(component.etat).toBe('formulaire');
        });

        it('sans échéance, n’affiche aucune date ni bandeau', () => {
            service.getComplementRequest.and.returnValue(of({ ...DEMANDE, deadline: null }));
            creer('ABCD1234');

            expect(texte()).not.toContain('Échéance');
            expect(texte()).not.toContain('L’échéance est dépassée');
        });

        it('sans code dans l’adresse : « Code introuvable » sans appeler le back', () => {
            creer(null);

            expect(service.getComplementRequest).not.toHaveBeenCalled();
            expect(component.etat).toBe('introuvable');
            expect(texte()).toContain('Code introuvable');
        });

        it('code inconnu (404) : « Code introuvable »', () => {
            service.getComplementRequest.and.returnValue(erreur(404));
            creer('ZZZZZZZZ');

            expect(component.etat).toBe('introuvable');
        });

        it('dossier qui n’attend pas de complément (409) : « Aucune réponse attendue »', () => {
            service.getComplementRequest.and.returnValue(erreur(409));
            creer('ABCD1234');

            expect(component.etat).toBe('non-attendu');
            expect(texte()).toContain('Aucune réponse attendue');
        });

        it('autre erreur : « Service indisponible » avec possibilité de réessayer', () => {
            service.getComplementRequest.and.returnValue(erreur(500));
            creer('ABCD1234');

            expect(component.etat).toBe('erreur');
            service.getComplementRequest.and.returnValue(of(DEMANDE));
            component.recharger();
            expect(component.etat).toBe('formulaire');
        });
    });

    describe('envoi', () => {
        beforeEach(() => creer('ABCD1234'));

        it('refuse un message trop court sans appeler le back', () => {
            component.message = 'court';

            component.envoyer();

            expect(service.submitComplement).not.toHaveBeenCalled();
            expect(component.erreurs.length).toBe(1);
            expect(component.etat).toBe('formulaire');
        });

        it('envoie le message nettoyé et les fichiers puis affiche le succès', () => {
            const preuve = new File(['x'], 'preuve.pdf');
            component.message = '  Voici les justificatifs demandés  ';
            component.fichiers = [preuve];

            component.envoyer();

            expect(service.submitComplement).toHaveBeenCalledOnceWith('ABCD1234', 'Voici les justificatifs demandés', [preuve]);
            expect(component.etat).toBe('succes');
            expect(texte()).toContain('Réponse envoyée');
        });

        it('ignore un second clic tant que l’envoi est en cours (pas de double envoi)', () => {
            const enCours = new Subject<any>();
            service.submitComplement.and.returnValue(enCours);
            component.message = 'Un message assez long';

            component.envoyer();
            component.envoyer();

            expect(service.submitComplement).toHaveBeenCalledTimes(1);
            expect(component.envoi).toBeTrue();
            enCours.next({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 0 });
            enCours.complete();
            expect(component.envoi).toBeFalse();
        });

        it('réponse déjà reçue (409) : plus aucun envoi possible, lien vers le suivi', () => {
            service.submitComplement.and.returnValue(erreur(409));
            component.message = 'Un message assez long';

            component.envoyer();

            expect(component.etat).toBe('non-attendu');
            expect(texte()).toContain('Aucune réponse attendue');
        });

        it('trop d’essais (429) : message dédié, saisie conservée', () => {
            service.submitComplement.and.returnValue(erreur(429));
            component.message = 'Un message assez long';

            component.envoyer();

            expect(component.erreurEnvoi).toContain('Trop de tentatives');
            expect(component.etat).toBe('formulaire');
            expect(component.message).toBe('Un message assez long');
        });

        it('échec réseau : pas de faux succès, message et fichiers conservés, bouton de nouveau actif', () => {
            service.submitComplement.and.returnValue(erreur(0));
            const preuve = new File(['x'], 'preuve.pdf');
            component.message = 'Un message assez long';
            component.fichiers = [preuve];

            component.envoyer();

            expect(component.etat).toBe('formulaire');
            expect(component.erreurEnvoi).toBeTruthy();
            expect(component.message).toBe('Un message assez long');
            expect(component.fichiers).toEqual([preuve]);
            expect(component.envoi).toBeFalse();
        });

        it('indique la réponse reçue en retard dans l’écran de succès', () => {
            service.submitComplement.and.returnValue(of({ status: 'EN_ETUDE_OPPORTUNITE', late: true, filesUploaded: 0 }));
            component.message = 'Un message assez long';

            component.envoyer();

            expect(texte()).toContain('reçue après l’échéance');
        });
    });

    describe('fichiers', () => {
        beforeEach(() => creer('ABCD1234'));

        it('refuse un type non autorisé et signale le refus', () => {
            component.choisirFichiers({ target: { files: [new File(['x'], 'script.html'), new File(['x'], 'ok.pdf')], value: '' } } as any);

            expect(component.fichiers.map(f => f.name)).toEqual(['ok.pdf']);
            expect(component.erreurs.some(e => e.includes('script.html'))).toBeTrue();
        });

        it('retire un fichier de la sélection', () => {
            component.fichiers = [new File(['x'], 'a.pdf'), new File(['x'], 'b.pdf')];

            component.retirerFichier(0);

            expect(component.fichiers.map(f => f.name)).toEqual(['b.pdf']);
        });
    });

    describe('navigation', () => {
        it('« Suivre mon dossier » ouvre le suivi avec le code', () => {
            creer('ABCD1234');
            const router = TestBed.inject(Router);
            const navigate = spyOn(router, 'navigate');

            component.suivre();

            expect(navigate).toHaveBeenCalledWith(['/portail/suivi'], { queryParams: { code: 'ABCD1234' } });
        });

        it('« Accueil » ouvre l’accueil du portail', () => {
            creer('ABCD1234');
            const router = TestBed.inject(Router);
            const navigate = spyOn(router, 'navigate');

            component.accueil();

            expect(navigate).toHaveBeenCalledWith(['/portail']);
        });
    });

    it('ne conserve ni le code ni le message dans le navigateur', () => {
        const local = spyOn(Storage.prototype, 'setItem');
        creer('ABCD1234');
        component.message = 'Un message assez long';

        component.envoyer();

        expect(local).not.toHaveBeenCalled();
    });
});

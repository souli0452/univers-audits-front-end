import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { TransitionDossier } from './transition-dossier';
import { DossierService } from '../../../core/services/dossier.service';

describe('TransitionDossier : la fenêtre de confirmation d\'une action du circuit', () => {
    let fixture: ComponentFixture<TransitionDossier>;
    let composant: TransitionDossier;
    let service: { declareAdmissible: jasmine.Spy; close: jasmine.Spy; refreshById: jasmine.Spy };
    let messages: MessageService;
    let termine: jasmine.Spy;
    let ferme: jasmine.Spy;

    const dossier = (surcharge: any = {}) => ({ id: 'd1', version: 4, status: 'EN_REVUE_CTADP', ...surcharge }) as any;
    const corps = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');
    /** Le dernier bouton portant ce texte : celui de la fenêtre qui vient d'être ouverte. */
    const bouton = (texte: string) =>
        Array.from(document.body.querySelectorAll('button')).reverse().find(b => (b.textContent ?? '').includes(texte)) as HTMLButtonElement | undefined;

    /** `verifie` : l'agent a déjà coché « J'ai vérifié le dossier » (vrai par défaut, pour tester l'envoi). */
    function creer(action: string, d: any = dossier(), verifie = true): void {
        fixture = TestBed.createComponent(TransitionDossier);
        composant = fixture.componentInstance;
        composant.verifie = verifie;
        fixture.componentRef.setInput('dossier', d);
        fixture.componentRef.setInput('action', action);
        termine = jasmine.createSpy('termine');
        ferme = jasmine.createSpy('ferme');
        composant.termine.subscribe(termine);
        composant.ferme.subscribe(ferme);
        messages = fixture.debugElement.injector.get(MessageService);
        spyOn(messages, 'add');
        fixture.detectChanges();
    }

    beforeEach(() => {
        service = {
            declareAdmissible: jasmine.createSpy('declareAdmissible').and.returnValue(of(dossier({ version: 5, status: 'RECEVABLE' }))),
            close: jasmine.createSpy('close').and.returnValue(of(dossier({ version: 5, status: 'CLOS' }))),
            refreshById: jasmine.createSpy('refreshById').and.returnValue(of(dossier({ version: 9 })))
        };
        TestBed.configureTestingModule({
            imports: [TransitionDossier],
            providers: [provideNoopAnimations(), MessageService, { provide: DossierService, useValue: service }]
        });
    });
    afterEach(() => fixture?.destroy());

    it('porte le titre de l\'action et explique ce qui va se passer', () => {
        creer('declarer-recevable');

        expect(corps()).toContain('Déclarer recevable');
        expect(corps()).toContain('déclaré recevable');
        expect(document.body.querySelector('textarea')).not.toBeNull();
    });

    describe('vérifier avant d\'agir', () => {
        it('rappelle de quel dossier il s\'agit et le changement de statut qui va avoir lieu', () => {
            creer('declarer-recevable', dossier({ number: 'N-0042', object: 'Marché sans appel d\'offres' }));

            expect(corps()).toContain('N-0042');
            expect(corps()).toContain('Marché sans appel d\'offres');
            expect(corps()).toContain('En revue CTADP');
            expect(corps()).toContain('Recevable');
        });

        it('dit clairement que l\'action ne peut pas être annulée', () => {
            creer('declarer-recevable');

            expect(corps()).toContain('définitive');
            expect(corps()).toContain('ne peut pas être annulée');
        });

        it('demande de cocher « J\'ai vérifié le dossier » avant de pouvoir confirmer', () => {
            creer('declarer-recevable', dossier(), false);

            expect(corps()).toContain("J'ai vérifié le dossier");
            expect(composant.verifie).toBeFalse();
        });

        it('sans la case cochée, confirmer ne part pas', () => {
            creer('declarer-recevable', dossier(), false);

            composant.confirmer();

            expect(service.declareAdmissible).not.toHaveBeenCalled();
            expect(composant.enCours).toBeFalse();
        });

        it('avec la case cochée, confirmer part', () => {
            creer('declarer-recevable', dossier(), false);
            composant.verifie = true;

            composant.confirmer();

            expect(service.declareAdmissible).toHaveBeenCalledTimes(1);
        });

        it('le bouton de confirmation est grisé tant que la case n\'est pas cochée', () => {
            creer('declarer-recevable', dossier(), false);
            const confirmer = () => bouton('Déclarer recevable')!;

            expect(confirmer().disabled).toBeTrue();

            composant.verifie = true;
            fixture.detectChanges();

            expect(confirmer().disabled).toBeFalse();
        });
    });

    it('adapte le message de la clôture à l\'étape du dossier', () => {
        creer('cloturer', dossier({ status: 'DECISION_RENDUE' }));

        expect(corps()).toContain('transmission aux autorités');
    });

    it('confirmer envoie la version du dossier et le motif saisi, puis rend le dossier mis à jour', () => {
        creer('declarer-recevable');
        composant.motif = 'Faits établis';

        composant.confirmer();

        expect(service.declareAdmissible).toHaveBeenCalledOnceWith('d1', { version: 4, reason: 'Faits établis' });
        expect(termine).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'RECEVABLE', version: 5 }));
        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    });

    it('le motif est facultatif', () => {
        creer('declarer-recevable');

        composant.confirmer();

        expect(service.declareAdmissible).toHaveBeenCalledWith('d1', { version: 4, reason: '' });
    });

    it('ne part pas deux fois si l\'agent clique deux fois', () => {
        creer('declarer-recevable');
        service.declareAdmissible.and.returnValue(new Subject<any>());

        composant.confirmer();
        composant.confirmer();

        expect(service.declareAdmissible).toHaveBeenCalledTimes(1);
        expect(composant.enCours).toBeTrue();
    });

    it('« Annuler » ferme sans rien envoyer', () => {
        creer('declarer-recevable');

        bouton('Annuler')!.click();

        expect(ferme).toHaveBeenCalledTimes(1);
        expect(service.declareAdmissible).not.toHaveBeenCalled();
    });

    it('une erreur du serveur est dite à l\'agent, la fenêtre reste ouverte pour réessayer', () => {
        creer('declarer-recevable');
        service.declareAdmissible.and.returnValue(throwError(() => ({ status: 403, error: { message: 'Droit insuffisant' } })));

        composant.confirmer();

        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Droit insuffisant' }));
        expect(termine).not.toHaveBeenCalled();
        expect(ferme).not.toHaveBeenCalled();
        expect(composant.enCours).toBeFalse();
    });

    it('un dossier modifié entre-temps par un autre agent est rechargé et dit clairement', () => {
        creer('declarer-recevable');
        service.declareAdmissible.and.returnValue(throwError(() => ({ status: 409 })));

        composant.confirmer();

        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
        expect(service.refreshById).toHaveBeenCalledWith('d1');
        expect(termine).toHaveBeenCalledWith(jasmine.objectContaining({ version: 9 }));
    });

    it('si le rechargement échoue après un conflit, le dit sans rien perdre', () => {
        creer('declarer-recevable');
        service.declareAdmissible.and.returnValue(throwError(() => ({ status: 409 })));
        service.refreshById.and.returnValue(throwError(() => ({ status: 500 })));

        composant.confirmer();

        expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', summary: 'Erreur de rechargement' }));
        expect(composant.enCours).toBeFalse();
        expect(termine).not.toHaveBeenCalled();
    });

    it('une action sans transition simple n\'ouvre rien', () => {
        creer('demander-complement');

        expect(composant.transition()).toBeUndefined();
        expect(corps()).not.toContain('Demander un complément');
    });
});

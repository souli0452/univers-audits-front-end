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

    function creer(action: string, d: any = dossier()): void {
        fixture = TestBed.createComponent(TransitionDossier);
        composant = fixture.componentInstance;
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PublicationTrimestrielleComponent } from './publication-trimestrielle';
import { StatistiqueService, PublicationTrimestrielle } from '../../../core/services/statistique.service';
import { periodeARapporter } from '../../../core/utils/publication-trimestrielle';

const situation: PublicationTrimestrielle = {
    annee: 2026, codePeriode: 'T1', periode: 'T1 2026', genereLe: '2026-04-02T08:00:00Z', total: 74,
    categories: [{ code: 'DENONCIATION', libelle: 'Dénonciations', nombre: 54, taux: 72.97 }],
    modesDeSaisine: [{ code: 'WHATSAPP', libelle: 'WhatsApp', nombre: 23, taux: 31.08 },
                     { code: 'MESSENGER', libelle: 'Par Messenger', nombre: 1, taux: 1.35 }],
    typologiesInstitutionnelles: [], allegations: [],
    traitement: [{ code: 'STOCK', libelle: 'Stock en instance', nombre: 51, taux: 68.92 }],
    enjeuxFinanciers: 7000000000, recevabilite: [], originesGeographiques: [],
    velocite: [{ code: 'INVESTIGATION', libelle: "Phase d'investigation", nombre: 18, delaiMoyenJours: 45 },
               { code: 'CLOTURES', libelle: 'Dossiers clôturés', nombre: 5, delaiMoyenJours: null },
               { code: 'STOCK', libelle: 'Stock en instance', nombre: 51, delaiMoyenJours: null }],
    notes: ['La transmission à la Cour des comptes n\'est pas encore suivie par l\'application.']
};

describe('PublicationTrimestrielleComponent', () => {
    let fixture: ComponentFixture<PublicationTrimestrielleComponent>;
    let service: jasmine.SpyObj<StatistiqueService>;

    function creer(): void {
        fixture = TestBed.createComponent(PublicationTrimestrielleComponent);
        fixture.detectChanges();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj<StatistiqueService>('StatistiqueService', ['getPublicationTrimestrielle']);
        TestBed.configureTestingModule({
            imports: [PublicationTrimestrielleComponent, NoopAnimationsModule],
            providers: [{ provide: StatistiqueService, useValue: service }]
        });
    });

    it('charge par défaut le dernier trimestre terminé', () => {
        service.getPublicationTrimestrielle.and.returnValue(of(situation));
        const attendu = periodeARapporter(new Date());

        creer();

        expect(service.getPublicationTrimestrielle).toHaveBeenCalledWith(attendu.annee, attendu.periode);
    });

    it('affiche le total, les tableaux, WhatsApp et Messenger séparés, et le délai non mesuré', () => {
        service.getPublicationTrimestrielle.and.returnValue(of(situation));

        creer();
        const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

        expect(texte).toContain('74');
        expect(texte).toContain('dossiers enregistrés au T1 2026');
        expect(texte).toContain('Dénonciations');
        expect(texte).toContain('WhatsApp');
        expect(texte).toContain('Par Messenger');
        expect(texte).toContain('Enjeux financiers estimés');
        expect(texte).toContain('non mesuré');
        expect(texte).toContain('Cour des comptes');
        expect(texte).toContain('Stock en instance');
    });

    it('recharge quand on change de période, y compris pour un semestre ou une année', () => {
        service.getPublicationTrimestrielle.and.returnValue(of(situation));
        creer();
        service.getPublicationTrimestrielle.calls.reset();

        fixture.componentInstance.annee = 2025;
        fixture.componentInstance.periode = 'S2';
        fixture.componentInstance.charger();

        expect(service.getPublicationTrimestrielle).toHaveBeenCalledWith(2025, 'S2');
    });

    it('explique la panne au lieu de rester vide, et désactive l\'export', () => {
        service.getPublicationTrimestrielle.and.returnValue(throwError(() => new Error('500')));

        creer();
        const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

        expect(texte).toContain('Impossible de charger la situation de cette période');
        expect(fixture.componentInstance.situation).toBeNull();
    });

    describe('exports', () => {
        const typeExcel = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        function declencheur(): jasmine.Spy {
            service.getPublicationTrimestrielle.and.returnValue(of(situation));
            creer();
            return spyOn<any>(fixture.componentInstance, 'declencher');
        }

        it('exporte en Excel sous le bon nom et le bon type', async () => {
            const declencher = declencheur();

            await fixture.componentInstance.exporterExcel();

            expect(declencher).toHaveBeenCalledTimes(1);
            expect(declencher.calls.mostRecent().args[0]).toBe('situation-plaintes-denonciations-2026-T1.xlsx');
            expect(declencher.calls.mostRecent().args[1]).toBe(typeExcel);
        });

        it('exporte en PDF sous le bon nom et le bon type', async () => {
            const declencher = declencheur();

            await fixture.componentInstance.exporterPdf();

            expect(declencher.calls.mostRecent().args[0]).toBe('situation-plaintes-denonciations-2026-T1.pdf');
            expect(declencher.calls.mostRecent().args[1]).toBe('application/pdf');
        });

        it("exporte en CSV avec la marque d'ordre des octets pour qu'Excel lise les accents", () => {
            const declencher = declencheur();

            fixture.componentInstance.exporter();

            expect(declencher.calls.mostRecent().args[0]).toBe('situation-plaintes-denonciations-2026-T1.csv');
            expect(declencher.calls.mostRecent().args[2]).toMatch(/^﻿Situation des plaintes/);
        });

        it("propose les trois exports, inactifs tant que rien n'est chargé", () => {
            service.getPublicationTrimestrielle.and.returnValue(throwError(() => new Error('500')));
            creer();

            const boutons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
                .filter(b => /Excel|PDF|CSV/.test(b.textContent ?? ''));

            expect(boutons.length).toBe(3);
            expect(boutons.every(b => b.disabled)).toBeTrue();
        });
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { PortailSuivi } from './portail-suivi';
import { DossierService } from '../../../core/services/dossier.service';
import { PdfService } from '../../../core/services/pdf.service';

describe('PortailSuivi', () => {
    let fixture: ComponentFixture<PortailSuivi>;
    let el: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PortailSuivi],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                MessageService,
                { provide: DossierService, useValue: {} },
                { provide: PdfService, useValue: {} },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } }
            ]
        });
        fixture = TestBed.createComponent(PortailSuivi);
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    it('affiche le numéro vert 80 00 11 02, avec un lien téléphonique cohérent', () => {
        const lien = el.querySelector('a[href^="tel:"]') as HTMLAnchorElement;

        expect(lien.getAttribute('href')).toBe('tel:80001102');
        expect((lien.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('80 00 11 02');
    });

    it('ne mentionne plus d’ancien numéro vert', () => {
        expect(el.textContent).not.toMatch(/80 00 11 (11|57)/);
        expect(el.innerHTML).not.toContain('80001157');
    });
});

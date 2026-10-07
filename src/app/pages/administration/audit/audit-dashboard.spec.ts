import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuditDashboard } from './audit-dashboard';

describe('AuditDashboard — actions filtrables', () => {
    it('propose l’action « Recevoir complément » journalisée à la réponse d’un déclarant', () => {
        TestBed.configureTestingModule({
            imports: [AuditDashboard],
            providers: [provideRouter([]), provideHttpClient(), provideNoopAnimations()]
        });
        const component = TestBed.createComponent(AuditDashboard).componentInstance;

        expect(component.actionOptions).toContain({ label: 'Recevoir complément', value: 'RECEVOIR_COMPLEMENT' });
    });
});

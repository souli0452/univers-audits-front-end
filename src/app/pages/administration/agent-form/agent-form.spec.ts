import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { AgentForm } from './agent-form';
import { RegleCumulRoles } from '../../../core/services/role-management.service';

describe('AgentForm — cumul de rôles', () => {
    const regles: RegleCumulRoles[] = [
        { roleA: 'AGENT_BRPD', roleB: 'CGE', niveau: 'INTERDIT', raison: 'enregistre puis décide' },
        { roleA: 'MEMBRE_CTADP', roleB: 'CGEA', niveau: 'A_SURVEILLER', raison: 'convoque puis traite' }
    ];

    function creer(roles: string[]): AgentForm {
        TestBed.configureTestingModule({
            imports: [AgentForm],
            providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService]
        });
        const composant = TestBed.createComponent(AgentForm).componentInstance;
        composant.reglesCumul = regles;
        composant.selectedRoles = roles;
        return composant;
    }

    it('signale un cumul interdit', () => {
        const c = creer(['AGENT_BRPD', 'CGE']);
        expect(c.cumulsInterdits.length).toBe(1);
        expect(c.cumulsASurveiller.length).toBe(0);
    });

    it('signale un cumul à surveiller sans le bloquer', () => {
        const c = creer(['MEMBRE_CTADP', 'CGEA']);
        expect(c.cumulsInterdits.length).toBe(0);
        expect(c.cumulsASurveiller.length).toBe(1);
    });

    it('ne signale rien pour un seul rôle', () => {
        const c = creer(['CGE']);
        expect(c.cumulsInterdits.length).toBe(0);
        expect(c.cumulsASurveiller.length).toBe(0);
    });

    it("transforme un cumul interdit en avertissement quand ADMIN_DDIC fait partie des rôles", () => {
        const c = creer(['ADMIN_DDIC', 'AGENT_BRPD', 'CGE']);
        expect(c.cumulsInterdits.length).toBe(0);
        expect(c.cumulsASurveiller.length).toBe(1);
    });
});

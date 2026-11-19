import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './auth.guard';
import { KeycloakService } from '../auth/keycloak.service';

describe('roleGuard', () => {
    let roles: string[];
    let router: { navigate: jasmine.Spy };

    const executer = () => TestBed.runInInjectionContext(() => roleGuard(['CGE', 'ADMIN_DDIC'])({} as any, {} as any));

    beforeEach(() => {
        roles = [];
        router = { navigate: jasmine.createSpy('navigate') };
        TestBed.configureTestingModule({
            providers: [
                { provide: Router, useValue: router },
                { provide: KeycloakService, useValue: { hasAnyRole: (r: string[]) => r.some(x => roles.includes(x)) } }
            ]
        });
    });

    it('laisse passer un agent qui a l’un des rôles demandés', () => {
        roles = ['CGE'];

        expect(executer()).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('renvoie un agent sans le rôle vers « Accès refusé », pas vers « Page introuvable »', () => {
        roles = ['AGENT_BRPD'];

        expect(executer()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledOnceWith(['/auth/access']);
    });
});

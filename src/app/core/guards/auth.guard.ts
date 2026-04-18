import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '../auth/keycloak.service';

/**
 * Guard — vérifie que l'utilisateur est authentifié.
 * Redirige vers Keycloak si non connecté.
 */
export const authGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    if (keycloakService.isAuthenticated()) {
        return true;
    }

    keycloakService.login();
    return false;
};

/**
 * Guard — vérifie que l'utilisateur a les rôles requis.
 */
export const roleGuard = (roles: string[]): CanActivateFn => {
    return () => {
        const keycloakService = inject(KeycloakService);
        const router = inject(Router);

        if (keycloakService.hasAnyRole(roles)) {
            return true;
        }

        router.navigate(['/notfound']);
        return false;
    };
};
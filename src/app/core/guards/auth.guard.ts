import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '../auth/keycloak.service';

/**
 * vérifie que l'utilisateur est authentifié.
 * Redirige vers Keycloak si non connecté.
 */
export const authGuard: CanActivateFn = () => {
    const keycloakService = inject(KeycloakService);

    if (keycloakService.isAuthenticated()) {
        return true;
    }

    keycloakService.login();
    return false;
};

/**
 * vérifie que l'utilisateur a les rôles requis.
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

/** Pages accessibles à un agent DCP seul : statistiques globales, profil, notifications. */
export function urlAutoriseePourDcpSeul(url: string): boolean {
    const chemin = url.split(/[?#]/)[0];
    if (chemin === '/app/statistiques/depassements-par-acteur') return false;
    return ['/app/statistiques', '/app/profil', '/app/notifications'].some(p => chemin === p || chemin.startsWith(p + '/'));
}

/**
 * Renvoie un agent DCP seul vers les statistiques dès qu'il tente d'ouvrir une autre page de l'espace agent.
 * Les autres rôles ne sont pas concernés.
 */
export const dcpSeulGuard: CanActivateChildFn = (_route, state) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    if (!keycloakService.estDcpSeul() || urlAutoriseePourDcpSeul(state.url)) {
        return true;
    }

    return router.createUrlTree(['/app/statistiques']);
};

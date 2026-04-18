import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';

/**
 * Intercepteur HTTP — ajoute le token JWT Bearer à chaque requête.
 * Exclut les endpoints publics (suivi citoyen, soumission).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const keycloakService = inject(KeycloakService);

    // Endpoints publics — pas de token nécessaire
    const publicUrls = [
        '/dossiers/public/track',
        '/dossiers/public/submit'
    ];

    const isPublic = publicUrls.some(url =>
        req.url.includes(url)
    );

    if (isPublic) {
        return next(req);
    }

    // Ajouter le token Bearer pour les endpoints protégés
    return from(keycloakService.getToken()).pipe(
        switchMap(token => {
            if (token) {
                const authReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(authReq);
            }
            return next(req);
        })
    );
};
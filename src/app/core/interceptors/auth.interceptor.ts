import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';

const PUBLIC_URLS = [
    '/api/v1/dossiers/public/',
    '/api/v1/stats/public',
    '/api/v1/attachments/dossier/',
    
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    // ── Pas de token pour les URLs publiques ──────────────────
    const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));
    if (isPublic) {
        return next(req);
    }

    const keycloakService = inject(KeycloakService);

    // ── Pas de token si non authentifié ───────────────────────
    if (!keycloakService.isAuthenticated()) {
        return next(req);
    }

    // ── Ajouter le token pour les appels protégés ─────────────
    return from(keycloakService.getValidToken()).pipe(
        switchMap(token => {
            if (!token) return next(req);
            return next(req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            }));
        })
    );
};
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from './skip-auth.context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    // Liste blanche : le token n'est joint qu'aux appels vers notre propre API,
    // jamais à un appel HTTP tiers (maps, analytics, upload présigné, etc.).
    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    // Opt-out explicite déclaré au niveau de l'appel HttpClient (endpoints
    // réellement publics), plutôt qu'un pattern-matching d'URL qui traiterait
    // à tort des appels authentifiés vers la même route comme publics.
    if (req.context.get(SKIP_AUTH)) {
        return next(req);
    }

    const keycloakService = inject(KeycloakService);

    
    if (!keycloakService.isAuthenticated()) {
        return next(req);
    }

   
    return from(keycloakService.getValidToken()).pipe(
        switchMap(token => {
            if (!token) return next(req);
            return next(req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            }));
        })
    );
};
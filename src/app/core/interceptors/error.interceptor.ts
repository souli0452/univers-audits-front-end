import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Journalise centralement les erreurs HTTP (uniquement hors production, pour
 * éviter d'exposer des détails backend dans un bundle livré aux utilisateurs)
 * puis relaie l'erreur telle quelle : chaque appelant garde la responsabilité
 * d'afficher son propre message utilisateur.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((err: unknown) => {
            if (!environment.production && err instanceof HttpErrorResponse) {
                console.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, err.error);
            }
            return throwError(() => err);
        })
    );
};

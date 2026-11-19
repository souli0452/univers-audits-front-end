import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Droits de l'utilisateur connecté, tels que la base les lui accorde. L'interface s'en sert pour afficher ou
 * masquer les boutons ; ce n'est qu'un confort : chaque requête reste contrôlée par le serveur.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {

    private http = inject(HttpClient);
    private droits: ReadonlySet<string> | null = null;

    /** Charge les droits une seule fois ; en cas de panne, n'accorde rien et réessaiera au prochain appel. */
    charger(): Observable<void> {
        if (this.droits) {
            return of(undefined);
        }
        return this.http.get<{ permissions: string[] }>(`${environment.apiUrl}/auth/permissions`).pipe(
            tap(r => this.droits = new Set(r?.permissions ?? [])),
            map(() => undefined),
            catchError(() => of(undefined))
        );
    }

    a(permission: string): boolean {
        return this.droits?.has(permission) ?? false;
    }

    oublier(): void {
        this.droits = null;
    }
}

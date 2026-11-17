import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../interceptors/skip-auth.context';
import { Geographie } from '../models/geographie.model';

/** Référentiel géographique : public (formulaire de dépôt du citoyen), chargé une seule fois. */
@Injectable({ providedIn: 'root' })
export class GeographieService {

    private readonly http = inject(HttpClient);
    private arbre$?: Observable<Geographie>;

    getArbre(): Observable<Geographie> {
        // shareReplay ne garde pas une erreur : après une panne, l'appel suivant refait la requête.
        return this.arbre$ ??= this.http
            .get<Geographie>(`${environment.apiUrl}/public/geographie`, { context: new HttpContext().set(SKIP_AUTH, true) })
            .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
}

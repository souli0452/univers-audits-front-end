import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    FicheAffectationResponse,
    FicheAffectationCreateRequest,
    FicheAffectationAffectationRequest,
    FicheAffectationSuiviRequest,
    DepartementOption,
    AgentSummary
} from '../models/fiche-affectation.model';

export type {
    FicheAffectationResponse,
    FicheAffectationCreateRequest,
    FicheAffectationAffectationRequest,
    FicheAffectationSuiviRequest,
    DepartementOption,
    AgentSummary
} from '../models/fiche-affectation.model';

@Injectable({ providedIn: 'root' })
export class FicheAffectationService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/fiche-affectation`;
    }

    get(dossierId: string): Observable<FicheAffectationResponse | null> {
        return this.http.get<FicheAffectationResponse>(this.url(dossierId))
            .pipe(catchError(() => of(null)));
    }

    creer(dossierId: string, req: FicheAffectationCreateRequest): Observable<FicheAffectationResponse> {
        return this.http.post<FicheAffectationResponse>(this.url(dossierId), req);
    }

    affecter(dossierId: string, req: FicheAffectationAffectationRequest): Observable<FicheAffectationResponse> {
        return this.http.patch<FicheAffectationResponse>(`${this.url(dossierId)}/affectation`, req);
    }

    suivre(dossierId: string, req: FicheAffectationSuiviRequest): Observable<FicheAffectationResponse> {
        return this.http.patch<FicheAffectationResponse>(`${this.url(dossierId)}/suivi`, req);
    }

    /** Départements éligibles à une affectation directe (codes DEI et DAC uniquement). */
    getDepartementsDeiDac(): Observable<DepartementOption[]> {
        return this.http.get<DepartementOption[]>(`${environment.apiUrl}/config/departements`).pipe(
            map(list => list.filter(d => d.code === 'DEI' || d.code === 'DAC'))
        );
    }

    getConseillersJuridiques(): Observable<AgentSummary[]> {
        return this.http.get<AgentSummary[]>(`${environment.apiUrl}/agents/by-role/CONSEILLER_JURIDIQUE`);
    }
}

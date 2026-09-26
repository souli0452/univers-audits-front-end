import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    EtudeOpportuniteResponse,
    EtudeOpportuniteRequest,
    TypeInfractionOption
} from '../models/etude-opportunite.model';

export type {
    EtudeOpportuniteResponse,
    EtudeOpportuniteRequest,
    TypeInfractionOption
} from '../models/etude-opportunite.model';

@Injectable({ providedIn: 'root' })
export class EtudeOpportuniteService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/etude-opportunite`;
    }

    get(dossierId: string): Observable<EtudeOpportuniteResponse | null> {
        return this.http.get<EtudeOpportuniteResponse | null>(this.url(dossierId))
            .pipe(catchError(() => of(null)));
    }

    upsert(dossierId: string, req: EtudeOpportuniteRequest): Observable<EtudeOpportuniteResponse> {
        return this.http.put<EtudeOpportuniteResponse>(this.url(dossierId), req);
    }

    getTypesInfraction(): Observable<TypeInfractionOption[]> {
        return this.http.get<TypeInfractionOption[]>(`${environment.apiUrl}/types-infraction`);
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    TransmissionAutoriteResponse,
    TransmissionAutoriteRequest,
    RelanceSuitesRequest
} from '../models/transmission-autorite.model';

export type {
    TransmissionAutoriteResponse,
    TransmissionAutoriteRequest,
    RelanceSuitesRequest,
    RelanceSuitesResponse
} from '../models/transmission-autorite.model';

@Injectable({ providedIn: 'root' })
export class TransmissionAutoriteService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/transmission-autorite`;
    }

    get(investigationId: string): Observable<TransmissionAutoriteResponse | null> {
        return this.http.get<TransmissionAutoriteResponse>(this.url(investigationId))
            .pipe(catchError(() => of(null)));
    }

    creer(investigationId: string, req: TransmissionAutoriteRequest): Observable<TransmissionAutoriteResponse> {
        return this.http.post<TransmissionAutoriteResponse>(this.url(investigationId), req);
    }

    ajouterRelance(investigationId: string, req: RelanceSuitesRequest): Observable<TransmissionAutoriteResponse> {
        return this.http.post<TransmissionAutoriteResponse>(`${this.url(investigationId)}/relances`, req);
    }
}

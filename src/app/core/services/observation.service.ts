import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ObservationResponse, ObservationRequest } from '../models/observation.model';

export type { ObservationResponse, ObservationRequest } from '../models/observation.model';

@Injectable({ providedIn: 'root' })
export class ObservationService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/observations`;
    }

    findAll(dossierId: string): Observable<ObservationResponse[]> {
        return this.http.get<ObservationResponse[]>(this.url(dossierId));
    }

    create(
        dossierId: string,
        req: ObservationRequest
    ): Observable<ObservationResponse> {
        return this.http.post<ObservationResponse>(this.url(dossierId), req);
    }
}
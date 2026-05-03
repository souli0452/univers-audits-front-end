import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ObservationResponse {
    id: string;
    type: string;
    content: string;
    confidential: boolean;
    authorFullName: string;
    statusSnapshot: string;
    createdAt: string;
}

export interface ObservationRequest {
    type: string;
    content: string;
    confidential?: boolean;
}

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
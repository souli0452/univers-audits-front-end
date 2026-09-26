import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DemandeDocumentsResponse,
    DemandeDocumentsCreateRequest,
    DemandeDocumentsAddressErrorRequest
} from '../models/demande-documents.model';

export type {
    DemandeDocumentsResponse,
    DemandeDocumentsCreateRequest,
    DemandeDocumentsAddressErrorRequest,
    EscalationLevel
} from '../models/demande-documents.model';

@Injectable({ providedIn: 'root' })
export class DemandeDocumentsService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/demandes-documents`;
    }

    findAll(investigationId: string): Observable<DemandeDocumentsResponse[]> {
        return this.http.get<DemandeDocumentsResponse[]>(this.url(investigationId));
    }

    create(investigationId: string, req: DemandeDocumentsCreateRequest): Observable<DemandeDocumentsResponse> {
        return this.http.post<DemandeDocumentsResponse>(this.url(investigationId), req);
    }

    markReceived(investigationId: string, id: string): Observable<DemandeDocumentsResponse> {
        return this.http.patch<DemandeDocumentsResponse>(`${this.url(investigationId)}/${id}/mark-received`, {});
    }

    escalate(investigationId: string, id: string): Observable<DemandeDocumentsResponse> {
        return this.http.patch<DemandeDocumentsResponse>(`${this.url(investigationId)}/${id}/escalate`, {});
    }

    reportAddressError(investigationId: string, id: string, req: DemandeDocumentsAddressErrorRequest): Observable<DemandeDocumentsResponse> {
        return this.http.patch<DemandeDocumentsResponse>(`${this.url(investigationId)}/${id}/adresse-erronee`, req);
    }
}

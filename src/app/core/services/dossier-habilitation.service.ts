import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DossierHabilitationResponse, HabilitationGrantRequest } from '../models/dossier-habilitation.model';

export type { DossierHabilitationResponse, HabilitationGrantRequest, HabilitationSource } from '../models/dossier-habilitation.model';

@Injectable({ providedIn: 'root' })
export class DossierHabilitationService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/habilitations`;
    }

    findActive(dossierId: string): Observable<DossierHabilitationResponse[]> {
        return this.http.get<DossierHabilitationResponse[]>(this.url(dossierId));
    }

    grant(dossierId: string, req: HabilitationGrantRequest): Observable<DossierHabilitationResponse> {
        return this.http.post<DossierHabilitationResponse>(this.url(dossierId), req);
    }

    revoke(dossierId: string, agentId: string, reason: string): Observable<void> {
        const params = new HttpParams().set('reason', reason);
        return this.http.delete<void>(`${this.url(dossierId)}/${agentId}`, { params });
    }
}

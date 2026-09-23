import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/common.model';
import {
    SeanceCtadpResponse,
    SeanceCtadpCreateRequest,
    AddDossierToSeanceRequest,
    RecommandationCtadpRequest,
    TenirSeanceRequest
} from '../models/seance-ctadp.model';

export type {
    SeanceCtadpResponse,
    SeanceCtadpDossierResponse,
    SeanceCtadpCreateRequest,
    AddDossierToSeanceRequest,
    RecommandationCtadpRequest,
    TenirSeanceRequest,
    StatutSeanceCtadp,
    RecommandationCtadp
} from '../models/seance-ctadp.model';

@Injectable({ providedIn: 'root' })
export class SeanceCtadpService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/seances-ctadp`;

    findAll(page = 0, size = 20): Observable<PageResponse<SeanceCtadpResponse>> {
        const params = new HttpParams()
            .set('page', page).set('size', size).set('sort', 'dateSeance,desc');
        return this.http.get<PageResponse<SeanceCtadpResponse>>(this.baseUrl, { params });
    }

    findById(id: string): Observable<SeanceCtadpResponse> {
        return this.http.get<SeanceCtadpResponse>(`${this.baseUrl}/${id}`);
    }

    create(req: SeanceCtadpCreateRequest): Observable<SeanceCtadpResponse> {
        return this.http.post<SeanceCtadpResponse>(this.baseUrl, req);
    }

    addDossier(seanceId: string, req: AddDossierToSeanceRequest): Observable<SeanceCtadpResponse> {
        return this.http.post<SeanceCtadpResponse>(`${this.baseUrl}/${seanceId}/dossiers`, req);
    }

    recordRecommandation(
        seanceId: string, dossierId: string, req: RecommandationCtadpRequest
    ): Observable<SeanceCtadpResponse> {
        return this.http.put<SeanceCtadpResponse>(
            `${this.baseUrl}/${seanceId}/dossiers/${dossierId}`, req);
    }

    tenir(seanceId: string, req: TenirSeanceRequest): Observable<SeanceCtadpResponse> {
        return this.http.patch<SeanceCtadpResponse>(`${this.baseUrl}/${seanceId}/tenir`, req);
    }
}

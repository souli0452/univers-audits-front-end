import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/common.model';
import { DossierResponse } from '../models/dossier.model';
import {
    InformationPreoccupanteResponse,
    InformationPreoccupanteCreateRequest,
    RattacherDossierRequest
} from '../models/information-preoccupante.model';

export type {
    InformationPreoccupanteResponse,
    InformationPreoccupanteCreateRequest,
    RattacherDossierRequest,
    DossierRattacheResponse,
    AutoReferralSource,
    StatutInformationPreoccupante
} from '../models/information-preoccupante.model';

@Injectable({ providedIn: 'root' })
export class InformationPreoccupanteService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/informations-preoccupantes`;

    findAll(page = 0, size = 20): Observable<PageResponse<InformationPreoccupanteResponse>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<InformationPreoccupanteResponse>>(this.baseUrl, { params });
    }

    findById(id: string): Observable<InformationPreoccupanteResponse> {
        return this.http.get<InformationPreoccupanteResponse>(`${this.baseUrl}/${id}`);
    }

    create(req: InformationPreoccupanteCreateRequest): Observable<InformationPreoccupanteResponse> {
        return this.http.post<InformationPreoccupanteResponse>(this.baseUrl, req);
    }

    rattacherDossier(id: string, dossierId: string, req: RattacherDossierRequest): Observable<InformationPreoccupanteResponse> {
        return this.http.post<InformationPreoccupanteResponse>(
            `${this.baseUrl}/${id}/rattacher-dossier/${dossierId}`, req);
    }

    declencherAutoSaisine(id: string): Observable<DossierResponse> {
        return this.http.post<DossierResponse>(`${this.baseUrl}/${id}/declencher-auto-saisine`, {});
    }

    classerSansSuite(id: string): Observable<InformationPreoccupanteResponse> {
        return this.http.post<InformationPreoccupanteResponse>(`${this.baseUrl}/${id}/classer-sans-suite`, {});
    }
}

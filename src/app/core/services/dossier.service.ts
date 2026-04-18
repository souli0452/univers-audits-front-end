import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DossierResponse,
    DossierCreateRequest,
    StatusTransitionRequest,
    PageResponse,
    DossierStatus
} from '../models/dossier.model';

@Injectable({ providedIn: 'root' })
export class DossierService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/dossiers`;

    // ── Lecture ──────────────────────────────────────────────────

    findAll(page = 0, size = 20): Observable<PageResponse<DossierResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'createdAt,desc');
        return this.http.get<PageResponse<DossierResponse>>(
            this.baseUrl, { params }
        );
    }

    findById(id: string): Observable<DossierResponse> {
        return this.http.get<DossierResponse>(
            `${this.baseUrl}/${id}`
        );
    }

    findByStatus(
        status: DossierStatus,
        page = 0,
        size = 20
    ): Observable<PageResponse<DossierResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);
        return this.http.get<PageResponse<DossierResponse>>(
            `${this.baseUrl}/status/${status}`, { params }
        );
    }

    findMyDossiers(
        page = 0,
        size = 20
    ): Observable<PageResponse<DossierResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);
        return this.http.get<PageResponse<DossierResponse>>(
            `${this.baseUrl}/my`, { params }
        );
    }

    // ── Suivi citoyen (sans token) ────────────────────────────────

    trackByAccessCode(
        accessCode: string
    ): Observable<DossierResponse> {
        return this.http.get<DossierResponse>(
            `${this.baseUrl}/public/track/${accessCode}`
        );
    }

    // ── Création ──────────────────────────────────────────────────

    submit(
        request: DossierCreateRequest
    ): Observable<DossierResponse> {
        return this.http.post<DossierResponse>(
            `${this.baseUrl}/public/submit`, request
        );
    }

    create(
        request: DossierCreateRequest
    ): Observable<DossierResponse> {
        return this.http.post<DossierResponse>(
            this.baseUrl, request
        );
    }

    // ── Workflow — Transitions de statut ──────────────────────────

    registerReception(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/register`, request
        );
    }

    startOpportunityStudy(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/start-study`, request
        );
    }

    requestComplement(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/request-complement`, request
        );
    }

    complementReceived(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/complement-received`, request
        );
    }

    submitToCtadp(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/submit-ctadp`, request
        );
    }

    declareAdmissible(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/declare-admissible`, request
        );
    }

    declareInadmissible(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/declare-inadmissible`, request
        );
    }

    transfer(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/transfer`, request
        );
    }

    close(
        id: string,
        request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/close`, request
        );
    }
}
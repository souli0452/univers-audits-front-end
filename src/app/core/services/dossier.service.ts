import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DossierResponse,
    DossierCreateRequest,
    StatusTransitionRequest,
    PageResponse,
    DossierStatus
} from '../models/dossier.model';

export interface TransferExternalRequest {
    version:     number;
    institution: string;
    reason:      string;
}

export interface ReassignAgentRequest {
    version: number;
    agentId: string;
    note?:   string;
}

export interface DossierSearchParams {
    page?:         number;
    size?:         number;
    status?:       DossierStatus;
    search?:       string;
    type?:         string;
    mode?:         string;
    dateFrom?:     string;
    dateTo?:       string;
    confidential?: boolean;
}

export interface DossierStatsResponse {
    total:              number;
    nouveaux:           number;
    enEtude:            number;
    enAttente:          number;
    recevables:         number;
    irrecevables:       number;
    enInvestigation:    number;
    clos:               number;
    classes:            number;
    transferes:         number;
    totalMontantEstime: number;
    delaiMoyenEnreg:    number;
    delaiMoyenEtude:    number;
    delaiMoyenInvest:   number;
    tauxRecevabilite:   number;
    parCanal:           Record<string, number>;
    parMois:            { mois: string; total: number }[];
}

@Injectable({ providedIn: 'root' })
export class DossierService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/dossiers`;


    findAll(page = 0, size = 20): Observable<PageResponse<DossierResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'createdAt,desc');
        return this.http.get<PageResponse<DossierResponse>>(
            this.baseUrl, { params });
    }

  
    findByPeriod(start: string, end: string): Observable<DossierResponse[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end',   end)
            .set('size',  1000)
            .set('sort',  'receptionDate,asc');
        return this.http
            .get<PageResponse<DossierResponse>>(this.baseUrl, { params })
            .pipe(map(page => page.content || []));
    }

    search(params: DossierSearchParams): Observable<PageResponse<DossierResponse>> {
        let httpParams = new HttpParams()
            .set('page', params.page ?? 0)
            .set('size', params.size ?? 20)
            .set('sort', 'createdAt,desc');

        if (params.status)      httpParams = httpParams.set('status',  params.status);
        if (params.search)      httpParams = httpParams.set('search',  params.search);
        if (params.type)        httpParams = httpParams.set('type',    params.type);
        if (params.mode)        httpParams = httpParams.set('mode',    params.mode);
        if (params.dateFrom)    httpParams = httpParams.set('dateFrom', params.dateFrom);
        if (params.dateTo)      httpParams = httpParams.set('dateTo',   params.dateTo);
        if (params.confidential !== undefined) {
            httpParams = httpParams.set('confidential', params.confidential);
        }

        return this.http.get<PageResponse<DossierResponse>>(
            `${this.baseUrl}/search`, { params: httpParams });
    }

    findById(id: string): Observable<DossierResponse> {
        return this.http.get<DossierResponse>(`${this.baseUrl}/${id}`);
    }

    refreshById(id: string): Observable<DossierResponse> {
        return this.http.get<DossierResponse>(`${this.baseUrl}/${id}`);
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
            `${this.baseUrl}/status/${status}`, { params });
    }

    findMyDossiers(page = 0, size = 20): Observable<PageResponse<DossierResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);
        return this.http.get<PageResponse<DossierResponse>>(
            `${this.baseUrl}/my`, { params });
    }

    trackByAccessCode(accessCode: string): Observable<DossierResponse> {
        return this.http.get<DossierResponse>(
            `${this.baseUrl}/public/track/${accessCode}`);
    }

    getStats(): Observable<DossierStatsResponse> {
        return this.http.get<DossierStatsResponse>(`${this.baseUrl}/stats`);
    }

    getStatsByPeriod(
        period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
        year?: number
    ): Observable<DossierStatsResponse> {
        let params = new HttpParams().set('period', period);
        if (year) params = params.set('year', year);
        return this.http.get<DossierStatsResponse>(
            `${this.baseUrl}/stats/period`, { params });
    }


    submit(request: DossierCreateRequest): Observable<DossierResponse> {
        return this.http.post<DossierResponse>(
            `${this.baseUrl}/public/submit`, request);
    }

    create(request: DossierCreateRequest): Observable<DossierResponse> {
        return this.http.post<DossierResponse>(this.baseUrl, request);
    }


    registerReception(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/register`, request);
    }

    startOpportunityStudy(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/start-study`, request);
    }

    requestComplement(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/request-complement`, request);
    }

    complementReceived(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/complement-received`, request);
    }

    submitToCtadp(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/submit-ctadp`, request);
    }

    declareAdmissible(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/declare-admissible`, request);
    }

    declareInadmissible(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/declare-inadmissible`, request);
    }

    close(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/close`, request);
    }

    setConfidential(
        id: string, value: boolean, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/confidential?value=${value}`, request);
    }

    transferExternal(
        id: string, request: TransferExternalRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/transfer-external`, request);
    }

    reassignAgent(
        id: string, request: ReassignAgentRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/reassign`, request);
    }

    transfer(
        id: string, request: StatusTransitionRequest
    ): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/transfer`, request);
    }

    setPriority(id: string, request: {
        priority: string;
        reason:   string | null;
        deadline: string | null;
        version:  number;
    }): Observable<DossierResponse> {
        return this.http.patch<DossierResponse>(
            `${this.baseUrl}/${id}/priority`, request);
    }
}
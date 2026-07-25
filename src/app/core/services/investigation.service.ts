import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/common.model';
import {
    TeamRole,
    InvestigationMemberResponse,
    InvestigationResponse,
    InvestigationCreateRequest,
    SubmitReportRequest,
    InvestigationUpdateRequest,
    ExtendDeadlineRequest,
    AddMemberRequest
} from '../models/investigation.model';

export type { PageResponse } from '../models/common.model';
export type {
    TeamRole,
    InvestigationMemberResponse,
    InvestigationResponse,
    InvestigationCreateRequest,
    SubmitReportRequest,
    InvestigationUpdateRequest,
    ExtendDeadlineRequest,
    AddMemberRequest
} from '../models/investigation.model';



@Injectable({ providedIn: 'root' })
export class InvestigationService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/investigations`;


    findAll(page = 0, size = 20): Observable<PageResponse<InvestigationResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'createdAt,desc');
        return this.http.get<PageResponse<InvestigationResponse>>(
            this.baseUrl, { params });
    }

    findById(id: string): Observable<InvestigationResponse> {
        return this.http.get<InvestigationResponse>(`${this.baseUrl}/${id}`);
    }

    findByDossierId(dossierId: string): Observable<InvestigationResponse> {
        return this.http.get<InvestigationResponse>(
            `${this.baseUrl}/dossier/${dossierId}`);
    }

    findByDossier(dossierId: string): Observable<InvestigationResponse> {
        return this.findByDossierId(dossierId);
    }

    findOverdue(page = 0, size = 20): Observable<PageResponse<InvestigationResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);
        return this.http.get<PageResponse<InvestigationResponse>>(
            `${this.baseUrl}/overdue`, { params });
    }

    findByPeriod(start: string, end: string): Observable<InvestigationResponse[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end',   end)
            .set('size',  1000)
            .set('sort',  'startDate,asc');
        return this.http
            .get<PageResponse<InvestigationResponse>>(
                `${this.baseUrl}/by-period`, { params })
            .pipe(map(page => page.content || []));
    }


    open(dossierId: string,
         request: InvestigationCreateRequest): Observable<InvestigationResponse> {
        return this.http.post<InvestigationResponse>(
            `${this.baseUrl}/dossier/${dossierId}/open`, request);
    }

    start(id: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/start`, {});
    }

    suspend(id: string, reason: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/suspend`, null,
            { params: new HttpParams().set('reason', reason) });
    }

    resume(id: string, reason?: string): Observable<InvestigationResponse> {
        let params = new HttpParams();
        if (reason) params = params.set('reason', reason);
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/resume`, null, { params });
    }

    extendDeadline(id: string,
                   request: ExtendDeadlineRequest): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/extend-deadline`, request);
    }

    submitReport(id: string,
                 request: SubmitReportRequest): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/submit-report`, request);
    }

    approveDei(id: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/approve-dei`, {});
    }

    approveLegal(id: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/approve-legal`, {});
    }

    approveCge(id: string, reason: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/approve-cge`, null,
            { params: new HttpParams().set('reason', reason) });
    }


    addMember(id: string,
              request: AddMemberRequest): Observable<InvestigationResponse> {
        return this.http.post<InvestigationResponse>(
            `${this.baseUrl}/${id}/members`, request);
    }

    removeMember(id: string, agentId: string): Observable<InvestigationResponse> {
        return this.http.delete<InvestigationResponse>(
            `${this.baseUrl}/${id}/members/${agentId}`);
    }
}
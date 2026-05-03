import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/dossier.model';

export interface InvestigationMemberResponse {
    id: string;
    agentId: string;
    agentName: string;
    agentMatricule: string;
    teamRole: TeamRole;
    assignedBy: string;
    active: boolean;
}

export interface InvestigationResponse {
    id: string;
    dossierId: string;
    dossierNumber?: string;
    dossierObject?: string;
    status: InvestigationStatus;
    startDate?: string;
    plannedEndDate?: string;
    extendedDeadline?: string;
    actualEndDate?: string;
    extensionReason?: string;
    plannedDurationDays: number;
    remainingDays?: number;
    overdue: boolean;
    memberCount?: number;
    members?: InvestigationMemberResponse[];
    finalReport?: string;
    conclusions?: string;
    recommendations?: string;
    outcome?: string;
    reportSubmittedAt?: string;
    deiApprovedAt?: string;
    legalAdvisorApprovedAt?: string;
    cgeApprovedAt?: string;
    cgea?: any;
    createdAt?: string;
    updatedAt?: string;
}

export type InvestigationStatus =
    | 'INITIATED'
    | 'IN_PROGRESS'
    | 'SUSPENDED'
    | 'COMPLETED'
    | 'ARCHIVED';

export type TeamRole =
    | 'TEAM_LEADER'
    | 'MEMBER';

export interface OpenInvestigationRequest {
    plannedDurationDays: number;
    notes?: string;
}

export interface ExtendDeadlineRequest {
    newDeadline: string; 
    reason: string;
}

export interface SubmitReportRequest {
    finalReport: string;
    conclusions: string;
    recommendations?: string;
    outcome: string;
}

export interface AddMemberRequest {
    agentId: string;
    teamRole: TeamRole;
}

@Injectable({ providedIn: 'root' })
export class InvestigationService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/investigations`;

    findAll(
        page = 0,
        size = 20
    ): Observable<PageResponse<InvestigationResponse>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'createdAt,desc');
        return this.http.get<PageResponse<InvestigationResponse>>(
            this.baseUrl, { params }
        );
    }

    findById(id: string): Observable<InvestigationResponse> {
        return this.http.get<InvestigationResponse>(
            `${this.baseUrl}/${id}`
        );
    }

    
    findByDossier(
        dossierId: string
    ): Observable<InvestigationResponse | null> {
        return this.http.get<InvestigationResponse>(
            `${this.baseUrl}/dossier/${dossierId}`,
            { observe: 'response' }
        ).pipe(
            map(response =>
                response.status === 204 ? null : response.body
            ),
            catchError(() => of(null))
        );
    }

    open(
        dossierId: string,
        request: OpenInvestigationRequest
    ): Observable<InvestigationResponse> {
        return this.http.post<InvestigationResponse>(
            `${this.baseUrl}/dossier/${dossierId}/open`,
            request
        );
    }

    start(id: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/start`, {}
        );
    }

   
    suspend(
        id: string,
        reason: string
    ): Observable<InvestigationResponse> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/suspend`, {}, { params }
        );
    }

   
    resume(
        id: string,
        reason?: string
    ): Observable<InvestigationResponse> {
        let params = new HttpParams();
        if (reason) params = params.set('reason', reason);
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/resume`, {}, { params }
        );
    }

    extendDeadline(
        id: string,
        request: ExtendDeadlineRequest
    ): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/extend-deadline`, request
        );
    }

    submitReport(
        id: string,
        request: SubmitReportRequest
    ): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/submit-report`, request
        );
    }

    approveDei(id: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/approve-dei`, {}
        );
    }

    approveLegal(id: string): Observable<InvestigationResponse> {
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/approve-legal`, {}
        );
    }

    // Backend attend ?reason= en query param
    approveCge(
        id: string,
        reason: string
    ): Observable<InvestigationResponse> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<InvestigationResponse>(
            `${this.baseUrl}/${id}/approve-cge`, {}, { params }
        );
    }

    addMember(
        id: string,
        request: AddMemberRequest
    ): Observable<InvestigationResponse> {
        return this.http.post<InvestigationResponse>(
            `${this.baseUrl}/${id}/members`, request
        );
    }

    removeMember(
        id: string,
        agentId: string
    ): Observable<InvestigationResponse> {
        return this.http.delete<InvestigationResponse>(
            `${this.baseUrl}/${id}/members/${agentId}`
        );
    }
}
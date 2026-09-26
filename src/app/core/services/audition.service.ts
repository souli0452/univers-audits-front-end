import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    AuditionResponse, AuditionScheduleRequest, AuditionConductRequest,
    PvAuditionResponse, PvAuditionCreateRequest, PvAuditionFinalizeRequest, PvAuditionCorrectionRequest
} from '../models/audition.model';

export type {
    AuditionResponse, AuditionScheduleRequest, AuditionConductRequest,
    PvAuditionResponse, PvAuditionCreateRequest, PvAuditionFinalizeRequest, PvAuditionCorrectionRequest,
    CorrectionPvAuditionResponse, IntervieweeType, AuditionStatus
} from '../models/audition.model';

@Injectable({ providedIn: 'root' })
export class AuditionService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/auditions`;
    }

    findAll(investigationId: string): Observable<AuditionResponse[]> {
        return this.http.get<AuditionResponse[]>(this.url(investigationId));
    }

    schedule(investigationId: string, req: AuditionScheduleRequest): Observable<AuditionResponse> {
        return this.http.post<AuditionResponse>(this.url(investigationId), req);
    }

    conduct(investigationId: string, auditionId: string, req: AuditionConductRequest): Observable<AuditionResponse> {
        return this.http.patch<AuditionResponse>(`${this.url(investigationId)}/${auditionId}/conduct`, req);
    }

    cancel(investigationId: string, auditionId: string, reason: string): Observable<AuditionResponse> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<AuditionResponse>(
            `${this.url(investigationId)}/${auditionId}/cancel`, {}, { params });
    }

    markNoShow(investigationId: string, auditionId: string, note?: string): Observable<AuditionResponse> {
        let params = new HttpParams();
        if (note) params = params.set('note', note);
        return this.http.patch<AuditionResponse>(
            `${this.url(investigationId)}/${auditionId}/no-show`, {}, { params });
    }

    getPv(investigationId: string, auditionId: string): Observable<PvAuditionResponse | null> {
        return this.http.get<PvAuditionResponse>(`${this.url(investigationId)}/${auditionId}/pv`)
            .pipe(catchError(() => of(null)));
    }

    createPv(investigationId: string, auditionId: string, req: PvAuditionCreateRequest): Observable<PvAuditionResponse> {
        return this.http.post<PvAuditionResponse>(`${this.url(investigationId)}/${auditionId}/pv`, req);
    }

    finalizePv(investigationId: string, auditionId: string, req: PvAuditionFinalizeRequest): Observable<PvAuditionResponse> {
        return this.http.patch<PvAuditionResponse>(`${this.url(investigationId)}/${auditionId}/pv/finalize`, req);
    }

    markPvReadBack(investigationId: string, auditionId: string): Observable<PvAuditionResponse> {
        return this.http.patch<PvAuditionResponse>(`${this.url(investigationId)}/${auditionId}/pv/relecture`, {});
    }

    correctPv(investigationId: string, auditionId: string, req: PvAuditionCorrectionRequest): Observable<PvAuditionResponse> {
        return this.http.patch<PvAuditionResponse>(`${this.url(investigationId)}/${auditionId}/pv/correction`, req);
    }
}

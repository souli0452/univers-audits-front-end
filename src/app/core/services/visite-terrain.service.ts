import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    VisiteTerrainResponse, VisiteTerrainScheduleRequest, VisiteTerrainConductRequest,
    PvConstatResponse, PvConstatCreateRequest
} from '../models/visite-terrain.model';

export type {
    VisiteTerrainResponse, VisiteTerrainScheduleRequest, VisiteTerrainConductRequest,
    PvConstatResponse, PvConstatCreateRequest, VisiteStatus
} from '../models/visite-terrain.model';

@Injectable({ providedIn: 'root' })
export class VisiteTerrainService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/visites-terrain`;
    }

    findAll(investigationId: string): Observable<VisiteTerrainResponse[]> {
        return this.http.get<VisiteTerrainResponse[]>(this.url(investigationId));
    }

    schedule(investigationId: string, req: VisiteTerrainScheduleRequest): Observable<VisiteTerrainResponse> {
        return this.http.post<VisiteTerrainResponse>(this.url(investigationId), req);
    }

    conduct(investigationId: string, visiteId: string, req: VisiteTerrainConductRequest): Observable<VisiteTerrainResponse> {
        return this.http.patch<VisiteTerrainResponse>(`${this.url(investigationId)}/${visiteId}/conduct`, req);
    }

    cancel(investigationId: string, visiteId: string, reason: string): Observable<VisiteTerrainResponse> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<VisiteTerrainResponse>(
            `${this.url(investigationId)}/${visiteId}/cancel`, {}, { params });
    }

    markCarence(investigationId: string, visiteId: string, reason: string): Observable<VisiteTerrainResponse> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<VisiteTerrainResponse>(
            `${this.url(investigationId)}/${visiteId}/carence`, {}, { params });
    }

    getPv(investigationId: string, visiteId: string): Observable<PvConstatResponse | null> {
        return this.http.get<PvConstatResponse>(`${this.url(investigationId)}/${visiteId}/pv`)
            .pipe(catchError(() => of(null)));
    }

    createPv(investigationId: string, visiteId: string, req: PvConstatCreateRequest): Observable<PvConstatResponse> {
        return this.http.post<PvConstatResponse>(`${this.url(investigationId)}/${visiteId}/pv`, req);
    }
}

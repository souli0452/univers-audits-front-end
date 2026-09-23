import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    PlanActionsStatusResponse,
    PlanActionsRequest,
    NoteAvancementRequest,
    MissionSuiviListResponse,
    MissionSuiviRequest
} from '../models/suivi-sanctions.model';

export type {
    PlanActionsStatusResponse,
    PlanActionsRequest,
    NoteAvancementResponse,
    NoteAvancementRequest,
    MissionSuiviResponse,
    MissionSuiviListResponse,
    MissionSuiviRequest
} from '../models/suivi-sanctions.model';

@Injectable({ providedIn: 'root' })
export class PlanActionsService {
    private http = inject(HttpClient);
    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/plan-actions`;
    }

    getStatus(investigationId: string): Observable<PlanActionsStatusResponse> {
        return this.http.get<PlanActionsStatusResponse>(this.url(investigationId));
    }

    creer(investigationId: string, req: PlanActionsRequest): Observable<PlanActionsStatusResponse> {
        return this.http.post<PlanActionsStatusResponse>(this.url(investigationId), req);
    }

    ajouterAvancement(investigationId: string, req: NoteAvancementRequest): Observable<PlanActionsStatusResponse> {
        return this.http.post<PlanActionsStatusResponse>(`${this.url(investigationId)}/avancements`, req);
    }
}

@Injectable({ providedIn: 'root' })
export class MissionSuiviService {
    private http = inject(HttpClient);
    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/missions-suivi`;
    }

    lister(investigationId: string): Observable<MissionSuiviListResponse> {
        return this.http.get<MissionSuiviListResponse>(this.url(investigationId));
    }

    ajouter(investigationId: string, req: MissionSuiviRequest): Observable<MissionSuiviListResponse> {
        return this.http.post<MissionSuiviListResponse>(this.url(investigationId), req);
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    MandatResponse,
    EngagementConfidentialiteRequest, EngagementConfidentialiteResponse,
    PlanInvestigationSubmitRequest, PlanInvestigationRevisionRequest,
    PlanInvestigationResponse, RevisionPlanResponse,
    IncidentObjectiviteRequest, IncidentObjectiviteResponse,
    ProcedureUrgenceRequest, ProcedureUrgenceDecisionRequest, ProcedureUrgenceResponse,
    MesureConservatoireRequest, MesureConservatoireResponse
} from '../models/investigation-cadrage.model';

export type {
    MandatResponse,
    EngagementConfidentialiteRequest, EngagementConfidentialiteResponse,
    PlanInvestigationSubmitRequest, PlanInvestigationRevisionRequest,
    PlanInvestigationResponse, RevisionPlanResponse,
    IncidentObjectiviteRequest, IncidentObjectiviteResponse,
    ProcedureUrgenceRequest, ProcedureUrgenceDecisionRequest, ProcedureUrgenceResponse,
    StatutProcedureUrgence,
    MesureConservatoireRequest, MesureConservatoireResponse
} from '../models/investigation-cadrage.model';

@Injectable({ providedIn: 'root' })
export class InvestigationCadrageService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}`;
    }

    // Mandat
    getMandat(investigationId: string): Observable<MandatResponse | null> {
        return this.http.get<MandatResponse>(`${this.url(investigationId)}/mandat`)
            .pipe(catchError(() => of(null)));
    }

    deliverMandat(investigationId: string): Observable<MandatResponse> {
        return this.http.post<MandatResponse>(`${this.url(investigationId)}/mandat`, {});
    }

    // Engagement préalable (auto-déclaration de l'agent connecté)
    getEngagementPrealable(investigationId: string, agentId: string): Observable<EngagementConfidentialiteResponse | null> {
        return this.http.get<EngagementConfidentialiteResponse>(
            `${this.url(investigationId)}/engagement-prealable/${agentId}`
        ).pipe(catchError(() => of(null)));
    }

    declareEngagementPrealable(investigationId: string, req: EngagementConfidentialiteRequest): Observable<EngagementConfidentialiteResponse> {
        return this.http.post<EngagementConfidentialiteResponse>(`${this.url(investigationId)}/engagement-prealable`, req);
    }

    // Plan d'investigation
    getPlan(investigationId: string): Observable<PlanInvestigationResponse | null> {
        return this.http.get<PlanInvestigationResponse>(`${this.url(investigationId)}/plan-investigation`)
            .pipe(catchError(() => of(null)));
    }

    getPlanRevisions(investigationId: string): Observable<RevisionPlanResponse[]> {
        return this.http.get<RevisionPlanResponse[]>(`${this.url(investigationId)}/plan-investigation/revisions`);
    }

    submitPlan(investigationId: string, req: PlanInvestigationSubmitRequest): Observable<PlanInvestigationResponse> {
        return this.http.post<PlanInvestigationResponse>(`${this.url(investigationId)}/plan-investigation`, req);
    }

    revisePlan(investigationId: string, req: PlanInvestigationRevisionRequest): Observable<PlanInvestigationResponse> {
        return this.http.put<PlanInvestigationResponse>(`${this.url(investigationId)}/plan-investigation`, req);
    }

    validatePlan(investigationId: string): Observable<PlanInvestigationResponse> {
        return this.http.patch<PlanInvestigationResponse>(`${this.url(investigationId)}/plan-investigation/valider`, {});
    }

    // Incidents d'objectivité
    getIncidents(investigationId: string): Observable<IncidentObjectiviteResponse[]> {
        return this.http.get<IncidentObjectiviteResponse[]>(`${this.url(investigationId)}/incidents-objectivite`);
    }

    declareIncident(investigationId: string, req: IncidentObjectiviteRequest): Observable<IncidentObjectiviteResponse> {
        return this.http.post<IncidentObjectiviteResponse>(`${this.url(investigationId)}/incidents-objectivite`, req);
    }

    // Procédures d'urgence
    getProcedures(investigationId: string): Observable<ProcedureUrgenceResponse[]> {
        return this.http.get<ProcedureUrgenceResponse[]>(`${this.url(investigationId)}/procedures-urgence`);
    }

    demanderProcedureUrgence(investigationId: string, req: ProcedureUrgenceRequest): Observable<ProcedureUrgenceResponse> {
        return this.http.post<ProcedureUrgenceResponse>(`${this.url(investigationId)}/procedures-urgence`, req);
    }

    approuverProcedureUrgence(investigationId: string, procedureId: string, req: ProcedureUrgenceDecisionRequest): Observable<ProcedureUrgenceResponse> {
        return this.http.patch<ProcedureUrgenceResponse>(`${this.url(investigationId)}/procedures-urgence/${procedureId}/approuver`, req);
    }

    rejeterProcedureUrgence(investigationId: string, procedureId: string, req: ProcedureUrgenceDecisionRequest): Observable<ProcedureUrgenceResponse> {
        return this.http.patch<ProcedureUrgenceResponse>(`${this.url(investigationId)}/procedures-urgence/${procedureId}/rejeter`, req);
    }

    // Mesures conservatoires
    getMesures(investigationId: string): Observable<MesureConservatoireResponse[]> {
        return this.http.get<MesureConservatoireResponse[]>(`${this.url(investigationId)}/mesures-conservatoires`);
    }

    declarerMesureConservatoire(investigationId: string, req: MesureConservatoireRequest): Observable<MesureConservatoireResponse> {
        return this.http.post<MesureConservatoireResponse>(`${this.url(investigationId)}/mesures-conservatoires`, req);
    }
}

export interface MandatResponse {
    id: string;
    investigationId: string;
    dateDelivrance: string;
    agentCGEId: string;
    agentCGENom: string;
}

export interface EngagementConfidentialiteRequest {
    hasConflictOfInterest: boolean;
    conflictDetails?: string;
}

export interface EngagementConfidentialiteResponse {
    id: string;
    investigationId: string;
    agentId: string;
    agentNom: string;
    hasConflictOfInterest: boolean;
    conflictDetails?: string;
    signedAt: string;
}

export interface PlanInvestigationSubmitRequest {
    objectifs: string;
    methodologie: string;
    moyensMobilises?: string;
    planningProcedures?: string;
}

export interface PlanInvestigationRevisionRequest extends PlanInvestigationSubmitRequest {
    motifRevision: string;
}

export interface PlanInvestigationResponse {
    id: string;
    investigationId: string;
    planVersion: number;
    objectifs: string;
    methodologie: string;
    moyensMobilises?: string;
    planningProcedures?: string;
    submittedAt: string;
    submittedById: string;
    submittedByNom: string;
    validatedAt?: string;
    validatedById?: string;
    validatedByNom?: string;
    validationDeadline?: string;
    overdue: boolean;
}

export interface RevisionPlanResponse {
    id: string;
    versionNumber: number;
    objectifs: string;
    methodologie: string;
    moyensMobilises?: string;
    planningProcedures?: string;
    revisedAt: string;
    revisedById: string;
    revisedByNom: string;
    motifRevision: string;
}

export interface IncidentObjectiviteRequest {
    description: string;
}

export interface IncidentObjectiviteResponse {
    id: string;
    investigationId: string;
    declaredById: string;
    declaredByNom: string;
    description: string;
    declaredAt: string;
}

export type StatutProcedureUrgence = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';

export interface ProcedureUrgenceRequest {
    justification: string;
}

export interface ProcedureUrgenceDecisionRequest {
    motifDecision?: string;
}

export interface ProcedureUrgenceResponse {
    id: string;
    investigationId: string;
    justification: string;
    requestedById: string;
    requestedByNom: string;
    requestedAt: string;
    status: StatutProcedureUrgence;
    decidedById?: string;
    decidedByNom?: string;
    decidedAt?: string;
    motifDecision?: string;
}

export interface MesureConservatoireRequest {
    description: string;
}

export interface MesureConservatoireResponse {
    id: string;
    investigationId: string;
    description: string;
    takenById: string;
    takenByNom: string;
    takenAt: string;
}

// ── Plan d'actions ────────────────────────────────────────────
export interface NoteAvancementResponse {
    id: string;
    noteAt: string;
    agentNom?: string;
    contenu?: string;
}

export interface PlanActionsStatusResponse {
    investigationId: string;
    exists: boolean;
    planActionsDueAt?: string;
    planActionsOverdue: boolean;
    id?: string;
    entiteControlee?: string;
    contenu?: string;
    submittedAt?: string;
    receivedByNom?: string;
    avancements: NoteAvancementResponse[];
}

export interface PlanActionsRequest {
    entiteControlee: string;
    contenu: string;
}

export interface NoteAvancementRequest {
    contenu?: string;
}

// ── Missions de suivi ─────────────────────────────────────────
export interface MissionSuiviResponse {
    id: string;
    missionDate: string;
    conductedByNom?: string;
    objectifs: string;
    syntheseRecommandations: string;
    nouvellesRecommandations?: string;
    submittedAt: string;
}

export interface MissionSuiviListResponse {
    investigationId: string;
    missionSuiviDueAt?: string;
    missionSuiviOverdue: boolean;
    missions: MissionSuiviResponse[];
}

export interface MissionSuiviRequest {
    missionDate: string;
    objectifs: string;
    syntheseRecommandations: string;
    nouvellesRecommandations?: string;
}

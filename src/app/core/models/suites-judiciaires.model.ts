// ── Requête Parquet ──────────────────────────────────────────
export interface RequeteParquetResponse {
    id: string;
    investigationId: string;
    contenu?: string;
    complet: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface RequeteParquetRequest {
    contenu?: string;
}

// ── Constitution de partie civile ────────────────────────────
export interface ConstitutionPartieCivileResponse {
    id: string;
    investigationId: string;
    constitueAt: string;
    montantReclame?: number;
    justification: string;
    constitueeParNom?: string;
    submittedAt: string;
}

export interface ConstitutionPartieCivileRequest {
    justification: string;
    montantReclame?: number;
}

// ── Suivi de procédure pénale ─────────────────────────────────
export interface SuiviProcedurePenaleResponse {
    id: string;
    phaseAt: string;
    phase: string;
    commentaire?: string;
    agentNom?: string;
    submittedAt: string;
}

export interface SuiviProcedurePenaleListResponse {
    investigationId: string;
    suivis: SuiviProcedurePenaleResponse[];
}

export interface SuiviProcedurePenaleRequest {
    phaseAt: string;
    phase: string;
    commentaire?: string;
}

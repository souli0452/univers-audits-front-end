export type DecisionCgeAffectation = 'AFFECTATION_DIRECTE_CGEA' | 'ECHANGE_PREALABLE';
export type TypeDesignation = 'DEPARTEMENT' | 'AGENT_CJ' | 'BRPD';
export type EtatAvancementAffectation = 'EN_COURS' | 'CLOTURE' | 'AUTRE';

export interface FicheAffectationResponse {
    id: string;
    dossierId: string;
    decisionCge?: DecisionCgeAffectation;
    observationsCge?: string;
    agentCgeNom?: string;
    dateDecisionCge?: string;
    typeDesignation?: TypeDesignation;
    departementDesigneId?: string;
    departementDesigneLibelle?: string;
    agentDesigneId?: string;
    agentDesigneNom?: string;
    observationsCgea?: string;
    agentCgeaNom?: string;
    dateImputation?: string;
    dateRetour?: string;
    etatAvancement?: EtatAvancementAffectation;
    etatAvancementPrecision?: string;
    commentairesSuivi?: string;
    agentSuiviNom?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface FicheAffectationCreateRequest {
    decisionCge: DecisionCgeAffectation;
    observationsCge?: string;
}

export interface FicheAffectationAffectationRequest {
    typeDesignation: TypeDesignation;
    departementDesigneId?: string;
    agentDesigneId?: string;
    observationsCgea?: string;
}

export interface FicheAffectationSuiviRequest {
    etatAvancement: EtatAvancementAffectation;
    etatAvancementPrecision?: string;
    commentairesSuivi?: string;
}

export interface DepartementOption {
    id: string;
    code: string;
    libelle: string;
}

export interface AgentSummary {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    matricule: string;
    departementLabel?: string;
}

export type TeamRole = 'TEAM_LEADER' | 'MEMBER' | 'EXPERT' | 'OBSERVER';

export interface InvestigationMemberResponse {
    id:        string;
    teamRole:  TeamRole;
    active:    boolean;
    agent: {
        id:         string;
        firstName:  string;
        lastName:   string;
        matricule:  string;
        email?:     string;
    };
}

export interface InvestigationResponse {
    id:                      string;
    status:                  string;
    outcome?:                string;
    startDate?:              string;
    plannedEndDate?:         string;
    extendedDeadline?:       string;
    actualEndDate?:          string;
    reportSubmittedAt?:      string;
    deiApprovedAt?:          string;
    legalAdvisorApprovedAt?: string;
    cgeApprovedAt?:          string;
    plannedDurationDays?:    number;
    remainingDays?:          number;
    overdue:                 boolean;
    finalReport?:            string;
    conclusions?:            string;
    recommendations?:        string;
    suspensionReason?:       string;
    extensionReason?:        string;
    dossierId?:              string;
    dossierNumber?:          string;
    dossierObject?:          string;
    caseNumber?:             string;
    caseObject?:             string;
    dossier?: {
        id:     string;
        number: string;
        object: string;
        status: string;
    };

    createdAt?: string;
    members?:   InvestigationMemberResponse[];
}

export interface InvestigationCreateRequest {
    plannedDurationDays?: number;
    notes?:               string;
}

export interface SubmitReportRequest {
    finalReport?:     string;
    conclusions?:     string;
    recommendations?: string;
    outcome?:         string;
}

export type InvestigationUpdateRequest = SubmitReportRequest;

export interface ExtendDeadlineRequest {
    newDeadline: string;
    reason:      string;
}

export interface AddMemberRequest {
    agentId:  string;
    teamRole: TeamRole;
}

export type DossierStatus =
    | 'SOUMIS'
    | 'RECU'
    | 'EN_ETUDE_OPPORTUNITE'
    | 'EN_ATTENTE_COMPLEMENT'
    | 'EN_REVUE_CTADP'
    | 'RECEVABLE'
    | 'IRRECEVABLE'
    | 'TRANSFERE'
    | 'EN_INVESTIGATION'
    | 'RAPPORT_PRODUIT'
    | 'DECISION_RENDUE'
    | 'CLOS'
    | 'CLASSE';

export type TypeSaisine =
    | 'COMPLAINT'
    | 'DENUNCIATION'
    | 'AUTO_REFERRAL'
    | 'ANONYMOUS';

export type SubmissionMode =
    | 'IN_PERSON'
    | 'AUDIO_COUNTER'
    | 'WEB_FORM'
    | 'PAPER_FORM'
    | 'EMAIL'
    | 'SMS'
    | 'PHONE'
    | 'GREEN_NUMBER'
    | 'SOCIAL_MEDIA'
    | 'PRESS_MEDIA'
    | 'AUDIT_REPORT'
    | 'POSTAL_MAIL';

export type TypeDeclarant =
    | 'CITIZEN'
    | 'COMPANY'
    | 'ASSOCIATION'
    | 'PUBLIC_AUTHORITY'
    | 'ANONYMOUS'
    | 'ASCE_SELF_REFERRAL';


export function isVersionConflict(err: any): boolean {
    return err?.status === 409;
}

export interface DeclarantResponse {
    id: string;
    typeDeclarant: TypeDeclarant;
    quality?: string;
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    commune?: string;
    province?: string;
    profession?: string;
    displayName: string;
    anonymous: boolean;
    protectionRequested: boolean;
    notificationsAccepted: boolean;
}

export interface AgentSummaryResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    matricule: string;
    departementLabel?: string;
}

export interface InvestigationSummaryResponse {
    id: string;
    status: string;
    startDate?: string;
    plannedEndDate?: string;
    extendedDeadline?: string;
    plannedDurationDays: number;
    remainingDays?: number;
    overdue: boolean;
    memberCount: number;
}

export interface NotificationResponse {
    id: string;
    type: string;
    channel: string;
    subject?: string;
    status: string;
    formReference?: string;
    scheduledAt?: string;
    sentAt?: string;
    overdue: boolean;
    retryCount: number;
}

export interface DossierResponse {
    id: string;
    number?: string;
    accessCode: string;
    version: number;
    status: DossierStatus;
    type: TypeSaisine;
    submissionMode: SubmissionMode;
    object: string;
    description?: string;
    incidentLocation?: string;
    incidentPeriod?: string;
    estimatedLoss?: number;
    isConfidential: boolean;
    receptionDate?: string;
    acknowledgmentDeadline?: string;
    additionalInfoDeadline?: string;
    eligibilityDecisionDate?: string;
    transferDate?: string;
    transferInstitution?: string;
    closingDate?: string;
    acknowledgmentOverdue: boolean;
    daysSinceReception: number;
    declarant?: DeclarantResponse;
    agentInCharge?: AgentSummaryResponse;
    notifications?: NotificationResponse[];
    investigation?: InvestigationSummaryResponse;
    createdAt: string;
    updatedAt?: string;
}

export interface DossierCreateRequest {
    type: TypeSaisine;
    submissionMode: SubmissionMode;
    object: string;
    description?: string;
    incidentLocation?: string;
    incidentPeriod?: string;
    estimatedLoss?: number;
    isConfidential?: boolean;
    declarantId?: string;
    declarantData?: DeclarantCreateRequest;
}

export interface DeclarantCreateRequest {
    typeDeclarant: TypeDeclarant;
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    commune?: string;
    province?: string;
    profession?: string;
    anonymous?: boolean;
    dataProcessingConsent?: boolean;
    notificationsAccepted?: boolean;
}


export interface StatusTransitionRequest {
    version: number;
    reason?: string;
    transferInstitution?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface StatistiqueResponse {
    totalDossiers:                 number;
    countByStatus:                 Record<string, number>;
    countBySubmissionMode:         Record<string, number>;
    countByType:                   Record<string, number>;
    admissibilityRate:             number;
    totalEstimatedLoss?:           number;
    avgRegistrationDelayDays?:     number;
    avgInvestigationDurationDays?: number;
    overdueAcknowledgments:        number;
    overdueInvestigations:         number;
    referredToJustice?:            number;
    period:                        string;
    generatedAt:                   string;
}
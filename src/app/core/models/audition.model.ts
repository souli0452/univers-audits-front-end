export type IntervieweeType = 'TARGETED_PARTY' | 'WITNESS' | 'DECLARANT';

export type AuditionStatus = 'SCHEDULED' | 'CONDUCTED' | 'CANCELLED' | 'NO_SHOW';

export interface AuditionResponse {
    id: string;
    investigationId: string;
    intervieweeType: IntervieweeType;
    intervieweeDisplayName?: string;
    investigatorNames: string[];
    location?: string;
    scheduledAt: string;
    conductedAt?: string;
    status: AuditionStatus;
    summary?: string;
    cancellationReason?: string;
    noShowNote?: string;
    orderWarning?: string;
    secondAuditionWarning?: string;
}

export interface AuditionScheduleRequest {
    intervieweeType: IntervieweeType;
    targetedPartyId?: string;
    witnessId?: string;
    scheduledAt: string;
    location?: string;
    investigatorIds: string[];
}

export interface AuditionConductRequest {
    summary: string;
}

export interface CorrectionPvAuditionResponse {
    id: string;
    versionNumber: number;
    content: string;
    correctedAt: string;
    correctedById: string;
    correctedByName?: string;
    motifCorrection: string;
}

export interface PvAuditionResponse {
    id: string;
    auditionId: string;
    content: string;
    draftedByName?: string;
    intervieweeSigned?: boolean;
    intervieweeSignatureRefused?: boolean;
    finalizedAt?: string;
    pvVersion: number;
    readBackAt?: string;
    corrections: CorrectionPvAuditionResponse[];
}

export interface PvAuditionCreateRequest {
    content: string;
}

export interface PvAuditionFinalizeRequest {
    intervieweeSigned: boolean;
    intervieweeSignatureRefused: boolean;
}

export interface PvAuditionCorrectionRequest {
    content: string;
    motifCorrection: string;
}

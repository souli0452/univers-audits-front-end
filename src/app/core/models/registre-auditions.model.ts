export type IntervieweeType = 'TARGETED_PARTY' | 'WITNESS' | 'DECLARANT';
export type AuditionStatus = 'SCHEDULED' | 'CONDUCTED' | 'CANCELLED' | 'NO_SHOW';
export type PvStatus = 'AUCUN_PV' | 'BROUILLON' | 'FINALISE';

export interface RegistreAuditionEntryResponse {
    auditionId: string;
    investigationId: string;
    dossierNumber: string;
    intervieweeType: IntervieweeType;
    intervieweeDisplayName: string;
    scheduledAt: string;
    status: AuditionStatus;
    pvStatus: PvStatus;
    pvVersion?: number;
}

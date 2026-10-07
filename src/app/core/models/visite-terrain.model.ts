export type VisiteStatus = 'SCHEDULED' | 'CONDUCTED' | 'CANCELLED' | 'CARENCE';

export interface VisiteTerrainResponse {
    id: string;
    investigationId: string;
    plannedByName?: string;
    location: string;
    scheduledAt: string;
    conductedAt?: string;
    status: VisiteStatus;
    summary?: string;
    cancellationReason?: string;
    carenceReason?: string;
}

export interface VisiteTerrainScheduleRequest {
    location: string;
    scheduledAt: string;
}

export interface VisiteTerrainConductRequest {
    summary: string;
}

export interface PvConstatResponse {
    id: string;
    visiteTerrainId: string;
    content: string;
    draftedByName?: string;
}

export interface PvConstatCreateRequest {
    content: string;
}

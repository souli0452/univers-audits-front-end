export interface RelanceSuitesResponse {
    id: string;
    relanceAt: string;
    agentNom?: string;
    contenu?: string;
}

export interface TransmissionAutoriteResponse {
    id: string;
    investigationId: string;
    autoriteDestinataire: string;
    transmittedAt: string;
    transmittedByNom?: string;
    relanceDueAt?: string;
    relanceOverdue?: boolean;
    relances: RelanceSuitesResponse[];
}

export interface TransmissionAutoriteRequest {
    autoriteDestinataire: string;
}

export interface RelanceSuitesRequest {
    contenu?: string;
}

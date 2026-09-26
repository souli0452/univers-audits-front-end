export interface RapportEnqueteResponse {
    id: string;
    investigationId: string;
    titre?: string;
    introduction?: string;
    methodologie?: string;
    informationsCollectees?: string;
    exposeFactuelAnomalies?: string;
    quantificationPrejudice?: string;
    reserves?: string;
    conclusions?: string;
    complet: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface RapportEnqueteRequest {
    titre?: string;
    introduction?: string;
    methodologie?: string;
    informationsCollectees?: string;
    exposeFactuelAnomalies?: string;
    quantificationPrejudice?: string;
    reserves?: string;
    conclusions?: string;
}

export interface NoteRecommandationsResponse {
    id: string;
    rapportEnqueteId: string;
    contenu?: string;
    complet: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface NoteRecommandationsRequest {
    contenu?: string;
}
